"""Visitor navigation assistance, destination lookup, and QR wayfinding service."""

import math
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import _b64_url_decode, _b64_url_encode
from app.models.assistance import AssistanceRequest
from app.models.edge import Edge
from app.models.location import Location
from app.models.node import Node
from app.schemas.assistance import (
    AssistanceRequestCreate,
    AssistanceRequestUpdate,
    QRResolveResponse,
    QRTokenResponse,
    VisitorDestinationCard,
)


def create_assistance_request(
    db: Session,
    req_in: AssistanceRequestCreate,
    user_id: Optional[uuid.UUID] = None,
) -> AssistanceRequest:
    """Submit a visitor help or navigation assistance request."""
    # Validate target and location entities exist if specified
    if req_in.current_location_id:
        if not db.query(Location.id).filter(Location.id == req_in.current_location_id).first():
            raise ValueError(f"Referenced current location {req_in.current_location_id} does not exist.")

    if req_in.target_location_id:
        if not db.query(Location.id).filter(Location.id == req_in.target_location_id).first():
            raise ValueError(f"Referenced target destination {req_in.target_location_id} does not exist.")

    if req_in.current_node_id:
        if not db.query(Node.id).filter(Node.id == req_in.current_node_id).first():
            raise ValueError(f"Referenced waypoint node {req_in.current_node_id} does not exist.")

    db_req = AssistanceRequest(
        requester_name=req_in.requester_name,
        contact_phone=req_in.contact_phone,
        user_id=user_id,
        current_location_id=req_in.current_location_id,
        current_node_id=req_in.current_node_id,
        target_location_id=req_in.target_location_id,
        assistance_type=req_in.assistance_type,
        description=req_in.description,
        status="pending",
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req


def list_assistance_requests(
    db: Session,
    status: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[AssistanceRequest]:
    """List assistance requests with optional status and user scoping."""
    q = db.query(AssistanceRequest)
    if status:
        q = q.filter(AssistanceRequest.status == status)
    if user_id:
        q = q.filter(AssistanceRequest.user_id == user_id)
    return q.order_by(AssistanceRequest.created_at.desc()).offset(skip).limit(limit).all()


def get_assistance_request(db: Session, request_id: uuid.UUID) -> Optional[AssistanceRequest]:
    """Retrieve assistance request by UUID."""
    return db.query(AssistanceRequest).filter(AssistanceRequest.id == request_id).first()


def update_assistance_request(
    db: Session,
    request_id: uuid.UUID,
    update_in: AssistanceRequestUpdate,
) -> Optional[AssistanceRequest]:
    """Staff/Admin management of assistance requests."""
    req = get_assistance_request(db, request_id)
    if not req:
        return None

    if update_in.status:
        req.status = update_in.status
        if update_in.status in ("resolved", "cancelled"):
            req.resolved_at = datetime.now(timezone.utc)
        elif update_in.status in ("pending", "acknowledged", "assigned"):
            req.resolved_at = None

    if update_in.assigned_to:
        req.assigned_to = update_in.assigned_to

    if update_in.resolution_notes is not None:
        req.resolution_notes = update_in.resolution_notes

    db.commit()
    db.refresh(req)
    return req


def check_location_route_topology(db: Session, location_id: uuid.UUID) -> Tuple[bool, Optional[uuid.UUID]]:
    """Determine if a location has associated navigation nodes and active walkable connections.
    
    Returns (has_route_topology: bool, nearest_node_id: Optional[UUID]).
    """
    node = (
        db.query(Node)
        .filter(Node.location_id == location_id, Node.is_active.is_(True))
        .first()
    )
    if not node:
        return False, None

    # Check if this node has at least one active edge
    has_edges = (
        db.query(Edge.id)
        .filter(
            or_(Edge.source_node_id == node.id, Edge.target_node_id == node.id),
            Edge.is_active.is_(True),
        )
        .first()
    )
    return bool(has_edges), node.id


def list_visitor_destinations(
    db: Session,
    query: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[VisitorDestinationCard]:
    """Retrieve visitor-oriented destinations (gates, buildings, landmarks, food courts) with guidance."""
    q = db.query(Location).filter(Location.is_active.is_(True))

    if category:
        q = q.filter(Location.location_type == category)

    if query:
        q = q.filter(
            or_(
                Location.name.ilike(f"%{query.strip()}%"),
                Location.slug.ilike(f"%{query.strip()}%"),
            )
        )

    locs = q.order_by(Location.name.asc()).offset(skip).limit(limit).all()
    results = []

    for loc in locs:
        has_topology, node_id = check_location_route_topology(db, loc.id)
        guidance = "Pedestrian access point verified." if has_topology else "Navigation topology pending campus ground mapping."
        results.append(
            VisitorDestinationCard(
                id=loc.id,
                name=loc.name,
                slug=loc.slug,
                location_type=loc.location_type,
                description=loc.description,
                latitude=loc.latitude,
                longitude=loc.longitude,
                address_details=loc.address_details,
                is_accessible=True,
                nearest_node_id=node_id,
                has_route_topology=has_topology,
                visitor_guidance=guidance,
            )
        )
    return results


def generate_qr_navigation_token(
    db: Session,
    location_id: uuid.UUID,
    node_id: Optional[uuid.UUID] = None,
    qr_type: str = "destination",
    expires_in_hours: int = 720,
) -> QRTokenResponse:
    """Generate a tamper-proof QR code wayfinding token encoding a safe application reference."""
    loc = db.query(Location).filter(Location.id == location_id, Location.is_active.is_(True)).first()
    if not loc:
        raise ValueError(f"Active location {location_id} not found.")

    has_topology, default_node_id = check_location_route_topology(db, loc.id)
    resolved_node_id = node_id or default_node_id

    import hmac
    import hashlib
    import json

    exp_ts = int(time.time()) + (expires_in_hours * 3600)
    token_payload = {
        "ver": 1,
        "type": "campusway_qr",
        "qr_type": qr_type,
        "loc_id": str(loc.id),
        "node_id": str(resolved_node_id) if resolved_node_id else None,
        "exp": exp_ts,
    }
    payload_b64 = _b64_url_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = _b64_url_encode(sig)

    token = f"CWQR.{payload_b64}.{sig_b64}"

    return QRTokenResponse(
        token=token,
        qr_type=qr_type,
        location_id=loc.id,
        location_name=loc.name,
        has_route_topology=has_topology,
        expires_at=datetime.fromtimestamp(exp_ts, tz=timezone.utc),
    )


def resolve_qr_navigation_token(db: Session, token: str) -> QRResolveResponse:
    """Decode and validate a scanned physical QR wayfinding signpost token."""
    import hmac
    import hashlib
    import json

    try:
        parts = token.strip().split(".")
        if len(parts) != 3 or parts[0] != "CWQR":
            return QRResolveResponse(
                valid=False,
                qr_type="unknown",
                has_route_topology=False,
                routing_available=False,
                status_message="Invalid QR code reference format.",
            )

        payload_b64, sig_b64 = parts[1], parts[2]
        expected_sig = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        provided_sig = _b64_url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return QRResolveResponse(
                valid=False,
                qr_type="unknown",
                has_route_topology=False,
                routing_available=False,
                status_message="Tampered or unverified QR signature.",
            )

        payload = json.loads(_b64_url_decode(payload_b64).decode("utf-8"))
        exp_ts = payload.get("exp", 0)
        if exp_ts < int(time.time()):
            return QRResolveResponse(
                valid=False,
                qr_type=payload.get("qr_type", "destination"),
                has_route_topology=False,
                routing_available=False,
                status_message="QR wayfinding token has expired. Request updated signpost token.",
            )

        loc_id = uuid.UUID(payload["loc_id"])
        loc = db.query(Location).filter(Location.id == loc_id).first()
        if not loc or not loc.is_active:
            return QRResolveResponse(
                valid=False,
                qr_type=payload.get("qr_type", "destination"),
                has_route_topology=False,
                routing_available=False,
                status_message="Referenced destination has been deactivated or relocated.",
            )

        has_topology, nearest_node = check_location_route_topology(db, loc.id)
        suggested_target = nearest_node or (uuid.UUID(payload["node_id"]) if payload.get("node_id") else None)

        card = VisitorDestinationCard(
            id=loc.id,
            name=loc.name,
            slug=loc.slug,
            location_type=loc.location_type,
            description=loc.description,
            latitude=loc.latitude,
            longitude=loc.longitude,
            address_details=loc.address_details,
            is_accessible=True,
            nearest_node_id=suggested_target,
            has_route_topology=has_topology,
            visitor_guidance=(
                "Verified walking route available to destination."
                if has_topology
                else "Destination mapped; pedestrian path topology awaiting campus map team survey."
            ),
        )

        msg = (
            "Wayfinding destination resolved with active route topology."
            if has_topology
            else "Notice: Destination verified, but path topology is currently pending."
        )

        return QRResolveResponse(
            valid=True,
            qr_type=payload.get("qr_type", "destination"),
            destination=card,
            suggested_target_node_id=suggested_target,
            has_route_topology=has_topology,
            routing_available=has_topology,
            status_message=msg,
        )

    except Exception as e:
        return QRResolveResponse(
            valid=False,
            qr_type="unknown",
            has_route_topology=False,
            routing_available=False,
            status_message=f"Failed to resolve QR token: {str(e)}",
        )
