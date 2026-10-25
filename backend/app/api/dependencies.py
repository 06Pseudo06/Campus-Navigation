"""API dependencies module.

Provides database session management, administrative authorization checks,
and user identity resolution as integration boundaries for teammate auth implementation.
"""

import uuid
from typing import Optional
from fastapi import Header, HTTPException, status

from app.core.config import settings
from app.core.database import get_db


def require_admin_role(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> str:
    """Enforce administrative role on protected write and moderation operations.

    Authentication Integration Boundary:
    Guards administrative operations against unauthenticated access. Accepts an admin API key
    via 'X-Admin-Key' or 'Authorization: Bearer <key>'. Requests without credentials return 401;
    invalid credentials return 403.
    """
    token = None
    if x_admin_key:
        token = x_admin_key.strip()
    elif authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        else:
            token = authorization.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Administrative privileges required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if token != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Invalid administrative credentials.",
        )

    return "admin"


def get_current_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> uuid.UUID:
    """Resolve current user identity for user-scoped operations (e.g. favorites).

    Authentication Integration Boundary:
    Requires a valid user UUID provided via 'X-User-ID' or 'Authorization: Bearer <uuid>'.
    Missing credentials return 401; malformed UUIDs return 400.
    """
    candidate = x_user_id
    if not candidate and authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            candidate = parts[1]

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: User session is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return uuid.UUID(candidate.strip())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format in authentication credential.",
        )


__all__ = [
    "get_db",
    "require_admin_role",
    "get_current_user_id",
]
