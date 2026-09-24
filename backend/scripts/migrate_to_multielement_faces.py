"""
Migration script to upgrade all enrolled user face biometrics in MongoDB
to the new ultra-accurate 352-dimensional multi-element format.
"""
import sys
import os
from pathlib import Path
import urllib.request
import numpy as np

# Ensure backend root is in sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.db.mongodb import users_col
from app.services.face_recognition_service import FaceRecognitionService

def run_migration():
    print("=" * 60)
    print("  Starting Biometric Multi-Element Migration")
    print("=" * 60)

    users = list(users_col.find({"face_biometrics.enrolled": True}))
    print(f"[*] Found {len(users)} enrolled users in MongoDB.")

    migrated_count = 0
    skipped_count = 0
    error_count = 0

    for u in users:
        email = u.get("email")
        bio = u.get("face_biometrics", {}) or {}
        emb = bio.get("embedding", [])
        photo_url = bio.get("photo_url")

        if len(emb) == 352:
            print(f"[SKIP] {email} already has 352-d multi-element signature.")
            skipped_count += 1
            continue

        if not photo_url:
            print(f"[WARN] {email} has no photo_url to regenerate embedding.")
            error_count += 1
            continue

        try:
            print(f"[*] Upgrading {email} from photo: {photo_url[:45]}...")
            if photo_url.startswith("http"):
                req = urllib.request.Request(photo_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    img_bytes = resp.read()
            elif photo_url.startswith("/api/auth/face-photo/"):
                safe_id = photo_url.split("/")[-1]
                local_path = backend_root / "uploads" / "faces" / f"{safe_id}.jpg"
                if local_path.exists():
                    with open(local_path, "rb") as f:
                        img_bytes = f.read()
                else:
                    print(f"[WARN] Local file not found for {email}: {local_path}")
                    error_count += 1
                    continue
            else:
                print(f"[WARN] Unknown photo format for {email}: {photo_url}")
                error_count += 1
                continue

            _, new_emb, _ = FaceRecognitionService.process_face_image(img_bytes)
            users_col.update_one(
                {"id": u["id"]},
                {"$set": {"face_biometrics.embedding": new_emb}}
            )
            print(f"[SUCCESS] {email} successfully upgraded to 352-d multi-element signature!")
            migrated_count += 1
        except Exception as err:
            print(f"[ERROR] Failed to migrate {email}: {err}")
            error_count += 1

    print("\n" + "=" * 60)
    print(f"Migration completed! Migrated: {migrated_count}, Skipped: {skipped_count}, Errors: {error_count}")
    print("=" * 60)

if __name__ == "__main__":
    run_migration()
