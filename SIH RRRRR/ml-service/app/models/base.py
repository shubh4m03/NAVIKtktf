"""Abstract Base Class for forecasting models (Task 6).

All models must implement:
- fit(train_df, target_col, date_col)
- predict_quantiles(horizon, alphas, test_df)
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import pandas as pd


class BaseModel(ABC):
    """Unified interface for point and distributional forecasting models."""

    @abstractmethod
    def fit(
        self,
        train_df: pd.DataFrame,
        target_col: str = "freight_val",
        date_col: str = "date",
        **kwargs,
    ) -> "BaseModel":
        """Fit model strictly on historical training data."""
        pass

    @abstractmethod
    def predict_quantiles(
        self,
        horizon: int,
        alphas: List[float] = [0.05, 0.25, 0.5, 0.75, 0.95],
        test_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """
        Generate multi-horizon quantile forecasts.
        
        Returns DataFrame with:
        - step: 1 to horizon
        - q_{alpha}: forecasted quantile for each alpha in alphas
        - median / prediction: point forecast (median or mean)
        """
        pass
