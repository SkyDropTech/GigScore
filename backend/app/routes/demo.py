"""
Demo support routes using MongoDB.
Enables instant persona switching, scenario demonstrations, and one-click database reset.
"""
from fastapi import APIRouter
from typing import List, Dict, Any

from app.db.mongodb import users_col, driver_profiles_col, assessments_col
from app.services.mongo_seeder import seed_mongo_database, DEMO_USERS
from app.core.security import create_access_token

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.get("/personas")
def get_demo_personas():
    """Returns all pre-seeded demo personas with ready-to-use login tokens for quick switching."""
    personas = []
    for u in DEMO_USERS:
        user_doc = users_col.find_one({"email": u["email"]})
        if not user_doc:
            continue
            
        token = create_access_token({"sub": user_doc["id"], "email": user_doc["email"], "role": user_doc["role"]})
        
        driver_meta = None
        if user_doc["role"] == "driver":
            driver_doc = driver_profiles_col.find_one({"user_id": user_doc["id"]})
            if driver_doc:
                asmt_doc = assessments_col.find_one(
                    {"driver_id": driver_doc["id"]},
                    sort=[("created_at", -1)]
                )
                driver_meta = {
                    "driver_id": driver_doc["id"],
                    "city": driver_doc.get("city", "Bengaluru"),
                    "platform": driver_doc.get("platform", "Ola & Uber"),
                    "vehicle_type": driver_doc.get("vehicle_type", "Sedan"),
                    "archetype": driver_doc.get("archetype", "stable_high"),
                    "tenure_months": driver_doc.get("tenure_months", 24),
                    "score": asmt_doc.get("score") if asmt_doc else None,
                    "risk_band": asmt_doc.get("risk_band") if asmt_doc else None,
                    "decision": asmt_doc.get("decision") if asmt_doc else None
                }

        personas.append({
            "user_id": user_doc["id"],
            "email": user_doc["email"],
            "full_name": user_doc["full_name"],
            "role": user_doc["role"],
            "token": token,
            "driver_meta": driver_meta
        })
    return personas

@router.post("/reset")
def reset_demo_database():
    """Resets the demo database and re-seeds fresh data and assessments into MongoDB."""
    seed_mongo_database(force_reset=True)
    return {"status": "success", "message": "Demo database successfully reset and seeded in MongoDB."}
