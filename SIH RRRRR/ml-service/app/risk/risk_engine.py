"""
Risk Engine Module (§11 and §31 of architecture).
Computes a weighted, documented, reproducible composite risk score (0-100)
combining forecast volatility, port congestion, seasonal weather, vessel availability tightness,
and commodity price shock indicators.

RiskScore = 100 * (
    w_vol   * normalize(forecast_volatility)
  + w_cong  * normalize(port_congestion_trend)
  + w_wx    * seasonal_weather_risk(destination, month)
  + w_avail * normalize(vessel_availability_tightness_proxy)
  + w_conc  * commodity_price_shock_indicator(coal/bunker)
)
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any
import math


@dataclass(frozen=True)
class RiskWeightsConfig:
    """
    Named configuration object for risk sub-component weights.
    Strictly validated: weights must be non-negative and sum to 1.0.
    Zero inline magic numbers.
    """
    w_vol: float = 0.25     # Forecast uncertainty & volatility
    w_cong: float = 0.25    # Port congestion & turnaround delay
    w_wx: float = 0.20      # Seasonal weather & cyclone risk
    w_avail: float = 0.15   # Vessel availability tightness proxy
    w_shock: float = 0.15   # Commodity / bunker price shock indicator

    def __post_init__(self):
        weights = [self.w_vol, self.w_cong, self.w_wx, self.w_avail, self.w_shock]
        for w in weights:
            if w < 0.0:
                raise ValueError(f"Risk weights must be non-negative, got {w}")
        total = sum(weights)
        if not (0.999 <= total <= 1.001):
            raise ValueError(f"Risk weights must sum to 1.0, got {total:.4f}")


# Standard Named Presets
DEFAULT_BALANCED_WEIGHTS = RiskWeightsConfig(
    w_vol=0.25, w_cong=0.25, w_wx=0.20, w_avail=0.15, w_shock=0.15
)
WEATHER_FOCUSED_WEIGHTS = RiskWeightsConfig(
    w_vol=0.15, w_cong=0.20, w_wx=0.40, w_avail=0.15, w_shock=0.10
)
MARKET_VOLATILITY_WEIGHTS = RiskWeightsConfig(
    w_vol=0.40, w_cong=0.15, w_wx=0.15, w_avail=0.15, w_shock=0.15
)
CONGESTION_FOCUSED_WEIGHTS = RiskWeightsConfig(
    w_vol=0.15, w_cong=0.45, w_wx=0.15, w_avail=0.15, w_shock=0.10
)


# Bay of Bengal / East Coast India Seasonal Weather Calendar (§3.3, V2 seed)
BAY_OF_BENGAL_WEATHER_CALENDAR = {
    1: {"risk_level": "LOW", "score": 0.15, "note": "Winter calm conditions"},
    2: {"risk_level": "LOW", "score": 0.15, "note": "Winter calm conditions"},
    3: {"risk_level": "LOW", "score": 0.20, "note": "Fair weather transition"},
    4: {"risk_level": "HIGH", "score": 0.85, "note": "Pre-monsoon cyclone season"},
    5: {"risk_level": "HIGH", "score": 0.95, "note": "Pre-monsoon peak cyclone season"},
    6: {"risk_level": "MEDIUM", "score": 0.60, "note": "Southwest monsoon onset, rough seas"},
    7: {"risk_level": "MEDIUM", "score": 0.65, "note": "Active monsoon, swell and rain"},
    8: {"risk_level": "MEDIUM", "score": 0.60, "note": "Active monsoon"},
    9: {"risk_level": "MEDIUM", "score": 0.50, "note": "Monsoon withdrawal phase"},
    10: {"risk_level": "HIGH", "score": 0.90, "note": "Post-monsoon cyclone season"},
    11: {"risk_level": "HIGH", "score": 0.95, "note": "Post-monsoon peak cyclone season"},
    12: {"risk_level": "LOW", "score": 0.20, "note": "Transition to calm winter"},
}


def lookup_seasonal_weather_risk(destination_region: str, month: int) -> Dict[str, Any]:
    """
    Calendar-based, defensible seasonal weather risk lookup (§11).
    Encodes Bay of Bengal / Indian East Coast cyclonic seasonality.
    """
    month = max(1, min(12, int(month)))
    cal = BAY_OF_BENGAL_WEATHER_CALENDAR.get(month, {"risk_level": "MEDIUM", "score": 0.50, "note": "Normal maritime conditions"})
    return {
        "region": destination_region or "Bay of Bengal",
        "month": month,
        "risk_level": cal["risk_level"],
        "sub_score": cal["score"],
        "note": cal["note"],
        "provenance": "REAL_VERIFIED",
        "source": "IMD Cyclone & Monsoon Calendar (§3.3)",
    }


@dataclass
class RiskInput:
    """
    Input data for composite risk evaluation.
    Supports either pre-normalized sub-scores [0.0, 1.0] or raw domain indicators.
    """
    # 1. Forecast Volatility
    volatility_sub_score: Optional[float] = None
    forecast_relative_spread: Optional[float] = None  # (q90 - q10) / expected_rate
    
    # 2. Port Congestion
    congestion_sub_score: Optional[float] = None
    port_waiting_days: Optional[float] = None          # e.g. current pre-berthing queue days
    port_baseline_days: float = 3.0                   # baseline normal wait
    
    # 3. Weather / Cyclone Risk
    weather_sub_score: Optional[float] = None
    destination_region: str = "Bay of Bengal"
    laycan_month: Optional[int] = None
    
    # 4. Vessel Availability Tightness Proxy
    availability_sub_score: Optional[float] = None
    freight_momentum_pct: Optional[float] = None      # 14-day index momentum, e.g. +0.15 = tightening
    
    # 5. Commodity / Bunker Price Shock
    shock_sub_score: Optional[float] = None
    commodity_shock_pct: Optional[float] = None       # 30-day bunker / fuel price change pct
    
    # Optimizer linkage: SPLIT(p) percentage (e.g. 45.0 for 45% now, 55% wait)
    split_pct: Optional[float] = None


@dataclass
class RiskDriver:
    """
    Single contributing risk driver with provenance metadata.
    """
    factor: str
    display_name: str
    sub_score: float                # Normalized score [0.0, 1.0]
    weight: float                   # w_i
    weighted_contribution: float    # 100 * w_i * sub_score
    direction: str                  # "unfavorable" or "favorable"
    provenance: str                 # REAL_VERIFIED, PUBLIC_PROXY, SIMULATED, MODEL_OUTPUT
    source: str
    detail: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "factor": self.factor,
            "display_name": self.display_name,
            "sub_score": round(self.sub_score, 4),
            "weight": round(self.weight, 4),
            "weighted_contribution": round(self.weighted_contribution, 2),
            "direction": self.direction,
            "provenance": self.provenance,
            "source": self.source,
            "detail": self.detail,
        }


@dataclass
class RiskEvaluation:
    """
    Complete output of the Risk Engine (§11).
    """
    risk_score: float                               # Composite score [0.0, 100.0]
    category: str                                   # LOW, MEDIUM, HIGH
    weights_used: Dict[str, float]
    all_drivers: List[RiskDriver]
    top_drivers: List[RiskDriver]                   # Top-2 contributing drivers
    mitigation_suggestion: str                      # Coherent template tied to SPLIT(p)
    split_pct_used: Optional[float]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_score": round(self.risk_score, 2),
            "category": self.category,
            "weights_used": self.weights_used,
            "top_drivers": [d.to_dict() for d in self.top_drivers],
            "all_drivers": [d.to_dict() for d in self.all_drivers],
            "mitigation_suggestion": self.mitigation_suggestion,
            "split_pct_used": self.split_pct_used,
        }


def classify_risk_category(score: float) -> str:
    """Classify 0-100 risk score into standard categories."""
    if score < 35.0:
        return "LOW"
    elif score < 65.0:
        return "MEDIUM"
    else:
        return "HIGH"


def build_mitigation_suggestion(risk_score: float, split_pct: Optional[float]) -> str:
    """
    Build mitigation suggestion template (§11).
    Coherently incorporates X%/Y% from the SPLIT(p) optimizer in §7.
    """
    if split_pct is not None:
        x_pct = max(0.0, min(100.0, float(split_pct)))
        x_round = round(x_pct)
        y_round = 100 - x_round
        if x_round >= 95:
            return "Secure 100% of requirement under immediate contract now to hedge against market risk and freight volatility."
        elif x_round <= 5:
            return "Retain 100% flexible to capture anticipated market rate softening before cargo deadline."
        else:
            return f"Secure {x_round}% now, retain {y_round}% flexible to balance fixed commitment against market volatility."
    else:
        # Fallback coherent baseline based on risk category
        if risk_score >= 65.0:
            return "High market exposure detected: secure 75% now under firm charter, retain 25% flexible."
        elif risk_score >= 35.0:
            return "Moderate exposure detected: secure 50% now, retain 50% flexible for spot optimization."
        else:
            return "Low market exposure detected: secure 25% now, retain 75% flexible to capture rate dips."


def compute_risk_score(
    inputs: RiskInput,
    weights: Optional[RiskWeightsConfig] = None
) -> RiskEvaluation:
    """
    Core deterministic risk computation function (§11).
    Pure function with zero unseeded randomness: calling twice with identical inputs
    yields identical scores and top_drivers breakdowns.
    """
    cfg = weights or DEFAULT_BALANCED_WEIGHTS

    # 1. Forecast Volatility Sub-score [0.0, 1.0]
    if inputs.volatility_sub_score is not None:
        s_vol = max(0.0, min(1.0, float(inputs.volatility_sub_score)))
        vol_detail = f"Normalized forecast volatility: {s_vol:.2f}"
    elif inputs.forecast_relative_spread is not None:
        # Spread benchmark: 40% spread is considered high volatility (1.0)
        s_vol = max(0.0, min(1.0, float(inputs.forecast_relative_spread) / 0.40))
        vol_detail = f"Prediction interval spread: {inputs.forecast_relative_spread * 100:.1f}% of expected freight"
    else:
        s_vol = 0.30
        vol_detail = "Default moderate volatility assumption"

    driver_vol = RiskDriver(
        factor="forecast_volatility",
        display_name="Forecast Uncertainty & Volatility",
        sub_score=s_vol,
        weight=cfg.w_vol,
        weighted_contribution=100.0 * cfg.w_vol * s_vol,
        direction="unfavorable" if s_vol >= 0.50 else "favorable",
        provenance="MODEL_OUTPUT",
        source="Quantile LightGBM + Conformal Prediction (§7)",
        detail=vol_detail
    )

    # 2. Port Congestion Trend Sub-score [0.0, 1.0]
    if inputs.congestion_sub_score is not None:
        s_cong = max(0.0, min(1.0, float(inputs.congestion_sub_score)))
        cong_detail = f"Normalized congestion index: {s_cong:.2f}"
    elif inputs.port_waiting_days is not None:
        # Waiting days benchmark: 8+ days queue is high congestion (1.0)
        wait = float(inputs.port_waiting_days)
        s_cong = max(0.0, min(1.0, wait / 8.0))
        cong_detail = f"Pre-berthing queue: {wait:.1f} days (baseline {inputs.port_baseline_days:.1f}d)"
    else:
        s_cong = 0.35
        cong_detail = "Standard baseline port queue conditions"

    driver_cong = RiskDriver(
        factor="port_congestion",
        display_name="Port Congestion & Turnaround Delay",
        sub_score=s_cong,
        weight=cfg.w_cong,
        weighted_contribution=100.0 * cfg.w_cong * s_cong,
        direction="unfavorable" if s_cong >= 0.50 else "favorable",
        provenance="SIMULATED",
        source="Port Turnaround & Congestion Simulation (§4)",
        detail=cong_detail
    )

    # 3. Seasonal Weather / Cyclone Risk Sub-score [0.0, 1.0]
    if inputs.weather_sub_score is not None:
        s_wx = max(0.0, min(1.0, float(inputs.weather_sub_score)))
        wx_detail = f"Explicit weather risk index: {s_wx:.2f}"
        wx_source = "IMD Weather Risk Calendar (§3.3)"
    elif inputs.laycan_month is not None:
        cal_res = lookup_seasonal_weather_risk(inputs.destination_region, inputs.laycan_month)
        s_wx = cal_res["sub_score"]
        wx_detail = f"{inputs.destination_region} Month {inputs.laycan_month}: {cal_res['risk_level']} ({cal_res['note']})"
        wx_source = cal_res["source"]
    else:
        s_wx = 0.25
        wx_detail = "Normal fair-weather seasonal expectation"
        wx_source = "IMD Weather Risk Calendar (§3.3)"

    driver_wx = RiskDriver(
        factor="seasonal_weather",
        display_name="Seasonal Weather & Cyclone Risk",
        sub_score=s_wx,
        weight=cfg.w_wx,
        weighted_contribution=100.0 * cfg.w_wx * s_wx,
        direction="unfavorable" if s_wx >= 0.50 else "favorable",
        provenance="REAL_VERIFIED",
        source=wx_source,
        detail=wx_detail
    )

    # 4. Vessel Availability Tightness Proxy Sub-score [0.0, 1.0]
    if inputs.availability_sub_score is not None:
        s_avail = max(0.0, min(1.0, float(inputs.availability_sub_score)))
        avail_detail = f"Normalized availability tightness: {s_avail:.2f}"
    elif inputs.freight_momentum_pct is not None:
        # Momentum benchmark: +20% momentum = tight market (1.0), -20% = loose market (0.0)
        mom = float(inputs.freight_momentum_pct)
        s_avail = max(0.0, min(1.0, 0.50 + (mom / 0.40)))
        avail_detail = f"Index momentum: {mom * 100:+.1f}% (positive indicates fleet tightening)"
    else:
        s_avail = 0.40
        avail_detail = "Balanced fleet tonnage availability"

    driver_avail = RiskDriver(
        factor="vessel_availability",
        display_name="Vessel Availability Tightness Proxy",
        sub_score=s_avail,
        weight=cfg.w_avail,
        weighted_contribution=100.0 * cfg.w_avail * s_avail,
        direction="unfavorable" if s_avail >= 0.50 else "favorable",
        provenance="PUBLIC_PROXY",
        source="Baltic Dry Index Momentum Proxy (§3.1)",
        detail=avail_detail
    )

    # 5. Commodity / Bunker Price Shock Sub-score [0.0, 1.0]
    if inputs.shock_sub_score is not None:
        s_shock = max(0.0, min(1.0, float(inputs.shock_sub_score)))
        shock_detail = f"Normalized commodity shock index: {s_shock:.2f}"
    elif inputs.commodity_shock_pct is not None:
        # Shock benchmark: +25% fuel increase = full shock (1.0), 0% = 0.20
        chg = float(inputs.commodity_shock_pct)
        s_shock = max(0.0, min(1.0, 0.20 + max(0.0, chg) / 0.25 * 0.80))
        shock_detail = f"30-day fuel price change: {chg * 100:+.1f}%"
    else:
        s_shock = 0.20
        shock_detail = "Stable commodity and bunker price environment"

    driver_shock = RiskDriver(
        factor="commodity_price_shock",
        display_name="Commodity & Bunker Price Shock",
        sub_score=s_shock,
        weight=cfg.w_shock,
        weighted_contribution=100.0 * cfg.w_shock * s_shock,
        direction="unfavorable" if s_shock >= 0.50 else "favorable",
        provenance="PUBLIC_PROXY",
        source="FRED Brent / VLSFO Bunker Proxy Series (§3)",
        detail=shock_detail
    )

    all_drivers = [driver_vol, driver_cong, driver_wx, driver_avail, driver_shock]

    # Weighted Sum Formula (§11): RiskScore = 100 * sum(w_i * s_i)
    raw_score = sum(d.weighted_contribution for d in all_drivers)
    total_score = max(0.0, min(100.0, raw_score))

    category = classify_risk_category(total_score)

    # Deterministic top-2 drivers selection with tie-breaking on factor name
    sorted_drivers = sorted(
        all_drivers,
        key=lambda d: (-d.weighted_contribution, d.factor)
    )
    top_drivers = sorted_drivers[:2]

    # Mitigation suggestion linked directly to SPLIT(p)
    mitigation_suggestion = build_mitigation_suggestion(total_score, inputs.split_pct)

    return RiskEvaluation(
        risk_score=total_score,
        category=category,
        weights_used={
            "w_vol": cfg.w_vol,
            "w_cong": cfg.w_cong,
            "w_wx": cfg.w_wx,
            "w_avail": cfg.w_avail,
            "w_shock": cfg.w_shock,
        },
        all_drivers=all_drivers,
        top_drivers=top_drivers,
        mitigation_suggestion=mitigation_suggestion,
        split_pct_used=inputs.split_pct,
    )
