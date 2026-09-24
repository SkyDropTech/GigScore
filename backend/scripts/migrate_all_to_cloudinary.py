"""
GigScore Full Cloudinary Migration and Project Cleanup Script.
Uploads all statement PDFs and face portraits to Cloudinary CDN,
updates MongoDB Atlas with persistent Cloudinary CDN URLs,
and cleans up all local files from the backend/uploads directory.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Set sys.path to backend directory
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir / ".env")

from app.db.mongodb import driver_profiles_col, user_files_col, users_col, loan_applications_col
from app.services.cloudinary_service import CloudinaryService

UPLOADS_DIR = backend_dir / "uploads"
STATEMENTS_DIR = UPLOADS_DIR / "statements"
FALLBACK_DIR = UPLOADS_DIR / "cloudinary_fallback"
FACES_DIR = UPLOADS_DIR / "faces"

def run_migration_and_cleanup():
    print("=" * 75)
    print(" GigScore: Uploading All Project Files to Cloudinary & Removing Local Storage")
    print("=" * 75)

    if not CloudinaryService.is_configured():
        print("[ERROR] Cloudinary credentials are not properly set in backend/.env!")
        return False

    # Test upload capability first
    try:
        import cloudinary.uploader
        CloudinaryService._init_cloudinary()
        test_probe = cloudinary.uploader.upload(b"%PDF-1.4 test probe", public_id="gigscore/probe_test", resource_type="raw", overwrite=True)
        cloudinary.uploader.destroy("gigscore/probe_test", resource_type="raw")
        print("[OK] Cloudinary connection verified with full upload permissions.")
    except Exception as perm_err:
        print(f"\n[CLOUDINARY PERMISSION ERROR]: {perm_err}")
        print("\nPlease enable 'Create / Upload' permission on your API key in Cloudinary Console,")
        print("or re-enable the 'Root' key which has full access.")
        return False

    migrated_count = 0
    deleted_count = 0

    # 1. Migrate Fallback Statement PDFs
    if FALLBACK_DIR.exists():
        fallback_files = list(FALLBACK_DIR.glob("*.*"))
        print(f"\n[1] Processing {len(fallback_files)} file(s) in cloudinary_fallback/...")
        for fpath in fallback_files:
            try:
                with open(fpath, "rb") as f:
                    data = f.read()

                # Extract user_id and clean filename
                name_parts = fpath.stem.split("_")
                user_id = name_parts[0] if len(name_parts) > 0 else "driver"
                clean_name = fpath.name

                print(f"  --> Uploading fallback: {fpath.name} ({len(data)} bytes)...")
                res = CloudinaryService.upload_file(
                    file_bytes=data,
                    original_filename=clean_name,
                    user_id=user_id,
                    category="statements",
                    resource_type="raw"
                )
                c_url = res["secure_url"]
                print(f"      Uploaded: {c_url}")
                migrated_count += 1

                # Update any matching driver profiles or files in MongoDB
                driver_profiles_col.update_many(
                    {"$or": [
                        {"uploaded_file_name": {"$regex": fpath.stem, "$options": "i"}},
                        {"uploaded_file_url": {"$regex": fpath.name, "$options": "i"}}
                    ]},
                    {"$set": {
                        "uploaded_file_url": c_url,
                        "cloudinary_public_id": res["public_id"]
                    }}
                )

                user_files_col.update_many(
                    {"$or": [
                        {"original_filename": {"$regex": fpath.stem, "$options": "i"}},
                        {"cloudinary_url": {"$regex": fpath.name, "$options": "i"}}
                    ]},
                    {"$set": {
                        "cloudinary_url": c_url,
                        "cloudinary_public_id": res["public_id"]
                    }}
                )

                # Delete local file
                fpath.unlink()
                deleted_count += 1
                print(f"      [DELETED LOCAL]: {fpath.name}")
            except Exception as e:
                print(f"      [FAILED]: {fpath.name}: {e}")

    # 2. Migrate Statement PDFs from uploads/statements
    if STATEMENTS_DIR.exists():
        statement_files = list(STATEMENTS_DIR.glob("*.pdf"))
        print(f"\n[2] Processing {len(statement_files)} statement PDF(s) in statements/...")
        for fpath in statement_files:
            try:
                with open(fpath, "rb") as f:
                    data = f.read()

                print(f"  --> Uploading statement: {fpath.name} ({len(data)} bytes)...")
                res = CloudinaryService.upload_file(
                    file_bytes=data,
                    original_filename=fpath.name,
                    user_id="driver",
                    category="statements",
                    resource_type="raw"
                )
                c_url = res["secure_url"]
                print(f"      Uploaded: {c_url}")
                migrated_count += 1

                # Update MongoDB records
                driver_profiles_col.update_many(
                    {"$or": [
                        {"uploaded_file_name": fpath.name},
                        {"uploaded_file_url": {"$regex": fpath.name, "$options": "i"}}
                    ]},
                    {"$set": {
                        "uploaded_file_url": c_url,
                        "cloudinary_public_id": res["public_id"]
                    }}
                )

                # Delete local file
                fpath.unlink()
                deleted_count += 1
                print(f"      [DELETED LOCAL]: {fpath.name}")
            except Exception as e:
                print(f"      [FAILED]: {fpath.name}: {e}")

    # 3. Migrate any remaining face photos
    if FACES_DIR.exists():
        face_files = list(FACES_DIR.glob("*.jpg"))
        print(f"\n[3] Processing {len(face_files)} face photo(s) in faces/...")
        for fpath in face_files:
            try:
                user_id = fpath.stem
                with open(fpath, "rb") as f:
                    data = f.read()

                res = CloudinaryService.upload_file(
                    file_bytes=data,
                    original_filename=fpath.name,
                    user_id=user_id,
                    category="identity",
                    resource_type="image"
                )
                c_url = res["secure_url"]
                migrated_count += 1

                users_col.update_one(
                    {"id": user_id},
                    {"$set": {
                        "face_biometrics.photo_url": c_url,
                        "avatar_url": c_url
                    }}
                )

                # Delete local file
                fpath.unlink()
                deleted_count += 1
                print(f"      [DELETED LOCAL]: {fpath.name}")
            except Exception as e:
                print(f"      [FAILED]: {fpath.name}: {e}")

    # Remove empty upload directories
    for d in [STATEMENTS_DIR, FALLBACK_DIR, FACES_DIR, UPLOADS_DIR]:
        try:
            if d.exists() and not any(d.iterdir()):
                d.rmdir()
                print(f"[REMOVED EMPTY DIRECTORY]: {d}")
        except Exception as dir_err:
            pass

    print("\n" + "=" * 75)
    print(f" SUMMARY: {migrated_count} files uploaded to Cloudinary, {deleted_count} local files deleted from project.")
    print("=" * 75)
    return True

if __name__ == "__main__":
    run_migration_and_cleanup()
