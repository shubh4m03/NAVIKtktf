"""Statistical SARIMAX Forecasting Model (Task 6).

Implements Seasonal AutoRegressive Integrated Moving Average with eXogenous variables (SARIMAX)
using statsmodels. Provides analytical probabilistic quantile distributions directly
from the Gaussian state-space predictive distribution.
"""

import logging
import warnings
from typing import List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.stats import norm
import statsmodels.api as sm

from app.models.base import BaseModel

logger = logging.getLogger("sarimax_model")


class SARIMAXModel(BaseModel):
    """SARIMAX statistical baseline model with native state-space probabilistic intervals."""

    def __init__(
        self,
        order: Tuple[int, int, int] = (1, 1, 1),
        seasonal_order: Tuple[int, int, int, int] = (0, 0, 0, 0),
        exog_cols: Optional[List[str]] = None,
    ):
        self.order: Tuple[int, int, int] = order
        self.seasonal_order: Tuple[int, int, int, int] = seasonal_order
        self.exog_cols: List[str] = exog_cols or []
        self.fitted_res_ = None
        self.last_val: Optional[float] = None
        self.residual_std: float = 1.0
        self.target_col: str = "freight_val"

    def fit(
        self,
        train_df: pd.DataFrame,
        target_col: str = "freight_val",
        date_col: str = "date",
        **kwargs,
    ) -> "SARIMAXModel":
        self.target_col = target_col
        y_train = train_df[target_col].dropna().values
        if len(y_train) < 10:
            raise ValueError(f"Need at least 10 observations to fit SARIMAX, got {len(y_train)}")

        self.last_val = float(y_train[-1])
        diffs = np.diff(y_train)
        self.residual_std = float(np.std(diffs)) if len(diffs) > 1 and np.std(diffs) > 1e-6 else 1.0

        # Handle exogenous variables if specified and present
        exog_train = None
        if self.exog_cols and all(col in train_df.columns for col in self.exog_cols):
            exog_train = train_df[self.exog_cols].ffill().bfill().values

        # Suppress convergence and optimization warnings during automated fitting
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                model = sm.tsa.statespace.SARIMAX(
                    y_train,
                    exog=exog_train,
                    order=self.order,
                    seasonal_order=self.seasonal_order,
                    enforce_stationarity=False,
                    enforce_invertibility=False,
                )
                self.fitted_res_ = model.fit(disp=False, maxiter=50)
            except Exception as e:
                logger.warning(f"Primary SARIMAX{self.order} failed ({e}), falling back to AR(1)")
                try:
                    fallback_model = sm.tsa.statespace.SARIMAX(
                        y_train,
                        order=(1, 1, 0),
                        enforce_stationarity=False,
                        enforce_invertibility=False,
                    )
                    self.fitted_res_ = fallback_model.fit(disp=False, maxiter=30)
                except Exception as e_fb:
                    logger.warning(f"Fallback AR(1) failed ({e_fb}), will use random walk heuristic")
                    self.fitted_res_ = None

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

        exog_test = None
        if (
            self.exog_cols
            and test_df is not None
            and all(col in test_df.columns for col in self.exog_cols)
        ):
            exog_test = test_df[self.exog_cols].iloc[:horizon].ffill().bfill().values

        if self.fitted_res_ is not None:
            try:
                forecast = self.fitted_res_.get_forecast(steps=horizon, exog=exog_test)
                point_preds = np.asarray(forecast.predicted_mean)
                se_preds = np.asarray(forecast.se_mean)
                # Safeguard against negative or NaN standard errors
                se_preds = np.nan_to_num(se_preds, nan=self.residual_std)
                se_preds = np.maximum(se_preds, 1e-4)

                res = {"step": steps, "prediction": point_preds}
                for alpha in alphas:
                    z = norm.ppf(alpha)
                    res[f"q_{alpha}"] = point_preds + z * se_preds

                return pd.DataFrame(res)
            except Exception as e:
                logger.warning(f"SARIMAX get_forecast error ({e}), using random walk error bounds")

        # Robust analytical fallback
        point_preds = np.full(horizon, self.last_val)
        res = {"step": steps, "prediction": point_preds}
        for alpha in alphas:
            z = norm.ppf(alpha)
            res[f"q_{alpha}"] = point_preds + z * self.residual_std * np.sqrt(steps)

        return pd.DataFrame(res)
