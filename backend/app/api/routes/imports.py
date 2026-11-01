"""Map import, staging, and location provenance API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id, get_db, require_admin_role
from app.schemas.map_import import (
    GeoJSONImportRequest,
    MapImportBatchCreate,
    MapImportBatchRead,
    StagedLocationCreate,
    StagedLocationRead,
    StagedReviewRequest,
)
from app.services import import_service

router = APIRouter()


@router.post("/batches", response_model=MapImportBatchRead, status_code=status.HTTP_201_CREATED)
def create_import_batch(
    batch_in: MapImportBatchCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Initialize a new external map import batch (Administrative operation)."""
    return import_service.create_batch(db, batch_in)


@router.get("/batches", response_model=List[MapImportBatchRead])
def list_import_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """List map import batches (Administrative operation)."""
    return import_service.list_batches(db, skip=skip, limit=limit)


@router.get("/batches/{batch_id}", response_model=MapImportBatchRead)
def get_import_batch(
    batch_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Retrieve details and statistics for a specific import batch (Administrative operation)."""
    batch = import_service.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import batch not found.")
    return batch


@router.post("/batches/{batch_id}/records", response_model=StagedLocationRead, status_code=status.HTTP_201_CREATED)
def stage_record(
    batch_id: uuid.UUID,
    record_in: StagedLocationCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Stage an individual external location record with duplicate checking (Administrative operation)."""
    try:
        staged = import_service.stage_location_record(db, batch_id, record_in)
        duplicates = import_service.detect_canonical_duplicates(
            db, staged.proposed_name, staged.latitude, staged.longitude
        )
        read_obj = StagedLocationRead.model_validate(staged)
        read_obj.potential_duplicates = duplicates
        return read_obj
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/batches/{batch_id}/geojson")
def stage_geojson(
    batch_id: uuid.UUID,
    geojson_in: GeoJSONImportRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Stage a GeoJSON FeatureCollection into an import batch (Administrative operation)."""
    try:
        success, skipped = import_service.stage_geojson_feature_collection(
            db, batch_id, geojson_in.geojson, default_location_type=geojson_in.default_location_type
        )
        return {
            "batch_id": batch_id,
            "staged_count": success,
            "skipped_duplicates_count": skipped,
            "message": f"Successfully staged {success} features ({skipped} skipped as duplicates).",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/records", response_model=List[StagedLocationRead])
def list_staged_records(
    batch_id: Optional[uuid.UUID] = Query(None, description="Filter by import batch ID"),
    verification_status: Optional[str] = Query(None, description="Filter by status (pending, approved, rejected)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """List staged external locations awaiting administrator review (Administrative operation)."""
    staged_list = import_service.list_staged_records(
        db, batch_id=batch_id, verification_status=verification_status, skip=skip, limit=limit
    )
    result = []
    for s in staged_list:
        dups = import_service.detect_canonical_duplicates(db, s.proposed_name, s.latitude, s.longitude)
        obj = StagedLocationRead.model_validate(s)
        obj.potential_duplicates = dups
        result.append(obj)
    return result


@router.get("/records/{record_id}", response_model=StagedLocationRead)
def get_staged_record(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Retrieve a staged record with potential canonical duplicates (Administrative operation)."""
    s = import_service.get_staged_record(db, record_id)
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staged record not found.")
    dups = import_service.detect_canonical_duplicates(db, s.proposed_name, s.latitude, s.longitude)
    obj = StagedLocationRead.model_validate(s)
    obj.potential_duplicates = dups
    return obj


@router.post("/records/{record_id}/review", response_model=StagedLocationRead)
def review_staged_record(
    record_id: uuid.UUID,
    review_in: StagedReviewRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Review and either promote (approve) into canonical inventory or reject (Administrative operation)."""
    try:
        updated = import_service.review_staged_record(db, record_id, review_in)
        dups = import_service.detect_canonical_duplicates(db, updated.proposed_name, updated.latitude, updated.longitude)
        obj = StagedLocationRead.model_validate(updated)
        obj.potential_duplicates = dups
        return obj
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
