"""Campus location and hierarchy business service."""

import uuid
from typing import List, Optional
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.models.location import Location, LocationAlias, generate_slug, normalize_alias_text
from app.schemas.location import LocationCreate, LocationUpdate, LocationAliasCreate


def validate_no_parent_cycle(
    db: Session,
    location_id: Optional[uuid.UUID],
    proposed_parent_id: Optional[uuid.UUID],
) -> None:
    """Ensure setting proposed_parent_id does not cause a self-reference, missing parent, or circular hierarchy."""
    if not proposed_parent_id:
        return

    if location_id is not None and proposed_parent_id == location_id:
        raise ValueError("A location cannot be its own parent.")

    # Verify proposed parent exists
    parent_loc = db.query(Location).filter(Location.id == proposed_parent_id).first()
    if not parent_loc:
        raise ValueError(f"Parent location {proposed_parent_id} does not exist.")

    if not parent_loc.is_active:
        raise ValueError(f"Cannot set inactive location {proposed_parent_id} as parent.")

    # Walk up the ancestor tree of proposed_parent_id
    current_parent_id: Optional[uuid.UUID] = parent_loc.parent_id
    visited = {location_id, proposed_parent_id} if location_id else {proposed_parent_id}

    while current_parent_id is not None:
        if current_parent_id in visited:
            raise ValueError("Circular parent-child hierarchy detected in location lineage.")
        visited.add(current_parent_id)

        ancestor = db.query(Location.parent_id).filter(Location.id == current_parent_id).first()
        if not ancestor:
            break
        current_parent_id = ancestor[0]


def get_unique_slug(db: Session, base_slug: str, existing_id: Optional[uuid.UUID] = None) -> str:
    """Generate a unique slug, appending a numeric suffix if needed."""
    candidate = base_slug
    counter = 1
    while True:
        query = db.query(Location.id).filter(Location.slug == candidate)
        if existing_id is not None:
            query = query.filter(Location.id != existing_id)
        if not query.first():
            return candidate
        candidate = f"{base_slug}-{counter}"
        counter += 1


def list_locations(
    db: Session,
    query: Optional[str] = None,
    location_type: Optional[str] = None,
    is_verified: Optional[bool] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 50,
) -> List[Location]:
    """Retrieve and search active campus destinations with relevance ranking.
    
    Ranking precedence:
    1. Exact name match
    2. Exact alias match
    3. Prefix name match
    4. Partial substring name match
    5. Partial alias match
    """
    q = db.query(Location).filter(Location.is_active == is_active)

    if location_type:
        q = q.filter(Location.location_type == location_type)

    if is_verified is not None:
        q = q.filter(Location.is_verified == is_verified)

    if query:
        raw_query = query.strip()
        search_term = f"%{raw_query.lower()}%"
        norm_exact = normalize_alias_text(raw_query)
        norm_term = f"%{norm_exact}%"

        exact_alias_ids = (
            db.query(LocationAlias.location_id)
            .filter(LocationAlias.normalized_alias == norm_exact)
            .scalar_subquery()
        )
        partial_alias_ids = (
            db.query(LocationAlias.location_id)
            .filter(LocationAlias.normalized_alias.ilike(norm_term))
            .scalar_subquery()
        )

        relevance = case(
            (func.lower(Location.name) == raw_query.lower(), 1),
            (Location.id.in_(exact_alias_ids), 2),
            (Location.name.ilike(f"{raw_query.lower()}%"), 3),
            (Location.name.ilike(search_term), 4),
            (Location.id.in_(partial_alias_ids), 5),
            else_=6,
        )

        q = q.filter(
            or_(
                Location.name.ilike(search_term),
                Location.slug.ilike(search_term),
                Location.id.in_(partial_alias_ids),
            )
        ).order_by(relevance, Location.name.asc())
    else:
        q = q.order_by(Location.name.asc())

    return q.offset(skip).limit(limit).all()


def get_location_by_id(
    db: Session,
    location_id: uuid.UUID,
    include_inactive: bool = False,
) -> Optional[Location]:
    """Retrieve a location by UUID."""
    q = db.query(Location).filter(Location.id == location_id)
    if not include_inactive:
        q = q.filter(Location.is_active.is_(True))
    return q.first()


def get_location_hierarchy(db: Session, location_id: uuid.UUID) -> Optional[dict]:
    """Retrieve a location along with its ancestor lineage and direct children."""
    loc = get_location_by_id(db, location_id)
    if not loc:
        return None

    # Ancestors (bottom-up to top)
    ancestors: List[Location] = []
    curr_parent_id = loc.parent_id
    seen = {loc.id}
    while curr_parent_id and curr_parent_id not in seen:
        seen.add(curr_parent_id)
        parent = db.query(Location).filter(Location.id == curr_parent_id, Location.is_active.is_(True)).first()
        if not parent:
            break
        ancestors.append(parent)
        curr_parent_id = parent.parent_id

    # Direct children
    children = (
        db.query(Location)
        .filter(Location.parent_id == loc.id, Location.is_active.is_(True))
        .order_by(Location.name.asc())
        .all()
    )

    return {
        "location": loc,
        "ancestors": ancestors,
        "children": children,
    }


def get_location_ancestors(db: Session, location_id: uuid.UUID) -> List[Location]:
    """Retrieve the ancestor hierarchy lineage for a location."""
    hierarchy = get_location_hierarchy(db, location_id)
    return hierarchy["ancestors"] if hierarchy else []


def get_location_children(db: Session, location_id: uuid.UUID, is_active: bool = True) -> List[Location]:
    """Retrieve all direct sub-locations belonging to a location."""
    return (
        db.query(Location)
        .filter(Location.parent_id == location_id, Location.is_active == is_active)
        .order_by(Location.name.asc())
        .all()
    )


def create_location(db: Session, location_in: LocationCreate, allow_verified: bool = False) -> Location:
    """Create a new campus destination with duplicate detection.
    
    Ordinary location creation cannot arbitrarily mark a location as verified.
    """
    if location_in.parent_id:
        validate_no_parent_cycle(db, None, location_in.parent_id)

    # Duplicate sibling detection
    existing_duplicate = (
        db.query(Location)
        .filter(
            func.lower(Location.name) == location_in.name.strip().lower(),
            Location.parent_id == location_in.parent_id,
            Location.is_active.is_(True),
        )
        .first()
    )
    if existing_duplicate:
        raise ValueError(f"A location named '{location_in.name}' already exists under the specified parent area.")

    slug = location_in.slug or generate_slug(location_in.name)
    slug = get_unique_slug(db, slug)

    db_obj = Location(
        name=location_in.name.strip(),
        slug=slug,
        location_type=location_in.location_type,
        description=location_in.description,
        latitude=location_in.latitude,
        longitude=location_in.longitude,
        address_details=location_in.address_details,
        is_verified=location_in.is_verified if allow_verified else False,
        is_active=location_in.is_active,
        parent_id=location_in.parent_id,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_location(
    db: Session,
    location_id: uuid.UUID,
    location_in: LocationUpdate,
) -> Optional[Location]:
    """Update an existing campus location with cycle prevention."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        return None

    update_data = location_in.model_dump(exclude_unset=True)

    # Protect is_verified: cannot be altered through generic update
    update_data.pop("is_verified", None)

    if "parent_id" in update_data and update_data["parent_id"] != loc.parent_id:
        validate_no_parent_cycle(db, location_id, update_data["parent_id"])

    if "slug" in update_data and update_data["slug"]:
        update_data["slug"] = get_unique_slug(db, update_data["slug"], existing_id=location_id)
    elif "name" in update_data and "slug" not in update_data:
        update_data["slug"] = get_unique_slug(db, generate_slug(update_data["name"]), existing_id=location_id)

    for field, val in update_data.items():
        setattr(loc, field, val)

    db.commit()
    db.refresh(loc)
    return loc


def verify_location(
    db: Session,
    location_id: uuid.UUID,
    is_verified: bool = True,
) -> Optional[Location]:
    """Authorized administrative verification workflow."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        return None
    loc.is_verified = is_verified
    db.commit()
    db.refresh(loc)
    return loc


def _recursively_deactivate_children(db: Session, parent_id: uuid.UUID) -> None:
    """Helper to cascade soft deactivation down child tree."""
    children = db.query(Location).filter(Location.parent_id == parent_id, Location.is_active.is_(True)).all()
    for child in children:
        child.is_active = False
        _recursively_deactivate_children(db, child.id)


def deactivate_location(
    db: Session,
    location_id: uuid.UUID,
    cascade: bool = False,
) -> Optional[Location]:
    """Soft-deactivate a location record with child dependency policy.
    
    If active child locations exist and cascade=False, raises ValueError to protect graph integrity.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        return None

    active_children = (
        db.query(Location)
        .filter(Location.parent_id == location_id, Location.is_active.is_(True))
        .all()
    )
    if active_children:
        if not cascade:
            raise ValueError(
                f"Cannot deactivate location '{loc.name}': it currently contains "
                f"{len(active_children)} active sub-location(s). Deactivate or reassign them first, "
                "or specify cascade=true."
            )
        _recursively_deactivate_children(db, location_id)

    loc.is_active = False
    db.commit()
    db.refresh(loc)
    return loc


def add_location_alias(
    db: Session,
    location_id: uuid.UUID,
    alias_in: LocationAliasCreate,
) -> LocationAlias:
    """Add a search alias to a location."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise ValueError("Location not found.")

    normalized = normalize_alias_text(alias_in.alias)
    if not normalized:
        raise ValueError("Normalized alias cannot be empty.")

    existing = (
        db.query(LocationAlias)
        .filter(
            LocationAlias.location_id == location_id,
            LocationAlias.normalized_alias == normalized,
        )
        .first()
    )
    if existing:
        return existing

    db_alias = LocationAlias(
        location_id=location_id,
        alias=alias_in.alias.strip(),
        normalized_alias=normalized,
    )
    db.add(db_alias)
    db.commit()
    db.refresh(db_alias)
    return db_alias
