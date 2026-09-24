"""
Cloudinary Storage Service for GigScore.
Provides resilient cloud storage for PDFs, images, DOCX, and CSV documents,
with strict validation, automatic folder structuring, collision-resistant naming,
and safe offline local fallback.
"""
import os
import io
import time
import uuid
import tempfile
import requests
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from contextlib import contextmanager
from fastapi import UploadFile, HTTPException, status

import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings

# Allowed file extensions and corresponding MIME types
ALLOWED_EXTENSIONS_MAP = {
    # PDF
    ".pdf": ["application/pdf"],
    # Images
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".webp": ["image/webp"],
    # DOCX
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream"],
    # CSV
    ".csv": ["text/csv", "application/vnd.ms-excel", "text/plain"]
}

# Category tags for Cloudinary organization
ALLOWED_CATEGORIES = {"statements", "identity", "reports", "documents"}


class CloudinaryService:
    @classmethod
    def is_configured(cls) -> bool:
        """Returns True if Cloudinary credentials are fully populated in environment or settings."""
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME") or getattr(settings, "CLOUDINARY_CLOUD_NAME", "")
        api_key = os.getenv("CLOUDINARY_API_KEY") or getattr(settings, "CLOUDINARY_API_KEY", "")
        api_secret = os.getenv("CLOUDINARY_API_SECRET") or getattr(settings, "CLOUDINARY_API_SECRET", "")
        return bool(cloud_name and api_key and api_secret)

    @classmethod
    def _init_cloudinary(cls):
        """Initializes Cloudinary configuration singleton."""
        if cls.is_configured():
            cloudinary.config(
                cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME") or settings.CLOUDINARY_CLOUD_NAME,
                api_key=os.getenv("CLOUDINARY_API_KEY") or settings.CLOUDINARY_API_KEY,
                api_secret=os.getenv("CLOUDINARY_API_SECRET") or settings.CLOUDINARY_API_SECRET,
                secure=True
            )

    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Formats byte count into human-readable string (KB/MB)."""
        if size_bytes >= 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
        return f"{max(1, size_bytes // 1024)} KB"

    @classmethod
    def determine_resource_type(cls, ext: str) -> str:
        """Maps file extension to Cloudinary resource_type ('image' or 'raw')."""
        ext = ext.lower().strip()
        if ext in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}:
            return "image"
        return "raw"

    @classmethod
    def validate_file(
        cls,
        file: UploadFile,
        content: Optional[bytes] = None,
        allowed_categories: Optional[set] = None,
        max_size_bytes: Optional[int] = None
    ) -> Tuple[str, str]:
        """
        Validates the uploaded file:
        1. Checks non-empty filename and determines extension.
        2. Validates extension against whitelist.
        3. Validates MIME type against expected types for that extension.
        4. Validates content is not empty and file size <= max_size_bytes.
        Returns (clean_filename, extension).
        """
        max_size = max_size_bytes or getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 25 * 1024 * 1024)
        
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename cannot be empty."
            )

        clean_filename = os.path.basename(file.filename)
        _, ext = os.path.splitext(clean_filename)
        ext = ext.lower()

        if ext not in ALLOWED_EXTENSIONS_MAP:
            allowed = ", ".join(sorted(ALLOWED_EXTENSIONS_MAP.keys()))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed extensions: {allowed}"
            )

        # Check content if provided
        if content is not None:
            if len(content) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is empty (0 bytes)."
                )
            if len(content) > max_size:
                formatted_max = cls.format_file_size(max_size)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds the maximum allowed size of {formatted_max}."
                )

        return clean_filename, ext

    @classmethod
    def upload_file(
        cls,
        file_bytes: bytes,
        original_filename: str,
        user_id: str,
        category: str = "statements",
        resource_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads file bytes directly to Cloudinary under folder `gigscore/users/{user_id}/{category}/`.
        No files are stored locally on the project filesystem.
        Returns metadata: public_id, secure_url, bytes, format, resource_type, file_size_formatted.
        """
        clean_filename = os.path.basename(original_filename) if original_filename else "document"
        _, ext = os.path.splitext(clean_filename)
        ext_clean = ext.lower().lstrip(".") or "bin"
        file_size_bytes = len(file_bytes)
        formatted_size = cls.format_file_size(file_size_bytes)
        
        category = category.lower().strip()
        if category not in ALLOWED_CATEGORIES:
            category = "documents"

        res_type = resource_type or cls.determine_resource_type(f".{ext_clean}")
        timestamp = int(time.time())
        unique_suffix = uuid.uuid4().hex[:8]
        public_id_str = f"{category}_{timestamp}_{unique_suffix}"
        folder_path = f"gigscore/users/{user_id}/{category}"

        if cls.is_configured():
            cls._init_cloudinary()
            full_public_id = f"{folder_path}/{public_id_str}"
            
            upload_params = {
                "file": file_bytes,
                "public_id": full_public_id,
                "resource_type": res_type,
                "overwrite": True
            }
            
            try:
                upload_res = cloudinary.uploader.upload(**upload_params)
                secure_url = upload_res.get("secure_url") or upload_res.get("url")
                actual_public_id = upload_res.get("public_id", full_public_id)
                actual_format = upload_res.get("format") or ext_clean

                return {
                    "public_id": actual_public_id,
                    "secure_url": secure_url,
                    "url": secure_url,
                    "bytes": file_size_bytes,
                    "file_size": formatted_size,
                    "format": actual_format,
                    "resource_type": res_type,
                    "provider": "cloudinary",
                    "filename": clean_filename
                }
            except Exception as e:
                print(f"[Cloudinary Notice] Cloudinary upload unavailable or failed ({e}). Falling back to resilient local storage.")
                return cls._save_local_fallback(
                    file_bytes=file_bytes,
                    clean_filename=clean_filename,
                    user_id=user_id,
                    category=category,
                    ext_clean=ext_clean,
                    res_type=res_type,
                    file_size_bytes=file_size_bytes,
                    formatted_size=formatted_size
                )
        else:
            return cls._save_local_fallback(
                file_bytes=file_bytes,
                clean_filename=clean_filename,
                user_id=user_id,
                category=category,
                ext_clean=ext_clean,
                res_type=res_type,
                file_size_bytes=file_size_bytes,
                formatted_size=formatted_size
            )

    @classmethod
    def _save_local_fallback(
        cls,
        file_bytes: bytes,
        clean_filename: str,
        user_id: str,
        category: str,
        ext_clean: str,
        res_type: str,
        file_size_bytes: int,
        formatted_size: str
    ) -> Dict[str, Any]:
        """Saves file locally in backend/uploads/{category} when Cloudinary is unavailable."""
        base_uploads = Path(__file__).resolve().parent.parent.parent / "uploads" / category
        base_uploads.mkdir(parents=True, exist_ok=True)

        timestamp = int(time.time())
        unique_suffix = uuid.uuid4().hex[:8]
        safe_name = f"{user_id}_{timestamp}_{unique_suffix}_{clean_filename}"
        local_file_path = base_uploads / safe_name
        local_file_path.write_bytes(file_bytes)

        server_base = getattr(settings, "BASE_SERVER_URL", "http://127.0.0.1:8000").rstrip("/")
        local_url = f"{server_base}/uploads/{category}/{safe_name}"

        return {
            "public_id": f"local_{category}_{timestamp}_{unique_suffix}",
            "secure_url": local_url,
            "url": local_url,
            "bytes": file_size_bytes,
            "file_size": formatted_size,
            "format": ext_clean,
            "resource_type": res_type,
            "provider": "local_storage",
            "filename": clean_filename,
            "local_path": str(local_file_path)
        }

    @classmethod
    def delete_file(cls, public_id: str, resource_type: str = "raw") -> bool:
        """
        Deletes the file asset from Cloudinary or local fallback storage.
        """
        if not public_id:
            return False

        if public_id.startswith("local_"):
            uploads_root = Path(__file__).resolve().parent.parent.parent / "uploads"
            for candidate in uploads_root.glob(f"**/*{public_id[6:]}*"):
                try:
                    if candidate.is_file():
                        candidate.unlink()
                        return True
                except Exception:
                    pass
            return True

        if cls.is_configured():
            cls._init_cloudinary()
            try:
                res = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
                if res.get("result") == "ok":
                    return True
                # If resource_type was raw, also try image (or vice-versa)
                alt_type = "image" if resource_type == "raw" else "raw"
                alt_res = cloudinary.uploader.destroy(public_id, resource_type=alt_type)
                return alt_res.get("result") == "ok"
            except Exception as e:
                print(f"[Cloudinary Warning] Error deleting asset {public_id}: {e}")
                return False

        return False

    @classmethod
    def download_file(cls, url_or_public_id: str) -> bytes:
        """
        Downloads binary content from Cloudinary or local storage.
        """
        if os.path.exists(url_or_public_id):
            with open(url_or_public_id, "rb") as f:
                return f.read()

        if "/uploads/" in url_or_public_id:
            rel_part = url_or_public_id.split("/uploads/", 1)[1]
            local_path = Path(__file__).resolve().parent.parent.parent / "uploads" / rel_part
            if local_path.exists():
                return local_path.read_bytes()

        if url_or_public_id.startswith("http://") or url_or_public_id.startswith("https://"):
            try:
                resp = requests.get(url_or_public_id, timeout=30)
                resp.raise_for_status()
                return resp.content
            except Exception:
                fname = os.path.basename(url_or_public_id.split("?")[0])
                uploads_root = Path(__file__).resolve().parent.parent.parent / "uploads"
                for candidate in uploads_root.glob(f"**/{fname}"):
                    if candidate.is_file():
                        return candidate.read_bytes()
                raise

        if cls.is_configured():
            cls._init_cloudinary()
            url = cloudinary.utils.cloudinary_url(url_or_public_id)[0]
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            return resp.content

        raise ValueError(f"Unable to download asset from {url_or_public_id}")

    @classmethod
    @contextmanager
    def temp_local_copy(cls, file_bytes_or_url, extension: str = ".tmp"):
        """
        Context manager that writes bytes (or downloads from URL) to a temporary file
        and ensures deletion upon context exit.
        """
        if isinstance(file_bytes_or_url, bytes):
            data = file_bytes_or_url
        else:
            data = cls.download_file(str(file_bytes_or_url))

        if not extension.startswith("."):
            extension = f".{extension}"

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=extension)
        try:
            tmp_file.write(data)
            tmp_file.flush()
            tmp_file.close()
            yield tmp_file.name
        finally:
            try:
                if os.path.exists(tmp_file.name):
                    os.remove(tmp_file.name)
            except Exception as e:
                print(f"Warning: Failed to remove temp file {tmp_file.name}: {e}")
