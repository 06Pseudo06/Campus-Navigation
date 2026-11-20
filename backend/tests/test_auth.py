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

    # 6. /auth/me without token or cookie rejected (401)
    client.cookies.clear()
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


def test_google_oauth_provider_unconfigured_and_mocked(client, monkeypatch):
    """Verify Google sign-in returns 503 when unconfigured, and works with verified claims mock."""
    google_auth_provider.set_mock_verifier(None)
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "")
    res_unconf = client.post("/api/v1/auth/google", json={"id_token": "dummy_google_token"})
    assert res_unconf.status_code == 503
    assert "not configured" in res_unconf.json()["detail"].lower()
    monkeypatch.undo()

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


def test_15_core_auth_gate_criteria(client, monkeypatch):
    """
    Exhaustive verification of all 15 Core Authentication Gate criteria:
    1. Register with valid email/password -> 201 + session cookie + JWT.
    2. Register with duplicate email -> 400 error.
    3. Register with weak password (<8 chars) / invalid email -> 422 error.
    4. Login with valid credentials -> 200 + session cookie + JWT.
    5. Login with wrong password -> 401 unauthorized.
    6. Login with nonexistent email -> 401 unauthorized.
    7. Get /me with valid session cookie/token -> 200 + user profile.
    8. Get /me without session cookie/token -> 401 unauthorized.
    9. Logout -> 200 + session revoked + cookie cleared.
    10. Get /me after logout -> 401 unauthorized.
    11. Access admin endpoint with student role -> 403 forbidden.
    12. Google OAuth initiation (/api/v1/auth/google/login) -> 302 redirect with state cookie.
    13. Google OAuth callback with valid code -> 302 redirect to ${FRONTEND_URL}/explore?auth=success with session cookie.
    14. Google OAuth callback with invalid state -> 302 redirect to ${FRONTEND_URL}/login?error=invalid_state.
    15. Password hash verification -> stored hash is $argon2id$, never plaintext.
    """
    from app.services.google_auth import GoogleOAuthService
    from app.schemas.user import GoogleUserInfo

    client.cookies.clear()
    valid_email = "gate_test_user@campus.edu"
    valid_password = "ValidSecretPassword2026!"
    valid_name = "Gate Test User"

    # Criterion 1: Register with valid email/password -> 201 + session cookie + JWT
    res_reg = client.post(
        "/api/v1/auth/register",
        json={"email": valid_email, "password": valid_password, "full_name": valid_name, "role": "student"},
    )
    assert res_reg.status_code == 201, f"Expected 201 on valid register, got {res_reg.status_code}"
    reg_data = res_reg.json()
    assert "access_token" in reg_data and len(reg_data["access_token"]) > 20
    assert settings.SESSION_COOKIE_NAME in res_reg.cookies
    reg_jwt = reg_data["access_token"]
    reg_session_cookie = res_reg.cookies[settings.SESSION_COOKIE_NAME]

    # Criterion 2: Register with duplicate email -> 400 error
    res_dup = client.post(
        "/api/v1/auth/register",
        json={"email": valid_email, "password": valid_password, "full_name": valid_name},
    )
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"].lower()

    # Criterion 3: Register with weak password (<8 chars) / invalid email -> 422 error
    res_weak_pw = client.post(
        "/api/v1/auth/register",
        json={"email": "weak_pw@campus.edu", "password": "short", "full_name": "Short Pw User"},
    )
    assert res_weak_pw.status_code == 422

    res_bad_email = client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "ValidSecretPassword2026!", "full_name": "Bad Email"},
    )
    assert res_bad_email.status_code == 422

    # Criterion 4: Login with valid credentials -> 200 + session cookie + JWT
    client.cookies.clear()
    res_login = client.post(
        "/api/v1/auth/login",
        json={"email": valid_email, "password": valid_password},
    )
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert "access_token" in login_data and len(login_data["access_token"]) > 20
    assert settings.SESSION_COOKIE_NAME in res_login.cookies
    login_jwt = login_data["access_token"]
    login_session_cookie = res_login.cookies[settings.SESSION_COOKIE_NAME]

    # Criterion 5: Login with wrong password -> 401 unauthorized
    res_bad_pw = client.post(
        "/api/v1/auth/login",
        json={"email": valid_email, "password": "IncorrectPassword2026!"},
    )
    assert res_bad_pw.status_code == 401
    assert "invalid email or password" in res_bad_pw.json()["detail"].lower()

    # Criterion 6: Login with nonexistent email -> 401 unauthorized
    res_no_email = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_99999@campus.edu", "password": valid_password},
    )
    assert res_no_email.status_code == 401
    assert "invalid email or password" in res_no_email.json()["detail"].lower()

    # Criterion 7: Get /me with valid session cookie/token -> 200 + user profile
    # 7a: Via session cookie
    client.cookies.clear()
    client.cookies.set(settings.SESSION_COOKIE_NAME, login_session_cookie)
    res_me_cookie = client.get("/api/v1/auth/me")
    assert res_me_cookie.status_code == 200
    assert res_me_cookie.json()["email"] == valid_email

    # 7b: Via Bearer token
    client.cookies.clear()
    res_me_jwt = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_jwt}"},
    )
    assert res_me_jwt.status_code == 200
    assert res_me_jwt.json()["email"] == valid_email

    # Criterion 8: Get /me without session cookie/token -> 401 unauthorized
    client.cookies.clear()
    res_me_unauth = client.get("/api/v1/auth/me")
    assert res_me_unauth.status_code == 401

    # Criterion 9: Logout -> 200 + session revoked + cookie cleared
    client.cookies.set(settings.SESSION_COOKIE_NAME, login_session_cookie)
    res_logout = client.post("/api/v1/auth/logout")
    assert res_logout.status_code == 200
    assert res_logout.json()["success"] is True

    # Criterion 10: Get /me after logout -> 401 unauthorized (using revoked session cookie)
    client.cookies.set(settings.SESSION_COOKIE_NAME, login_session_cookie)
    res_me_after_logout = client.get("/api/v1/auth/me")
    assert res_me_after_logout.status_code == 401
    assert "revoked" in res_me_after_logout.json()["detail"].lower() or "expired" in res_me_after_logout.json()["detail"].lower()

    # Criterion 11: Access admin endpoint with student role -> 403 forbidden
    res_admin_forbidden = client.post(
        "/api/v1/routing/nodes",
        json={"node_type": "junction", "latitude": 31.25, "longitude": 75.70},
        headers={"Authorization": f"Bearer {login_jwt}"},
    )
    assert res_admin_forbidden.status_code == 403

    # Criterion 12: Google OAuth initiation (/api/v1/auth/google/login) -> 302 redirect with state cookie
    client.cookies.clear()
    res_google_init = client.get("/api/v1/auth/google/login", follow_redirects=False)
    assert res_google_init.status_code == 302
    assert "accounts.google.com" in res_google_init.headers.get("location", "")
    assert settings.STATE_COOKIE_NAME in res_google_init.cookies
    oauth_state = res_google_init.cookies[settings.STATE_COOKIE_NAME]

    # Criterion 13: Google OAuth callback with valid code -> 302 redirect to ${FRONTEND_URL}/explore?auth=success with session cookie
    async def mock_exchange(self, code: str):
        return {"id_token": "mock_id_token", "access_token": "mock_access_token"}

    def mock_verify(self, id_token_str: str):
        return GoogleUserInfo(
            sub="google-gate-user-12345",
            email="google_gate@campus.edu",
            email_verified=True,
            name="Google Gate User",
        )

    monkeypatch.setattr(GoogleOAuthService, "exchange_code_for_tokens", mock_exchange)
    monkeypatch.setattr(GoogleOAuthService, "verify_id_token", mock_verify)

    client.cookies.set(settings.STATE_COOKIE_NAME, oauth_state)
    res_google_cb = client.get(
        f"/api/v1/auth/google/callback?code=mock_valid_code&state={oauth_state}",
        follow_redirects=False,
    )
    assert res_google_cb.status_code == 302
    assert res_google_cb.headers.get("location") == f"{settings.FRONTEND_URL}/explore?auth=success"
    assert settings.SESSION_COOKIE_NAME in res_google_cb.cookies

    # Criterion 14: Google OAuth callback with invalid state -> 302 redirect to ${FRONTEND_URL}/login?error=invalid_state
    client.cookies.set(settings.STATE_COOKIE_NAME, oauth_state)
    res_google_bad_state = client.get(
        f"/api/v1/auth/google/callback?code=mock_valid_code&state=invalid_tampered_state",
        follow_redirects=False,
    )
    assert res_google_bad_state.status_code == 302
    assert res_google_bad_state.headers.get("location") == f"{settings.FRONTEND_URL}/login?error=invalid_state"

    # Criterion 15: Password hash verification -> stored hash is $argon2id$, never plaintext
    plain_secret = "UltraSecretVerificationKey999!"
    hashed_result = hash_password(plain_secret)
    assert hashed_result.startswith("$argon2id$")
    assert plain_secret not in hashed_result
    assert verify_password(plain_secret, hashed_result) is True
    assert verify_password("WrongKey!", hashed_result) is False
