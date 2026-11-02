import uuid
from datetime import datetime, timezone
from typing import List, Optional, Union

from sqlalchemy import func, inspect as sa_inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.user import User, UserIdentity
from app.models.user_credential import UserCredential
from app.models.user_session import UserSession
from app.schemas.user import GoogleUserInfo, UserProfile


def user_to_profile(
    user: User,
    google_sub: Optional[str] = None,
    picture: Optional[str] = None,
    email_verified: bool = False,
    password_hash: Optional[str] = None,
) -> UserProfile:
    """Helper to convert a SQLAlchemy User model to a Pydantic UserProfile schema."""
    insp = sa_inspect(user)

    if not google_sub and insp is not None:
        if "identities" not in insp.unloaded:
            identities = getattr(user, "identities", None)
            if identities:
                for ident in identities:
                    if ident.provider == "google":
                        google_sub = ident.provider_subject
                        break

    if not password_hash and insp is not None:
        if "credentials" not in insp.unloaded:
            creds = getattr(user, "credentials", None)
            if creds:
                password_hash = creds.password_hash

    return UserProfile(
        id=str(user.id),
        google_sub=google_sub,
        email=user.email or "",
        name=user.full_name,
        picture=picture,
        password_hash=password_hash,
        email_verified=email_verified or bool(google_sub),
        is_active=getattr(user, "is_active", True),
        created_at=user.created_at,
        last_login_at=user.updated_at,
    )


class PostgresUserRepository:
    """
    SQLAlchemy AsyncSession implementation of the user repository.
    Persists user accounts and OAuth identities to PostgreSQL (Neon).
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: Union[str, uuid.UUID]) -> Optional[UserProfile]:
        """Fetch user by primary internal UUID."""
        try:
            uid = uuid.UUID(str(user_id))
        except (ValueError, TypeError):
            return None

        stmt = (
            select(User)
            .options(selectinload(User.identities), selectinload(User.credentials))
            .where(User.id == uid)
        )
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None
        return user_to_profile(user)

    async def get_by_email(self, email: str) -> Optional[UserProfile]:
        """Fetch user by normalized lowercase email address."""
        if not email:
            return None
        stmt = (
            select(User)
            .options(selectinload(User.identities), selectinload(User.credentials))
            .where(func.lower(User.email) == email.strip().lower())
        )
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None
        return user_to_profile(user)

    async def get_by_phone(self, phone: str) -> Optional[UserProfile]:
        """Fetch user by phone number."""
        if not phone:
            return None
        stmt = (
            select(User)
            .options(selectinload(User.identities), selectinload(User.credentials))
            .where(User.phone == phone.strip())
        )
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None
        return user_to_profile(user)

    async def get_by_identity(
        self, provider: str, provider_subject: str
    ) -> Optional[UserProfile]:
        """Fetch user linked to a specific OAuth provider and subject identifier."""
        if not provider or not provider_subject:
            return None
        stmt = (
            select(User)
            .join(UserIdentity, User.id == UserIdentity.user_id)
            .options(selectinload(User.identities), selectinload(User.credentials))
            .where(
                UserIdentity.provider == provider,
                UserIdentity.provider_subject == provider_subject,
            )
        )
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None
        return user_to_profile(
            user,
            google_sub=provider_subject if provider == "google" else None,
        )

    async def get_by_google_sub(self, google_sub: str) -> Optional[UserProfile]:
        """Fetch user by Google's stable unique `sub` identifier."""
        return await self.get_by_identity(provider="google", provider_subject=google_sub)

    async def create_user(
        self,
        email: Optional[str] = None,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        role: str = "student",
        is_active: bool = True,
    ) -> User:
        """Create a new raw User ORM record."""
        user = User(
            id=uuid.uuid4(),
            email=email.strip().lower() if email else None,
            full_name=full_name.strip() if full_name else None,
            phone=phone.strip() if phone else None,
            role=role,
            is_active=is_active,
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def create_user_identity(
        self,
        user_id: uuid.UUID,
        provider: str,
        provider_subject: str,
    ) -> UserIdentity:
        """Create a new UserIdentity linked to an existing User."""
        identity = UserIdentity(
            id=uuid.uuid4(),
            user_id=user_id,
            provider=provider,
            provider_subject=provider_subject,
        )
        self.session.add(identity)
        await self.session.flush()
        return identity

    async def create_user_credential(
        self,
        user_id: uuid.UUID,
        password_hash: str,
    ) -> UserCredential:
        """Create a new UserCredential linked to an existing User."""
        now = datetime.now(timezone.utc)
        credential = UserCredential(
            id=uuid.uuid4(),
            user_id=user_id,
            password_hash=password_hash,
            created_at=now,
            updated_at=now,
        )
        self.session.add(credential)
        await self.session.flush()
        return credential

    async def create_email_user(
        self,
        email: str,
        name: str,
        password_hash: str,
    ) -> UserProfile:
        """
        Create a new user with email and password hash in one transaction.
        Normalized email is guaranteed unique.
        Creates User and UserCredential atomically and safely handles concurrency.
        """
        now = datetime.now(timezone.utc)
        normalized_email = email.strip().lower()
        existing = await self.get_by_email(normalized_email)
        if existing:
            raise ValueError(f"User with email '{normalized_email}' already exists.")

        try:
            user = User(
                id=uuid.uuid4(),
                email=normalized_email,
                full_name=name.strip() if name else None,
                role="student",
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            self.session.add(user)
            await self.session.flush()

            credential = UserCredential(
                id=uuid.uuid4(),
                user_id=user.id,
                password_hash=password_hash,
                created_at=now,
                updated_at=now,
            )
            self.session.add(credential)
            await self.session.commit()
            await self.session.refresh(user)
            return user_to_profile(user, password_hash=password_hash)
        except IntegrityError:
            await self.session.rollback()
            raise ValueError(f"User with email '{normalized_email}' already exists.")

    async def update_last_login(
        self, user_id: Union[str, uuid.UUID]
    ) -> Optional[UserProfile]:
        """Update updated_at timestamp for a given user."""
        try:
            uid = uuid.UUID(str(user_id))
        except (ValueError, TypeError):
            return None

        stmt = select(User).where(User.id == uid)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None

        user.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(user)
        return user_to_profile(user)

    async def create_session(
        self,
        user_id: Union[str, uuid.UUID],
        token_hash: str,
        expires_at: datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserSession:
        """Create a persistent server-side user session record."""
        try:
            uid = uuid.UUID(str(user_id))
        except (ValueError, TypeError):
            raise ValueError(f"Invalid user_id: {user_id}")

        now = datetime.now(timezone.utc)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        session_obj = UserSession(
            id=uuid.uuid4(),
            user_id=uid,
            token_hash=token_hash,
            expires_at=expires_at,
            created_at=now,
            last_activity_at=now,
            is_revoked=False,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.session.add(session_obj)
        await self.session.commit()
        await self.session.refresh(session_obj)
        return session_obj

    async def get_session_by_token_hash(self, token_hash: str) -> Optional[UserSession]:
        """Fetch session by its SHA-256 token hash."""
        if not token_hash:
            return None
        stmt = select(UserSession).where(UserSession.token_hash == token_hash)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_session(self, token_hash: str) -> bool:
        """Revoke a session server-side so it cannot be used again."""
        if not token_hash:
            return False
        stmt = select(UserSession).where(UserSession.token_hash == token_hash)
        result = await self.session.execute(stmt)
        session_obj = result.scalar_one_or_none()
        if not session_obj:
            return False
        session_obj.is_revoked = True
        session_obj.revoked_at = datetime.now(timezone.utc)
        await self.session.commit()
        return True

    async def get_or_create_from_google(
        self, google_user: GoogleUserInfo
    ) -> UserProfile:
        """
        Idempotent user creation using Google `sub` as the primary identity key.
        - If user with this Google `sub` already exists: updates last_login_at and any
          refreshed profile details (name) without creating a duplicate record.
        - If user is new:
          - Enforces security rule: does not automatically link to an existing email account.
          - Creates a unique user with a UUID and Google identity record in a single transaction.
          - Handles unique constraint conflicts safely.
        """
        now = datetime.now(timezone.utc)
        normalized_email = google_user.email.strip().lower()

        # 1. Check if identity already exists for this Google sub
        identity_stmt = (
            select(UserIdentity)
            .options(joinedload(UserIdentity.user))
            .where(
                UserIdentity.provider == "google",
                UserIdentity.provider_subject == google_user.sub,
            )
        )
        result = await self.session.execute(identity_stmt)
        identity = result.scalar_one_or_none()

        if identity:
            user = identity.user
            user.updated_at = now
            if google_user.name:
                user.full_name = google_user.name
            await self.session.commit()
            await self.session.refresh(user)
            return user_to_profile(
                user,
                google_sub=google_user.sub,
                picture=google_user.picture,
                email_verified=google_user.email_verified,
            )

        # 2. Check security rule: do not automatically link Google account to existing email user
        email_stmt = select(User).where(func.lower(User.email) == normalized_email)
        existing_email_user = (await self.session.execute(email_stmt)).scalar_one_or_none()
        if existing_email_user:
            raise ValueError(
                "An account with this email address already exists. "
                "For security, automatic account linking is disabled. Please sign in with your password."
            )

        # 3. Create both User and UserIdentity in one transaction
        try:
            new_user = User(
                id=uuid.uuid4(),
                full_name=google_user.name,
                email=normalized_email,
                role="student",
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            self.session.add(new_user)
            await self.session.flush()

            new_identity = UserIdentity(
                id=uuid.uuid4(),
                user_id=new_user.id,
                provider="google",
                provider_subject=google_user.sub,
                created_at=now,
            )
            self.session.add(new_identity)
            await self.session.commit()
            await self.session.refresh(new_user)
            return user_to_profile(
                new_user,
                google_sub=google_user.sub,
                picture=google_user.picture,
                email_verified=google_user.email_verified,
            )
        except IntegrityError:
            await self.session.rollback()
            # Handle potential concurrency race condition
            retry_result = await self.session.execute(identity_stmt)
            retry_identity = retry_result.scalar_one_or_none()
            if retry_identity:
                return user_to_profile(
                    retry_identity.user,
                    google_sub=google_user.sub,
                    picture=google_user.picture,
                    email_verified=google_user.email_verified,
                )
            raise
