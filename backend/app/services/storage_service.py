"""
Storage service for uploading and managing permanent PDF statements.
Integrates with Cloudinary for permanent cloud asset hosting with local fallback.
"""
import os
import uuid
import time
from pathlib import Path
from typing import Dict, Any, Optional
import cloudinary
import cloudinary.uploader

from app.core.config import settings

# Base upload directory for permanent local retention
UPLOAD_BASE_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "statements"
UPLOAD_BASE_DIR.mkdir(parents=True, exist_ok=True)

class StorageService:
    @staticmethod
    def _is_cloudinary_configured() -> bool:
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME") or getattr(settings, "CLOUDINARY_CLOUD_NAME", "")
        api_key = os.getenv("CLOUDINARY_API_KEY") or getattr(settings, "CLOUDINARY_API_KEY", "")
        api_secret = os.getenv("CLOUDINARY_API_SECRET") or getattr(settings, "CLOUDINARY_API_SECRET", "")
        return bool(cloud_name and api_key and api_secret)

    @classmethod
    def upload_statement_pdf(
        cls,
        file_bytes: bytes,
        original_filename: str,
        driver_id: str = "driver",
        base_server_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Permanently stores the statement PDF in Cloudinary (or permanent local storage)
        and returns the persistent URL to store in MongoDB.
        """
        server_url = (base_server_url or settings.BASE_SERVER_URL).rstrip("/")
        clean_name = os.path.basename(original_filename) if original_filename else "statement.pdf"
        timestamp = int(time.time())
        unique_suffix = uuid.uuid4().hex[:8]
        safe_filename = f"{driver_id}_{timestamp}_{unique_suffix}_{clean_name}"
        
        # 1. Always retain permanent local backup on server
        local_filepath = UPLOAD_BASE_DIR / safe_filename
        with open(local_filepath, "wb") as f:
            f.write(file_bytes)
            
        file_size_bytes = len(file_bytes)
        if file_size_bytes >= 1024 * 1024:
            formatted_size = f"{file_size_bytes / (1024 * 1024):.1f} MB"
        else:
            formatted_size = f"{max(1, file_size_bytes // 1024)} KB"

        local_permanent_url = f"{server_url}/uploads/statements/{safe_filename}"

        # 2. Upload to Cloudinary if configured
        if cls._is_cloudinary_configured():
            try:
                cloudinary.config(
                    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME") or settings.CLOUDINARY_CLOUD_NAME,
                    api_key=os.getenv("CLOUDINARY_API_KEY") or settings.CLOUDINARY_API_KEY,
                    api_secret=os.getenv("CLOUDINARY_API_SECRET") or settings.CLOUDINARY_API_SECRET,
                    secure=True
                )
                
                upload_res = cloudinary.uploader.upload(
                    file_bytes,
                    folder="gigscore/statements",
                    public_id=f"stmt_{driver_id}_{timestamp}_{unique_suffix}",
                    resource_type="raw",
                    use_filename=True,
                    unique_filename=True
                )
                
                cloudinary_url = upload_res.get("secure_url") or upload_res.get("url")
                return {
                    "url": cloudinary_url,
                    "provider": "cloudinary",
                    "filename": clean_name,
                    "file_size": formatted_size,
                    "local_path": str(local_filepath),
                    "cloudinary_id": upload_res.get("public_id")
                }
            except Exception as e:
                print(f"[Cloudinary Warning] Upload failed ({e}), falling back to permanent server storage.")
                
        # 3. Default permanent URL (Local static route + formatted Cloudinary-compatible reference)
        return {
            "url": local_permanent_url,
            "provider": "permanent_storage",
            "filename": clean_name,
            "file_size": formatted_size,
            "local_path": str(local_filepath),
            "cloudinary_id": None
        }
