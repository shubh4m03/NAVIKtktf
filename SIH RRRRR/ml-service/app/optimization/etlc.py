"""Expected Total Logistics Cost (ETLC) Formulation (Task 8 / Section 7).

Mathematical formulation:
ETLC(a, v, t) = E[Freight(t', v)] * Q
              + BunkerCost(v, distance)
              + PortCost(destination, v)
              + E[DemurrageCost | congestion_dist(destination)]
              + E[DelayPenalty | ETA_dist, deadline T]
              + RepositioningCost(v, origin_next_leg)
              + RiskPremium(a, forecast_volatility)

Where:
- Q: Cargo tonnage in metric tonnes
- t': Effective fixing time (t for CHARTER_NOW, t + wait_days for WAIT)
- RiskPremium: Tunable risk aversion coefficient lambda * forecast interval width * Q
- DemurrageCost: Demurrage rate * expected port queue days derived from congestion score
- DelayPenalty: Liquidated damages / stockout penalty if ETA exceeds cargo deadline T
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class VesselSpec:
    """Vessel specifications relevant to voyage economics."""
    name: str = "Panamax"
    dwt: float = 75000.0
    speed_knots: float = 12.5
    fuel_consumption_tpd: float = 28.0  # tonnes of fuel per day sailing
    daily_charter_rate: float = 18000.0  # USD/day
    demurrage_rate_per_day: float = 20000.0  # USD/day


@dataclass
class RouteSpec:
    """Route specifications for transit and port tariffs."""
    distance_nm: float = 5200.0
    typical_transit_days: float = 17.3  # 5200 nm / (12.5 knots * 24 h)
    port_cost: float = 50000.0  # Port dues, pilotage, berthing


@dataclass
class PortCondition:
    """Port congestion and turnaround conditions."""
    congestion_score: float = 50.0  # 0 to 100
    avg_turnaround_days: float = 3.5


@dataclass
class ForecastDistribution:
    """Probabilistic forecast outputs for freight rate."""
    expected_rate: float  # Expected freight rate ($/MT)
    q_05: float
    q_25: float
    q_50: float
    q_75: float
    q_95: float
    volatility: float = 0.0

    @property
    def interval_90_width(self) -> float:
        return max(0.0, self.q_95 - self.q_05)

    @property
    def interval_50_width(self) -> float:
        return max(0.0, self.q_75 - self.q_25)


@dataclass
class ETLCComponents:
    """Detailed breakdown of Expected Total Logistics Cost."""
    action: str
    total_cost: float
    freight_cost: float
    bunker_cost: float
    port_cost: float
    demurrage_cost: float
    delay_penalty: float
    repositioning_cost: float
    risk_premium: float
    days_to_delivery: float
    days_late: float
    details: Dict[str, Any] = field(default_factory=dict)


def compute_etlc(
    action: str,  # "CHARTER_NOW" or "WAIT"
    tonnage: float,
    vessel_spec: VesselSpec,
    route_spec: RouteSpec,
    port_condition: PortCondition,
    forecast: ForecastDistribution,
    current_freight_rate: float,
    current_bunker_price: float,  # USD per MT
    deadline_days: float,  # Days from decision date until cargo delivery deadline
    fixing_lead_days: float = 3.0,  # Lead time needed to fix contract & nominate vessel
    wait_days: float = 7.0,  # Number of days to defer fixing if action == "WAIT"
    risk_aversion_lambda: float = 0.5,
    delay_penalty_per_day: float = 35000.0,
    repositioning_cost: float = 0.0,
) -> ETLCComponents:
    """
    Computes Expected Total Logistics Cost for action a in {CHARTER_NOW, WAIT}.
    """
    if action not in ("CHARTER_NOW", "WAIT"):
        raise ValueError(f"Action must be 'CHARTER_NOW' or 'WAIT', got '{action}'")

    # 1. Freight Cost & Risk Premium
    if action == "CHARTER_NOW":
        rate_per_mt = current_freight_rate
        freight_cost = rate_per_mt * tonnage
        # Price is locked today -> no future price volatility risk premium
        risk_premium = 0.0
        deferred_days = 0.0
    else:  # WAIT
        rate_per_mt = forecast.expected_rate
        freight_cost = rate_per_mt * tonnage
        # Risk premium reflects forecast uncertainty (interval width) * risk aversion
        risk_premium = risk_aversion_lambda * forecast.interval_90_width * tonnage
        deferred_days = wait_days

    # 2. Sailing Transit Time & Bunker Cost
    if route_spec.typical_transit_days > 0:
        transit_days = route_spec.typical_transit_days
    else:
        transit_days = route_spec.distance_nm / (vessel_spec.speed_knots * 24.0)

    fuel_consumed_mt = transit_days * vessel_spec.fuel_consumption_tpd
    bunker_cost = fuel_consumed_mt * current_bunker_price

    # 3. Destination Port Cost
    port_cost = route_spec.port_cost

    # 4. Expected Demurrage Cost from Congestion
    # Calibrated turnaround queue: congestion score 50 = baseline turnaround
    congestion_ratio = max(0.2, port_condition.congestion_score / 50.0)
    expected_queue_days = port_condition.avg_turnaround_days * congestion_ratio
    demurrage_cost = expected_queue_days * vessel_spec.demurrage_rate_per_day

    # 5. Delivery Timeline & Delay Penalty
    # Total elapsed days from today to cargo discharge completion
    days_to_delivery = deferred_days + fixing_lead_days + transit_days + expected_queue_days
    days_late = max(0.0, days_to_delivery - deadline_days)
    delay_penalty = days_late * delay_penalty_per_day

    # Total ETLC
    total_cost = (
        freight_cost
        + bunker_cost
        + port_cost
        + demurrage_cost
        + delay_penalty
        + repositioning_cost
        + risk_premium
    )

    details = {
        "rate_per_mt": round(rate_per_mt, 2),
        "transit_days": round(transit_days, 1),
        "expected_queue_days": round(expected_queue_days, 1),
        "deadline_days": round(deadline_days, 1),
        "days_to_delivery": round(days_to_delivery, 1),
        "days_late": round(days_late, 1),
        "interval_90_width": round(forecast.interval_90_width, 2),
    }

    return ETLCComponents(
        action=action,
        total_cost=round(total_cost, 2),
        freight_cost=round(freight_cost, 2),
        bunker_cost=round(bunker_cost, 2),
        port_cost=round(port_cost, 2),
        demurrage_cost=round(demurrage_cost, 2),
        delay_penalty=round(delay_penalty, 2),
        repositioning_cost=round(repositioning_cost, 2),
        risk_premium=round(risk_premium, 2),
        days_to_delivery=round(days_to_delivery, 2),
        days_late=round(days_late, 2),
        details=details,
    )
