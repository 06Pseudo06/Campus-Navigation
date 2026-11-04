from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import Settings, settings
from app.api.routes import api_router

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

# Attach Complete Core API Router (Locations, Routing, Assistance, Favorites, Reports, Import, Auth)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Direct alias for browser cookie auth routes (/auth/...)
try:
    from app.api.v1.auth import router as auth_session_router
    app.include_router(auth_session_router, prefix="")
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
