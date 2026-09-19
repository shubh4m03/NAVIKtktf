"""Evaluation metrics for time-series and probabilistic forecasting (Task 6).

Implements:
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- sMAPE (Symmetric Mean Absolute Percentage Error)
- Pinball Loss (Quantile Loss) across alpha in (0, 1)
- Calibration Coverage (Empirical coverage of prediction intervals)
- Directional Accuracy (Mean Directional Accuracy - MDA)
"""

from typing import Dict, List, Optional, Union
import numpy as np
import pandas as pd


def mae(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series]) -> float:
    """Mean Absolute Error."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    return float(np.mean(np.abs(y_t - y_p)))


def rmse(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series]) -> float:
    """Root Mean Squared Error."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    return float(np.sqrt(np.mean((y_t - y_p) ** 2)))


def smape(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series], eps: float = 1e-8) -> float:
    """
    Symmetric Mean Absolute Percentage Error (in %).
    Formula: (100% / N) * sum(2 * |y - y_hat| / (|y| + |y_hat| + eps))
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    denominator = np.abs(y_t) + np.abs(y_p) + eps
    return float(100.0 * np.mean(2.0 * np.abs(y_t - y_p) / denominator))


def pinball_loss(
    y_true: Union[np.ndarray, pd.Series],
    y_quantile: Union[np.ndarray, pd.Series],
    alpha: float,
) -> float:
    """
    Pinball loss (quantile loss) for a specific target quantile alpha in (0, 1).
    Formula: max(alpha * (y - q), (1 - alpha) * (q - y))
    """
    if not (0.0 < alpha < 1.0):
        raise ValueError(f"alpha must be in (0, 1), got {alpha}")
    y_t = np.asarray(y_true, dtype=float)
    y_q = np.asarray(y_quantile, dtype=float)
    error = y_t - y_q
    loss = np.maximum(alpha * error, (alpha - 1.0) * error)
    return float(np.mean(loss))


def mean_pinball_loss(
    y_true: Union[np.ndarray, pd.Series],
    quantiles_dict: Dict[float, Union[np.ndarray, pd.Series]],
) -> float:
    """
    Mean pinball loss averaged across all evaluated quantiles.
    quantiles_dict: mapping of float alpha -> quantile predictions array.
    """
    losses = [pinball_loss(y_true, q_pred, alpha) for alpha, q_pred in quantiles_dict.items()]
    return float(np.mean(losses)) if losses else 0.0


def calibration_coverage(
    y_true: Union[np.ndarray, pd.Series],
    q_low: Union[np.ndarray, pd.Series],
    q_high: Union[np.ndarray, pd.Series],
) -> float:
    """
    Empirical calibration coverage (fraction of true outcomes falling inside [q_low, q_high]).
    """
    y_t = np.asarray(y_true, dtype=float)
    low = np.asarray(q_low, dtype=float)
    high = np.asarray(q_high, dtype=float)
    inside = (y_t >= low) & (y_t <= high)
    return float(np.mean(inside))


def directional_accuracy(
    y_true: Union[np.ndarray, pd.Series],
    y_pred: Union[np.ndarray, pd.Series],
    y_lag: Optional[Union[np.ndarray, pd.Series]] = None,
) -> float:
    """
    Mean Directional Accuracy (MDA).
    Measures percentage of times forecast correctly predicts the direction of movement.
    If y_lag is None, uses lag-1 of y_true.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    if y_lag is None:
        if len(y_t) < 2:
            return 1.0
        actual_dir = np.sign(y_t[1:] - y_t[:-1])
        pred_dir = np.sign(y_p[1:] - y_t[:-1])
    else:
        lag = np.asarray(y_lag, dtype=float)
        actual_dir = np.sign(y_t - lag)
        pred_dir = np.sign(y_p - lag)

    correct = (actual_dir == pred_dir) | (actual_dir == 0)
    return float(np.mean(correct))


def calculate_all_metrics(
    y_true: Union[np.ndarray, pd.Series],
    y_pred: Union[np.ndarray, pd.Series],
    quantiles_dict: Optional[Dict[float, Union[np.ndarray, pd.Series]]] = None,
    y_lag: Optional[Union[np.ndarray, pd.Series]] = None,
) -> Dict[str, float]:
    """Compute comprehensive dictionary of all benchmark metrics."""
    res = {
        "MAE": round(mae(y_true, y_pred), 4),
        "RMSE": round(rmse(y_true, y_pred), 4),
        "sMAPE": round(smape(y_true, y_pred), 4),
        "MDA": round(directional_accuracy(y_true, y_pred, y_lag), 4),
    }

    if quantiles_dict:
        # Standard pinball loss
        res["Pinball_Loss"] = round(mean_pinball_loss(y_true, quantiles_dict), 4)

        # 50% interval coverage (25th to 75th percentile)
        if 0.25 in quantiles_dict and 0.75 in quantiles_dict:
            res["Coverage_50"] = round(
                calibration_coverage(y_true, quantiles_dict[0.25], quantiles_dict[0.75]), 4
            )

        # 90% interval coverage (5th to 95th percentile)
        if 0.05 in quantiles_dict and 0.95 in quantiles_dict:
            res["Coverage_90"] = round(
                calibration_coverage(y_true, quantiles_dict[0.05], quantiles_dict[0.95]), 4
            )

    return res
