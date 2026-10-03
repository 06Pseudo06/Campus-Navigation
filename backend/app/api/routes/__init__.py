"""API Route definitions."""

from fastapi import APIRouter
from app.api.routes import locations, routing, assistance

api_router = APIRouter()

api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(routing.router, prefix="/routing", tags=["Routing"])
api_router.include_router(assistance.router, prefix="/assistance", tags=["Assistance"])
