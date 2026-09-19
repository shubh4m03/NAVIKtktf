"""Naive (Last-Value Persistence) Baseline Model (Task 6).

Point forecast: y_hat_{T+h} = y_T for all h.
Probabilistic quantiles: Random walk variance growth sigma * sqrt(h).
"""

from typing import List, Optional
import numpy as np
import pandas as pd
from scipy.stats import norm

from app.models.base import BaseModel


class NaiveModel(BaseModel):
    """Last-value persistence baseline with random walk error expansion."""

    def __init__(self):
        self.last_val: Optional[float] = None
        self.residual_std: float = 1.0
        self.target_col: str = "freight_val"

    def fit(
        self,
        train_df: pd.DataFrame,
        target_col: str = "freight_val",
        date_col: str = "date",
        **kwargs,
    ) -> "NaiveModel":
        self.target_col = target_col
        series = train_df[target_col].dropna().values
        if len(series) == 0:
            raise ValueError("Training series is empty")

        self.last_val = float(series[-1])

        # Compute standard deviation of 1-step differences
        diffs = np.diff(series)
        self.residual_std = float(np.std(diffs)) if len(diffs) > 1 and np.std(diffs) > 1e-6 else 1.0
        return self

    def predict_quantiles(
        self,
        horizon: int,
        alphas: List[float] = [0.05, 0.25, 0.5, 0.75, 0.95],
        test_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        if self.last_val is None:
            raise RuntimeError("Model must be fitted before predict_quantiles()")

        steps = np.arange(1, horizon + 1)
        res = {"step": steps, "prediction": np.full(horizon, self.last_val)}

        for alpha in alphas:
            z = norm.ppf(alpha)
            # Variance expands with sqrt(h)
            q_vals = self.last_val + z * self.residual_std * np.sqrt(steps)
            res[f"q_{alpha}"] = q_vals

        return pd.DataFrame(res)
