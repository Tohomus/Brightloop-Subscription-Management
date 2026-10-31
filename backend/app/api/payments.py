from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Field, Session, SQLModel, select

from app.core.database import get_session
from app.models.invoicing import Invoice, InvoiceStatus, Payment, PaymentMethod


router = APIRouter(prefix="/api/payments", tags=["payments"])


class PaymentCreate(SQLModel):
    invoice_id: int
    amount: float = Field(gt=0)
    payment_method: PaymentMethod
    payment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None


@router.post("", response_model=Payment, status_code=201)
def record_payment(payload: PaymentCreate, session: Session = Depends(get_session)):
    invoice = session.get(Invoice, payload.invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status not in {
        InvoiceStatus.CONFIRMED,
        InvoiceStatus.PARTIALLY_PAID,
        InvoiceStatus.OVERDUE,
    }:
        raise HTTPException(status_code=409, detail="Payments require a confirmed invoice")

    payment = Payment(**payload.model_dump())
    session.add(payment)
    session.flush()
    payments = session.exec(select(Payment.amount).where(Payment.invoice_id == invoice.id)).all()
    paid = sum((Decimal(str(amount)) for amount in payments), Decimal("0.00"))
    total = Decimal(str(invoice.total))
    if paid >= total:
        invoice.status = InvoiceStatus.PAID
    elif paid > 0:
        invoice.status = InvoiceStatus.PARTIALLY_PAID
    session.add(invoice)
    session.commit()
    session.refresh(payment)
    return payment
