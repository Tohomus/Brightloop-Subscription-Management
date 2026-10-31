from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.billing import DiscountRule
from app.models.invoicing import Invoice, InvoiceDiscountUse, InvoiceStatus


router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.get("", response_model=list[Invoice])
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
    return session.exec(query.order_by(Invoice.invoice_date.desc(), Invoice.id.desc())).all()


@router.post("/{invoice_id}/confirm", response_model=Invoice)
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
    return invoice


@router.post("/{invoice_id}/cancel", response_model=Invoice)
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
    return invoice
