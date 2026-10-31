from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.catalog import Plan, BillingFrequency, QuotationTemplate
from app.schemas.catalog import (
    PlanCreate,
    PlanResponse,
    QuotationTemplateCreate,
    QuotationTemplateResponse,
)

router = APIRouter(prefix="/api/plans", tags=["Plans & Frequencies"])


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreate, session: Session = Depends(get_session)):
    """
    Creates a new billing plan.
    Configures:
    - Frequency: daily, weekly, monthly, yearly
    - Minimum order quantity (e.g. 5 seats)
    - Date availability window
    - Auto-close vs. renewable flags
    """
    if payload.end_date and payload.end_date < payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan end_date cannot be earlier than start_date."
        )

    plan = Plan(
        name=payload.name,
        frequency=payload.frequency,
        min_quantity=payload.min_quantity,
        start_date=payload.start_date,
        end_date=payload.end_date,
        auto_close_on_end=payload.auto_close_on_end,
        allow_early_close=payload.allow_early_close,
        allow_pause=payload.allow_pause,
        allow_manual_renewal=payload.allow_manual_renewal,
        is_active=True,
    )
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan


@router.get("", response_model=List[PlanResponse])
def list_plans(
    frequency: Optional[BillingFrequency] = Query(None, description="Filter by billing frequency"),
    include_inactive: bool = Query(False, description="Include deactivated plans"),
    session: Session = Depends(get_session),
):
    """
    Returns all configured subscription plans.
    """
    statement = select(Plan)
    if not include_inactive:
        statement = statement.where(Plan.is_active == True)
    if frequency:
        statement = statement.where(Plan.frequency == frequency)

    plans = session.exec(statement).all()
    return plans


@router.get("/{id}", response_model=PlanResponse)
def get_plan(id: int, session: Session = Depends(get_session)):
    """
    Retrieves a single plan by ID.
    """
    plan = session.get(Plan, id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {id} not found."
        )
    return plan


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def deactivate_plan(id: int, session: Session = Depends(get_session)):
    """
    Soft-deactivates a plan.
    """
    plan = session.get(Plan, id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {id} not found."
        )
    plan.is_active = False
    session.add(plan)
    session.commit()
    return {"message": f"Plan '{plan.name}' (ID: {id}) has been deactivated."}


# --- Quotation Templates Sub-routes ---
@router.post("/templates", response_model=QuotationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_quotation_template(
    payload: QuotationTemplateCreate,
    session: Session = Depends(get_session),
):
    """
    Creates a pre-configured quotation template linked to a plan.
    Enables sales reps to draft offers quickly with pre-defined validity days.
    """
    plan = session.get(Plan, payload.plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {payload.plan_id} does not exist."
        )

    template = QuotationTemplate(
        name=payload.name,
        plan_id=payload.plan_id,
        valid_days=payload.valid_days,
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    return template


@router.get("/templates/all", response_model=List[QuotationTemplateResponse])
def list_quotation_templates(session: Session = Depends(get_session)):
    """
    Lists all available quotation templates.
    """
    statement = select(QuotationTemplate)
    templates = session.exec(statement).all()
    return templates
