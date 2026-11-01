"""Map import staging, external data provenance, and canonical promotion service."""

import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.location import Location, generate_slug
from app.models.map_import import MapImportBatch, StagedLocation
from app.schemas.location import LocationCreate
from app.schemas.map_import import (
    MapImportBatchCreate,
    PotentialDuplicateCandidate,
    StagedLocationCreate,
    StagedReviewRequest,
)
from app.services import location_service


def create_batch(db: Session, batch_in: MapImportBatchCreate) -> MapImportBatch:
    """Create a new external data import batch session."""
    batch = MapImportBatch(
        source_provider=batch_in.source_provider.strip().lower(),
        source_reference=batch_in.source_reference,
        description=batch_in.description,
        status="pending",
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def get_batch(db: Session, batch_id: uuid.UUID) -> Optional[MapImportBatch]:
    """Retrieve import batch details by UUID."""
    return db.query(MapImportBatch).filter(MapImportBatch.id == batch_id).first()


def list_batches(
    db: Session,
    skip: int = 0,
    limit: int = 50,
) -> List[MapImportBatch]:
    """List map import batches ordered by creation date."""
    return (
        db.query(MapImportBatch)
        .order_by(MapImportBatch.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def approx_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate approximate surface distance in meters between two WGS84 coordinate pairs."""
    r = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 1)


def detect_canonical_duplicates(
    db: Session,
    proposed_name: Optional[str],
    lat: Optional[float],
    lng: Optional[float],
) -> List[PotentialDuplicateCandidate]:
    """Identify possible duplicate candidates among existing canonical locations."""
    candidates: List[PotentialDuplicateCandidate] = []
    seen_ids = set()

    # 1. Name match detection
    if proposed_name and proposed_name.strip():
        clean_name = proposed_name.strip().lower()
        exact_matches = (
            db.query(Location)
            .filter(func.lower(Location.name) == clean_name, Location.is_active.is_(True))
            .limit(5)
            .all()
        )
        for m in exact_matches:
            seen_ids.add(m.id)
            dist = None
            if lat and lng and m.latitude and m.longitude:
                dist = approx_distance_meters(lat, lng, m.latitude, m.longitude)
            candidates.append(
                PotentialDuplicateCandidate(
                    id=m.id,
                    name=m.name,
                    slug=m.slug,
                    location_type=m.location_type,
                    is_verified=m.is_verified,
                    distance_approx_m=dist,
                    similarity_reason="Exact or close name match",
                )
            )

    # 2. Coordinate proximity detection (within ~60 meters)
    if lat is not None and lng is not None:
        # Bounding box filter (~0.001 degree is ~111 meters)
        delta_deg = 0.0006
        nearby_locs = (
            db.query(Location)
            .filter(
                Location.latitude.between(lat - delta_deg, lat + delta_deg),
                Location.longitude.between(lng - delta_deg, lng + delta_deg),
                Location.is_active.is_(True),
            )
            .limit(5)
            .all()
        )
        for n in nearby_locs:
            if n.id in seen_ids:
                continue
            if n.latitude and n.longitude:
                dist = approx_distance_meters(lat, lng, n.latitude, n.longitude)
                if dist <= 60.0:
                    candidates.append(
                        PotentialDuplicateCandidate(
                            id=n.id,
                            name=n.name,
                            slug=n.slug,
                            location_type=n.location_type,
                            is_verified=n.is_verified,
                            distance_approx_m=dist,
                            similarity_reason=f"Close physical proximity (~{int(dist)}m)",
                        )
                    )

    return candidates


def stage_location_record(
    db: Session,
    batch_id: uuid.UUID,
    record_in: StagedLocationCreate,
) -> StagedLocation:
    """Stage an external record with duplicate reference detection."""
    batch = get_batch(db, batch_id)
    if not batch:
        raise ValueError(f"Import batch {batch_id} not found.")

    provider = (record_in.source_provider or batch.source_provider).strip().lower()

    # Duplicate external reference check
    existing = (
        db.query(StagedLocation)
        .filter(
            StagedLocation.source_provider == provider,
            StagedLocation.external_element_id == record_in.external_element_id,
        )
        .first()
    )
    if existing:
        raise ValueError(
            f"External record '{record_in.external_element_id}' from provider '{provider}' "
            f"is already staged in batch {existing.batch_id} (Status: {existing.verification_status})."
        )

    staged = StagedLocation(
        batch_id=batch_id,
        source_provider=provider,
        external_element_type=record_in.external_element_type,
        external_element_id=record_in.external_element_id,
        source_url=record_in.source_url,
        original_tags=record_in.original_tags,
        proposed_name=record_in.proposed_name.strip() if record_in.proposed_name else None,
        proposed_location_type=record_in.proposed_location_type,
        latitude=record_in.latitude,
        longitude=record_in.longitude,
        address_details=record_in.address_details,
        verification_status="pending",
    )
    db.add(staged)
    batch.total_records += 1
    batch.status = "processing"
    db.commit()
    db.refresh(staged)
    return staged


def stage_geojson_feature_collection(
    db: Session,
    batch_id: uuid.UUID,
    geojson: Dict[str, Any],
    default_location_type: str = "building",
) -> Tuple[int, int]:
    """Parse a GeoJSON FeatureCollection and stage candidate features.
    
    Returns (success_count, skipped_count).
    """
    batch = get_batch(db, batch_id)
    if not batch:
        raise ValueError(f"Import batch {batch_id} not found.")

    features = geojson.get("features", [])
    if not isinstance(features, list):
        raise ValueError("Invalid GeoJSON: 'features' must be an array.")

    success_count = 0
    skipped_count = 0

    for idx, feat in enumerate(features):
        properties = feat.get("properties", {}) or {}
        geometry = feat.get("geometry", {}) or {}
        geom_type = geometry.get("type", "")
        coords = geometry.get("coordinates")

        # Resolve centroid or point coordinates
        lat: Optional[float] = None
        lon: Optional[float] = None

        if geom_type == "Point" and isinstance(coords, (list, tuple)) and len(coords) >= 2:
            lon, lat = float(coords[0]), float(coords[1])
        elif geom_type in ("Polygon", "MultiPolygon") and coords:
            # Simple average centroid approximation for polygon boundary
            try:
                poly_coords = coords[0] if geom_type == "Polygon" else coords[0][0]
                if poly_coords:
                    lon = sum(pt[0] for pt in poly_coords) / len(poly_coords)
                    lat = sum(pt[1] for pt in poly_coords) / len(poly_coords)
            except Exception:
                pass

        ext_id = (
            properties.get("id")
            or properties.get("@id")
            or properties.get("osm_id")
            or f"feature_{batch_id}_{idx}"
        )
        name = (
            properties.get("name")
            or properties.get("name:en")
            or properties.get("ref")
        )
        loc_type = (
            properties.get("building")
            or properties.get("amenity")
            or properties.get("highway")
            or default_location_type
        )
        if loc_type in ("yes", "true"):
            loc_type = default_location_type

        create_schema = StagedLocationCreate(
            external_element_type=geom_type or "Feature",
            external_element_id=str(ext_id),
            source_provider=batch.source_provider,
            source_url=properties.get("source_url"),
            original_tags=properties,
            proposed_name=name,
            proposed_location_type=loc_type,
            latitude=lat,
            longitude=lon,
            address_details=properties.get("addr:full") or properties.get("address"),
        )

        try:
            stage_location_record(db, batch_id, create_schema)
            success_count += 1
        except ValueError:
            skipped_count += 1

    return success_count, skipped_count


def list_staged_records(
    db: Session,
    batch_id: Optional[uuid.UUID] = None,
    verification_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[StagedLocation]:
    """List staged records with optional batch and status filters."""
    q = db.query(StagedLocation)
    if batch_id:
        q = q.filter(StagedLocation.batch_id == batch_id)
    if verification_status:
        q = q.filter(StagedLocation.verification_status == verification_status)
    return q.order_by(StagedLocation.created_at.desc()).offset(skip).limit(limit).all()


def get_staged_record(db: Session, record_id: uuid.UUID) -> Optional[StagedLocation]:
    """Retrieve staged record by UUID."""
    return db.query(StagedLocation).filter(StagedLocation.id == record_id).first()


def review_staged_record(
    db: Session,
    record_id: uuid.UUID,
    review_in: StagedReviewRequest,
    verifier_id: Optional[uuid.UUID] = None,
) -> StagedLocation:
    """Admin review of a staged record: approve (promotes to canonical) or reject."""
    staged = get_staged_record(db, record_id)
    if not staged:
        raise ValueError("Staged location record not found.")

    if staged.verification_status in ("approved", "rejected"):
        raise ValueError(f"Record has already been finalized as '{staged.verification_status}'.")

    now = datetime.now(timezone.utc)
    batch = get_batch(db, staged.batch_id)

    if review_in.action == "approve":
        # Determine canonical parameters
        canonical_name = review_in.approved_name or staged.proposed_name
        if not canonical_name:
            raise ValueError("Approved location must have a valid name.")

        canonical_type = review_in.approved_location_type or staged.proposed_location_type

        # Promote to canonical Location with is_verified=True
        loc_in = LocationCreate(
            name=canonical_name,
            location_type=canonical_type,
            latitude=staged.latitude,
            longitude=staged.longitude,
            address_details=staged.address_details,
            description=f"Imported from {staged.source_provider} ({staged.external_element_id}).",
            is_verified=True,
            is_active=True,
            parent_id=review_in.parent_id,
        )
        canonical_loc = location_service.create_location(db, loc_in, allow_verified=True)

        staged.verification_status = "approved"
        staged.canonical_location_id = canonical_loc.id
        staged.verified_by = verifier_id
        staged.verified_at = now

        if batch:
            batch.promoted_records += 1

    elif review_in.action == "reject":
        staged.verification_status = "rejected"
        staged.rejection_reason = review_in.rejection_reason or "Rejected during administrator map review."
        staged.verified_by = verifier_id
        staged.verified_at = now

        if batch:
            batch.rejected_records += 1

    # Check if batch is completed
    if batch and (batch.promoted_records + batch.rejected_records) >= batch.total_records:
        batch.status = "completed"

    db.commit()
    db.refresh(staged)
    return staged
