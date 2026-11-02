"""Campus locations API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin_role
from app.schemas.location import (
    LocationAliasCreate,
    LocationAliasRead,
    LocationCreate,
    LocationDetailRead,
    LocationHierarchyRead,
    LocationRead,
    LocationUpdate,
    LocationVerifyRequest,
)
from app.services import location_service

router = APIRouter()


@router.get("/", response_model=List[LocationRead])
def list_locations(
    query: Optional[str] = Query(None, description="Search by name, slug, or alias with relevance ranking"),
    location_type: Optional[str] = Query(None, description="Filter by location type"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status"),
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
        is_verified=is_verified,
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


@router.get("/{location_id}/ancestors", response_model=List[LocationRead])
def get_location_ancestors(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve parent ancestor chain (e.g. Room -> Floor -> Building)."""
    loc = location_service.get_location_by_id(db, location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
    return location_service.get_location_ancestors(db, location_id)


@router.get("/{location_id}/children", response_model=List[LocationRead])
def get_location_children(
    location_id: uuid.UUID,
    is_active: bool = Query(True, description="Filter child locations by active state"),
    db: Session = Depends(get_db),
):
    """Retrieve direct child locations belonging to this building or facility."""
    loc = location_service.get_location_by_id(db, location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
    return location_service.get_location_children(db, location_id, is_active=is_active)


@router.post("/", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def create_location(
    location_in: LocationCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Create a new campus destination (Administrative operation; requires admin auth)."""
    try:
        return location_service.create_location(db, location_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{location_id}", response_model=LocationRead)
def update_location(
    location_id: uuid.UUID,
    location_in: LocationUpdate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Update a campus location with hierarchy cycle validation (Administrative operation)."""
    try:
        updated = location_service.update_location(db, location_id, location_in)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{location_id}/verify", response_model=LocationRead)
def verify_location(
    location_id: uuid.UUID,
    verify_in: LocationVerifyRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Authorize or revoke verification status for a campus location (Administrative operation)."""
    loc = location_service.verify_location(db, location_id, is_verified=verify_in.is_verified)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
    return loc


@router.delete("/{location_id}", response_model=LocationRead)
def deactivate_location(
    location_id: uuid.UUID,
    cascade: bool = Query(False, description="Cascade soft-deactivation to active child sub-locations"),
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Soft-deactivate a location record to maintain navigation graph references (Administrative operation)."""
    try:
        loc = location_service.deactivate_location(db, location_id, cascade=cascade)
        if not loc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")
        return loc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{location_id}/aliases", response_model=LocationAliasRead, status_code=status.HTTP_201_CREATED)
def add_location_alias(
    location_id: uuid.UUID,
    alias_in: LocationAliasCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Add a search alias or acronym for a campus destination (Administrative operation)."""
    try:
        return location_service.add_location_alias(db, location_id, alias_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
