"""User favorites API endpoints."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user_id
from app.schemas.favorite import FavoriteCreate, FavoriteRead
from app.services import favorite_service

router = APIRouter()


@router.get("/{user_id}", response_model=List[FavoriteRead])
def list_favorites(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Retrieve all bookmarked locations for a specific user profile (Authenticated user only)."""
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot access favorites belonging to another user.",
        )
    return favorite_service.list_user_favorites(db, user_id)


@router.post("/", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
def add_favorite(
    favorite_in: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Save a campus location to user favorites (Authenticated user only)."""
    if favorite_in.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot add favorites on behalf of another user.",
        )
    try:
        return favorite_service.add_favorite(db, favorite_in.user_id, favorite_in.location_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{user_id}/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    user_id: uuid.UUID,
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Remove a location from user favorites (Authenticated user only)."""
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot delete favorites belonging to another user.",
        )
    removed = favorite_service.remove_favorite(db, user_id, location_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite bookmark not found.")
    return None
