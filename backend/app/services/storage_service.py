"""
Storage service for uploading and managing statements and documents.
Delegates to CloudinaryService while preserving backward-compatibility for existing callers.
"""
from typing import Dict, Any, Optional
from app.services.cloudinary_service import CloudinaryService

class StorageService:
    @staticmethod
    def _is_cloudinary_configured() -> bool:
        return CloudinaryService.is_configured()

    @classmethod
    def upload_statement_pdf(
        cls,
        file_bytes: bytes,
        original_filename: str,
        driver_id: str = "driver",
        base_server_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Permanently stores the statement file in Cloudinary (or local fallback)
        and returns the dictionary expected by legacy callers.
        """
        res = CloudinaryService.upload_file(
            file_bytes=file_bytes,
            original_filename=original_filename,
            user_id=driver_id,
            category="statements",
            resource_type="raw"
        )
        return {
            "url": res["secure_url"],
            "provider": res["provider"],
            "filename": res["filename"],
            "file_size": res["file_size"],
            "local_path": res.get("local_path"),
            "cloudinary_id": res["public_id"]
        }
