"""
FastAPI router for Optimization endpoints (§7, §8, §18).
Endpoints:
  POST /internal/v1/optimize/vessel-rank & POST /optimize/vessel-rank
  POST /internal/v1/optimize/entry-timing & POST /optimize/entry-timing
"""

from fastapi import APIRouter, Header, HTTPException
from typing import Optional, List, Dict, Any

from app.schemas.internal import (
    VesselRankRequest,
    VesselRankResponse,
    VesselCandidateOutput,
    EntryTimingRequest,
    EntryTimingResponse,
    IdleRepositioningRequest,
    IdleRepositioningResponse,
    OpportunityLaneItem,
    PortfolioOptimizeRequest,
    PortfolioOptimizeResponse,
    AllocationBreakdownItem,
)
from app.optimization.idle_repositioning import estimate_idle_and_repositioning
from app.optimization.vessel_feasibility import (
    PortConstraintData,
    VesselCandidate,
    filter_vessel_candidates,
)
from app.optimization.vessel_scoring import (
    VesselVoyageMetrics,
    ScoringWeightsConfig,
    rank_vessel_candidates,
    SCORING_PRESETS,
)

router = APIRouter(tags=["Optimization Engine"])



@router.post("/internal/v1/optimize/vessel-rank", response_model=VesselRankResponse)
@router.post("/optimize/vessel-rank", response_model=VesselRankResponse)
async def rank_vessels(
    request: VesselRankRequest,
    x_internal_service_token: Optional[str] = Header(None)
):
    """
    Step 1: Hard physical feasibility filter (draft, LOA, beam, DWT)
    Step 2: Multi-objective normalized scoring on survivors.
    """
    port_constraints = PortConstraintData(
        port_id=request.port_id or 1,
        port_name="DestinationPort",
        port_code="PORT_DEST",
        max_draft_m=request.max_draft_m,
        max_loa_m=request.max_loa_m or 300.0,
        max_beam_m=request.max_beam_m or 50.0,
    )

    candidate_objs = {
        c.vessel_class_name: VesselCandidate(
            id=c.vessel_class_id or idx + 1,
            name=f"{c.vessel_class_name} Standard",
            vessel_class=c.vessel_class_name,
            draft_m=c.draft_m,
            loa_m=c.loa_m,
            beam_m=c.beam_m,
            dwt=c.dwt,
        )
        for idx, c in enumerate(request.candidates)
    }

    filter_res = filter_vessel_candidates(
        candidates=list(candidate_objs.values()),
        port=port_constraints,
        cargo_tonnage=request.cargo_quantity_mt,
    )

    # Prepare scoring metrics for survivors
    c_map = {c.vessel_class_name: c for c in request.candidates}
    surviving_metrics = []
    
    for fe in filter_res.all_evaluations:
        c_req = c_map.get(fe.vessel.vessel_class)
        if fe.is_feasible and c_req:
            surviving_metrics.append(VesselVoyageMetrics(
                vessel=fe.vessel,
                estimated_landed_cost_usd_per_mt=c_req.estimated_landed_cost,
                expected_delay_days=c_req.expected_delay_days,
                availability_score=c_req.availability_score,
                risk_penalty=c_req.risk_penalty,
            ))

    weights = SCORING_PRESETS.get(request.weights_preset, SCORING_PRESETS["DEFAULT_BALANCED"])
    ranked_survivors = {}
    if surviving_metrics:
        ranked_survivors = {
            r.vessel.vessel_class: r for r in rank_vessel_candidates(surviving_metrics, weights=weights)
        }

    output_list = []
    rank_counter = 1
    # Feasible first, then infeasible
    for fe in filter_res.all_evaluations:
        v_class = fe.vessel.vessel_class
        c_req = c_map.get(v_class)
        cost = c_req.estimated_landed_cost if c_req else 0.0
        delay = c_req.expected_delay_days if c_req else 0.0
        v_id = c_req.vessel_class_id if c_req else None

        if fe.is_feasible and v_class in ranked_survivors:
            scored = ranked_survivors[v_class]
            output_list.append(VesselCandidateOutput(
                vessel_class_id=v_id,
                vessel_class_name=v_class,
                score=round(scored.total_score, 2),
                rank=scored.rank,
                feasible=True,
                infeasibility_reason=None,
                estimated_landed_cost=cost,
                expected_delay_days=delay,
            ))
        else:
            output_list.append(VesselCandidateOutput(
                vessel_class_id=v_id,
                vessel_class_name=v_class,
                score=0.0,
                rank=999,
                feasible=False,
                infeasibility_reason=fe.primary_infeasibility_reason,
                estimated_landed_cost=cost,
                expected_delay_days=delay,
            ))



    # Sort output: feasible by rank, then infeasible
    output_list.sort(key=lambda x: (not x.feasible, x.rank))
    return VesselRankResponse(rankings=output_list)


from app.optimization.etlc import ForecastDistribution
from app.optimization.entry_timing import solve_entry_timing

# ... router definition ...

@router.post("/internal/v1/optimize/entry-timing", response_model=EntryTimingResponse)
@router.post("/optimize/entry-timing", response_model=EntryTimingResponse)
async def optimize_timing(
    request: EntryTimingRequest,
    x_internal_service_token: Optional[str] = Header(None)
):
    """
    Market-entry timing optimization via 21-point SPLIT solver (§7).
    """
    half_spread = request.forecast_spread / 2.0
    forecast_dist = ForecastDistribution(
        expected_rate=request.forecast_expected_rate,
        q_05=request.forecast_expected_rate - half_spread,
        q_25=request.forecast_expected_rate - (half_spread * 0.5),
        q_50=request.forecast_expected_rate,
        q_75=request.forecast_expected_rate + (half_spread * 0.5),
        q_95=request.forecast_expected_rate + half_spread,
        volatility=request.forecast_spread,
    )


    sol = solve_entry_timing(
        tonnage=request.cargo_quantity_mt,
        current_freight_rate=request.current_spot_rate,
        current_bunker_price=650.0,
        deadline_days=request.deadline_days,
        forecast=forecast_dist,
        wait_days=request.wait_days,
        risk_aversion_lambda=request.risk_aversion_lambda,
    )

    buffer_days = sol["deadline_feasibility"]["buffer_days"]
    is_feasible = sol["deadline_feasibility"]["is_wait_feasible"]

    return EntryTimingResponse(
        recommended_action=sol["recommended_action"],
        split_pct=float(sol["split_pct_now"]),
        optimal_p=float(sol["optimal_p"]),
        etlc_now=float(sol["etlc_now"]),
        etlc_wait=float(sol["etlc_wait"]),
        optimal_etlc=float(sol["optimal_etlc"]),
        is_wait_feasible=is_feasible,
        time_buffer_days=float(buffer_days),
        rationale=sol["rationale"],
    )


@router.post("/internal/v1/optimize/idle-repositioning", response_model=IdleRepositioningResponse)
@router.post("/optimize/idle-repositioning", response_model=IdleRepositioningResponse)
async def get_idle_repositioning(
    request: IdleRepositioningRequest,
    x_internal_service_token: Optional[str] = Header(None)
):
    """
    TASK 18 / Section 10: Idle-Time & Repositioning Engine MVP.
    Estimates post-discharge availability window reusing Task 9 port turnaround distributions,
    and returns 2-3 illustrative opportunity lanes with explicit provenance and Section 10 disclaimer.
    """
    res = estimate_idle_and_repositioning(
        discharge_port_id=request.discharge_port_id,
        discharge_port_name=request.discharge_port_name,
        vessel_class_id=request.vessel_class_id,
        vessel_class_name=request.vessel_class_name,
        cargo_tonnage=request.cargo_tonnage,
        estimated_arrival_date=request.estimated_arrival_date,
        avg_turnaround_days=request.avg_turnaround_days or 3.5,
        handling_rate_tph=request.handling_rate_tph or 2500.0,
        congestion_ratio=request.congestion_ratio or 1.0,
    )

    lane_items = [
        OpportunityLaneItem(
            lane_id=lane.lane_id,
            destination_region=lane.destination_region,
            destination_ports=lane.destination_ports,
            target_commodity=lane.target_commodity,
            ballast_distance_nm=lane.ballast_distance_nm,
            ballast_transit_days=lane.ballast_transit_days,
            est_repositioning_cost_usd=lane.est_repositioning_cost_usd,
            demand_seasonality_score=lane.demand_seasonality_score,
            demand_seasonality_label=lane.demand_seasonality_label,
            trade_pattern_notes=lane.trade_pattern_notes,
            provenance=lane.provenance,
        )
        for lane in res.opportunity_lanes
    ]

    return IdleRepositioningResponse(
        discharge_port_id=res.discharge_port_id,
        discharge_port_name=res.discharge_port_name,
        vessel_class_id=res.vessel_class_id,
        vessel_class_name=res.vessel_class_name,
        cargo_tonnage=res.cargo_tonnage,
        estimated_arrival_date=res.estimated_arrival_date,
        turnaround_days=res.turnaround_days,
        handling_days=res.handling_days,
        queue_days=res.queue_days,
        available_date=res.available_date,
        opportunity_lanes=lane_items,
        disclaimer=res.disclaimer,
        data_provenance=res.data_provenance,
    )


from app.optimization.portfolio_optimizer import optimize_charter_portfolio, PortfolioInput


@router.post("/internal/v1/optimize/portfolio", response_model=PortfolioOptimizeResponse)
@router.post("/optimize/portfolio", response_model=PortfolioOptimizeResponse)
async def optimize_portfolio(
    request: PortfolioOptimizeRequest,
    x_internal_service_token: Optional[str] = Header(None),
):
    """
    TASK 19 / Section 13: Charter Portfolio Strategy — Mean-Variance Optimiser.

    Minimises E[PortfolioCost] + lambda * Var(PortfolioCost) across three charter
    contract types (spot, short-term 1-3 month, medium-term 6-12 month).

    lambda is the risk-aversion parameter from the UI slider:
        Conservative = 1.0,  Balanced = 0.5,  Aggressive = 0.1  (§13)

    All assumptions (variance reduction factors, cost premiums) are named
    constants documented in api-contracts.md §4.
    """
    inp = PortfolioInput(
        expected_rate_usd_per_mt=request.expected_rate_usd_per_mt,
        q_05=request.q_05,
        q_95=request.q_95,
        tonnage_mt=request.tonnage_mt,
        risk_aversion_lambda=request.risk_aversion_lambda,
    )

    result = optimize_charter_portfolio(inp)

    allocation_items = [
        AllocationBreakdownItem(
            contract_type=a.contract_type,
            weight_pct=a.weight_pct,
            expected_cost_usd=a.expected_cost_usd,
            variance_contribution=a.variance_contribution,
            cost_premium_pct=a.cost_premium_pct,
            data_provenance=a.data_provenance,
        )
        for a in result.allocations
    ]

    return PortfolioOptimizeResponse(
        spot_pct=result.spot_pct,
        short_term_pct=result.short_term_pct,
        medium_term_pct=result.medium_term_pct,
        total_expected_cost_usd=result.total_expected_cost_usd,
        portfolio_variance=result.portfolio_variance,
        objective_value=result.objective_value,
        risk_aversion_lambda=result.risk_aversion_lambda,
        lambda_label=result.lambda_label,
        solver_used=result.solver_used,
        allocations=allocation_items,
        data_provenance=result.data_provenance,
        disclaimer=result.disclaimer,
        assumptions=result.assumptions,
    )
