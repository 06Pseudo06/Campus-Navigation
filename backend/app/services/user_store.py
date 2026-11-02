import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.schemas.user import GoogleUserInfo, UserProfile

logger = logging.getLogger(__name__)


class InMemoryUserRepository:
    """
    NON-PRODUCTION TEMPORARY USER STORE.
    
    WARNING:
    - This in-memory repository is strictly for Phase 2 local development and testing.
    - Records are kept in Python process memory and WILL RESET whenever the backend restarts.
    - In-memory data is not shared across multi-process workers (e.g. uvicorn with multiple workers).
    - In Phase 3, this class will be replaced by an SQLAlchemy/asyncpg repository connecting
      to the project's PostgreSQL database without altering API route handlers.
    """

    def __init__(self):
        # Maps user_id -> UserProfile
        self._users_by_id: Dict[str, UserProfile] = {}
        # Maps google_sub -> user_id for fast stable identity lookup
        self._users_by_sub: Dict[str, str] = {}
        # Maps normalized lowercase email -> user_id for uniqueness and login lookup
        self._users_by_email: Dict[str, str] = {}
        # Maps token_hash -> session record dict
        self._sessions_by_hash: Dict[str, dict] = {}

    def get_by_id(self, user_id: str) -> Optional[UserProfile]:
        """Fetch user by primary internal UUID."""
        return self._users_by_id.get(user_id)

    def get_by_google_sub(self, google_sub: str) -> Optional[UserProfile]:
        """Fetch user by Google's stable unique `sub` identifier."""
        user_id = self._users_by_sub.get(google_sub)
        if user_id:
            return self._users_by_id.get(user_id)
        return None

    def get_by_email(self, email: str) -> Optional[UserProfile]:
        """Fetch user by normalized lowercase email address."""
        if not email:
            return None
        user_id = self._users_by_email.get(email.strip().lower())
        if user_id:
            return self._users_by_id.get(user_id)
        return None

    def create_email_user(
        self,
        email: str,
        name: str,
        password_hash: str,
    ) -> UserProfile:
        """
        Create a new user with email and Argon2id password hash.
        Normalized email is guaranteed unique.
        """
        normalized_email = email.strip().lower()
        now = datetime.now(timezone.utc)
        user_id = str(uuid.uuid4())

        new_user = UserProfile(
            id=user_id,
            google_sub=None,
            email=normalized_email,
            name=name.strip(),
            picture=None,
            password_hash=password_hash,
            email_verified=False,
            created_at=now,
            last_login_at=now,
        )

        self._users_by_id[user_id] = new_user
        self._users_by_email[normalized_email] = user_id
        return new_user

    def update_last_login(self, user_id: str) -> Optional[UserProfile]:
        """Update last_login_at timestamp for a given user."""
        user = self.get_by_id(user_id)
        if not user:
            return None
        now = datetime.now(timezone.utc)
        updated = user.model_copy(update={"last_login_at": now})
        self._users_by_id[user_id] = updated
        return updated

    def get_or_create_from_google(self, google_user: GoogleUserInfo) -> UserProfile:
        """
        Idempotent user creation using Google `sub` as the primary identity key.
        - If user with this Google `sub` already exists: updates last_login_at and any
          refreshed profile details (name, picture) without creating a duplicate record.
        - If user is new: creates a unique user with a UUID and stores it.
        """
        now = datetime.now(timezone.utc)
        existing_user = self.get_by_google_sub(google_user.sub)
        normalized_email = google_user.email.strip().lower()

        if existing_user:
            # Update last login and profile info, keeping stable ID and created_at
            updated_user = existing_user.model_copy(
                update={
                    "name": google_user.name or existing_user.name,
                    "picture": google_user.picture or existing_user.picture,
                    "email_verified": google_user.email_verified,
                    "last_login_at": now,
                }
            )
            self._users_by_id[existing_user.id] = updated_user
            self._users_by_email[normalized_email] = existing_user.id
            return updated_user

        # Create new user
        user_id = str(uuid.uuid4())
        new_user = UserProfile(
            id=user_id,
            google_sub=google_user.sub,
            email=google_user.email,
            name=google_user.name,
            picture=google_user.picture,
            password_hash=None,
            email_verified=google_user.email_verified,
            created_at=now,
            last_login_at=now,
        )

        self._users_by_id[user_id] = new_user
        self._users_by_sub[google_user.sub] = user_id
        self._users_by_email[normalized_email] = user_id
        return new_user

    def create_session(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Any:
        now = datetime.now(timezone.utc)
        record = {
            "id": str(uuid.uuid4()),
            "user_id": str(user_id),
            "token_hash": token_hash,
            "expires_at": expires_at,
            "created_at": now,
            "last_activity_at": now,
            "is_revoked": False,
            "revoked_at": None,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        self._sessions_by_hash[token_hash] = record
        return type("InMemorySession", (), record)()

    def get_session_by_token_hash(self, token_hash: str) -> Optional[Any]:
        data = self._sessions_by_hash.get(token_hash)
        if not data:
            return None
        return type("InMemorySession", (), data)()

    def revoke_session(self, token_hash: str) -> bool:
        data = self._sessions_by_hash.get(token_hash)
        if not data:
            return False
        data["is_revoked"] = True
        data["revoked_at"] = datetime.now(timezone.utc)
        return True

    def update_profile(self, user_id: str, name: str) -> Optional[UserProfile]:
        """Update editable profile information (name)."""
        user = self.get_by_id(str(user_id))
        if not user:
            return None
        updated = user.model_copy(update={"name": name.strip(), "last_login_at": datetime.now(timezone.utc)})
        self._users_by_id[str(user_id)] = updated
        return updated

    def update_password(self, user_id: str, new_password_hash: str) -> bool:
        """Update password_hash for user in memory."""
        user = self.get_by_id(str(user_id))
        if not user:
            return False
        updated = user.model_copy(update={"password_hash": new_password_hash, "last_login_at": datetime.now(timezone.utc)})
        self._users_by_id[str(user_id)] = updated
        return True

    def delete_user(self, user_id: str) -> bool:
        """Permanently delete user and revoke all active sessions in memory."""
        str_id = str(user_id)
        user = self._users_by_id.pop(str_id, None)
        if not user:
            return False

        if user.email:
            self._users_by_email.pop(user.email.strip().lower(), None)
        if user.google_sub:
            self._users_by_sub.pop(user.google_sub, None)

        # Invalidate all sessions belonging to this user
        for sess in list(self._sessions_by_hash.values()):
            if sess.get("user_id") == str_id:
                sess["is_revoked"] = True
                sess["revoked_at"] = datetime.now(timezone.utc)

        return True

    def clear(self) -> None:
        """Utility for automated test resets."""
        self._users_by_id.clear()
        self._users_by_sub.clear()
        self._users_by_email.clear()
        self._sessions_by_hash.clear()


# Global singleton instance for local runtime / test fallback
_user_repository = InMemoryUserRepository()


def get_in_memory_user_repository() -> InMemoryUserRepository:
    """Explicit accessor for the in-memory repository (used in mock/test setups)."""
    return _user_repository


from collections.abc import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import Settings, get_settings
from app.core.database import get_db
from app.repositories.postgres_user_repository import PostgresUserRepository


async def get_db_optional(
    settings: Settings = Depends(get_settings),
) -> AsyncGenerator[Optional[AsyncSession], None]:
    """Yields an active database session when DATABASE_URL is configured, or None for in-memory mode."""
    if not settings.is_database_configured:
        yield None
        return
    async for session in get_db():
        yield session


class ResilientUserRepository:
    """
    Transparent hybrid resilience proxy around PostgresUserRepository.
    Executes operations against PostgreSQL when available, and automatically
    falls back to InMemoryUserRepository if the database is unreachable, timing out,
    or blocked by firewalls (e.g., campus Wi-Fi blocking outbound port 5432).
    """

    def __init__(self, pg_repo: PostgresUserRepository, in_mem_repo: InMemoryUserRepository):
        self._pg_repo = pg_repo
        self._in_mem = in_mem_repo

    async def get_by_id(self, user_id: Any) -> Optional[UserProfile]:
        try:
            res = await self._pg_repo.get_by_id(user_id)
            if res:
                return res
        except Exception as e:
            logger.warning(f"[DB Failover] get_by_id failed ({e}). Using in-memory store.")
        return self._in_mem.get_by_id(str(user_id))

    async def get_by_email(self, email: str) -> Optional[UserProfile]:
        try:
            res = await self._pg_repo.get_by_email(email)
            if res:
                return res
        except Exception as e:
            logger.warning(f"[DB Failover] get_by_email failed ({e}). Using in-memory store.")
        return self._in_mem.get_by_email(email)

    async def get_by_phone(self, phone: str) -> Optional[UserProfile]:
        try:
            res = await self._pg_repo.get_by_phone(phone)
            if res:
                return res
        except Exception as e:
            logger.warning(f"[DB Failover] get_by_phone failed ({e}). Using in-memory store.")
        return None

    async def get_by_google_sub(self, google_sub: str) -> Optional[UserProfile]:
        try:
            res = await self._pg_repo.get_by_google_sub(google_sub)
            if res:
                return res
        except Exception as e:
            logger.warning(f"[DB Failover] get_by_google_sub failed ({e}). Using in-memory store.")
        return self._in_mem.get_by_google_sub(google_sub)

    async def create_email_user(self, email: str, name: str, password_hash: str) -> UserProfile:
        try:
            res = await self._pg_repo.create_email_user(email, name, password_hash)
            # Sync into in-memory store for fallback lookups
            try:
                self._in_mem._users_by_id[str(res.id)] = res
                self._in_mem._users_by_email[email.strip().lower()] = str(res.id)
            except Exception:
                pass
            return res
        except ValueError:
            raise
        except Exception as e:
            logger.warning(f"[DB Failover] create_email_user failed ({e}). Saving to in-memory store.")
            return self._in_mem.create_email_user(email, name, password_hash)

    async def get_or_create_from_google(self, google_user: GoogleUserInfo) -> UserProfile:
        try:
            res = await self._pg_repo.get_or_create_from_google(google_user)
            try:
                self._in_mem._users_by_id[str(res.id)] = res
                if res.google_sub:
                    self._in_mem._users_by_sub[res.google_sub] = str(res.id)
                if res.email:
                    self._in_mem._users_by_email[res.email.strip().lower()] = str(res.id)
            except Exception:
                pass
            return res
        except ValueError:
            raise
        except Exception as e:
            logger.warning(f"[DB Failover] get_or_create_from_google failed ({e}). Using in-memory store.")
            return self._in_mem.get_or_create_from_google(google_user)

    async def create_session(
        self,
        user_id: Any,
        token_hash: str,
        expires_at: datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Any:
        # Pre-seed in-memory store
        self._in_mem.create_session(
            user_id=str(user_id),
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        try:
            return await self._pg_repo.create_session(
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires_at,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        except Exception as e:
            logger.warning(f"[DB Failover] create_session failed ({e}). Using in-memory session.")
            return self._in_mem.get_session_by_token_hash(token_hash)

    async def get_session_by_token_hash(self, token_hash: str) -> Optional[Any]:
        try:
            res = await self._pg_repo.get_session_by_token_hash(token_hash)
            if res:
                return res
        except Exception as e:
            logger.warning(f"[DB Failover] get_session failed ({e}). Checking in-memory store.")
        return self._in_mem.get_session_by_token_hash(token_hash)

    async def revoke_session(self, token_hash: str) -> bool:
        self._in_mem.revoke_session(token_hash)
        try:
            return await self._pg_repo.revoke_session(token_hash)
        except Exception as e:
            logger.warning(f"[DB Failover] revoke_session failed ({e}).")
            return True

    async def update_profile(self, user_id: Any, name: str) -> Optional[UserProfile]:
        self._in_mem.update_profile(str(user_id), name)
        try:
            return await self._pg_repo.update_profile(user_id, name)
        except Exception as e:
            logger.warning(f"[DB Failover] update_profile failed ({e}).")
            return self._in_mem.get_by_id(str(user_id))

    async def update_password(self, user_id: Any, new_password_hash: str) -> bool:
        self._in_mem.update_password(str(user_id), new_password_hash)
        try:
            return await self._pg_repo.update_password(user_id, new_password_hash)
        except Exception as e:
            logger.warning(f"[DB Failover] update_password failed ({e}).")
            return True

    async def delete_user(self, user_id: Any) -> bool:
        self._in_mem.delete_user(str(user_id))
        try:
            return await self._pg_repo.delete_user(user_id)
        except Exception as e:
            logger.warning(f"[DB Failover] delete_user failed ({e}).")
            return True

    async def update_last_login(self, user_id: Any) -> Optional[UserProfile]:
        self._in_mem.update_last_login(str(user_id))
        try:
            return await self._pg_repo.update_last_login(user_id)
        except Exception as e:
            logger.warning(f"[DB Failover] update_last_login failed ({e}).")
            return self._in_mem.get_by_id(str(user_id))

    def clear(self) -> None:
        self._in_mem.clear()


def get_user_repository(
    session: Optional[AsyncSession] = Depends(get_db_optional),
    settings: Settings = Depends(get_settings),
) -> Any:
    """
    FastAPI dependency that returns the active user repository.
    Returns ResilientUserRepository wrapping PostgresUserRepository and InMemoryUserRepository.
    Falls back gracefully when PostgreSQL is blocked or unreachable.
    """
    if (
        isinstance(session, AsyncSession)
        and getattr(settings, "is_database_configured", False)
        and getattr(settings, "ENVIRONMENT", "").lower() != "test"
    ):
        return ResilientUserRepository(PostgresUserRepository(session), _user_repository)
    return _user_repository
