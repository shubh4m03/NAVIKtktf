"""Market-Entry Timing Optimizer & SPLIT(p) Solver (Task 8 / Section 7).

Optimizes charter timing action a in {CHARTER_NOW, WAIT, SPLIT(p)}:
- Grid search over p in [0, 1] in steps of 0.05 (21 points).
- Hard deadline-feasibility constraint: never recommend WAIT if time buffer before deadline
  is insufficient to still execute a charter.
- Returns optimal p*, full cost curve for UI visualization, and explainable rationale JSON.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from app.optimization.etlc import (
    VesselSpec,
    RouteSpec,
    PortCondition,
    ForecastDistribution,
    ETLCComponents,
    compute_etlc,
)
from app.explainability.narrative import generate_deterministic_narrative


def check_deadline_feasibility(
    deadline_days: float,
    transit_days: float,
    fixing_lead_days: float = 3.0,
    expected_queue_days: float = 3.5,
    wait_days: float = 7.0,
) -> Tuple[bool, float, float, str]:
    """
    Evaluates whether waiting is feasible given the delivery deadline.
    Returns: (is_wait_feasible, buffer_days, required_lead_transit_days, explanation_msg)
    """
    # Minimum time to deliver cargo if chartering today
    required_now = fixing_lead_days + transit_days + expected_queue_days
    buffer_days = deadline_days - required_now

    # If waiting by wait_days would cause cargo to arrive late
    if wait_days > buffer_days:
        is_feasible = False
        msg = (
            f"DEADLINE INFEASIBLE: Total time needed ({required_now:.1f}d) leaves only "
            f"{buffer_days:.1f}d buffer before deadline ({deadline_days:.1f}d). "
            f"Waiting {wait_days:.1f}d would cause arrival {wait_days - buffer_days:.1f}d late. "
            f"Immediate charter execution required."
        )
    else:
        is_feasible = True
        msg = (
            f"DEADLINE FEASIBLE: Remaining buffer ({buffer_days:.1f}d) exceeds wait window "
            f"({wait_days:.1f}d) by {buffer_days - wait_days:.1f}d. Waiting is operationally viable."
        )

    return is_feasible, round(buffer_days, 1), round(required_now, 1), msg


def solve_entry_timing(
    tonnage: float,
    current_freight_rate: float,
    current_bunker_price: float,
    deadline_days: float,
    forecast: ForecastDistribution,
    vessel_spec: Optional[VesselSpec] = None,
    route_spec: Optional[RouteSpec] = None,
    port_condition: Optional[PortCondition] = None,
    fixing_lead_days: float = 3.0,
    wait_days: float = 7.0,
    risk_aversion_lambda: float = 0.5,
    delay_penalty_per_day: float = 35000.0,
    policy_min_p: float = 0.0,
    policy_max_p: float = 1.0,
    grid_step: float = 0.05,
) -> Dict[str, Any]:
    """
    Grid-search optimizer over p in [0, 1] in steps of grid_step (0.05).
    Enforces deadline feasibility and policy constraints.
    Returns optimal decision and cost curve for frontend visualization.
    """
    vessel = vessel_spec or VesselSpec()
    route = route_spec or RouteSpec()
    port = port_condition or PortCondition()

    # 1. Compute transit days & queue days
    transit_days = (
        route.typical_transit_days
        if route.typical_transit_days > 0
        else route.distance_nm / (vessel.speed_knots * 24.0)
    )
    congestion_ratio = max(0.2, port.congestion_score / 50.0)
    expected_queue_days = port.avg_turnaround_days * congestion_ratio

    # 2. Check deadline feasibility for waiting
    is_wait_feasible, buffer_days, required_now, feasibility_msg = check_deadline_feasibility(
        deadline_days=deadline_days,
        transit_days=transit_days,
        fixing_lead_days=fixing_lead_days,
        expected_queue_days=expected_queue_days,
        wait_days=wait_days,
    )

    # 3. Compute base ETLC for pure CHARTER_NOW and pure WAIT
    etlc_now = compute_etlc(
        action="CHARTER_NOW",
        tonnage=tonnage,
        vessel_spec=vessel,
        route_spec=route,
        port_condition=port,
        forecast=forecast,
        current_freight_rate=current_freight_rate,
        current_bunker_price=current_bunker_price,
        deadline_days=deadline_days,
        fixing_lead_days=fixing_lead_days,
        wait_days=wait_days,
        risk_aversion_lambda=risk_aversion_lambda,
        delay_penalty_per_day=delay_penalty_per_day,
    )

    etlc_wait = compute_etlc(
        action="WAIT",
        tonnage=tonnage,
        vessel_spec=vessel,
        route_spec=route,
        port_condition=port,
        forecast=forecast,
        current_freight_rate=current_freight_rate,
        current_bunker_price=current_bunker_price,
        deadline_days=deadline_days,
        fixing_lead_days=fixing_lead_days,
        wait_days=wait_days,
        risk_aversion_lambda=risk_aversion_lambda,
        delay_penalty_per_day=delay_penalty_per_day,
    )

    # 4. Grid search over p in [0, 1] in steps of 0.05
    p_grid = np.round(np.arange(0.0, 1.0 + grid_step / 2.0, grid_step), 2)
    cost_curve: List[Dict[str, Any]] = []

    best_p = 1.0
    min_cost = float("inf")

    # If deadline-infeasible to wait, force p* = 1.0 (CHARTER_NOW)
    if not is_wait_feasible:
        best_p = 1.0
        min_cost = etlc_now.total_cost

        for p in p_grid:
            # When infeasible to wait, any fraction (1-p) left open incurs delay penalty
            cost_p = p * etlc_now.total_cost + (1.0 - p) * etlc_wait.total_cost
            cost_curve.append({
                "p": float(p),
                "split_pct_now": int(round(p * 100)),
                "cost": round(cost_p, 2),
                "is_feasible": bool(p >= 0.999),  # Only p=1.0 avoids missing deadline
            })

        action = "CHARTER_NOW"
    else:
        # Evaluate objective function across grid points
        for p in p_grid:
            # Policy feasibility constraints
            is_policy_feasible = (policy_min_p <= p <= policy_max_p)

            # Expected cost combination with quadratic uncertainty term on open position
            # Risk premium on open fraction: lambda * (1 - p)^2 * spread * Q
            cost_p = (
                p * (etlc_now.freight_cost + etlc_now.bunker_cost + etlc_now.port_cost + etlc_now.demurrage_cost)
                + (1.0 - p) * (etlc_wait.freight_cost + etlc_wait.bunker_cost + etlc_wait.port_cost + etlc_wait.demurrage_cost)
                + ((1.0 - p) ** 2) * risk_aversion_lambda * forecast.interval_90_width * tonnage
            )

            cost_curve.append({
                "p": float(p),
                "split_pct_now": int(round(p * 100)),
                "cost": round(cost_p, 2),
                "is_feasible": is_policy_feasible,
            })

            if is_policy_feasible and cost_p < min_cost:
                min_cost = cost_p
                best_p = float(p)

        # Categorize recommended action
        if best_p >= 0.95:
            action = "CHARTER_NOW"
        elif best_p <= 0.05:
            action = "WAIT"
        else:
            action = "SPLIT"

    # 5. Build explainable rationale JSON matching Section 21
    rate_diff_pct = (forecast.expected_rate - current_freight_rate) / current_freight_rate * 100.0
    drivers = [
        {
            "factor": "expected_freight_change",
            "value": f"{rate_diff_pct:+.1f}%",
            "direction": "favorable_to_wait" if rate_diff_pct < 0 else "unfavorable_to_wait",
        },
        {
            "factor": "freight_price_delta",
            "value": f"{rate_diff_pct:+.1f}% (current: ${current_freight_rate:.2f}, forecast: ${forecast.expected_rate:.2f})",
            "direction": "favorable_to_wait" if rate_diff_pct < 0 else "unfavorable_to_wait",
        },
        {
            "factor": "forecast_interval_uncertainty",
            "value": f"${forecast.interval_90_width:.2f}/MT spread",
            "direction": "low_volatility" if forecast.interval_90_width < 3.0 else "high_volatility",
        },
        {
            "factor": "deadline_buffer",
            "value": f"{buffer_days:.1f} days remaining",
            "direction": "ample_buffer" if is_wait_feasible else "deadline_critical",
        },
    ]

    rationale = {
        "action": action,
        "split_pct": int(round(best_p * 100)),
        "split_pct_now": int(round(best_p * 100)),
        "split_pct_wait": int(round((1.0 - best_p) * 100)),
        "drivers": drivers,
    }

    if not is_wait_feasible:
        rationale["narrative"] = (
            f"Cargo deadline is in {deadline_days:.1f} days, leaving only {buffer_days:.1f} days of buffer "
            f"after transit ({transit_days:.1f}d) and port queue ({expected_queue_days:.1f}d). "
            f"Waiting {wait_days:.1f} days is operationally infeasible as delivery would miss deadline. "
            f"Immediate charter execution (100% now) is mandated."
        )
    else:
        rationale["narrative"] = generate_deterministic_narrative(rationale)

    return {
        "recommended_action": action,
        "optimal_p": float(best_p),
        "split_pct_now": int(round(best_p * 100)),
        "split_pct_wait": int(round((1.0 - best_p) * 100)),
        "optimal_etlc": round(min_cost, 2),
        "etlc_now": round(etlc_now.total_cost, 2),
        "etlc_wait": round(etlc_wait.total_cost, 2),
        "expected_savings": round(etlc_now.total_cost - min_cost, 2),
        "deadline_feasibility": {
            "is_wait_feasible": is_wait_feasible,
            "buffer_days": buffer_days,
            "required_days": required_now,
            "wait_days_evaluated": wait_days,
            "message": feasibility_msg,
        },
        "cost_curve": cost_curve,
        "rationale": rationale,
    }
