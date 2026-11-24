"""Audit log schemas for administrative monitoring."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    """Schema for returning an administrative audit record."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class AuditLogFilter(BaseModel):
    """Query filter parameters for listing audit records."""
    action: Optional[str] = None
    entity_type: Optional[str] = None
    actor_email: Optional[str] = None
    skip: int = 0
    limit: int = 50
