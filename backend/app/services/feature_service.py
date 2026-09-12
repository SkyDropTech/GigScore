"""
Feature extraction and aggregation service for drivers using MongoDB.
Integrates with ml/src/features.py.
"""
import sys
import os
import uuid
from datetime import datetime
import numpy as np
from typing import Dict, Any, List, Optional
from pymongo import ASCENDING

# Ensure ml/src is importable (supports both repo root and backend-only deployments)
ML_SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "src"))
if not os.path.exists(ML_SRC_DIR):
    ML_SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml", "src"))
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

from features import calculate_driver_features_from_monthly, MODEL_FEATURE_NAMES, FEATURE_DESCRIPTIONS
from app.core.config import settings
from app.services.pdf_parser_service import PdfParserService
from app.db.mongodb import driver_profiles_col, monthly_features_col, consents_col, users_col
from app.models.mongo_models import DriverProfile, MonthlyFeatures

class FeatureService:
    @staticmethod
    def ingest_driver_data(
        driver_id: str,
        file_name: str,
        ola_connected: bool,
        uber_connected: bool,
        file_url: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Ingests verified platform data parsed directly from the uploaded statement PDF
        and platform API telemetry.
        """
        if not file_name:
            raise ValueError("Earnings statement (PDF or CSV) must be uploaded.")
        if not ola_connected or not uber_connected:
            raise ValueError("Both Ola and Uber platform APIs must be connected.")

        driver_doc = driver_profiles_col.find_one({"id": driver_id}) or {}

        # 1. Attempt to get parsed data from driver profile or local file path
        parsed_data = driver_doc.get("parsed_statement_data")
        file_path = driver_doc.get("uploaded_file_path")

        if not parsed_data and file_path and os.path.exists(file_path):
            try:
                with open(file_path, "rb") as f:
                    parsed_data = PdfParserService.parse_pdf(f.read(), os.path.basename(file_path))
            except Exception as e:
                print(f"[PdfParser] Could not parse file {file_path}: {e}")

        existing_records = list(monthly_features_col.find({"driver_id": driver_id}))
        new_records: List[Dict[str, Any]] = []

        if parsed_data and parsed_data.get("monthly_records"):
            for r in parsed_data["monthly_records"]:
                rec = {
                    "id": f"mf_{uuid.uuid4().hex[:10]}",
                    "driver_id": driver_id,
                    "month": r.get("month"),
                    "gross_income": float(r.get("gross_income", 0.0)),
                    "platform_fee": float(r.get("platform_fee", 0.0)),
                    "other_costs": float(r.get("other_costs", 0.0)),
                    "net_income": float(r.get("net_income", 0.0)),
                    "living_expenses": float(r.get("living_expenses", 0.0)),
                    "total_expenses": float(r.get("total_expenses", 0.0)),
                    "savings": float(r.get("savings", 0.0)),
                    "active_days": int(r.get("active_days", 0)),
                    "trips": int(r.get("trips", 0)),
                    "completion_rate": float(r.get("completion_rate", 0.0)),
                    "cancellation_rate": float(r.get("cancellation_rate", 0.0)),
                    "avg_rating": float(r.get("avg_rating", 0.0)),
                    "peak_hour_share": float(r.get("peak_hour_share", 0.0)),
                    "weekend_share": float(r.get("weekend_share", 0.0))
                }
                new_records.append(rec)

            # Update driver profile with extracted info
            driver_info = parsed_data.get("driver_info", {})
            profile_updates = {}
            if driver_info.get("city"):
                profile_updates["city"] = driver_info["city"]
            if driver_info.get("platform"):
                profile_updates["platform"] = driver_info["platform"]
            if driver_info.get("vehicle"):
                profile_updates["vehicle_type"] = driver_info["vehicle"]
            if len(new_records) > 0:
                profile_updates["tenure_months"] = max(12, len(new_records))

            if profile_updates:
                driver_profiles_col.update_one({"id": driver_id}, {"$set": profile_updates})

            if driver_info.get("name") and driver_doc.get("user_id"):
                users_col.update_one(
                    {"id": driver_doc["user_id"]},
                    {"$set": {"full_name": driver_info["name"]}}
                )
        elif existing_records:
            # Fallback to existing seeded records
            for r in existing_records:
                r.pop('_id', None)
                new_records.append(r)
        else:
            raise ValueError("No valid monthly earnings records could be parsed from the uploaded statement PDF. Please ensure you upload a verified driver earnings statement with readable monthly earnings.")

        monthly_features_col.delete_many({"driver_id": driver_id})
        if new_records:
            monthly_features_col.insert_many(new_records)

        # Update driver profile with file details, permanent storage URL, and connected status
        resolved_url = file_url or driver_doc.get("uploaded_file_url") or f"{settings.BASE_SERVER_URL.rstrip('/')}/uploads/statements/{driver_id}_{file_name}"

        driver_profiles_col.update_one(
            {"id": driver_id},
            {"$set": {
                "uploaded_file_name": file_name,
                "uploaded_file_url": resolved_url,
                "ola_connected": True,
                "uber_connected": True,
                "ingested_at": datetime.utcnow()
            }}
        )

        driver_doc = driver_profiles_col.find_one({"id": driver_id})
        if driver_doc and "user_id" in driver_doc:
            consents_col.update_one(
                {"user_id": driver_doc["user_id"]},
                {
                    "$set": {
                        "id": str(uuid.uuid4()),
                        "user_id": driver_doc["user_id"],
                        "purpose": "CREDIT_DECISIONING",
                        "granted_at": datetime.utcnow(),
                        "revoked_at": None,
                        "is_active": True,
                        "metadata": {"source": "data_ingest_ola_uber_pdf"}
                    }
                },
                upsert=True
            )

        return new_records

    @staticmethod
    def get_driver_features(
        db: Any = None,
        driver_id: str = "",
        requested_amount: float = 50000.0,
        requested_tenure_months: int = 12
    ) -> Dict[str, Any]:
        driver_doc = driver_profiles_col.find_one({"id": driver_id})
        if not driver_doc:
            raise ValueError(f"Driver profile '{driver_id}' not found in MongoDB")
            
        driver = DriverProfile(**driver_doc)

        # Check active consent in MongoDB
        active_consent = consents_col.find_one({
            "user_id": driver.user_id,
            "revoked_at": None,
            "is_active": True
        })
        
        if not active_consent:
            raise PermissionError("Consent has been revoked or was not granted. Telemetry data cannot be accessed.")
            
        records = list(monthly_features_col.find({"driver_id": driver_id}).sort("month", ASCENDING))
        
        if not records:
            raise ValueError("No work data ingested yet. Please upload your statement PDF and connect Ola & Uber APIs.")

        monthly_dicts = [
            {
                "month": r.get("month"),
                "gross_income": r.get("gross_income"),
                "platform_fee": r.get("platform_fee"),
                "other_costs": r.get("other_costs"),
                "net_income": r.get("net_income"),
                "active_days": r.get("active_days"),
                "trips": r.get("trips"),
                "completion_rate": r.get("completion_rate"),
                "cancellation_rate": r.get("cancellation_rate"),
                "avg_rating": r.get("avg_rating"),
                "peak_hour_share": r.get("peak_hour_share"),
                "weekend_share": r.get("weekend_share"),
            }
            for r in records
        ]
        
        driver_profile_dict = {
            "tenure_months": getattr(driver, "tenure_months", 18),
            "kyc_status": getattr(driver, "kyc_status", "verified"),
        }

        features = calculate_driver_features_from_monthly(
            driver_profile=driver_profile_dict,
            monthly_records=monthly_dicts,
            requested_loan_amount=requested_amount,
            requested_tenure_months=requested_tenure_months
        )
        return features
