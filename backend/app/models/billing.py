from datetime import date
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class SubscriptionStatus(str, Enum):
    DRAFT = "Draft"
    QUOTATION = "Quotation"
    CONFIRMED = "Confirmed"
    ACTIVE = "Active"
    PAUSED = "Paused"
    CLOSED = "Closed"


class TaxType(str, Enum):
    PERCENT = "percent"
    FIXED = "fixed"


class DiscountType(str, Enum):
    PERCENT = "percent"
    FIXED = "fixed"


class DiscountScope(str, Enum):
    PRODUCT = "product"
    SUBSCRIPTION = "subscription"


class SystemClock(SQLModel, table=True):
    __tablename__ = "system_clock"

    id: int = Field(default=1, primary_key=True)
    simulated_date: date = Field(default_factory=date.today)


class TaxRule(SQLModel, table=True):
    __tablename__ = "tax_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    tax_type: TaxType = Field(default=TaxType.PERCENT)
    amount: float = Field(ge=0)
    price_included: bool = Field(default=False)
    is_active: bool = Field(default=True, index=True)


class DiscountRule(SQLModel, table=True):
    __tablename__ = "discount_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    discount_type: DiscountType = Field(default=DiscountType.PERCENT)
    scope: DiscountScope = Field(default=DiscountScope.SUBSCRIPTION)
    amount: float = Field(ge=0)
    product_id: Optional[int] = Field(default=None, foreign_key="products.id", index=True)
    min_purchase_amount: float = Field(default=0.0, ge=0)
    min_quantity: int = Field(default=0, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_uses: Optional[int] = Field(default=None, ge=0)
    uses: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True, index=True)


class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"

    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_number: str = Field(unique=True, index=True)
    customer_id: int = Field(foreign_key="users.id", index=True)
    plan_id: int = Field(foreign_key="plans.id", index=True)
    status: SubscriptionStatus = Field(default=SubscriptionStatus.DRAFT, index=True)
    start_date: date
    expiry_date: Optional[date] = None
    next_billing_date: date
    billing_anchor_day: int = Field(ge=1, le=31)
    lines: List["SubscriptionLine"] = Relationship(back_populates="subscription", cascade_delete=True)


class SubscriptionLine(SQLModel, table=True):
    __tablename__ = "subscription_lines"

    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscriptions.id", index=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    variant_id: Optional[int] = Field(default=None, foreign_key="product_variants.id")
    tax_rule_id: Optional[int] = Field(default=None, foreign_key="tax_rules.id")
    discount_rule_id: Optional[int] = Field(default=None, foreign_key="discount_rules.id")
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(ge=0)

    subscription: Optional[Subscription] = Relationship(back_populates="lines")


class SubscriptionStatusUpdate(SQLModel):
    status: SubscriptionStatus
