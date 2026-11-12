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

from app.core.config import settings
from app.models.base import Base


# =====================================================================
# Synchronous Engine & Session Management (Core CampusWay Services)
# =====================================================================

db_url = settings.DATABASE_URL or "sqlite:///:memory:"
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine_kwargs: Dict[str, Any] = {"pool_pre_ping": settings.DB_POOL_PRE_PING}
if not db_url.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
    })

engine = create_engine(db_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def is_db_available(db: Optional[Session] = None) -> bool:
    """Fast probe to check whether target database is reachable before querying.
    
    If an active SQLite session is provided (e.g. during test runs), returns True immediately.
    Otherwise checks socket reachability with a 50ms fast connection probe.
    """
    try:
        if db is not None and db.bind is not None:
            if db.bind.dialect.name == "sqlite":
                return True
            u = db.bind.url
        else:
            u = make_url(db_url)
            if u.get_backend_name() == "sqlite":
                return True

        host = "127.0.0.1" if u.host in ("localhost", "127.0.0.1", None) else u.host
        port = u.port or 5432
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.05)
        res = s.connect_ex((host, port))
        s.close()
        return res == 0
    except Exception:
        return False


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
    if url.drivername in ("postgresql", "postgres"):
        url = url.set(drivername="postgresql+asyncpg")

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
            if not settings.DATABASE_URL:
                raise ValueError("DATABASE_URL is not configured.")
            _async_engine = build_async_engine(settings.DATABASE_URL)
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
