"""
Database seeder service for GigScore.
Pre-populates drivers, telemetry records, loans, assessments, and audit logs
matching the reference designs.
"""
import os
import json
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.entities import (
    User, DriverProfile, Consent, MonthlyFeatures, LoanApplication,
    Assessment, AssessmentFactor, ModelVersion, Document
)
from app.core.security import hash_password
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
    }
]

def seed_database(db: Session, force_reset: bool = False):
    """Populates database with realistic driver records matching reference screens."""
    user_count = db.query(User).count()
    if user_count > 0 and not force_reset:
        return
        
    if force_reset:
        db.query(AssessmentFactor).delete()
        db.query(Assessment).delete()
        db.query(LoanApplication).delete()
        db.query(MonthlyFeatures).delete()
        db.query(Consent).delete()
        db.query(Document).delete()
        db.query(DriverProfile).delete()
        db.query(ModelVersion).delete()
        db.query(User).delete()
        db.commit()

    print("Seeding demo users and profiles...")
    
    # 1. Model version
    report_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts", "model_evaluation_report.json")
    )
    metrics_content = "{}"
    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            metrics_content = f.read()

    mv = ModelVersion(
        id="mv_xgb_v28_prod",
        name="GradientBoost_v28_prod (XGBoost Calibrated)",
        version="xgb-v2.8-prod",
        artifact_path="backend/app/ml/artifacts/xgb_calibrated_model.joblib",
        metrics_json=metrics_content,
        active=True,
        created_at=datetime.now()
    )
    db.add(mv)
    
    # Load demo monthly records
    csv_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "data", "demo_driver_records.csv")
    )
    df_records = pd.read_csv(csv_path) if os.path.exists(csv_path) else None

    for u_info in DEMO_USERS:
        user = User(
            id=u_info["id"],
            email=u_info["email"],
            phone=u_info["phone"],
            full_name=u_info["full_name"],
            password_hash=hash_password("password123"),
            role=u_info["role"],
            status="ACTIVE"
        )
        db.add(user)
        db.commit()
        
        if u_info["role"] == "driver":
            driver = DriverProfile(
                id=u_info["driver_id"],
                user_id=user.id,
                city=u_info["city"],
                platform=u_info["platform"],
                vehicle_type=u_info["vehicle_type"],
                platform_start_date=u_info["platform_start_date"],
                tenure_months=u_info["tenure_months"],
                kyc_status="VERIFIED",
                archetype=u_info["archetype"]
            )
            db.add(driver)
            
            consent = Consent(
                id=f"cns_{u_info['driver_id']}",
                user_id=user.id,
                purpose="Gig-economy work and earnings data access for alternative credit assessment",
                scope="rides,earnings,ratings,tenure",
                version="v1.0"
            )
            db.add(consent)
            
            doc = Document(
                id=f"doc_{u_info['driver_id']}_dl",
                driver_id=driver.id,
                doc_type="DRIVING_LICENSE",
                filename=f"{u_info['full_name'].lower().replace(' ', '_')}_dl.pdf",
                verification_status="VERIFIED"
            )
            db.add(doc)
            
            # Populate monthly records
            base_income = 54290 if "Rajesh" in user.full_name or "Rahul" in user.full_name else 38150 if "Amit" in user.full_name else 68400 if "Suresh" in user.full_name else 16300 if "Imran" in user.full_name else 46750
            for m_idx in range(12):
                month_str = f"2025-{(m_idx % 12) + 1:02d}"
                mf = MonthlyFeatures(
                    id=f"mf_{driver.id}_{m_idx+1:02d}",
                    driver_id=driver.id,
                    month=month_str,
                    gross_income=round(base_income * 1.25, 2),
                    platform_fee=round(base_income * 0.20, 2),
                    other_costs=round(base_income * 0.10, 2),
                    net_income=float(base_income),
                    active_days=26 if "Suresh" in user.full_name or "Rajesh" in user.full_name or "Rahul" in user.full_name else 21 if "Amit" in user.full_name or "Deepa" in user.full_name else 11,
                    trips=480 if "Rajesh" in user.full_name or "Rahul" in user.full_name else 380 if "Amit" in user.full_name else 520 if "Suresh" in user.full_name else 150,
                    completion_rate=0.96 if "Rajesh" in user.full_name or "Rahul" in user.full_name or "Suresh" in user.full_name else 0.88 if "Amit" in user.full_name else 0.74,
                    cancellation_rate=0.035 if "Rajesh" in user.full_name or "Rahul" in user.full_name or "Suresh" in user.full_name else 0.08 if "Amit" in user.full_name else 0.23,
                    avg_rating=4.89 if "Rajesh" in user.full_name or "Rahul" in user.full_name else 4.92 if "Suresh" in user.full_name else 4.74 if "Amit" in user.full_name else 4.21,
                    peak_hour_share=0.48,
                    weekend_share=0.32
                )
                db.add(mf)
            db.commit()
            
            # Initial loan application
            loan_cfg = u_info.get("initial_loan")
            if loan_cfg:
                loan_app = LoanApplication(
                    id=f"loan_{driver.id}",
                    driver_id=driver.id,
                    requested_amount=loan_cfg["amount"],
                    tenure_months=loan_cfg["tenure"],
                    purpose=loan_cfg["purpose"],
                    status="SUBMITTED",
                    created_at=datetime.now() - timedelta(days=1)
                )
                db.add(loan_app)
                db.commit()
                
                try:
                    AssessmentService.evaluate_credit(
                        db=db,
                        application_id=loan_app.id,
                        actor_id=user.id,
                        actor_email=user.email
                    )
                except Exception as e:
                    print(f"Credit evaluation warning: {e}")

    AuditService.log_action(
        db,
        action="DATABASE_SEEDED",
        entity_type="SYSTEM",
        entity_id="init_seed",
        actor_id="usr_aditya_07",
        actor_email="admin@gigscore.demo",
        metadata={"num_users": len(DEMO_USERS)}
    )
    print("Database seeding completed.")
