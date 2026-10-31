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


def test_tax_and_discount_rules_crud(client: TestClient):
    # Tax Rule
    tax_resp = client.post(
        "/api/taxes",
        json={"name": "VAT 20%", "tax_type": "percent", "amount": 20.0, "price_included": False, "is_active": True},
    )
    assert tax_resp.status_code == 201
    tax = tax_resp.json()
    assert tax["name"] == "VAT 20%"
    assert tax["amount"] == 20.0

    # Discount Rule (scope = subscription)
    disc_resp = client.post(
        "/api/discounts",
        json={
            "name": "Spring Sale 10%",
            "discount_type": "percent",
            "scope": "subscription",
            "amount": 10.0,
            "min_purchase_amount": 100.0,
            "is_active": True,
        },
    )
    assert disc_resp.status_code == 201
    disc = disc_resp.json()
    assert disc["amount"] == 10.0

    # Invalid discount: start_date > end_date must fail with 422
    bad_disc = client.post(
        "/api/discounts",
        json={
            "name": "Bad Promo",
            "discount_type": "percent",
            "scope": "subscription",
            "amount": 5.0,
            "start_date": "2026-12-31",
            "end_date": "2026-01-01",
        },
    )
    assert bad_disc.status_code == 422


def test_billing_runner_and_idempotency(client: TestClient):
    # 1. Setup User, Product, Plan
    u = client.post("/api/auth/register", json={"email": "bill@test.com", "password": "Password123!", "role": "customer"}).json()
    p = client.post("/api/products", json={"name": "SaaS Platform", "type": "software", "sales_price": 1000.0, "cost_price": 200.0, "variants": []}).json()
    plan = client.post(
        "/api/plans",
        json={"name": "Monthly Plan", "frequency": "monthly", "min_quantity": 1, "start_date": "2026-10-01", "auto_close_on_end": False, "allow_pause": True},
    ).json()

    # 2. Setup Tax rule
    tax = client.post(
        "/api/taxes",
        json={"name": "Standard GST 18%", "tax_type": "percent", "amount": 18.0, "price_included": False, "is_active": True},
    ).json()

    # 3. Create & Confirm Subscription
    sub = client.post(
        "/api/quotations",
        json={
            "customer_id": u["id"],
            "plan_id": plan["id"],
            "start_date": "2026-10-01",
            "lines": [{"product_id": p["id"], "quantity": 1, "unit_price": 1000.0, "tax_rule_id": tax["id"]}],
        },
    ).json()
    client.post(f"/api/quotations/{sub['id']}/confirm")

    # 4. First Billing Run (Simulated 2026-10-01)
    run1 = client.post("/api/billing/run", json={"simulated_date": "2026-10-01"}).json()
    assert run1["generated"] == 1
    assert run1["evaluated"] == 1

    # Invoices list should now contain 1 Draft invoice
    invoices = client.get("/api/invoices").json()
    assert len(invoices) == 1
    inv = invoices[0]
    assert inv["status"] == "Draft"
    assert inv["subtotal"] == 1000.0
    assert inv["tax_amount"] == 180.0
    assert inv["total_amount"] == 1180.0

    # 5. Idempotent Re-Run on same date must generate ZERO new invoices
    run2 = client.post("/api/billing/run", json={"simulated_date": "2026-10-01"}).json()
    assert run2["generated"] == 0

    # Total invoices in database remains exactly 1
    assert len(client.get("/api/invoices").json()) == 1


def test_invoice_lifecycle_and_payment_reconciliation(client: TestClient):
    from datetime import date
    from app.api.dashboard import set_current_simulated_date

    set_current_simulated_date(date(2026, 10, 1))

    u = client.post("/api/auth/register", json={"email": "payer@test.com", "password": "Password123!", "role": "customer"}).json()
    p = client.post("/api/products", json={"name": "Hosting Node", "type": "service", "sales_price": 500.0, "cost_price": 100.0, "variants": []}).json()
    plan = client.post("/api/plans", json={"name": "Node Monthly", "frequency": "monthly", "min_quantity": 1, "start_date": "2026-10-01", "auto_close_on_end": False, "allow_pause": True}).json()

    sub = client.post(
        "/api/quotations",
        json={"customer_id": u["id"], "plan_id": plan["id"], "start_date": "2026-10-01", "lines": [{"product_id": p["id"], "quantity": 1, "unit_price": 500.0}]},
    ).json()
    client.post(f"/api/quotations/{sub['id']}/confirm")

    client.post("/api/billing/run", json={"simulated_date": "2026-10-01"})
    inv = client.get("/api/invoices").json()[0]
    inv_id = inv["id"]
    assert inv["status"] == "Draft"

    # Payment on draft invoice must be rejected (requires confirmed invoice)
    bad_pay = client.post(
        "/api/payments",
        json={"invoice_id": inv_id, "amount": 500.0, "payment_method": "upi", "payment_date": "2026-10-05"},
    )
    assert bad_pay.status_code == 409

    # Confirm invoice
    client.post(f"/api/invoices/{inv_id}/confirm")
    assert client.get(f"/api/invoices/{inv_id}").json()["status"] == "Confirmed"

    # Partial payment (200 of 500)
    pay1 = client.post(
        "/api/payments",
        json={"invoice_id": inv_id, "amount": 200.0, "payment_method": "upi", "payment_date": "2026-10-05"},
    )
    assert pay1.status_code == 201

    inv_part = client.get(f"/api/invoices/{inv_id}").json()
    assert inv_part["status"] == "Partially Paid"
    assert inv_part["amount_paid"] == 200.0

    # Remaining payment (300 of 500)
    pay2 = client.post(
        "/api/payments",
        json={"invoice_id": inv_id, "amount": 300.0, "payment_method": "bank_transfer", "payment_date": "2026-10-06"},
    )
    assert pay2.status_code == 201

    inv_full = client.get(f"/api/invoices/{inv_id}").json()
    assert inv_full["status"] == "Paid"
    assert inv_full["amount_paid"] == 500.0

    set_current_simulated_date(date.today())


def test_overdue_invoice_retains_overdue_on_partial_payment(client: TestClient):
    from datetime import date
    from app.api.dashboard import set_current_simulated_date

    # Set initial simulator date
    set_current_simulated_date(date(2026, 10, 1))

    u = client.post("/api/auth/register", json={"email": "aging@test.com", "password": "Password123!", "role": "customer"}).json()
    p = client.post("/api/products", json={"name": "Cloud API", "type": "service", "sales_price": 1000.0, "cost_price": 200.0, "variants": []}).json()
    plan = client.post("/api/plans", json={"name": "API Plan", "frequency": "monthly", "min_quantity": 1, "start_date": "2026-10-01", "auto_close_on_end": False, "allow_pause": True}).json()

    sub = client.post(
        "/api/quotations",
        json={"customer_id": u["id"], "plan_id": plan["id"], "start_date": "2026-10-01", "lines": [{"product_id": p["id"], "quantity": 1, "unit_price": 1000.0}]},
    ).json()
    client.post(f"/api/quotations/{sub['id']}/confirm")

    client.post("/api/billing/run", json={"simulated_date": "2026-10-01"})
    inv = client.get("/api/invoices").json()[0]
    inv_id = inv["id"]
    client.post(f"/api/invoices/{inv_id}/confirm")

    # Invoice due date is 2026-10-15 (14 days after issue date 2026-10-01)
    # Advance time to 2026-10-20 (overdue)
    set_current_simulated_date(date(2026, 10, 20))

    # Fetch invoices: status must now be Overdue
    inv_overdue = client.get(f"/api/invoices/{inv_id}").json()
    assert inv_overdue["status"] == "Overdue"

    # Make partial payment (250 of 1000) on the overdue invoice
    pay = client.post(
        "/api/payments",
        json={"invoice_id": inv_id, "amount": 250.0, "payment_method": "upi", "payment_date": "2026-10-20"},
    )
    assert pay.status_code == 201

    # Status must STILL be Overdue (not overwritten to Partially Paid while past due)
    inv_after_pay = client.get(f"/api/invoices/{inv_id}").json()
    assert inv_after_pay["status"] == "Overdue"
    assert inv_after_pay["amount_paid"] == 250.0

    # Pay remaining balance (750 of 1000)
    pay_full = client.post(
        "/api/payments",
        json={"invoice_id": inv_id, "amount": 750.0, "payment_method": "bank_transfer", "payment_date": "2026-10-20"},
    )
    assert pay_full.status_code == 201

    # Status must transition to Paid
    inv_paid = client.get(f"/api/invoices/{inv_id}").json()
    assert inv_paid["status"] == "Paid"
    assert inv_paid["amount_paid"] == 1000.0

    # Reset simulator back to today
    set_current_simulated_date(date.today())

