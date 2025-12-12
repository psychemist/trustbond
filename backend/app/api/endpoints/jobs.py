from fastapi import APIRouter, HTTPException
from app.core.supabase import supabase
from app.models.schemas import JobCreate, JobResponse, JobStatus, JobComplete
from app.services.risk_engine import risk_service
import uuid

router = APIRouter()

@router.post("/", response_model=JobResponse)
async def create_job(job: JobCreate):
    """
    Create a new job. 
    Usually called by the frontend or after an on-chain deposit event.
    """
    # 1. Ensure Employer exists (simple check/create if needed, omitting for brevity)
    
    # 2. Insert Job
    job_data = job.dict()
    job_data["status"] = JobStatus.PENDING
    
    # Note: Supabase insert returns the inserted data
    response = supabase.table("jobs").insert(job_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create job")
        
    return response.data[0]

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    response = supabase.table("jobs").select("*").eq("id", job_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return response.data[0]

@router.post("/{job_id}/start")
async def start_job(job_id: str, worker_address: str):
    """
    Worker accepts/starts the job.
    """
    # Update Job
    update_data = {
        "status": JobStatus.IN_PROGRESS,
        "worker_address": worker_address,
        "start_location_lat": 0.0, # Placeholder for real GPS
        "start_location_lng": 0.0
    }
    
    response = supabase.table("jobs").update(update_data).eq("id", job_id).execute()
    return response.data

@router.post("/{job_id}/complete")
async def complete_job(job_id: str, completion_data: JobComplete):
    """
    The 'Oracle' Endpoint.
    1. Verifies the job completion (GPS check mock).
    2. Updates status to VERIFIED.
    3. Updates Worker's Risk Score.
    """
    # 1. Fetch current job
    job_res = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job_res.data:
         raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_res.data[0]
    
    if job["status"] != JobStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Job must be IN_PROGRESS to complete")

    # 2. "Verify" location (Mock logic: assume always valid for Hackathon)
    # In a real app, calculate distance between start/end or check geofence.
    
    # 3. Update Job Status
    update_data = {
        "status": JobStatus.VERIFIED, # Ready for payout
        "end_location_lat": completion_data.end_location_lat,
        "end_location_lng": completion_data.end_location_lng
    }
    supabase.table("jobs").update(update_data).eq("id", job_id).execute()
    
    # 4. Increment Worker Job Count & Score
    # Fetch worker
    worker_res = supabase.table("users").select("total_jobs_completed").eq("wallet_address", completion_data.worker_address).execute()
    
    if worker_res.data:
        current_jobs = worker_res.data[0]["total_jobs_completed"]
        new_total = current_jobs + 1
        
        # Update Count
        supabase.table("users").update({"total_jobs_completed": new_total}).eq("wallet_address", completion_data.worker_address).execute()
        
        # Update Score using Risk Engine
        new_score = risk_service.update_worker_score(completion_data.worker_address)
        
        return {
            "status": "success", 
            "message": "Job verified", 
            "new_worker_score": new_score
        }
    
    return {"status": "success", "message": "Job verified, but worker stats update failed"}
