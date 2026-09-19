"""Multi-Objective Vessel Scoring & Ranking Engine (Task 9 / Section 8 Step 2).

Implements Section 8's weighted multi-objective scoring formulation:
Score(v) = w1 * (-EstimatedLandedCost(v))
         + w2 * (-ExpectedDelay(v))
         + w3 * AvailabilityScore(v)
         - w4 * RiskPenalty(v)

Scoring weights are defined as a named configuration object (ScoringWeightsConfig),
never inline magic numbers.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import numpy as np

from app.optimization.vessel_feasibility import VesselCandidate


@dataclass
class ScoringWeightsConfig:
    """Named configuration object for multi-objective vessel candidate scoring."""
    name: str = "DEFAULT_BALANCED"
    cost_weight: float = 0.40          # w1: Landed logistics cost weight
    delay_weight: float = 0.25         # w2: Transit & turnaround delay weight
    availability_weight: float = 0.20  # w3: Prompt vessel availability weight
    risk_weight: float = 0.15          # w4: Operational/weather/congestion risk penalty weight

    def __post_init__(self):
        # Validate non-negative weights
        for w_name, val in [
            ("cost_weight", self.cost_weight),
            ("delay_weight", self.delay_weight),
            ("availability_weight", self.availability_weight),
            ("risk_weight", self.risk_weight),
        ]:
            if val < 0.0:
                raise ValueError(f"Weight '{w_name}' cannot be negative, got {val}")

    @property
    def total_weight(self) -> float:
        return self.cost_weight + self.delay_weight + self.availability_weight + self.risk_weight


# Standard industry presets
SCORING_PRESETS = {
    "DEFAULT_BALANCED": ScoringWeightsConfig(
        name="DEFAULT_BALANCED", cost_weight=0.40, delay_weight=0.25, availability_weight=0.20, risk_weight=0.15
    ),
    "COST_PRIORITY": ScoringWeightsConfig(
        name="COST_PRIORITY", cost_weight=0.65, delay_weight=0.15, availability_weight=0.10, risk_weight=0.10
    ),
    "RELIABILITY_PRIORITY": ScoringWeightsConfig(
        name="RELIABILITY_PRIORITY", cost_weight=0.20, delay_weight=0.40, availability_weight=0.20, risk_weight=0.20
    ),
    "URGENT_DISPATCH": ScoringWeightsConfig(
        name="URGENT_DISPATCH", cost_weight=0.15, delay_weight=0.55, availability_weight=0.25, risk_weight=0.05
    ),
}


@dataclass
class VesselVoyageMetrics:
    """Operational and financial metrics for a candidate on a specific cargo request."""
    vessel: VesselCandidate
    estimated_landed_cost_usd_per_mt: float
    expected_delay_days: float  # transit days + expected queue days
    availability_score: float = 80.0  # 0 to 100
    risk_penalty: float = 25.0  # 0 to 100


@dataclass
class RankedVesselResult:
    """Final ranked candidate with transparent score decomposition."""
    rank: int
    vessel: VesselCandidate
    total_score: float
    cost_subscore: float
    delay_subscore: float
    availability_subscore: float
    risk_penalty_subscore: float
    raw_landed_cost: float
    raw_delay_days: float
    weights_applied: ScoringWeightsConfig


def normalize_metric(values: List[float], invert: bool = False) -> List[float]:
    """
    Min-max normalization into [0, 100].
    If invert=True (e.g. for cost or delay), lower raw values produce higher scores.
    """
    arr = np.array(values, dtype=float)
    min_val = np.min(arr)
    max_val = np.max(arr)

    if np.isclose(min_val, max_val):
        # All candidates have identical values -> equal score
        return [50.0] * len(values)

    if invert:
        # Lower raw is better: score = 100 * (max - v) / (max - min)
        norm = 100.0 * (max_val - arr) / (max_val - min_val)
    else:
        # Higher raw is better: score = 100 * (v - min) / (max - min)
        norm = 100.0 * (arr - min_val) / (max_val - min_val)

    return [round(float(x), 2) for x in norm]


def rank_vessel_candidates(
    candidates_metrics: List[VesselVoyageMetrics],
    weights: Optional[ScoringWeightsConfig] = None,
) -> List[RankedVesselResult]:
    """
    Executes Step 2 Multi-Objective Scoring across surviving feasible candidates.
    Returns sorted list of RankedVesselResult ordered from highest to lowest score.
    """
    if not candidates_metrics:
        return []

    cfg = weights or SCORING_PRESETS["DEFAULT_BALANCED"]

    costs = [m.estimated_landed_cost_usd_per_mt for m in candidates_metrics]
    delays = [m.expected_delay_days for m in candidates_metrics]
    avails = [m.availability_score for m in candidates_metrics]
    risks = [m.risk_penalty for m in candidates_metrics]

    # Normalize to [0, 100]
    cost_scores = normalize_metric(costs, invert=True)     # lower cost -> higher score
    delay_scores = normalize_metric(delays, invert=True)   # shorter delay -> higher score
    avail_scores = [round(float(v), 2) for v in avails]    # 0 to 100
    risk_penalties = [round(float(v), 2) for v in risks]   # 0 to 100

    results = []
    for i, m in enumerate(candidates_metrics):
        w1 = cfg.cost_weight
        w2 = cfg.delay_weight
        w3 = cfg.availability_weight
        w4 = cfg.risk_weight

        # Weighted formula matching Section 8
        total = (
            w1 * cost_scores[i]
            + w2 * delay_scores[i]
            + w3 * avail_scores[i]
            - w4 * risk_penalties[i]
        )

        results.append({
            "metrics": m,
            "total_score": round(total, 2),
            "cost_subscore": cost_scores[i],
            "delay_subscore": delay_scores[i],
            "availability_subscore": avail_scores[i],
            "risk_penalty_subscore": risk_penalties[i],
        })

    # Sort descending by total score
    results.sort(key=lambda r: r["total_score"], reverse=True)

    ranked_outputs = []
    for rank_idx, item in enumerate(results, start=1):
        m = item["metrics"]
        ranked_outputs.append(
            RankedVesselResult(
                rank=rank_idx,
                vessel=m.vessel,
                total_score=item["total_score"],
                cost_subscore=item["cost_subscore"],
                delay_subscore=item["delay_subscore"],
                availability_subscore=item["availability_subscore"],
                risk_penalty_subscore=item["risk_penalty_subscore"],
                raw_landed_cost=m.estimated_landed_cost_usd_per_mt,
                raw_delay_days=m.expected_delay_days,
                weights_applied=cfg,
            )
        )

    return ranked_outputs
