"""
Audit logging service for tracking immutable events in MongoDB with SHA-256 integrity hashes.
"""
import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from app.db.mongodb import audit_logs_col
from app.models.mongo_models import AuditLog

class AuditService:
    @staticmethod
    def log_action(
        db: Any = None,
        action: str = "GENERIC_EVENT",
        entity_type: str = "SYSTEM",
        entity_id: str = "",
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> AuditLog:
        audit_id = f"audit_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        meta_dict = metadata or {}
        
        # Calculate SHA-256 integrity signature
        payload_str = f"{audit_id}:{action}:{entity_type}:{entity_id}:{now.isoformat()}"
        hash_signature = hashlib.sha256(payload_str.encode()).hexdigest()
        
        doc = {
            "id": audit_id,
            "actor_id": actor_id,
            "actor_email": actor_email,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "timestamp": now,
            "metadata": meta_dict,
            "metadata_json": json.dumps(meta_dict, default=str),
            "hash_signature": hash_signature
        }
        audit_logs_col.insert_one(doc)
        return AuditLog(**doc)
