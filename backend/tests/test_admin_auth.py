"""Integration and security tests for administrative RBAC, audit logging, and dashboard."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token, get_security_manager, hash_password
from app.main import app
from app.services.user_store import get_in_memory_user_repository


@pytest.fixture(autouse=True)
def setup_users(client):
    repo = get_in_memory_user_repository()
    repo.clear()
    # Seed admin user
    repo.create_email_user(
        email="admin@campusway.lpu.in",
        name="Campus Admin",
        password_hash=hash_password("AdminPass123!"),
        role="admin",
    )
    # Seed student user
    repo.create_email_user(
        email="student@campusway.lpu.in",
        name="Regular Student",
        password_hash=hash_password("StudentPass123!"),
        role="student",
    )


def test_unauthenticated_admin_access_rejected(client):
    """Anonymous visitors must receive 401 Unauthorized when accessing admin endpoints."""
    res = client.get("/api/v1/admin/dashboard")
    assert res.status_code == 401


def test_student_forbidden_from_admin_dashboard(client):
    """Authenticated non-admin students must receive 403 Forbidden."""
    student_token = create_access_token({"sub": "student-1", "email": "student@campusway.lpu.in", "role": "student"})
    res = client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403
    assert "Insufficient administrative privileges" in res.json().get("detail", "")


def test_admin_api_key_access_granted(client):
    """Admin access granted via X-Admin-Key header."""
    res = client.get("/api/v1/admin/dashboard", headers={"X-Admin-Key": settings.ADMIN_API_KEY})
    assert res.status_code == 200
    data = res.json()
    assert "users" in data
    assert "locations" in data
    assert "routing" in data
    assert "system" in data


def test_admin_jwt_bearer_access_granted(client):
    """Admin access granted via valid JWT with role='admin'."""
    admin_token = create_access_token({"sub": "admin-1", "email": "admin@campusway.lpu.in", "role": "admin"})
    res = client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200


def test_admin_cookie_session_access_granted(client):
    """Admin access granted via session cookie."""
    repo = get_in_memory_user_repository()
    admin_user = repo.get_by_email("admin@campusway.lpu.in")
    assert admin_user is not None

    security_manager = get_security_manager()
    raw_token, _ = security_manager.generate_token_pair()
    session_cookie = security_manager.create_session_token(admin_user.id, raw_token=raw_token)

    res = client.get("/api/v1/admin/dashboard", cookies={settings.SESSION_COOKIE_NAME: session_cookie})
    assert res.status_code == 200


def test_cannot_demote_last_administrator(client):
    """Security guard: System must refuse to demote the sole remaining administrator."""
    repo = get_in_memory_user_repository()
    admin_user = repo.get_by_email("admin@campusway.lpu.in")

    res = client.patch(
        f"/api/v1/admin/users/{admin_user.id}/role",
        headers={"X-Admin-Key": settings.ADMIN_API_KEY},
        json={"role": "student"},
    )
    assert res.status_code == 400
    assert "Cannot demote the last active administrator" in res.json().get("detail", "")


def test_cannot_deactivate_last_administrator(client):
    """Security guard: System must refuse to deactivate the sole remaining administrator."""
    repo = get_in_memory_user_repository()
    admin_user = repo.get_by_email("admin@campusway.lpu.in")

    res = client.patch(
        f"/api/v1/admin/users/{admin_user.id}/status",
        headers={"X-Admin-Key": settings.ADMIN_API_KEY},
        json={"is_active": False},
    )
    assert res.status_code == 400
    assert "Cannot deactivate the last active administrator" in res.json().get("detail", "")


def test_role_change_records_audit_trail(client):
    """Valid role updates record immutable entries in audit log."""
    repo = get_in_memory_user_repository()
    student_user = repo.get_by_email("student@campusway.lpu.in")

    res = client.patch(
        f"/api/v1/admin/users/{student_user.id}/role",
        headers={"X-Admin-Key": settings.ADMIN_API_KEY},
        json={"role": "moderator"},
    )
    assert res.status_code == 200
    assert res.json()["role"] == "moderator"

    # Verify audit log recorded
    audit_res = client.get("/api/v1/admin/audit-logs", headers={"X-Admin-Key": settings.ADMIN_API_KEY})
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert any(log["action"] == "user.role_change" for log in logs)
