from app.core.supabase import supabase

class RiskService:
    def __init__(self):
        self.db = supabase

    def calculate_score(self, worker_address: str) -> int:
        """
        Calculates the risk score based on the worker's history.
        Formula: Score = PreviousJobs * 10 (Capped at 100).
        """
        # Fetch worker stats
        response = self.db.table("users").select("total_jobs_completed").eq("wallet_address", worker_address).execute()
        
        if not response.data:
            return 0 # User not found or new
            
        data = response.data[0]
        jobs_completed = data.get("total_jobs_completed", 0)
        
        # Simple Risk Algorithm
        score = min(100, jobs_completed * 10)
        
        return score

    def update_worker_score(self, worker_address: str):
        """
        Recalculates and updates the score in the database.
        """
        new_score = self.calculate_score(worker_address)
        
        self.db.table("users").update({"current_risk_score": new_score}).eq("wallet_address", worker_address).execute()
        return new_score

risk_service = RiskService()
