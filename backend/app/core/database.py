import socket
import ssl
from collections.abc import AsyncGenerator
from typing import Any, Dict, Optional
from sqlalchemy.engine.url import URL, make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings
from app.models.base import Base


def normalize_database_url(raw_url: str) -> tuple[URL, Dict[str, Any]]:
    """
    Normalizes a standard PostgreSQL connection URL for SQLAlchemy + asyncpg.
    
    - Converts 'postgresql://' or 'postgres://' dialect to 'postgresql+asyncpg://'.
    - Strips libpq-only query parameters (e.g., 'sslmode', 'channel_binding') that
      asyncpg rejects as unexpected keyword arguments.
    - For Neon PostgreSQL:
      - Resolves the IPv4 address to avoid Windows dual-stack IPv6 connection timeouts.
      - Sets Neon endpoint routing via server_settings['options'] = 'endpoint=<endpoint_id>'.
      - Configures a secure SSLContext with CA certificate verification.
    """
    if not raw_url:
        raise ValueError("DATABASE_URL is not configured.")

    url = make_url(raw_url)

    # 1. Ensure asyncpg driver
    if url.drivername in ("postgresql", "postgres"):
        url = url.set(drivername="postgresql+asyncpg")

    connect_args: Dict[str, Any] = {}

    # 2. Extract and translate SSL requirements for asyncpg
    ssl_mode = url.query.get("sslmode")
    original_host = url.host or ""
    is_neon = "neon.tech" in original_host

    # Database connect timeout (5.0 seconds) ensures fast error propagation on unreachable networks
    connect_args["timeout"] = 5.0

    if is_neon:
        endpoint_id = original_host.split(".")[0]
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl"] = ctx
        connect_args["server_settings"] = {"options": f"endpoint={endpoint_id}"}
    elif ssl_mode in ("require", "verify-ca", "verify-full"):
        connect_args["ssl"] = "require"
    elif ssl_mode == "disable":
        connect_args["ssl"] = False

    # 3. Strip libpq-specific parameters unsupported by asyncpg.connect()
    libpq_params_to_remove = [
        "sslmode",
        "channel_binding",
        "target_session_attrs",
        "gssencmode",
    ]
    url = url.difference_update_query(libpq_params_to_remove)

    return url, connect_args


def build_async_engine(raw_url: str) -> AsyncEngine:
    """
    Creates an AsyncEngine configured for Neon PostgreSQL and serverless pooling.
    
    - pool_pre_ping=True: Recovers automatically from suspended serverless compute or closed connections.
    - pool_recycle=300: Recycles connections every 5 minutes to prevent stale TCP sockets.
    - echo=False: Avoids exposing sensitive data or queries in logs.
    """
    url, connect_args = normalize_database_url(raw_url)

    return create_async_engine(
        url,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False,
    )


_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> AsyncEngine:
    """Returns the singleton AsyncEngine instance, initializing it if necessary."""
    global _engine
    if _engine is None:
        settings = get_settings()
        if not settings.DATABASE_URL:
            raise ValueError(
                "DATABASE_URL is not configured in settings. "
                "Please configure DATABASE_URL in backend/.env."
            )
        _engine = build_async_engine(settings.DATABASE_URL)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Returns the singleton async_sessionmaker instance."""
    global _session_factory
    if _session_factory is None:
        engine = get_engine()
        _session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _session_factory


# Initialize module-level engine and AsyncSessionLocal if settings has DATABASE_URL
_settings = get_settings()
if _settings.DATABASE_URL:
    try:
        engine: Optional[AsyncEngine] = build_async_engine(_settings.DATABASE_URL)
        AsyncSessionLocal: Optional[async_sessionmaker[AsyncSession]] = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
        _engine = engine
        _session_factory = AsyncSessionLocal
    except Exception:
        engine = None
        AsyncSessionLocal = None
else:
    engine = None
    AsyncSessionLocal = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an active SQLAlchemy AsyncSession.
    Guarantees session cleanup and rollback on unhandled exceptions.
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
