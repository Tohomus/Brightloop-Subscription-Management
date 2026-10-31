from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Field, Session, SQLModel, select

from app.core.database import get_session
from app.models.billing import (
    DiscountRule,
    Subscription,
    SubscriptionLine,
    SubscriptionStatus,
    SubscriptionStatusUpdate,
    TaxRule,
)
from app.models.catalog import Plan, Product, ProductVariant
from app.models.auth import User


router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

ALLOWED_TRANSITIONS = {
    SubscriptionStatus.DRAFT: {SubscriptionStatus.QUOTATION},
    SubscriptionStatus.QUOTATION: {SubscriptionStatus.CONFIRMED},
    SubscriptionStatus.CONFIRMED: {SubscriptionStatus.ACTIVE},
    SubscriptionStatus.ACTIVE: {SubscriptionStatus.PAUSED, SubscriptionStatus.CLOSED},
    SubscriptionStatus.PAUSED: {SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED},
    SubscriptionStatus.CLOSED: set(),
}


class SubscriptionCreate(SQLModel):
    customer_id: int
    plan_id: int
    start_date: date
    next_billing_date: date
    lines: list["SubscriptionLineCreate"] = Field(min_length=1)


class SubscriptionLineCreate(SQLModel):
    product_id: int
    variant_id: Optional[int] = None
    tax_rule_id: Optional[int] = None
    discount_rule_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(ge=0)


@router.post("", response_model=Subscription)
def create_subscription(payload: SubscriptionCreate, session: Session = Depends(get_session)):
    customer = session.get(User, payload.customer_id)
    plan = session.get(Plan, payload.plan_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    lines = []
    for line in payload.lines:
        product = session.get(Product, line.product_id)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {line.product_id} not found")
        if line.variant_id is not None:
            variant = session.get(ProductVariant, line.variant_id)
            if variant is None or variant.product_id != line.product_id:
                raise HTTPException(status_code=422, detail="Variant does not belong to the selected product")
        if line.tax_rule_id is not None and session.get(TaxRule, line.tax_rule_id) is None:
            raise HTTPException(status_code=404, detail=f"Tax rule {line.tax_rule_id} not found")
        if line.discount_rule_id is not None:
            discount = session.get(DiscountRule, line.discount_rule_id)
            if discount is None:
                raise HTTPException(status_code=404, detail=f"Discount rule {line.discount_rule_id} not found")
            if discount.product_id is not None and discount.product_id != line.product_id:
                raise HTTPException(status_code=422, detail="Discount does not apply to the selected product")
        lines.append(SubscriptionLine(**line.model_dump()))

    subscription = Subscription(
        subscription_number="pending",
        customer_id=payload.customer_id,
        plan_id=payload.plan_id,
        start_date=payload.start_date,
        next_billing_date=payload.next_billing_date,
        status=SubscriptionStatus.DRAFT,
        lines=lines,
    )
    session.add(subscription)
    session.flush()
    subscription.subscription_number = f"SUB-{date.today().year}-{subscription.id:04d}"
    session.commit()
    session.refresh(subscription)
    return subscription


@router.get("", response_model=list[Subscription])
def list_subscriptions(
    status: Optional[SubscriptionStatus] = None,
    customer_id: Optional[int] = None,
    session: Session = Depends(get_session),
):
    query = select(Subscription)
    if status is not None:
        query = query.where(Subscription.status == status)
    if customer_id is not None:
        query = query.where(Subscription.customer_id == customer_id)
    return session.exec(query).all()


@router.patch("/{subscription_id}/status", response_model=Subscription)
def update_subscription_status(
    subscription_id: int,
    payload: SubscriptionStatusUpdate,
    session: Session = Depends(get_session),
):
    subscription = session.get(Subscription, subscription_id)
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if payload.status not in ALLOWED_TRANSITIONS[subscription.status]:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot transition from {subscription.status.value} to {payload.status.value}",
        )
    subscription.status = payload.status
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    return subscription


@router.post("/{subscription_id}/confirm", response_model=Subscription)
def confirm_quotation(subscription_id: int, session: Session = Depends(get_session)):
    subscription = session.get(Subscription, subscription_id)
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if subscription.status != SubscriptionStatus.QUOTATION:
        raise HTTPException(status_code=409, detail="Only quotations can be confirmed")
    plan = session.get(Plan, subscription.plan_id)
    if plan is None:
        raise HTTPException(status_code=409, detail="Subscription plan no longer exists")
    if sum(line.quantity for line in subscription.lines) < plan.min_quantity:
        raise HTTPException(status_code=422, detail="Subscription is below the plan minimum quantity")
    subscription.status = SubscriptionStatus.ACTIVE
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    return subscription
