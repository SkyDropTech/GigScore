"""
MongoDB Database seeder service for GigScore.
Pre-populates drivers, telemetry records, loans, assessments, and audit logs into MongoDB.
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

from app.core.security import hash_password
from app.db.mongodb import (
    users_col, driver_profiles_col, monthly_features_col,
    loan_applications_col, assessments_col, consents_col, audit_logs_col
)
from app.services.assessment_service import AssessmentService
from app.services.audit_service import AuditService

DEMO_USERS = [
    {
        "id": "usr_rahul_00",
        "email": "rahul.sharma@gigscore.demo",
        "full_name": "Rahul Sharma",
        "phone": "+91 98450 11223",
        "role": "driver",
        "driver_id": "GS-884210",
        "city": "Bengaluru (BLR)",
        "platform": "Ola & Uber",
        "vehicle_type": "Sedan (Maruti Dzire)",
        "platform_start_date": "2023-03-10",
        "tenure_months": 36,
        "archetype": "stable_high",
        "initial_loan": {
            "amount": 75000.0,
            "tenure": 12,
            "purpose": "Vehicle Maintenance & CNG Kit Upgrade"
        }
    },
    {
        "id": "usr_rajesh_01",
        "email": "rajesh.kumar@gigscore.demo",
        "full_name": "Rajesh V. Kumar",
        "phone": "+91 98765 43210",
        "role": "driver",
        "driver_id": "APP-98241",
        "city": "Bengaluru (BLR)",
        "platform": "OLA FLEET",
        "vehicle_type": "Sedan (Dzire)",
        "platform_start_date": "2023-01-15",
        "tenure_months": 36,
        "archetype": "stable_high",
        "initial_loan": {
            "amount": 75000.0,
            "tenure": 12,
            "purpose": "Working Capital & Tire Replacement"
        }
    },
    {
        "id": "usr_amit_02",
        "email": "amit.shinde@gigscore.demo",
        "full_name": "Amit R. Shinde",
        "phone": "+91 98111 22334",
        "role": "driver",
        "driver_id": "APP-98240",
        "city": "Mumbai (BOM)",
        "platform": "UBER PRO",
        "vehicle_type": "Auto-Rickshaw (EV)",
        "platform_start_date": "2024-06-10",
        "tenure_months": 15,
        "archetype": "moderate_volatile",
        "initial_loan": {
            "amount": 38150.0,
            "tenure": 12,
            "purpose": "EV Battery Replacement & Smartphone"
        }
    },
    {
        "id": "usr_suresh_03",
        "email": "suresh.gowda@gigscore.demo",
        "full_name": "Suresh B. Gowda",
        "phone": "+91 97222 33445",
        "role": "driver",
        "driver_id": "APP-98239",
        "city": "Bengaluru (BLR)",
        "platform": "OLA + UBER",
        "vehicle_type": "Hatchback (WagonR)",
        "platform_start_date": "2022-09-01",
        "tenure_months": 42,
        "archetype": "stable_high",
        "initial_loan": {
            "amount": 120000.0,
            "tenure": 18,
            "purpose": "Vehicle Overhaul & Working Capital"
        }
    },
    {
        "id": "usr_imran_04",
        "email": "imran.khan@gigscore.demo",
        "full_name": "Mohd. Imran Khan",
        "phone": "+91 99112 33445",
        "role": "driver",
        "driver_id": "APP-98238",
        "city": "Delhi (DEL)",
        "platform": "OLA FLEET",
        "vehicle_type": "Bike Taxi (Pulsar)",
        "platform_start_date": "2025-08-01",
        "tenure_months": 8,
        "archetype": "declining_high_risk",
        "initial_loan": {
            "amount": 25000.0,
            "tenure": 6,
            "purpose": "Bike Repair & Insurance"
        }
    },
    {
        "id": "usr_deepa_05",
        "email": "deepa.narayanan@gigscore.demo",
        "full_name": "Deepa Narayanan",
        "phone": "+91 98840 55667",
        "role": "driver",
        "driver_id": "APP-98237",
        "city": "Chennai (MAA)",
        "platform": "UBER PRO",
        "vehicle_type": "Sedan (Ciaz)",
        "platform_start_date": "2024-02-15",
        "tenure_months": 22,
        "archetype": "moderate_volatile",
        "initial_loan": {
            "amount": 50000.0,
            "tenure": 12,
            "purpose": "Annual Permit & Insurance"
        }
    },
    {
        "id": "usr_priya_06",
        "email": "priya.underwriter@gigscore.demo",
        "full_name": "Priya Sharma",
        "phone": "+91 99000 11223",
        "role": "lender"
    },
    {
        "id": "usr_aditya_07",
        "email": "admin@gigscore.demo",
        "full_name": "Aditya Nair",
        "phone": "+91 99555 66778",
        "role": "admin"
    },
    {
        "id": "usr_admin_com",
        "email": "admin@gigscore.com",
        "full_name": "Vivek Menon (Senior Underwriter)",
        "phone": "+91 99000 12345",
        "role": "admin"
    }
]

def seed_mongo_database(force_reset: bool = False):
    """Populates MongoDB with realistic driver records, loans, assessments, and audit logs."""
    existing_count = users_col.count_documents({"email": "rajesh.kumar@gigscore.demo"})
    if existing_count > 0 and not force_reset:
        return

    if force_reset:
        demo_emails = [u["email"] for u in DEMO_USERS]
        demo_driver_ids = [u["driver_id"] for u in DEMO_USERS if "driver_id" in u]
        demo_user_ids = [u["id"] for u in DEMO_USERS]
        
        users_col.delete_many({"email": {"$in": demo_emails}})
        driver_profiles_col.delete_many({"id": {"$in": demo_driver_ids}})
        consents_col.delete_many({"user_id": {"$in": demo_user_ids}})
        monthly_features_col.delete_many({"driver_id": {"$in": demo_driver_ids}})
        loan_applications_col.delete_many({"driver_id": {"$in": demo_driver_ids}})
        assessments_col.delete_many({"driver_id": {"$in": demo_driver_ids}})

    print("Seeding MongoDB demo personas...")
    pwd_hash = hash_password("password123")

    for u_info in DEMO_USERS:
        user_doc = {
            "id": u_info["id"],
            "email": u_info["email"],
            "phone": u_info.get("phone", "+91 98000 00000"),
            "full_name": u_info["full_name"],
            "password_hash": pwd_hash,
            "role": u_info["role"],
            "status": "ACTIVE",
            "created_at": datetime.utcnow()
        }
        users_col.update_one({"id": user_doc["id"]}, {"$set": user_doc}, upsert=True)

        if u_info["role"] == "driver":
            driver_doc = {
                "id": u_info["driver_id"],
                "user_id": u_info["id"],
                "city": u_info["city"],
                "platform": u_info["platform"],
                "vehicle_type": u_info["vehicle_type"],
                "platform_start_date": u_info["platform_start_date"],
                "tenure_months": u_info["tenure_months"],
                "kyc_status": "VERIFIED",
                "archetype": u_info["archetype"],
                "uploaded_file_name": f"{u_info['driver_id']}_verified_statement.pdf",
                "uploaded_file_url": f"http://127.0.0.1:8000/uploads/statements/{u_info['driver_id']}_verified_statement.pdf",
                "uploaded_file_size": "2.8 MB",
                "ola_connected": True,
                "uber_connected": True,
                "created_at": datetime.utcnow()
            }
            driver_profiles_col.update_one({"id": driver_doc["id"]}, {"$set": driver_doc}, upsert=True)

            consent_doc = {
                "id": f"cns_{u_info['driver_id']}",
                "user_id": u_info["id"],
                "purpose": "Gig-economy work and earnings data access for alternative credit assessment",
                "scope": "rides,earnings,ratings,tenure",
                "version": "v1.0",
                "is_active": True,
                "granted_at": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "revoked_at": None
            }
            consents_col.update_one({"id": consent_doc["id"]}, {"$set": consent_doc}, upsert=True)

            # Monthly features
            base_income = 54290.0 if "Rajesh" in u_info["full_name"] or "Rahul" in u_info["full_name"] else 38150.0 if "Amit" in u_info["full_name"] else 68400.0 if "Suresh" in u_info["full_name"] else 16300.0 if "Imran" in u_info["full_name"] else 46750.0
            for m_idx in range(12):
                month_str = f"2025-{(m_idx % 12) + 1:02d}"
                active_days = 26 if "Suresh" in u_info["full_name"] or "Rajesh" in u_info["full_name"] or "Rahul" in u_info["full_name"] else 21 if "Amit" in u_info["full_name"] or "Deepa" in u_info["full_name"] else 11
                trips = 480 if "Rajesh" in u_info["full_name"] or "Rahul" in u_info["full_name"] else 380 if "Amit" in u_info["full_name"] else 520 if "Suresh" in u_info["full_name"] else 150
                comp_rate = 0.96 if "Rajesh" in u_info["full_name"] or "Rahul" in u_info["full_name"] or "Suresh" in u_info["full_name"] else 0.88 if "Amit" in u_info["full_name"] else 0.74
                canc_rate = 0.035 if "Rajesh" in u_info["full_name"] or "Rahul" in u_info["full_name"] or "Suresh" in u_info["full_name"] else 0.08 if "Amit" in u_info["full_name"] else 0.23
                rating = 4.89 if "Rajesh" in u_info["full_name"] or "Rahul" in u_info["full_name"] else 4.92 if "Suresh" in u_info["full_name"] else 4.74 if "Amit" in u_info["full_name"] else 4.21

                mf_doc = {
                    "id": f"mf_{u_info['driver_id']}_{m_idx+1:02d}",
                    "driver_id": u_info["driver_id"],
                    "month": month_str,
                    "gross_income": round(base_income * 1.25, 2),
                    "platform_fee": round(base_income * 0.20, 2),
                    "other_costs": round(base_income * 0.10, 2),
                    "net_income": float(base_income),
                    "active_days": active_days,
                    "trips": trips,
                    "completion_rate": comp_rate,
                    "cancellation_rate": canc_rate,
                    "avg_rating": rating,
                    "peak_hour_share": 0.48,
                    "weekend_share": 0.32
                }
                monthly_features_col.update_one(
                    {"driver_id": u_info["driver_id"], "month": month_str},
                    {"$set": mf_doc},
                    upsert=True
                )

            # Initial loan application
            loan_cfg = u_info.get("initial_loan")
            if loan_cfg:
                loan_id = f"loan_{u_info['driver_id']}"
                loan_doc = {
                    "id": loan_id,
                    "driver_id": u_info["driver_id"],
                    "requested_amount": loan_cfg["amount"],
                    "tenure_months": loan_cfg["tenure"],
                    "purpose": loan_cfg["purpose"],
                    "status": "PENDING",
                    "uploaded_file_name": f"{u_info['driver_id']}_verified_statement.pdf",
                    "uploaded_file_url": f"http://127.0.0.1:8000/uploads/statements/{u_info['driver_id']}_verified_statement.pdf",
                    "uploaded_file_size": "2.8 MB",
                    "created_at": datetime.utcnow() - timedelta(days=1)
                }
                loan_applications_col.update_one({"id": loan_id}, {"$set": loan_doc}, upsert=True)

                try:
                    AssessmentService.evaluate_credit(
                        application_id=loan_id,
                        actor_id=u_info["id"],
                        actor_email=u_info["email"]
                    )
                except Exception as e:
                    print(f"Demo credit evaluation notice: {e}")

    AuditService.log_action(
        action="DATABASE_SEEDED",
        entity_type="SYSTEM",
        entity_id="init_seed",
        actor_id="usr_aditya_07",
        actor_email="admin@gigscore.demo",
        metadata={"num_users": len(DEMO_USERS)}
    )
    print("MongoDB demo personas seeded successfully.")
