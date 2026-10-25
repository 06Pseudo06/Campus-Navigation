"""Campus location and alias Pydantic schemas."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.location import generate_slug, normalize_alias_text


class LocationAliasBase(BaseModel):
    alias: str = Field(..., min_length=1, max_length=180)


class LocationAliasCreate(LocationAliasBase):
    pass


class LocationAliasRead(LocationAliasBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    location_id: uuid.UUID
    normalized_alias: str
    created_at: datetime


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=180)
    slug: Optional[str] = Field(None, max_length=200)
    location_type: str = Field(..., min_length=1, max_length=40)
    description: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    address_details: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True
    parent_id: Optional[uuid.UUID] = None

    @model_validator(mode="after")
    def populate_slug_if_missing(self) -> "LocationBase":
        if not self.slug and self.name:
            self.slug = generate_slug(self.name)
        return self


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=180)
    slug: Optional[str] = Field(None, max_length=200)
    location_type: Optional[str] = Field(None, min_length=1, max_length=40)
    description: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    address_details: Optional[str] = None
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    parent_id: Optional[uuid.UUID] = None


class LocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    name: str
    slug: str
    location_type: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_details: Optional[str] = None
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LocationDetailRead(LocationRead):
    aliases: List[LocationAliasRead] = []
    children: List[LocationRead] = []


class LocationHierarchyRead(BaseModel):
    """Hierarchical tree representation of a campus location."""
    model_config = ConfigDict(from_attributes=True)

    location: LocationRead
    ancestors: List[LocationRead] = []
    children: List[LocationRead] = []
