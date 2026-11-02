import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserCredential(Base):
    """
    SQLAlchemy ORM model for the 'user_credentials' table.
    Stores Argon2id / bcrypt password hashes for email/password authentication.
    One-to-one relationship with 'users'. A user may have no credentials row (e.g. Google-only auth).
    """
    __tablename__ = "user_credentials"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_credentials_user_id"),
        Index("ix_user_credentials_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE", name="fk_user_credentials_user_id"),
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
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

    # 1:1 relationship back to User
    user: Mapped["User"] = relationship(
        "User",
        back_populates="credentials",
    )

    def __repr__(self) -> str:
        return f"<UserCredential id={self.id} user_id={self.user_id}>"
