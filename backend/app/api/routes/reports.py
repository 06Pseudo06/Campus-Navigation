"""Location reports and navigation issue submission API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id, get_db, require_admin_role
from app.core.config import settings
from app.core.security import decode_access_token
from app.schemas.report import LocationReportCreate, LocationReportRead, LocationReportUpdate
from app.services import report_service

router = APIRouter()


@router.post("/", response_model=LocationReportRead, status_code=status.HTTP_201_CREATED)
def submit_report(
    report_in: LocationReportCreate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Submit a map correction or navigation problem report (Public visitor/student endpoint)."""
    reporter_id = None
    if authorization or x_user_id:
        try:
            reporter_id = get_current_user_id(x_user_id=x_user_id, authorization=authorization)
        except Exception:
            pass

    try:
        return report_service.create_location_report(db, report_in, reporter_id=reporter_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/my-reports", response_model=List[LocationReportRead])
def list_my_reports(
    db: Session = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """List reports submitted by the currently authenticated user."""
    return report_service.list_reports(db, reporter_id=current_user_id)


@router.get("/", response_model=List[LocationReportRead])
def list_reports(
    report_status: Optional[str] = Query(None, alias="status", description="Filter by status (pending, reviewing, resolved, rejected)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """List submitted location and navigation reports (Moderator/Admin operation)."""
    return report_service.list_reports(db, status=report_status, skip=skip, limit=limit)


@router.get("/{report_id}", response_model=LocationReportRead)
def get_report(
    report_id: uuid.UUID,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
):
    """Retrieve details of a report (Staff/Admin or report owner)."""
    # 1. Require credentials
    if not (x_admin_key or authorization or x_user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view report details.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Check if admin
    is_admin = False
    if x_admin_key == settings.ADMIN_API_KEY:
        is_admin = True
    elif authorization:
        parts = authorization.strip().split()
        tok = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else parts[0]
        if tok == settings.ADMIN_API_KEY:
            is_admin = True
        else:
            try:
                claims = decode_access_token(tok)
                if claims.get("role") in ("admin", "moderator"):
                    is_admin = True
            except Exception:
                pass

    rep = report_service.get_report_by_id(db, report_id)
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    if is_admin:
        return rep

    # If not admin, check if caller is the reporter
    user_id = None
    try:
        user_id = get_current_user_id(x_user_id=x_user_id, authorization=authorization)
    except Exception:
        pass

    if user_id and rep.reporter_id == user_id:
        return rep

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED if not user_id else status.HTTP_403_FORBIDDEN,
        detail="Access forbidden: You cannot view this report.",
    )


@router.patch("/{report_id}", response_model=LocationReportRead)
def update_report(
    report_id: uuid.UUID,
    report_in: LocationReportUpdate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
):
    """Update report status, resolution notes (Staff/Admin), or description (Reporter only while pending)."""
    # 1. Require credentials
    if not (x_admin_key or authorization or x_user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Administrative or reporter credentials required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Check if admin or moderator
    is_admin = False
    if x_admin_key == settings.ADMIN_API_KEY:
        is_admin = True
    elif authorization:
        parts = authorization.strip().split()
        tok = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else parts[0]
        if tok == settings.ADMIN_API_KEY:
            is_admin = True
        else:
            try:
                claims = decode_access_token(tok)
                if claims.get("role") in ("admin", "moderator"):
                    is_admin = True
            except Exception:
                pass

    if is_admin:
        rep = report_service.get_report_by_id(db, report_id)
        if not rep:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
        updated = report_service.update_report_status(db, report_id, report_in)
        return updated

    # 3. If not admin, check if caller is the owner (reporter)
    caller_id = get_current_user_id(x_user_id=x_user_id, authorization=authorization)
    rep = report_service.get_report_by_id(db, report_id)
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    if not rep.reporter_id or rep.reporter_id != caller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot modify reports submitted by another user.",
        )

    # Reporters cannot change status or resolution_notes
    if report_in.status is not None or report_in.resolution_notes is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only administrators or moderators can alter report status or resolution notes.",
        )

    # Reporter can update description if still pending
    if rep.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update report description once review has begun.",
        )

    updated = report_service.update_report_status(db, report_id, report_in)
    return updated
