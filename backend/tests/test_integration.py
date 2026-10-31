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



def test_full_subscription_and_billing_lifecycle(client: TestClient):
    # 1. Register User
    reg_resp = client.post(
        "/api/auth/register",
        json={"email": "customer@acme.com", "password": "SecurePassword1!", "role": "customer"},
    )
    assert reg_resp.status_code == 201, reg_resp.text
    cust_id = reg_resp.json()["id"]

    # 2. Create Product
    prod_resp = client.post(
        "/api/products",
        json={
            "name": "Cloud Enterprise ERP",
            "type": "software",
            "sales_price": 1000.0,
            "cost_price": 300.0,
            "notes": "Core ERP system",
            "variants": [{"attribute_name": "Tier", "attribute_value": "Pro", "price_extra": 250.0}],
        },
    )
    assert prod_resp.status_code == 201, prod_resp.text
    product = prod_resp.json()
    prod_id = product["id"]
    variant_id = product["variants"][0]["id"]

    # 3. Create Plan
    plan_resp = client.post(
        "/api/plans",
        json={
            "name": "Monthly Pro",
            "frequency": "monthly",
            "min_quantity": 1,
            "start_date": "2026-10-31",
            "auto_close_on_end": False,
            "allow_pause": True,
        },
    )
    assert plan_resp.status_code == 201, plan_resp.text
    plan_id = plan_resp.json()["id"]

    # 4. Create Quotation via /api/quotations
    quote_resp = client.post(
        "/api/quotations",
        json={
            "customer_id": cust_id,
            "plan_id": plan_id,
            "start_date": "2026-10-31",
            "lines": [
                {
                    "product_id": prod_id,
                    "variant_id": variant_id,
                    "quantity": 2,
                    "unit_price": 1250.0,
                }
            ],
        },
    )
    assert quote_resp.status_code == 201, quote_resp.text
    quote_data = quote_resp.json()
    assert quote_data["status"] == "Quotation"
    assert quote_data["customer_name"] == "customer"
    assert quote_data["plan_name"] == "Monthly Pro"
    assert quote_data["recurring_amount"] == 2500.0
    sub_id = quote_data["id"]

    # 5. Confirm Quotation into Active Subscription
    confirm_resp = client.post(f"/api/quotations/{sub_id}/confirm")
    assert confirm_resp.status_code == 200, confirm_resp.text
    assert confirm_resp.json()["status"] == "Active"

    # 6. List Subscriptions
    subs_resp = client.get("/api/subscriptions")
    assert subs_resp.status_code == 200
    subs = subs_resp.json()
    assert len(subs) == 1
    assert subs[0]["id"] == sub_id
    assert subs[0]["customer_name"] == "customer"
    assert subs[0]["frequency"] == "monthly"
    assert subs[0]["recurring_amount"] == 2500.0

    # 7. Run Billing Engine
    bill_resp = client.post("/api/billing/run", json={"simulated_date": "2026-10-31"})
    assert bill_resp.status_code == 200
    bill_data = bill_resp.json()
    assert bill_data["generated"] == 1
    assert bill_data["evaluated"] == 1

    # Idempotent re-run check (same simulated date: next_billing_date has advanced to next cycle)
    bill_rerun = client.post("/api/billing/run", json={"simulated_date": "2026-10-31"})
    assert bill_rerun.status_code == 200
    assert bill_rerun.json()["generated"] == 0

    # 8. List Invoices
    inv_resp = client.get("/api/invoices")
    assert inv_resp.status_code == 200
    invoices = inv_resp.json()
    assert len(invoices) == 1
    inv = invoices[0]
    assert inv["status"] == "Draft"
    assert inv["customer_name"] == "customer"
    assert inv["subscription_number"] == quote_data["subscription_number"]
    assert inv["total_amount"] == 2500.0
    assert inv["amount_paid"] == 0.0
    inv_id = inv["id"]

    # 9. Confirm Invoice
    inv_conf_resp = client.post(f"/api/invoices/{inv_id}/confirm")
    assert inv_conf_resp.status_code == 200
    assert inv_conf_resp.json()["status"] == "Confirmed"

    # 10. Record Payment
    pay_resp = client.post(
        "/api/payments",
        json={
            "invoice_id": inv_id,
            "amount": 2500.0,
            "payment_method": "bank_transfer",
            "payment_date": "2026-10-31",
            "notes": "Bank transfer payment full settlement",
        },
    )
    assert pay_resp.status_code == 201

    # 11. Verify Invoice is now Paid and Amount Paid is Updated
    inv_after_pay = client.get(f"/api/invoices/{inv_id}")
    assert inv_after_pay.status_code == 200
    inv_final = inv_after_pay.json()
    assert inv_final["status"] == "Paid"
    assert inv_final["amount_paid"] == 2500.0
