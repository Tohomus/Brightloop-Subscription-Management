from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, SQLModel, select, func
from sqlalchemy import or_, update

from app.core.database import get_session
from app.models.billing import DiscountRule, Subscription
from app.models.invoicing import Invoice, InvoiceDiscountUse, InvoiceLine, InvoiceStatus, Payment
from app.models.auth import User
from app.api.dashboard import get_current_simulated_date
from app.api.auth import get_current_user, require_roles
from app.models.auth import UserRole
from app.models.billing import TaxRule


router = APIRouter(prefix="/api/invoices", tags=["invoices"])


class InvoiceLineResponse(SQLModel):
    id: Optional[int] = None
    product_id: int
    description: str
    quantity: int
    unit_price: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    line_total: float


class InvoiceResponse(SQLModel):
    id: int
    invoice_number: str
    subscription_id: int
    subscription_number: str
    customer_id: int
    customer_name: str
    billing_cycle_key: str
    period_start: date
    period_end: date
    issue_date: date
    due_date: date
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    amount_paid: float
    status: InvoiceStatus
    lines: list[InvoiceLineResponse] = []


def serialize_invoice(invoice: Invoice, session: Session, related: Optional[dict] = None) -> InvoiceResponse:
    if related is None:
        customer = session.get(User, invoice.customer_id)
        sub = session.get(Subscription, invoice.subscription_id)
        payments = session.exec(select(Payment.amount).where(Payment.invoice_id == invoice.id)).all()
        amount_paid = float(sum((Decimal(str(a)) for a in payments), Decimal("0.00"))) if payments else 0.0
        lines = invoice.lines
    else:
        customer = related["customers"].get(invoice.customer_id)
        sub = related["subscriptions"].get(invoice.subscription_id)
        amount_paid = float(Decimal(str(related["payments"].get(invoice.id, 0) or 0)).quantize(Decimal("0.01")))
        lines = related["lines"].get(invoice.id, [])

    lines_resp: list[InvoiceLineResponse] = []
    for line in lines:
        is_price_inc = getattr(line, "price_included", False)
        exclusive_tax = Decimal("0.00") if is_price_inc else Decimal(str(line.tax_amount))
        line_total = float(Decimal(str(line.line_subtotal)) - Decimal(str(line.discount_amount)) + exclusive_tax)
        tax_rate = 0.0
        tax_rule_id = getattr(line, "tax_rule_id", None)
        if tax_rule_id:
            tr = related["taxes"].get(tax_rule_id) if related is not None else session.get(TaxRule, tax_rule_id)
            if tr:
                tax_rate = tr.amount
        lines_resp.append(
            InvoiceLineResponse(
                id=line.id,
                product_id=line.product_id,
                description=line.description,
                quantity=line.quantity,
                unit_price=line.unit_price,
                tax_rate=tax_rate,
                tax_amount=line.tax_amount,
                discount_amount=line.discount_amount,
                line_total=line_total,
            )
        )

    c_name = customer.email.split("@")[0] if customer else f"Customer #{invoice.customer_id}"
    sub_num = sub.subscription_number if sub else f"SUB-{invoice.subscription_id}"

    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        subscription_id=invoice.subscription_id,
        subscription_number=sub_num,
        customer_id=invoice.customer_id,
        customer_name=c_name,
        billing_cycle_key=invoice.idempotency_key,
        period_start=invoice.period_start,
        period_end=invoice.period_end,
        issue_date=invoice.invoice_date,
        due_date=invoice.due_date,
        subtotal=invoice.subtotal,
        tax_amount=invoice.tax_total,
        discount_amount=invoice.discount_total,
        total_amount=invoice.total,
        amount_paid=amount_paid,
        status=invoice.status,
        lines=lines_resp,
    )


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    customer_id: Optional[int] = None,
    status: Optional[InvoiceStatus] = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    sim_date = get_current_simulated_date(session)
    expiration_update = session.exec(
        update(Invoice)
        .where(Invoice.status.in_([InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID]))
        .where(Invoice.due_date < sim_date)
        .values(status=InvoiceStatus.OVERDUE)
    )
    if expiration_update.rowcount:
        session.commit()

    query = select(Invoice)
    if current_user.role == UserRole.CUSTOMER:
        if customer_id is not None and customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Customers can only view their own invoices")
        query = query.where(Invoice.customer_id == current_user.id)
    elif customer_id is not None:
        query = query.where(Invoice.customer_id == customer_id)
    if status is not None:
        query = query.where(Invoice.status == status)
    invoices = session.exec(query.order_by(Invoice.invoice_date.desc(), Invoice.id.desc()).offset(offset).limit(limit)).all()
    invoice_ids = [invoice.id for invoice in invoices]
    if not invoice_ids:
        return []

    customers = session.exec(select(User).where(User.id.in_({invoice.customer_id for invoice in invoices}))).all()
    subscriptions = session.exec(select(Subscription).where(Subscription.id.in_({invoice.subscription_id for invoice in invoices}))).all()
    lines = session.exec(select(InvoiceLine).where(InvoiceLine.invoice_id.in_(invoice_ids))).all()
    payments = dict(session.exec(
        select(Payment.invoice_id, func.round(func.sum(Payment.amount), 2))
        .where(Payment.invoice_id.in_(invoice_ids))
        .group_by(Payment.invoice_id)
    ).all())
    lines_by_invoice: dict[int, list[InvoiceLine]] = {}
    for line in lines:
        lines_by_invoice.setdefault(line.invoice_id, []).append(line)
    tax_ids = {line.tax_rule_id for line in lines if line.tax_rule_id is not None}
    taxes = session.exec(select(TaxRule).where(TaxRule.id.in_(tax_ids))).all() if tax_ids else []
    related = {
        "customers": {customer.id: customer for customer in customers},
        "subscriptions": {sub.id: sub for sub in subscriptions},
        "payments": payments,
        "lines": lines_by_invoice,
        "taxes": {tax.id: tax for tax in taxes},
    }
    return [serialize_invoice(inv, session, related) for inv in invoices]


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    invoice = session.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role == UserRole.CUSTOMER and invoice.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Invoice not found")
    sim_date = get_current_simulated_date(session)
    if invoice.status in [InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID] and invoice.due_date < sim_date:
        invoice.status = InvoiceStatus.OVERDUE
        session.add(invoice)
        session.commit()
        session.refresh(invoice)
    return serialize_invoice(invoice, session)


@router.post("/{invoice_id}/confirm", response_model=InvoiceResponse)
def confirm_invoice(
    invoice_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_roles(UserRole.ADMIN, UserRole.STAFF)),
):
    invoice = session.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=409, detail="Only draft invoices can be confirmed")

    uses = session.exec(select(InvoiceDiscountUse).where(InvoiceDiscountUse.invoice_id == invoice.id)).all()
    for rule_id in {use.discount_rule_id for use in uses}:
        result = session.exec(
            update(DiscountRule)
            .where(DiscountRule.id == rule_id)
            .where(or_(DiscountRule.max_uses.is_(None), DiscountRule.uses < DiscountRule.max_uses))
            .values(uses=DiscountRule.uses + 1)
        )
        if result.rowcount != 1:
            session.rollback()
            raise HTTPException(status_code=409, detail="A discount on this invoice has reached its usage limit")

    invoice.status = InvoiceStatus.PAID if Decimal(str(invoice.total)) == Decimal("0.00") else InvoiceStatus.CONFIRMED
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return serialize_invoice(invoice, session)


@router.post("/{invoice_id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(
    invoice_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_roles(UserRole.ADMIN, UserRole.STAFF)),
):
    invoice = session.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status not in {InvoiceStatus.DRAFT, InvoiceStatus.CONFIRMED}:
        raise HTTPException(status_code=409, detail="Only draft or confirmed invoices can be cancelled")

    payments = session.exec(select(Payment.id).where(Payment.invoice_id == invoice.id)).first()
    if payments is not None:
        raise HTTPException(status_code=409, detail="Cannot cancel an invoice with recorded payments")

    # Release any reserved discount uses
    uses = session.exec(
        select(InvoiceDiscountUse).where(InvoiceDiscountUse.invoice_id == invoice.id)
    ).all()
    for use in uses:
        rule = session.get(DiscountRule, use.discount_rule_id)
        if invoice.status == InvoiceStatus.CONFIRMED and rule and rule.uses > 0:
            rule.uses -= 1
            session.add(rule)

    invoice.status = InvoiceStatus.CANCELLED
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return serialize_invoice(invoice, session)

