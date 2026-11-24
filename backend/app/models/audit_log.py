"""Administrative audit trail ORM model."""

import uuid
from sqlalchemy import (
    Column,
    DateTime,
    Index,
    String,
    Text,
    Uuid,
    func,
)

from app.models.base import Base


class AuditLog(Base):
    """Immutable audit record tracking administrative mutations and security actions."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_entity_type", "entity_type"),
        Index("ix_audit_logs_created_at", "created_at"),
        Index("ix_audit_logs_actor_email", "actor_email"),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    actor_id = Column(String(64), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(80), nullable=False)
    entity_type = Column(String(60), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(60), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
