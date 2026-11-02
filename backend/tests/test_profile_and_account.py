import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import Settings, get_settings
from app.services.user_store import get_user_repository
from app.core.security import hash_password


def get_test_settings() -> Settings:
    return Settings(
        ENVIRONMENT="test",
        FRONTEND_URL="http://localhost:3000",
        GOOGLE_CLIENT_ID="mock-client-id",
        GOOGLE_CLIENT_SECRET="mock-client-secret",
        SESSION_SECRET="test-secret-key-32-chars-long-testing-12345",
    )


@pytest.fixture(autouse=True)
def reset_user_repo():
    repo = get_user_repository()
    repo.clear()
    yield
    repo.clear()


@pytest.fixture
def client():
    app.dependency_overrides[get_settings] = get_test_settings
    yield TestClient(app, follow_redirects=False)
    app.dependency_overrides.clear()


def register_and_login_email_user(client, email="student@campus.edu", password="ValidPassword123!", name="Test Student"):
    res = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": name},
    )
    assert res.status_code == 201
    return res.json()


# =====================================================================
# 1. Profile Retrieval & Metadata (/me)
# =====================================================================

def test_me_returns_enriched_metadata(client):
    register_and_login_email_user(client)

    res = client.get("/api/v1/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "student@campus.edu"
    assert data["name"] == "Test Student"
    assert data["auth_provider"] == "email"
    assert data["has_password"] is True
    assert data["role"] == "student"
    assert data["session_id"] is not None
    assert data["session_id"].startswith("sess_")
    assert data["session_expires_at"] is not None


# =====================================================================
# 2. Profile Update (PATCH /profile)
# =====================================================================

def test_update_profile_success(client):
    register_and_login_email_user(client)

    res = client.patch(
        "/api/v1/auth/profile",
        json={"name": "Updated Name Here"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Updated Name Here"

    # Verify subsequent /me reflects updated name
    res_me = client.get("/api/v1/auth/me")
    assert res_me.status_code == 200
    assert res_me.json()["name"] == "Updated Name Here"


def test_update_profile_unauthenticated(client):
    res = client.patch(
        "/api/v1/auth/profile",
        json={"name": "Hacker"},
    )
    assert res.status_code == 401


def test_update_profile_empty_name_rejected(client):
    register_and_login_email_user(client)

    res = client.patch(
        "/api/v1/auth/profile",
        json={"name": "   "},
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


# =====================================================================
# 3. Change Password (POST /change-password)
# =====================================================================

def test_change_password_success(client):
    register_and_login_email_user(client, password="OldPassword123!")

    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "OldPassword123!",
            "new_password": "NewSecretPassword2026!",
        },
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Test login with old password fails
    client.cookies.clear()
    res_bad = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campus.edu", "password": "OldPassword123!"},
    )
    assert res_bad.status_code == 401

    # Test login with new password succeeds
    res_good = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campus.edu", "password": "NewSecretPassword2026!"},
    )
    assert res_good.status_code == 200


def test_change_password_wrong_current_password(client):
    register_and_login_email_user(client, password="OldPassword123!")

    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "WrongPassword!",
            "new_password": "NewSecretPassword2026!",
        },
    )
    assert res.status_code == 400
    assert "incorrect" in res.json()["detail"].lower()


def test_change_password_short_new_password_rejected(client):
    register_and_login_email_user(client, password="OldPassword123!")

    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "OldPassword123!",
            "new_password": "short",
        },
    )
    assert res.status_code in (400, 422)


def test_change_password_same_password_rejected(client):
    register_and_login_email_user(client, password="OldPassword123!")

    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "OldPassword123!",
            "new_password": "OldPassword123!",
        },
    )
    assert res.status_code == 400
    assert "same" in res.json()["detail"].lower()


def test_change_password_unauthenticated_rejected(client):
    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "OldPassword123!",
            "new_password": "NewSecretPassword2026!",
        },
    )
    assert res.status_code == 401


# =====================================================================
# 4. Account Deletion (DELETE /account)
# =====================================================================

def test_delete_account_success(client):
    register_and_login_email_user(client, password="ValidPassword123!")

    res = client.request(
        "DELETE",
        "/api/v1/auth/account",
        json={
            "password": "ValidPassword123!",
            "confirm_text": "DELETE",
        },
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Check session is no longer valid
    res_me = client.get("/api/v1/auth/me")
    assert res_me.status_code == 401

    # Check user cannot log in
    res_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campus.edu", "password": "ValidPassword123!"},
    )
    assert res_login.status_code == 401


def test_delete_account_wrong_password_rejected(client):
    register_and_login_email_user(client, password="ValidPassword123!")

    res = client.request(
        "DELETE",
        "/api/v1/auth/account",
        json={
            "password": "WrongPassword!",
            "confirm_text": "DELETE",
        },
    )
    assert res.status_code == 400
    assert "incorrect" in res.json()["detail"].lower()

    # User still exists
    res_me = client.get("/api/v1/auth/me")
    assert res_me.status_code == 200


def test_delete_account_missing_confirm_text_rejected(client):
    register_and_login_email_user(client, password="ValidPassword123!")

    res = client.request(
        "DELETE",
        "/api/v1/auth/account",
        json={
            "password": "ValidPassword123!",
            "confirm_text": "NO",
        },
    )
    assert res.status_code == 400
    assert "delete" in res.json()["detail"].lower()

