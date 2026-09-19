"""Split-Conformal Calibration Wrapper for Quantile Forecasting (Task 7).

Implements Conformalized Quantile Regression (CQR) (Romano, Patterson, Candès, 2019).
Wraps any quantile model with a held-out calibration split to guarantee valid empirical coverage.
Computes non-conformity scores:
    E_i = max(q_low(x_i) - y_i, y_i - q_high(x_i))
and expands/contracts predicted intervals by the empirical (1 - alpha) quantile of calibration errors:
    [q_low - Q_{1-alpha}(E), q_high + Q_{1-alpha}(E)]
"""

import logging
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from app.models.base import BaseModel
from app.models.lgbm_quantile import QuantileLGBMModel, rearrange_quantiles

logger = logging.getLogger("conformal_calibration")


class ConformalQuantileModel(BaseModel):
    """
    Split-conformal prediction wrapper over quantile forecasting models.
    Guarantees finite-sample coverage at nominal levels (e.g., 50% and 90%).
    """

    def __init__(
        self,
        base_model: Optional[BaseModel] = None,
        cal_fraction: float = 0.20,
        alphas: List[float] = [0.05, 0.25, 0.5, 0.75, 0.95],
    ):
        self.base_model = base_model or QuantileLGBMModel(alphas=alphas)
        self.cal_fraction = cal_fraction
        self.alphas = sorted(alphas)

        # Calibrated non-conformity adjustments for nominal intervals
        self.q_adjustment_90: float = 0.0  # for [0.05, 0.95]
        self.q_adjustment_50: float = 0.0  # for [0.25, 0.75]
        self.n_cal_samples: int = 0

    def fit(
        self,
        train_df: pd.DataFrame,
        target_col: str = "freight_val",
        date_col: str = "date",
        **kwargs,
    ) -> "ConformalQuantileModel":
        n = len(train_df)
        if n < 30:
            # For small series, fit base model directly without calibration split
            self.base_model.fit(train_df, target_col=target_col, date_col=date_col, **kwargs)
            self.q_adjustment_90 = 0.0
            self.q_adjustment_50 = 0.0
            return self

        # Chronological split: train on earlier data, calibrate on later data (zero lookahead)
        n_cal = max(10, int(n * self.cal_fraction))
        train_split = train_df.iloc[:-n_cal].copy()
        cal_split = train_df.iloc[-n_cal:].copy()
        self.n_cal_samples = n_cal

        # 1. Fit base model on proper training split
        self.base_model.fit(train_split, target_col=target_col, date_col=date_col, **kwargs)

        # 2. Generate predictions on held-out calibration split
        cal_preds = self.base_model.predict_quantiles(
            horizon=len(cal_split),
            alphas=self.alphas,
            test_df=cal_split,
        )

        y_cal = cal_split[target_col].values
        q05 = cal_preds["q_0.05"].values if "q_0.05" in cal_preds.columns else None
        q95 = cal_preds["q_0.95"].values if "q_0.95" in cal_preds.columns else None
        q25 = cal_preds["q_0.25"].values if "q_0.25" in cal_preds.columns else None
        q75 = cal_preds["q_0.75"].values if "q_0.75" in cal_preds.columns else None

        # 3. Compute CQR non-conformity scores
        # For 90% interval (nominal alpha = 0.10)
        if q05 is not None and q95 is not None:
            # E_i = max(q05 - y, y - q95)
            # Positive when y is outside [q05, q95]
            scores_90 = np.maximum(q05 - y_cal, y_cal - q95)
            # Finite-sample quantile: ceil((n+1)(1-alpha)) / n
            k_90 = int(np.ceil((n_cal + 1) * 0.90))
            k_90 = min(max(1, k_90), n_cal)
            self.q_adjustment_90 = float(np.sort(scores_90)[k_90 - 1])
        else:
            self.q_adjustment_90 = 0.0

        # For 50% interval (nominal alpha = 0.50)
        if q25 is not None and q75 is not None:
            scores_50 = np.maximum(q25 - y_cal, y_cal - q75)
            k_50 = int(np.ceil((n_cal + 1) * 0.50))
            k_50 = min(max(1, k_50), n_cal)
            self.q_adjustment_50 = float(np.sort(scores_50)[k_50 - 1])
        else:
            self.q_adjustment_50 = 0.0

        return self

    def predict_quantiles(
        self,
        horizon: int,
        alphas: Optional[List[float]] = None,
        test_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        target_alphas = sorted(alphas) if alphas else self.alphas

        # Get base model quantiles
        preds = self.base_model.predict_quantiles(
            horizon=horizon, alphas=target_alphas, test_df=test_df
        )

        # Apply conformal adjustments
        calibrated_dict = {}
        for a in target_alphas:
            col = f"q_{a}"
            if col in preds.columns:
                calibrated_dict[a] = preds[col].values.copy()

        # Adjust 90% interval bounds
        if 0.05 in calibrated_dict and 0.95 in calibrated_dict:
            calibrated_dict[0.05] = calibrated_dict[0.05] - self.q_adjustment_90
            calibrated_dict[0.95] = calibrated_dict[0.95] + self.q_adjustment_90

        # Adjust 50% interval bounds
        if 0.25 in calibrated_dict and 0.75 in calibrated_dict:
            calibrated_dict[0.25] = calibrated_dict[0.25] - self.q_adjustment_50
            calibrated_dict[0.75] = calibrated_dict[0.75] + self.q_adjustment_50

        # Re-enforce monotonicity post-adjustment
        rearranged = rearrange_quantiles(calibrated_dict, target_alphas)

        res = {"step": preds["step"], "prediction": preds["prediction"]}
        for a in target_alphas:
            res[f"q_{a}"] = rearranged[a]

        return pd.DataFrame(res)
