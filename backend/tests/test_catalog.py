import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
import app.models  # noqa: F401
from app.main import app as fastapi_app
from app.core.database import get_session

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(name="client")
def client_fixture():
    SQLModel.metadata.create_all(test_engine)

    def get_test_session():
        with Session(test_engine) as session:
            yield session

    fastapi_app.dependency_overrides[get_session] = get_test_session
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(test_engine)


def test_product_crud_and_variants(client: TestClient):
    # 1. Create product with initial variants
    payload = {
        "name": "Brightloop Enterprise Suite",
        "type": "software",
        "sales_price": 1200.0,
        "cost_price": 400.0,
        "notes": "Core ERP sync product",
        "variants": [
            {"attribute_name": "Edition", "attribute_value": "Odoo Sync", "price_extra": 560.0},
            {"attribute_name": "Edition", "attribute_value": "Standard", "price_extra": 0.0},
        ],
    }
    create_resp = client.post("/api/products", json=payload)
    assert create_resp.status_code == 201
    prod = create_resp.json()
    assert prod["name"] == "Brightloop Enterprise Suite"
    assert len(prod["variants"]) == 2
    assert prod["variants"][0]["price_extra"] == 560.0
    prod_id = prod["id"]

    # 2. Get product by ID
    get_resp = client.get(f"/api/products/{prod_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == prod_id

    # 3. List products
    list_resp = client.get("/api/products")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # 4. Add dynamic variant to existing product
    var_resp = client.post(
        f"/api/products/{prod_id}/variants",
        json={"attribute_name": "Support", "attribute_value": "24/7 Dedicated", "price_extra": 250.0},
    )
    assert var_resp.status_code == 201
    assert var_resp.json()["attribute_value"] == "24/7 Dedicated"

    # 5. Update product
    update_resp = client.patch(
        f"/api/products/{prod_id}",
        json={"sales_price": 1350.0, "notes": "Updated pricing for Q4"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["sales_price"] == 1350.0

    # 6. Soft-deactivate product
    del_resp = client.delete(f"/api/products/{prod_id}")
    assert del_resp.status_code == 200
    assert client.get(f"/api/products/{prod_id}").json()["is_active"] is False


def test_plans_crud_and_templates(client: TestClient):
    # 1. Create monthly plan
    plan_data = {
        "name": "Growth Pro Tier",
        "frequency": "monthly",
        "min_quantity": 2,
        "start_date": "2026-01-01",
        "auto_close_on_end": False,
        "allow_pause": True,
    }
    p_resp = client.post("/api/plans", json=plan_data)
    assert p_resp.status_code == 201
    plan = p_resp.json()
    assert plan["min_quantity"] == 2
    assert plan["frequency"] == "monthly"
    plan_id = plan["id"]

    # 2. List plans
    plans_list = client.get("/api/plans")
    assert plans_list.status_code == 200
    assert any(p["id"] == plan_id for p in plans_list.json())

    # 3. Create Quotation Template linked to plan
    tmpl_data = {
        "name": "Standard Starter Quote",
        "plan_id": plan_id,
        "valid_days": 30,
    }
    tmpl_resp = client.post("/api/plans/templates", json=tmpl_data)
    assert tmpl_resp.status_code == 201
    tmpl = tmpl_resp.json()
    assert tmpl["valid_days"] == 30
    assert tmpl["plan_id"] == plan_id

    # 4. List quotation templates
    all_tmpls = client.get("/api/plans/templates/all")
    assert all_tmpls.status_code == 200
    assert len(all_tmpls.json()) == 1

    # 5. Soft-deactivate plan
    del_plan = client.delete(f"/api/plans/{plan_id}")
    assert del_plan.status_code == 200
    assert client.get(f"/api/plans/{plan_id}").json()["is_active"] is False
