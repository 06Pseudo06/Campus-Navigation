
"""
Synchronous database session for location, routing, and other sync services.

The existing service layer (location_service, graph_service, etc.) uses synchronous
SQLAlchemy ORM operations (db.query, db.commit). This module provides a sync engine
and session factory so those services work correctly.

For local development, falls back to SQLite if DATABASE_URL is not configured.
"""

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config import get_settings


def _make_sync_url(url: str) -> str:
    """
    Normalize database URLs for synchronous SQLAlchemy connections.

    The project uses psycopg2-binary, so PostgreSQL URLs must explicitly
    use the psycopg2 driver.
    """

    if not url:
        return ""

    url = url.strip()

    # Normalize PostgreSQL shorthand used by providers like Neon and Heroku.
    if url.startswith("postgres://"):
        url = url.replace(
            "postgres://",
            "postgresql://",
            1,
        )

    # Convert asynchronous PostgreSQL URLs to synchronous psycopg2 URLs.
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace(
            "postgresql+asyncpg://",
            "postgresql+psycopg2://",
            1,
        )

    # Convert psycopg 3 URLs to psycopg2 URLs.
    elif url.startswith("postgresql+psycopg://"):
        url = url.replace(
            "postgresql+psycopg://",
            "postgresql+psycopg2://",
            1,
        )

    # Explicitly select psycopg2 for generic PostgreSQL URLs.
    elif url.startswith("postgresql://"):
        url = url.replace(
            "postgresql://",
            "postgresql+psycopg2://",
            1,
        )

    return url


# Load application settings.
_settings = get_settings()
_raw_url = (_settings.DATABASE_URL or "").strip()


# Configure the synchronous database connection.
if _raw_url and not _raw_url.startswith("your-"):
    _sync_url = _make_sync_url(_raw_url)

else:
    # SQLite fallback for local development when no database URL is configured.
    _db_path = os.path.join(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(__file__)
            )
        ),
        "campusway_dev.db",
    )

    _sync_url = f"sqlite:///{_db_path}"


# Configure connection arguments.
_connect_args = {}

if _sync_url.startswith("sqlite"):
    _connect_args = {
        "check_same_thread": False,
    }


# Create synchronous SQLAlchemy engine.
sync_engine = create_engine(
    _sync_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    echo=False,
)


# Create synchronous session factory.
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


def get_sync_db() -> Generator[Session, None, None]:
    """
    Yield a synchronous database session.

    Used as a FastAPI dependency.
    """

    db = SyncSessionLocal()

    try:
        yield db

    finally:
        db.close()
