"""Location reports and navigation issue submission API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.report import LocationReportCreate, LocationReportRead, LocationReportUpdate
from app.services import report_service

router = APIRouter()


@router.post("/", response_model=LocationReportRead, status_code=status.HTTP_201_CREATED)
def submit_report(
    report_in: LocationReportCreate,
    db: Session = Depends(get_db),
):
    """Submit a map correction or navigation problem report."""
    try:
        return report_service.create_location_report(db, report_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[LocationReportRead])
def list_reports(
    report_status: Optional[str] = Query(None, alias="status", description="Filter by status (pending, reviewing, resolved, rejected)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List submitted location and navigation reports."""
    return report_service.list_reports(db, status=report_status, skip=skip, limit=limit)


@router.patch("/{report_id}", response_model=LocationReportRead)
def update_report_status(
    report_id: uuid.UUID,
    report_in: LocationReportUpdate,
    db: Session = Depends(get_db),
):
    """Update report status and manage resolved timestamp."""
    rep = report_service.update_report_status(db, report_id, report_in)
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return rep
