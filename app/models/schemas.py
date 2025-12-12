from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    WORKER = "WORKER"
    EMPLOYER = "EMPLOYER"
    ADMIN = "ADMIN"

class JobStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"

# User Schemas
class UserCreate(BaseModel):
    wallet_address: str
    role: UserRole
    phone_number: Optional[str] = None
    email: Optional[str] = None

class UserResponse(BaseModel):
    wallet_address: str
    role: UserRole
    current_risk_score: int
    total_jobs_completed: int

# Job Schemas
class JobCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount_eth: float
    employer_address: str
    escrow_contract_address: Optional[str] = None

class JobComplete(BaseModel):
    worker_address: str
    end_location_lat: float
    end_location_lng: float

class JobResponse(BaseModel):
    id: str
    title: str
    amount_eth: float
    status: JobStatus
    employer_address: str
    worker_address: Optional[str]
    created_at: datetime
