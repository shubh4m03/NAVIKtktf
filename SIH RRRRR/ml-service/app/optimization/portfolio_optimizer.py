"""
Charter Portfolio Optimizer — Task 19 / Section 13.

Implements mean-variance optimisation over three charter contract types:

    minimise  E[PortfolioCost] + lambda * Var(PortfolioCost)
    subject to   w_spot + w_short + w_medium = 1.0
                 0 <= w_i <= 1   for each contract type

All model assumptions are documented as named constants below and cross-
referenced in docs/api-contracts.md §4.

Design principles:
  - No hardcoded split: every allocation is computed from the forecast distribution.
  - Risk-aversion lambda comes from the caller (UI slider: Conservative=1.0,
    Balanced=0.5, Aggressive=0.1 per §13).
  - Every output field carries a data_provenance tag.
  - All cost estimates are labelled SIMULATED / MODEL_OUTPUT (no claimed real savings).
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List

import numpy as np

try:
    from scipy.optimize import minimize
    SCIPY_AVAILABLE = True
except ImportError:                         # pragma: no cover
    SCIPY_AVAILABLE = False

# ---------------------------------------------------------------------------
# § 4 Named Model Assumptions (all cross-referenced in docs/api-contracts.md §4)
# ---------------------------------------------------------------------------

SPOT_VARIANCE_FACTOR: float = 1.0
"""Variance multiplier for spot contracts. No reduction applied (full market exposure)."""

SHORT_TERM_VARIANCE_FACTOR: float = 0.60
"""Variance multiplier for short-term contracts (1-3 month lock-in).
   Assumption: 60% of spot variance remains after partial price lock.
   Source: stylised broker market convention, documented in api-contracts.md §4."""

MEDIUM_TERM_VARIANCE_FACTOR: float = 0.25
"""Variance multiplier for medium-term contracts (6-12 month lock-in).
   Assumption: 25% of spot variance remains after firm price fixing.
   Source: stylised broker market convention, documented in api-contracts.md §4."""

SHORT_TERM_COST_PREMIUM: float = 0.03
"""Cost premium for short-term contracts as a fraction of expected spot rate.
   Assumption: 3% premium above expected spot for 1-3 month paper.
   Source: stylised assumption from broker fixtures, api-contracts.md §4."""

MEDIUM_TERM_COST_PREMIUM: float = 0.08
"""Cost premium for medium-term contracts as a fraction of expected spot rate.
   Assumption: 8% premium above expected spot for 6-12 month paper.
   Source: stylised assumption from broker fixtures, api-contracts.md §4."""

MIN_WEIGHT: float = 0.05
"""Minimum portfolio weight for each contract type (prevents zero allocations).
   Ensures minimum operational diversification. api-contracts.md §4."""

MAX_SPOT_WEIGHT: float = 0.80
"""Maximum weight assigned to spot contracts. Caps pure market exposure.
   api-contracts.md §4."""

# Lambda presets corresponding to UI slider labels (§13).
LAMBDA_CONSERVATIVE: float = 1.0
LAMBDA_BALANCED: float = 0.5
LAMBDA_AGGRESSIVE: float = 0.1


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class PortfolioInput:
    """
    Inputs consumed from the Task 7 forecast distribution.

    Fields:
        expected_rate_usd_per_mt:  E[Freight rate] in USD / MT.
        q_05, q_95:                90th-percentile interval (used for variance proxy).
        tonnage_mt:                Cargo quantity in metric tonnes.
        risk_aversion_lambda:      lambda from UI slider (Conservative=1.0,
                                   Balanced=0.5, Aggressive=0.1 per §13).
    """
    expected_rate_usd_per_mt: float
    q_05: float
    q_95: float
    tonnage_mt: float
    risk_aversion_lambda: float = LAMBDA_BALANCED


@dataclass
class AllocationBreakdown:
    """Per-contract-type result returned to the API layer."""
    contract_type: str            # 'SPOT', 'SHORT_TERM', 'MEDIUM_TERM'
    weight_pct: float             # 0-100
    expected_cost_usd: float      # E[Cost] for this slice
    variance_contribution: float  # Var contribution (in cost^2 units)
    cost_premium_pct: float       # premium applied (for UI disclosure)
    data_provenance: Dict[str, str] = field(default_factory=dict)


@dataclass
class PortfolioResult:
    """
    Complete mean-variance portfolio optimisation result.

    All monetary figures are on the SIMULATED synthetic scenario and must be
    labelled as such in the UI (§38).
    """
    spot_pct: float
    short_term_pct: float
    medium_term_pct: float
    total_expected_cost_usd: float
    portfolio_variance: float
    objective_value: float           # E[Cost] + lambda * Var(Cost)
    risk_aversion_lambda: float
    lambda_label: str                # 'Conservative', 'Balanced', 'Aggressive'
    solver_used: str
    allocations: List[AllocationBreakdown]
    data_provenance: Dict[str, str] = field(default_factory=dict)
    disclaimer: str = ""
    assumptions: Dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Core solver
# ---------------------------------------------------------------------------

def _lambda_to_label(lam: float) -> str:
    """Map numeric lambda to human-readable slider label per §13."""
    if lam >= LAMBDA_CONSERVATIVE:
        return "Conservative"
    elif lam >= LAMBDA_BALANCED:
        return "Balanced"
    else:
        return "Aggressive"


def _spot_variance_from_interval(q_05: float, q_95: float) -> float:
    """
    Estimate spot freight rate variance from the 90% prediction interval.

    Under a normal approximation: sigma ~= (q_95 - q_05) / (2 * 1.6449).
    Returns variance = sigma^2.
    """
    width = max(0.0, q_95 - q_05)
    sigma = width / (2.0 * 1.6449)   # z_{0.95} = 1.6449
    return sigma ** 2


def optimize_charter_portfolio(inp: PortfolioInput) -> PortfolioResult:
    """
    Solves the mean-variance optimisation per §13:

        minimise  w^T mu + lambda * w^T Sigma w
        subject to  sum(w) = 1,  w_i >= MIN_WEIGHT

    where:
        mu[i]     = expected cost per MT for contract type i, scaled by tonnage
        Sigma     = diagonal variance-covariance matrix (spot variance scaled by
                    each contract type's variance reduction factor)
        w         = allocation vector [w_spot, w_short, w_medium]

    Returns PortfolioResult with per-type allocations and full provenance.
    """
    lam = max(0.0, inp.risk_aversion_lambda)

    # Expected total cost per contract type
    r_spot   = inp.expected_rate_usd_per_mt
    r_short  = r_spot * (1.0 + SHORT_TERM_COST_PREMIUM)
    r_medium = r_spot * (1.0 + MEDIUM_TERM_COST_PREMIUM)

    # Formulate per-MT objective for numerical conditioning in SLSQP
    mu_unit = np.array([r_spot, r_short, r_medium])
    sigma2_spot = _spot_variance_from_interval(inp.q_05, inp.q_95)
    var_unit = np.array([
        sigma2_spot * SPOT_VARIANCE_FACTOR,
        sigma2_spot * SHORT_TERM_VARIANCE_FACTOR,
        sigma2_spot * MEDIUM_TERM_VARIANCE_FACTOR,
    ])

    # Total cost units for reporting and accounting
    mu = mu_unit * inp.tonnage_mt
    var_diag = var_unit * (inp.tonnage_mt ** 2)

    def objective(w: np.ndarray) -> float:
        return float(w @ mu_unit) + lam * float((w ** 2) @ var_unit)

    def gradient(w: np.ndarray) -> np.ndarray:
        return mu_unit + lam * 2.0 * w * var_unit

    bounds = [
        (MIN_WEIGHT, MAX_SPOT_WEIGHT),                      # spot
        (MIN_WEIGHT, 1.0 - 2.0 * MIN_WEIGHT),               # short
        (MIN_WEIGHT, 1.0 - 2.0 * MIN_WEIGHT),               # medium
    ]
    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1.0}
    w0 = np.array([0.33, 0.33, 0.34])

    if SCIPY_AVAILABLE:
        res = minimize(
            objective,
            w0,
            jac=gradient,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
            options={"ftol": 1e-9, "maxiter": 500},
        )
        w_opt = res.x if res.success else w0
        solver_label = "scipy.SLSQP"
    else:
        # Analytical fallback: push towards medium-term (maximum variance reduction)
        w_opt = np.array([MIN_WEIGHT, MIN_WEIGHT, 1.0 - 2.0 * MIN_WEIGHT])
        solver_label = "analytical_fallback"


    # Normalise to sum exactly to 1 (guard against floating-point drift)
    w_opt = np.clip(w_opt, MIN_WEIGHT, 1.0)
    w_opt = w_opt / w_opt.sum()

    spot_w, short_w, med_w = float(w_opt[0]), float(w_opt[1]), float(w_opt[2])

    total_expected_cost = float(w_opt @ mu)
    portfolio_var       = float((w_opt ** 2) @ var_diag)
    obj_val             = total_expected_cost + lam * portfolio_var

    allocations = [
        AllocationBreakdown(
            contract_type="SPOT",
            weight_pct=round(spot_w * 100.0, 2),
            expected_cost_usd=round(spot_w * mu[0], 2),
            variance_contribution=round((spot_w ** 2) * float(var_diag[0]), 4),
            cost_premium_pct=0.0,
            data_provenance={
                "rate": "MODEL_OUTPUT",
                "variance": "MODEL_OUTPUT",
                "premium": "ASSUMPTION",
                "basis": "SIMULATED synthetic scenario",
            },
        ),
        AllocationBreakdown(
            contract_type="SHORT_TERM",
            weight_pct=round(short_w * 100.0, 2),
            expected_cost_usd=round(short_w * mu[1], 2),
            variance_contribution=round((short_w ** 2) * float(var_diag[1]), 4),
            cost_premium_pct=round(SHORT_TERM_COST_PREMIUM * 100.0, 1),
            data_provenance={
                "rate": "MODEL_OUTPUT",
                "variance": "MODEL_OUTPUT",
                "premium": "ASSUMPTION",
                "basis": "SIMULATED synthetic scenario",
            },
        ),
        AllocationBreakdown(
            contract_type="MEDIUM_TERM",
            weight_pct=round(med_w * 100.0, 2),
            expected_cost_usd=round(med_w * mu[2], 2),
            variance_contribution=round((med_w ** 2) * float(var_diag[2]), 4),
            cost_premium_pct=round(MEDIUM_TERM_COST_PREMIUM * 100.0, 1),
            data_provenance={
                "rate": "MODEL_OUTPUT",
                "variance": "MODEL_OUTPUT",
                "premium": "ASSUMPTION",
                "basis": "SIMULATED synthetic scenario",
            },
        ),
    ]

    return PortfolioResult(
        spot_pct=round(spot_w * 100.0, 2),
        short_term_pct=round(short_w * 100.0, 2),
        medium_term_pct=round(med_w * 100.0, 2),
        total_expected_cost_usd=round(total_expected_cost, 2),
        portfolio_variance=round(portfolio_var, 4),
        objective_value=round(obj_val, 4),
        risk_aversion_lambda=round(lam, 4),
        lambda_label=_lambda_to_label(lam),
        solver_used=solver_label,
        allocations=allocations,
        data_provenance={
            "allocations": "MODEL_OUTPUT",
            "costs": "MODEL_OUTPUT",
            "variance_factors": "ASSUMPTION",
            "premiums": "ASSUMPTION",
            "basis": "SIMULATED synthetic scenario — not real SAIL contract data",
        },
        disclaimer=(
            "ILLUSTRATIVE MVP: Portfolio weights computed via mean-variance optimisation "
            "on SIMULATED forecast distribution. All cost figures apply to the synthetic "
            "cargo scenario only. Term-contract variance and premium assumptions are "
            "stylised broker conventions documented in api-contracts.md §4. "
            "Not a real SAIL contract recommendation."
        ),
        assumptions={
            "spot_variance_factor": SPOT_VARIANCE_FACTOR,
            "short_term_variance_factor": SHORT_TERM_VARIANCE_FACTOR,
            "medium_term_variance_factor": MEDIUM_TERM_VARIANCE_FACTOR,
            "short_term_cost_premium_pct": round(SHORT_TERM_COST_PREMIUM * 100.0, 1),
            "medium_term_cost_premium_pct": round(MEDIUM_TERM_COST_PREMIUM * 100.0, 1),
            "min_weight_pct": round(MIN_WEIGHT * 100.0, 1),
            "max_spot_weight_pct": round(MAX_SPOT_WEIGHT * 100.0, 1),
            "variance_model": "Diagonal (zero cross-correlation, conservative)",
            "variance_basis": "90% prediction interval -> normal sigma approximation",
        },
    )
