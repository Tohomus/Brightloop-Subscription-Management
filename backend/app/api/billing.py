from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Field, Session, SQLModel, select

from app.core.database import get_session
from app.api.auth import require_roles
from app.models.auth import UserRole
from app.models.billing import DiscountRule, DiscountScope, DiscountType, TaxRule, TaxType
from app.models.catalog import Product
from app.services.billing_runner import run_billing


router = APIRouter(prefix="/api/billing", tags=["billing"])
tax_router = APIRouter(prefix="/api/taxes", tags=["taxes"])
discount_router = APIRouter(prefix="/api/discounts", tags=["discounts"])


class BillingRunRequest(SQLModel):
    simulated_date: date = Field(default_factory=date.today)


class TaxRuleCreate(SQLModel):
    name: str
    tax_type: TaxType = TaxType.PERCENT
    amount: float = Field(ge=0)
    price_included: bool = False
    is_active: bool = True


class DiscountRuleCreate(SQLModel):
    name: str
    discount_type: DiscountType = DiscountType.PERCENT
    scope: DiscountScope = DiscountScope.SUBSCRIPTION
    amount: float = Field(ge=0)
    product_id: int | None = None
    min_purchase_amount: float = Field(default=0.0, ge=0)
    min_quantity: int = Field(default=0, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    max_uses: int | None = Field(default=None, ge=0)
    is_active: bool = True


@router.post("/run")
def billing_run(payload: BillingRunRequest, session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN))):
    return run_billing(session, payload.simulated_date)


@tax_router.get("", response_model=list[TaxRule])
def list_taxes(session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    return session.exec(select(TaxRule).order_by(TaxRule.id)).all()


@tax_router.post("", response_model=TaxRule, status_code=201)
def create_tax(payload: TaxRuleCreate, session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN))):
    try:
        rule = TaxRule(**payload.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@discount_router.get("", response_model=list[DiscountRule])
def list_discounts(session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    return session.exec(select(DiscountRule).order_by(DiscountRule.id)).all()


@discount_router.post("", response_model=DiscountRule, status_code=201)
def create_discount(payload: DiscountRuleCreate, session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN))):
    if payload.start_date and payload.end_date and payload.start_date > payload.end_date:
        raise HTTPException(status_code=422, detail="start_date must be on or before end_date")
    if payload.scope == DiscountScope.PRODUCT and payload.product_id is None:
        raise HTTPException(status_code=422, detail="product_id is required for product discounts")
    if payload.scope == DiscountScope.SUBSCRIPTION and payload.product_id is not None:
        raise HTTPException(status_code=422, detail="product_id is only valid for product discounts")
    if payload.product_id is not None and session.get(Product, payload.product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    rule = DiscountRule(**payload.model_dump())
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule
