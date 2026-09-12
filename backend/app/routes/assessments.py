"""
Assessment retrieval endpoints with SHAP explainability factors using MongoDB.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.mongo_models import User
from app.schemas.dto import AssessmentOut, AssessmentFactorOut
from app.services.auth_service import get_current_user
from app.db.mongodb import assessments_col, driver_profiles_col

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user)
):
    assessment_doc = assessments_col.find_one({"id": assessment_id})
    if not assessment_doc:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    driver_doc = driver_profiles_col.find_one({"id": assessment_doc.get("driver_id")})
    if current_user.role == "driver" and (not driver_doc or driver_doc.get("user_id") != current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden: Cannot view another driver's assessment")

    raw_factors = assessment_doc.get("factors", [])
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
