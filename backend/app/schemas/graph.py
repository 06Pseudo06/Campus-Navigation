"""Navigation graph nodes, edges, and route calculation Pydantic schemas."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class NodeBase(BaseModel):
    location_id: Optional[uuid.UUID] = None
    node_type: str = Field(..., min_length=1, max_length=40)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    is_accessible: bool = True
    is_active: bool = True


class NodeCreate(NodeBase):
    pass


class NodeUpdate(BaseModel):
    location_id: Optional[uuid.UUID] = None
    node_type: Optional[str] = Field(None, min_length=1, max_length=40)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    is_accessible: Optional[bool] = None
    is_active: Optional[bool] = None


class NodeRead(NodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class EdgeBase(BaseModel):
    source_node_id: uuid.UUID
    target_node_id: uuid.UUID
    distance_m: float = Field(..., gt=0.0)
    path_type: str = Field("footpath", min_length=1, max_length=40)
    is_bidirectional: bool = True
    is_accessible: bool = True
    is_active: bool = True

    @model_validator(mode="after")
    def prevent_self_loop(self) -> "EdgeBase":
        if self.source_node_id == self.target_node_id:
            raise ValueError("source_node_id and target_node_id must differ (no self-loops).")
        return self


class EdgeCreate(EdgeBase):
    pass


class EdgeUpdate(BaseModel):
    distance_m: Optional[float] = Field(None, gt=0.0)
    path_type: Optional[str] = Field(None, min_length=1, max_length=40)
    is_bidirectional: Optional[bool] = None
    is_accessible: Optional[bool] = None
    is_active: Optional[bool] = None


class EdgeRead(EdgeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RouteQuery(BaseModel):
    origin_node_id: uuid.UUID
    destination_node_id: uuid.UUID
    accessible_only: bool = False


class PathSegment(BaseModel):
    source_node_id: uuid.UUID
    target_node_id: uuid.UUID
    distance_m: float
    path_type: str
    instruction: Optional[str] = None


class RouteResponse(BaseModel):
    origin_node_id: uuid.UUID
    destination_node_id: uuid.UUID
    total_distance_m: float
    accessible: bool
    path_nodes: List[uuid.UUID]
    segments: List[PathSegment] = []
