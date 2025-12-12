from fastapi import APIRouter
from app.api.endpoints import risk, jobs, webhooks

router = APIRouter()

router.include_router(risk.router, tags=["risk"], prefix="/risk")
router.include_router(jobs.router, tags=["jobs"], prefix="/jobs")
router.include_router(webhooks.router, tags=["webhooks"], prefix="/webhooks")
