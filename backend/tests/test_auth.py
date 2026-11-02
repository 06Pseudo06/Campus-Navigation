import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.config import Settings, get_settings
from app.services.user_store import get_user_repository
from app.services.google_auth import get_google_oauth_service
from app.schemas.user import GoogleUserInfo


# Test configuration with mock credentials
def get_test_settings() -> Settings:
    return Settings(
        ENVIRONMENT="test",
        FRONTEND_URL="http://localhost:3000",
        GOOGLE_CLIENT_ID="mock-client-id-for-testing.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET="mock-client-secret-123456",
        GOOGLE_REDIRECT_URI="http://localhost:8000/api/v1/auth/google/callback",
        SESSION_SECRET="test-secret-key-32-chars-long-testing-12345",
    )


def get_unconfigured_settings() -> Settings:
    return Settings(
        ENVIRONMENT="test",
        FRONTEND_URL="http://localhost:3000",
        GOOGLE_CLIENT_ID="",
        GOOGLE_CLIENT_SECRET="",
    )


@pytest.fixture(autouse=True)
def reset_user_repo():
    """Ensure in-memory repository is empty before each test."""
    repo = get_user_repository()
    repo.clear()
    yield
    repo.clear()


@pytest.fixture
def client():
    app.dependency_overrides[get_settings] = get_test_settings
    yield TestClient(app, follow_redirects=False)
    app.dependency_overrides.clear()


# =====================================================================
# 1. Health Endpoint Tests
# =====================================================================

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "campusway-backend"
    assert data["google_auth_configured"] is True

    # Test v1 alias
    v1_response = client.get("/api/v1/health")
    assert v1_response.status_code == 200
    assert v1_response.json()["status"] == "healthy"


# =====================================================================
# 2. Unconfigured Credentials Failure Handling
# =====================================================================

def test_google_login_unconfigured_redirects_with_error():
    app.dependency_overrides[get_settings] = get_unconfigured_settings
    unconfigured_client = TestClient(app, follow_redirects=False)

    response = unconfigured_client.get("/api/v1/auth/google/login")
    assert response.status_code == 302
    assert response.headers["location"] == "http://localhost:3000/login?error=google_not_configured"

    app.dependency_overrides.clear()


# =====================================================================
# 3. Google Login Initiation & State Protection
# =====================================================================

def test_google_login_initiates_oauth_state_and_redirects(client):
    response = client.get("/api/v1/auth/google/login")
    assert response.status_code == 302

    # Check redirect URL targets Google OAuth
    redirect_url = response.headers["location"]
    assert "https://accounts.google.com/o/oauth2/v2/auth" in redirect_url
    assert "client_id=mock-client-id-for-testing" in redirect_url
    assert "prompt=select_account" in redirect_url
    assert "state=" in redirect_url

    # Check state cookie is set securely
    state_cookie = response.cookies.get("campusway_oauth_state")
    assert state_cookie is not None


# =====================================================================
# 4. OAuth Callback Error Handling
# =====================================================================

def test_callback_handles_user_cancellation(client):
    response = client.get("/api/v1/auth/google/callback?error=access_denied")
    assert response.status_code == 302
    assert response.headers["location"] == "http://localhost:3000/login?error=cancelled"


def test_callback_rejects_missing_state(client):
    response = client.get("/api/v1/auth/google/callback?code=some-code")
    assert response.status_code == 302
    assert response.headers["location"] == "http://localhost:3000/login?error=invalid_state"


def test_callback_rejects_state_mismatch(client):
    # Set a cookie with state A but provide state B in query
    client.cookies.set("campusway_oauth_state", "state-A")
    response = client.get("/api/v1/auth/google/callback?code=some-code&state=state-B")
    assert response.status_code == 302
    assert response.headers["location"] == "http://localhost:3000/login?error=invalid_state"


def test_callback_rejects_missing_code(client):
    # Initiate login to get valid state
    login_resp = client.get("/api/v1/auth/google/login")
    state_cookie = login_resp.cookies.get("campusway_oauth_state")

    client.cookies.set("campusway_oauth_state", state_cookie)
    response = client.get(f"/api/v1/auth/google/callback?state={state_cookie}")
    assert response.status_code == 302
    assert response.headers["location"] == "http://localhost:3000/login?error=missing_code"


# =====================================================================
# 5. Successful Callback & Temporary User Creation
# =====================================================================

def test_successful_callback_creates_user_and_session(client):
    # 1. Initiate login to obtain signed state
    login_resp = client.get("/api/v1/auth/google/login")
    state_cookie = login_resp.cookies.get("campusway_oauth_state")

    # 2. Mock GoogleOAuthService
    mock_google_service = MagicMock()
    mock_google_service.exchange_code_for_tokens = AsyncMock(
        return_value={"id_token": "mock.jwt.id_token", "access_token": "mock-access-token"}
    )
    mock_google_service.verify_id_token = MagicMock(
        return_value=GoogleUserInfo(
            sub="google-sub-987654321",
            email="student@university.edu",
            email_verified=True,
            name="Alex Student",
            picture="https://lh3.googleusercontent.com/photo.jpg",
        )
    )

    app.dependency_overrides[get_google_oauth_service] = lambda: mock_google_service

    # 3. Simulate callback
    client.cookies.set("campusway_oauth_state", state_cookie)
    callback_resp = client.get(
        f"/api/v1/auth/google/callback?code=mock-auth-code&state={state_cookie}"
    )

    assert callback_resp.status_code == 302
    assert "auth=success" in callback_resp.headers["location"]

    # Verify session cookie was set
    session_cookie = callback_resp.cookies.get("campusway_session")
    assert session_cookie is not None

    # Verify user was created in temporary repository
    user_repo = get_user_repository()
    created_user = user_repo.get_by_google_sub("google-sub-987654321")
    assert created_user is not None
    assert created_user.email == "student@university.edu"
    assert created_user.name == "Alex Student"


# =====================================================================
# 6. Idempotency: Duplicate Login with Same Google Sub
# =====================================================================

def test_duplicate_login_does_not_create_duplicate_user(client):
    user_repo = get_user_repository()
    user_info = GoogleUserInfo(
        sub="google-sub-11111",
        email="faculty@university.edu",
        email_verified=True,
        name="Prof. Smith",
    )

    # First login
    user1 = user_repo.get_or_create_from_google(user_info)
    assert len(user_repo._users_by_id) == 1

    # Second login with updated name
    updated_info = GoogleUserInfo(
        sub="google-sub-11111",
        email="faculty@university.edu",
        email_verified=True,
        name="Prof. Jonathan Smith",
    )
    user2 = user_repo.get_or_create_from_google(updated_info)

    # Should update same user, not create a second record
    assert len(user_repo._users_by_id) == 1
    assert user1.id == user2.id
    assert user2.name == "Prof. Jonathan Smith"


# =====================================================================
# 7. Current User (/auth/me) & Logout (/auth/logout)
# =====================================================================

def test_auth_me_rejects_unauthenticated(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_auth_me_returns_profile_for_valid_session(client):
    # Pre-populate user
    user_repo = get_user_repository()
    user = user_repo.get_or_create_from_google(
        GoogleUserInfo(
            sub="sub-test-222",
            email="visitor@example.com",
            email_verified=True,
            name="Jordan Visitor",
        )
    )

    # Create session cookie
    from app.core.security import get_security_manager
    sec = get_security_manager()
    session_token = sec.create_session_token(user.id, user.google_sub)

    client.cookies.set("campusway_session", session_token)
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user.id
    assert data["email"] == "visitor@example.com"
    assert data["name"] == "Jordan Visitor"


def test_logout_clears_session(client):
    # Setup session
    user_repo = get_user_repository()
    user = user_repo.get_or_create_from_google(
        GoogleUserInfo(sub="sub-logout", email="logout@example.com")
    )
    from app.core.security import get_security_manager
    sec = get_security_manager()
    session_token = sec.create_session_token(user.id, user.google_sub)
    client.cookies.set("campusway_session", session_token)

    # Logout
    logout_resp = client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200
    assert logout_resp.json()["success"] is True

    # Check session cookie deleted/invalidated
    cookie_header = logout_resp.headers.get("set-cookie", "")
    assert "campusway_session" in cookie_header
    assert 'max-age=0' in cookie_header.lower() or 'expires=' in cookie_header.lower()


# =====================================================================
# 8. Email / Password Registration & Login Tests
# =====================================================================

def test_register_creates_user_and_session(client):
    payload = {
        "full_name": "Taylor Swift",
        "email": "taylor@campus.edu",
        "password": "SuperSecretPassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["email"] == "taylor@campus.edu"
    assert data["name"] == "Taylor Swift"
    assert "password_hash" not in data
    assert "id" in data

    # Check session cookie is set
    session_cookie = response.cookies.get("campusway_session")
    assert session_cookie is not None

    # Check user is in repository
    user_repo = get_user_repository()
    created_user = user_repo.get_by_email("taylor@campus.edu")
    assert created_user is not None
    assert created_user.password_hash is not None


def test_register_rejects_duplicate_email(client):
    payload = {
        "full_name": "First User",
        "email": "duplicate@campus.edu",
        "password": "Password123!",
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


def test_register_validates_password_length(client):
    payload = {
        "full_name": "Short Password",
        "email": "short@campus.edu",
        "password": "short",  # < 8 chars
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client):
    # First register user
    reg_payload = {
        "full_name": "Login Tester",
        "email": "login_test@campus.edu",
        "password": "ValidPassword999!",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201

    # Login
    login_payload = {
        "email": "login_test@campus.edu",
        "password": "ValidPassword999!",
        "remember_me": False,
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200

    data = login_resp.json()
    assert data["email"] == "login_test@campus.edu"
    assert data["name"] == "Login Tester"

    session_cookie = login_resp.cookies.get("campusway_session")
    assert session_cookie is not None


def test_login_invalid_password(client):
    reg_payload = {
        "full_name": "Tester",
        "email": "invalid_pw@campus.edu",
        "password": "CorrectPassword123!",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "invalid_pw@campus.edu", "password": "WrongPassword!"},
    )
    assert login_resp.status_code == 401
    assert "Invalid email or password" in login_resp.json()["detail"]


def test_login_nonexistent_email(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@campus.edu", "password": "AnyPassword123!"},
    )
    assert login_resp.status_code == 401
    assert "Invalid email or password" in login_resp.json()["detail"]


def test_login_google_only_user_requires_google(client):
    # User created via Google OAuth (no password hash)
    user_repo = get_user_repository()
    user_repo.get_or_create_from_google(
        GoogleUserInfo(
            sub="google-only-sub-123",
            email="google_only@campus.edu",
            name="Google User",
        )
    )

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "google_only@campus.edu", "password": "SomePassword123!"},
    )
    assert login_resp.status_code == 400
    assert "Google Sign-In" in login_resp.json()["detail"]


def test_login_remember_me_cookie_duration(client):
    reg_payload = {
        "full_name": "Remember Me User",
        "email": "remember@campus.edu",
        "password": "Password123!",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "remember@campus.edu",
            "password": "Password123!",
            "remember_me": True,
        },
    )
    assert login_resp.status_code == 200
    cookie_header = login_resp.headers.get("set-cookie", "")
    assert "campusway_session" in cookie_header
    # 30 days = 2592000 seconds
    assert "max-age=2592000" in cookie_header.lower()


def test_register_and_access_protected_me_endpoint(client):
    reg_payload = {
        "full_name": "Protected Access",
        "email": "protected@campus.edu",
        "password": "Password123!",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    session_cookie = reg_resp.cookies.get("campusway_session")

    client.cookies.set("campusway_session", session_cookie)
    me_resp = client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "protected@campus.edu"
    assert me_resp.json()["name"] == "Protected Access"
