from enum import Enum
from datetime import date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class ProductType(str, Enum):
    SOFTWARE = "software"
    SERVICE = "service"
    ADDON = "addon"


class BillingFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


# --- Product Variants ---
class ProductVariantBase(SQLModel):
    attribute_name: str  # e.g., "Brand"
    attribute_value: str  # e.g., "Odoo"
    price_extra: float = Field(default=0.0)  # e.g., 560.0


class ProductVariant(ProductVariantBase, table=True):
    __tablename__ = "product_variants"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id", index=True)

    product: Optional["Product"] = Relationship(back_populates="variants")


class ProductVariantRead(ProductVariantBase):
    id: int
    product_id: int


# --- Products ---
class ProductBase(SQLModel):
    name: str = Field(index=True)
    type: ProductType = Field(default=ProductType.SOFTWARE)
    sales_price: float = Field(default=0.0, description="Base sales price")
    cost_price: float = Field(default=0.0, description="Internal cost price")
    notes: Optional[str] = None
    is_active: bool = Field(default=True)


class Product(ProductBase, table=True):
    __tablename__ = "products"

    id: Optional[int] = Field(default=None, primary_key=True)
    variants: List[ProductVariant] = Relationship(back_populates="product", cascade_delete=True)


class ProductRead(ProductBase):
    id: int
    variants: List[ProductVariantRead] = []


# --- Plans ---
class PlanBase(SQLModel):
    name: str = Field(index=True)
    frequency: BillingFrequency = Field(default=BillingFrequency.MONTHLY)
    min_quantity: int = Field(default=1, ge=1)
    start_date: date
    end_date: Optional[date] = None
    auto_close_on_end: bool = Field(default=False)
    allow_early_close: bool = Field(default=True)
    allow_pause: bool = Field(default=True)
    allow_manual_renewal: bool = Field(default=True)
    is_active: bool = Field(default=True)


class Plan(PlanBase, table=True):
    __tablename__ = "plans"

    id: Optional[int] = Field(default=None, primary_key=True)
    quotation_templates: List["QuotationTemplate"] = Relationship(back_populates="plan")


class PlanRead(PlanBase):
    id: int


# --- Quotation Templates ---
class QuotationTemplateBase(SQLModel):
    name: str
    plan_id: int = Field(foreign_key="plans.id")
    valid_days: int = Field(default=14, ge=1)


class QuotationTemplate(QuotationTemplateBase, table=True):
    __tablename__ = "quotation_templates"

    id: Optional[int] = Field(default=None, primary_key=True)
    plan: Optional[Plan] = Relationship(back_populates="quotation_templates")


class QuotationTemplateRead(QuotationTemplateBase):
    id: int
