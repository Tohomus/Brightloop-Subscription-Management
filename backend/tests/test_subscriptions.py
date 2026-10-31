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


def _setup_catalog(client: TestClient):
    # Customer
    u = client.post("/api/auth/register", json={"email": "cust@test.com", "password": "Password123!", "role": "customer"}).json()
    # Product
    p = client.post(
        "/api/products",
        json={
            "name": "Cloud App",
            "type": "software",
            "sales_price": 500.0,
            "cost_price": 100.0,
            "variants": [{"attribute_name": "Tier", "attribute_value": "Pro", "price_extra": 100.0}],
        },
    ).json()
    # Plan (min quantity 2)
    plan = client.post(
        "/api/plans",
        json={
            "name": "Team Plan",
            "frequency": "monthly",
            "min_quantity": 2,
            "start_date": "2026-01-01",
            "auto_close_on_end": False,
            "allow_pause": True,
        },
    ).json()
    return u["id"], p["id"], p["variants"][0]["id"], plan["id"]


def test_quotation_creation_and_auto_pricing(client: TestClient):
    user_id, prod_id, var_id, plan_id = _setup_catalog(client)

    # Unit price omitted: engine should compute base (500) + variant (100) = 600
    q_resp = client.post(
        "/api/quotations",
        json={
            "customer_id": user_id,
            "plan_id": plan_id,
            "start_date": "2026-10-31",
            "lines": [{"product_id": prod_id, "variant_id": var_id, "quantity": 2}],
        },
    )
    assert q_resp.status_code == 201
    data = q_resp.json()
    assert data["status"] == "Quotation"
    assert data["recurring_amount"] == 1200.0  # 2 * 600.0
    assert data["lines"][0]["unit_price"] == 600.0


def test_min_quantity_guard_on_confirmation(client: TestClient):
    user_id, prod_id, var_id, plan_id = _setup_catalog(client)

    # Quantity = 1, but plan requires min_quantity = 2
    q_resp = client.post(
        "/api/quotations",
        json={
            "customer_id": user_id,
            "plan_id": plan_id,
            "lines": [{"product_id": prod_id, "variant_id": var_id, "quantity": 1, "unit_price": 600.0}],
        },
    )
    sub_id = q_resp.json()["id"]

    # Attempting to confirm must fail with 422
    conf_resp = client.post(f"/api/quotations/{sub_id}/confirm")
    assert conf_resp.status_code == 422
    assert "below the plan minimum quantity" in conf_resp.json()["detail"]


def test_subscription_state_machine_transitions(client: TestClient):
    user_id, prod_id, var_id, plan_id = _setup_catalog(client)

    # Create quotation meeting min quantity
    q_resp = client.post(
        "/api/quotations",
        json={
            "customer_id": user_id,
            "plan_id": plan_id,
            "lines": [{"product_id": prod_id, "variant_id": var_id, "quantity": 2, "unit_price": 600.0}],
        },
    )
    sub_id = q_resp.json()["id"]
    assert q_resp.json()["status"] == "Quotation"

    # Quotation -> Active (via confirmation)
    c_resp = client.post(f"/api/subscriptions/{sub_id}/confirm")
    assert c_resp.status_code == 200
    assert c_resp.json()["status"] == "Active"

    # Active -> Paused
    p_resp = client.patch(f"/api/subscriptions/{sub_id}/status", json={"status": "Paused"})
    assert p_resp.status_code == 200
    assert p_resp.json()["status"] == "Paused"

    # Paused -> Active (Resume)
    r_resp = client.patch(f"/api/subscriptions/{sub_id}/status", json={"status": "Active"})
    assert r_resp.status_code == 200
    assert r_resp.json()["status"] == "Active"

    # Active -> Closed
    close_resp = client.patch(f"/api/subscriptions/{sub_id}/status", json={"status": "Closed"})
    assert close_resp.status_code == 200
    assert close_resp.json()["status"] == "Closed"

    # Illegal transition: Closed -> Active must fail with 409
    illegal_resp = client.patch(f"/api/subscriptions/{sub_id}/status", json={"status": "Active"})
    assert illegal_resp.status_code == 409


def test_subscription_filtering_and_deletion(client: TestClient):
    user_id, prod_id, var_id, plan_id = _setup_catalog(client)

    sub = client.post(
        "/api/quotations",
        json={
            "customer_id": user_id,
            "plan_id": plan_id,
            "lines": [{"product_id": prod_id, "variant_id": var_id, "quantity": 2, "unit_price": 600.0}],
        },
    ).json()

    # Filter by status
    subs_quote = client.get("/api/subscriptions?status=Quotation").json()
    assert len(subs_quote) == 1

    subs_active = client.get("/api/subscriptions?status=Active").json()
    assert len(subs_active) == 0

    # Delete subscription
    del_resp = client.delete(f"/api/subscriptions/{sub['id']}")
    assert del_resp.status_code == 204
    assert client.get(f"/api/subscriptions/{sub['id']}").status_code == 404


def test_quotation_creation_rejects_invalid_ids(client: TestClient):
    user_id, prod_id, var_id, plan_id = _setup_catalog(client)

    # Invalid customer ID must return 404
    resp_bad_user = client.post(
        "/api/quotations",
        json={"customer_id": 99999, "plan_id": plan_id, "lines": [{"product_id": prod_id, "quantity": 1}]},
    )
    assert resp_bad_user.status_code == 404
    assert "Customer with ID" in resp_bad_user.json()["detail"]

    # Invalid plan ID must return 404
    resp_bad_plan = client.post(
        "/api/quotations",
        json={"customer_id": user_id, "plan_id": 99999, "lines": [{"product_id": prod_id, "quantity": 1}]},
    )
    assert resp_bad_plan.status_code == 404
    assert "Plan with ID" in resp_bad_plan.json()["detail"]

    # Invalid product ID must return 404
    resp_bad_prod = client.post(
        "/api/quotations",
        json={"customer_id": user_id, "plan_id": plan_id, "lines": [{"product_id": 99999, "quantity": 1}]},
    )
    assert resp_bad_prod.status_code == 404
    assert "Product with ID" in resp_bad_prod.json()["detail"]

