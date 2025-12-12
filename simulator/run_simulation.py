import requests
import time
import random
import os
import sys

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase import supabase

BASE_URL = "http://localhost:8000"

def simulate_job_flow():
    print("🚀 Starting SuretyDAO Simulation...")
    
    # 1. Setup Data
    employer_addr = f"0xEmployer{random.randint(1000, 9999)}"
    worker_addr = f"0xWorker{random.randint(1000, 9999)}"
    
    print(f"👨‍💼 Employer: {employer_addr}")
    print(f"👷 Worker:   {worker_addr}")

    # 1.5 Seed Users in DB (To avoid Foreign Key errors)
    print("\n[0] Seeding Fake Users in DB...")
    try:
        # Create Employer
        supabase.table("users").upsert({
            "wallet_address": employer_addr,
            "role": "EMPLOYER",
            "email": "employer@demo.com"
        }).execute()
        
        # Create Worker
        supabase.table("users").upsert({
            "wallet_address": worker_addr,
            "role": "WORKER",
            "current_risk_score": 0,
            "total_jobs_completed": 0
        }).execute()
        print("✅ Users Seeded.")
    except Exception as e:
        print(f"❌ Failed to seed users: {e}")
        print("⚠️  Ensure you ran schema.sql in Supabase!")
        return

    # 2. Create Job
    print("\n[1] Creating Job...")
    job_payload = {
        "title": "Deliver Package to Lagos Island",
        "amount_eth": 0.05,
        "employer_address": employer_addr
    }
    
    try:
        res = requests.post(f"{BASE_URL}/jobs/", json=job_payload)
        if res.status_code != 200:
            print(f"❌ Failed to create job: {res.text}")
            return
            
        job_data = res.json()
        job_id = job_data["id"]
        print(f"✅ Job Created! ID: {job_id}")
    except Exception as e:
        print(f"❌ Error connecting to API: {e}")
        print("💡 Is the server running? (uvicorn app.main:app --reload)")
        return

    # 3. Start Job
    print("\n[2] Worker Starting Job...")
    time.sleep(1)
    res = requests.post(f"{BASE_URL}/jobs/{job_id}/start?worker_address={worker_addr}")
    if res.status_code == 200:
        print("✅ Job Started.")
    else:
        print(f"❌ Failed to start job: {res.text}")
        return

    # 4. Simulate Work
    print("\n[3] 🚚 Work in Progress (Simulating 2 seconds)...")
    time.sleep(2)
    
    # 5. Complete Job (Oracle Trigger)
    print("\n[4] Job Done. Verifying Location...")
    complete_payload = {
        "worker_address": worker_addr,
        "end_location_lat": 6.4541, # Lagos Coords
        "end_location_lng": 3.3947
    }
    
    res = requests.post(f"{BASE_URL}/jobs/{job_id}/complete", json=complete_payload)
    if res.status_code == 200:
        data = res.json()
        print("✅ Job Verified & Completed!")
        print(f"📈 New Worker Score: {data.get('new_worker_score')}")
    else:
        print(f"❌ Failed to complete job: {res.text}")

    # 6. Check Chainlink Oracle Endpoint
    print("\n[5] Checking Chainlink Oracle Data...")
    res = requests.get(f"{BASE_URL}/risk/worker/{worker_addr}")
    print(f"🔮 Oracle Response: {res.json()}")

if __name__ == "__main__":
    simulate_job_flow()
