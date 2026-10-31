from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Field, Session, SQLModel, select

from app.core.database import get_session
from app.models.invoicing import Invoice, InvoiceStatus, Payment, PaymentMethod
from app.api.dashboard import get_current_simulated_date
from app.api.auth import get_current_user
from app.models.auth import User, UserRole


router = APIRouter(prefix="/api/payments", tags=["payments"])


class PaymentCreate(SQLModel):
    invoice_id: int
    amount: float = Field(gt=0)
    payment_method: PaymentMethod
    payment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None


@router.post("", response_model=Payment, status_code=201)
def record_payment(
    payload: PaymentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    invoice = session.get(Invoice, payload.invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role == UserRole.CUSTOMER and invoice.customer_id != current_user.id:
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
    raw_amount = Decimal(str(payload.amount))
    amount = raw_amount.quantize(Decimal("0.01"))
    if amount <= 0 or amount != raw_amount:
        session.rollback()
        raise HTTPException(status_code=422, detail="Payment amount must be at least 0.01 with no more than two decimal places")
    if paid + amount > total:
        session.rollback()
        raise HTTPException(status_code=422, detail="Payment exceeds the invoice balance")
    sim_date = get_current_simulated_date(session)
    if paid >= total:
        invoice.status = InvoiceStatus.PAID
    elif paid > 0:
        if invoice.due_date < sim_date:
            invoice.status = InvoiceStatus.OVERDUE
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
    session.add(invoice)
    session.commit()
    session.refresh(payment)
    return payment
