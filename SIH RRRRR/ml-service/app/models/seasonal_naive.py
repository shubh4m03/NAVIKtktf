"""Seasonal Naive Baseline Model (Task 6).

Point forecast: y_hat_{T+h} = y_{T+h - S * ceil(h/S)} from most recent seasonal cycle.
Probabilistic quantiles: Seasonal residual standard deviation scaled with sqrt(cycles).
"""

from typing import List, Optional
import numpy as np
import pandas as pd
from scipy.stats import norm

from app.models.base import BaseModel


class SeasonalNaiveModel(BaseModel):
    """Seasonal persistence baseline repeating the last observed seasonal cycle."""

    def __init__(self, season_length: int = 7):
        self.season_length: int = season_length
        self.last_season_vals: Optional[np.ndarray] = None
        self.residual_std: float = 1.0
        self.target_col: str = "freight_val"

    def fit(
        self,
        train_df: pd.DataFrame,
        target_col: str = "freight_val",
        date_col: str = "date",
        **kwargs,
    ) -> "SeasonalNaiveModel":
        self.target_col = target_col
        series = train_df[target_col].dropna().values
        n = len(series)
        if n < self.season_length:
            raise ValueError(
                f"Training series length ({n}) must be >= seasonal period ({self.season_length})"
            )

        # Store the last S observed values
        self.last_season_vals = series[-self.season_length :]

        # Compute seasonal differences: y_t - y_{t-S}
        if n > self.season_length:
            seasonal_diffs = series[self.season_length :] - series[: -self.season_length]
            self.residual_std = (
                float(np.std(seasonal_diffs))
                if len(seasonal_diffs) > 1 and np.std(seasonal_diffs) > 1e-6
                else 1.0
            )
        else:
            self.residual_std = 1.0

        return self

    def predict_quantiles(
        self,
        horizon: int,
        alphas: List[float] = [0.05, 0.25, 0.5, 0.75, 0.95],
        test_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        if self.last_season_vals is None:
            raise RuntimeError("Model must be fitted before predict_quantiles()")

        steps = np.arange(1, horizon + 1)
        # Replicate seasonal pattern across the forecast horizon
        pattern_indices = (steps - 1) % self.season_length
        point_preds = self.last_season_vals[pattern_indices]

        res = {"step": steps, "prediction": point_preds}

        # Cycles count for variance expansion
        cycle_factors = np.sqrt(np.ceil(steps / self.season_length))

        for alpha in alphas:
            z = norm.ppf(alpha)
            q_vals = point_preds + z * self.residual_std * cycle_factors
            res[f"q_{alpha}"] = q_vals

        return pd.DataFrame(res)
