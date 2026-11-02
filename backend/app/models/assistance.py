"""Visitor navigation assistance and lost-visitor support ORM models."""

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

from app.models.base import Base


class AssistanceRequest(Base):
    """Visitor navigation assistance request for lost visitors, mobility support, or general inquiry."""

    __tablename__ = "assistance_requests"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'acknowledged', 'assigned', 'resolved', 'cancelled')",
            name="ck_assistance_requests_status",
        ),
        Index("ix_assistance_requests_status", "status"),
        Index("ix_assistance_requests_created_at", "created_at"),
        Index("ix_assistance_requests_user_id", "user_id"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    requester_name = Column(String(120), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    current_location_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    current_node_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("nodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_location_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    assistance_type = Column(String(40), nullable=False, default="lost")
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    assigned_to = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolution_notes = Column(Text, nullable=True)
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
    user = relationship("User", foreign_keys=[user_id])
    assigned_staff = relationship("User", foreign_keys=[assigned_to])
    current_location = relationship("Location", foreign_keys=[current_location_id])
    target_location = relationship("Location", foreign_keys=[target_location_id])
    current_node = relationship("Node", foreign_keys=[current_node_id])
