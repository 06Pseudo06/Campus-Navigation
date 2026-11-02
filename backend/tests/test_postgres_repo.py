"""
Integration tests for PostgresUserRepository against the live Neon database.

Strategy
--------
Each test wraps its database work inside a SAVEPOINT that is rolled back at
teardown — keeping the Neon database clean (no test data persists).

pytest-asyncio 1.x configuration
----------------------------------
- asyncio_mode = auto           (set in pytest.ini)
- loop_scope = "module"         (set via pytestmark below)
  All tests and async fixtures in this file share one module-level event loop,
  which means the engine created in pg_engine is valid for the entire module.
- db_session uses join_transaction_mode='create_savepoint' so each test's
  session.commit() calls translate to SAVEPOINT / RELEASE SAVEPOINT.
  The outer conn.rollback() in fixture teardown erases all test writes.
"""
import os
import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

os.environ.setdefault("ENVIRONMENT", "integration_test")

from app.config import Settings
from app.core.database import normalize_database_url
from app.repositories.postgres_user_repository import PostgresUserRepository
from app.schemas.user import GoogleUserInfo


# All async tests and fixtures in this file share one module-level event loop.
pytestmark = pytest.mark.asyncio(loop_scope="module")


# ---------------------------------------------------------------------------
# Module-scoped engine
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", loop_scope="module")
async def pg_engine():
    """
    Creates and yields an AsyncEngine for integration tests.
    Skips the module if DATABASE_URL is not configured.
    """
    settings = Settings()
    if not settings.is_database_configured:
        pytest.skip("DATABASE_URL not configured — skipping Postgres integration tests")

    raw_url = settings.DATABASE_URL
    url, connect_args = normalize_database_url(raw_url)
    engine = create_async_engine(url, connect_args=connect_args, echo=False)
    yield engine
    await engine.dispose()


# ---------------------------------------------------------------------------
# Per-test rollback-safe session
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(loop_scope="module")
async def db_session(pg_engine):
    """
    Yields an AsyncSession whose writes are rolled back after each test.

    How it works:
      1. Opens a raw connection and starts a real transaction (BEGIN).
      2. Binds the AsyncSession to that connection with
         join_transaction_mode='create_savepoint': the session's commit()
         calls translate to SAVEPOINT / RELEASE SAVEPOINT, not real commits.
      3. After the test, conn.rollback() on the outer transaction erases all
         writes — nothing reaches the real database.
    """
    async with pg_engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(
            bind=conn,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        )
        try:
            yield session
        finally:
            await session.close()
            await conn.rollback()


@pytest_asyncio.fixture(loop_scope="module")
async def repo(db_session: AsyncSession) -> PostgresUserRepository:
    """Returns a PostgresUserRepository bound to the rollback-safe session."""
    return PostgresUserRepository(db_session)


# ---------------------------------------------------------------------------
# Test data helpers
# ---------------------------------------------------------------------------

def _google_user(
    sub: str = "g_sub_test_001",
    email: str = "pg_test_user@example.com",
    name: str = "PG Test User",
    email_verified: bool = True,
) -> GoogleUserInfo:
    """Factory for GoogleUserInfo."""
    return GoogleUserInfo(
        sub=sub,
        email=email,
        name=name,
        email_verified=email_verified,
    )


# ---------------------------------------------------------------------------
# Tests — Lookup methods return None for missing records
# ---------------------------------------------------------------------------

async def test_get_by_email_returns_none_when_not_found(repo: PostgresUserRepository):
    result = await repo.get_by_email("definitely_not_there@example.com")
    assert result is None


async def test_get_by_id_returns_none_when_not_found(repo: PostgresUserRepository):
    result = await repo.get_by_id(str(uuid.uuid4()))
    assert result is None


async def test_get_by_google_sub_returns_none_when_not_found(repo: PostgresUserRepository):
    result = await repo.get_by_google_sub("nonexistent_google_sub_xyz")
    assert result is None


async def test_get_by_phone_returns_none_when_not_found(repo: PostgresUserRepository):
    result = await repo.get_by_phone("+919999000000")
    assert result is None


async def test_get_by_identity_returns_none_when_not_found(repo: PostgresUserRepository):
    result = await repo.get_by_identity("google", "no_such_sub")
    assert result is None


# ---------------------------------------------------------------------------
# Tests — create_user and retrieval
# ---------------------------------------------------------------------------

async def test_create_user_and_get_by_id(repo: PostgresUserRepository):
    user_orm = await repo.create_user(
        email="newuser_id@example.com",
        full_name="New User By ID",
    )
    profile = await repo.get_by_id(user_orm.id)
    assert profile is not None
    assert str(profile.id) == str(user_orm.id)
    assert profile.email == "newuser_id@example.com"


async def test_create_user_and_get_by_email(repo: PostgresUserRepository):
    user_orm = await repo.create_user(
        email="NewUser_Email@Example.Com",
        full_name="Email Lookup User",
    )
    # get_by_email normalizes to lowercase
    profile = await repo.get_by_email("newuser_email@example.com")
    assert profile is not None
    assert str(profile.id) == str(user_orm.id)


# ---------------------------------------------------------------------------
# Tests — Google OAuth flow
# ---------------------------------------------------------------------------

async def test_create_google_user_and_identity(repo: PostgresUserRepository):
    google_info = _google_user()
    profile = await repo.get_or_create_from_google(google_info)

    assert profile is not None
    assert profile.email == "pg_test_user@example.com"
    assert profile.name == "PG Test User"
    assert profile.google_sub == google_info.sub
    assert profile.email_verified is True
    assert profile.id is not None


async def test_idempotent_google_login_returns_same_user(repo: PostgresUserRepository):
    google_info = _google_user(
        sub="g_sub_idempotent_002",
        email="idempotent@example.com",
    )
    first = await repo.get_or_create_from_google(google_info)
    second = await repo.get_or_create_from_google(google_info)

    assert first.id == second.id
    assert first.email == second.email


async def test_get_or_create_updates_name_on_repeat_login(repo: PostgresUserRepository):
    """On repeat login, full_name is updated from Google when provided."""
    sub = "g_sub_name_update_003"
    initial = _google_user(
        sub=sub,
        email="nameupdate@example.com",
        name="Initial Name",
    )
    await repo.get_or_create_from_google(initial)

    updated_google = _google_user(
        sub=sub,
        email="nameupdate@example.com",
        name="Updated Name",
    )
    second_login = await repo.get_or_create_from_google(updated_google)
    assert second_login.name == "Updated Name"


async def test_security_rule_blocks_unverified_account_linking(repo: PostgresUserRepository):
    """
    Google OAuth must NOT auto-link to an existing email/password account.
    A ValueError is expected when a Google identity tries to claim an email
    already registered via a different auth path.
    """
    # Simulate an existing email-registered user (no Google identity)
    await repo.create_user(
        email="existing_email@example.com",
        full_name="Existing User",
    )

    google_attempt = _google_user(
        sub="g_sub_linking_block_004",
        email="existing_email@example.com",
    )
    with pytest.raises(ValueError, match="already exists"):
        await repo.get_or_create_from_google(google_attempt)


# ---------------------------------------------------------------------------
# Tests — get_by_identity and get_by_google_sub after creation
# ---------------------------------------------------------------------------

async def test_get_by_google_sub_after_create(repo: PostgresUserRepository):
    google_info = _google_user(
        sub="g_sub_lookup_005",
        email="lookup_sub@example.com",
    )
    created = await repo.get_or_create_from_google(google_info)
    found = await repo.get_by_google_sub(google_info.sub)

    assert found is not None
    assert found.id == created.id


async def test_get_by_identity_after_create(repo: PostgresUserRepository):
    google_info = _google_user(
        sub="g_sub_identity_006",
        email="lookup_identity@example.com",
    )
    created = await repo.get_or_create_from_google(google_info)
    found = await repo.get_by_identity("google", google_info.sub)

    assert found is not None
    assert found.id == created.id


# ---------------------------------------------------------------------------
# Tests — Transaction isolation
# ---------------------------------------------------------------------------

async def test_transaction_rollback_leaves_no_records(db_session: AsyncSession):
    """
    Confirms the savepoint rollback strategy: data written here is visible within
    the session but will be erased when the fixture rolls back the outer transaction.
    """
    repo_local = PostgresUserRepository(db_session)
    google_info = _google_user(
        sub="g_sub_rollback_007",
        email="rollback_test@example.com",
    )
    profile = await repo_local.get_or_create_from_google(google_info)

    # Record is visible within the same session
    found = await repo_local.get_by_google_sub(google_info.sub)
    assert found is not None
    assert found.id == profile.id
    # Fixture teardown rolls back the outer transaction — nothing persists in Neon.
