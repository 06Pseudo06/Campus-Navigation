"""API dependencies module.

Provides database session management, administrative authorization checks,
and user identity resolution supporting both JWT bearer tokens and developer API keys.
"""

import uuid
from typing import Optional
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


async def require_admin_role(
    request: Request,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> str:
    """Enforce administrative role on protected write and moderation operations.

    Accepts:
    1. Static administrative secret via 'X-Admin-Key' or 'Authorization: Bearer <key>'
    2. Valid JWT Bearer token with role='admin'
    3. Authenticated session cookie ('campusway_session') belonging to an active user with role='admin'
    """
    # 1. Match static admin API key header
    if x_admin_key:
        if x_admin_key.strip() == settings.ADMIN_API_KEY:
            return "admin"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Invalid administrative credentials.",
        )

    # 2. Check Authorization header
    token = None
    if authorization:
        parts = authorization.strip().split()
        token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else authorization.strip()

    if token:
        if token == settings.ADMIN_API_KEY:
            return "admin"
        try:
            payload = decode_access_token(token)
            if payload.get("role") == "admin":
                return "admin"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Insufficient administrative privileges.",
            )
        except HTTPException:
            raise
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 3. Check session cookie
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_token:
        from app.core.security import get_security_manager
        from app.services.user_store import get_in_memory_user_repository
        security_manager = get_security_manager()
        token_data = security_manager.extract_session_token_data(session_token)
        if token_data and "user_id" in token_data:
            repo = get_in_memory_user_repository()
            user = repo.get_by_id(token_data["user_id"])
            if user:
                if not getattr(user, "is_active", True):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account is inactive. Please contact support.",
                    )
                if getattr(user, "role", "student") == "admin":
                    return "admin"
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: Insufficient administrative privileges.",
                )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required: Administrative privileges required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_admin_user(
    request: Request,
    _admin_role: str = Depends(require_admin_role),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> dict:
    """Resolve acting administrator information for audit logging and route actions."""
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_token:
        from app.core.security import get_security_manager
        from app.services.user_store import get_in_memory_user_repository
        token_data = get_security_manager().extract_session_token_data(session_token)
        if token_data and "user_id" in token_data:
            user = get_in_memory_user_repository().get_by_id(token_data["user_id"])
            if user:
                return {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                }

    if authorization:
        parts = authorization.strip().split()
        tok = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else authorization.strip()
        try:
            payload = decode_access_token(tok)
            return {
                "id": str(payload.get("sub", "admin-jwt")),
                "email": payload.get("email", "admin@campusway.lpu.in"),
                "name": "Admin User",
                "role": "admin",
            }
        except Exception:
            pass

    return {
        "id": "admin-system",
        "email": "admin@campusway.lpu.in",
        "name": "System Administrator",
        "role": "admin",
    }


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
    "get_current_admin_user",
]

