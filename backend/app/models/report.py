"""Location and navigation issue report ORM model."""

import uuid
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class LocationReport(Base):
    """User report for missing place, incorrect map pin, blocked path, or navigation bug."""

    __tablename__ = "location_reports"
    __table_args__ = (
        CheckConstraint(
            "location_id IS NOT NULL OR node_id IS NOT NULL OR edge_id IS NOT NULL",
            name="ck_location_reports_target_required",
        ),
        CheckConstraint(
            "status IN ('pending', 'reviewing', 'resolved', 'rejected')",
            name="ck_location_reports_status_valid",
        ),
        Index("ix_location_reports_status", "status"),
        Index("ix_location_reports_location_id", "location_id"),
        Index("ix_location_reports_node_id", "node_id"),
        Index("ix_location_reports_edge_id", "edge_id"),
        Index("ix_location_reports_reporter_id", "reporter_id"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    reporter_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    location_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    node_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("nodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    edge_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("edges.id", ondelete="SET NULL"),
        nullable=True,
    )
    report_type = Column(String(40), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    resolved_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    reporter = relationship("User", back_populates="reports")
    location = relationship("Location", back_populates="reports")
    node = relationship("Node", back_populates="reports")
    edge = relationship("Edge", back_populates="reports")
