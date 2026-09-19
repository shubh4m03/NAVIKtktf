from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers.risk import router as risk_router
from app.api.routers.forecast import router as forecast_router
from app.api.routers.optimization import router as optimization_router

app = FastAPI(
    title="Charter Intelligence ML Service",
    description="ML service for freight forecasting, optimization, and risk engine",
    version="0.1.0",
)

# CORS — allow the frontend and backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root routes
app.include_router(risk_router)
app.include_router(forecast_router)
app.include_router(optimization_router)

# Internal versioned routes (§16)
app.include_router(risk_router, prefix="/internal/v1")


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml-service"}


