"""
MongoDB Connection and Database Access for GigScore.
Uses PyMongo for synchronous operations with thread-safe client pooling.
"""
from pymongo import MongoClient, ASCENDING, DESCENDING
from app.core.config import settings

# Initialize PyMongo Client with tuned connection pooling and local fallback
def _init_client():
    primary_url = settings.MONGODB_URL
    try:
        c = MongoClient(
            primary_url,
            minPoolSize=settings.MONGO_MIN_POOL_SIZE,
            maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
            maxIdleTimeMS=60000,
            waitQueueTimeoutMS=3000,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
        )
        c.admin.command('ping')
        return c
    except Exception as e:
        print(f"[WARN] Primary MongoDB connection failed ({e}). Falling back to local MongoDB at mongodb://127.0.0.1:27017/gigscore")
        try:
            local_c = MongoClient(
                "mongodb://127.0.0.1:27017",
                minPoolSize=settings.MONGO_MIN_POOL_SIZE,
                maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
                maxIdleTimeMS=60000,
                waitQueueTimeoutMS=2000,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000,
            )
            local_c.admin.command('ping')
            return local_c
        except Exception as local_e:
            print(f"[ERROR] Local MongoDB fallback also failed: {local_e}. Re-raising primary exception.")
            raise e

client = _init_client()

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
user_files_col = db["user_files"]

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

        # User files (Cloudinary metadata) indexes
        user_files_col.create_index([("user_id", ASCENDING), ("file_id", ASCENDING)])
        user_files_col.create_index([("file_id", ASCENDING)], unique=True)
        user_files_col.create_index([("cloudinary_public_id", ASCENDING)])
        user_files_col.create_index([("created_at", DESCENDING)])
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
