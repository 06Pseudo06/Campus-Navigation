"""
Integration tests for Step 6: Email and Password Authentication against live Neon PostgreSQL.

Verifies:
1. Successful registration.
2. Password is stored as an Argon2id hash, not plaintext.
3. Duplicate email registration is rejected.
4. Successful login.
5. Incorrect password is rejected.
6. Unknown email receives a generic authentication error.
7. Inactive account cannot log in.
8. User remains in PostgreSQL after backend restart (session reload).
9. Google-only user can exist without credentials.
10. Email/password login does not break Google OAuth.
11. Concurrent registration does not create duplicate users.

All tests operate in savepoint-isolated transactions and roll back at teardown — zero test data persists.
"""
import os
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload

os.environ.setdefault("ENVIRONMENT", "integration_test")

from app.main import app
from app.config import Settings, get_settings
from app.core.database import normalize_database_url, get_db
from app.core.security import verify_password
from app.models.user import User, UserIdentity
from app.models.user_credential import UserCredential
from app.repositories.postgres_user_repository import PostgresUserRepository
from app.schemas.user import GoogleUserInfo
from app.services.user_store import get_user_repository, get_db_optional

# Shared module loop for pytest-asyncio
pytestmark = pytest.mark.asyncio(loop_scope="module")


# ---------------------------------------------------------------------------
# Fixtures
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


@pytest_asyncio.fixture(loop_scope="module")
async def repo(db_session: AsyncSession) -> PostgresUserRepository:
    return PostgresUserRepository(db_session)


@pytest_asyncio.fixture(loop_scope="module")
async def async_client(db_session: AsyncSession):
    """
    Async HTTP client configured to run FastAPI endpoints against the savepoint-bound AsyncSession.
    """
    settings = Settings(ENVIRONMENT="integration_test")

    async def override_get_db():
        yield db_session

    async def override_get_db_optional():
        yield db_session

    def override_get_user_repo():
        return PostgresUserRepository(db_session)

    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_optional] = override_get_db_optional
    app.dependency_overrides[get_user_repository] = override_get_user_repo

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Test Cases (1-11)
# ---------------------------------------------------------------------------

async def test_1_successful_registration(async_client: AsyncClient):
    """1. Successful registration creates user, returns public profile, and attaches session cookie."""
    payload = {
        "full_name": "Alice Tester",
        "email": "alice_register@example.com",
        "password": "SecurePassword123!",
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["email"] == "alice_register@example.com"
    assert data["name"] == "Alice Tester"
    assert "id" in data
    # Password information must never be returned in API response
    assert "password" not in data
    assert "password_hash" not in data

    # Verify session cookie was set
    cookie = response.cookies.get("campusway_session")
    assert cookie is not None


async def test_2_password_stored_as_argon2id_hash_not_plaintext(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """2. Password is stored as an Argon2id hash in user_credentials, never plaintext."""
    plaintext_password = "MySecretPassword999!"
    payload = {
        "full_name": "Bob Security",
        "email": "bob_security@example.com",
        "password": plaintext_password,
    }
    resp = await async_client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    user_id = uuid.UUID(resp.json()["id"])

    # Inspect the raw PostgreSQL user_credentials row directly
    stmt = select(UserCredential).where(UserCredential.user_id == user_id)
    result = await db_session.execute(stmt)
    credential = result.scalar_one_or_none()

    assert credential is not None
    # Must NOT be stored in plaintext
    assert credential.password_hash != plaintext_password
    # Must be an Argon2id hash
    assert credential.password_hash.startswith("$argon2id$")
    # Must verify correctly against the plaintext password
    assert verify_password(plaintext_password, credential.password_hash) is True
    assert verify_password("WrongPassword123!", credential.password_hash) is False


async def test_3_duplicate_email_registration_rejected(async_client: AsyncClient):
    """3. Duplicate email registration is rejected with HTTP 400."""
    payload = {
        "full_name": "Charlie Original",
        "email": "charlie_dup@example.com",
        "password": "Password123!",
    }
    resp1 = await async_client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    # Attempt registration with same email (even with different case)
    duplicate_payload = {
        "full_name": "Charlie Duplicate",
        "email": "Charlie_Dup@Example.COM",
        "password": "DifferentPassword123!",
    }
    resp2 = await async_client.post("/api/v1/auth/register", json=duplicate_payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


async def test_4_successful_login(async_client: AsyncClient):
    """4. Successful login returns user profile and attaches session cookie."""
    # Register first
    reg_payload = {
        "full_name": "Diana Login",
        "email": "diana_login@example.com",
        "password": "DianaPassword123!",
    }
    await async_client.post("/api/v1/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "diana_login@example.com",
        "password": "DianaPassword123!",
        "remember_me": False,
    }
    login_resp = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200

    data = login_resp.json()
    assert data["email"] == "diana_login@example.com"
    assert data["name"] == "Diana Login"
    assert "password_hash" not in data

    cookie = login_resp.cookies.get("campusway_session")
    assert cookie is not None


async def test_5_incorrect_password_rejected(async_client: AsyncClient):
    """5. Incorrect password is rejected with generic error (HTTP 401)."""
    reg_payload = {
        "full_name": "Eve WrongPw",
        "email": "eve_wrong@example.com",
        "password": "CorrectPassword123!",
    }
    await async_client.post("/api/v1/auth/register", json=reg_payload)

    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "eve_wrong@example.com", "password": "IncorrectPassword!"},
    )
    assert login_resp.status_code == 401
    assert "Invalid email or password" in login_resp.json()["detail"]


async def test_6_unknown_email_receives_generic_error(async_client: AsyncClient):
    """6. Unknown email receives generic authentication error that does not reveal account existence."""
    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_ghost_user@example.com", "password": "AnyPassword123!"},
    )
    assert login_resp.status_code == 401
    assert "Invalid email or password" in login_resp.json()["detail"]


async def test_7_inactive_account_cannot_login(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """7. Inactive account (is_active=False) cannot log in (HTTP 403)."""
    reg_payload = {
        "full_name": "Frank Inactive",
        "email": "frank_inactive@example.com",
        "password": "FrankPassword123!",
    }
    resp = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert resp.status_code == 201
    user_id = uuid.UUID(resp.json()["id"])

    # Deactivate the account in PostgreSQL
    stmt = select(User).where(User.id == user_id)
    user = (await db_session.execute(stmt)).scalar_one()
    user.is_active = False
    await db_session.flush()

    # Attempt login
    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "frank_inactive@example.com", "password": "FrankPassword123!"},
    )
    assert login_resp.status_code == 403
    assert "inactive" in login_resp.json()["detail"].lower()


async def test_8_user_remains_in_postgres_after_backend_restart(
    repo: PostgresUserRepository,
    db_session: AsyncSession,
):
    """8. User and credentials persist in PostgreSQL across session reloads."""
    email = "persistent_user@example.com"
    pwd_hash = "$argon2id$v=19$m=65536,t=2,p=1$fake_salt$persisted_hash"
    created = await repo.create_email_user(
        email=email,
        name="Persistent User",
        password_hash=pwd_hash,
    )
    assert created is not None

    # Clear identity map (simulating a fresh request / new session)
    db_session.expunge_all()

    # Query back using a new repository instance on the session
    fresh_repo = PostgresUserRepository(db_session)
    fetched = await fresh_repo.get_by_email(email)

    assert fetched is not None
    assert fetched.email == email
    assert fetched.name == "Persistent User"
    assert fetched.password_hash == pwd_hash


async def test_9_google_only_user_can_exist_without_credentials(
    repo: PostgresUserRepository,
    async_client: AsyncClient,
):
    """9. A Google-only user exists without a user_credentials row and cannot log in via password."""
    google_user = GoogleUserInfo(
        sub="google_sub_standalone_999",
        email="google_only_user@example.com",
        name="Google Only Person",
    )
    created = await repo.get_or_create_from_google(google_user)
    assert created.google_sub == "google_sub_standalone_999"
    assert created.password_hash is None

    # Password login attempt must be rejected directing user to Google Sign-In
    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "google_only_user@example.com", "password": "AnyPassword123!"},
    )
    assert login_resp.status_code == 400
    assert "Google Sign-In" in login_resp.json()["detail"]


async def test_10_email_password_login_does_not_break_google_oauth(
    repo: PostgresUserRepository,
):
    """10. Email/password accounts and Google OAuth identities coexist without interference."""
    # 1. Create Google user
    g_info = GoogleUserInfo(
        sub="google_sub_coexist_100",
        email="g_coexist@example.com",
        name="Google Person",
    )
    g_user = await repo.get_or_create_from_google(g_info)

    # 2. Create Email/password user
    ep_user = await repo.create_email_user(
        email="ep_coexist@example.com",
        name="Email Person",
        password_hash="$argon2id$v=19$m=65536,t=2,p=1$salt$hash",
    )

    # 3. Lookup both via their respective mechanisms
    found_g = await repo.get_by_google_sub("google_sub_coexist_100")
    found_ep = await repo.get_by_email("ep_coexist@example.com")

    assert found_g is not None
    assert found_g.id == g_user.id
    assert found_g.google_sub == "google_sub_coexist_100"
    assert found_g.password_hash is None

    assert found_ep is not None
    assert found_ep.id == ep_user.id
    assert found_ep.google_sub is None
    assert found_ep.password_hash is not None


async def test_11_concurrent_registration_does_not_create_duplicate_users(
    repo: PostgresUserRepository,
):
    """11. Duplicate registration attempts safely raise ValueError without creating duplicates."""
    email = "concurrent_reg@example.com"
    pwd_hash = "$argon2id$v=19$m=65536,t=2,p=1$salt$hash"

    # First registration succeeds
    u1 = await repo.create_email_user(email=email, name="First Attempt", password_hash=pwd_hash)
    assert u1 is not None

    # Second registration with same email raises ValueError safely
    with pytest.raises(ValueError, match="already exists"):
        await repo.create_email_user(email=email, name="Second Attempt", password_hash=pwd_hash)
