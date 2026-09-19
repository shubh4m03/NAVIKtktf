"""Quantile LightGBM Model with Quantile Monotonicity Rearrangement (Task 7).

Trains separate gradient boosting models for percentiles [0.05, 0.25, 0.5, 0.75, 0.95]
using LightGBM's native quantile objective (objective='quantile', alpha=alpha).
Implements post-hoc rearrangement (sorting) safeguard to eliminate quantile crossing.
"""

import logging
import warnings
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import lightgbm as lgb

from app.models.base import BaseModel

logger = logging.getLogger("lgbm_quantile")


def rearrange_quantiles(
    quantiles_dict: Dict[float, np.ndarray],
    alphas: List[float],
) -> Dict[float, np.ndarray]:
    """
    Post-hoc quantile rearrangement safeguard (Chernozhukov et al., 2010).
    Sorts predicted quantiles pointwise across alphas to strictly prevent quantile crossing.
    Ensures q_{a_1} <= q_{a_2} <= ... <= q_{a_k} for sorted alphas.
    """
    sorted_alphas = sorted(alphas)
    n_samples = len(quantiles_dict[sorted_alphas[0]])

    # Stack into shape (n_samples, n_alphas)
    stacked = np.column_stack([quantiles_dict[a] for a in sorted_alphas])
    # Pointwise sort across alphas
    sorted_stacked = np.sort(stacked, axis=1)

    rearranged = {}
    for idx, a in enumerate(sorted_alphas):
        rearranged[a] = sorted_stacked[:, idx]

    return rearranged


class QuantileLGBMModel(BaseModel):
    """Multi-quantile LightGBM forecasting model with monotonicity rearrangement."""

    DEFAULT_FEATURE_COLS = [
        "freight_lag_1", "freight_lag_7", "freight_lag_14", "freight_lag_30",
        "freight_rolling_mean_7", "freight_rolling_mean_14", "freight_rolling_mean_30",
        "freight_rolling_std_7", "freight_rolling_std_14", "freight_rolling_std_30",
        "freight_pct_change_7", "freight_pct_change_30",
        "bunker_val", "bunker_lag_1", "bunker_rolling_mean_7",
        "fx_val", "fx_lag_1", "fx_rolling_mean_7",
        "congestion_score", "congestion_lag_1", "congestion_rolling_mean_7",
        "month", "day_of_week", "sin_month", "cos_month", "is_cyclone_season", "is_monsoon_season",
    ]

    def __init__(
        self,
        alphas: List[float] = [0.05, 0.25, 0.5, 0.75, 0.95],
        n_estimators: int = 60,
        learning_rate: float = 0.05,
        num_leaves: int = 15,
        min_child_samples: int = 10,
        random_state: int = 42,
    ):
        self.alphas: List[float] = sorted(alphas)
        self.n_estimators: int = n_estimators
        self.learning_rate: float = learning_rate
        self.num_leaves: int = num_leaves
        self.min_child_samples: int = min_child_samples
        self.random_state: int = random_state

        self.models_: Dict[float, lgb.LGBMRegressor] = {}
        self.feature_cols_: List[str] = []
        self.target_col: str = "freight_val"
        self.last_known_features_: Optional[pd.DataFrame] = None
        self.last_val: float = 1.0

    def _prepare_features(self, df: pd.DataFrame, target_col: str) -> Tuple[pd.DataFrame, pd.Series]:
        """Extract existing features from curated table or engineer minimal lags dynamically."""
        df_copy = df.copy()

        # Identify which standard curated feature columns exist
        available_features = [c for c in self.DEFAULT_FEATURE_COLS if c in df_copy.columns]

        if not available_features:
            # Dynamically compute minimal lags for raw synthetic/standalone series
            s = df_copy[target_col]
            df_copy["lag_1"] = s.shift(1)
            df_copy["lag_7"] = s.shift(7)
            df_copy["roll_mean_7"] = s.rolling(7, min_periods=1).mean()
            df_copy["roll_std_7"] = s.rolling(7, min_periods=2).std().fillna(0.0)
            available_features = ["lag_1", "lag_7", "roll_mean_7", "roll_std_7"]

        self.feature_cols_ = available_features

        # Drop initial rows with NaNs in features
        clean_df = df_copy.dropna(subset=[target_col] + self.feature_cols_)
        X = clean_df[self.feature_cols_]
        y = clean_df[target_col]
        return X, y

    def fit(
        self,
        train_df: pd.DataFrame,
        target_col: str = "freight_val",
        date_col: str = "date",
        **kwargs,
    ) -> "QuantileLGBMModel":
        self.target_col = target_col
        series = train_df[target_col].dropna().values
        if len(series) < 20:
            raise ValueError(f"Need at least 20 observations to train Quantile LightGBM, got {len(series)}")

        self.last_val = float(series[-1])
        self.last_train_tail_ = train_df.tail(20).copy()
        X, y = self._prepare_features(train_df, target_col)

        # Store the most recent row of features for autoregressive rollout
        self.last_known_features_ = X.iloc[-1:].copy()

        # Train a dedicated model for each quantile alpha
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            for alpha in self.alphas:
                model = lgb.LGBMRegressor(
                    objective="quantile",
                    alpha=alpha,
                    n_estimators=self.n_estimators,
                    learning_rate=self.learning_rate,
                    num_leaves=self.num_leaves,
                    min_child_samples=min(self.min_child_samples, max(2, len(X) // 5)),
                    random_state=self.random_state,
                    verbose=-1,
                )
                model.fit(X, y)
                self.models_[alpha] = model

        return self

    def predict_quantiles(
        self,
        horizon: int,
        alphas: Optional[List[float]] = None,
        test_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        if not self.models_:
            raise RuntimeError("Model must be fitted before predict_quantiles()")

        target_alphas = sorted(alphas) if alphas else self.alphas
        steps = np.arange(1, horizon + 1)

        # If test_df contains precomputed features, use them directly
        if test_df is not None and all(c in test_df.columns for c in self.feature_cols_):
            X_test = test_df[self.feature_cols_].iloc[:horizon].ffill().bfill()
            if len(X_test) < horizon:
                last_row = X_test.iloc[-1:]
                pad = pd.concat([last_row] * (horizon - len(X_test)), ignore_index=True)
                X_test = pd.concat([X_test, pad], ignore_index=True)
        elif test_df is not None and self.target_col in test_df.columns:
            # Dynamically compute features using the tail of training data + test_df
            combined = pd.concat([self.last_train_tail_, test_df], ignore_index=True)
            X_comb, _ = self._prepare_features(combined, self.target_col)
            # Take the test rows
            X_test = X_comb.iloc[-len(test_df) :].iloc[:horizon]
            if len(X_test) < horizon:
                last_row = X_test.iloc[-1:] if len(X_test) > 0 else self.last_known_features_
                pad = pd.concat([last_row] * (horizon - len(X_test)), ignore_index=True)
                X_test = pd.concat([X_test, pad], ignore_index=True)
        else:
            # Fall back to repeating the last observed feature state
            X_test = pd.concat([self.last_known_features_] * horizon, ignore_index=True)

        # Predict raw quantiles
        raw_quantiles = {}
        for a in target_alphas:
            if a in self.models_:
                raw_quantiles[a] = self.models_[a].predict(X_test)
            else:
                # Fallback interpolation if custom alpha requested
                closest_a = min(self.alphas, key=lambda x: abs(x - a))
                raw_quantiles[a] = self.models_[closest_a].predict(X_test)

        # Apply post-hoc rearrangement safeguard to enforce monotonicity
        rearranged = rearrange_quantiles(raw_quantiles, target_alphas)

        # Median (0.50) is the primary point forecast
        median_pred = rearranged[0.5] if 0.5 in rearranged else rearranged[target_alphas[len(target_alphas) // 2]]

        res = {"step": steps, "prediction": median_pred}
        for a in target_alphas:
            res[f"q_{a}"] = rearranged[a]

        return pd.DataFrame(res)
