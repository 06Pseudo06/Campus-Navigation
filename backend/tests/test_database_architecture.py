from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine.url import make_url

from app.main import app
from app.core.config import Settings
from app.core.database import resolve_authoritative_database_url, get_engine


client = TestClient(app)


def test_production_rejects_localhost_default_database_url():
    """Verify production strictly rejects default localhost DATABASE_URL."""
    with pytest.raises(ValueError, match="Default or localhost database URLs are not permitted in production"):
        s = Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campusway_db",
            ADMIN_API_KEY="a" * 16,
            JWT_SECRET_KEY="b" * 32,
            SESSION_SECRET="c" * 32,
        )
        s.validate_production_database()

    # Also reject 127.0.0.1
    with pytest.raises(ValueError, match="Default or localhost database URLs are not permitted in production"):
        s = Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/campusway_db",
            ADMIN_API_KEY="a" * 16,
            JWT_SECRET_KEY="b" * 32,
            SESSION_SECRET="c" * 32,
        )
        s.validate_production_database()


def test_production_accepts_valid_neon_url():
    """Verify production accepts an explicitly configured remote Neon PostgreSQL URL."""
    neon_url = "postgresql+psycopg2://campus_user:safe_pass@ep-misty-block-azpqi807-pooler.c-3.ap-southeast-1.aws.neon.tech/campusway_db?sslmode=require"
    s = Settings(
        ENVIRONMENT="production",
        DATABASE_URL=neon_url,
        ADMIN_API_KEY="a" * 16,
        JWT_SECRET_KEY="b" * 32,
        SESSION_SECRET="c" * 32,
    )
    s.validate_production_database()
    s.validate_production_startup()
    assert s.is_production is True


def test_production_rejects_sqlite():
    """Verify production strictly rejects SQLite databases."""
    with pytest.raises(ValueError, match="SQLite is not permitted as a production database"):
        s = Settings(
            ENVIRONMENT="production",
            DATABASE_URL="sqlite:///campusway_prod.db",
            ADMIN_API_KEY="a" * 16,
            JWT_SECRET_KEY="b" * 32,
            SESSION_SECRET="c" * 32,
        )
        s.validate_production_database()

    with pytest.raises(ValueError, match="SQLite is not permitted as a production database"):
        s = Settings(
            ENVIRONMENT="production",
            DATABASE_URL="sqlite:///:memory:",
            ADMIN_API_KEY="a" * 16,
            JWT_SECRET_KEY="b" * 32,
            SESSION_SECRET="c" * 32,
        )
        s.validate_production_database()


def test_synchronous_engine_uses_selected_local_url():
    """Verify the synchronous engine receives the selected local PostgreSQL URL with psycopg2."""
    cfg = Settings(
        ENVIRONMENT="development",
        USE_LOCAL_DB=True,
        LOCAL_DATABASE_URL="postgresql://local_pg_user:local_pg_pass@postgres:5432/campusway_db",
    )
    sync_url, async_url, mode = resolve_authoritative_database_url(cfg=cfg)
    assert mode == "local_db"
    assert sync_url.startswith("postgresql+psycopg2://")
    u = make_url(sync_url)
    assert u.host == "postgres"
    assert u.port == 5432
    assert u.database == "campusway_db"
    assert u.username == "local_pg_user"


def test_asynchronous_engine_uses_same_selected_database():
    """Verify the asynchronous engine receives the same selected database with asyncpg."""
    cfg = Settings(
        ENVIRONMENT="development",
        USE_LOCAL_DB=True,
        LOCAL_DATABASE_URL="postgresql://local_pg_user:local_pg_pass@postgres:5432/campusway_db",
    )
    sync_url, async_url, mode = resolve_authoritative_database_url(cfg=cfg)
    assert mode == "local_db"
    assert async_url is not None
    assert async_url.startswith("postgresql+asyncpg://")

    # Authoritative consistency check: both sync and async must target identical DB endpoints
    sync_u = make_url(sync_url)
    async_u = make_url(async_url)
    assert sync_u.host == async_u.host == "postgres"
    assert sync_u.port == async_u.port == 5432
    assert sync_u.database == async_u.database == "campusway_db"
    assert sync_u.username == async_u.username == "local_pg_user"


def test_local_profile_does_not_silently_select_neon():
    """Verify that when local profile is active, backend connects to local container and never to Neon."""
    cfg = Settings(
        ENVIRONMENT="development",
        USE_LOCAL_DB=True,
        DATABASE_URL="postgresql+psycopg2://neon_user:neon_pass@ep-cool-block.neon.tech/neon_db",
        LOCAL_DATABASE_URL="postgresql://postgres:postgres_password@postgres:5432/local_campusway",
    )
    sync_url, async_url, mode = resolve_authoritative_database_url(cfg=cfg)
    assert mode == "local_db"
    assert "neon.tech" not in sync_url
    assert "neon.tech" not in (async_url or "")
    assert "postgres:5432" in sync_url
    assert "postgres:5432" in (async_url or "")


def test_default_neon_mode_does_not_select_local_postgres():
    """Verify that in default Neon mode, backend does not silently switch to local PostgreSQL."""
    cfg = Settings(
        ENVIRONMENT="development",
        USE_LOCAL_DB=False,
        DATABASE_URL="postgresql+psycopg2://neon_user:neon_pass@ep-cool-block.neon.tech/neon_db",
        LOCAL_DATABASE_URL="postgresql://postgres:postgres_password@postgres:5432/local_campusway",
    )
    with patch("app.core.database._probe_postgres", return_value=True):
        sync_url, async_url, mode = resolve_authoritative_database_url(cfg=cfg)
    assert mode == "neon"
    assert "neon.tech" in sync_url
    assert "neon.tech" in (async_url or "")
    assert "postgres:5432" not in sync_url
    assert "postgres:5432" not in (async_url or "")


def test_database_failure_returns_503_from_ready():
    """Verify that database connection failure returns HTTP 503 without leaking credentials or stack traces."""
    with patch("app.main.engine.connect") as mock_connect:
        mock_connect.side_effect = Exception("psycopg2.OperationalError: connection to password=secret_neon_password@ep-neon.tech failed")
        response = client.get("/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "not_ready"
        assert data["database"] == "disconnected"
        assert data["detail"] == "Database connectivity check failed"
        # Zero credentials or traceback leakage
        assert "secret_neon_password" not in response.text
        assert "OperationalError" not in response.text
        assert "Traceback" not in response.text
