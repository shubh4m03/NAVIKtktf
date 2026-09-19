"""Vessel-Port Feasibility Filter (Task 9 / Section 8 Step 1).

Implements hard physical and operational constraint satisfaction:
- Maximum draft constraint: vessel draft <= port max draft (tide adjusted)
- Maximum LOA constraint: vessel length <= port max LOA
- Maximum beam constraint: vessel beam <= port max beam
- Deadweight cargo capacity: vessel DWT capacity >= required cargo tonnage

Every eliminated candidate receives an explicit, human-readable infeasibility_reason.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class PortConstraintData:
    """Port physical and nautical constraints."""
    port_id: int
    port_name: str
    port_code: str
    max_draft_m: float
    max_loa_m: float
    max_beam_m: float
    handling_rate_tph: float = 2500.0
    berth_count: int = 4
    avg_turnaround_days: float = 3.5


@dataclass
class VesselCandidate:
    """Candidate vessel or vessel class specifications."""
    id: int
    name: str
    vessel_class: str
    draft_m: float
    loa_m: float
    beam_m: float
    dwt: float
    dwt_min: float = 0.0
    speed_knots: float = 12.5
    daily_rate: float = 18000.0
    fuel_consumption_tpd: float = 28.0


@dataclass
class FeasibilityEvaluation:
    """Detailed evaluation result for a single vessel candidate."""
    vessel: VesselCandidate
    is_feasible: bool
    reasons: List[str] = field(default_factory=list)
    primary_infeasibility_reason: Optional[str] = None
    constraint_margins: Dict[str, float] = field(default_factory=dict)


@dataclass
class FeasibilityFilterResult:
    """Aggregated output of the vessel-port feasibility filter."""
    feasible_vessels: List[VesselCandidate]
    eliminated_vessels: List[FeasibilityEvaluation]
    all_evaluations: List[FeasibilityEvaluation]
    port_name: str
    effective_max_draft_m: float


def evaluate_vessel_feasibility(
    vessel: VesselCandidate,
    port: PortConstraintData,
    cargo_tonnage: Optional[float] = None,
    tide_adjustment_m: float = 0.0,
) -> FeasibilityEvaluation:
    """
    Evaluates hard constraint feasibility for a single vessel candidate.
    Identifies all physical violations and returns exact margin deltas.
    """
    reasons = []
    margins = {}
    is_feasible = True

    # 1. Draft check
    effective_max_draft = port.max_draft_m + tide_adjustment_m
    draft_margin = effective_max_draft - vessel.draft_m
    margins["draft_margin_m"] = round(draft_margin, 2)

    if vessel.draft_m > effective_max_draft:
        is_feasible = False
        excess = vessel.draft_m - effective_max_draft
        reasons.append(
            f"Vessel draft {vessel.draft_m:.1f}m exceeds port max draft {effective_max_draft:.1f}m (exceeds by {excess:.1f}m)"
        )

    # 2. LOA check
    if port.max_loa_m > 0:
        loa_margin = port.max_loa_m - vessel.loa_m
        margins["loa_margin_m"] = round(loa_margin, 2)
        if vessel.loa_m > port.max_loa_m:
            is_feasible = False
            excess = vessel.loa_m - port.max_loa_m
            reasons.append(
                f"Vessel LOA {vessel.loa_m:.1f}m exceeds port max LOA {port.max_loa_m:.1f}m (exceeds by {excess:.1f}m)"
            )

    # 3. Beam check
    if port.max_beam_m > 0:
        beam_margin = port.max_beam_m - vessel.beam_m
        margins["beam_margin_m"] = round(beam_margin, 2)
        if vessel.beam_m > port.max_beam_m:
            is_feasible = False
            excess = vessel.beam_m - port.max_beam_m
            reasons.append(
                f"Vessel beam {vessel.beam_m:.1f}m exceeds port max beam {port.max_beam_m:.1f}m (exceeds by {excess:.1f}m)"
            )

    # 4. Cargo tonnage capacity check
    if cargo_tonnage is not None and cargo_tonnage > 0:
        dwt_margin = vessel.dwt - cargo_tonnage
        margins["dwt_margin_mt"] = round(dwt_margin, 0)
        if cargo_tonnage > vessel.dwt:
            is_feasible = False
            deficit = cargo_tonnage - vessel.dwt
            reasons.append(
                f"Cargo parcel {cargo_tonnage:,.0f} MT exceeds vessel DWT capacity {vessel.dwt:,.0f} MT (deficit of {deficit:,.0f} MT)"
            )

    primary_reason = reasons[0] if reasons else None

    return FeasibilityEvaluation(
        vessel=vessel,
        is_feasible=is_feasible,
        reasons=reasons,
        primary_infeasibility_reason=primary_reason,
        constraint_margins=margins,
    )


def filter_vessel_candidates(
    candidates: List[VesselCandidate],
    port: PortConstraintData,
    cargo_tonnage: Optional[float] = None,
    tide_adjustment_m: float = 0.0,
) -> FeasibilityFilterResult:
    """
    Executes Step 1 Hard Feasibility Filter across all candidate vessels/classes.
    Separates surviving feasible vessels from eliminated candidates.
    """
    feasible_list: List[VesselCandidate] = []
    eliminated_list: List[FeasibilityEvaluation] = []
    all_evals: List[FeasibilityEvaluation] = []

    effective_max_draft = port.max_draft_m + tide_adjustment_m

    for cand in candidates:
        evaluation = evaluate_vessel_feasibility(
            vessel=cand,
            port=port,
            cargo_tonnage=cargo_tonnage,
            tide_adjustment_m=tide_adjustment_m,
        )
        all_evals.append(evaluation)
        if evaluation.is_feasible:
            feasible_list.append(cand)
        else:
            eliminated_list.append(evaluation)

    return FeasibilityFilterResult(
        feasible_vessels=feasible_list,
        eliminated_vessels=eliminated_list,
        all_evaluations=all_evals,
        port_name=port.port_name,
        effective_max_draft_m=effective_max_draft,
    )
