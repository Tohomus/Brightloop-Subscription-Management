from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.catalog import ProductType, BillingFrequency


# --- Product Variant Schemas ---
class ProductVariantCreate(BaseModel):
    attribute_name: str = Field(description="Variant attribute name, e.g. 'Brand'")
    attribute_value: str = Field(description="Variant option value, e.g. 'Odoo'")
    price_extra: float = Field(default=0.0, description="Additional price added to base price, e.g. 560.0")


class ProductVariantResponse(BaseModel):
    id: int
    product_id: int
    attribute_name: str
    attribute_value: str
    price_extra: float

    class Config:
        from_attributes = True


# --- Product Schemas ---
class ProductCreate(BaseModel):
    name: str = Field(min_length=1, description="Product title, e.g. 'Brightloop Cloud ERP'")
    type: ProductType = Field(default=ProductType.SOFTWARE)
    sales_price: float = Field(ge=0.0, default=0.0, description="Base sales price")
    cost_price: float = Field(ge=0.0, default=0.0, description="Internal cost price")
    notes: Optional[str] = None
    variants: Optional[List[ProductVariantCreate]] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ProductType] = None
    sales_price: Optional[float] = None
    cost_price: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    type: ProductType
    sales_price: float
    cost_price: float
    notes: Optional[str]
    is_active: bool
    variants: List[ProductVariantResponse] = []

    class Config:
        from_attributes = True


# --- Plan Schemas ---
class PlanCreate(BaseModel):
    name: str = Field(min_length=1, description="Plan name, e.g. 'Monthly Standard'")
    frequency: BillingFrequency = Field(default=BillingFrequency.MONTHLY)
    min_quantity: int = Field(default=1, ge=1, description="Minimum order quantity")
    start_date: date
    end_date: Optional[date] = None
    auto_close_on_end: bool = Field(default=False, description="Automatically close subscription when end_date passes")
    allow_early_close: bool = Field(default=True)
    allow_pause: bool = Field(default=True)
    allow_manual_renewal: bool = Field(default=True)


class PlanResponse(BaseModel):
    id: int
    name: str
    frequency: BillingFrequency
    min_quantity: int
    start_date: date
    end_date: Optional[date]
    auto_close_on_end: bool
    allow_early_close: bool
    allow_pause: bool
    allow_manual_renewal: bool
    is_active: bool

    class Config:
        from_attributes = True


# --- Quotation Template Schemas ---
class QuotationTemplateCreate(BaseModel):
    name: str = Field(min_length=1, description="Template name, e.g. 'Enterprise Odoo Deal'")
    plan_id: int
    valid_days: int = Field(default=14, ge=1, description="Number of days the quote remains valid")


class QuotationTemplateResponse(BaseModel):
    id: int
    name: str
    plan_id: int
    valid_days: int

    class Config:
        from_attributes = True
