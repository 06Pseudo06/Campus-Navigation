"""Map import and external location provenance schemas."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class MapImportBatchCreate(BaseModel):
    source_provider: str = Field(..., min_length=2, max_length=50, description="e.g. 'osm', 'geojson', 'campus_survey'")
    source_reference: Optional[str] = Field(None, max_length=255, description="File name, URL, or changeset ID")
    description: Optional[str] = None


class MapImportBatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_provider: str
    source_reference: Optional[str] = None
    description: Optional[str] = None
    status: str
    total_records: int
    promoted_records: int
    rejected_records: int
    created_at: datetime
    updated_at: datetime


class StagedLocationCreate(BaseModel):
    external_element_type: str = Field(..., max_length=40, description="node, way, relation, Feature")
    external_element_id: str = Field(..., max_length=100, description="Unique external identifier, e.g. osm:way:987654")
    source_provider: Optional[str] = Field(None, max_length=50)
    source_url: Optional[str] = Field(None, max_length=500)
    original_tags: Optional[Dict[str, Any]] = None
    proposed_name: Optional[str] = Field(None, max_length=180)
    proposed_location_type: str = Field("building", max_length=40)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    address_details: Optional[str] = None


class PotentialDuplicateCandidate(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    location_type: str
    is_verified: bool
    distance_approx_m: Optional[float] = None
    similarity_reason: str


class StagedLocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    batch_id: uuid.UUID
    source_provider: str
    external_element_type: str
    external_element_id: str
    source_url: Optional[str] = None
    original_tags: Optional[Dict[str, Any]] = None
    proposed_name: Optional[str] = None
    proposed_location_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_details: Optional[str] = None
    verification_status: str
    canonical_location_id: Optional[uuid.UUID] = None
    rejection_reason: Optional[str] = None
    verified_by: Optional[uuid.UUID] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    potential_duplicates: List[PotentialDuplicateCandidate] = []


class StagedReviewRequest(BaseModel):
    action: Literal["approve", "reject"]
    # Overrides allowed during approval
    approved_name: Optional[str] = Field(None, max_length=180)
    approved_location_type: Optional[str] = Field(None, max_length=40)
    parent_id: Optional[uuid.UUID] = None
    rejection_reason: Optional[str] = Field(None, max_length=500)


class GeoJSONImportRequest(BaseModel):
    geojson: Dict[str, Any]
    default_location_type: str = Field("building", max_length=40)
