"""
Credit Assessment & Decisioning Engine service using MongoDB.
Loads production ML model, performs calibrated inference, SHAP factor attribution,
applies underwriting business policy rules, and persists audit logs to MongoDB.
"""
import os
import sys
import json
import uuid
import joblib
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple, Optional

# Add ml/src to sys.path (supports both repo root and backend-only deployments)
ML_SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "src"))
if not os.path.exists(ML_SRC_DIR):
    ML_SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml", "src"))
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

from features import MODEL_FEATURE_NAMES
from explain import CreditExplainer
from app.db.mongodb import assessments_col, loan_applications_col, driver_profiles_col
from app.models.mongo_models import Assessment, LoanApplication, DriverProfile
from app.services.feature_service import FeatureService
from app.services.audit_service import AuditService

class AssessmentService:
    _model = None
    _explainer = None
    _model_version = "xgb-v3.2-calibrated"

    @classmethod
    def get_model(cls):
        if cls._model is None:
            artifact_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts", "xgb_calibrated_model.joblib")
            )
            if not os.path.exists(artifact_path):
                # Fallback to ml/models
                artifact_path = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "xgb_calibrated_model.joblib")
                )
            if not os.path.exists(artifact_path):
                raise FileNotFoundError(f"Model artifact not found at {artifact_path}")
            cls._model = joblib.load(artifact_path)
        return cls._model

    @classmethod
    def get_explainer(cls):
        if cls._explainer is None:
            base_model_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts", "xgb_base_model.joblib")
            )
            if not os.path.exists(base_model_path):
                base_model_path = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "xgb_base_model.joblib")
                )
            cls._explainer = CreditExplainer(model_path=base_model_path)
        return cls._explainer

    @classmethod
    def evaluate_credit(
        cls,
        db: Any = None,
        application_id: str = "",
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None
    ) -> Assessment:
        app_doc = loan_applications_col.find_one({"id": application_id})
        if not app_doc:
            raise ValueError(f"Loan application '{application_id}' not found in MongoDB")
            
        app = LoanApplication(**app_doc)
        
        driver_doc = driver_profiles_col.find_one({"id": app.driver_id})
        if not driver_doc:
            raise ValueError(f"Driver profile '{app.driver_id}' not found in MongoDB")
            
        driver = DriverProfile(**driver_doc)
            
        # 1. Feature generation
        features = FeatureService.get_driver_features(
            driver_id=driver.id,
            requested_amount=app.requested_amount,
            requested_tenure_months=app.tenure_months
        )
        
        # 2. Model inference
        model = cls.get_model()
        vector = np.array([[features[col] for col in MODEL_FEATURE_NAMES]], dtype=np.float32)
        prob_default = float(model.predict_proba(vector)[0, 1])
        
        # 3. Credit Score Calculation (300 - 900 scale)
        raw_score = 900.0 - (prob_default * 600.0)
        score = int(round(max(300.0, min(900.0, raw_score))))
        
        # 4. Risk Band Classification
        if score >= 750:
            risk_band = "LOW"
        elif score >= 600:
            risk_band = "MEDIUM"
        else:
            risk_band = "HIGH"
            
        # 5. Affordability and Policy Decision Engine
        disposable_income = features.get("estimated_disposable_income", 15000.0)
        estimated_emi = features.get("estimated_emi", 2500.0)
        affordability_ratio = float(estimated_emi / max(1.0, disposable_income))
        
        if risk_band == "LOW":
            max_recommended_amount = min(300000.0, round(disposable_income * 6.0, -2))
            if affordability_ratio <= 0.35:
                decision = "ELIGIBLE"
            else:
                decision = "MANUAL_REVIEW"
        elif risk_band == "MEDIUM":
            max_recommended_amount = min(120000.0, round(disposable_income * 3.5, -2))
            if affordability_ratio <= 0.25:
                decision = "MANUAL_REVIEW"
            else:
                decision = "MANUAL_REVIEW"
        else:
            max_recommended_amount = min(35000.0, round(disposable_income * 1.0, -2))
            decision = "NOT_ELIGIBLE"

        # 6. SHAP Explainability Factors
        explainer = cls.get_explainer()
        explanation = explainer.explain_instance(features, top_k=5)
        
        # 7. Format Factors
        factors_list = []
        for factor in explanation["key_factors"]:
            factors_list.append({
                "id": f"fct_{uuid.uuid4().hex[:12]}",
                "feature_name": factor["feature_name"],
                "direction": factor["direction"],
                "contribution": round(factor["magnitude"], 4),
                "display_reason": factor["display_reason"]
            })

        # 8. Create Assessment Document
        assessment_id = f"asmt_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        assessment_doc = {
            "id": assessment_id,
            "application_id": app.id,
            "driver_id": driver.id,
            "model_version": cls._model_version,
            "score": score,
            "probability_of_default": round(prob_default, 4),
            "risk_band": risk_band,
            "decision": decision,
            "recommended_amount": max_recommended_amount,
            "recommended_emi": round(estimated_emi, 2),
            "affordability_ratio": round(affordability_ratio, 4),
            "feature_snapshot_json": json.dumps(features),
            "factors": factors_list,
            "created_at": now
        }
        assessments_col.insert_one(assessment_doc)
        
        # 9. Update loan application in MongoDB:
        # Keep status strictly PENDING so the Admin Underwriter checks at last to Approve or Deny
        loan_applications_col.update_one(
            {"id": app.id},
            {"$set": {"status": "PENDING", "updated_at": now}}
        )
        
        # 10. Audit Log in MongoDB
        AuditService.log_action(
            action="CREDIT_ASSESSMENT_GENERATED",
            entity_type="ASSESSMENT",
            entity_id=assessment_id,
            actor_id=actor_id,
            actor_email=actor_email,
            metadata={
                "score": score,
                "risk_band": risk_band,
                "decision": decision,
                "probability_of_default": prob_default,
                "model_version": cls._model_version
            }
        )
        
        return Assessment(**assessment_doc)

    @classmethod
    def evaluate_driver_preview(
        cls,
        driver_id: str,
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None
    ) -> Assessment:
        driver_doc = driver_profiles_col.find_one({"id": driver_id})
        if not driver_doc:
            raise ValueError(f"Driver profile '{driver_id}' not found")

        features = FeatureService.get_driver_features(
            driver_id=driver_id,
            requested_amount=50000.0,
            requested_tenure_months=12
        )

        model = cls.get_model()
        vector = np.array([[features[col] for col in MODEL_FEATURE_NAMES]], dtype=np.float32)
        prob_default = float(model.predict_proba(vector)[0, 1])

        raw_score = 900.0 - (prob_default * 600.0)
        score = int(round(max(300.0, min(900.0, raw_score))))

        if score >= 750:
            risk_band = "LOW"
        elif score >= 600:
            risk_band = "MEDIUM"
        else:
            risk_band = "HIGH"

        disposable_income = features.get("estimated_disposable_income", 15000.0)
        estimated_emi = features.get("estimated_emi", 2500.0)
        affordability_ratio = float(estimated_emi / max(1.0, disposable_income))

        if risk_band == "LOW":
            max_recommended_amount = min(300000.0, round(disposable_income * 6.0, -2))
            decision = "ELIGIBLE"
        elif risk_band == "MEDIUM":
            max_recommended_amount = min(120000.0, round(disposable_income * 3.5, -2))
            decision = "MANUAL_REVIEW"
        else:
            max_recommended_amount = min(35000.0, round(disposable_income * 1.0, -2))
            decision = "NOT_ELIGIBLE"

        explainer = cls.get_explainer()
        explanation = explainer.explain_instance(features, top_k=5)

        factors_list = []
        for factor in explanation["key_factors"]:
            factors_list.append({
                "id": f"fct_{uuid.uuid4().hex[:12]}",
                "feature_name": factor["feature_name"],
                "direction": factor["direction"],
                "contribution": round(factor["magnitude"], 4),
                "display_reason": factor["display_reason"]
            })

        assessment_id = f"asmt_prev_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        assessment_doc = {
            "id": assessment_id,
            "application_id": "PREVIEW",
            "driver_id": driver_id,
            "model_version": cls._model_version,
            "score": score,
            "probability_of_default": round(prob_default, 4),
            "risk_band": risk_band,
            "decision": decision,
            "recommended_amount": max_recommended_amount,
            "recommended_emi": round(estimated_emi, 2),
            "affordability_ratio": round(affordability_ratio, 4),
            "feature_snapshot_json": json.dumps(features),
            "factors": factors_list,
            "created_at": now
        }
        assessments_col.update_one(
            {"driver_id": driver_id, "application_id": "PREVIEW"},
            {"$set": assessment_doc},
            upsert=True
        )

        return Assessment(**assessment_doc)
