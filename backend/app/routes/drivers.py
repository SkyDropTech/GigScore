"""
Driver metrics, earnings, performance, and data import routes using MongoDB.
Strictly isolated for Driver persona.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import numpy as np
import pandas as pd
import io
import uuid
from pymongo import ASCENDING

class IngestionRequest(BaseModel):
    file_name: Optional[str] = None
    file_size: Any = "3.4 MB"
    file_url: Optional[str] = None
    monthly_records: Optional[List[Dict[str, Any]]] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    vehicle_type: Optional[str] = None
    platform: Optional[str] = None
    ola_connected: bool = True
    uber_connected: bool = True

from app.models.mongo_models import User, DriverProfile, MonthlyFeatures, Consent, Assessment
from app.schemas.dto import DriverProfileOut, MonthlyRecordOut, DriverSummaryMetrics, AssessmentOut, AssessmentFactorOut
from app.services.auth_service import get_current_user, require_roles
from app.services.audit_service import AuditService
from app.db.mongodb import (
    driver_profiles_col,
    monthly_features_col,
    consents_col,
    assessments_col,
    users_col,
    user_files_col
)

router = APIRouter(prefix="", tags=["Drivers"])

@router.get("/drivers/me", response_model=DriverProfileOut)
def get_my_driver_profile(
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found in MongoDB")
        
    profile = DriverProfile(**profile_doc)
    return DriverProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        city=getattr(profile, "city", "Bengaluru"),
        platform=getattr(profile, "platform", "Uber & Ola"),
        vehicle_type=getattr(profile, "vehicle_type", "Sedan"),
        platform_start_date=getattr(profile, "platform_start_date", "2024-01-01"),
        tenure_months=getattr(profile, "tenure_months", 18),
        kyc_status=getattr(profile, "kyc_status", "VERIFIED"),
        archetype=getattr(profile, "archetype", "custom"),
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        uploaded_file_name=profile_doc.get("uploaded_file_name"),
        uploaded_file_url=profile_doc.get("uploaded_file_url"),
        uploaded_file_size=profile_doc.get("uploaded_file_size"),
        ola_connected=profile_doc.get("ola_connected", False),
        uber_connected=profile_doc.get("uber_connected", False),
        ingested_at=profile_doc.get("ingested_at"),
        parsed_statement_data=profile_doc.get("parsed_statement_data")
    )

@router.post("/drivers/me/upload-statement")
async def upload_statement_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    content = await file.read()
    
    from app.services.cloudinary_service import CloudinaryService
    from app.services.document_parser_service import DocumentParserService
    from app.services.feature_service import FeatureService
    from app.services.assessment_service import AssessmentService

    # 1. Strict validation
    clean_filename, ext = CloudinaryService.validate_file(file, content=content)

    # 2. Upload file to Cloudinary under user category
    upload_res = CloudinaryService.upload_file(
        file_bytes=content,
        original_filename=clean_filename,
        user_id=current_user.id,
        category="statements",
        resource_type="auto"
    )

    # 3. Store file metadata in MongoDB user_files collection with rollback protection
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    now_utc = datetime.now(timezone.utc)
    file_doc = {
        "id": file_id,
        "file_id": file_id,
        "user_id": current_user.id,
        "driver_id": profile_doc["id"],
        "original_filename": upload_res["filename"],
        "cloudinary_public_id": upload_res["public_id"],
        "cloudinary_url": upload_res["secure_url"],
        "resource_type": upload_res["resource_type"],
        "file_format": upload_res["format"],
        "file_size": upload_res["bytes"],
        "file_size_formatted": upload_res["file_size"],
        "file_category": "statements",
        "processing_status": "PROCESSED",
        "created_at": now_utc
    }

    try:
        user_files_col.insert_one(file_doc)
    except Exception as db_err:
        # Rollback: Clean up orphaned asset in Cloudinary
        CloudinaryService.delete_file(upload_res["public_id"], resource_type=upload_res["resource_type"])
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist file record in database: {db_err}"
        )

    # 4. Multi-format Document Parsing (PDF, DOCX, CSV)
    parsed_data = {}
    try:
        parsed_data = DocumentParserService.parse_document(content, clean_filename)
    except Exception as parse_err:
        print(f"[DocumentParser Notice] Could not parse tabular records immediately: {parse_err}")

    driver_profiles_col.update_one(
        {"id": profile_doc["id"]},
        {"$set": {
            "uploaded_file_name": upload_res["filename"],
            "uploaded_file_url": upload_res["secure_url"],
            "uploaded_file_size": upload_res["file_size"],
            "cloudinary_public_id": upload_res["public_id"],
            "uploaded_at": now_utc,
            "ingested_at": now_utc,
            "ola_connected": True,
            "uber_connected": True,
            "parsed_statement_data": parsed_data
        }}
    )

    # 5. Ingest into monthly features & compute ML assessment
    assessment_data = None
    records = []
    try:
        records = FeatureService.ingest_driver_data(
            driver_id=profile_doc["id"],
            file_name=upload_res["filename"],
            ola_connected=True,
            uber_connected=True,
            file_url=upload_res["secure_url"]
        )
        assessment = AssessmentService.evaluate_driver_preview(
            driver_id=profile_doc["id"],
            actor_id=current_user.id,
            actor_email=current_user.email
        )
        assessment_data = assessment.to_dict()
    except Exception as auto_ingest_err:
        print(f"[Auto-Ingest Notice] {auto_ingest_err}")

    return {
        "status": "success",
        "message": f"Statement file permanently stored via {upload_res['provider']} and auto-ingested",
        "file_id": file_id,
        "file_name": upload_res["filename"],
        "file_url": upload_res["secure_url"],
        "file_size": upload_res["file_size"],
        "provider": upload_res["provider"],
        "cloudinary_public_id": upload_res["public_id"],
        "parsed_driver_info": parsed_data.get("driver_info", {}),
        "parsed_months_count": len(parsed_data.get("monthly_records", [])) or len(records),
        "ml_summary": parsed_data.get("ml_summary", {}),
        "assessment": assessment_data
    }



@router.get("/drivers/me/assessment")
def get_driver_latest_assessment(
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    latest_asmt = assessments_col.find_one(
        {"driver_id": profile_doc["id"]},
        sort=[("created_at", -1)]
    )
    if not latest_asmt:
        return None

    raw_factors = latest_asmt.get("factors", [])
    formatted_factors = [
        AssessmentFactorOut(
            feature_name=f.get("feature_name", ""),
            direction=f.get("direction", "positive"),
            contribution=float(f.get("contribution", 0.0)),
            display_reason=f.get("display_reason", "")
        )
        for f in raw_factors
    ]

    return AssessmentOut(
        id=latest_asmt.get("id"),
        application_id=latest_asmt.get("application_id"),
        driver_id=latest_asmt.get("driver_id"),
        model_version=latest_asmt.get("model_version", "xgb-v3.2-calibrated"),
        score=latest_asmt.get("score", 0),
        probability_of_default=float(latest_asmt.get("probability_of_default", 0.0)),
        risk_band=latest_asmt.get("risk_band", "LOW"),
        decision=latest_asmt.get("decision", "ELIGIBLE"),
        recommended_amount=float(latest_asmt.get("recommended_amount", 0.0)),
        recommended_emi=float(latest_asmt.get("recommended_emi", 0.0)),
        affordability_ratio=float(latest_asmt.get("affordability_ratio", 0.0)),
        created_at=latest_asmt.get("created_at"),
        factors=formatted_factors
    )


@router.get("/drivers/me/summary", response_model=DriverSummaryMetrics)
def get_driver_summary(
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found")
        
    profile = DriverProfile(**profile_doc)
    
    records_docs = list(monthly_features_col.find({"driver_id": profile.id}).sort("month", ASCENDING))
    
    consent_doc = consents_col.find_one({
        "user_id": current_user.id,
        "revoked_at": None,
        "is_active": True
    })
    
    if not records_docs:
        return DriverSummaryMetrics(
            tenure_months=getattr(profile, "tenure_months", 12),
            avg_monthly_net_income=0.0,
            income_volatility_cv=0.0,
            last_month_net_income=0.0,
            total_trips_12m=0,
            avg_trips_per_month=0,
            avg_active_days=0.0,
            completion_rate=0.0,
            cancellation_rate=0.0,
            avg_rating=0.0,
            consent_active=bool(consent_doc),
            data_freshness="No data available"
        )
        
    records = [MonthlyFeatures(**d) for d in records_docs]
    net_incomes = [r.net_income for r in records]
    avg_net = float(np.mean(net_incomes))
    income_std = float(np.std(net_incomes)) if len(net_incomes) > 1 else 0.0
    cv = float(income_std / avg_net) if avg_net > 0 else 0.0
    
    total_trips = sum(r.trips for r in records)
    avg_trips = int(total_trips / max(1, len(records)))
    avg_days = float(np.mean([r.active_days for r in records]))
    comp_rate = float(np.mean([r.completion_rate for r in records]))
    canc_rate = float(np.mean([r.cancellation_rate for r in records]))
    rating = float(np.mean([r.avg_rating for r in records]))
    
    # Latest assessment in MongoDB
    latest_asmt_doc = assessments_col.find_one(
        {"driver_id": profile.id},
        sort=[("created_at", -1)]
    )

    return DriverSummaryMetrics(
        tenure_months=getattr(profile, "tenure_months", 12),
        avg_monthly_net_income=round(avg_net, 2),
        income_volatility_cv=round(cv, 3),
        last_month_net_income=round(net_incomes[-1], 2),
        total_trips_12m=total_trips,
        avg_trips_per_month=avg_trips,
        avg_active_days=round(avg_days, 1),
        completion_rate=round(comp_rate, 3),
        cancellation_rate=round(canc_rate, 3),
        avg_rating=round(rating, 2),
        consent_active=bool(consent_doc),
        data_freshness="Updated live (Verified MongoDB Store)",
        latest_score=latest_asmt_doc.get("score") if latest_asmt_doc else None,
        latest_risk_band=latest_asmt_doc.get("risk_band") if latest_asmt_doc else None
    )

@router.get("/drivers/me/earnings", response_model=List[MonthlyRecordOut])
@router.get("/drivers/me/monthly-earnings", response_model=List[MonthlyRecordOut])
def get_driver_earnings(
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found")
        
    records_docs = list(monthly_features_col.find({"driver_id": profile_doc["id"]}).sort("month", ASCENDING))
    
    return [
        MonthlyRecordOut(
            id=r["id"],
            month=r["month"],
            gross_income=float(r.get("gross_income", 0.0)),
            platform_fee=float(r.get("platform_fee", 0.0)),
            other_costs=float(r.get("other_costs", 0.0)),
            net_income=float(r.get("net_income", 0.0)),
            living_expenses=float(r.get("living_expenses", 0.0)),
            total_expenses=float(r.get("total_expenses", 0.0)),
            savings=float(r.get("savings", 0.0)),
            active_days=int(r.get("active_days", 0)),
            trips=int(r.get("trips", 0)),
            completion_rate=float(r.get("completion_rate", 0.0)),
            cancellation_rate=float(r.get("cancellation_rate", 0.0)),
            avg_rating=float(r.get("avg_rating", 0.0)),
            peak_hour_share=float(r.get("peak_hour_share", 0.0)),
            weekend_share=float(r.get("weekend_share", 0.0))
        )
        for r in records_docs
    ]

@router.get("/drivers/me/performance")
def get_driver_performance(
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found")
        
    records_docs = list(monthly_features_col.find({"driver_id": profile_doc["id"]}).sort("month", ASCENDING))
    
    return {
        "monthly_breakdown": [
            {
                "month": r["month"],
                "trips": r.get("trips", 0),
                "active_days": r.get("active_days", 0),
                "completion_rate": r.get("completion_rate", 0.0),
                "cancellation_rate": r.get("cancellation_rate", 0.0),
                "rating": r.get("avg_rating", 0.0),
                "peak_share": r.get("peak_hour_share", 0.0),
                "weekend_share": r.get("weekend_share", 0.0)
            }
            for r in records_docs
        ]
    }

@router.post("/data/import")
async def import_driver_data(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found")
        
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        required_cols = ["month", "net_income", "active_days", "trips"]
        for col in required_cols:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Missing required CSV column: {col}")
                
        imported_count = 0
        for _, row in df.iterrows():
            rec_id = f"mf_imp_{uuid.uuid4().hex[:10]}"
            doc = {
                "id": rec_id,
                "driver_id": profile_doc["id"],
                "month": str(row["month"]),
                "gross_income": float(row.get("gross_income", row["net_income"] * 1.25)),
                "platform_fee": float(row.get("platform_fee", row["net_income"] * 0.20)),
                "other_costs": float(row.get("other_costs", row["net_income"] * 0.10)),
                "net_income": float(row["net_income"]),
                "active_days": int(row["active_days"]),
                "trips": int(row["trips"]),
                "completion_rate": float(row.get("completion_rate", 0.92)),
                "cancellation_rate": float(row.get("cancellation_rate", 0.05)),
                "avg_rating": float(row.get("avg_rating", 4.80)),
                "peak_hour_share": float(row.get("peak_hour_share", 0.45)),
                "weekend_share": float(row.get("weekend_share", 0.30))
            }
            monthly_features_col.update_one(
                {"driver_id": profile_doc["id"], "month": str(row["month"])},
                {"$set": doc},
                upsert=True
            )
            imported_count += 1
            
        AuditService.log_action(
            action="CSV_DATA_IMPORTED",
            entity_type="DRIVER_PROFILE",
            entity_id=profile_doc["id"],
            actor_id=current_user.id,
            actor_email=current_user.email,
            metadata={"records_imported": imported_count, "filename": file.filename}
        )
        return {"status": "success", "imported_records": imported_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

@router.post("/drivers/me/ingest")
def ingest_work_data(
    payload: Optional[IngestionRequest] = None,
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    file_name = (payload.file_name if payload and payload.file_name else None) or profile_doc.get("uploaded_file_name")
    if not file_name:
        raise HTTPException(status_code=400, detail="Earnings statement PDF is required. Please upload or attach a statement first.")

    ola_connected = payload.ola_connected if payload is not None else True
    uber_connected = payload.uber_connected if payload is not None else True
    file_url = (payload.file_url if payload and payload.file_url else None) or profile_doc.get("uploaded_file_url")

    if not ola_connected or not uber_connected:
        raise HTTPException(status_code=400, detail="Both Ola and Uber platform APIs must be connected.")

    from app.services.feature_service import FeatureService
    from app.services.assessment_service import AssessmentService

    try:
        records = FeatureService.ingest_driver_data(
            driver_id=profile_doc["id"],
            file_name=file_name,
            ola_connected=ola_connected,
            uber_connected=uber_connected,
            file_url=file_url
        )

        assessment = AssessmentService.evaluate_driver_preview(
            driver_id=profile_doc["id"],
            actor_id=current_user.id,
            actor_email=current_user.email
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process driver telemetry: {str(e)}")

    # Return full updated profile and assessment
    updated_profile = driver_profiles_col.find_one({"id": profile_doc["id"]})

    return {
        "status": "success",
        "message": "Work data and statement successfully ingested into MongoDB",
        "records_count": len(records),
        "file_url": updated_profile.get("uploaded_file_url"),
        "uploaded_file_url": updated_profile.get("uploaded_file_url"),
        "assessment": assessment.to_dict()
    }
