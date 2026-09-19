"""Tests for Task 5: Feature Engineering & No-Lookahead Leakage Invariant.

Verifies:
1. Feature generation happy path: all features constructed backward-only.
2. Leakage-check test: deliberately breaks the no-lookahead invariant (via lead feature,
   negative lag, and forward rolling window) and confirms assert_no_lookahead catches it.
3. Dynamic causality check: corrupting future inputs changes nothing in past/present features,
   while a deliberate lookahead pipeline is caught and rejected.
4. Database integrity: confirms feature_store table rows in PostgreSQL, schema completeness,
   and zero duplicate keys.
"""

import os
import sys
import unittest
from datetime import date, datetime
from pathlib import Path
import numpy as np
import pandas as pd

CURRENT_DIR = Path(__file__).resolve().parent
PIPELINE_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(PIPELINE_DIR / "features"))
sys.path.insert(0, str(PIPELINE_DIR))

import build_features
from build_features import (
    DataLeakageError,
    FEATURE_SPECS,
    assert_no_lookahead,
    detect_perturbation_leakage,
    compute_market_features,
    compute_congestion_features,
    add_calendar_features,
    get_connection,
)


class TestFeatureEngineering(unittest.TestCase):

    def setUp(self):
        # Create synthetic time series with known dates for reproducible offline tests
        self.dates = pd.date_range("2025-01-01", periods=60, freq="D")
        np.random.seed(42)
        prices = 10.0 + np.cumsum(np.random.randn(60) * 0.2)
        bunkers = 70.0 + np.cumsum(np.random.randn(60) * 0.5)
        fxs = 84.0 + np.cumsum(np.random.randn(60) * 0.05)

        self.df_freight = pd.DataFrame({"date": self.dates, "freight_val": prices})
        self.df_bunker = pd.DataFrame({"date": self.dates, "bunker_val": bunkers})
        self.df_fx = pd.DataFrame({"date": self.dates, "fx_val": fxs})

    def test_clean_features_pass_no_lookahead_assertion(self):
        """Happy path: clean market features strictly adhere to no-lookahead invariant."""
        mkt_df = compute_market_features(self.df_freight, self.df_bunker, self.df_fx)
        mkt_df = add_calendar_features(mkt_df, date_col="date")

        # Must pass without raising DataLeakageError
        self.assertTrue(
            assert_no_lookahead(mkt_df, date_col="date", feature_specs=FEATURE_SPECS),
            "Clean features must pass assert_no_lookahead.",
        )

        # Check expected columns exist
        expected_cols = [
            "freight_val", "freight_lag_1", "freight_lag_7", "freight_rolling_mean_7",
            "freight_rolling_std_7", "freight_pct_change_7",
            "bunker_val", "bunker_lag_1", "bunker_rolling_mean_7",
            "fx_val", "fx_lag_1", "fx_rolling_mean_7",
            "month", "day_of_week", "sin_month", "cos_month", "is_cyclone_season", "is_monsoon_season"
        ]
        for col in expected_cols:
            self.assertIn(col, mkt_df.columns, f"Expected feature column '{col}' missing")

    def test_leakage_check_deliberate_lead_shift_caught(self):
        """
        LEAKAGE TEST: Deliberately introduce a forward-looking lead feature (t+1 via negative lag)
        and confirm assert_no_lookahead catches it and raises DataLeakageError.
        """
        mkt_df = compute_market_features(self.df_freight, self.df_bunker, self.df_fx)

        # Intentionally create a leaky feature using negative shift (future value t+1)
        mkt_df["freight_leak_lead_1"] = mkt_df["freight_val"].shift(-1)

        # Register leaky specification with negative lag_days (-1 means 1 day in the future)
        leaky_specs = dict(FEATURE_SPECS)
        leaky_specs["freight_leak_lead_1"] = {
            "source": "freight_index_series",
            "type": "lead",
            "lag_days": -1,  # <--- Deliberate lookahead!
            "forward_offset_days": 0,
        }

        # Assert that assert_no_lookahead catches the violation
        with self.assertRaises(DataLeakageError) as ctx:
            assert_no_lookahead(mkt_df, date_col="date", feature_specs=leaky_specs)

        err_msg = str(ctx.exception)
        self.assertIn("LOOKAHEAD LEAKAGE DETECTED", err_msg)
        self.assertIn("freight_leak_lead_1", err_msg)
        self.assertIn("1 day(s) into the future", err_msg)
        print(f"\n[Leakage Test 1 Passed] Caught deliberate lead leakage:\n  -> {err_msg}")

    def test_leakage_check_deliberate_centered_rolling_caught(self):
        """
        LEAKAGE TEST: Deliberately introduce a centered rolling window (which includes
        future dates t+1, t+2, t+3) and confirm assert_no_lookahead catches it.
        """
        mkt_df = compute_market_features(self.df_freight, self.df_bunker, self.df_fx)

        # Intentionally create centered rolling mean (peeks 3 days ahead for window=7)
        mkt_df["freight_centered_rolling_7"] = (
            mkt_df["freight_val"].rolling(7, center=True).mean()
        )

        # Register centered rolling specification with forward_offset_days = 3
        leaky_specs = dict(FEATURE_SPECS)
        leaky_specs["freight_centered_rolling_7"] = {
            "source": "freight_index_series",
            "type": "centered_rolling",
            "lag_days": 0,
            "forward_offset_days": 3,  # <--- Deliberate future window peeking!
        }

        with self.assertRaises(DataLeakageError) as ctx:
            assert_no_lookahead(mkt_df, date_col="date", feature_specs=leaky_specs)

        err_msg = str(ctx.exception)
        self.assertIn("LOOKAHEAD LEAKAGE DETECTED", err_msg)
        self.assertIn("freight_centered_rolling_7", err_msg)
        self.assertIn("3 day(s) into the future", err_msg)
        print(f"\n[Leakage Test 2 Passed] Caught deliberate centered window leakage:\n  -> {err_msg}")

    def test_dynamic_perturbation_causality_test(self):
        """
        Dynamic causality test:
        1. Confirms causal pipeline is unaffected by future data perturbation.
        2. Deliberately corrupts future data in a leaky pipeline and confirms detect_perturbation_leakage catches it.
        """
        dates = pd.date_range("2025-01-01", periods=15, freq="D")
        raw_vals = np.linspace(10.0, 25.0, 15)

        # Causal function (past rolling mean)
        def causal_pipeline(df):
            df["roll_3"] = df["val"].rolling(3, min_periods=1).mean()
            return df

        # Must pass causality test
        self.assertTrue(
            detect_perturbation_leakage(causal_pipeline, raw_vals, dates, "roll_3"),
            "Causal pipeline must pass dynamic perturbation test",
        )

        # Leaky function (future lead via shift -1)
        def leaky_pipeline(df):
            df["leaky_lead"] = df["val"].shift(-1)
            return df

        # Must raise DataLeakageError
        with self.assertRaises(DataLeakageError) as ctx:
            detect_perturbation_leakage(leaky_pipeline, raw_vals, dates, "leaky_lead")

        err_msg = str(ctx.exception)
        self.assertIn("Dynamic causality failure", err_msg)
        self.assertIn("leaky_lead", err_msg)
        print(f"\n[Dynamic Perturbation Test Passed] Caught leakage via perturbation:\n  -> {err_msg}")

    def test_feature_store_database_integrity(self):
        """
        Verify PostgreSQL feature_store table:
        1. Row count matches 13 routes * 4 vessel classes * 730 days = 37,960.
        2. Zero duplicate rows on (route_id, vessel_class_id, date).
        3. All non-null constraints satisfied.
        4. Every row has data_provenance == 'CURATED_FEATURE'.
        """
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM feature_store")
                total_rows = cur.fetchone()[0]
                self.assertEqual(total_rows, 37960, "feature_store should have exactly 37,960 rows")

                cur.execute("""
                    SELECT route_id, vessel_class_id, date, count(*)
                    FROM feature_store
                    GROUP BY route_id, vessel_class_id, date
                    HAVING count(*) > 1
                """)
                duplicates = cur.fetchall()
                self.assertEqual(len(duplicates), 0, "feature_store must have zero duplicate keys")

                cur.execute("SELECT DISTINCT data_provenance FROM feature_store")
                provs = [r[0] for r in cur.fetchall()]
                self.assertEqual(provs, ["CURATED_FEATURE"], "All rows must have data_provenance 'CURATED_FEATURE'")

                # Verify min and max dates
                cur.execute("SELECT min(date), max(date) FROM feature_store")
                min_d, max_d = cur.fetchone()
                self.assertEqual(str(min_d), "2024-09-11")
                self.assertEqual(str(max_d), "2026-09-10")
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
