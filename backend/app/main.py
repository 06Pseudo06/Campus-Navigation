from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import Settings, get_settings
from app.api.v1.auth import router as auth_router

# --- Module Routers (Locations, Routing, Assistance, Favorites, Reports, Imports) ---
from app.api.routes.locations import router as locations_router
from app.api.routes.routing import router as routing_router
from app.api.routes.assistance import router as assistance_router
from app.api.routes.favorites import router as favorites_router
from app.api.routes.reports import router as reports_router
from app.api.routes.imports import router as imports_router

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusWay Route Intelligence & Campus Navigation Service with Neon PostgreSQL",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS Middleware Configuration
origins = list(set(settings.CORS_ORIGINS + [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Module Routers — Campus Map, Routing, Assistance, Favorites, Reports, Imports
app.include_router(locations_router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(routing_router, prefix="/api/v1/routing", tags=["Routing"])
app.include_router(assistance_router, prefix="/api/v1/assistance", tags=["Assistance"])
app.include_router(favorites_router, prefix="/api/v1/favorites", tags=["Favorites"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(imports_router, prefix="/api/v1/imports", tags=["Imports"])

# Direct alias for browser cookie auth routes (/auth/...)
try:
    app.include_router(auth_router, prefix="")
except Exception:
    pass


@app.get("/health", tags=["Health"], summary="System Health Check")
@app.get("/api/v1/health", tags=["Health"], summary="System Health Check v1")
def health_check():
    """Health check endpoint to verify backend service availability."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "google_auth_configured": settings.is_google_configured,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"], summary="Service Root Status")
def root():
    """Service status and quick info."""
    return {
        "service": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "online",
        "version": "1.0.0",
    }
