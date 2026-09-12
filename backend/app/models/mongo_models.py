"""
MongoDB Data Models and Entity Wrappers for GigScore.
Provides pythonic object access to MongoDB documents.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any

class MongoEntity:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            if k != "_id":
                setattr(self, k, v)

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

class User(MongoEntity):
    id: str
    email: str
    phone: Optional[str] = None
    full_name: str
    password_hash: str
    role: str # "driver" | "admin"
    status: str = "ACTIVE"
    created_at: datetime

class DriverProfile(MongoEntity):
    id: str
    user_id: str
    city: str = "Bengaluru"
    platform: str = "Ola & Uber"
    vehicle_type: str = "Sedan (Dzire)"
    platform_start_date: str = "2024-01-01"
    tenure_months: int = 18
    kyc_status: str = "VERIFIED"
    archetype: str = "custom"
    uploaded_file_name: Optional[str] = None
    uploaded_file_url: Optional[str] = None
    uploaded_file_size: Optional[str] = None
    ola_connected: bool = False
    uber_connected: bool = False
    ingested_at: Optional[datetime] = None
    created_at: datetime

class MonthlyFeatures(MongoEntity):
    id: str
    driver_id: str
    month: str
    gross_income: float
    platform_fee: float
    other_costs: float
    net_income: float
    active_days: int
    trips: int
    completion_rate: float
    cancellation_rate: float
    avg_rating: float
    peak_hour_share: float
    weekend_share: float

class LoanApplication(MongoEntity):
    id: str
    driver_id: str
    requested_amount: float
    sanctioned_amount: Optional[float] = None
    approved_amount: Optional[float] = None
    tenure_months: int
    purpose: str
    status: str = "PENDING" # PENDING, APPROVED, REJECTED, DISBURSED
    uploaded_file_name: Optional[str] = None
    uploaded_file_url: Optional[str] = None
    uploaded_file_size: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

class AssessmentFactor(MongoEntity):
    feature_name: str
    direction: str # positive, negative
    contribution: float
    display_reason: str

class Assessment(MongoEntity):
    id: str
    application_id: str
    driver_id: str
    model_version: str = "GradientBoost_v28_prod"
    score: int
    probability_of_default: float
    risk_band: str # LOW, MEDIUM, HIGH
    decision: str # ELIGIBLE, MANUAL_REVIEW, NOT_ELIGIBLE
    recommended_amount: float
    recommended_emi: float
    affordability_ratio: float
    feature_snapshot_json: Optional[str] = None
    created_at: datetime
    factors: List[Dict[str, Any]] = []

class Consent(MongoEntity):
    id: str
    user_id: str
    purpose: str
    scope: str
    is_active: bool = True
    granted_at: datetime
    revoked_at: Optional[datetime] = None
    version: str = "v1.0"

class AuditLog(MongoEntity):
    id: str
    action: str
    entity_type: str
    entity_id: str
    actor_id: str
    actor_email: str
    metadata: Dict[str, Any] = {}
    timestamp: datetime
    hash_signature: str
