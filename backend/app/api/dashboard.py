from datetime import date, timedelta
from typing import Optional, Dict, Any, Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select, func
from decimal import Decimal

from app.core.database import get_session, engine
from app.models.billing import Subscription, SubscriptionStatus, SubscriptionLine, SystemClock
from app.models.catalog import Plan, BillingFrequency
from app.models.invoicing import Invoice, InvoiceStatus, Payment
from app.services.billing_runner import run_billing
from app.api.auth import require_roles
from app.models.auth import UserRole


router = APIRouter(prefix="/api", tags=["dashboard", "simulation"])


class TimeTravelRequest(BaseModel):
    advance_days: Literal[1, 7, 30] = 1


def get_current_simulated_date(session: Optional[Session] = None) -> date:
    if session is not None:
        clock = session.get(SystemClock, 1)
        return clock.simulated_date if clock else date.today()
    with Session(engine) as db_session:
        clock = db_session.get(SystemClock, 1)
        return clock.simulated_date if clock else date.today()


def set_current_simulated_date(new_date: date, session: Optional[Session] = None) -> date:
    def persist(db_session: Session) -> date:
        clock = db_session.get(SystemClock, 1)
        if clock is None:
            clock = SystemClock(id=1, simulated_date=new_date)
        else:
            clock.simulated_date = new_date
        db_session.add(clock)
        db_session.commit()
        return clock.simulated_date

    if session is not None:
        return persist(session)
    with Session(engine) as db_session:
        return persist(db_session)


@router.get("/dashboard/summary")
def get_dashboard_summary(
    session: Session = Depends(get_session),
    _user=Depends(require_roles(UserRole.ADMIN, UserRole.STAFF)),
) -> Dict[str, Any]:
    """
    Executive Finance Dashboard Aggregation (< 2s SLA).
    Computes real metrics from SQLite tables:
    - Active Subscriptions Count
    - MRR (normalized to monthly based on plan frequency)
    - ARR (MRR * 12)
    - Total Collected Revenue (from Payment table)
    - Outstanding Receivables (unpaid balances on confirmed/overdue invoices)
    - Overdue Invoices Count & Aging Buckets (1-30d, 31-60d, 60+d)
    """
    sim_date = get_current_simulated_date(session)

    # 1. Active Subscriptions Count & MRR Calculation
    active_subscriptions_count = session.exec(
        select(func.count()).select_from(Subscription).where(Subscription.status == SubscriptionStatus.ACTIVE)
    ).one()

    total_mrr = Decimal("0.00")
    plan_totals = session.exec(
        select(Subscription.plan_id, func.sum(SubscriptionLine.unit_price * SubscriptionLine.quantity))
        .join(SubscriptionLine, SubscriptionLine.subscription_id == Subscription.id)
        .where(Subscription.status == SubscriptionStatus.ACTIVE)
        .group_by(Subscription.plan_id)
    ).all()
    for plan_id, amount in plan_totals:
        plan = session.get(Plan, plan_id)
        cycle_amount = Decimal(str(amount or 0))
        if plan and plan.frequency == BillingFrequency.DAILY:
            total_mrr += cycle_amount * Decimal("30")
        elif plan and plan.frequency == BillingFrequency.WEEKLY:
            total_mrr += cycle_amount * Decimal("52") / Decimal("12")
        elif plan and plan.frequency == BillingFrequency.YEARLY:
            total_mrr += cycle_amount / Decimal("12")
        else:
            total_mrr += cycle_amount

    total_arr = total_mrr * Decimal("12")

    # 2. Total Collected Revenue from Payments
    total_revenue_collected = Decimal(str(session.exec(select(func.coalesce(func.sum(Payment.amount), 0))).one()))

    # 3. Invoices Status & Receivables Reconciliation
    # First update expired invoices based on current simulated date
    expired_invoices = session.exec(
        select(Invoice)
        .where(Invoice.status.in_([InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID]))
        .where(Invoice.due_date < sim_date)
    ).all()
    for inv in expired_invoices:
        inv.status = InvoiceStatus.OVERDUE
        session.add(inv)
    if expired_invoices:
        session.commit()

    # Query all non-draft, non-cancelled invoices
    billable_invoices = session.exec(
        select(Invoice).where(
            Invoice.status.in_([
                InvoiceStatus.CONFIRMED,
                InvoiceStatus.PARTIALLY_PAID,
                InvoiceStatus.OVERDUE,
                InvoiceStatus.PAID
            ])
        )
    ).all()

    outstanding_receivables = Decimal("0.00")
    overdue_count = 0
    aging_1_30 = Decimal("0.00")
    aging_31_60 = Decimal("0.00")
    aging_60_plus = Decimal("0.00")

    payments_by_invoice = dict(session.exec(
        select(Payment.invoice_id, func.sum(Payment.amount)).group_by(Payment.invoice_id)
    ).all())
    for inv in billable_invoices:
        paid_for_inv = Decimal(str(payments_by_invoice.get(inv.id, 0) or 0))
        inv_total = Decimal(str(inv.total))
        balance = max(Decimal("0.00"), inv_total - paid_for_inv)

        if inv.status in [InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]:
            outstanding_receivables += balance

        if inv.status == InvoiceStatus.OVERDUE and balance > 0:
            overdue_count += 1
            days_overdue = (sim_date - inv.due_date).days
            if days_overdue <= 30:
                aging_1_30 += balance
            elif days_overdue <= 60:
                aging_31_60 += balance
            else:
                aging_60_plus += balance

    return {
        "simulated_date": sim_date.isoformat(),
        "active_subscriptions_count": active_subscriptions_count,
        "mrr": float(round(total_mrr, 2)),
        "arr": float(round(total_arr, 2)),
        "total_revenue_collected": float(round(total_revenue_collected, 2)),
        "outstanding_receivables": float(round(outstanding_receivables, 2)),
        "overdue_invoices_count": overdue_count,
        "overdue_aging": {
            "1_to_30_days": float(round(aging_1_30, 2)),
            "31_to_60_days": float(round(aging_31_60, 2)),
            "60_plus_days": float(round(aging_60_plus, 2)),
        },
    }


@router.post("/simulation/time-travel")
def time_travel(
    payload: TimeTravelRequest,
    session: Session = Depends(get_session),
    _user=Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """
    Hackathon Edge Chrono-Simulator:
    Advances the simulated system clock, automatically executes the billing engine,
    re-evaluates invoice overdue aging, and returns updated metrics in real-time.
    """
    advance_days = payload.advance_days
    current_date = get_current_simulated_date(session)
    target_date = current_date + timedelta(days=advance_days)

    # 1. Run billing runner up to target date
    billing_result = run_billing(session, target_date)

    # 2. Update overdue invoices
    expired_invoices = session.exec(
        select(Invoice)
        .where(Invoice.status.in_([InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID]))
        .where(Invoice.due_date < target_date)
    ).all()
    for inv in expired_invoices:
        inv.status = InvoiceStatus.OVERDUE
        session.add(inv)
    session.commit()

    set_current_simulated_date(target_date, session)

    # 3. Retrieve updated summary
    summary = get_dashboard_summary(session)

    return {
        "success": True,
        "simulated_date": target_date.isoformat(),
        "advance_days": advance_days,
        "billing_result": billing_result,
        "summary": summary,
    }
