from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.api.auth import require_roles
from app.models.auth import UserRole
from app.models.catalog import Product, ProductVariant, ProductType
from app.schemas.catalog import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductVariantCreate,
    ProductVariantResponse,
)

router = APIRouter(prefix="/api/products", tags=["Products & Variants"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN))):
    """
    Creates a new product with optional initial variants.
    Example: Product 'Cloud ERP' with variant 'Brand: Odoo' (price_extra: +560.0).
    """
    product = Product(
        name=payload.name,
        type=payload.type,
        sales_price=payload.sales_price,
        cost_price=payload.cost_price,
        notes=payload.notes,
        is_active=True,
    )
    session.add(product)
    session.commit()
    session.refresh(product)

    # Attach initial variants if supplied
    if payload.variants:
        for v in payload.variants:
            variant = ProductVariant(
                product_id=product.id,
                attribute_name=v.attribute_name,
                attribute_value=v.attribute_value,
                price_extra=v.price_extra,
            )
            session.add(variant)
        session.commit()
        session.refresh(product)

    return product


@router.get("", response_model=List[ProductResponse])
def list_products(
    product_type: Optional[ProductType] = Query(None, description="Filter by product type"),
    include_inactive: bool = Query(False, description="Include deactivated products"),
    session: Session = Depends(get_session),
    _user=Depends(require_roles(UserRole.ADMIN, UserRole.STAFF)),
):
    """
    Returns all products with their associated variants.
    """
    statement = select(Product)
    if not include_inactive:
        statement = statement.where(Product.is_active == True)
    if product_type:
        statement = statement.where(Product.type == product_type)

    products = session.exec(statement).all()
    return products


@router.get("/{id}", response_model=ProductResponse)
def get_product(
    id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_roles(UserRole.ADMIN, UserRole.STAFF)),
):
    """
    Retrieves a single product by ID including all variants.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    return product


@router.patch("/{id}", response_model=ProductResponse)
def update_product(id: int, payload: ProductUpdate, session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN))):
    """
    Updates product details (name, prices, notes, status).
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def deactivate_product(id: int, session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN))):
    """
    Soft-deactivates a product so active subscriptions are not corrupted.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    product.is_active = False
    session.add(product)
    session.commit()
    return {"message": f"Product '{product.name}' (ID: {id}) has been deactivated."}


# --- Variant Sub-resource Endpoints ---
@router.post("/{id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def add_product_variant(
    id: int,
    payload: ProductVariantCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_roles(UserRole.ADMIN)),
):
    """
    Adds a dynamic pricing variant to an existing product.
    Example: Adding Brand='Odoo' with price_extra=560.0 to Product ID 1.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )

    variant = ProductVariant(
        product_id=product.id,
        attribute_name=payload.attribute_name,
        attribute_value=payload.attribute_value,
        price_extra=payload.price_extra,
    )
    session.add(variant)
    session.commit()
    session.refresh(variant)
    return variant


@router.delete("/{id}/variants/{variant_id}", status_code=status.HTTP_200_OK)
def delete_product_variant(id: int, variant_id: int, session: Session = Depends(get_session), _user=Depends(require_roles(UserRole.ADMIN))):
    """
    Removes a variant option from a product.
    """
    variant = session.get(ProductVariant, variant_id)
    if not variant or variant.product_id != id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variant with ID {variant_id} not found on Product {id}."
        )

    session.delete(variant)
    session.commit()
    return {"message": f"Variant ID {variant_id} removed from Product {id}."}
