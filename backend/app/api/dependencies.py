"""API dependencies placeholder.

Common dependencies such as authentication, database sessions, and service providers
will be injected into route handlers from this module.
"""

from app.core.database import get_db

__all__ = ["get_db"]
