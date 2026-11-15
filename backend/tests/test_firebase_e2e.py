"""End-to-end integration verification contract for Firebase Authentication & PostgreSQL persistence."""

import pytest
from app.services.firebase_auth import set_mock_firebase_verifier


def test_firebase_e2e_google_lifecycle(client):
    """Verify complete Google OAuth user lifecycle: registration, profile retrieval, idempotency."""
    google_claims = {
        "uid": "google-oauth-uid-12345",
        "email": "sarah.chen@university.edu",
        "email_verified": True,
        "name": "Sarah Chen",
        "phone_number": None,
        "sign_in_provider": "google.com",
    }
    set_mock_firebase_verifier(lambda tok: google_claims)

    try:
        # 1. Sign in with Google Firebase token
        resp = client.post("/api/v1/auth/firebase", json={"id_token": "valid_mock_google_jwt"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "sarah.chen@university.edu"
        assert data["user"]["full_name"] == "Sarah Chen"
        user_id = data["user"]["id"]
        token = data["access_token"]

        # 2. Authenticate against /api/v1/auth/me using issued Bearer token
        me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["id"] == user_id
        assert me_resp.json()["email"] == "sarah.chen@university.edu"

        # 3. Subsequent sign-in with updated profile data updates user and preserves unique ID
        google_claims["name"] = "Dr. Sarah Chen"
        resp2 = client.post("/api/v1/auth/firebase", json={"id_token": "valid_mock_google_jwt_updated"})
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["user"]["id"] == user_id
        assert data2["user"]["full_name"] == "Dr. Sarah Chen"
    finally:
        set_mock_firebase_verifier(None)


def test_firebase_e2e_phone_otp_lifecycle(client):
    """Verify complete Phone OTP lifecycle: registration, profile retrieval, and identity linking."""
    phone_claims = {
        "uid": "phone-otp-uid-67890",
        "email": None,
        "email_verified": False,
        "name": None,
        "phone_number": "+919876543299",
        "sign_in_provider": "phone",
    }
    set_mock_firebase_verifier(lambda tok: phone_claims)

    try:
        # 1. Sign in with Phone OTP token
        resp = client.post("/api/v1/auth/firebase", json={"id_token": "valid_mock_phone_jwt"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["phone"] == "+919876543299"
        assert "Campus Visitor" in data["user"]["full_name"]
        token = data["access_token"]

        # 2. Authenticate against /api/v1/auth/me
        me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["phone"] == "+919876543299"
    finally:
        set_mock_firebase_verifier(None)


def test_firebase_e2e_invalid_token(client):
    """Verify invalid or unparseable Firebase tokens are rejected with HTTP 401."""
    # When no mock is active and unverified token passed
    resp = client.post("/api/v1/auth/firebase", json={"id_token": "invalid_garbled_token_string"})
    assert resp.status_code == 401
