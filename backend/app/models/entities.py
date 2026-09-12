"""
SQLAlchemy models matching the GigScore database ERD.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    full_name = Column(String(120), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="driver", index=True) # driver, lender, admin, ml_engineer
    status = Column(String(30), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    driver_profile = relationship("DriverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consents = relationship("Consent", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_id")

class DriverProfile(Base):
    __tablename__ = "driver_profiles"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), unique=True, nullable=False)
    city = Column(String(80), default="Bengaluru")
    platform = Column(String(80), default="Uber & Ola")
    vehicle_type = Column(String(50), default="Sedan")
    platform_start_date = Column(String(30), default="2023-01-15")
    tenure_months = Column(Integer, default=24)
    kyc_status = Column(String(30), default="VERIFIED") # PENDING, VERIFIED, REJECTED
    archetype = Column(String(50), default="stable_high")
    
    user = relationship("User", back_populates="driver_profile")
    monthly_records = relationship("MonthlyFeatures", back_populates="driver", cascade="all, delete-orphan")
    loan_applications = relationship("LoanApplication", back_populates="driver", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="driver", cascade="all, delete-orphan")

class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    purpose = Column(String(255), default="Gig-economy work and earnings data access for alternative credit assessment")
    scope = Column(String(255), default="rides,earnings,ratings,tenure")
    granted_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    version = Column(String(20), default="v1.0")
    
    user = relationship("User", back_populates="consents")

class MonthlyFeatures(Base):
    __tablename__ = "monthly_features"
    
    id = Column(String(64), primary_key=True, index=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id"), nullable=False)
    month = Column(String(20), index=True, nullable=False) # e.g. 2026-07
    gross_income = Column(Float, default=0.0)
    platform_fee = Column(Float, default=0.0)
    other_costs = Column(Float, default=0.0)
    net_income = Column(Float, default=0.0)
    active_days = Column(Integer, default=0)
    trips = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    cancellation_rate = Column(Float, default=0.0)
    avg_rating = Column(Float, default=0.0)
    peak_hour_share = Column(Float, default=0.0)
    weekend_share = Column(Float, default=0.0)
    
    driver = relationship("DriverProfile", back_populates="monthly_records")

class LoanApplication(Base):
    __tablename__ = "loan_applications"
    
    id = Column(String(64), primary_key=True, index=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id"), nullable=False)
    requested_amount = Column(Float, nullable=False)
    tenure_months = Column(Integer, nullable=False)
    purpose = Column(String(120), default="Vehicle Maintenance & Working Capital")
    status = Column(String(30), default="SUBMITTED", index=True) # SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, DISBURSED
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(64), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    driver = relationship("DriverProfile", back_populates="loan_applications")
    assessments = relationship("Assessment", back_populates="application", cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String(64), primary_key=True, index=True)
    application_id = Column(String(64), ForeignKey("loan_applications.id"), nullable=False)
    driver_id = Column(String(64), nullable=False)
    model_version = Column(String(50), default="xgb-v3.2-calibrated")
    score = Column(Integer, nullable=False) # 300 - 900
    probability_of_default = Column(Float, nullable=False)
    risk_band = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH
    decision = Column(String(30), nullable=False) # ELIGIBLE, MANUAL_REVIEW, NOT_ELIGIBLE
    recommended_amount = Column(Float, default=0.0)
    recommended_emi = Column(Float, default=0.0)
    affordability_ratio = Column(Float, default=0.0)
    feature_snapshot_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    application = relationship("LoanApplication", back_populates="assessments")
    factors = relationship("AssessmentFactor", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentFactor(Base):
    __tablename__ = "assessment_factors"
    
    id = Column(String(64), primary_key=True, index=True)
    assessment_id = Column(String(64), ForeignKey("assessments.id"), nullable=False)
    feature_name = Column(String(80), nullable=False)
    direction = Column(String(20), nullable=False) # positive, negative
    contribution = Column(Float, default=0.0)
    display_reason = Column(String(255), nullable=False)
    
    assessment = relationship("Assessment", back_populates="factors")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(64), primary_key=True, index=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id"), nullable=False)
    doc_type = Column(String(50), default="DRIVING_LICENSE") # DRIVING_LICENSE, RC_BOOK, VEHICLE_INSURANCE, PLATFORM_STATEMENT
    filename = Column(String(120), nullable=False)
    verification_status = Column(String(30), default="VERIFIED") # PENDING, VERIFIED, REJECTED
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    driver = relationship("DriverProfile", back_populates="documents")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(64), primary_key=True, index=True)
    actor_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    actor_email = Column(String(120), nullable=True)
    action = Column(String(80), nullable=False, index=True) # e.g. CONSENT_GRANTED, MODEL_INFERENCE, LOAN_DECISION
    entity_type = Column(String(50), nullable=False) # e.g. LOAN_APPLICATION, ASSESSMENT, USER
    entity_id = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    metadata_json = Column(Text, nullable=True)
    
    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_id])

class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(80), default="XGBoost Gig Worker Risk Classifier")
    version = Column(String(50), unique=True, nullable=False)
    artifact_path = Column(String(255), nullable=False)
    metrics_json = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
