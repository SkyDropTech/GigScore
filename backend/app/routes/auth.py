"""
Authentication and User endpoints using MongoDB with Biometric Face Recognition.
"""
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.models.mongo_models import User
from app.schemas.dto import (
    RegisterRequest,
    LoginRequest,
    FaceLoginRequest,
    FaceEnrollRequest,
    FaceDetectRequest,
    FaceDetectResponse,
    QuickEnrollRequest,
    TokenResponse,
    UserOut
)
from app.db.mongodb import users_col
from app.services.auth_service import AuthService, get_current_user
from app.services.face_recognition_service import FaceRecognitionService
from app.services.audit_service import AuditService
from fastapi.responses import RedirectResponse
from app.core.security import create_access_token

router = APIRouter(prefix="", tags=["Auth"])

@router.post("/auth/detect-face", response_model=FaceDetectResponse)
def detect_face(req: FaceDetectRequest):
    """
    Real-time pre-flight diagnostic endpoint for live webcam optical alignment.
    Returns detected status, bounding box, elements (eyes, nose, mouth), and guidance.
    """
    res = FaceRecognitionService.detect_elements(req.face_image)
    return FaceDetectResponse(
        detected=res.get("detected", False),
        confidence=res.get("confidence", 0.0),
        box=res.get("box"),
        landmarks=res.get("landmarks"),
        elements=res.get("elements"),
        quality=res.get("quality", 0),
        message=res.get("message", "")
    )

@router.post("/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    user = AuthService.register(req=req)
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    bio = getattr(user, "face_biometrics", {}) or {}
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=bio.get("photo_url"),
        face_enrolled=bool(bio.get("enrolled", False))
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
    bio = getattr(user, "face_biometrics", {}) or {}
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=bio.get("photo_url"),
        face_enrolled=bool(bio.get("enrolled", False))
    )

@router.post("/auth/face-login", response_model=TokenResponse)
def face_login(req: FaceLoginRequest):
    """
    Authenticates user biometrically by matching face capture snapshot against enrolled profiles.
    """
    user, confidence = AuthService.authenticate_by_face(
        face_image=req.face_image,
        role_hint=req.role_hint,
        email_hint=req.email_hint
    )
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    bio = getattr(user, "face_biometrics", {}) or {}
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=bio.get("photo_url"),
        face_enrolled=True
    )

@router.post("/auth/enroll-face", response_model=UserOut)
def enroll_face(req: FaceEnrollRequest, current_user: User = Depends(get_current_user)):
    """
    Enrolls or updates biometric face profile for authenticated user.
    """
    updated_user = AuthService.enroll_face(user_id=current_user.id, face_image=req.face_image)
    bio = getattr(updated_user, "face_biometrics", {}) or {}
    return UserOut(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        role=updated_user.role,
        phone=getattr(updated_user, "phone", None),
        status=getattr(updated_user, "status", "ACTIVE"),
        avatar_url=bio.get("photo_url"),
        face_enrolled=bool(bio.get("enrolled", False)),
        created_at=updated_user.created_at
    )

@router.get("/auth/face-photo/{user_id}")
def get_face_photo(user_id: str):
    """
    Returns stored face avatar image by redirecting to Cloudinary CDN URL.
    No images are served or stored locally on this project.
    """
    safe_name = os.path.basename(user_id)
    user_doc = users_col.find_one({"id": safe_name}) or users_col.find_one({"id": user_id})
    if user_doc:
        bio = user_doc.get("face_biometrics", {}) or {}
        photo_url = bio.get("photo_url") or user_doc.get("avatar_url")
        if photo_url and photo_url.startswith("http"):
            return RedirectResponse(url=photo_url)

    raise HTTPException(status_code=404, detail="Face portrait not found in Cloudinary")

@router.get("/users/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    bio = getattr(current_user, "face_biometrics", {}) or {}
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=getattr(current_user, "phone", None),
        status=getattr(current_user, "status", "ACTIVE"),
        avatar_url=bio.get("photo_url"),
        face_enrolled=bool(bio.get("enrolled", False)),
        created_at=current_user.created_at
    )
