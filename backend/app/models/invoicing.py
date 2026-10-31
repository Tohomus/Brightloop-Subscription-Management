from datetime import date
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class InvoiceStatus(str, Enum):
    DRAFT = "Draft"
    CONFIRMED = "Confirmed"
    PARTIALLY_PAID = "Partially Paid"
    PAID = "Paid"
    OVERDUE = "Overdue"
    CANCELLED = "Cancelled"


class PaymentMethod(str, Enum):
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    UPI = "upi"
    CASH = "cash"


class Invoice(SQLModel, table=True):
    __tablename__ = "invoices"

    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_number: str = Field(unique=True, index=True)
    subscription_id: int = Field(foreign_key="subscriptions.id", index=True)
    customer_id: int = Field(foreign_key="users.id", index=True)
    status: InvoiceStatus = Field(default=InvoiceStatus.DRAFT, index=True)
    period_start: date
    period_end: date
    invoice_date: date = Field(default_factory=date.today)
    due_date: date
    idempotency_key: str = Field(unique=True, index=True)
    subtotal: float = Field(default=0.0, ge=0)
    discount_total: float = Field(default=0.0, ge=0)
    tax_total: float = Field(default=0.0, ge=0)
    total: float = Field(default=0.0, ge=0)
    lines: List["InvoiceLine"] = Relationship(back_populates="invoice", cascade_delete=True)


class InvoiceLine(SQLModel, table=True):
    __tablename__ = "invoice_lines"

    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoices.id", index=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    description: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    line_subtotal: float = Field(ge=0)
    tax_amount: float = Field(default=0.0, ge=0)
    discount_amount: float = Field(default=0.0, ge=0)
    discount_rule_id: Optional[int] = Field(default=None, foreign_key="discount_rules.id")
    tax_rule_id: Optional[int] = Field(default=None, foreign_key="tax_rules.id")
    price_included: bool = Field(default=False)
    invoice: Optional[Invoice] = Relationship(back_populates="lines")


class InvoiceDiscountUse(SQLModel, table=True):
    __tablename__ = "invoice_discount_uses"

    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoices.id", index=True)
    discount_rule_id: int = Field(foreign_key="discount_rules.id", index=True)


class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoices.id", index=True)
    amount: float = Field(gt=0)
    payment_method: PaymentMethod
    payment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None
