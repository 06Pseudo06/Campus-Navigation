"""Location and map issue reports service."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.edge import Edge
from app.models.location import Location
from app.models.node import Node
from app.models.report import LocationReport
from app.schemas.report import LocationReportCreate, LocationReportUpdate


VALID_REPORT_TYPES = {
    "wrong_pin",
    "blocked_path",
    "inaccessible_path",
    "missing_place",
    "closed_facility",
    "name_incorrect",
    "other",
}


def create_location_report(
    db: Session,
    report_in: LocationReportCreate,
    reporter_id: Optional[uuid.UUID] = None,
) -> LocationReport:
    """Create a new report with target entity validation and optional reporter identity."""
    # Validate target entities exist if provided
    if report_in.location_id:
        if not db.query(Location.id).filter(Location.id == report_in.location_id).first():
            raise ValueError(f"Referenced location {report_in.location_id} does not exist.")

    if report_in.node_id:
        if not db.query(Node.id).filter(Node.id == report_in.node_id).first():
            raise ValueError(f"Referenced node {report_in.node_id} does not exist.")

    if report_in.edge_id:
        if not db.query(Edge.id).filter(Edge.id == report_in.edge_id).first():
            raise ValueError(f"Referenced edge {report_in.edge_id} does not exist.")

    rep_type = report_in.report_type.strip().lower()

    db_report = LocationReport(
        reporter_id=reporter_id or report_in.reporter_id,
        location_id=report_in.location_id,
        node_id=report_in.node_id,
        edge_id=report_in.edge_id,
        report_type=rep_type,
        description=report_in.description,
        status="pending",
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def get_report_by_id(db: Session, report_id: uuid.UUID) -> Optional[LocationReport]:
    """Retrieve report by UUID."""
    return db.query(LocationReport).filter(LocationReport.id == report_id).first()


def list_reports(
    db: Session,
    status: Optional[str] = None,
    reporter_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[LocationReport]:
    """List reports, optionally filtered by status and reporter."""
    q = db.query(LocationReport)
    if status:
        q = q.filter(LocationReport.status == status)
    if reporter_id:
        q = q.filter(LocationReport.reporter_id == reporter_id)
    return q.order_by(LocationReport.created_at.desc()).offset(skip).limit(limit).all()


def update_report_status(
    db: Session,
    report_id: uuid.UUID,
    report_in: LocationReportUpdate,
) -> Optional[LocationReport]:
    """Update report status, record resolution notes, and manage resolved_at timestamp."""
    rep = db.query(LocationReport).filter(LocationReport.id == report_id).first()
    if not rep:
        return None

    if report_in.status:
        rep.status = report_in.status
        if report_in.status in ("resolved", "rejected"):
            rep.resolved_at = datetime.now(timezone.utc)
        elif report_in.status in ("pending", "reviewing"):
            rep.resolved_at = None

    if report_in.description is not None:
        rep.description = report_in.description

    if report_in.resolution_notes is not None:
        rep.resolution_notes = report_in.resolution_notes

    db.commit()
    db.refresh(rep)
    return rep
