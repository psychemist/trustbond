from fastapi import FastAPI
from app.api import router as api_router
from app.core.config import settings

def get_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="SuretyDAO Backend - Risk Engine & Oracle",
    )
    
    application.include_router(api_router)
    
    return application

app = get_application()

@app.get("/")
async def root():
    return {"status": "ok", "service": "SuretyDAO Backend"}
