"""Unit and Acceptance Tests for Task 13: Economic Backtest Report (§20.1, §31).

Verifies:
1. Synthetic-data test where AI strategy is provably better than baseline (sawtooth cycle)
   and reports positive cumulative savings %, bounded worst loss, and positive volatility reduction.
2. Strict no-lookahead enforcement: deliberate lookahead injection is caught and raises DataLeakageError.
3. Dynamic causality perturbation test: corrupting future data does not alter past decisions.
4. Assumption transparency: report header prints all required operational assumptions.
"""

import sys
import unittest
from pathlib import Path
import numpy as np
import pandas as pd

CURRENT_DIR = Path(__file__).resolve().parent
PIPELINE_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(PIPELINE_DIR / "backtesting"))
sys.path.insert(0, str(PIPELINE_DIR))

from backtesting.economic_backtest import (
    DataLeakageError,
    EconomicBacktestConfig,
    BacktestSummary,
    assert_backtest_no_lookahead,
    detect_lookahead_leakage,
    generate_sawtooth_data,
    solve_backtest_decision,
    run_economic_backtest,
    format_economic_report,
)


class TestEconomicBacktest(unittest.TestCase):

    def setUp(self):
        self.config = EconomicBacktestConfig(
            cargo_tonnage=75000.0,
            wait_days=7,
            fixing_lead_days=3.0,
            transit_days=14.0,
            deadline_days=35.0,
            demurrage_rate_per_day=20000.0,
            risk_aversion_lambda=0.5,
        )
        # Deterministic sawtooth market dataset (180 days, 20-day cycle)
        self.sawtooth_df = generate_sawtooth_data(
            n_days=180, cycle_length=20, min_rate=18.0, max_rate=32.0, noise_std=0.1, seed=42
        )

    def test_sawtooth_provable_outperformance(self):
        """
        TASK 13 CORE ACCEPTANCE TEST:
        In a periodic sawtooth market, the AI timing strategy must provably beat
        the naive daily-spot baseline:
        - Cumulative savings % > 0 (strictly positive savings)
        - Volatility reduction % > 0 (smoother cost distribution)
        - Worst single-decision loss is bounded and tracked
        """
        summary = run_economic_backtest(self.sawtooth_df, config=self.config, warmup_days=21)

        print("\n" + format_economic_report(summary, as_json=False))

        # 1. Assert positive cumulative savings
        self.assertGreater(
            summary.cumulative_savings_usd, 0.0,
            "AI strategy must achieve strictly positive cumulative savings ($) on sawtooth benchmark."
        )
        self.assertGreater(
            summary.cumulative_savings_pct, 5.0,
            "AI strategy must achieve at least 5% cumulative savings on sawtooth benchmark."
        )

        # 2. Assert volatility reduction
        self.assertGreater(
            summary.volatility_reduction_pct, 15.0,
            "Strategy must reduce decision cost volatility by at least 15% vs spot baseline."
        )
        self.assertLess(
            summary.strategy_cost_std_usd, summary.baseline_cost_std_usd,
            "Strategy cost standard deviation must be strictly lower than baseline."
        )

        # 3. Assert worst single-decision loss is tracked and bounded
        self.assertGreaterEqual(summary.worst_single_decision_loss_usd, 0.0)
        self.assertLess(
            summary.worst_single_decision_loss_pct, 25.0,
            "Worst single-decision loss must not exceed 25% of baseline cost."
        )

        # 4. Assert win rate
        self.assertGreaterEqual(
            summary.win_rate_pct, 80.0,
            "Win rate must be at least 80% on sawtooth cycle."
        )

    def test_leakage_check_deliberate_lookahead_caught(self):
        """
        LEAKAGE CHECK TEST:
        Deliberately introduce lookahead (accessing future dates t' > t) and confirm
        assert_backtest_no_lookahead catches it and raises DataLeakageError.
        """
        # Create a mock slice where decision date is 2025-02-01 but row contains 2025-02-05
        leaky_df = pd.DataFrame({
            "date": pd.to_datetime(["2025-02-05"]),
            "decision_date": pd.to_datetime(["2025-02-01"]),
            "freight_val": [29.5],
        })

        with self.assertRaises(DataLeakageError) as ctx:
            assert_backtest_no_lookahead(leaky_df)

        err_msg = str(ctx.exception)
        self.assertIn("LOOKAHEAD LEAKAGE DETECTED", err_msg)
        self.assertIn("Invariant violated", err_msg)

    def test_dynamic_causality_perturbation_passes_on_clean_policy(self):
        """
        Verifies that our decision solver exhibits strict causality:
        Corrupting future data (t > T) does NOT change the decision at date T.
        """
        def clean_strategy(history_df, current_date):
            return solve_backtest_decision(history_df, current_date, self.config)

        # Should pass without raising DataLeakageError
        passed = detect_lookahead_leakage(clean_strategy, self.sawtooth_df, sample_cutoff_idx=35)
        self.assertTrue(passed, "Clean strategy must pass dynamic causality check.")

    def test_report_header_prints_all_assumptions(self):
        """
        Verifies that all required operational assumptions are explicitly printed
        in the report header (§20.1, §31).
        """
        summary = run_economic_backtest(self.sawtooth_df, config=self.config, warmup_days=21)
        report_text = format_economic_report(summary, as_json=False)

        required_assumptions = [
            "Demurrage Cost Basis",
            "USD 20,000/day basis demurrage",
            "Congestion Data Source",
            "SIMULATED port congestion series",
            "Freight Data Provenance",
            "PUBLIC_PROXY freight index series",
            "FX Data Provenance",
            "REAL_VERIFIED",
            "No-Lookahead Policy",
        ]

        for assumption in required_assumptions:
            self.assertIn(
                assumption, report_text,
                f"Required transparency assumption '{assumption}' missing from report header!"
            )


if __name__ == "__main__":
    unittest.main()
