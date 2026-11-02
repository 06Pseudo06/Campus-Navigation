import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user_credential import UserCredential
    from app.models.user_session import UserSession


class User(Base):
    """
    SQLAlchemy ORM model for the 'users' table.
    Accurately maps the existing PostgreSQL schema on Neon.
    """
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("phone", name="uq_users_phone"),
        Index("ix_users_email", "email"),
        Index("ix_users_phone", "phone"),
        CheckConstraint(
            "role IN ('student', 'admin', 'moderator')",
            name="ck_users_role_valid",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    full_name: Mapped[Optional[str]] = mapped_column(
        String(120),
        nullable=True,
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="student",
        server_default=text("'student'"),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # 1:N relationship to user_identities
    identities: Mapped[List["UserIdentity"]] = relationship(
        "UserIdentity",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # 1:1 relationship to user_credentials (optional; None for Google-only users)
    credentials: Mapped[Optional["UserCredential"]] = relationship(
        "UserCredential",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # 1:N relationship to user_sessions
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} role={self.role!r} is_active={self.is_active}>"


class UserIdentity(Base):
    """
    SQLAlchemy ORM model for the 'user_identities' table.
    Stores third-party OAuth provider links (e.g., Google sub identifier).
    """
    __tablename__ = "user_identities"
    __table_args__ = (
        UniqueConstraint("provider", "provider_subject", name="uq_user_identities_provider_subject"),
        Index("ix_user_identities_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE", name="fk_user_identities_user_id"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    provider_subject: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )

    # Relationship back to User
    user: Mapped["User"] = relationship(
        "User",
        back_populates="identities",
    )

    def __repr__(self) -> str:
        return f"<UserIdentity id={self.id} user_id={self.user_id} provider={self.provider!r}>"
