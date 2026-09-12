"""
Pydantic V2 Schemas for request and response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth ---
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    role: str = "driver" # driver, lender, admin
    phone: Optional[str] = None
    city: Optional[str] = "Bengaluru"
    platform: Optional[str] = "Uber & Ola"
    vehicle_type: Optional[str] = "Sedan"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Driver & Earnings ---
class DriverProfileOut(BaseModel):
    id: str
    user_id: str
    city: str
    platform: str
    vehicle_type: str
    platform_start_date: str
    tenure_months: int
    kyc_status: str
    archetype: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    uploaded_file_name: Optional[str] = None
    uploaded_file_url: Optional[str] = None
    uploaded_file_size: Optional[str] = None
    ola_connected: Optional[bool] = False
    uber_connected: Optional[bool] = False
    ingested_at: Optional[datetime] = None
    parsed_statement_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class MonthlyRecordOut(BaseModel):
    id: str
    month: str
    gross_income: float
    platform_fee: float
    other_costs: float
    net_income: float
    living_expenses: Optional[float] = 0.0
    total_expenses: Optional[float] = 0.0
    savings: Optional[float] = 0.0
    active_days: int
    trips: int
    completion_rate: float
    cancellation_rate: float
    avg_rating: float
    peak_hour_share: float
    weekend_share: float

    class Config:
        from_attributes = True

class DriverSummaryMetrics(BaseModel):
    tenure_months: int
    avg_monthly_net_income: float
    income_volatility_cv: float
    last_month_net_income: float
    total_trips_12m: int
    avg_trips_per_month: int
    avg_active_days: float
    completion_rate: float
    cancellation_rate: float
    avg_rating: float
    consent_active: bool
    data_freshness: str
    latest_score: Optional[int] = None
    latest_risk_band: Optional[str] = None

# --- Consent ---
class ConsentCreate(BaseModel):
    purpose: str = "Gig-economy work and earnings data access for alternative credit assessment"
    scope: str = "rides,earnings,ratings,tenure"

class ConsentOut(BaseModel):
    id: str
    user_id: str
    purpose: str
    scope: str
    granted_at: datetime
    revoked_at: Optional[datetime] = None
    version: str
    is_active: bool

    class Config:
        from_attributes = True

# --- Assessment & Factors ---
class AssessmentFactorOut(BaseModel):
    feature_name: str
    direction: str # positive, negative
    contribution: float
    display_reason: str

class AssessmentOut(BaseModel):
    id: str
    application_id: str
    driver_id: str
    model_version: str
    score: int
    probability_of_default: float
    risk_band: str
    decision: str
    recommended_amount: float
    recommended_emi: float
    affordability_ratio: float
    created_at: datetime
    factors: List[AssessmentFactorOut] = []

    class Config:
        from_attributes = True

# --- Loan Application ---
class LoanCreate(BaseModel):
    requested_amount: float = Field(ge=5000, le=500000)
    tenure_months: int = Field(ge=3, le=36)
    purpose: str = "Vehicle Maintenance & Working Capital"

class LoanReviewRequest(BaseModel):
    action: Optional[str] = None
    decision: Optional[str] = None
    notes: str = Field(min_length=3)
    sanctioned_amount: Optional[float] = None
    approved_amount: Optional[float] = None
    tenure_months: Optional[int] = None

class LoanOut(BaseModel):
    id: str
    driver_id: str
    driver_name: Optional[str] = None
    driver_email: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_city: Optional[str] = None
    driver_vehicle: Optional[str] = None
    driver_platform: Optional[str] = None
    requested_amount: float
    sanctioned_amount: Optional[float] = None
    approved_amount: Optional[float] = None
    tenure_months: int
    purpose: str
    status: str
    uploaded_file_name: Optional[str] = None
    uploaded_file_url: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    latest_assessment: Optional[AssessmentOut] = None

    class Config:
        from_attributes = True

# --- Lender / Portfolio ---
class PortfolioMetrics(BaseModel):
    total_applications: int
    pending_review: int
    approved_count: int
    rejected_count: int
    total_exposure_approved: float
    average_score: float
    predicted_portfolio_default_rate: float
    approval_rate: float
    risk_band_breakdown: Dict[str, int]
    score_distribution: List[Dict[str, Any]]
    monthly_trend: List[Dict[str, Any]]

# --- Audit Log ---
class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    timestamp: datetime
    metadata_json: Optional[str] = None
    hash_signature: Optional[str] = None

    class Config:
        from_attributes = True

# --- Model Version / MLOps ---
class ModelVersionOut(BaseModel):
    id: str
    name: str
    version: str
    artifact_path: str
    active: bool
    created_at: datetime
    metrics: Dict[str, Any] = {}
