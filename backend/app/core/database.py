"""Database session and connection management foundation.

Provides unified database access supporting:
1. Synchronous SQLAlchemy Engine, SessionLocal, get_db(), and session_scope() for all core campus services.
2. Asynchronous SQLAlchemy Engine, AsyncSessionLocal, and get_async_db() for serverless/async Neon operations.
3. Declarative Base with standard PostgreSQL metadata naming conventions.
"""

from contextlib import contextmanager
import socket
import ssl
from typing import Any, Dict, Generator, Optional
from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL, make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, settings
from app.models.base import Base


# =====================================================================
# Synchronous Engine & Session Management (Core CampusWay Services)
# =====================================================================

def _probe_postgres(url_str: str, timeout: float = 2.0) -> bool:
    try:
        import psycopg2
        u = make_url(url_str)
        host = u.host
        port = u.port or 5432
        if not host:
            return False
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.close()
        conn = psycopg2.connect(
            dbname=u.database,
            user=u.username,
            password=u.password,
            host=host,
            port=port,
            connect_timeout=int(timeout),
            sslmode="require",
        )
        conn.close()
        return True
    except Exception:
        return False


def resolve_authoritative_database_url(
    cfg: Optional[Settings] = None,
) -> tuple[str, Optional[str], str]:
    """Authoritative single-source database selection and URL resolution.
    
    Returns a 3-tuple:
        (sync_url, async_url, selected_mode)
        
    selected_mode:
        - 'local_db': Explicit local container PostgreSQL mode
        - 'neon': Default remote Neon PostgreSQL mode
        - 'sqlite_dev': Offline development fallback
    
    Rules:
    1. Explicit Local Development Mode:
       Activated ONLY when explicit local database selection is requested
       via settings.USE_LOCAL_DB or env USE_LOCAL_DB=true.
       In production mode, local container database is forbidden.
       In development mode, uses LOCAL_DATABASE_URL without connecting to Neon.
    2. Default Neon Mode:
       Uses the configured DATABASE_URL (Neon PostgreSQL).
       Does NOT probe or silently switch to local PostgreSQL.
    3. Consistent driver formatting:
       - sync_url uses 'postgresql+psycopg2://...'
       - async_url uses 'postgresql+asyncpg://...'
    """
    import os

    current_settings = cfg or settings
    use_local = getattr(current_settings, "USE_LOCAL_DB", False) or (
        os.getenv("USE_LOCAL_DB", "").lower() in ("true", "1", "yes")
    )

    # --- Mode B: Explicit Local Development Mode ---
    if use_local:
        if current_settings.is_production:
            raise ValueError("Production mode cannot use local database container.")

        raw_local = (
            getattr(current_settings, "LOCAL_DATABASE_URL", None)
            or os.getenv("LOCAL_DATABASE_URL")
            or "postgresql://postgres:postgres_password@postgres:5432/campusway_db"
        )

        base = raw_local
        if base.startswith("postgres://"):
            base = base.replace("postgres://", "postgresql://", 1)

        if base.startswith("postgresql://"):
            sync_url = base.replace("postgresql://", "postgresql+psycopg2://", 1)
            async_url = base.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif base.startswith("postgresql+psycopg2://"):
            sync_url = base
            async_url = base.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
        elif base.startswith("postgresql+asyncpg://"):
            sync_url = base.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            async_url = base
        else:
            sync_url = base
            async_url = base

        return sync_url, async_url, "local_db"

    # --- Mode A: Default Neon Mode ---
    if current_settings.is_production:
        current_settings.validate_production_database()

    raw_url = (current_settings.DATABASE_URL or "").strip()
    if not raw_url:
        if current_settings.is_production:
            raise ValueError("Production database configuration failed: DATABASE_URL must not be empty.")
        return "sqlite:///:memory:", None, "sqlite_dev"

    # Format PostgreSQL URLs
    if (
        raw_url.startswith("postgresql://")
        or raw_url.startswith("postgres://")
        or raw_url.startswith("postgresql+psycopg2://")
        or raw_url.startswith("postgresql+asyncpg://")
    ):
        # In development mode only: if Postgres is unreachable, allow dev SQLite fallback for offline unit tests
        if not current_settings.is_production and not _probe_postgres(raw_url):
            import logging, os
            logging.getLogger("campusway.database").warning(
                "PostgreSQL unreachable in development mode. Falling back to local SQLite for offline development."
            )
            dev_db = os.path.abspath("campusway_dev.db").replace("\\", "/")
            return f"sqlite:///{dev_db}", None, "sqlite_dev"

        base_pg = raw_url
        if base_pg.startswith("postgres://"):
            base_pg = base_pg.replace("postgres://", "postgresql://", 1)

        if base_pg.startswith("postgresql://"):
            sync_url = base_pg.replace("postgresql://", "postgresql+psycopg2://", 1)
            async_url = base_pg.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif base_pg.startswith("postgresql+psycopg2://"):
            sync_url = base_pg
            async_url = base_pg.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
        elif base_pg.startswith("postgresql+asyncpg://"):
            sync_url = base_pg.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            async_url = base_pg
        else:
            sync_url = base_pg
            async_url = base_pg

        return sync_url, async_url, "neon"

    if raw_url.startswith("sqlite"):
        if current_settings.is_production:
            raise ValueError("Production database configuration failed: SQLite is not permitted as a production database.")
        return raw_url, None, "sqlite_dev"

    raise ValueError("Unsupported database driver in configured DATABASE_URL.")


def resolve_database_url() -> str:
    """Backward-compatible helper returning the authoritative synchronous database URL."""
    return resolve_authoritative_database_url()[0]


sync_db_url, async_db_url, active_db_mode = resolve_authoritative_database_url()

engine_kwargs: Dict[str, Any] = {"pool_pre_ping": settings.DB_POOL_PRE_PING}
if not sync_db_url.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "connect_args": {"connect_timeout": 5},
    })

engine = create_engine(sync_db_url, **engine_kwargs)
if sync_db_url.startswith("sqlite"):
    import app.models  # ensure models are imported
    Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database session in FastAPI endpoints with strict transaction boundary."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations outside FastAPI request lifecycles."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# =====================================================================
# Asynchronous Engine & Session Management (Neon Async Operations)
# =====================================================================

def normalize_database_url(raw_url: str) -> tuple[URL, Dict[str, Any]]:
    """Normalizes PostgreSQL connection URL for asyncpg and Neon serverless endpoints."""
    if not raw_url:
        raise ValueError("DATABASE_URL is not configured.")

    url = make_url(raw_url)
    if url.drivername in ("postgresql", "postgres", "postgresql+psycopg2"):
        url = url.set(drivername="postgresql+asyncpg")
    elif url.drivername.startswith("sqlite"):
        raise ValueError("Async engine only supports PostgreSQL. SQLite does not support asyncpg operations.")

    connect_args: Dict[str, Any] = {}
    ssl_mode = url.query.get("sslmode")
    original_host = url.host or ""
    is_neon = "neon.tech" in original_host

    if is_neon:
        endpoint_id = original_host.split(".")[0]
        try:
            addr_info = socket.getaddrinfo(original_host, url.port or 5432, socket.AF_INET)
            if addr_info:
                ipv4 = addr_info[0][4][0]
                url = url.set(host=ipv4)
        except Exception:
            pass

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl"] = ctx
        connect_args["server_settings"] = {"options": f"endpoint={endpoint_id}"}
        connect_args["timeout"] = 5
    elif ssl_mode in ("require", "verify-ca", "verify-full"):
        connect_args["ssl"] = "require"
    elif ssl_mode == "disable":
        connect_args["ssl"] = False

    libpq_params_to_remove = [
        "sslmode",
        "channel_binding",
        "target_session_attrs",
        "gssencmode",
    ]
    url = url.difference_update_query(libpq_params_to_remove)
    return url, connect_args


_async_engine = None
_async_session_factory = None

try:
    from sqlalchemy.ext.asyncio import (
        AsyncEngine,
        AsyncSession,
        async_sessionmaker,
        create_async_engine,
    )

    def build_async_engine(raw_url: str) -> AsyncEngine:
        url, connect_args = normalize_database_url(raw_url)
        return create_async_engine(
            url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False,
        )

    def get_engine() -> AsyncEngine:
        global _async_engine
        if _async_engine is None:
            sync_url, async_url, mode = resolve_authoritative_database_url()
            if not async_url:
                raise ValueError(
                    f"Async engine requires PostgreSQL with asyncpg. No async URL available for mode '{mode}'."
                )
            _async_engine = build_async_engine(async_url)
        return _async_engine

    def get_session_factory() -> async_sessionmaker[AsyncSession]:
        global _async_session_factory
        if _async_session_factory is None:
            eng = get_engine()
            _async_session_factory = async_sessionmaker(
                bind=eng,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
                autocommit=False,
            )
        return _async_session_factory

    async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
        session_factory = get_session_factory()
        async with session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

except ImportError:
    pass
