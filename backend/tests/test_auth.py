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


def test_password_strength_validation(client: TestClient):
    # Too short (< 9 chars)
    r1 = client.post("/api/auth/register", json={"email": "u1@test.com", "password": "Short1!", "role": "customer"})
    assert r1.status_code == 400
    assert "more than 8 characters" in r1.json()["detail"]

    # Missing uppercase
    r2 = client.post("/api/auth/register", json={"email": "u2@test.com", "password": "lowercase1!", "role": "customer"})
    assert r2.status_code == 400
    assert "uppercase letter" in r2.json()["detail"]

    # Missing lowercase
    r3 = client.post("/api/auth/register", json={"email": "u3@test.com", "password": "UPPERCASE1!", "role": "customer"})
    assert r3.status_code == 400
    assert "lowercase letter" in r3.json()["detail"]

    # Missing special character
    r4 = client.post("/api/auth/register", json={"email": "u4@test.com", "password": "Password123", "role": "customer"})
    assert r4.status_code == 400
    assert "special character" in r4.json()["detail"]


def test_registration_and_duplicate_handling(client: TestClient):
    # Valid registration
    resp = client.post(
        "/api/auth/register",
        json={"email": "admin@brightloop.io", "password": "SecurePassword1!", "role": "admin"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "admin@brightloop.io"
    assert data["role"] == "admin"
    assert "id" in data

    # Duplicate registration must fail
    dup_resp = client.post(
        "/api/auth/register",
        json={"email": "admin@brightloop.io", "password": "SecurePassword1!", "role": "admin"},
    )
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]


def test_login_success_and_failure(client: TestClient):
    # Register user
    client.post(
        "/api/auth/register",
        json={"email": "staff@brightloop.io", "password": "Brightloop@2026!", "role": "staff"},
    )

    # Valid login
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "staff@brightloop.io", "password": "Brightloop@2026!"},
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    assert token_data["role"] == "staff"

    # Invalid password
    bad_pwd_resp = client.post(
        "/api/auth/login",
        json={"email": "staff@brightloop.io", "password": "WrongPassword1!"},
    )
    assert bad_pwd_resp.status_code == 401

    # Non-existent email
    bad_email_resp = client.post(
        "/api/auth/login",
        json={"email": "unknown@brightloop.io", "password": "Brightloop@2026!"},
    )
    assert bad_email_resp.status_code == 401


def test_auth_me_and_token_verification(client: TestClient):
    client.post(
        "/api/auth/register",
        json={"email": "finance@acmeglobal.com", "password": "Brightloop@2026!", "role": "customer"},
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "finance@acmeglobal.com", "password": "Brightloop@2026!"},
    )
    token = login_resp.json()["access_token"]

    # Valid token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    user_info = me_resp.json()
    assert user_info["email"] == "finance@acmeglobal.com"
    assert user_info["role"] == "customer"

    # Missing token
    no_token_resp = client.get("/api/auth/me")
    assert no_token_resp.status_code == 401

    # Invalid token
    bad_token_resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert bad_token_resp.status_code == 401


def test_password_reset(client: TestClient):
    client.post(
        "/api/auth/register",
        json={"email": "reset@test.com", "password": "Brightloop@2026!", "role": "customer"},
    )

    # Registered email
    r_ok = client.post("/api/auth/reset-password", json={"email": "reset@test.com"})
    assert r_ok.status_code == 200
    assert "dispatched" in r_ok.json()["message"].lower()

    # Unregistered email (anti-enumeration security returns 200 with generic notice)
    r_bad = client.post("/api/auth/reset-password", json={"email": "nobody@test.com"})
    assert r_bad.status_code == 200
    assert "exists" in r_bad.json()["message"]
