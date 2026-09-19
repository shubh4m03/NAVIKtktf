"""
Pydantic schemas for Risk Engine API (§11, §18).
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class RiskWeightsPayload(BaseModel):
    w_vol: float = Field(0.25, ge=0.0, description="Forecast volatility weight")
    w_cong: float = Field(0.25, ge=0.0, description="Port congestion weight")
    w_wx: float = Field(0.20, ge=0.0, description="Weather / cyclone risk weight")
    w_avail: float = Field(0.15, ge=0.0, description="Vessel availability tightness weight")
    w_shock: float = Field(0.15, ge=0.0, description="Commodity price shock weight")


class RiskScoreRequest(BaseModel):
    cargo_request_id: Optional[int] = Field(None, description="Optional cargo request ID")
    
    # Direct sub-scores [0.0, 1.0]
    volatility_sub_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    congestion_sub_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    weather_sub_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    availability_sub_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    shock_sub_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    # Or raw domain inputs
    forecast_relative_spread: Optional[float] = Field(None, ge=0.0)
    port_waiting_days: Optional[float] = Field(None, ge=0.0)
    destination_region: Optional[str] = Field("Bay of Bengal")
    laycan_month: Optional[int] = Field(None, ge=1, le=12)
    freight_momentum_pct: Optional[float] = None
    commodity_shock_pct: Optional[float] = None
    
    # SPLIT(p) linkage
    split_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Split optimizer p* as percentage (0-100)")
    
    # Custom weights override
    weights: Optional[RiskWeightsPayload] = None


class RiskDriverResponse(BaseModel):
    factor: str
    display_name: str
    sub_score: float
    weight: float
    weighted_contribution: float
    direction: str
    provenance: str
    source: str
    detail: str


class RiskScoreResponse(BaseModel):
    cargo_request_id: Optional[int] = None
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Composite risk score (0-100)")
    category: str = Field(..., description="LOW, MEDIUM, or HIGH")
    weights_used: Dict[str, float]
    top_drivers: List[RiskDriverResponse]
    all_drivers: List[RiskDriverResponse]
    mitigation_suggestion: str
    split_pct_used: Optional[float] = None
