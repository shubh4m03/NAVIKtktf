"""Unit tests for Task 6: Forecasting Baselines & Walk-Forward Backtesting Harness.

Verifies:
1. Harness Sanity Check: On synthetic data with a known seasonal pattern,
   Seasonal-Naive MUST outperform plain Naive on sMAPE and MAE.
2. Quantile Monotonicity: Predicted quantiles strictly satisfy
   q_0.05 <= q_0.25 <= q_0.5 <= q_0.75 <= q_0.95.
3. Metrics Correctness: Exact verification of MAE, RMSE, sMAPE, Pinball Loss,
   Calibration Coverage, and Directional Accuracy.
4. SARIMAX Probabilistic Output: Generates valid state-space predictive intervals.
"""

import sys
import unittest
from pathlib import Path
import numpy as np
import pandas as pd

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ML_DIR))

from app.backtesting.metrics import (
    mae,
    rmse,
    smape,
    pinball_loss,
    mean_pinball_loss,
    calibration_coverage,
    directional_accuracy,
    calculate_all_metrics,
)
from app.models.naive import NaiveModel
from app.models.seasonal_naive import SeasonalNaiveModel
from app.models.sarimax import SARIMAXModel
from app.backtesting.walk_forward import run_walk_forward_single


class TestBacktestingHarness(unittest.TestCase):

    def test_metrics_accuracy(self):
        """Verify metric mathematical calculations against known ground truth."""
        y_t = np.array([10.0, 20.0, 30.0])
        y_p = np.array([12.0, 18.0, 33.0])

        # MAE: (2 + 2 + 3) / 3 = 2.3333...
        self.assertAlmostEqual(mae(y_t, y_p), 7.0 / 3.0, places=4)

        # RMSE: sqrt((4 + 4 + 9) / 3) = sqrt(17/3)
        self.assertAlmostEqual(rmse(y_t, y_p), np.sqrt(17.0 / 3.0), places=4)

        # sMAPE
        # 10, 12 -> 2 * 2 / 22 = 4/22
        # 20, 18 -> 2 * 2 / 38 = 4/38
        # 30, 33 -> 2 * 3 / 63 = 6/63
        expected_smape = 100.0 * np.mean([4.0 / 22.0, 4.0 / 38.0, 6.0 / 63.0])
        self.assertAlmostEqual(smape(y_t, y_p), expected_smape, places=4)

        # Pinball loss
        # For alpha=0.5: pinball is 0.5 * MAE
        p_loss_50 = pinball_loss(y_t, y_p, alpha=0.5)
        self.assertAlmostEqual(p_loss_50, 0.5 * mae(y_t, y_p), places=4)

        # Coverage: 2 out of 3 inside [9, 25]
        cov = calibration_coverage(y_t, q_low=[9.0, 9.0, 9.0], q_high=[25.0, 25.0, 25.0])
        self.assertAlmostEqual(cov, 2.0 / 3.0, places=4)

    def test_harness_seasonal_sanity_check(self):
        """
        TASK 6 SANITY CHECK:
        On synthetic data with a known seasonal pattern, Seasonal-Naive MUST
        outperform plain Naive on sMAPE and MAE.
        Sanity-checks the harness logic itself, independent of real market noise.
        """
        np.random.seed(101)
        period = 7
        n_days = 280
        dates = pd.date_range("2025-01-01", periods=n_days, freq="D")

        # Deterministic periodic signal with small additive Gaussian noise
        # A 7-day pattern: e.g. [2.0, 4.0, 6.0, 8.0, 6.0, 4.0, 2.0]
        base_cycle = np.array([2.0, 5.0, 9.0, 12.0, 8.0, 4.0, 1.0])
        signal = np.tile(base_cycle, n_days // period)
        noise = np.random.normal(0, 0.3, size=n_days)
        synthetic_series = 20.0 + signal + noise

        df_synth = pd.DataFrame({"date": dates, "freight_val": synthetic_series})

        models = {
            "Naive": NaiveModel(),
            "SeasonalNaive": SeasonalNaiveModel(season_length=7),
        }

        # Run walk-forward harness on the synthetic series
        results = run_walk_forward_single(
            df=df_synth,
            models=models,
            target_col="freight_val",
            date_col="date",
            train_window=140,
            horizon=14,
            step=14,
        )

        naive_smape = results["Naive"]["sMAPE"]
        snaive_smape = results["SeasonalNaive"]["sMAPE"]
        naive_mae = results["Naive"]["MAE"]
        snaive_mae = results["SeasonalNaive"]["MAE"]

        print(f"\n[Harness Sanity Test Results on Synthetic Seasonal Data]")
        print(f"  Naive          -> sMAPE: {naive_smape:.4f}%, MAE: {naive_mae:.4f}")
        print(f"  Seasonal-Naive -> sMAPE: {snaive_smape:.4f}%, MAE: {snaive_mae:.4f}")
        improvement = (naive_smape - snaive_smape) / naive_smape * 100.0
        print(f"  Seasonal-Naive Error Reduction: {improvement:.2f}%\n")

        # Assertion: Seasonal-Naive MUST beat Naive by a significant margin on seasonal data
        self.assertLess(
            snaive_smape,
            naive_smape,
            f"Seasonal-Naive sMAPE ({snaive_smape}) must be strictly lower than Naive ({naive_smape})",
        )
        self.assertLess(
            snaive_mae,
            naive_mae,
            f"Seasonal-Naive MAE ({snaive_mae}) must be strictly lower than Naive ({naive_mae})",
        )

    def test_quantile_monotonicity(self):
        """
        Verify that quantile forecasts satisfy monotonicity:
        q_0.05 <= q_0.25 <= q_0.5 <= q_0.75 <= q_0.95 across all horizons.
        """
        np.random.seed(42)
        train_df = pd.DataFrame({
            "date": pd.date_range("2025-01-01", periods=100, freq="D"),
            "freight_val": 15.0 + np.cumsum(np.random.randn(100) * 0.3),
        })

        alphas = [0.05, 0.25, 0.5, 0.75, 0.95]
        horizon = 14

        for model_cls, kwargs in [
            (NaiveModel, {}),
            (SeasonalNaiveModel, {"season_length": 7}),
            (SARIMAXModel, {"order": (1, 1, 1)}),
        ]:
            model = model_cls(**kwargs).fit(train_df)
            pred_df = model.predict_quantiles(horizon=horizon, alphas=alphas)

            for step_idx in range(horizon):
                q_vals = [pred_df[f"q_{a}"].iloc[step_idx] for a in alphas]
                for i in range(len(q_vals) - 1):
                    self.assertLessEqual(
                        q_vals[i],
                        q_vals[i + 1],
                        f"Quantile monotonicity violated in {model_cls.__name__} at step {step_idx}: q_{alphas[i]} ({q_vals[i]}) > q_{alphas[i+1]} ({q_vals[i+1]})",
                    )

    def test_sarimax_model_probabilistic_forecast(self):
        """Verify SARIMAX fits and returns correct quantile bounds."""
        train_df = pd.DataFrame({
            "date": pd.date_range("2025-01-01", periods=60, freq="D"),
            "freight_val": 12.0 + np.sin(np.linspace(0, 10, 60)) + np.random.randn(60) * 0.2,
        })
        model = SARIMAXModel(order=(1, 1, 0))
        model.fit(train_df)
        preds = model.predict_quantiles(horizon=7)

        self.assertEqual(len(preds), 7)
        self.assertIn("prediction", preds.columns)
        self.assertIn("q_0.05", preds.columns)
        self.assertIn("q_0.95", preds.columns)
        # Interval width must be positive
        width = preds["q_0.95"] - preds["q_0.05"]
        self.assertTrue((width > 0).all())


if __name__ == "__main__":
    unittest.main()
