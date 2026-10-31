from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, SQLModel, select

from app.core.database import get_session
from app.models.billing import DiscountRule, Subscription
from app.models.invoicing import Invoice, InvoiceDiscountUse, InvoiceStatus, Payment
from app.models.auth import User


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


def serialize_invoice(invoice: Invoice, session: Session) -> InvoiceResponse:
    customer = session.get(User, invoice.customer_id)
    sub = session.get(Subscription, invoice.subscription_id)
    payments = session.exec(select(Payment.amount).where(Payment.invoice_id == invoice.id)).all()
    amount_paid = float(sum((Decimal(str(a)) for a in payments), Decimal("0.00"))) if payments else 0.0

    lines_resp: list[InvoiceLineResponse] = []
    for line in invoice.lines:
        line_total = float(Decimal(str(line.line_subtotal)) + Decimal(str(line.tax_amount)) - Decimal(str(line.discount_amount)))
        lines_resp.append(
            InvoiceLineResponse(
                id=line.id,
                product_id=line.product_id,
                description=line.description,
                quantity=line.quantity,
                unit_price=line.unit_price,
                tax_rate=0.0,
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
    session: Session = Depends(get_session),
):
    expired = session.exec(
        select(Invoice)
        .where(Invoice.status == InvoiceStatus.CONFIRMED)
        .where(Invoice.due_date < date.today())
    ).all()
    for invoice in expired:
        invoice.status = InvoiceStatus.OVERDUE
        session.add(invoice)
    if expired:
        session.commit()

    query = select(Invoice)
    if customer_id is not None:
        query = query.where(Invoice.customer_id == customer_id)
    if status is not None:
        query = query.where(Invoice.status == status)
    invoices = session.exec(query.order_by(Invoice.invoice_date.desc(), Invoice.id.desc())).all()
    return [serialize_invoice(inv, session) for inv in invoices]


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, session: Session = Depends(get_session)):
    invoice = session.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return serialize_invoice(invoice, session)


@router.post("/{invoice_id}/confirm", response_model=InvoiceResponse)
def confirm_invoice(invoice_id: int, session: Session = Depends(get_session)):
    invoice = session.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=409, detail="Only draft invoices can be confirmed")

    uses = session.exec(
        select(InvoiceDiscountUse).where(InvoiceDiscountUse.invoice_id == invoice.id)
    ).all()
    rules = []
    for use in uses:
        rule = session.get(DiscountRule, use.discount_rule_id)
        if (
            rule is None
            or not rule.is_active
            or (rule.start_date is not None and rule.start_date > date.today())
            or (rule.end_date is not None and rule.end_date < date.today())
            or (
            rule.max_uses is not None and rule.uses >= rule.max_uses
            )
        ):
            raise HTTPException(status_code=409, detail="An applied discount is no longer available")
        rules.append(rule)
    for rule in rules:
        rule.uses += 1
        session.add(rule)
    invoice.status = InvoiceStatus.CONFIRMED
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return serialize_invoice(invoice, session)


@router.post("/{invoice_id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(invoice_id: int, session: Session = Depends(get_session)):
    invoice = session.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=409, detail="Only draft invoices can be cancelled")
    invoice.status = InvoiceStatus.CANCELLED
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return serialize_invoice(invoice, session)

