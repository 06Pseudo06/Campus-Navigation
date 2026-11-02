"""
Tests for user_credentials table and UserCredential ORM model against live Neon PostgreSQL.

Verifies:
- A user can exist without a credentials row (Google-only accounts).
- A user can have exactly one credentials row.
- A second credentials row for the same user is rejected by unique constraint.
- Deleting a user cascades to its credentials row (ON DELETE CASCADE).
- Existing User.identities relationship continues to function without conflict.

All tests run in isolated savepoints and are rolled back at teardown — zero test data persists.
"""
import os
import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload

os.environ.setdefault("ENVIRONMENT", "integration_test")

from app.config import Settings
from app.core.database import normalize_database_url
from app.models.user import User, UserIdentity
from app.models.user_credential import UserCredential

# All tests in this module share one module-level event loop.
pytestmark = pytest.mark.asyncio(loop_scope="module")


# ---------------------------------------------------------------------------
# Module-scoped engine & per-test rollback session
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", loop_scope="module")
async def pg_engine():
    settings = Settings()
    if not settings.is_database_configured:
        pytest.skip("DATABASE_URL not configured")
    raw_url = settings.DATABASE_URL
    url, connect_args = normalize_database_url(raw_url)
    engine = create_async_engine(url, connect_args=connect_args, echo=False)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(loop_scope="module")
async def db_session(pg_engine):
    """Savepoint-isolated session: rolled back at teardown."""
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


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

async def test_user_can_exist_without_credentials(db_session: AsyncSession):
    """Google-only or uncredentialed users have user.credentials == None."""
    user = User(
        id=uuid.uuid4(),
        email="google_only_user@example.com",
        full_name="Google Only User",
        role="student",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Query back with credentials relationship eager-loaded
    stmt = select(User).options(selectinload(User.credentials)).where(User.id == user.id)
    result = await db_session.execute(stmt)
    loaded_user = result.scalar_one()

    assert loaded_user is not None
    assert loaded_user.credentials is None


async def test_user_can_have_one_credentials_row(db_session: AsyncSession):
    """A user can have a linked UserCredential record with an Argon2id password hash."""
    user = User(
        id=uuid.uuid4(),
        email="credentialed_user@example.com",
        full_name="Credentialed User",
        role="student",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Mock Argon2id hash
    mock_argon2_hash = "$argon2id$v=19$m=65536,t=3,p=4$some_salt$some_argon2_hash_value"
    credential = UserCredential(
        id=uuid.uuid4(),
        user_id=user.id,
        password_hash=mock_argon2_hash,
    )
    db_session.add(credential)
    await db_session.flush()

    # Verify bidirectional navigation: User -> UserCredential and UserCredential -> User
    stmt = (
        select(User)
        .options(selectinload(User.credentials))
        .where(User.id == user.id)
    )
    result = await db_session.execute(stmt)
    loaded_user = result.scalar_one()

    assert loaded_user.credentials is not None
    assert loaded_user.credentials.password_hash == mock_argon2_hash
    assert loaded_user.credentials.user_id == user.id
    assert loaded_user.credentials.created_at is not None
    assert loaded_user.credentials.updated_at is not None
    assert loaded_user.credentials.user.id == user.id


async def test_second_credentials_row_for_same_user_is_rejected(db_session: AsyncSession):
    """Enforce 1:1 constraint — inserting a second credentials row for the same user raises IntegrityError."""
    user = User(
        id=uuid.uuid4(),
        email="unique_cred_user@example.com",
        full_name="Unique Cred User",
        role="student",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    cred1 = UserCredential(
        id=uuid.uuid4(),
        user_id=user.id,
        password_hash="hash_one_123456",
    )
    db_session.add(cred1)
    await db_session.flush()

    # Attempt second credential for the same user
    cred2 = UserCredential(
        id=uuid.uuid4(),
        user_id=user.id,
        password_hash="hash_two_654321",
    )
    db_session.add(cred2)

    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_deleting_user_cascades_to_credentials(db_session: AsyncSession):
    """Deleting a user row cascades and removes the associated user_credentials row."""
    user = User(
        id=uuid.uuid4(),
        email="cascade_delete_user@example.com",
        full_name="Cascade Delete User",
        role="student",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    cred = UserCredential(
        id=uuid.uuid4(),
        user_id=user.id,
        password_hash="cascade_pw_hash",
    )
    db_session.add(cred)
    await db_session.flush()

    cred_id = cred.id

    # Delete the user
    await db_session.delete(user)
    await db_session.flush()

    # Verify the credential row was deleted via CASCADE
    stmt = select(UserCredential).where(UserCredential.id == cred_id)
    result = await db_session.execute(stmt)
    remaining_cred = result.scalar_one_or_none()

    assert remaining_cred is None


async def test_existing_google_identity_relationships_still_work(db_session: AsyncSession):
    """User.identities and User.credentials coexist on the User model without conflict."""
    user = User(
        id=uuid.uuid4(),
        email="coexist_user@example.com",
        full_name="Coexist User",
        role="student",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    identity = UserIdentity(
        id=uuid.uuid4(),
        user_id=user.id,
        provider="google",
        provider_subject="google_sub_coexist_123",
    )
    db_session.add(identity)
    await db_session.flush()

    # Load User with both relationships
    stmt = (
        select(User)
        .options(selectinload(User.identities), selectinload(User.credentials))
        .where(User.id == user.id)
    )
    result = await db_session.execute(stmt)
    loaded_user = result.scalar_one()

    assert len(loaded_user.identities) == 1
    assert loaded_user.identities[0].provider == "google"
    assert loaded_user.identities[0].provider_subject == "google_sub_coexist_123"
    assert loaded_user.credentials is None
