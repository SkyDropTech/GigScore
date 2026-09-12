"""
Authentication and User endpoints using MongoDB.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.mongo_models import User
from app.schemas.dto import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.services.auth_service import AuthService, get_current_user
from app.services.audit_service import AuditService
from app.core.security import create_access_token

router = APIRouter(prefix="", tags=["Auth"])

@router.post("/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    user = AuthService.register(req=req)
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )

@router.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = AuthService.authenticate(None, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    # Record immutable USER_LOGIN audit log
    AuditService.log_action(
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=user.id,
        actor_id=user.id,
        actor_email=user.email,
        metadata={"role": user.role, "email": user.email, "auth_type": "password"}
    )
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )

@router.get("/users/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=getattr(current_user, "phone", None),
        status=getattr(current_user, "status", "ACTIVE"),
        created_at=current_user.created_at
    )
