from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusWay Route Intelligence & Campus Service API",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service availability."""
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": "0.1.0"}


@app.get("/", tags=["Root"])
def root():
    """Service status and quick info."""
    return {
        "service": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "online",
    }
