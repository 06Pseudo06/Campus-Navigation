"""CampusWay Administrative Control Centre API routes."""

import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.dependencies import get_current_admin_user, get_db, require_admin_role
from app.core.config import settings
from app.models.assistance import AssistanceRequest
from app.models.edge import Edge
from app.models.location import Location
from app.models.node import Node
from app.models.report import LocationReport
from app.schemas.audit_log import AuditLogRead
from app.schemas.user import UserResponse
from app.services import audit_service
from app.services.graph_service import invalidate_graph_cache
from app.services.user_store import get_user_repository

router = APIRouter()


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Role to assign: student, admin, moderator")


class StatusUpdateRequest(BaseModel):
    is_active: bool = Field(..., description="Account active status")


class DashboardStatsResponse(BaseModel):
    users: Dict[str, int]
    locations: Dict[str, Any]
    routing: Dict[str, int]
    assistance: Dict[str, int]
    reports: Dict[str, int]
    system: Dict[str, Any]
    recent_activity: List[AuditLogRead]


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    skip: int
    limit: int


# =====================================================================
# 1. Dashboard Overview & Real System Analytics
# =====================================================================

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    user_repo: Any = Depends(get_user_repository),
    _admin: str = Depends(require_admin_role),
):
    """Retrieve comprehensive system statistics and recent administrative activity."""
    # 1. User stats (from user store)
    try:
        user_stats = user_repo.count_stats()
    except Exception:
        user_stats = {"total": 0, "active": 0, "inactive": 0, "students": 0, "admins": 0, "moderators": 0}

    # 2. Location stats
    total_locations = db.query(func.count(Location.id)).scalar() or 0
    verified_locations = db.query(func.count(Location.id)).filter(Location.is_verified.is_(True)).scalar() or 0
    active_locations = db.query(func.count(Location.id)).filter(Location.is_active.is_(True)).scalar() or 0

    category_counts = {}
    cat_rows = (
        db.query(Location.location_type, func.count(Location.id))
        .filter(Location.is_active.is_(True))
        .group_by(Location.location_type)
        .all()
    )
    for cat, count in cat_rows:
        category_counts[cat or "other"] = count

    # 3. Routing graph stats
    total_nodes = db.query(func.count(Node.id)).scalar() or 0
    active_nodes = db.query(func.count(Node.id)).filter(Node.is_active.is_(True)).scalar() or 0
    accessible_nodes = db.query(func.count(Node.id)).filter(Node.is_accessible.is_(True)).scalar() or 0

    total_edges = db.query(func.count(Edge.id)).scalar() or 0
    active_edges = db.query(func.count(Edge.id)).filter(Edge.is_active.is_(True)).scalar() or 0
    accessible_edges = db.query(func.count(Edge.id)).filter(Edge.is_accessible.is_(True)).scalar() or 0

    # 4. Assistance request stats
    total_assistance = db.query(func.count(AssistanceRequest.id)).scalar() or 0
    pending_assistance = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "pending").scalar() or 0
    assigned_assistance = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "assigned").scalar() or 0
    resolved_assistance = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "resolved").scalar() or 0

    # 5. Location issue report stats
    total_reports = db.query(func.count(LocationReport.id)).scalar() or 0
    pending_reports = db.query(func.count(LocationReport.id)).filter(LocationReport.status == "pending").scalar() or 0
    reviewing_reports = db.query(func.count(LocationReport.id)).filter(LocationReport.status == "reviewing").scalar() or 0
    resolved_reports = db.query(func.count(LocationReport.id)).filter(LocationReport.status == "resolved").scalar() or 0

    # 6. Recent audit trail
    recent_logs, _ = audit_service.list_audit_logs(db, skip=0, limit=10)

    # 7. System & Environment
    system_status = {
        "project_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "is_production": settings.is_production,
        "database_connected": bool(settings.DATABASE_URL),
        "database_type": "postgresql" if settings.is_database_configured else "sqlite_local",
        "google_auth_configured": settings.is_google_configured,
        "api_v1_path": settings.API_V1_STR,
    }

    return DashboardStatsResponse(
        users=user_stats,
        locations={
            "total": total_locations,
            "verified": verified_locations,
            "unverified": total_locations - verified_locations,
            "active": active_locations,
            "by_category": category_counts,
        },
        routing={
            "total_nodes": total_nodes,
            "active_nodes": active_nodes,
            "accessible_nodes": accessible_nodes,
            "total_edges": total_edges,
            "active_edges": active_edges,
            "accessible_edges": accessible_edges,
        },
        assistance={
            "total": total_assistance,
            "pending": pending_assistance,
            "assigned": assigned_assistance,
            "resolved": resolved_assistance,
        },
        reports={
            "total": total_reports,
            "pending": pending_reports,
            "reviewing": reviewing_reports,
            "resolved": resolved_reports,
        },
        system=system_status,
        recent_activity=[AuditLogRead.model_validate(log) for log in recent_logs],
    )


# =====================================================================
# 2. User Management
# =====================================================================

@router.get("/users", response_model=UserListResponse)
async def list_admin_users(
    search: Optional[str] = Query(None, description="Search users by name, email, or UUID"),
    role: Optional[str] = Query(None, description="Filter by role (student, admin, moderator)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user_repo: Any = Depends(get_user_repository),
    _admin: str = Depends(require_admin_role),
):
    """List registered users with pagination, role filtering, and text search."""
    import inspect
    fn = user_repo.list_users(search=search, role=role, is_active=is_active, skip=skip, limit=limit)
    res = await fn if inspect.isawaitable(fn) else fn
    users, total = res

    user_responses = []
    for u in users:
        user_dict = {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "full_name": u.name,
            "phone": getattr(u, "phone", None),
            "role": u.role,
            "is_active": u.is_active,
        }
        user_responses.append(
            UserResponse(
                id=str(u.id),
                email=u.email,
                name=u.name,
                phone=getattr(u, "phone", None),
                picture=getattr(u, "picture", None),
                email_verified=getattr(u, "email_verified", False),
                created_at=u.created_at,
                last_login_at=getattr(u, "last_login_at", None),
                auth_provider="google" if getattr(u, "google_sub", None) else "email",
                has_password=bool(getattr(u, "password_hash", None)),
                role=u.role,
                user=user_dict,
            )
        )

    return UserListResponse(
        users=user_responses,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_admin_user_details(
    user_id: str,
    user_repo: Any = Depends(get_user_repository),
    _admin: str = Depends(require_admin_role),
):
    """Retrieve complete profile and role metadata for a specific user."""
    import inspect
    fn = user_repo.get_by_id(user_id)
    user = await fn if inspect.isawaitable(fn) else fn
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user_dict = {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "full_name": user.name,
        "phone": getattr(user, "phone", None),
        "role": user.role,
        "is_active": user.is_active,
    }
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        phone=getattr(user, "phone", None),
        picture=getattr(user, "picture", None),
        email_verified=getattr(user, "email_verified", False),
        created_at=user.created_at,
        last_login_at=getattr(user, "last_login_at", None),
        auth_provider="google" if getattr(user, "google_sub", None) else "email",
        has_password=bool(getattr(user, "password_hash", None)),
        role=user.role,
        user=user_dict,
    )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin_info: dict = Depends(get_current_admin_user),
    user_repo: Any = Depends(get_user_repository),
):
    """Update role for a user account with audit logging and protection against demoting the last administrator."""
    import inspect
    try:
        fn = user_repo.update_role(user_id, payload.role)
        updated_user = await fn if inspect.isawaitable(fn) else fn
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Audit log entry
    client_ip = request.client.host if request.client else None
    audit_service.record_audit_event(
        db=db,
        action="user.role_change",
        entity_type="user",
        entity_id=user_id,
        actor_id=admin_info["id"],
        actor_email=admin_info["email"],
        details={"new_role": payload.role, "user_email": updated_user.email},
        ip_address=client_ip,
    )

    user_dict = {
        "id": str(updated_user.id),
        "email": updated_user.email,
        "name": updated_user.name,
        "full_name": updated_user.name,
        "role": updated_user.role,
        "is_active": updated_user.is_active,
    }
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        name=updated_user.name,
        created_at=updated_user.created_at,
        role=updated_user.role,
        user=user_dict,
    )


@router.patch("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    payload: StatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin_info: dict = Depends(get_current_admin_user),
    user_repo: Any = Depends(get_user_repository),
):
    """Activate or deactivate a user account with audit logging and last administrator protection."""
    import inspect
    try:
        fn = user_repo.update_status(user_id, payload.is_active)
        updated_user = await fn if inspect.isawaitable(fn) else fn
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Audit log entry
    client_ip = request.client.host if request.client else None
    audit_service.record_audit_event(
        db=db,
        action="user.status_change",
        entity_type="user",
        entity_id=user_id,
        actor_id=admin_info["id"],
        actor_email=admin_info["email"],
        details={"is_active": payload.is_active, "user_email": updated_user.email},
        ip_address=client_ip,
    )

    user_dict = {
        "id": str(updated_user.id),
        "email": updated_user.email,
        "name": updated_user.name,
        "full_name": updated_user.name,
        "role": updated_user.role,
        "is_active": updated_user.is_active,
    }
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        name=updated_user.name,
        created_at=updated_user.created_at,
        role=updated_user.role,
        user=user_dict,
    )


# =====================================================================
# 3. Audit Logs
# =====================================================================

@router.get("/audit-logs", response_model=List[AuditLogRead])
def list_admin_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action string"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (user, location, node, edge, etc.)"),
    actor_email: Optional[str] = Query(None, description="Filter by acting admin email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin_role),
):
    """Retrieve paginated immutable audit records of administrative actions."""
    logs, _ = audit_service.list_audit_logs(
        db, action=action, entity_type=entity_type, actor_email=actor_email, skip=skip, limit=limit
    )
    return [AuditLogRead.model_validate(log) for log in logs]


# =====================================================================
# 4. Settings & Cache Management
# =====================================================================

@router.get("/settings")
def get_system_settings(
    _admin: str = Depends(require_admin_role),
):
    """Retrieve administrative system settings and runtime flags."""
    return {
        "project_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "is_production": settings.is_production,
        "database_configured": settings.is_database_configured,
        "google_auth_configured": settings.is_google_configured,
        "cors_origins": settings.CORS_ORIGINS,
        "session_cookie_name": settings.SESSION_COOKIE_NAME,
        "default_session_lifetime_days": settings.SESSION_DEFAULT_MAX_AGE_SECONDS // 86400,
        "remember_me_lifetime_days": settings.SESSION_REMEMBER_ME_MAX_AGE_SECONDS // 86400,
        "cache_enabled": True,
    }


@router.post("/cache/clear")
def clear_route_cache(
    db: Session = Depends(get_db),
    admin_info: dict = Depends(get_current_admin_user),
    request: Request = None,
):
    """Invalidate routing graph memory cache and precomputed path cache."""
    invalidate_graph_cache()
    client_ip = request.client.host if request and request.client else None
    audit_service.record_audit_event(
        db=db,
        action="system.cache_clear",
        entity_type="system",
        entity_id="route_cache",
        actor_id=admin_info["id"],
        actor_email=admin_info["email"],
        details={"status": "cleared"},
        ip_address=client_ip,
    )
    return {"success": True, "message": "Graph and routing caches invalidated successfully."}
