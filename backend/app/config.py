"""Application configuration re-export for backward compatibility."""

from app.core.config import Settings, settings


def get_settings() -> Settings:
    """Dependency injection helper returning the global singleton settings."""
    return settings
