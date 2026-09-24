"""
Configuration settings for GigScore Backend.
Supports MongoDB connection via MONGODB_URL environment variable or .env file.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate .env file in backend directory
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=str(ENV_PATH),
        extra="ignore"
    )

    PROJECT_NAME: str = "GigScore"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "gigscore_super_secret_jwt_key_2026_production_grade"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL") or os.getenv("MONGO_URI") or "mongodb+srv://Skydrop:Skydrop123@booklibrary.gpib5sv.mongodb.net/focusdesk?retryWrites=true&w=majority&appName=BookLibrary"
    MONGO_URI: str = os.getenv("MONGO_URI") or os.getenv("MONGODB_URL") or "mongodb+srv://Skydrop:Skydrop123@booklibrary.gpib5sv.mongodb.net/focusdesk?retryWrites=true&w=majority&appName=BookLibrary"
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "focusdesk")

    # Cloudinary Storage settings
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25MB max upload size

    # Base server URL for uploads and static files
    BASE_SERVER_URL: str = os.getenv("BASE_SERVER_URL") or os.getenv("SERVER_URL") or os.getenv("RENDER_EXTERNAL_URL") or (
        "https://gigscore-backend-kpio.onrender.com" if (os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL")) else "http://localhost:8000"
    )

    # Keep-Alive & UptimeRobot Bot Settings
    UPTIMEROBOT_API_KEY: str = os.getenv("UPTIMEROBOT_API_KEY", "")
    ENABLE_SELF_PING: bool = os.getenv("ENABLE_SELF_PING", "true").lower() in ("1", "true", "yes")
    SELF_PING_INTERVAL_MINUTES: int = int(os.getenv("SELF_PING_INTERVAL_MINUTES", "10"))
    PING_ENDPOINT: str = os.getenv("PING_ENDPOINT", "")

    # Database Seeding (Strictly false in production to prevent fake demo data pollution)
    SEED_DEMO_DATA: bool = os.getenv("SEED_DEMO_DATA", "false").lower() in ("1", "true", "yes")

    # High Concurrency & Capacity Tuning (50+ Concurrent Users)
    THREAD_POOL_SIZE: int = int(os.getenv("THREAD_POOL_SIZE", "150"))
    MONGO_MIN_POOL_SIZE: int = int(os.getenv("MONGO_MIN_POOL_SIZE", "15"))
    MONGO_MAX_POOL_SIZE: int = int(os.getenv("MONGO_MAX_POOL_SIZE", "150"))
    ENABLE_GZIP_COMPRESSION: bool = os.getenv("ENABLE_GZIP_COMPRESSION", "true").lower() in ("1", "true", "yes")
    WORKERS_COUNT: int = int(os.getenv("WEB_CONCURRENCY", os.getenv("WORKERS_COUNT", "4")))

settings = Settings()
