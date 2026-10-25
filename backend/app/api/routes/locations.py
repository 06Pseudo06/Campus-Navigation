"""Campus locations API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.location import (
    LocationAliasCreate,
    LocationAliasRead,
    LocationCreate,
    LocationDetailRead,
    LocationHierarchyRead,
    LocationRead,
    LocationUpdate,
)
from app.services import location_service

router = APIRouter()


@router.get("/", response_model=List[LocationRead])
def list_locations(
    query: Optional[str] = Query(None, description="Search by name, slug, or alias"),
    location_type: Optional[str] = Query(None, description="Filter by location type"),
    is_active: bool = Query(True, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List searchable campus locations (buildings, gates, rooms, landmarks). Excludes inactive by default."""
    return location_service.list_locations(
        db,
        query=query,
        location_type=location_type,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )


@router.get("/{location_id}", response_model=LocationDetailRead)
def get_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve detailed information for a specific location including direct children and aliases."""
    loc = location_service.get_location_by_id(db, location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
    return loc


@router.get("/{location_id}/hierarchy", response_model=LocationHierarchyRead)
def get_location_hierarchy(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve hierarchical lineage (ancestors) and direct sub-locations."""
    hierarchy = location_service.get_location_hierarchy(db, location_id)
    if not hierarchy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
    return hierarchy


@router.post("/", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def create_location(
    location_in: LocationCreate,
    db: Session = Depends(get_db),
):
    """Create a new campus destination with validation."""
    try:
        return location_service.create_location(db, location_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{location_id}", response_model=LocationRead)
def update_location(
    location_id: uuid.UUID,
    location_in: LocationUpdate,
    db: Session = Depends(get_db),
):
    """Update a campus location with hierarchy cycle validation."""
    try:
        updated = location_service.update_location(db, location_id, location_in)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{location_id}", response_model=LocationRead)
def deactivate_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Soft-deactivate a location record to maintain navigation graph references."""
    loc = location_service.deactivate_location(db, location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
    return loc


@router.post("/{location_id}/aliases", response_model=LocationAliasRead, status_code=status.HTTP_201_CREATED)
def add_location_alias(
    location_id: uuid.UUID,
    alias_in: LocationAliasCreate,
    db: Session = Depends(get_db),
):
    """Add a search alias or acronym for a campus destination."""
    try:
        return location_service.add_location_alias(db, location_id, alias_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
