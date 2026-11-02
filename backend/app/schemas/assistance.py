"""Visitor assistance and QR wayfinding Pydantic schemas."""

import uuid
from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


AssistanceStatus = Literal["pending", "acknowledged", "assigned", "resolved", "cancelled"]
AssistanceType = Literal["lost", "mobility_support", "medical", "general_inquiry"]


class AssistanceRequestCreate(BaseModel):
    requester_name: Optional[str] = Field(None, max_length=120)
    contact_phone: Optional[str] = Field(None, max_length=20)
    current_location_id: Optional[uuid.UUID] = None
    current_node_id: Optional[uuid.UUID] = None
    target_location_id: Optional[uuid.UUID] = None
    assistance_type: str = Field("lost", min_length=2, max_length=40)
    description: Optional[str] = Field(None, max_length=1000)

    @model_validator(mode="after")
    def validate_content_present(self) -> "AssistanceRequestCreate":
        if not (self.current_location_id or self.target_location_id or self.description or self.contact_phone):
            raise ValueError("Provide at least a location reference, contact phone, or issue description.")
        return self


class AssistanceRequestUpdate(BaseModel):
    status: Optional[AssistanceStatus] = None
    assigned_to: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = Field(None, max_length=1000)


class AssistanceRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requester_name: Optional[str] = None
    contact_phone: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    current_location_id: Optional[uuid.UUID] = None
    current_node_id: Optional[uuid.UUID] = None
    target_location_id: Optional[uuid.UUID] = None
    assistance_type: str
    description: Optional[str] = None
    status: str
    assigned_to: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None


class VisitorDestinationCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    location_type: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_details: Optional[str] = None
    is_accessible: bool = True
    nearest_node_id: Optional[uuid.UUID] = None
    has_route_topology: bool = False
    visitor_guidance: Optional[str] = None


class QRGenerateRequest(BaseModel):
    location_id: uuid.UUID
    node_id: Optional[uuid.UUID] = None
    qr_type: Literal["destination", "waypoint"] = "destination"
    expires_in_hours: int = Field(24 * 30, ge=1, le=24 * 365)  # Default 30 days, up to 1 year


class QRTokenResponse(BaseModel):
    token: str
    qr_type: str
    location_id: uuid.UUID
    location_name: str
    has_route_topology: bool
    expires_at: datetime


class QRResolveResponse(BaseModel):
    valid: bool
    qr_type: str
    destination: Optional[VisitorDestinationCard] = None
    suggested_origin_node_id: Optional[uuid.UUID] = None
    suggested_target_node_id: Optional[uuid.UUID] = None
    has_route_topology: bool
    routing_available: bool
    status_message: str
