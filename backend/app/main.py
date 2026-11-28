from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.gzip import GZipMiddleware
from app.core.config import Settings, settings
from app.core.database import active_db_mode, engine
from app.api.routes import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusWay Route Intelligence & Campus Navigation Service with Neon PostgreSQL",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Fail safe on production startup if required secrets or DB are missing/placeholder
settings.validate_production_startup()

# GZip Compression Middleware for large responses (locations, graphs, routes)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Middleware Configuration
origins = list(set(settings.CORS_ORIGINS + [
    settings.FRONTEND_URL,
    "https://campus-navigation-sandy.vercel.app",
    "https://campusway-frontend-preview.vercel.app",
    "https://campusway.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
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
    """Lightweight process health check endpoint to verify backend service availability."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "google_auth_configured": settings.is_google_configured,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/ready", tags=["Health"], summary="System Readiness Check (Database Connectivity)")
@app.get("/api/v1/ready", tags=["Health"], summary="System Readiness Check v1 (Database Connectivity)")
def readiness_check():
    """Readiness probe validating database connectivity via SELECT 1.
    
    Returns HTTP 200 when database connectivity is healthy and operational.
    Returns HTTP 503 Service Unavailable when database connectivity fails,
    without leaking connection strings, credentials, or internal stack traces.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "service": settings.PROJECT_NAME,
            "database": "connected",
            "mode": active_db_mode,
            "environment": settings.ENVIRONMENT,
        }
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "service": settings.PROJECT_NAME,
                "database": "disconnected",
                "detail": "Database connectivity check failed",
            },
        )


@app.get("/", tags=["Root"], summary="Service Root Status")
def root():
    """Service status and quick info."""
    return {
        "service": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "online",
        "version": "1.0.0",
    }
