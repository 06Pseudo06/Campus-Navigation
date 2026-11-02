"""Visitor assistance, destination lookup, and QR wayfinding API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id, get_db, require_admin_role, require_moderator_or_admin
from app.schemas.assistance import (
    AssistanceRequestCreate,
    AssistanceRequestRead,
    AssistanceRequestUpdate,
    QRGenerateRequest,
    QRResolveResponse,
    QRTokenResponse,
    VisitorDestinationCard,
)
from app.services import assistance_service

router = APIRouter()


@router.post("/requests", response_model=AssistanceRequestRead, status_code=status.HTTP_201_CREATED)
def submit_assistance_request(
    request_in: AssistanceRequestCreate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Submit a visitor help or navigation assistance request (Public visitor/student endpoint)."""
    user_id = None
    if authorization or x_user_id:
        try:
            user_id = get_current_user_id(x_user_id=x_user_id, authorization=authorization)
        except Exception:
            pass

    try:
        return assistance_service.create_assistance_request(db, request_in, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/requests", response_model=List[AssistanceRequestRead])
def list_assistance_requests(
    request_status: Optional[str] = Query(None, alias="status", description="Filter by status (pending, acknowledged, assigned, resolved)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _staff: str = Depends(require_moderator_or_admin),
):
    """List visitor assistance requests (Staff/Moderator/Admin operation)."""
    return assistance_service.list_assistance_requests(db, status=request_status, skip=skip, limit=limit)


@router.get("/requests/{request_id}", response_model=AssistanceRequestRead)
def get_assistance_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve details of an assistance request by ID."""
    req = assistance_service.get_assistance_request(db, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assistance request not found.")
    return req


@router.patch("/requests/{request_id}", response_model=AssistanceRequestRead)
def update_assistance_request(
    request_id: uuid.UUID,
    update_in: AssistanceRequestUpdate,
    db: Session = Depends(get_db),
    _staff: str = Depends(require_moderator_or_admin),
):
    """Update status, assign staff, and add resolution notes (Staff/Moderator/Admin operation)."""
    req = assistance_service.update_assistance_request(db, request_id, update_in)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assistance request not found.")
    return req


@router.get("/destinations", response_model=List[VisitorDestinationCard])
def list_visitor_destinations(
    query: Optional[str] = Query(None, description="Search destinations by name or slug"),
    category: Optional[str] = Query(None, description="Filter by category (gate, building, landmark, food_court)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Browse visitor-friendly destination guide cards with route topology status (Public endpoint)."""
    return assistance_service.list_visitor_destinations(
        db, query=query, category=category, skip=skip, limit=limit
    )


@router.post("/qr/generate", response_model=QRTokenResponse)
def generate_qr_token(
    qr_in: QRGenerateRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Generate a tamper-proof signpost QR wayfinding token (Administrative operation)."""
    try:
        return assistance_service.generate_qr_navigation_token(
            db,
            location_id=qr_in.location_id,
            node_id=qr_in.node_id,
            qr_type=qr_in.qr_type,
            expires_in_hours=qr_in.expires_in_hours,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/qr/resolve", response_model=QRResolveResponse)
def resolve_qr_token(
    token: str = Query(..., description="Scanned CWQR signpost token string"),
    db: Session = Depends(get_db),
):
    """Resolve a physical signpost QR token to target destination and route topology (Public endpoint)."""
    return assistance_service.resolve_qr_navigation_token(db, token)
