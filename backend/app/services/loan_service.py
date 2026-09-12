"""
Loan management and underwriting review service using MongoDB.
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

from app.db.mongodb import loan_applications_col, driver_profiles_col, users_col
from app.models.mongo_models import LoanApplication, User
from app.schemas.dto import LoanCreate, LoanReviewRequest
from app.services.audit_service import AuditService

class LoanService:
    @staticmethod
    def create_application(
        db: Any = None,
        driver_id: str = "",
        loan_in: LoanCreate = None,
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None
    ) -> LoanApplication:
        app_id = f"loan_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        
        driver_doc = driver_profiles_col.find_one({"id": driver_id}) or {}
        file_name = getattr(loan_in, "uploaded_file_name", None) or driver_doc.get("uploaded_file_name", "earnings_statement.pdf")
        file_url = getattr(loan_in, "uploaded_file_url", None) or driver_doc.get("uploaded_file_url")
        
        doc = {
            "id": app_id,
            "driver_id": driver_id,
            "requested_amount": loan_in.requested_amount,
            "tenure_months": loan_in.tenure_months,
            "purpose": loan_in.purpose,
            "status": "PENDING",
            "uploaded_file_name": file_name,
            "uploaded_file_url": file_url,
            "uploaded_file_size": driver_doc.get("uploaded_file_size", "3.4 MB"),
            "reviewer_notes": None,
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": now
        }
        loan_applications_col.insert_one(doc)
        
        AuditService.log_action(
            action="LOAN_APPLICATION_SUBMITTED",
            entity_type="LOAN_APPLICATION",
            entity_id=app_id,
            actor_id=actor_id,
            actor_email=actor_email,
            metadata={
                "requested_amount": loan_in.requested_amount,
                "tenure_months": loan_in.tenure_months,
                "purpose": loan_in.purpose,
                "uploaded_file_name": file_name,
                "uploaded_file_url": file_url
            }
        )
        return LoanApplication(**doc)

    @staticmethod
    def review_application(
        db: Any = None,
        application_id: str = "",
        review_in: LoanReviewRequest = None,
        reviewer: User = None
    ) -> LoanApplication:
        app_doc = loan_applications_col.find_one({"id": application_id})
        if not app_doc:
            raise HTTPException(status_code=404, detail="Loan application not found")
            
        action_map = {
            "APPROVE": "APPROVED",
            "REJECT": "REJECTED",
            "DENY": "REJECTED",
            "DENIED": "REJECTED",
            "REQUEST_INFO": "UNDER_REVIEW"
        }
        raw_action = (review_in.action or review_in.decision or "APPROVE").upper()
        target_status = action_map.get(raw_action)
        if not target_status:
            raise HTTPException(status_code=400, detail="Invalid action. Must be APPROVE, REJECT, DENY, or REQUEST_INFO")
            
        now = datetime.utcnow()
        sanctioned = review_in.sanctioned_amount if review_in.sanctioned_amount is not None else review_in.approved_amount
        update_set = {
            "status": target_status,
            "reviewer_notes": review_in.notes,
            "reviewed_by": reviewer.full_name,
            "reviewed_at": now
        }
        if sanctioned is not None:
            update_set["sanctioned_amount"] = float(sanctioned)
            update_set["approved_amount"] = float(sanctioned)
            app_doc["sanctioned_amount"] = float(sanctioned)
            app_doc["approved_amount"] = float(sanctioned)
        elif target_status == "APPROVED" and not app_doc.get("sanctioned_amount"):
            # If approved without specific override, sanctioned equals requested
            default_sanction = float(app_doc.get("requested_amount", 50000.0))
            update_set["sanctioned_amount"] = default_sanction
            update_set["approved_amount"] = default_sanction
            app_doc["sanctioned_amount"] = default_sanction
            app_doc["approved_amount"] = default_sanction

        if review_in.tenure_months is not None:
            update_set["tenure_months"] = int(review_in.tenure_months)
            app_doc["tenure_months"] = int(review_in.tenure_months)

        loan_applications_col.update_one(
            {"id": application_id},
            {"$set": update_set}
        )
        
        app_doc["status"] = target_status
        app_doc["reviewer_notes"] = review_in.notes
        app_doc["reviewed_by"] = reviewer.full_name
        app_doc["reviewed_at"] = now
        
        AuditService.log_action(
            action=f"LOAN_APPLICATION_{target_status}",
            entity_type="LOAN_APPLICATION",
            entity_id=application_id,
            actor_id=reviewer.id,
            actor_email=reviewer.email,
            metadata={
                "action": review_in.action,
                "notes": review_in.notes,
                "sanctioned_amount": app_doc.get("sanctioned_amount"),
                "reviewer_name": reviewer.full_name
            }
        )
        return LoanApplication(**app_doc)
