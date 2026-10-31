from datetime import date, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from decimal import Decimal

from app.core.database import get_session
from app.models.billing import Subscription, SubscriptionStatus, SubscriptionLine
from app.models.catalog import Plan, BillingFrequency
from app.models.invoicing import Invoice, InvoiceStatus, Payment
from app.services.billing_runner import run_billing


router = APIRouter(prefix="/api", tags=["dashboard", "simulation"])


# In-memory / module-level system simulated date tracker
_system_simulated_date: date = date.today()


def get_current_simulated_date() -> date:
    global _system_simulated_date
    return _system_simulated_date


def set_current_simulated_date(new_date: date) -> date:
    global _system_simulated_date
    _system_simulated_date = new_date
    return _system_simulated_date


@router.get("/dashboard/summary")
def get_dashboard_summary(session: Session = Depends(get_session)) -> Dict[str, Any]:
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
    sim_date = get_current_simulated_date()

    # 1. Active Subscriptions Count & MRR Calculation
    active_subs = session.exec(
        select(Subscription).where(Subscription.status == SubscriptionStatus.ACTIVE)
    ).all()
    active_subscriptions_count = len(active_subs)

    total_mrr = Decimal("0.00")
    for sub in active_subs:
        plan = session.get(Plan, sub.plan_id)
        # Sum lines for this subscription
        lines = session.exec(
            select(SubscriptionLine).where(SubscriptionLine.subscription_id == sub.id)
        ).all()
        sub_cycle_amount = sum(
            (Decimal(str(line.unit_price)) * Decimal(str(line.quantity)) for line in lines),
            Decimal("0.00")
        )

        # Normalize to monthly
        if plan:
            if plan.frequency == BillingFrequency.DAILY:
                sub_mrr = sub_cycle_amount * Decimal("30")
            elif plan.frequency == BillingFrequency.WEEKLY:
                sub_mrr = (sub_cycle_amount * Decimal("52")) / Decimal("12")
            elif plan.frequency == BillingFrequency.YEARLY:
                sub_mrr = sub_cycle_amount / Decimal("12")
            else:  # MONTHLY
                sub_mrr = sub_cycle_amount
        else:
            sub_mrr = sub_cycle_amount

        total_mrr += sub_mrr

    total_arr = total_mrr * Decimal("12")

    # 2. Total Collected Revenue from Payments
    payments = session.exec(select(Payment.amount)).all()
    total_revenue_collected = sum((Decimal(str(amt)) for amt in payments), Decimal("0.00"))

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

    for inv in billable_invoices:
        # Calculate amount paid on this invoice
        inv_payments = session.exec(
            select(Payment.amount).where(Payment.invoice_id == inv.id)
        ).all()
        paid_for_inv = sum((Decimal(str(p)) for p in inv_payments), Decimal("0.00"))
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
    payload: Dict[str, Any],
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Hackathon Edge Chrono-Simulator:
    Advances the simulated system clock, automatically executes the billing engine,
    re-evaluates invoice overdue aging, and returns updated metrics in real-time.
    """
    advance_days = int(payload.get("advance_days", 1))
    explicit_date = payload.get("simulated_date")

    if explicit_date:
        target_date = date.fromisoformat(explicit_date)
    else:
        current_date = get_current_simulated_date()
        target_date = current_date + timedelta(days=advance_days)

    set_current_simulated_date(target_date)

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

    # 3. Retrieve updated summary
    summary = get_dashboard_summary(session)

    return {
        "success": True,
        "simulated_date": target_date.isoformat(),
        "advance_days": advance_days,
        "billing_result": billing_result,
        "summary": summary,
    }
