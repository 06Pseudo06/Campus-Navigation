"""Unit and integration tests for authentication, JWT lifecycle, and provider interfaces."""

import uuid
import pytest
from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
    get_security_manager,
    hash_session_token,
)
from app.services.auth_providers import google_auth_provider, phone_otp_provider


def test_password_hashing_and_verification():
    """Verify password hashing produces unique salted hashes and verifies correctly."""
    pw = "SuperSecurePassword123!"
    h1 = hash_password(pw)
    h2 = hash_password(pw)

    # Different salts must yield different hashes
    assert h1 != h2
    assert h1.startswith("pbkdf2_sha256$100000$") or h1.startswith("$argon2")

    assert verify_password(pw, h1) is True
    assert verify_password(pw, h2) is True
    assert verify_password("WrongPassword!", h1) is False


def test_jwt_token_generation_and_decode():
    """Verify standard JWT HS256 creation and validation."""
    user_id = str(uuid.uuid4())
    payload = {"sub": user_id, "role": "admin", "email": "admin@campus.edu"}

    token = create_access_token(payload, expires_in_seconds=3600)
    decoded = decode_access_token(token)

    assert decoded["sub"] == user_id
    assert decoded["role"] == "admin"
    assert decoded["email"] == "admin@campus.edu"
    assert "exp" in decoded


def test_jwt_expired_token():
    """Verify expired token raises ValueError."""
    user_id = str(uuid.uuid4())
    token = create_access_token({"sub": user_id}, expires_in_seconds=-10)

    with pytest.raises(ValueError, match="expired"):
        decode_access_token(token)


def test_auth_registration_and_login_flow(client):
    """Test full registration, password login, and /auth/me profile retrieval."""
    reg_payload = {
        "email": "student1@campus.edu",
        "password": "SecretPassword2026!",
        "full_name": "Test Student",
        "role": "student",
    }

    # 1. Register new user
    res_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    data_reg = res_reg.json()
    assert "access_token" in data_reg
    assert data_reg["user"]["email"] == "student1@campus.edu"
    assert data_reg["user"]["full_name"] == "Test Student"
    token = data_reg["access_token"]

    # 2. Duplicate registration rejected
    res_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"].lower()

    # 3. Login with valid credentials
    res_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student1@campus.edu", "password": "SecretPassword2026!"},
    )
    assert res_login.status_code == 200
    data_login = res_login.json()
    assert "access_token" in data_login
    login_token = data_login["access_token"]

    # 4. Login with invalid password rejected (401)
    res_bad_pw = client.post(
        "/api/v1/auth/login",
        json={"email": "student1@campus.edu", "password": "WrongPassword!"},
    )
    assert res_bad_pw.status_code == 401

    # 5. Retrieve current profile via /auth/me with Bearer token
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {login_token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "student1@campus.edu"

    # 6. /auth/me without token rejected (401)
    res_unauth = client.get("/api/v1/auth/me")
    assert res_unauth.status_code == 401

    # 7. Logout
    res_logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {login_token}"})
    assert res_logout.status_code == 200


def test_jwt_admin_authorization(client):
    """Verify that a user with role='admin' in their JWT can perform admin operations."""
    # Register an admin user
    res_admin_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "sysadmin@campus.edu",
            "password": "AdminPassword2026!",
            "full_name": "System Admin",
            "role": "admin",
        },
    )
    assert res_admin_reg.status_code == 201
    admin_token = res_admin_reg.json()["access_token"]

    # Perform an admin-only operation (create node) using the JWT bearer token
    res_node = client.post(
        "/api/v1/routing/nodes",
        json={"node_type": "junction", "latitude": 31.25, "longitude": 75.70},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_node.status_code == 201
    assert res_node.json()["node_type"] == "junction"

    # Ordinary student JWT cannot perform admin operation (403)
    res_student_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "regular_student@campus.edu",
            "password": "StudentPassword2026!",
            "full_name": "Regular Student",
            "role": "student",
        },
    )
    student_token = res_student_reg.json()["access_token"]

    res_student_forbidden = client.post(
        "/api/v1/routing/nodes",
        json={"node_type": "junction", "latitude": 31.25, "longitude": 75.70},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_student_forbidden.status_code == 403


def test_google_oauth_provider_unconfigured_and_mocked(client):
    """Verify Google sign-in returns 503 when unconfigured, and works with verified claims mock."""
    google_auth_provider.set_mock_verifier(None)
    res_unconf = client.post("/api/v1/auth/google", json={"id_token": "dummy_google_token"})
    assert res_unconf.status_code == 503
    assert "not configured" in res_unconf.json()["detail"].lower()

    # With verified mock claims
    mock_claims = {
        "sub": "google-user-98765",
        "email": "google_user@campus.edu",
        "name": "Google User",
        "email_verified": True,
    }
    google_auth_provider.set_mock_verifier(lambda tok: mock_claims)

    res_mocked = client.post("/api/v1/auth/google", json={"id_token": "valid_mock_token"})
    assert res_mocked.status_code == 200
    data = res_mocked.json()
    assert "access_token" in data
    assert data["user"]["email"] == "google_user@campus.edu"

    # Clean up mock
    google_auth_provider.set_mock_verifier(None)


def test_phone_otp_provider_unconfigured_and_mocked(client):
    """Verify Phone OTP returns 503 when unconfigured, and works with mock provider."""
    phone_otp_provider.set_mock_handlers(None, None)
    res_send_unconf = client.post("/api/v1/auth/phone/send-otp", json={"phone": "+919876543210"})
    assert res_send_unconf.status_code == 503

    # With mock handlers
    phone_otp_provider.set_mock_handlers(
        sender=lambda p: True,
        verifier=lambda p, code: code == "123456",
    )

    res_send = client.post("/api/v1/auth/phone/send-otp", json={"phone": "+919876543210"})
    assert res_send.status_code == 200

    # Invalid OTP code fails 400
    res_verify_bad = client.post(
        "/api/v1/auth/phone/verify-otp",
        json={"phone": "+919876543210", "otp_code": "000000"},
    )
    assert res_verify_bad.status_code == 400

    # Valid OTP code succeeds
    res_verify_ok = client.post(
        "/api/v1/auth/phone/verify-otp",
        json={"phone": "+919876543210", "otp_code": "123456", "full_name": "Mobile Student"},
    )
    assert res_verify_ok.status_code == 200
    data = res_verify_ok.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "+919876543210"

    # Clean up mock
    phone_otp_provider.set_mock_handlers(None, None)


def test_security_manager_session_tokens_and_oauth_state():
    """Verify SecurityManager generates signed state and session tokens."""
    sec = get_security_manager()
    state = sec.generate_oauth_state()
    assert sec.verify_oauth_state(state) is True
    assert sec.verify_oauth_state("tampered.state") is False

    raw, h = sec.generate_token_pair()
    assert len(raw) > 10
    assert h == hash_session_token(raw)

    sess = sec.create_session_token("user-uuid-123", raw_token=raw)
    data = sec.extract_session_token_data(sess)
    assert data is not None
    assert data["user_id"] == "user-uuid-123"
    assert data["token_hash"] == h
