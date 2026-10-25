"""Campus location and hierarchy business service."""

import uuid
from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.location import Location, LocationAlias, generate_slug, normalize_alias_text
from app.schemas.location import LocationCreate, LocationUpdate, LocationAliasCreate


def validate_no_parent_cycle(
    db: Session,
    location_id: Optional[uuid.UUID],
    proposed_parent_id: Optional[uuid.UUID],
) -> None:
    """Ensure setting proposed_parent_id does not cause a self-reference or circular hierarchy."""
    if not proposed_parent_id:
        return

    if location_id is not None and proposed_parent_id == location_id:
        raise ValueError("A location cannot be its own parent.")

    # Walk up the ancestor tree of proposed_parent_id
    current_parent_id: Optional[uuid.UUID] = proposed_parent_id
    visited = {location_id} if location_id else set()

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
    is_active: bool = True,
    skip: int = 0,
    limit: int = 50,
) -> List[Location]:
    """Retrieve and search active campus destinations."""
    q = db.query(Location).filter(Location.is_active == is_active)

    if location_type:
        q = q.filter(Location.location_type == location_type)

    if query:
        search_term = f"%{query.strip().lower()}%"
        norm_term = f"%{normalize_alias_text(query)}%"
        # Match location name or any associated alias
        alias_select = (
            db.query(LocationAlias.location_id)
            .filter(LocationAlias.normalized_alias.ilike(norm_term))
            .scalar_subquery()
        )
        q = q.filter(
            or_(
                Location.name.ilike(search_term),
                Location.slug.ilike(search_term),
                Location.id.in_(
                    db.query(LocationAlias.location_id)
                    .filter(LocationAlias.normalized_alias.ilike(norm_term))
                ),
            )
        )

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

    # Children
    children = (
        db.query(Location)
        .filter(Location.parent_id == loc.id, Location.is_active.is_(True))
        .all()
    )

    return {
        "location": loc,
        "ancestors": ancestors,
        "children": children,
    }


def create_location(db: Session, location_in: LocationCreate) -> Location:
    """Create a new campus location."""
    if location_in.parent_id:
        validate_no_parent_cycle(db, None, location_in.parent_id)

    slug = location_in.slug or generate_slug(location_in.name)
    slug = get_unique_slug(db, slug)

    db_obj = Location(
        name=location_in.name,
        slug=slug,
        location_type=location_in.location_type,
        description=location_in.description,
        latitude=location_in.latitude,
        longitude=location_in.longitude,
        address_details=location_in.address_details,
        is_verified=location_in.is_verified,
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
    """Update an existing campus location."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        return None

    update_data = location_in.model_dump(exclude_unset=True)

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


def deactivate_location(db: Session, location_id: uuid.UUID) -> Optional[Location]:
    """Soft-deactivate a location to protect navigation graph integrity."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        return None
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
