"""
FastAPI Main Application for GigScore using MongoDB.
Alternative Credit Risk Assessment for Gig-Economy Workers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager

import asyncio
import anyio.to_thread
from app.core.config import settings
from app.db.mongodb import init_mongo_indexes, ping_mongo
from app.routes import auth, consents, drivers, loans, assessments, lender, admin, audit, demo, keepalive, documents
from app.services.mongo_seeder import seed_mongo_database
from app.services.keepalive import keepalive_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Concurrency Optimization: Scale AnyIO threadpool for concurrent sync routes (50+ users)
    try:
        limiter = anyio.to_thread.current_default_thread_limiter()
        limiter.total_tokens = settings.THREAD_POOL_SIZE
        print(f"[*] AnyIO concurrency threadpool scaled to {settings.THREAD_POOL_SIZE} worker tokens.")
    except Exception as e:
        print(f"Notice: AnyIO threadpool configuration: {e}")

    # 2. Database verification & indexing
    try:
        ping_mongo()
        init_mongo_indexes()
        if getattr(settings, "SEED_DEMO_DATA", False):
            seed_mongo_database(force_reset=False)
            print("[*] Demo data seeded (SEED_DEMO_DATA=True).")
        print("Connected to MongoDB database:", settings.MONGODB_DB_NAME)
    except Exception as db_init_err:
        print(f"Warning: Database verification / indexing notice: {db_init_err}")

    # 3. Pre-warm ML & Biometric Models to avoid cold-start concurrency stampedes
    try:
        from app.services.assessment_service import AssessmentService
        AssessmentService.get_model()
        AssessmentService.get_explainer()
        print("[*] ML Assessment model & SHAP explainer pre-warmed into memory.")
    except Exception as e:
        print(f"Notice: ML model pre-warm: {e}")

    try:
        from app.services.face_recognition_service import FaceRecognitionService
        FaceRecognitionService._ensure_models_loaded()
        print("[*] Face Biometrics OpenCV models pre-warmed.")
    except Exception as e:
        print(f"Notice: Face model pre-warm: {e}")

    # Start keep-alive self-ping background bot to prevent Render sleep
    keepalive_service.start()

    # If UptimeRobot API key is configured, verify/create monitor asynchronously
    if settings.UPTIMEROBOT_API_KEY:
        asyncio.create_task(keepalive_service.create_or_verify_uptimerobot_monitor())

    yield
    # Shutdown
    keepalive_service.stop()

app = FastAPI(
    title="GigScore API",
    description="Explainable Alternative Credit Risk Assessment for Gig-Economy Workers (MongoDB)",
    version=settings.VERSION,
    lifespan=lifespan
)

# High-performance payload compression for concurrent clients
if settings.ENABLE_GZIP_COMPRESSION:
    app.add_middleware(GZipMiddleware, minimum_size=1024)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under /api
app.include_router(auth.router, prefix="/api")
app.include_router(consents.router, prefix="/api")
app.include_router(drivers.router, prefix="/api")
app.include_router(loans.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(lender.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(keepalive.router, prefix="/api")
app.include_router(documents.router, prefix="/api")

# Static uploads mount (deprecated in favor of Cloudinary CDN)
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
if UPLOAD_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/")
def root():
    return {
        "name": "GigScore API",
        "status": "operational",
        "database": "MongoDB",
        "version": settings.VERSION,
        "concurrency_profile": {
            "capacity_users": "50+ concurrent",
            "threadpool_limit": settings.THREAD_POOL_SIZE,
            "db_pool": f"{settings.MONGO_MIN_POOL_SIZE}-{settings.MONGO_MAX_POOL_SIZE} connections",
            "gzip_compression": settings.ENABLE_GZIP_COMPRESSION
        },
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "gigscore-backend",
        "database": "MongoDB",
        "concurrency_ready": True,
        "max_concurrent_capacity": 50
    }
