"""Unit tests for Task 7: Quantile LightGBM & Split-Conformal Calibration.

Verifies:
1. Quantile Monotonicity: Predicted quantiles strictly satisfy
   q_0.05 <= q_0.25 <= q_0.5 <= q_0.75 <= q_0.95 across all prediction horizons.
2. Quantile Crossing Safeguard: Deliberately out-of-order raw quantiles are
   rearranged by rearrange_quantiles() into strictly non-decreasing order.
3. Conformal Calibration on Synthetic Data:
   Tests ConformalQuantileModel on a known synthetic distribution and verifies
   empirical coverage on held-out test data meets or exceeds the nominal 90% level (within tolerance).
4. Multi-horizon forecast shape: Horizon H produces exactly H rows with all quantiles present.
"""

import sys
import unittest
from pathlib import Path
import numpy as np
import pandas as pd

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ML_DIR))

from app.models.lgbm_quantile import QuantileLGBMModel, rearrange_quantiles
from app.models.conformal import ConformalQuantileModel
from app.backtesting.metrics import calibration_coverage, pinball_loss


class TestQuantileAndConformal(unittest.TestCase):

    def setUp(self):
        np.random.seed(42)
        n = 180
        dates = pd.date_range("2025-01-01", periods=n, freq="D")
        # Stationary mean-reverting process with seasonal cycle and Gaussian noise
        y = np.zeros(n)
        y[0] = 12.0
        for t in range(1, n):
            y[t] = 0.75 * y[t - 1] + 3.0 * np.sin(2 * np.pi * t / 7.0) + np.random.normal(0, 0.4)

        self.df = pd.DataFrame({"date": dates, "freight_val": y})
        self.alphas = [0.05, 0.25, 0.5, 0.75, 0.95]

    def test_rearrangement_safeguard_fixes_quantile_crossing(self):
        """
        UNIT TEST: Quantile Crossing Safeguard.
        Deliberately introduce crossing quantiles (e.g., q_0.05 > q_0.25, q_0.75 > q_0.95)
        and verify that rearrange_quantiles() strictly restores monotonicity.
        """
        # Intentionally crossed/inverted quantile arrays
        raw_crossing_dict = {
            0.05: np.array([15.0, 12.0, 20.0]),
            0.25: np.array([13.0, 14.0, 18.0]),  # 13.0 < 15.0 -> Crossing!
            0.50: np.array([14.0, 15.0, 19.0]),
            0.75: np.array([17.0, 18.0, 22.0]),
            0.95: np.array([16.0, 20.0, 21.0]),  # 16.0 < 17.0 -> Crossing!
        }

        # Check that crossing indeed exists in the raw input
        has_initial_crossing = (raw_crossing_dict[0.05] > raw_crossing_dict[0.25]).any() or (
            raw_crossing_dict[0.75] > raw_crossing_dict[0.95]
        ).any()
        self.assertTrue(has_initial_crossing, "Test fixture must contain intentional crossing")

        # Apply rearrangement safeguard
        fixed = rearrange_quantiles(raw_crossing_dict, self.alphas)

        # Assert strict monotonicity across all samples: q_0.05 <= q_0.25 <= q_0.5 <= q_0.75 <= q_0.95
        for i in range(3):
            q_vals = [fixed[a][i] for a in self.alphas]
            for j in range(len(q_vals) - 1):
                self.assertLessEqual(
                    q_vals[j],
                    q_vals[j + 1],
                    f"Quantile monotonicity violated after rearrangement at sample {i}: {q_vals}",
                )

        # Confirm exact sorted order for sample 0: [15, 13, 14, 17, 16] -> [13, 14, 15, 16, 17]
        np.testing.assert_array_equal(
            [fixed[a][0] for a in self.alphas],
            [13.0, 14.0, 15.0, 16.0, 17.0],
        )

    def test_lgbm_quantile_monotonicity(self):
        """
        UNIT TEST: Assert Quantile LightGBM output satisfies quantile monotonicity:
        q_0.05 <= q_0.25 <= q_0.5 <= q_0.75 <= q_0.95 for every forecast step.
        """
        train_df = self.df.iloc[:120]
        model = QuantileLGBMModel(
            alphas=self.alphas,
            n_estimators=30,
            learning_rate=0.05,
            random_state=42,
        ).fit(train_df)

        horizon = 14
        preds = model.predict_quantiles(horizon=horizon, alphas=self.alphas)

        self.assertEqual(len(preds), horizon)
        for step_idx in range(horizon):
            q_vals = [preds[f"q_{a}"].iloc[step_idx] for a in self.alphas]
            for j in range(len(q_vals) - 1):
                self.assertLessEqual(
                    q_vals[j],
                    q_vals[j + 1],
                    f"Quantile crossing detected in LGBM at step {step_idx}: q_{self.alphas[j]} ({q_vals[j]}) > q_{self.alphas[j+1]} ({q_vals[j+1]})",
                )

    def test_split_conformal_calibration_coverage(self):
        """
        CALIBRATION TEST:
        Fit ConformalQuantileModel on synthetic data with known Gaussian distribution.
        Assert that the empirical coverage on held-out test data achieves valid coverage
        (close to nominal 90% interval [0.05, 0.95] ± reasonable statistical tolerance).
        """
        train_df = self.df.iloc[:110]
        test_df = self.df.iloc[110:130]
        y_test = test_df["freight_val"].values

        # Base quantile model
        base_lgbm = QuantileLGBMModel(
            alphas=self.alphas,
            n_estimators=30,
            learning_rate=0.05,
            random_state=42,
        )

        # Wrap with split-conformal calibration
        conformal_model = ConformalQuantileModel(
            base_model=base_lgbm,
            cal_fraction=0.25,
            alphas=self.alphas,
        ).fit(train_df)

        preds = conformal_model.predict_quantiles(
            horizon=len(test_df),
            alphas=self.alphas,
            test_df=test_df,
        )

        q05 = preds["q_0.05"].values
        q95 = preds["q_0.95"].values

        # Verify monotonicity of conformal outputs
        for step_idx in range(len(test_df)):
            q_vals = [preds[f"q_{a}"].iloc[step_idx] for a in self.alphas]
            for j in range(len(q_vals) - 1):
                self.assertLessEqual(q_vals[j], q_vals[j + 1])

        # Compute empirical 90% coverage
        emp_coverage_90 = calibration_coverage(y_test, q05, q95)
        print(f"\n[Conformal Calibration Test on Synthetic Data]")
        print(f"  Nominal Coverage Target : 90.0%")
        print(f"  Empirical 90% Coverage  : {emp_coverage_90 * 100.0:.1f}%")
        print(f"  Conformal 90% Adjustment: {conformal_model.q_adjustment_90:.4f}")

        # The 90% interval should cover at least 70% and at most 100% on a finite 20-sample test set
        self.assertGreaterEqual(
            emp_coverage_90,
            0.70,
            f"Empirical coverage {emp_coverage_90:.2f} is significantly below nominal 0.90",
        )


if __name__ == "__main__":
    unittest.main()
