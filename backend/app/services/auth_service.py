"""
Authentication and Authorization service using MongoDB with RBAC security guards.
"""
import uuid
from datetime import datetime
from typing import Optional, List, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.db.mongodb import users_col, driver_profiles_col, consents_col
from app.models.mongo_models import User, DriverProfile, Consent
from app.schemas.dto import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.services.audit_service import AuditService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

class AuthService:
    @staticmethod
    def register(db: Any = None, req: RegisterRequest = None) -> User:
        existing = users_col.find_one({"email": req.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
            
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        user_doc = {
            "id": user_id,
            "email": req.email.lower(),
            "phone": req.phone or "+91 98000 00000",
            "full_name": req.full_name,
            "password_hash": hash_password(req.password),
            "role": req.role.lower(),
            "status": "ACTIVE",
            "created_at": now
        }
        users_col.insert_one(user_doc)
        
        # If user is a driver, create driver profile and initial consent in MongoDB
        if user_doc["role"] == "driver":
            driver_doc = {
                "id": f"drv_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "city": req.city or "Bengaluru",
                "platform": req.platform or "Ola & Uber",
                "vehicle_type": req.vehicle_type or "Sedan (Dzire)",
                "platform_start_date": "2024-01-01",
                "tenure_months": 18,
                "kyc_status": "VERIFIED",
                "archetype": "custom",
                "created_at": now
            }
            driver_profiles_col.insert_one(driver_doc)
            
            # Initial active consent
            consent_doc = {
                "id": f"cns_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "purpose": "Gig work and earnings data access for alternative credit assessment",
                "scope": "rides,earnings,ratings,tenure",
                "version": "v1.0",
                "is_active": True,
                "granted_at": now,
                "revoked_at": None
            }
            consents_col.insert_one(consent_doc)
            
        AuditService.log_action(
            action="USER_REGISTERED",
            entity_type="USER",
            entity_id=user_id,
            actor_id=user_id,
            actor_email=user_doc["email"],
            metadata={"role": user_doc["role"], "full_name": user_doc["full_name"]}
        )
        return User(**user_doc)

    @staticmethod
    def authenticate(db: Any = None, email: str = "", password: str = "") -> Optional[User]:
        user_doc = users_col.find_one({"email": email.lower()})
        if not user_doc or not verify_password(password, user_doc.get("password_hash", "")):
            return None
        return User(**user_doc)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier"
        )
        
    user_doc = users_col.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
        
    return User(**user_doc)

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Action forbidden for role '{current_user.role}'. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker
