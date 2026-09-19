"""
Pydantic schemas for internal FastAPI endpoints (§16, §18).
Used for Spring Boot <-> FastAPI boundary communication.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


# 1. Forecast Schemas (§16.1)
class ForecastRequest(BaseModel):
    origin_region: str = Field(..., description="Origin region, e.g. AUSTRALIA_NEWCASTLE")
    destination_port: str = Field(..., description="Destination port code/name, e.g. DHAMRA or PARADIP")
    vessel_class: str = Field(..., description="Vessel class, e.g. PANAMAX, CAPESIZE")
    horizon_days: int = Field(30, ge=1, le=180, description="Forecast horizon in days")
    as_of_date: Optional[str] = Field(None, description="ISO date YYYY-MM-DD")


class ForecastResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    expected_value_usd_per_ton: float
    interval_50: List[float]
    interval_90: List[float]
    prob_increase_gt_8pct: float
    confidence_score: float
    model_used: str
    data_provenance: Dict[str, str]
    generated_at: str



# 2. Vessel Ranking Schemas (§8)
class VesselCandidateItem(BaseModel):
    vessel_class_id: Optional[int] = None
    vessel_class_name: str
    draft_m: float
    loa_m: float
    beam_m: float
    dwt: float
    estimated_landed_cost: float
    expected_delay_days: float
    availability_score: float = 70.0
    risk_penalty: float = 15.0


class VesselRankRequest(BaseModel):
    port_id: Optional[int] = None
    max_draft_m: float
    max_loa_m: Optional[float] = None
    max_beam_m: Optional[float] = None
    cargo_quantity_mt: float
    candidates: List[VesselCandidateItem]
    weights_preset: Optional[str] = "DEFAULT_BALANCED"


class VesselCandidateOutput(BaseModel):
    vessel_class_id: Optional[int] = None
    vessel_class_name: str
    score: float
    rank: int
    feasible: bool
    infeasibility_reason: Optional[str] = None
    estimated_landed_cost: float
    expected_delay_days: float


class VesselRankResponse(BaseModel):
    rankings: List[VesselCandidateOutput]


# 3. Entry Timing Schemas (§7)
class EntryTimingRequest(BaseModel):
    cargo_quantity_mt: float
    current_spot_rate: float
    forecast_expected_rate: float
    forecast_spread: float
    deadline_days: float
    transit_days: float = 14.0
    port_queue_days: float = 3.5
    wait_days: float = 7.0
    risk_aversion_lambda: float = 0.5


class EntryTimingResponse(BaseModel):
    recommended_action: str
    split_pct: float
    optimal_p: float
    etlc_now: float
    etlc_wait: float
    optimal_etlc: float
    is_wait_feasible: bool
    time_buffer_days: float
    rationale: Dict[str, Any]


# 4. Idle-Time & Repositioning Schemas (§10 / Task 18)
class OpportunityLaneItem(BaseModel):
    lane_id: str
    destination_region: str
    destination_ports: str
    target_commodity: str
    ballast_distance_nm: float
    ballast_transit_days: float
    est_repositioning_cost_usd: float
    demand_seasonality_score: float
    demand_seasonality_label: str
    trade_pattern_notes: str
    provenance: Dict[str, str]


class IdleRepositioningRequest(BaseModel):
    discharge_port_id: int
    discharge_port_name: str
    vessel_class_id: int
    vessel_class_name: str
    cargo_tonnage: float
    estimated_arrival_date: str
    avg_turnaround_days: Optional[float] = 3.5
    handling_rate_tph: Optional[float] = 2500.0
    congestion_ratio: Optional[float] = 1.0


class IdleRepositioningResponse(BaseModel):
    discharge_port_id: int
    discharge_port_name: str
    vessel_class_id: int
    vessel_class_name: str
    cargo_tonnage: float
    estimated_arrival_date: str
    turnaround_days: float
    handling_days: float
    queue_days: float
    available_date: str
    opportunity_lanes: List[OpportunityLaneItem]
    disclaimer: str
    data_provenance: Dict[str, str]


# 5. Charter Portfolio Strategy Schemas (§13 / Task 19)
class PortfolioOptimizeRequest(BaseModel):
    """Input for mean-variance portfolio optimisation (§13)."""
    expected_rate_usd_per_mt: float = Field(..., description="E[Freight rate] in USD/MT from Task 7 forecast")
    q_05: float = Field(..., description="5th percentile of forecast distribution")
    q_95: float = Field(..., description="95th percentile of forecast distribution")
    tonnage_mt: float = Field(..., gt=0, description="Cargo quantity in metric tonnes")
    risk_aversion_lambda: float = Field(0.5, ge=0.0, le=10.0,
        description="Risk-aversion lambda: Conservative=1.0, Balanced=0.5, Aggressive=0.1 (§13)")


class AllocationBreakdownItem(BaseModel):
    """Per-contract-type allocation detail."""
    contract_type: str
    weight_pct: float
    expected_cost_usd: float
    variance_contribution: float
    cost_premium_pct: float
    data_provenance: Dict[str, str]


class PortfolioOptimizeResponse(BaseModel):
    """Mean-variance portfolio result (§13)."""
    spot_pct: float
    short_term_pct: float
    medium_term_pct: float
    total_expected_cost_usd: float
    portfolio_variance: float
    objective_value: float
    risk_aversion_lambda: float
    lambda_label: str
    solver_used: str
    allocations: List[AllocationBreakdownItem]
    data_provenance: Dict[str, str]
    disclaimer: str
    assumptions: Dict[str, Any]
