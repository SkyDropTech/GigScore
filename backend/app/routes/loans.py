"""
Loan application lifecycle endpoints using MongoDB.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pymongo import DESCENDING

from app.models.mongo_models import User, DriverProfile, LoanApplication, Assessment
from app.schemas.dto import LoanCreate, LoanOut, AssessmentOut, AssessmentFactorOut
from app.services.auth_service import get_current_user, require_roles
from app.services.loan_service import LoanService
from app.services.assessment_service import AssessmentService
from app.db.mongodb import (
    loan_applications_col,
    driver_profiles_col,
    users_col,
    assessments_col,
    monthly_features_col
)

router = APIRouter(prefix="/loans", tags=["Loans"])

def _format_assessment(assessment_doc: Optional[dict]) -> Optional[AssessmentOut]:
    if not assessment_doc:
        return None
    raw_factors = assessment_doc.get("factors", [])
    formatted_factors = []
    for f in raw_factors:
        formatted_factors.append(
            AssessmentFactorOut(
                feature_name=f.get("feature_name", ""),
                direction=f.get("direction", "positive"),
                contribution=float(f.get("contribution", 0.0)),
                display_reason=f.get("display_reason", "")
            )
        )
    return AssessmentOut(
        id=assessment_doc.get("id"),
        application_id=assessment_doc.get("application_id"),
        driver_id=assessment_doc.get("driver_id"),
        model_version=assessment_doc.get("model_version", "xgb-v3.2-calibrated"),
        score=assessment_doc.get("score", 700),
        probability_of_default=float(assessment_doc.get("probability_of_default", 0.05)),
        risk_band=assessment_doc.get("risk_band", "LOW"),
        decision=assessment_doc.get("decision", "ELIGIBLE"),
        recommended_amount=float(assessment_doc.get("recommended_amount", 100000.0)),
        recommended_emi=float(assessment_doc.get("recommended_emi", 2500.0)),
        affordability_ratio=float(assessment_doc.get("affordability_ratio", 0.2)),
        created_at=assessment_doc.get("created_at"),
        factors=formatted_factors
    )

@router.post("", response_model=LoanOut)
def create_loan_application(
    loan_in: LoanCreate,
    current_user: User = Depends(require_roles(["driver"]))
):
    profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
    if not profile_doc:
        raise HTTPException(status_code=400, detail="Only verified drivers can submit loan applications")
        
    # Check that driver has completed file upload AND connected both Ola and Uber APIs
    records_count = monthly_features_col.count_documents({"driver_id": profile_doc["id"]})
    if records_count == 0 or not profile_doc.get("uploaded_file_name") or not profile_doc.get("ola_connected") or not profile_doc.get("uber_connected"):
        raise HTTPException(
            status_code=400,
            detail="You cannot apply for a loan demand until you upload your earnings statement (PDF/CSV) and connect both Ola and Uber platform APIs."
        )

    application = LoanService.create_application(
        db=None,
        driver_id=profile_doc["id"],
        loan_in=loan_in,
        actor_id=current_user.id,
        actor_email=current_user.email
    )
    
    # Automatically execute live ML assessment in MongoDB
    assessment = None
    try:
        assessment = AssessmentService.evaluate_credit(
            application_id=application.id,
            actor_id=current_user.id,
            actor_email=current_user.email
        )
    except Exception as e:
        print(f"Notice: automatic ML assessment encountered: {e}")
        
    asmt_dict = assessment.to_dict() if assessment else None

    # Refetch app doc for updated status
    updated_app = loan_applications_col.find_one({"id": application.id}) or application.to_dict()

    return LoanOut(
        id=updated_app.get("id"),
        driver_id=updated_app.get("driver_id"),
        driver_name=current_user.full_name,
        driver_email=current_user.email,
        driver_phone=current_user.phone,
        driver_city=profile_doc.get("city", "Bengaluru"),
        driver_vehicle=profile_doc.get("vehicle_type", "Sedan"),
        driver_platform=profile_doc.get("platform", "Gig Platform"),
        requested_amount=float(updated_app.get("requested_amount")),
        tenure_months=int(updated_app.get("tenure_months")),
        purpose=updated_app.get("purpose", ""),
        status=updated_app.get("status", "PENDING"),
        uploaded_file_name=updated_app.get("uploaded_file_name"),
        uploaded_file_url=updated_app.get("uploaded_file_url") or profile_doc.get("uploaded_file_url"),
        reviewer_notes=updated_app.get("reviewer_notes"),
        reviewed_by=updated_app.get("reviewed_by"),
        reviewed_at=updated_app.get("reviewed_at"),
        created_at=updated_app.get("created_at"),
        latest_assessment=_format_assessment(asmt_dict)
    )

@router.get("", response_model=List[LoanOut])
def list_loans(
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["lender", "admin"]:
        app_docs = list(loan_applications_col.find().sort("created_at", DESCENDING))
    else:
        profile_doc = driver_profiles_col.find_one({"user_id": current_user.id})
        if not profile_doc:
            return []
        app_docs = list(loan_applications_col.find({"driver_id": profile_doc["id"]}).sort("created_at", DESCENDING))

    results = []
    for app in app_docs:
        driver = driver_profiles_col.find_one({"id": app.get("driver_id")})
        driver_user = users_col.find_one({"id": driver.get("user_id")}) if driver else None
        latest_asmt = assessments_col.find_one(
            {"application_id": app.get("id")},
            sort=[("created_at", -1)]
        )
        
        sanc_val = app.get("sanctioned_amount") or app.get("approved_amount")
        results.append(
            LoanOut(
                id=app.get("id"),
                driver_id=app.get("driver_id"),
                driver_name=driver_user.get("full_name") if driver_user else "Driver",
                driver_email=driver_user.get("email") if driver_user else None,
                driver_phone=driver_user.get("phone") if driver_user else None,
                driver_city=driver.get("city") if driver else None,
                driver_vehicle=driver.get("vehicle_type") if driver else None,
                driver_platform=driver.get("platform") if driver else "Gig Platform",
                requested_amount=float(app.get("requested_amount", 0)),
                sanctioned_amount=float(sanc_val) if sanc_val is not None else None,
                approved_amount=float(sanc_val) if sanc_val is not None else None,
                tenure_months=int(app.get("tenure_months", 12)),
                purpose=app.get("purpose", ""),
                status=app.get("status", "PENDING"),
                uploaded_file_name=app.get("uploaded_file_name") or (driver.get("uploaded_file_name") if driver else None),
                uploaded_file_url=app.get("uploaded_file_url") or (driver.get("uploaded_file_url") if driver else None),
                reviewer_notes=app.get("reviewer_notes"),
                reviewed_by=app.get("reviewed_by"),
                reviewed_at=app.get("reviewed_at"),
                created_at=app.get("created_at"),
                latest_assessment=_format_assessment(latest_asmt)
            )
        )
    return results

@router.get("/{loan_id}", response_model=LoanOut)
def get_loan(
    loan_id: str,
    current_user: User = Depends(get_current_user)
):
    app = loan_applications_col.find_one({"id": loan_id})
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found in MongoDB")
        
    driver = driver_profiles_col.find_one({"id": app.get("driver_id")})
    if current_user.role == "driver" and (not driver or driver.get("user_id") != current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden: Cannot view another driver's loan application")
        
    driver_user = users_col.find_one({"id": driver.get("user_id")}) if driver else None
    latest_asmt = assessments_col.find_one(
        {"application_id": app.get("id")},
        sort=[("created_at", -1)]
    )
    
    sanc_val = app.get("sanctioned_amount") or app.get("approved_amount")
    return LoanOut(
        id=app.get("id"),
        driver_id=app.get("driver_id"),
        driver_name=driver_user.get("full_name") if driver_user else "Driver",
        driver_email=driver_user.get("email") if driver_user else None,
        driver_phone=driver_user.get("phone") if driver_user else None,
        driver_city=driver.get("city") if driver else None,
        driver_vehicle=driver.get("vehicle_type") if driver else None,
        driver_platform=driver.get("platform") if driver else "Gig Platform",
        requested_amount=float(app.get("requested_amount", 0)),
        sanctioned_amount=float(sanc_val) if sanc_val is not None else None,
        approved_amount=float(sanc_val) if sanc_val is not None else None,
        tenure_months=int(app.get("tenure_months", 12)),
        purpose=app.get("purpose", ""),
        status=app.get("status", "PENDING"),
        uploaded_file_name=app.get("uploaded_file_name") or (driver.get("uploaded_file_name") if driver else None),
        uploaded_file_url=app.get("uploaded_file_url") or (driver.get("uploaded_file_url") if driver else None),
        reviewer_notes=app.get("reviewer_notes"),
        reviewed_by=app.get("reviewed_by"),
        reviewed_at=app.get("reviewed_at"),
        created_at=app.get("created_at"),
        latest_assessment=_format_assessment(latest_asmt)
    )

@router.post("/{loan_id}/assess", response_model=AssessmentOut)
def assess_loan(
    loan_id: str,
    current_user: User = Depends(get_current_user)
):
    assessment = AssessmentService.evaluate_credit(
        application_id=loan_id,
        actor_id=current_user.id,
        actor_email=current_user.email
    )
    formatted = _format_assessment(assessment.to_dict())
    if not formatted:
        raise HTTPException(status_code=500, detail="Failed to format assessment")
    return formatted
