"""
Tests for Step 6.2: Server-Side Session Security, Revocation, and Production Secret Validation.

Verifies:
1. Valid session authentication.
2. Expired session rejection.
3. Revoked session rejection.
4. Logout invalidates the server-side session in database.
5. A previously issued token cannot authenticate after logout.
6. Production rejects default or weak SESSION_SECRET.
7. Development starts cleanly with valid development configuration.
8. One-day session expiry for standard sessions.
9. Thirty-day remember-me session expiry.
10. Compatibility for both Google and email/password authentication.
"""
import os
import uuid
from datetime import datetime, timezone, timedelta

import pytest
pytest_asyncio = pytest.importorskip("pytest_asyncio")
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

os.environ.setdefault("ENVIRONMENT", "integration_test")

from app.main import app
from app.config import Settings, get_settings
from app.core.database import normalize_database_url, get_db
from app.core.security import get_security_manager, hash_session_token, hash_password
from app.models.user import User, UserIdentity
from app.models.user_credential import UserCredential
from app.models.user_session import UserSession
from app.repositories.postgres_user_repository import PostgresUserRepository
from app.schemas.user import GoogleUserInfo
from app.services.user_store import get_user_repository, get_db_optional

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
# Test Cases
# ---------------------------------------------------------------------------

async def test_1_valid_session_authentication(async_client: AsyncClient, repo: PostgresUserRepository):
    """Test 1: Valid session cookie allows user to authenticate against /me."""
    email = f"valid_sess_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = await async_client.post(
        "/api/v1/auth/register",
        json={"full_name": "Session Tester", "email": email, "password": "Password123!"},
    )
    assert reg_resp.status_code == 201
    session_cookie = reg_resp.cookies.get("campusway_session")
    assert session_cookie is not None

    me_resp = await async_client.get(
        "/api/v1/auth/me",
        cookies={"campusway_session": session_cookie},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email


async def test_2_expired_session_rejection(async_client: AsyncClient, repo: PostgresUserRepository, db_session: AsyncSession):
    """Test 2: Server-side expired sessions are rejected with HTTP 401."""
    email = f"expired_{uuid.uuid4().hex[:8]}@example.com"
    user = await repo.create_user(email=email, full_name="Expired User")
    
    sec = get_security_manager()
    raw_token, token_hash = sec.generate_token_pair()
    now = datetime.now(timezone.utc)
    expired_time = now - timedelta(hours=2)

    # Insert an already-expired session directly into PostgreSQL
    session_obj = UserSession(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expired_time,
        created_at=expired_time - timedelta(days=1),
        last_activity_at=expired_time,
        is_revoked=False,
    )
    db_session.add(session_obj)
    await db_session.flush()

    cookie_val = sec.create_session_token(user_id=str(user.id), raw_token=raw_token)

    me_resp = await async_client.get(
        "/api/v1/auth/me",
        cookies={"campusway_session": cookie_val},
    )
    assert me_resp.status_code == 401
    assert "expired" in me_resp.json()["detail"].lower()


async def test_3_revoked_session_rejection(async_client: AsyncClient, repo: PostgresUserRepository, db_session: AsyncSession):
    """Test 3: Server-side revoked sessions are rejected with HTTP 401."""
    email = f"revoked_{uuid.uuid4().hex[:8]}@example.com"
    user = await repo.create_user(email=email, full_name="Revoked User")

    sec = get_security_manager()
    raw_token, token_hash = sec.generate_token_pair()
    now = datetime.now(timezone.utc)

    # Create session and explicitly mark revoked
    session_obj = await repo.create_session(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now + timedelta(days=1),
    )
    await repo.revoke_session(token_hash)

    cookie_val = sec.create_session_token(user_id=str(user.id), raw_token=raw_token)

    me_resp = await async_client.get(
        "/api/v1/auth/me",
        cookies={"campusway_session": cookie_val},
    )
    assert me_resp.status_code == 401
    assert "revoked" in me_resp.json()["detail"].lower()


async def test_4_logout_invalidates_session_in_database(async_client: AsyncClient, db_session: AsyncSession):
    """Test 4: Calling /logout invalidates the session record in PostgreSQL."""
    email = f"logout_db_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = await async_client.post(
        "/api/v1/auth/register",
        json={"full_name": "Logout DB Tester", "email": email, "password": "Password123!"},
    )
    assert reg_resp.status_code == 201
    session_cookie = reg_resp.cookies.get("campusway_session")

    # Extract token hash and check database before logout
    sec = get_security_manager()
    token_data = sec.extract_session_token_data(session_cookie)
    token_hash = token_data["token_hash"]

    stmt = select(UserSession).where(UserSession.token_hash == token_hash)
    sess_before = (await db_session.execute(stmt)).scalar_one()
    assert sess_before.is_revoked is False
    assert sess_before.revoked_at is None

    # Call logout
    logout_resp = await async_client.post(
        "/api/v1/auth/logout",
        cookies={"campusway_session": session_cookie},
    )
    assert logout_resp.status_code == 200

    # Verify session is now revoked in database
    db_session.expire_all()
    sess_after = (await db_session.execute(stmt)).scalar_one()
    assert sess_after.is_revoked is True
    assert sess_after.revoked_at is not None


async def test_5_previously_issued_token_cannot_authenticate_after_logout(async_client: AsyncClient):
    """Test 5: A previously issued session token is demonstrably rejected after logout."""
    email = f"stolen_token_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = await async_client.post(
        "/api/v1/auth/register",
        json={"full_name": "Stolen Token User", "email": email, "password": "Password123!"},
    )
    assert reg_resp.status_code == 201
    saved_session_cookie = reg_resp.cookies.get("campusway_session")

    # 1. User can authenticate with this token
    me_resp1 = await async_client.get(
        "/api/v1/auth/me",
        cookies={"campusway_session": saved_session_cookie},
    )
    assert me_resp1.status_code == 200

    # 2. User logs out
    logout_resp = await async_client.post(
        "/api/v1/auth/logout",
        cookies={"campusway_session": saved_session_cookie},
    )
    assert logout_resp.status_code == 200

    # 3. Attacker uses the previously saved token: MUST be rejected!
    me_resp2 = await async_client.get(
        "/api/v1/auth/me",
        cookies={"campusway_session": saved_session_cookie},
    )
    assert me_resp2.status_code == 401
    assert "revoked" in me_resp2.json()["detail"].lower()


async def test_6_production_rejects_default_session_secret():
    """Test 6: Application configuration raises ValueError when default or weak secret is used in production."""
    # Default development secret in production must fail
    with pytest.raises(ValueError, match="Default development SESSION_SECRET is not permitted in production"):
        Settings(
            ENVIRONMENT="production",
            SESSION_SECRET="campusway-dev-secret-key-must-be-changed-in-production-min-32-chars",
        )

    # Empty secret in production must fail
    with pytest.raises(ValueError, match="SESSION_SECRET must not be empty"):
        Settings(
            ENVIRONMENT="production",
            SESSION_SECRET="",
        )

    # Secret shorter than 32 characters in production must fail
    with pytest.raises(ValueError, match="SESSION_SECRET is too short"):
        Settings(
            ENVIRONMENT="production",
            SESSION_SECRET="short-secret-only-18-chars",
        )

    # Strong production secret succeeds
    prod_settings = Settings(
        ENVIRONMENT="production",
        SESSION_SECRET="a-very-strong-production-secret-key-of-more-than-32-characters!",
    )
    assert prod_settings.is_production is True


async def test_7_development_starts_with_valid_dev_config():
    """Test 7: Local development starts cleanly with default development settings."""
    dev_settings = Settings(ENVIRONMENT="development")
    assert dev_settings.is_production is False
    assert dev_settings.SESSION_SECRET is not None
    assert len(dev_settings.SESSION_SECRET) >= 32


async def test_8_one_day_session_expiry(async_client: AsyncClient, db_session: AsyncSession):
    """Test 8: Default login (remember_me=False) creates a 1-day (86,400s) session."""
    email = f"oneday_{uuid.uuid4().hex[:8]}@example.com"
    await async_client.post(
        "/api/v1/auth/register",
        json={"full_name": "One Day Tester", "email": email, "password": "Password123!"},
    )

    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!", "remember_me": False},
    )
    assert login_resp.status_code == 200
    session_cookie = login_resp.cookies.get("campusway_session")

    sec = get_security_manager()
    token_data = sec.extract_session_token_data(session_cookie)
    token_hash = token_data["token_hash"]

    stmt = select(UserSession).where(UserSession.token_hash == token_hash)
    session_row = (await db_session.execute(stmt)).scalar_one()

    duration = (session_row.expires_at - session_row.created_at).total_seconds()
    # Should be approximately 86,400 seconds (1 day)
    assert 86350 <= duration <= 86450


async def test_9_thirty_day_remember_me_expiry(async_client: AsyncClient, db_session: AsyncSession):
    """Test 9: Remember-me login creates a 30-day (2,592,000s) session in database."""
    email = f"thirtyday_{uuid.uuid4().hex[:8]}@example.com"
    await async_client.post(
        "/api/v1/auth/register",
        json={"full_name": "Thirty Day Tester", "email": email, "password": "Password123!"},
    )

    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!", "remember_me": True},
    )
    assert login_resp.status_code == 200
    session_cookie = login_resp.cookies.get("campusway_session")

    sec = get_security_manager()
    token_data = sec.extract_session_token_data(session_cookie)
    token_hash = token_data["token_hash"]

    stmt = select(UserSession).where(UserSession.token_hash == token_hash)
    session_row = (await db_session.execute(stmt)).scalar_one()

    duration = (session_row.expires_at - session_row.created_at).total_seconds()
    # Should be approximately 2,592,000 seconds (30 days)
    assert 2591900 <= duration <= 2592100


async def test_10_google_and_email_password_compatibility(async_client: AsyncClient, repo: PostgresUserRepository, db_session: AsyncSession):
    """Test 10: Both Google and Email/Password users use the same revocable database session mechanism."""
    sec = get_security_manager()

    # 1. Google OAuth user session
    google_sub = f"gsub_{uuid.uuid4().hex[:12]}"
    google_email = f"guser_{uuid.uuid4().hex[:8]}@example.com"
    guser = await repo.get_or_create_from_google(
        GoogleUserInfo(sub=google_sub, email=google_email, name="Google Test User", email_verified=True)
    )

    raw_token_g, hash_g = sec.generate_token_pair()
    now = datetime.now(timezone.utc)
    await repo.create_session(
        user_id=guser.id,
        token_hash=hash_g,
        expires_at=now + timedelta(days=1),
    )
    g_cookie = sec.create_session_token(user_id=guser.id, google_sub=google_sub, raw_token=raw_token_g)

    # Google user authenticates
    g_me = await async_client.get("/api/v1/auth/me", cookies={"campusway_session": g_cookie})
    assert g_me.status_code == 200
    assert g_me.json()["email"] == google_email

    # Google user logs out
    g_logout = await async_client.post("/api/v1/auth/logout", cookies={"campusway_session": g_cookie})
    assert g_logout.status_code == 200

    # Google user session is revoked
    g_me_revoked = await async_client.get("/api/v1/auth/me", cookies={"campusway_session": g_cookie})
    assert g_me_revoked.status_code == 401
    assert "revoked" in g_me_revoked.json()["detail"].lower()

    # 2. Email/password user session
    pw_email = f"pwuser_{uuid.uuid4().hex[:8]}@example.com"
    pw_user = await repo.create_email_user(
        email=pw_email,
        name="PW Test User",
        password_hash=hash_password("Password123!"),
    )
    raw_token_p, hash_p = sec.generate_token_pair()
    await repo.create_session(
        user_id=pw_user.id,
        token_hash=hash_p,
        expires_at=now + timedelta(days=1),
    )
    pw_cookie = sec.create_session_token(user_id=pw_user.id, raw_token=raw_token_p)

    # Password user authenticates
    pw_me = await async_client.get("/api/v1/auth/me", cookies={"campusway_session": pw_cookie})
    assert pw_me.status_code == 200
    assert pw_me.json()["email"] == pw_email

    # Password user logs out
    pw_logout = await async_client.post("/api/v1/auth/logout", cookies={"campusway_session": pw_cookie})
    assert pw_logout.status_code == 200

    # Password user session is revoked
    pw_me_revoked = await async_client.get("/api/v1/auth/me", cookies={"campusway_session": pw_cookie})
    assert pw_me_revoked.status_code == 401
    assert "revoked" in pw_me_revoked.json()["detail"].lower()
