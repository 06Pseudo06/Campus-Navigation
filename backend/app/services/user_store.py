import inspect
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
from app.schemas.user import GoogleUserInfo, UserProfile


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
        role: str = "student",
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
            role=role,
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

    def seed_admin_user(
        self,
        email: str = "admin@campusway.lpu.in",
        name: str = "Campus Operations Admin",
        password: str = "Admin@CampusWay2026!",
    ) -> UserProfile:
        """Ensure default administrator user exists in repository."""
        from app.core.security import hash_password
        existing = self.get_by_email(email)
        if existing:
            return existing
        return self.create_email_user(
            email=email,
            name=name,
            password_hash=hash_password(password),
            role="admin",
        )

    def list_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[UserProfile], int]:
        """List registered users with optional search and role filtering."""
        users = list(self._users_by_id.values())
        if search:
            s = search.strip().lower()
            users = [
                u for u in users
                if (u.name and s in u.name.lower())
                or (u.email and s in u.email.lower())
                or s in u.id
            ]
        if role:
            users = [u for u in users if u.role == role]
        if is_active is not None:
            users = [u for u in users if u.is_active is is_active]

        total = len(users)
        users.sort(key=lambda u: u.created_at, reverse=True)
        return users[skip : skip + limit], total

    def update_role(self, user_id: str, new_role: str) -> UserProfile:
        """Update role for user with last administrator protection."""
        user = self.get_by_id(user_id)
        if not user:
            raise ValueError("User not found.")
        if new_role not in ("student", "admin", "moderator"):
            raise ValueError(f"Invalid role '{new_role}'. Must be one of: student, admin, moderator.")

        # Guard: Cannot demote the last active administrator
        if user.role == "admin" and new_role != "admin" and user.is_active:
            active_admins = [u for u in self._users_by_id.values() if u.role == "admin" and u.is_active]
            if len(active_admins) <= 1:
                raise ValueError("Cannot demote the last active administrator.")

        updated = user.model_copy(update={"role": new_role})
        self._users_by_id[str(user_id)] = updated
        return updated

    def update_status(self, user_id: str, is_active: bool) -> UserProfile:
        """Activate or deactivate user account with last administrator protection."""
        user = self.get_by_id(user_id)
        if not user:
            raise ValueError("User not found.")

        # Guard: Cannot deactivate the last active administrator
        if user.role == "admin" and not is_active and user.is_active:
            active_admins = [u for u in self._users_by_id.values() if u.role == "admin" and u.is_active]
            if len(active_admins) <= 1:
                raise ValueError("Cannot deactivate the last active administrator.")

        updated = user.model_copy(update={"is_active": is_active})
        self._users_by_id[str(user_id)] = updated
        return updated

    def count_stats(self) -> Dict[str, int]:
        """Aggregate counts for dashboard overview."""
        all_users = list(self._users_by_id.values())
        return {
            "total": len(all_users),
            "active": sum(1 for u in all_users if u.is_active),
            "inactive": sum(1 for u in all_users if not u.is_active),
            "students": sum(1 for u in all_users if u.role == "student"),
            "admins": sum(1 for u in all_users if u.role == "admin"),
            "moderators": sum(1 for u in all_users if u.role == "moderator"),
        }

    def clear(self) -> None:
        """Utility for automated test resets."""
        self._users_by_id.clear()
        self._users_by_sub.clear()
        self._users_by_email.clear()
        self._sessions_by_hash.clear()


# Global singleton instance for local runtime / test fallback
_user_repository = InMemoryUserRepository()
_user_repository.seed_admin_user()


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
    if (
        getattr(settings, "ENVIRONMENT", "").lower() == "test"
        or not getattr(settings, "is_database_configured", False)
        or ResilientUserRepository._db_offline
    ):
        yield None
        return

    has_yielded = False
    try:
        from app.core.database import get_async_db
        db_gen = get_async_db()
        async for session in db_gen:
            has_yielded = True
            yield session
    except GeneratorExit:
        raise
    except Exception as exc:
        logging.getLogger("campusway.auth").warning(
            "Database session initialization error (%s). Operating in resilient in-memory mode.",
            exc,
        )
        ResilientUserRepository._db_offline = True
        if not has_yielded:
            yield None


class ResilientUserRepository:
    """
    Transparent proxy that attempts operations against PostgresUserRepository.
    If the database server is unreachable (e.g. network timeout / port 5432 blocked by ISP/firewall),
    it logs a warning and falls back to the in-memory repository to guarantee 100% uptime.
    """
    _db_offline = False

    def __init__(self, postgres_repo: PostgresUserRepository, fallback_repo: InMemoryUserRepository):
        self._pg = postgres_repo
        self._mem = fallback_repo

    async def _execute(self, method_name: str, *args, **kwargs):
        if ResilientUserRepository._db_offline:
            fn = getattr(self._mem, method_name)
            res = fn(*args, **kwargs)
            return await res if inspect.isawaitable(res) else res
        try:
            fn = getattr(self._pg, method_name)
            res = fn(*args, **kwargs)
            return await res if inspect.isawaitable(res) else res
        except Exception as exc:
            err_str = str(exc).lower()
            if (
                isinstance(exc, (OSError, TimeoutError))
                or any(k in err_str for k in [
                    "connect", "timeout", "network", "errno", "socket",
                    "getaddrinfo", "refused", "reset", "closed", "unreachable", "operationalerror"
                ])
            ):
                logging.getLogger("campusway.database").warning(
                    "PostgreSQL connection failed (%s). Port 5432 is unreachable on this network. Operating in resilient in-memory mode.",
                    exc,
                )
                ResilientUserRepository._db_offline = True
                fn = getattr(self._mem, method_name)
                res = fn(*args, **kwargs)
                return await res if inspect.isawaitable(res) else res
            raise

    async def get_by_id(self, *args, **kwargs):
        return await self._execute("get_by_id", *args, **kwargs)

    async def get_by_email(self, *args, **kwargs):
        return await self._execute("get_by_email", *args, **kwargs)

    async def get_by_google_sub(self, *args, **kwargs):
        return await self._execute("get_by_google_sub", *args, **kwargs)

    async def get_or_create_from_google(self, *args, **kwargs):
        return await self._execute("get_or_create_from_google", *args, **kwargs)

    async def create_email_user(self, *args, **kwargs):
        return await self._execute("create_email_user", *args, **kwargs)

    async def update_last_login(self, *args, **kwargs):
        return await self._execute("update_last_login", *args, **kwargs)

    async def update_profile(self, *args, **kwargs):
        return await self._execute("update_profile", *args, **kwargs)

    async def update_password(self, *args, **kwargs):
        return await self._execute("update_password", *args, **kwargs)

    async def delete_user(self, *args, **kwargs):
        return await self._execute("delete_user", *args, **kwargs)

    async def create_session(self, *args, **kwargs):
        return await self._execute("create_session", *args, **kwargs)

    async def get_session_by_token_hash(self, *args, **kwargs):
        return await self._execute("get_session_by_token_hash", *args, **kwargs)

    async def revoke_session(self, *args, **kwargs):
        return await self._execute("revoke_session", *args, **kwargs)

    async def cleanup_expired_sessions(self, *args, **kwargs):
        return await self._execute("cleanup_expired_sessions", *args, **kwargs)

    async def list_users(self, *args, **kwargs):
        return await self._execute("list_users", *args, **kwargs)

    async def update_role(self, *args, **kwargs):
        return await self._execute("update_role", *args, **kwargs)

    async def update_status(self, *args, **kwargs):
        return await self._execute("update_status", *args, **kwargs)

    async def count_stats(self, *args, **kwargs):
        return await self._execute("count_stats", *args, **kwargs)


def get_user_repository(
    session: Optional[AsyncSession] = Depends(get_db_optional),
    settings: Settings = Depends(get_settings),
) -> Any:
    """
    FastAPI dependency that returns the active user repository.
    Returns ResilientUserRepository backed by PostgresUserRepository when PostgreSQL is configured,
    with automatic in-memory fallback if the network blocks port 5432.
    Falls back to InMemoryUserRepository for unit tests and unconfigured environments.
    """
    if (
        isinstance(session, AsyncSession)
        and getattr(settings, "is_database_configured", False)
        and getattr(settings, "ENVIRONMENT", "").lower() != "test"
    ):
        return ResilientUserRepository(PostgresUserRepository(session), _user_repository)
    return _user_repository
