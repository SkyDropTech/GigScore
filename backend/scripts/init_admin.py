"""
Initialize Root Admin Account in MongoDB.
Run this script to set up a clean admin account for the Admin Operations Console.
"""
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.mongodb import users_col, init_mongo_indexes
from app.core.security import hash_password

def create_admin():
    init_mongo_indexes()
    admin_email = "admin@gigscore.com"
    existing = users_col.find_one({"email": admin_email})
    if existing:
        print(f"Admin user '{admin_email}' already exists in MongoDB.")
        return

    admin_doc = {
        "id": "usr_root_admin",
        "email": admin_email,
        "phone": "+91 98000 00001",
        "full_name": "System Underwriter Admin",
        "password_hash": hash_password("Admin@123456"),
        "role": "admin",
        "status": "ACTIVE",
        "created_at": datetime.utcnow()
    }
    users_col.insert_one(admin_doc)
    print("Root Admin created successfully in MongoDB!")
    print(f"   Email:    {admin_email}")
    print("   Password: Admin@123456")
    print("   Role:     admin")

if __name__ == "__main__":
    create_admin()
