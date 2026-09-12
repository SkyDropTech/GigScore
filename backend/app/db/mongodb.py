"""
MongoDB Connection and Database Access for GigScore.
Uses PyMongo for synchronous operations with thread-safe client pooling.
"""
from pymongo import MongoClient, ASCENDING, DESCENDING
from app.core.config import settings

# Initialize PyMongo Client
client = MongoClient(
    settings.MONGODB_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
)

# Target Database
try:
    db = client.get_default_database()
    if db is None:
        db = client[settings.MONGODB_DB_NAME]
except Exception:
    db = client[settings.MONGODB_DB_NAME]


# Collections
users_col = db["users"]
driver_profiles_col = db["driver_profiles"]
monthly_features_col = db["monthly_features"]
loan_applications_col = db["loan_applications"]
assessments_col = db["assessments"]
consents_col = db["consents"]
audit_logs_col = db["audit_logs"]

def init_mongo_indexes():
    """Initializes necessary indexes on MongoDB collections."""
    try:
        # Users indexes
        users_col.create_index([("email", ASCENDING)], unique=True)
        users_col.create_index([("role", ASCENDING)])
        
        # Driver profiles indexes
        driver_profiles_col.create_index([("user_id", ASCENDING)], unique=True)
        driver_profiles_col.create_index([("id", ASCENDING)], unique=True)
        
        # Monthly features indexes
        monthly_features_col.create_index([("driver_id", ASCENDING), ("month", ASCENDING)])
        
        # Loan applications indexes
        loan_applications_col.create_index([("id", ASCENDING)], unique=True)
        loan_applications_col.create_index([("driver_id", ASCENDING)])
        loan_applications_col.create_index([("status", ASCENDING)])
        loan_applications_col.create_index([("created_at", DESCENDING)])
        
        # Assessments indexes
        assessments_col.create_index([("id", ASCENDING)], unique=True)
        assessments_col.create_index([("application_id", ASCENDING)])
        assessments_col.create_index([("driver_id", ASCENDING)])
        
        # Consents indexes
        consents_col.create_index([("user_id", ASCENDING)])
        
        # Audit logs indexes
        audit_logs_col.create_index([("timestamp", DESCENDING)])
        print("MongoDB indexes initialized successfully.")
    except Exception as e:
        print(f"Warning: Failed to initialize MongoDB indexes: {e}")

def ping_mongo():
    """Pings MongoDB to verify connection."""
    client.admin.command('ping')
    return True

def get_mongo_db():
    """Dependency helper returning the current MongoDB database."""
    return db
