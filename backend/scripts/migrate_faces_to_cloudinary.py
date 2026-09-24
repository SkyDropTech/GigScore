"""
Face Data Cloudinary Migration Script.
Uploads all biometric face portraits from local uploads/faces to Cloudinary CDN
and updates MongoDB Atlas user records with persistent Cloudinary CDN URLs.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir / ".env")

from app.db.mongodb import users_col
from app.services.cloudinary_service import CloudinaryService
from app.services.face_recognition_service import FACES_DIR

def migrate_faces():
    print("=" * 70)
    print(" GigScore: Migrating Biometric Face Data to Cloudinary")
    print("=" * 70)

    if not CloudinaryService.is_configured():
        print("[ERROR] Cloudinary credentials are not configured in backend/.env!")
        return

    face_files = list(FACES_DIR.glob("*.jpg"))
    print(f"Found {len(face_files)} local face portrait(s) in {FACES_DIR}")

    migrated_count = 0
    updated_users = 0

    for fpath in face_files:
        user_id = fpath.stem
        try:
            with open(fpath, "rb") as f:
                content = f.read()

            print(f"\n--> Uploading portrait for: {user_id} ({len(content)} bytes)...")
            res = CloudinaryService.upload_file(
                file_bytes=content,
                original_filename=fpath.name,
                user_id=user_id,
                category="identity",
                resource_type="image"
            )

            c_url = res.get("secure_url")
            print(f"    [Cloudinary URL]: {c_url}")
            migrated_count += 1

            # Update MongoDB user record
            update_res = users_col.update_one(
                {"id": user_id},
                {"$set": {
                    "face_biometrics.photo_url": c_url,
                    "avatar_url": c_url
                }}
            )
            if update_res.matched_count > 0:
                print(f"    [MongoDB]: Updated user '{user_id}' with Cloudinary photo_url")
                updated_users += 1
            else:
                print(f"    [MongoDB Notice]: User '{user_id}' not found in database (orphaned local file).")

        except Exception as err:
            print(f"    [FAIL] Could not migrate {fpath.name}: {err}")

    # Also check if any enrolled users in MongoDB need their photo_url pointed to Cloudinary
    enrolled_users = list(users_col.find({"face_biometrics.enrolled": True}))
    print(f"\nVerifying {len(enrolled_users)} enrolled users in MongoDB...")
    for u in enrolled_users:
        uid = u["id"]
        bio = u.get("face_biometrics", {})
        cur_url = bio.get("photo_url", "")
        if cur_url.startswith("https://res.cloudinary.com"):
            print(f"  [OK] User {uid} ({u.get('email')}) -> Cloudinary: {cur_url}")
        else:
            print(f"  [PENDING] User {uid} ({u.get('email')}) -> {cur_url}")

    print("\n" + "=" * 70)
    print(f" MIGRATION COMPLETE: {migrated_count} faces uploaded to Cloudinary, {updated_users} MongoDB users updated.")
    print("=" * 70)

if __name__ == "__main__":
    migrate_faces()
