"""API Route definitions."""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.routes import imports, locations, routing, assistance, favorites, reports

api_router = APIRouter()

api_router.include_router(auth_router, prefix="", tags=["Authentication"])
api_router.include_router(imports.router, prefix="/import", tags=["Map Import"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(routing.router, prefix="/routing", tags=["Routing"])
api_router.include_router(assistance.router, prefix="/assistance", tags=["Assistance"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
