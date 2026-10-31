from datetime import date
from typing import Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
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
from app.models.auth import User, UserRole


router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])
quotations_router = APIRouter(prefix="/api/quotations", tags=["quotations"])

ALLOWED_TRANSITIONS = {
    SubscriptionStatus.DRAFT: {SubscriptionStatus.QUOTATION, SubscriptionStatus.CLOSED},
    SubscriptionStatus.QUOTATION: {SubscriptionStatus.CONFIRMED, SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED},
    SubscriptionStatus.CONFIRMED: {SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED},
    SubscriptionStatus.ACTIVE: {SubscriptionStatus.PAUSED, SubscriptionStatus.CLOSED},
    SubscriptionStatus.PAUSED: {SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED},
    SubscriptionStatus.CLOSED: set(),
}


class SubscriptionLineCreate(SQLModel):
    product_id: int
    variant_id: Optional[int] = None
    tax_rule_id: Optional[int] = None
    discount_rule_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(ge=0)


class SubscriptionCreate(SQLModel):
    customer_id: int
    plan_id: int
    start_date: date
    next_billing_date: date
    lines: list[SubscriptionLineCreate] = Field(min_length=1)


class SubscriptionLineResponse(SQLModel):
    id: Optional[int] = None
    product_id: int
    product_name: str
    variant_name: Optional[str] = ""
    quantity: int
    unit_price: float
    line_amount: float
    tax_rule_id: Optional[int] = None
    discount_rule_id: Optional[int] = None


class SubscriptionResponse(SQLModel):
    id: int
    subscription_number: str
    customer_id: int
    customer_name: str
    customer_email: str
    plan_id: int
    plan_name: str
    frequency: str
    status: SubscriptionStatus
    start_date: date
    expiry_date: Optional[date] = None
    next_billing_date: date
    payment_terms: str = "Net 15"
    recurring_amount: float
    lines: list[SubscriptionLineResponse] = []


def serialize_subscription(sub: Subscription, session: Session) -> SubscriptionResponse:
    customer = session.get(User, sub.customer_id)
    plan = session.get(Plan, sub.plan_id)
    lines_resp: list[SubscriptionLineResponse] = []
    recurring_amount = 0.0

    for line in sub.lines:
        prod = session.get(Product, line.product_id)
        variant = session.get(ProductVariant, line.variant_id) if line.variant_id else None
        line_amt = float(line.unit_price * line.quantity)
        recurring_amount += line_amt
        v_name = f"{variant.attribute_name}: {variant.attribute_value}" if variant else ""
        lines_resp.append(
            SubscriptionLineResponse(
                id=line.id,
                product_id=line.product_id,
                product_name=prod.name if prod else f"Product #{line.product_id}",
                variant_name=v_name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_amount=line_amt,
                tax_rule_id=line.tax_rule_id,
                discount_rule_id=line.discount_rule_id,
            )
        )

    c_name = customer.email.split("@")[0] if customer else f"Customer #{sub.customer_id}"
    c_email = customer.email if customer else ""
    p_name = plan.name if plan else f"Plan #{sub.plan_id}"
    p_freq = plan.frequency.value if plan else "monthly"

    return SubscriptionResponse(
        id=sub.id,
        subscription_number=sub.subscription_number,
        customer_id=sub.customer_id,
        customer_name=c_name,
        customer_email=c_email,
        plan_id=sub.plan_id,
        plan_name=p_name,
        frequency=p_freq,
        status=sub.status,
        start_date=sub.start_date,
        expiry_date=sub.expiry_date,
        next_billing_date=sub.next_billing_date,
        payment_terms="Net 15",
        recurring_amount=recurring_amount,
        lines=lines_resp,
    )


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
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
    return serialize_subscription(subscription, session)


@router.get("", response_model=list[SubscriptionResponse])
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
    subs = session.exec(query).all()
    return [serialize_subscription(s, session) for s in subs]


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(subscription_id: int, session: Session = Depends(get_session)):
    subscription = session.get(Subscription, subscription_id)
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return serialize_subscription(subscription, session)


@router.patch("/{subscription_id}/status", response_model=SubscriptionResponse)
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
    if payload.status == SubscriptionStatus.ACTIVE and subscription.status in {SubscriptionStatus.DRAFT, SubscriptionStatus.QUOTATION}:
        plan = session.get(Plan, subscription.plan_id)
        if plan and sum(line.quantity for line in subscription.lines) < plan.min_quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Subscription is below the plan minimum quantity ({plan.min_quantity})",
            )
    if payload.status == SubscriptionStatus.CLOSED:
        if subscription.expiry_date is None or subscription.expiry_date > date.today():
            subscription.expiry_date = date.today()
        # Clean up any unconfirmed draft invoices for this subscription
        from app.models.invoicing import Invoice, InvoiceStatus, InvoiceDiscountUse
        draft_invoices = session.exec(
            select(Invoice).where(
                Invoice.subscription_id == subscription_id,
                Invoice.status == InvoiceStatus.DRAFT,
            )
        ).all()
        for inv in draft_invoices:
            uses = session.exec(
                select(InvoiceDiscountUse).where(InvoiceDiscountUse.invoice_id == inv.id)
            ).all()
            for use in uses:
                rule = session.get(DiscountRule, use.discount_rule_id)
                if rule and rule.uses > 0:
                    rule.uses -= 1
                    session.add(rule)
            inv.status = InvoiceStatus.CANCELLED
            session.add(inv)

    subscription.status = payload.status
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    return serialize_subscription(subscription, session)


@router.post("/{subscription_id}/confirm", response_model=SubscriptionResponse)
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
    return serialize_subscription(subscription, session)


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(subscription_id: int, session: Session = Depends(get_session)):
    subscription = session.get(Subscription, subscription_id)
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    from app.models.invoicing import Invoice
    has_invoices = session.exec(select(Invoice.id).where(Invoice.subscription_id == subscription_id)).first()
    if has_invoices is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete subscription with existing billing history or invoices. Close the subscription instead."
        )

    session.delete(subscription)
    session.commit()
    return None


# --- Quotations Endpoints (/api/quotations) ---
class QuotationLineInput(SQLModel):
    product_id: Union[int, str]
    variant_id: Optional[Union[int, str]] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: Optional[float] = None
    tax_rule_id: Optional[int] = None
    discount_rule_id: Optional[int] = None


class QuotationCreateInput(SQLModel):
    customer_id: Optional[Union[int, str]] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_id: Union[int, str]
    start_date: Optional[date] = None
    payment_terms: Optional[str] = "Net 15"
    lines: list[QuotationLineInput] = Field(min_length=1)


def _resolve_int_id(val: Union[int, str]) -> int:
    if isinstance(val, int):
        return val
    # Extract numeric substring if string like "prod-1", "plan-2"
    digits = "".join(filter(str.isdigit, str(val)))
    if digits:
        return int(digits)
    try:
        return int(val)
    except ValueError:
        return 1


@quotations_router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(payload: QuotationCreateInput, session: Session = Depends(get_session)):
    # 1. Resolve customer
    user: Optional[User] = None
    if payload.customer_id is not None:
        user_id = _resolve_int_id(payload.customer_id)
        user = session.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer with ID {payload.customer_id} not found")
    elif payload.customer_email:
        user = session.exec(select(User).where(User.email == payload.customer_email)).first()
        if user is None:
            # Create on-the-fly customer record
            from app.core.security import hash_password
            user = User(
                email=payload.customer_email,
                password_hash=hash_password("Brightloop@2026!"),
                role=UserRole.CUSTOMER,
            )
            session.add(user)
            session.flush()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer ID or customer email is required")

    # 2. Resolve plan
    plan_id = _resolve_int_id(payload.plan_id)
    plan = session.get(Plan, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Plan with ID {payload.plan_id} not found")

    # 3. Resolve lines
    lines: list[SubscriptionLine] = []
    for line in payload.lines:
        p_id = _resolve_int_id(line.product_id)
        product = session.get(Product, p_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {line.product_id} not found")

        v_id: Optional[int] = None
        price_extra = 0.0
        if line.variant_id is not None and str(line.variant_id).strip():
            v_id = _resolve_int_id(line.variant_id)
            variant = session.get(ProductVariant, v_id)
            if variant:
                price_extra = variant.price_extra

        unit_price = line.unit_price if line.unit_price is not None else (product.sales_price + price_extra)

        lines.append(
            SubscriptionLine(
                product_id=p_id,
                variant_id=v_id,
                quantity=line.quantity,
                unit_price=unit_price,
                tax_rule_id=line.tax_rule_id,
                discount_rule_id=line.discount_rule_id,
            )
        )

    st_date = payload.start_date or date.today()
    sub = Subscription(
        subscription_number="pending",
        customer_id=user.id,
        plan_id=plan_id,
        start_date=st_date,
        next_billing_date=st_date,
        status=SubscriptionStatus.QUOTATION,
        lines=lines,
    )
    session.add(sub)
    session.flush()
    sub.subscription_number = f"SUB-{date.today().year}-{sub.id:04d}"
    session.commit()
    session.refresh(sub)
    return serialize_subscription(sub, session)


@quotations_router.post("/{subscription_id}/confirm", response_model=SubscriptionResponse)
def confirm_quotation_via_alias(subscription_id: int, session: Session = Depends(get_session)):
    return confirm_quotation(subscription_id, session)

