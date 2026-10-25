"""User favorite location ORM model."""

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Favorite(Base):
    """User bookmarked/favorite campus destination."""

    __tablename__ = "favorites"
    __table_args__ = (
        Index("ix_favorites_user_id", "user_id"),
        Index("ix_favorites_location_id", "location_id"),
    )

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    location_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="favorites")
    location = relationship("Location", back_populates="favorites")
