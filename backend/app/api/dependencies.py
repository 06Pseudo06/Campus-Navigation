"""API dependencies module.

Provides database session management, administrative authorization checks,
and user identity resolution supporting both JWT bearer tokens and developer API keys.
"""

import uuid
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


def require_admin_role(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> str:
    """Enforce administrative role on protected write and moderation operations.

    Accepts:
    1. Static administrative secret via 'X-Admin-Key' or 'Authorization: Bearer <key>'
    2. Valid JWT Bearer token with role='admin'
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

    # 1. Match static admin API key
    if token == settings.ADMIN_API_KEY:
        return "admin"

    # 2. Check if valid JWT with role='admin'
    try:
        payload = decode_access_token(token)
        if payload.get("role") == "admin":
            return "admin"
    except ValueError:
        pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access forbidden: Invalid administrative credentials.",
    )


def get_current_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> uuid.UUID:
    """Resolve current user identity for user-scoped operations (e.g. favorites).

    Accepts:
    1. JWT bearer token (extracts 'sub' claim as user UUID)
    2. Raw user UUID via 'X-User-ID' or 'Authorization: Bearer <uuid>'
    """
    candidate = x_user_id
    if not candidate and authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            candidate = parts[1]
        else:
            candidate = authorization.strip()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: User session is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = candidate.strip()

    # Attempt JWT decode first if looks like JWT
    if token_str.count(".") == 2:
        try:
            payload = decode_access_token(token_str)
            sub = payload.get("sub")
            if sub:
                return uuid.UUID(sub)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired user session token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Fallback to direct UUID string
    try:
        return uuid.UUID(token_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format in authentication credential.",
        )


def get_current_user(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> User:
    """Retrieve the currently authenticated User model instance."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been disabled.",
        )
    return user


def require_moderator_or_admin(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> str:
    """Allow administrative or moderator roles."""
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
            detail="Authentication required: Staff privileges required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if token == settings.ADMIN_API_KEY:
        return "admin"

    try:
        payload = decode_access_token(token)
        role = payload.get("role")
        if role in ("admin", "moderator"):
            return role
    except ValueError:
        pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access forbidden: Insufficient privileges.",
    )


__all__ = [
    "get_db",
    "require_admin_role",
    "require_moderator_or_admin",
    "get_current_user_id",
    "get_current_user",
]

