"""User favorites API endpoints."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.favorite import FavoriteCreate, FavoriteRead
from app.services import favorite_service

router = APIRouter()


@router.get("/{user_id}", response_model=List[FavoriteRead])
def list_favorites(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve all bookmarked locations for a specific user profile."""
    return favorite_service.list_user_favorites(db, user_id)


@router.post("/", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
def add_favorite(
    favorite_in: FavoriteCreate,
    db: Session = Depends(get_db),
):
    """Save a campus location to a user's favorites list."""
    try:
        return favorite_service.add_favorite(db, favorite_in.user_id, favorite_in.location_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{user_id}/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    user_id: uuid.UUID,
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Remove a location from user favorites."""
    removed = favorite_service.remove_favorite(db, user_id, location_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite bookmark not found.")
    return None
