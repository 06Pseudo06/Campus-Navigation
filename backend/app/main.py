from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.v1.auth import router as auth_router

settings = get_settings()

app = FastAPI(
    title="CampusWay API",
    description="Campus Navigation & Wayfinding Backend Service with Google OAuth Authentication",
    version="1.0.0",
)

# Configure Credentialed CORS for frontend communication
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Auth Routers
# Primary API v1 route prefix
app.include_router(auth_router, prefix="/api/v1")
# Direct alias to support both /auth/... and /api/v1/auth/...
app.include_router(auth_router, prefix="")


from fastapi import Depends
from app.config import Settings, get_settings

@app.get("/health", tags=["Health"], summary="System Health Check")
@app.get("/api/v1/health", tags=["Health"], summary="System Health Check v1")
async def health_check(settings: Settings = Depends(get_settings)):
    """Returns system status and configuration health."""
    return {
        "status": "healthy",
        "service": "campusway-backend",
        "version": "1.0.0",
        "google_auth_configured": settings.is_google_configured,
        "environment": settings.ENVIRONMENT,
    }
