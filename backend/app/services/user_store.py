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
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import Settings, get_settings
from app.core.database import get_db
from app.repositories.postgres_user_repository import PostgresUserRepository


async def get_db_optional(
    settings: Settings = Depends(get_settings),
) -> AsyncGenerator[Optional[AsyncSession], None]:
    """Yields an active database session when DATABASE_URL is configured, or None for test mode."""
    if not settings.is_database_configured:
        yield None
        return
    async for session in get_db():
        yield session


def get_user_repository(
    session: Optional[AsyncSession] = Depends(get_db_optional),
    settings: Any = Depends(get_settings),
) -> Any:
    """
    FastAPI dependency that returns the active user repository.
    Strictly returns PostgresUserRepository backed by Neon PostgreSQL.
    If database session is unavailable or not configured, raises HTTP 503.
    Only falls back to InMemoryUserRepository when explicitly running isolated unit tests (ENVIRONMENT == 'test').
    """
    resolved_settings = settings if isinstance(settings, Settings) else get_settings()

    if getattr(resolved_settings, "ENVIRONMENT", "").lower() == "test":
        return _user_repository

    if not isinstance(session, AsyncSession) or not getattr(resolved_settings, "is_database_configured", False):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Neon PostgreSQL connection is required for authentication.",
        )

    return PostgresUserRepository(session)
