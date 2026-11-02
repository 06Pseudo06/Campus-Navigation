"""Map import staging and external data provenance ORM models."""

import uuid
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class MapImportBatch(Base):
    """Tracks an external map data import session (e.g. OSM extraction, GeoJSON upload)."""

    __tablename__ = "map_import_batches"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'processing', 'completed', 'failed')",
            name="ck_map_import_batches_status",
        ),
        Index("ix_map_import_batches_status", "status"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    source_provider = Column(String(50), nullable=False)  # 'osm', 'geojson', 'campus_survey'
    source_reference = Column(String(255), nullable=True)  # e.g. file name, query timestamp, changeset ID
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    total_records = Column(Integer, nullable=False, default=0)
    promoted_records = Column(Integer, nullable=False, default=0)
    rejected_records = Column(Integer, nullable=False, default=0)
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
    staged_records = relationship(
        "StagedLocation",
        back_populates="batch",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class StagedLocation(Base):
    """Staged external location record awaiting human verification before promotion to canonical inventory."""

    __tablename__ = "staged_locations"
    __table_args__ = (
        UniqueConstraint(
            "source_provider",
            "external_element_id",
            name="uq_staged_locations_provider_ext_id",
        ),
        CheckConstraint(
            "verification_status IN ('discovered', 'pending', 'approved', 'rejected')",
            name="ck_staged_locations_verification_status",
        ),
        CheckConstraint(
            "latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)",
            name="ck_staged_locations_latitude_range",
        ),
        CheckConstraint(
            "longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)",
            name="ck_staged_locations_longitude_range",
        ),
        Index("ix_staged_locations_batch_id", "batch_id"),
        Index("ix_staged_locations_status", "verification_status"),
        Index("ix_staged_locations_canonical_id", "canonical_location_id"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    batch_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("map_import_batches.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_provider = Column(String(50), nullable=False)
    external_element_type = Column(String(40), nullable=False)  # node, way, relation, Feature
    external_element_id = Column(String(100), nullable=False)  # e.g. "osm:way:123456"
    source_url = Column(String(500), nullable=True)
    original_tags = Column(JSON, nullable=True)

    # Proposed canonical attributes
    proposed_name = Column(String(180), nullable=True)
    proposed_location_type = Column(String(40), nullable=False, default="building")
    latitude = Column(Float(precision=53), nullable=True)
    longitude = Column(Float(precision=53), nullable=True)
    address_details = Column(Text, nullable=True)

    # Verification lifecycle
    verification_status = Column(String(20), nullable=False, default="pending")
    canonical_location_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    rejection_reason = Column(Text, nullable=True)
    verified_by = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verified_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )
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
    batch = relationship("MapImportBatch", back_populates="staged_records")
    canonical_location = relationship("Location")
    verifier = relationship("User")
