"""
FastAPI Main Application for GigScore using MongoDB.
Alternative Credit Risk Assessment for Gig-Economy Workers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.mongodb import init_mongo_indexes, ping_mongo
from app.routes import auth, consents, drivers, loans, assessments, lender, admin, audit, demo
from app.services.mongo_seeder import seed_mongo_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify MongoDB connection & initialize indexes
    ping_mongo()
    init_mongo_indexes()
    try:
        seed_mongo_database(force_reset=False)
    except Exception as e:
        print(f"Warning: Demo seeder notice: {e}")
    print("Connected to MongoDB database:", settings.MONGODB_DB_NAME)
    yield
    # Shutdown

app = FastAPI(
    title="GigScore API",
    description="Explainable Alternative Credit Risk Assessment for Gig-Economy Workers (MongoDB)",
    version=settings.VERSION,
    lifespan=lifespan
)

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

# Mount permanent uploads directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/")
def root():
    return {
        "name": "GigScore API",
        "status": "operational",
        "database": "MongoDB",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "gigscore-backend",
        "database": "MongoDB"
    }
