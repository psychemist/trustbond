from fastapi import APIRouter, HTTPException
from app.services.risk_engine import risk_service
from app.core.supabase import supabase

router = APIRouter()

@router.get("/worker/{worker_address}")
async def get_worker_risk(worker_address: str):
    """
    Public Endpoint for Chainlink Functions.
    Returns a simple JSON with the score.
    """
    # Simply fetch the score from the service, which pulls from DB.
    # We could also trigger a recalculation here if we wanted real-time freshness.
    
    # Check if user exists first to be safe
    response = supabase.table("users").select("current_risk_score, total_jobs_completed").eq("wallet_address", worker_address).execute()
    
    if not response.data:
        # Return a neutral score for unknown workers?
        # Or 404. For Chainlink, a default JSON is safer than an error sometimes.
        return {
            "worker": worker_address,
            "score": 0,
            "jobs_completed": 0,
            "status": "unknown"
        }
        
    data = response.data[0]
    
    return {
        "worker": worker_address,
        "score": data["current_risk_score"],
        "jobs_completed": data["total_jobs_completed"],
        "status": "active"
    }

@router.post("/calculate/{worker_address}")
async def force_calculate_risk(worker_address: str):
    """
    Manual trigger to update risk score.
    """
    new_score = risk_service.update_worker_score(worker_address)
    return {"worker": worker_address, "new_score": new_score}
