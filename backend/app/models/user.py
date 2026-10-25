"""User profile and external identity ORM models."""

import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """Application-level user profile, decoupled from external auth providers."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('student', 'admin', 'moderator')",
            name="ck_users_role_valid",
        ),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    full_name = Column(String(120), nullable=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    role = Column(String(20), nullable=False, default="student")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    identities = relationship(
        "UserIdentity",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    favorites = relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reports = relationship(
        "LocationReport",
        back_populates="reporter",
    )


class UserIdentity(Base):
    """External authentication linkage (e.g. Google OAuth, Mobile OTP)."""

    __tablename__ = "user_identities"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_subject",
            name="uq_user_identities_provider_subject",
        ),
        Index("ix_user_identities_user_id", "user_id"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider = Column(String(30), nullable=False)
    provider_subject = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="identities")
