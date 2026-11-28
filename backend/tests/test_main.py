from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Verify health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_root():
    """Verify root endpoint returns status online."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_cors_vercel_allowed():
    """Verify CORS headers are returned for Vercel preview and production domains."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://campus-navigation-sandy.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://campus-navigation-sandy.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_google_redirect_uri_normalization():
    """Verify that GOOGLE_REDIRECT_URI autocorrects missing -c9q8 Render service suffix."""
    from app.core.config import Settings
    s = Settings(GOOGLE_REDIRECT_URI="https://campusway-api.onrender.com/api/v1/auth/google/callback")
    assert s.GOOGLE_REDIRECT_URI == "https://campusway-api-c9q8.onrender.com/api/v1/auth/google/callback"
