"""Navigation graph node (vertex) ORM model."""

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
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Node(Base):
    """Pedestrian routing graph vertex (junction, entrance, crossing, staircase, etc.)."""

    __tablename__ = "nodes"
    __table_args__ = (
        CheckConstraint(
            "latitude >= -90.0 AND latitude <= 90.0",
            name="ck_nodes_latitude_range",
        ),
        CheckConstraint(
            "longitude >= -180.0 AND longitude <= 180.0",
            name="ck_nodes_longitude_range",
        ),
        Index("ix_nodes_location_id", "location_id"),
        Index("ix_nodes_is_active", "is_active"),
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
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    node_type = Column(String(40), nullable=False)
    latitude = Column(Float(precision=53), nullable=False)
    longitude = Column(Float(precision=53), nullable=False)
    is_accessible = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    location = relationship("Location", back_populates="nodes")
    outgoing_edges = relationship(
        "Edge",
        foreign_keys="Edge.source_node_id",
        back_populates="source_node",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    incoming_edges = relationship(
        "Edge",
        foreign_keys="Edge.target_node_id",
        back_populates="target_node",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reports = relationship(
        "LocationReport",
        back_populates="node",
    )
