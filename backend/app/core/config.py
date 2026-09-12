"""
Configuration settings for GigScore Backend.
Supports MongoDB connection via MONGODB_URL environment variable or .env file.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Locate .env file in backend directory
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
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

    class Config:
        case_sensitive = True
        env_file = str(ENV_PATH)
        extra = "ignore"

settings = Settings()
