"""
Audit log viewer endpoint using MongoDB.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from pymongo import DESCENDING

from app.models.mongo_models import User
from app.schemas.dto import AuditLogOut
from app.services.auth_service import require_roles
from app.db.mongodb import audit_logs_col

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(50, le=200),
    current_user: User = Depends(require_roles(["admin", "lender"]))
):
    mongo_filter = {}
    if action:
        mongo_filter["action"] = action.upper()
    docs = list(audit_logs_col.find(mongo_filter).sort("timestamp", DESCENDING).limit(limit))
    
    result = []
    for d in docs:
        raw_ts = d.get("timestamp")
        if isinstance(raw_ts, datetime):
            ts = raw_ts.replace(tzinfo=timezone.utc) if raw_ts.tzinfo is None else raw_ts
        elif isinstance(raw_ts, str):
            try:
                dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
                ts = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
            except Exception:
                ts = datetime.now(timezone.utc)
        else:
            ts = datetime.now(timezone.utc)

        result.append(
            AuditLogOut(
                id=d["id"],
                actor_id=d.get("actor_id"),
                actor_email=d.get("actor_email"),
                action=d.get("action", ""),
                entity_type=d.get("entity_type", ""),
                entity_id=d.get("entity_id", ""),
                timestamp=ts,
                metadata_json=d.get("metadata_json"),
                hash_signature=d.get("hash_signature")
            )
        )
    return result
