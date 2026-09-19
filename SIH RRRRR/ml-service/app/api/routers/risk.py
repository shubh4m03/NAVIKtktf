"""
FastAPI router for Risk Engine (§11, §18).
Endpoints:
  POST /risk/score - Compute composite risk score with top drivers and SPLIT(p) mitigation
  GET  /risk/weights - Inspect default and preset risk weights
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.schemas.risk import RiskScoreRequest, RiskScoreResponse, RiskDriverResponse
from app.risk.risk_engine import (
    RiskInput,
    RiskWeightsConfig,
    DEFAULT_BALANCED_WEIGHTS,
    WEATHER_FOCUSED_WEIGHTS,
    MARKET_VOLATILITY_WEIGHTS,
    CONGESTION_FOCUSED_WEIGHTS,
    compute_risk_score,
)

router = APIRouter(prefix="/risk", tags=["Risk Engine"])


@router.post("/score", response_model=RiskScoreResponse)
async def score_risk(request: RiskScoreRequest):
    """
    Compute reproducible composite risk score (0-100) per §11.
    Outputs score, category (LOW/MED/HIGH), top-2 drivers with provenance,
    and a mitigation suggestion template parameterized by SPLIT(p).
    """
    weights_config = None
    if request.weights:
        try:
            weights_config = RiskWeightsConfig(
                w_vol=request.weights.w_vol,
                w_cong=request.weights.w_cong,
                w_wx=request.weights.w_wx,
                w_avail=request.weights.w_avail,
                w_shock=request.weights.w_shock,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    risk_input = RiskInput(
        volatility_sub_score=request.volatility_sub_score,
        forecast_relative_spread=request.forecast_relative_spread,
        congestion_sub_score=request.congestion_sub_score,
        port_waiting_days=request.port_waiting_days,
        weather_sub_score=request.weather_sub_score,
        destination_region=request.destination_region or "Bay of Bengal",
        laycan_month=request.laycan_month,
        availability_sub_score=request.availability_sub_score,
        freight_momentum_pct=request.freight_momentum_pct,
        shock_sub_score=request.shock_sub_score,
        commodity_shock_pct=request.commodity_shock_pct,
        split_pct=request.split_pct,
    )

    eval_result = compute_risk_score(risk_input, weights=weights_config)

    return RiskScoreResponse(
        cargo_request_id=request.cargo_request_id,
        risk_score=eval_result.risk_score,
        category=eval_result.category,
        weights_used=eval_result.weights_used,
        top_drivers=[
            RiskDriverResponse(**d.to_dict()) for d in eval_result.top_drivers
        ],
        all_drivers=[
            RiskDriverResponse(**d.to_dict()) for d in eval_result.all_drivers
        ],
        mitigation_suggestion=eval_result.mitigation_suggestion,
        split_pct_used=eval_result.split_pct_used,
    )


@router.get("/weights")
async def get_risk_weights():
    """Returns documentation and default/preset configuration weights."""
    return {
        "presets": {
            "default_balanced": {
                "w_vol": DEFAULT_BALANCED_WEIGHTS.w_vol,
                "w_cong": DEFAULT_BALANCED_WEIGHTS.w_cong,
                "w_wx": DEFAULT_BALANCED_WEIGHTS.w_wx,
                "w_avail": DEFAULT_BALANCED_WEIGHTS.w_avail,
                "w_shock": DEFAULT_BALANCED_WEIGHTS.w_shock,
            },
            "weather_focused": {
                "w_vol": WEATHER_FOCUSED_WEIGHTS.w_vol,
                "w_cong": WEATHER_FOCUSED_WEIGHTS.w_cong,
                "w_wx": WEATHER_FOCUSED_WEIGHTS.w_wx,
                "w_avail": WEATHER_FOCUSED_WEIGHTS.w_avail,
                "w_shock": WEATHER_FOCUSED_WEIGHTS.w_shock,
            },
            "market_volatility_focused": {
                "w_vol": MARKET_VOLATILITY_WEIGHTS.w_vol,
                "w_cong": MARKET_VOLATILITY_WEIGHTS.w_cong,
                "w_wx": MARKET_VOLATILITY_WEIGHTS.w_wx,
                "w_avail": MARKET_VOLATILITY_WEIGHTS.w_avail,
                "w_shock": MARKET_VOLATILITY_WEIGHTS.w_shock,
            },
            "congestion_focused": {
                "w_vol": CONGESTION_FOCUSED_WEIGHTS.w_vol,
                "w_cong": CONGESTION_FOCUSED_WEIGHTS.w_cong,
                "w_wx": CONGESTION_FOCUSED_WEIGHTS.w_wx,
                "w_avail": CONGESTION_FOCUSED_WEIGHTS.w_avail,
                "w_shock": CONGESTION_FOCUSED_WEIGHTS.w_shock,
            },
        }
    }
