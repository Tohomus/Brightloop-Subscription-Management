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
    lines: List["QuotationTemplateLine"] = Relationship(back_populates="template", cascade_delete=True)


class QuotationTemplateLine(SQLModel, table=True):
    __tablename__ = "quotation_template_lines"

    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: int = Field(foreign_key="quotation_templates.id", index=True)
    product_id: int = Field(foreign_key="products.id")
    variant_id: Optional[int] = Field(default=None, foreign_key="product_variants.id")
    quantity: int = Field(default=1, ge=1)
    unit_price: Optional[float] = Field(default=None, ge=0)
    template: Optional[QuotationTemplate] = Relationship(back_populates="lines")


class QuotationTemplateRead(QuotationTemplateBase):
    id: int
