import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from datetime import date
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


def test_dashboard_summary_and_chrono_simulator(client: TestClient):
    # 1. Setup Data
    u = client.post("/api/auth/register", json={"email": "ceo@test.com", "password": "Password123!", "role": "customer"}).json()
    p = client.post("/api/products", json={"name": "Analytics Pro", "type": "software", "sales_price": 1000.0, "cost_price": 200.0, "variants": []}).json()
    plan = client.post(
        "/api/plans",
        json={"name": "Monthly Exec", "frequency": "monthly", "min_quantity": 1, "start_date": "2026-10-01", "auto_close_on_end": False, "allow_pause": True},
    ).json()

    # Create & Confirm Subscription
    sub = client.post(
        "/api/quotations",
        json={"customer_id": u["id"], "plan_id": plan["id"], "start_date": "2026-10-01", "lines": [{"product_id": p["id"], "quantity": 1, "unit_price": 1000.0}]},
    ).json()
    client.post(f"/api/quotations/{sub['id']}/confirm")

    # 2. Check initial Dashboard Summary
    dash_resp = client.get("/api/dashboard/summary")
    assert dash_resp.status_code == 200
    summary = dash_resp.json()
    assert summary["active_subscriptions_count"] == 1
    assert summary["mrr"] == 1000.0
    assert summary["arr"] == 12000.0
    assert summary["total_revenue_collected"] == 0.0

    # 3. Time travel +30 days (Billing run executed for due cycles)
    tt_resp = client.post("/api/simulation/time-travel", json={"advance_days": 30})
    assert tt_resp.status_code == 200
    tt_data = tt_resp.json()
    assert tt_data["success"] is True
    assert tt_data["billing_result"]["generated"] >= 1

    # 4. Confirm generated invoices so they transition Draft -> Confirmed (Accounts Receivable)
    invoices = client.get("/api/invoices").json()
    assert len(invoices) >= 1
    for inv in invoices:
        client.post(f"/api/invoices/{inv['id']}/confirm")

    dash_confirmed = client.get("/api/dashboard/summary").json()
    assert dash_confirmed["active_subscriptions_count"] == 1
    assert dash_confirmed["outstanding_receivables"] >= 1000.0

    # 5. Pay invoice and verify revenue collection
    invoices = client.get("/api/invoices").json()
    for inv in invoices:
        client.post(f"/api/invoices/{inv['id']}/confirm")
        client.post(
            "/api/payments",
            json={"invoice_id": inv["id"], "amount": inv["total_amount"], "payment_method": "bank_transfer", "payment_date": "2026-11-01"},
        )

    final_summary = client.get("/api/dashboard/summary").json()
    assert final_summary["total_revenue_collected"] >= 1000.0
    assert final_summary["outstanding_receivables"] == 0.0


def test_system_clock_persistence(client: TestClient):
    from datetime import date
    from app.models.billing import SystemClock

    # Travel to a specific future date
    res = client.post("/api/simulation/time-travel", json={"simulated_date": "2027-04-15"})
    assert res.status_code == 200
    assert res.json()["simulated_date"] == "2027-04-15"

    # Verify that the date is stored in SystemClock table in database
    with Session(test_engine) as session:
        clock = session.get(SystemClock, 1)
        assert clock is not None
        assert clock.simulated_date == date(2027, 4, 15)

    # Calling summary reflects the persisted simulated date
    dash = client.get("/api/dashboard/summary").json()
    assert dash["simulated_date"] == "2027-04-15"

