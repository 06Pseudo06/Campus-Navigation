"""Walkable pathway connection (edge) ORM model."""

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
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Edge(Base):
    """Walkable connection between routing nodes with metric distance and accessibility."""

    __tablename__ = "edges"
    __table_args__ = (
        CheckConstraint(
            "source_node_id != target_node_id",
            name="ck_edges_prevent_self_loops",
        ),
        CheckConstraint(
            "distance_m > 0",
            name="ck_edges_positive_distance",
        ),
        UniqueConstraint(
            "source_node_id",
            "target_node_id",
            "path_type",
            name="uq_edges_source_target_path",
        ),
        Index("ix_edges_source_active", "source_node_id", "is_active"),
        Index("ix_edges_target_active", "target_node_id", "is_active"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    source_node_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("nodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_node_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("nodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    distance_m = Column(Float(precision=53), nullable=False)
    path_type = Column(String(40), nullable=False, default="footpath")
    is_bidirectional = Column(Boolean, nullable=False, default=True)
    is_accessible = Column(Boolean, nullable=False, default=True)
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
    source_node = relationship(
        "Node",
        foreign_keys=[source_node_id],
        back_populates="outgoing_edges",
    )
    target_node = relationship(
        "Node",
        foreign_keys=[target_node_id],
        back_populates="incoming_edges",
    )
    reports = relationship(
        "LocationReport",
        back_populates="edge",
    )
