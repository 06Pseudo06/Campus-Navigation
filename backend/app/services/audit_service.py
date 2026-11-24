"""Administrative audit logging service."""

import json
import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.audit_log import AuditLog

logger = logging.getLogger("campusway.audit")

# In-memory circular buffer fallback for local/test environments
_IN_MEMORY_AUDIT_LOGS: List[Dict[str, Any]] = []
_MAX_IN_MEMORY_LOGS = 500

SENSITIVE_KEYS = {
    "password", "password_hash", "access_token", "token", "raw_token",
    "token_hash", "secret", "client_secret", "id_token", "state"
}


def _sanitize_details(details: Any) -> Optional[str]:
    """Strip passwords and tokens from audit details dictionary."""
    if details is None:
        return None
    if isinstance(details, str):
        return details
    if isinstance(details, dict):
        clean = {}
        for k, v in details.items():
            if k.lower() in SENSITIVE_KEYS:
                clean[k] = "[REDACTED]"
            elif isinstance(v, dict):
                clean[k] = json.loads(_sanitize_details(v) or "{}")
            else:
                clean[k] = v
        return json.dumps(clean)
    return str(details)


def record_audit_event(
    db: Optional[Session],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    details: Optional[Union[Dict[str, Any], str]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Record an administrative audit log entry to database with in-memory fallback."""
    clean_details = _sanitize_details(details)
    log_id = uuid.uuid4()

    db_entry = AuditLog(
        id=log_id,
        actor_id=str(actor_id) if actor_id else None,
        actor_email=actor_email,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        details=clean_details,
        ip_address=ip_address,
    )

    if db is not None:
        try:
            db.add(db_entry)
            db.commit()
            db.refresh(db_entry)
            return db_entry
        except Exception as exc:
            db.rollback()
            logger.warning("Failed to persist audit log to DB (%s). Storing in-memory.", exc)

    # In-memory fallback
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    entry_dict = {
        "id": log_id,
        "actor_id": str(actor_id) if actor_id else None,
        "actor_email": actor_email,
        "action": action,
        "entity_type": entity_type,
        "entity_id": str(entity_id) if entity_id else None,
        "details": clean_details,
        "ip_address": ip_address,
        "created_at": now,
    }
    _IN_MEMORY_AUDIT_LOGS.insert(0, entry_dict)
    if len(_IN_MEMORY_AUDIT_LOGS) > _MAX_IN_MEMORY_LOGS:
        _IN_MEMORY_AUDIT_LOGS.pop()

    return db_entry


def list_audit_logs(
    db: Optional[Session],
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    actor_email: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Any], int]:
    """Retrieve audit logs with filtering and pagination."""
    if db is not None:
        try:
            q = db.query(AuditLog)
            if action:
                q = q.filter(AuditLog.action == action)
            if entity_type:
                q = q.filter(AuditLog.entity_type == entity_type)
            if actor_email:
                q = q.filter(AuditLog.actor_email.ilike(f"%{actor_email.strip()}%"))

            total = q.count()
            results = q.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
            return results, total
        except Exception as exc:
            logger.warning("Failed to query DB audit logs (%s). Reading in-memory.", exc)

    # In-memory query
    filtered = _IN_MEMORY_AUDIT_LOGS
    if action:
        filtered = [x for x in filtered if x["action"] == action]
    if entity_type:
        filtered = [x for x in filtered if x["entity_type"] == entity_type]
    if actor_email:
        target = actor_email.strip().lower()
        filtered = [x for x in filtered if x.get("actor_email") and target in x["actor_email"].lower()]

    total = len(filtered)
    results = [AuditLog(**x) for x in filtered[skip : skip + limit]]
    return results, total
