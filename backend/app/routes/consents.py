"""
Consent management endpoints using MongoDB.
Allows drivers to view, grant, and revoke data access consent.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List
import uuid
from pymongo import DESCENDING

from app.models.mongo_models import User
from app.schemas.dto import ConsentCreate, ConsentOut
from app.services.auth_service import get_current_user
from app.services.audit_service import AuditService
from app.db.mongodb import consents_col

router = APIRouter(prefix="/consents", tags=["Consent"])

@router.get("", response_model=List[ConsentOut])
def list_user_consents(
    current_user: User = Depends(get_current_user)
):
    docs = list(consents_col.find({"user_id": current_user.id}))
    docs.sort(key=lambda x: x.get("granted_at") or x.get("created_at") or datetime.min, reverse=True)
    return [
        ConsentOut(
            id=c["id"],
            user_id=c["user_id"],
            purpose=c.get("purpose", ""),
            scope=c.get("scope", ""),
            granted_at=c.get("granted_at") or c.get("created_at") or datetime.utcnow(),
            revoked_at=c.get("revoked_at"),
            version=c.get("version", "v1.0"),
            is_active=(c.get("revoked_at") is None)
        )
        for c in docs
    ]

@router.post("", response_model=ConsentOut)
def grant_consent(
    req: ConsentCreate,
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    # Revoke any prior active consent first
    consents_col.update_many(
        {"user_id": current_user.id, "revoked_at": None},
        {"$set": {"revoked_at": now, "is_active": False}}
    )

    consent_id = f"cns_{uuid.uuid4().hex[:12]}"
    new_doc = {
        "id": consent_id,
        "user_id": current_user.id,
        "purpose": req.purpose,
        "scope": req.scope,
        "granted_at": now,
        "revoked_at": None,
        "is_active": True,
        "version": "v1.0"
    }
    consents_col.insert_one(new_doc)
    
    AuditService.log_action(
        action="CONSENT_GRANTED",
        entity_type="CONSENT",
        entity_id=consent_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        metadata={"scope": req.scope, "purpose": req.purpose}
    )
    
    return ConsentOut(
        id=new_doc["id"],
        user_id=new_doc["user_id"],
        purpose=new_doc["purpose"],
        scope=new_doc["scope"],
        granted_at=new_doc["granted_at"],
        revoked_at=new_doc["revoked_at"],
        version=new_doc["version"],
        is_active=True
    )

@router.post("/{consent_id}/revoke", response_model=ConsentOut)
def revoke_consent(
    consent_id: str,
    current_user: User = Depends(get_current_user)
):
    doc = consents_col.find_one({"id": consent_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Consent record not found")
        
    if doc.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    now = datetime.utcnow()
    consents_col.update_one(
        {"id": consent_id},
        {"$set": {"revoked_at": now, "is_active": False}}
    )
    
    AuditService.log_action(
        action="CONSENT_REVOKED",
        entity_type="CONSENT",
        entity_id=consent_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        metadata={"revoked_at": now.isoformat()}
    )
    
    return ConsentOut(
        id=doc["id"],
        user_id=doc["user_id"],
        purpose=doc.get("purpose", ""),
        scope=doc.get("scope", ""),
        granted_at=doc.get("granted_at") or doc.get("created_at") or datetime.utcnow(),
        revoked_at=now,
        version=doc.get("version", "v1.0"),
        is_active=False
    )
