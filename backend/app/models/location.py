"""Campus location and search alias ORM models."""

import re
import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def normalize_alias_text(text: str) -> str:
    """Normalize alias for consistent search lookups."""
    if not text:
        return ""
    # Lowercase, replace non-alphanumeric with spaces, collapse spaces
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def generate_slug(name: str) -> str:
    """Generate a clean, URL-friendly slug from a location name."""
    if not name:
        return ""
    slug = re.sub(r"[^\w\s-]", "", name.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    return slug


class Location(Base):
    """Searchable campus destination (e.g. building, block, room, gate, landmark)."""

    __tablename__ = "locations"
    __table_args__ = (
        CheckConstraint(
            "parent_id IS NULL OR parent_id != id",
            name="ck_locations_prevent_self_parent",
        ),
        CheckConstraint(
            "latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)",
            name="ck_locations_latitude_range",
        ),
        CheckConstraint(
            "longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)",
            name="ck_locations_longitude_range",
        ),
        Index("ix_locations_parent_id", "parent_id"),
        Index("ix_locations_location_type", "location_type"),
        Index("ix_locations_is_active", "is_active"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    parent_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    name = Column(String(180), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    location_type = Column(String(40), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float(precision=53), nullable=True)
    longitude = Column(Float(precision=53), nullable=True)
    address_details = Column(Text, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
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
    parent = relationship(
        "Location",
        remote_side=[id],
        back_populates="children",
    )
    children = relationship(
        "Location",
        back_populates="parent",
    )
    aliases = relationship(
        "LocationAlias",
        back_populates="location",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    nodes = relationship(
        "Node",
        back_populates="location",
    )
    favorites = relationship(
        "Favorite",
        back_populates="location",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reports = relationship(
        "LocationReport",
        back_populates="location",
    )


class LocationAlias(Base):
    """Search synonym and abbreviation for campus locations."""

    __tablename__ = "location_aliases"
    __table_args__ = (
        UniqueConstraint(
            "location_id",
            "normalized_alias",
            name="uq_location_aliases_location_normalized",
        ),
        Index("ix_location_aliases_normalized_alias", "normalized_alias"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    location_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
    )
    alias = Column(String(180), nullable=False)
    normalized_alias = Column(String(180), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    location = relationship("Location", back_populates="aliases")
