"""
Document and File Management Router for GigScore.
Provides endpoints to upload, list, retrieve, and delete files stored in Cloudinary
with metadata maintained in MongoDB Atlas.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query

from app.models.mongo_models import User
from app.schemas.dto import StoredFileOut, FileUploadResponse, StoredFileListOut
from app.services.auth_service import get_current_user
from app.services.cloudinary_service import CloudinaryService, ALLOWED_CATEGORIES
from app.services.audit_service import AuditService
from app.db.mongodb import user_files_col

router = APIRouter(prefix="/files", tags=["Files"])


def _doc_to_file_out(doc: dict) -> StoredFileOut:
    """Converts a MongoDB document from user_files_col to StoredFileOut."""
    raw_created = doc.get("created_at")
    if isinstance(raw_created, datetime):
        created_at = raw_created.replace(tzinfo=timezone.utc) if raw_created.tzinfo is None else raw_created
    else:
        created_at = datetime.now(timezone.utc)

    return StoredFileOut(
        id=doc.get("file_id") or doc.get("id"),
        file_id=doc.get("file_id") or doc.get("id"),
        user_id=doc.get("user_id", ""),
        original_filename=doc.get("original_filename", ""),
        cloudinary_public_id=doc.get("cloudinary_public_id", ""),
        cloudinary_url=doc.get("cloudinary_url", ""),
        resource_type=doc.get("resource_type", "raw"),
        file_format=doc.get("file_format", "pdf"),
        file_size=int(doc.get("file_size", 0)),
        file_size_formatted=doc.get("file_size_formatted", "0 KB"),
        file_category=doc.get("file_category", "documents"),
        processing_status=doc.get("processing_status", "PROCESSED"),
        created_at=created_at
    )


@router.post("/upload", response_model=FileUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("documents"),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a document or image to Cloudinary and saves metadata to MongoDB.
    Enforces size limits (<= 25MB) and allowed file formats.
    """
    clean_cat = category.strip().lower()
    if clean_cat not in ALLOWED_CATEGORIES:
        clean_cat = "documents"

    content = await file.read()
    clean_filename, ext = CloudinaryService.validate_file(file, content=content)

    # Upload to Cloudinary
    upload_res = CloudinaryService.upload_file(
        file_bytes=content,
        original_filename=clean_filename,
        user_id=current_user.id,
        category=clean_cat,
        resource_type="auto"
    )

    file_id = f"file_{uuid.uuid4().hex[:12]}"
    now_utc = datetime.now(timezone.utc)
    file_doc = {
        "id": file_id,
        "file_id": file_id,
        "user_id": current_user.id,
        "original_filename": upload_res["filename"],
        "cloudinary_public_id": upload_res["public_id"],
        "cloudinary_url": upload_res["secure_url"],
        "resource_type": upload_res["resource_type"],
        "file_format": upload_res["format"],
        "file_size": upload_res["bytes"],
        "file_size_formatted": upload_res["file_size"],
        "file_category": clean_cat,
        "processing_status": "PROCESSED",
        "created_at": now_utc
    }

    try:
        user_files_col.insert_one(file_doc)
    except Exception as db_err:
        # Rollback orphaned asset in Cloudinary
        CloudinaryService.delete_file(upload_res["public_id"], resource_type=upload_res["resource_type"])
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error saving file record: {db_err}"
        )

    # Immutable audit logging
    try:
        AuditService.log_action(
            action="FILE_UPLOADED",
            entity_type="FILE",
            entity_id=file_id,
            actor_id=current_user.id,
            actor_email=current_user.email,
            metadata={
                "filename": upload_res["filename"],
                "category": clean_cat,
                "file_size": upload_res["file_size"],
                "public_id": upload_res["public_id"],
                "provider": upload_res["provider"]
            }
        )
    except Exception as audit_err:
        print(f"[Audit Warning] Could not log file upload: {audit_err}")

    return FileUploadResponse(
        status="success",
        message=f"File successfully uploaded and stored via {upload_res['provider']}",
        file=_doc_to_file_out(file_doc)
    )


@router.get("", response_model=StoredFileListOut)
def list_user_files(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Lists files owned by the authenticated user, with optional category filtering.
    """
    query: dict = {"user_id": current_user.id}
    if category:
        query["file_category"] = category.strip().lower()

    docs = list(user_files_col.find(query).sort("created_at", -1))
    file_list = [_doc_to_file_out(d) for d in docs]
    return StoredFileListOut(total=len(file_list), files=file_list)


@router.get("/{file_id}", response_model=StoredFileOut)
def get_file_metadata(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves metadata and Cloudinary secure URL for a specific file.
    Enforces user ownership (admins can view any file).
    """
    doc = user_files_col.find_one({"file_id": file_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with id '{file_id}' not found."
        )

    if doc.get("user_id") != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this file."
        )

    return _doc_to_file_out(doc)


@router.delete("/{file_id}")
def delete_user_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Deletes the file asset from Cloudinary, purges its MongoDB metadata record,
    and logs an immutable audit event.
    """
    doc = user_files_col.find_one({"file_id": file_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with id '{file_id}' not found."
        )

    if doc.get("user_id") != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this file."
        )

    # 1. Delete asset from Cloudinary
    public_id = doc.get("cloudinary_public_id")
    res_type = doc.get("resource_type", "raw")
    if public_id:
        CloudinaryService.delete_file(public_id, resource_type=res_type)

    # 2. Delete document from MongoDB
    user_files_col.delete_one({"file_id": file_id})

    # 3. Log immutable audit event
    try:
        AuditService.log_action(
            action="FILE_DELETED",
            entity_type="FILE",
            entity_id=file_id,
            actor_id=current_user.id,
            actor_email=current_user.email,
            metadata={
                "filename": doc.get("original_filename"),
                "category": doc.get("file_category"),
                "public_id": public_id
            }
        )
    except Exception as audit_err:
        print(f"[Audit Warning] Could not log file deletion: {audit_err}")

    return {
        "status": "success",
        "message": "File successfully deleted from cloud storage and database.",
        "file_id": file_id
    }
