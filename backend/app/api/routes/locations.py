"""Campus locations API endpoints foundation."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_locations():
    """List searchable campus locations (buildings, gates, rooms, landmarks).
    
    Implementation to be added once data models are finalized.
    """
    return {"message": "Locations endpoint foundation"}


@router.get("/{location_id}")
def get_location(location_id: str):
    """Retrieve detailed information for a specific location.
    
    Implementation to be added once data models are finalized.
    """
    return {"location_id": location_id, "message": "Location details foundation"}
