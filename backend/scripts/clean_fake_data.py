"""
Production Database Sanitizer for GigScore.
Removes all fake, test, dummy, and pre-seeded demonstration data from MongoDB,
leaving only real user accounts, verified drivers, actual statement uploads, and legitimate loans.
"""
import sys
import os

# Set working directory to backend
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.mongodb import (
    users_col,
    driver_profiles_col,
    loan_applications_col,
    monthly_features_col,
    assessments_col,
    consents_col,
    user_files_col,
    db
)

TEST_EMAIL_PATTERNS = [
    "@gigscore.demo",
    "testbiometrics.com",
    "testfacelogin.com",
    "testdriver.com",
    "testvite_",
    "testdriver_",
    "wjbwfjkwbcwjkcwjkc"
]

SEEDED_USER_ID_PREFIXES = (
    "usr_rahul",
    "usr_rajesh",
    "usr_amit",
    "usr_suresh",
    "usr_imran",
    "usr_deepa",
    "usr_priya",
    "usr_aditya"
)

SEEDED_DRIVER_IDS = {
    "GS-884210",
    "APP-98241",
    "APP-98240",
    "APP-98239",
    "APP-98238",
    "APP-98237"
}

SEEDED_LOAN_IDS = {
    "loan_GS-884210",
    "loan_APP-98241",
    "loan_APP-98240",
    "loan_APP-98239",
    "loan_APP-98238",
    "loan_APP-98237"
}

def clean_database():
    print("=" * 70)
    print(f"  Purging Fake & Test Data from MongoDB Database: [{db.name}]")
    print("=" * 70)

    # 1. Identify fake / test users
    fake_user_ids = set()
    for u in users_col.find({}):
        email = u.get("email", "").lower().strip()
        uid = u.get("id", "")
        if any(pat in email for pat in TEST_EMAIL_PATTERNS) or uid.startswith(SEEDED_USER_ID_PREFIXES):
            fake_user_ids.add(uid)

    print(f"\n[1] Identified {len(fake_user_ids)} fake/test users to purge.")

    # 2. Identify fake / test driver profiles (including orphans without users)
    valid_user_ids = set(u["id"] for u in users_col.find({}) if u["id"] not in fake_user_ids)

    fake_driver_ids = set(SEEDED_DRIVER_IDS)
    for d in driver_profiles_col.find({}):
        did = d.get("id", "")
        uid = d.get("user_id", "")
        fname = d.get("uploaded_file_name", "") or ""

        if (
            uid in fake_user_ids or
            uid not in valid_user_ids or
            did in SEEDED_DRIVER_IDS or
            fname.endswith("_verified_statement.pdf")
        ):
            fake_driver_ids.add(did)

    print(f"[2] Identified {len(fake_driver_ids)} fake/test driver profiles to purge.")

    # 3. Identify fake / test loans
    valid_driver_ids = set(d["id"] for d in driver_profiles_col.find({}) if d["id"] not in fake_driver_ids)

    fake_loan_ids = set(SEEDED_LOAN_IDS)
    for l in loan_applications_col.find({}):
        lid = l.get("id", "")
        did = l.get("driver_id", "")
        fname = l.get("uploaded_file_name", "") or ""

        if (
            did in fake_driver_ids or
            did not in valid_driver_ids or
            lid in SEEDED_LOAN_IDS or
            fname.endswith("_verified_statement.pdf")
        ):
            fake_loan_ids.add(lid)

    print(f"[3] Identified {len(fake_loan_ids)} fake/test loans to purge.")

    # 4. Perform deletions
    # Consents
    c_res = consents_col.delete_many({
        "$or": [
            {"user_id": {"$in": list(fake_user_ids)}},
            {"user_id": {"$nin": list(valid_user_ids)}}
        ]
    })
    print(f"  [-] Deleted {c_res.deleted_count} fake/orphan consent records.")

    # User Files
    uf_res = user_files_col.delete_many({
        "$or": [
            {"user_id": {"$in": list(fake_user_ids)}},
            {"user_id": {"$nin": list(valid_user_ids)}}
        ]
    })
    print(f"  [-] Deleted {uf_res.deleted_count} fake/orphan user file records.")

    # Monthly Features
    mf_res = monthly_features_col.delete_many({
        "$or": [
            {"driver_id": {"$in": list(fake_driver_ids)}},
            {"driver_id": {"$nin": list(valid_driver_ids)}}
        ]
    })
    print(f"  [-] Deleted {mf_res.deleted_count} fake/orphan monthly feature records.")

    # Assessments
    as_res = assessments_col.delete_many({
        "$or": [
            {"driver_id": {"$in": list(fake_driver_ids)}},
            {"driver_id": {"$nin": list(valid_driver_ids)}}
        ]
    })
    print(f"  [-] Deleted {as_res.deleted_count} fake/orphan assessment records.")

    # Loans
    ln_res = loan_applications_col.delete_many({
        "$or": [
            {"id": {"$in": list(fake_loan_ids)}},
            {"driver_id": {"$in": list(fake_driver_ids)}},
            {"driver_id": {"$nin": list(valid_driver_ids)}}
        ]
    })
    print(f"  [-] Deleted {ln_res.deleted_count} fake/test loan applications.")

    # Drivers
    dr_res = driver_profiles_col.delete_many({
        "$or": [
            {"id": {"$in": list(fake_driver_ids)}},
            {"user_id": {"$in": list(fake_user_ids)}},
            {"user_id": {"$nin": list(valid_user_ids)}}
        ]
    })
    print(f"  [-] Deleted {dr_res.deleted_count} fake/orphan driver profiles.")

    # Users
    u_res = users_col.delete_many({
        "id": {"$in": list(fake_user_ids)}
    })
    print(f"  [-] Deleted {u_res.deleted_count} fake/test user accounts.")

    print("\n" + "=" * 70)
    print("  PRODUCTION DATABASE VERIFICATION: REMAINING REAL DATA")
    print("=" * 70)

    remaining_users = list(users_col.find({}))
    remaining_drivers = list(driver_profiles_col.find({}))
    remaining_loans = list(loan_applications_col.find({}))

    print(f"\n[OK] Real Users: {len(remaining_users)}")
    for u in remaining_users:
        print(f"  - {u.get('email')} ({u.get('full_name', 'N/A')}) [{u.get('role')}]")

    print(f"\n[OK] Real Driver Profiles: {len(remaining_drivers)}")
    for d in remaining_drivers:
        print(f"  - Driver ID: {d.get('id')} | File: {d.get('uploaded_file_name')}")

    print(f"\n[OK] Real Loan Applications: {len(remaining_loans)}")
    for l in remaining_loans:
        print(f"  - Loan ID: {l.get('id')} | Driver: {l.get('driver_id')} | Amount: {l.get('requested_amount')} | Status: {l.get('status')}")

    print("\n[SUCCESS] Production database successfully cleansed of all fake and test records!\n")

if __name__ == "__main__":
    clean_database()
