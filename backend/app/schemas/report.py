"""Location report Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


ReportStatus = Literal["pending", "reviewing", "resolved", "rejected"]


class LocationReportBase(BaseModel):
    reporter_id: Optional[uuid.UUID] = None
    location_id: Optional[uuid.UUID] = None
    node_id: Optional[uuid.UUID] = None
    edge_id: Optional[uuid.UUID] = None
    report_type: str = Field(..., min_length=1, max_length=40)
    description: Optional[str] = None

    @model_validator(mode="after")
    def validate_target_present(self) -> "LocationReportBase":
        if not (self.location_id or self.node_id or self.edge_id):
            raise ValueError("At least one target reference (location_id, node_id, edge_id) must be provided.")
        return self


class LocationReportCreate(LocationReportBase):
    pass


class LocationReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    description: Optional[str] = None


class LocationReportRead(LocationReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: ReportStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None
