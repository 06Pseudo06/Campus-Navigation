"""User favorite locations service."""

import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.favorite import Favorite
from app.models.location import Location


def add_favorite(db: Session, user_id: uuid.UUID, location_id: uuid.UUID) -> Favorite:
    """Bookmark a campus location for a user."""
    loc = db.query(Location).filter(Location.id == location_id, Location.is_active.is_(True)).first()
    if not loc:
        raise ValueError("Location not found or inactive.")

    fav = db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.location_id == location_id).first()
    if fav:
        return fav

    new_fav = Favorite(user_id=user_id, location_id=location_id)
    db.add(new_fav)
    db.commit()
    db.refresh(new_fav)
    return new_fav


def remove_favorite(db: Session, user_id: uuid.UUID, location_id: uuid.UUID) -> bool:
    """Remove a bookmarked location."""
    fav = db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.location_id == location_id).first()
    if not fav:
        return False
    db.delete(fav)
    db.commit()
    return True


def list_user_favorites(db: Session, user_id: uuid.UUID) -> List[Favorite]:
    """Retrieve all bookmarked locations for a user."""
    return db.query(Favorite).filter(Favorite.user_id == user_id).all()
