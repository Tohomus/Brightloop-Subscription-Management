import calendar
from datetime import date, timedelta
from sqlmodel import Session, select

from app.models.billing import Subscription, SubscriptionStatus
from app.models.catalog import BillingFrequency, Plan, Product
from app.models.invoicing import Invoice, InvoiceDiscountUse, InvoiceLine, InvoiceStatus
from app.services.tax_discount_calc import calculate_lines


def _advance(value: date, frequency: BillingFrequency) -> date:
    if frequency == BillingFrequency.DAILY:
        return value + timedelta(days=1)
    if frequency == BillingFrequency.WEEKLY:
        return value + timedelta(days=7)
    if frequency == BillingFrequency.MONTHLY:
        month_index = value.year * 12 + value.month
        year, month = divmod(month_index, 12)
        month += 1
        return value.replace(year=year, month=month, day=min(value.day, calendar.monthrange(year, month)[1]))
    if frequency == BillingFrequency.YEARLY:
        return value.replace(year=value.year + 1, day=min(value.day, calendar.monthrange(value.year + 1, value.month)[1]))
    raise ValueError(f"Unsupported billing frequency: {frequency}")


def run_billing(session: Session, simulated_date: date) -> dict[str, int]:
    subscriptions = session.exec(
        select(Subscription)
        .where(Subscription.status == SubscriptionStatus.ACTIVE)
        .where(Subscription.next_billing_date <= simulated_date)
        .order_by(Subscription.id)
    ).all()
    evaluated = len(subscriptions)
    generated = 0
    skipped = 0

    for subscription in subscriptions:
        plan = session.get(Plan, subscription.plan_id)
        if plan is None:
            skipped += 1
            continue

        while subscription.next_billing_date <= simulated_date:
            cycle_start = subscription.next_billing_date
            cycle_end = _advance(cycle_start, plan.frequency) - timedelta(days=1)
            if plan.end_date is not None and cycle_start > plan.end_date:
                if plan.auto_close_on_end:
                    subscription.status = SubscriptionStatus.CLOSED
                    session.add(subscription)
                break

            if subscription.expiry_date is not None and cycle_start > subscription.expiry_date:
                subscription.status = SubscriptionStatus.CLOSED
                session.add(subscription)
                break

            key = f"{subscription.id}_{cycle_start.isoformat()}"
            existing = session.exec(select(Invoice.id).where(Invoice.idempotency_key == key)).first()
            next_billing_date = _advance(cycle_start, plan.frequency)
            if existing is not None:
                skipped += 1
                subscription.next_billing_date = next_billing_date
                continue

            calculated, subtotal, discounts, taxes, total, discount_rule_ids = calculate_lines(
                session, subscription.lines, cycle_start
            )
            invoice_lines = []
            for line, amounts in zip(subscription.lines, calculated):
                product = session.get(Product, line.product_id)
                invoice_lines.append(InvoiceLine(
                    description=product.name if product else "Subscription item",
                    **amounts,
                ))

            invoice = Invoice(
                invoice_number="pending",
                subscription_id=subscription.id,
                customer_id=subscription.customer_id,
                status=InvoiceStatus.DRAFT,
                period_start=cycle_start,
                period_end=cycle_end,
                invoice_date=simulated_date,
                due_date=simulated_date + timedelta(days=14),
                idempotency_key=key,
                subtotal=float(subtotal),
                discount_total=float(discounts),
                tax_total=float(taxes),
                total=float(total),
                lines=invoice_lines,
            )
            session.add(invoice)
            session.flush()
            invoice.invoice_number = f"INV-{simulated_date.year}-{invoice.id:04d}"
            for rule_id in discount_rule_ids:
                session.add(InvoiceDiscountUse(invoice_id=invoice.id, discount_rule_id=rule_id))
            subscription.next_billing_date = next_billing_date
            generated += 1

        session.add(subscription)

    session.commit()
    return {"evaluated": evaluated, "generated": generated, "skipped": skipped}
