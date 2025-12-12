from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class DepositEvent(BaseModel):
    transaction_hash: str
    amount: float
    sender: str
    job_id: str

@router.post("/deposit")
async def handle_deposit(event: DepositEvent):
    """
    Webhook listener for when money is deposited on-chain.
    Could be called by Alchemy Notify or a custom off-chain listener script.
    """
    print(f"💰 Deposit received: {event.amount} ETH from {event.sender} for Job {event.job_id}")
    
    # In a real app:
    # 1. Update Job status to 'FUNDED' or 'PENDING'
    # 2. Send SMS to Worker via Twilio
    
    return {"received": True, "tx": event.transaction_hash}
