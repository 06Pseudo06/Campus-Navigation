from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings


client = TestClient(app)


def test_health_endpoint_lightweight():
    """Verify /health is lightweight, returns 200, and does not require database query."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_readiness_endpoint_healthy(db):
    """Verify /ready and /api/v1/ready return HTTP 200 when database connectivity is operational."""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"

    # API v1 alias
    response_v1 = client.get("/api/v1/ready")
    assert response_v1.status_code == 200
    assert response_v1.json()["status"] == "ready"


def test_readiness_endpoint_database_failure():
    """Verify /ready returns HTTP 503 without leaking credentials or stack traces on failure."""
    with patch("app.main.engine.connect") as mock_connect:
        mock_connect.side_effect = Exception("psycopg2.OperationalError: connection to password=secret_password@db failed")
        response = client.get("/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "not_ready"
        assert data["database"] == "disconnected"
        assert data["detail"] == "Database connectivity check failed"
        # Crucial check: verify sensitive credentials are NEVER leaked
        assert "secret_password" not in response.text
        assert "OperationalError" not in response.text
        assert "Traceback" not in response.text


def test_production_secrets_validation_fails_on_dev_defaults():
    """Verify that in production mode, startup fails safely on missing or dev credentials."""
    # Dev ADMIN_API_KEY rejected in production
    with pytest.raises(ValueError, match="ADMIN_API_KEY"):
        s = Settings(
            ENVIRONMENT="production",
            ADMIN_API_KEY="campusway-admin-dev-secret",
            JWT_SECRET_KEY="a" * 32,
            SESSION_SECRET="b" * 32,
            DATABASE_URL="postgresql://user:pass@host:5432/db",
        )
        s.validate_production_startup()

    # Dev JWT_SECRET_KEY rejected in production
    with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
        s = Settings(
            ENVIRONMENT="production",
            ADMIN_API_KEY="valid-admin-key-16chars",
            JWT_SECRET_KEY="campusway-default-jwt-secret-replace-in-production-min32chars",
            SESSION_SECRET="b" * 32,
            DATABASE_URL="postgresql://user:pass@host:5432/db",
        )
        s.validate_production_startup()

    # Dev SESSION_SECRET rejected in production
    with pytest.raises(ValueError, match="SESSION_SECRET"):
        s = Settings(
            ENVIRONMENT="production",
            ADMIN_API_KEY="valid-admin-key-16chars",
            JWT_SECRET_KEY="a" * 32,
            SESSION_SECRET="campusway-dev-secret-key-must-be-changed-in-production-min-32-chars",
            DATABASE_URL="postgresql://user:pass@host:5432/db",
        )
        s.validate_production_startup()

    # SQLite rejected in production
    with pytest.raises(ValueError, match="SQLite is not permitted"):
        s = Settings(
            ENVIRONMENT="production",
            ADMIN_API_KEY="valid-admin-key-16chars",
            JWT_SECRET_KEY="a" * 32,
            SESSION_SECRET="b" * 32,
            DATABASE_URL="sqlite:///test.db",
        )
        s.validate_production_startup()

    # Strong production secrets succeed without raising
    valid_prod = Settings(
        ENVIRONMENT="production",
        ADMIN_API_KEY="a-very-secure-admin-api-key-16",
        JWT_SECRET_KEY="a-very-strong-production-jwt-secret-key-32chars",
        SESSION_SECRET="a-very-strong-production-session-secret-key-32chars",
        DATABASE_URL="postgresql+psycopg2://user:pass@remote.host:5432/db",
    )
    valid_prod.validate_production_startup()
