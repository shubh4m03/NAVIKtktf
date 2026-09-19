"""
Unit tests for Task 19 — Charter Portfolio Strategy (§13).
Implemented with standard library unittest.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.optimization.portfolio_optimizer import (
    optimize_charter_portfolio,
    PortfolioInput,
    LAMBDA_CONSERVATIVE,
    LAMBDA_BALANCED,
    LAMBDA_AGGRESSIVE,
    SHORT_TERM_VARIANCE_FACTOR,
    MEDIUM_TERM_VARIANCE_FACTOR,
    SPOT_VARIANCE_FACTOR,
    SHORT_TERM_COST_PREMIUM,
    MEDIUM_TERM_COST_PREMIUM,
    MIN_WEIGHT,
    MAX_SPOT_WEIGHT,
)

class TestPortfolioOptimizer(unittest.TestCase):

    def setUp(self):
        self.base_input = dict(
            expected_rate_usd_per_mt=28.0,
            q_05=22.0,
            q_95=36.0,
            tonnage_mt=75_000.0,
        )

    def test_conservative_higher_medium_term_than_aggressive(self):
        """
        Monotonicity test:
        Conservative (lambda=1.0) must produce strictly higher medium_term_pct
        than Aggressive (lambda=0.1) for identical inputs.
        """
        conservative = optimize_charter_portfolio(
            PortfolioInput(**self.base_input, risk_aversion_lambda=LAMBDA_CONSERVATIVE)
        )
        aggressive = optimize_charter_portfolio(
            PortfolioInput(**self.base_input, risk_aversion_lambda=LAMBDA_AGGRESSIVE)
        )

        print("\n[Monotonicity Test Results]")
        print(f"  Conservative (lambda=1.0) -> Medium-Term: {conservative.medium_term_pct:.2f}%, Spot: {conservative.spot_pct:.2f}%")
        print(f"  Aggressive   (lambda=0.1) -> Medium-Term: {aggressive.medium_term_pct:.2f}%, Spot: {aggressive.spot_pct:.2f}%")

        self.assertGreater(conservative.medium_term_pct, aggressive.medium_term_pct)
        self.assertLessEqual(conservative.spot_pct, aggressive.spot_pct)

    def test_allocations_sum_to_100_pct(self):
        """
        Boundary test:
        For any risk aversion setting, allocations must sum to exactly 100%.
        """
        for lam in [LAMBDA_CONSERVATIVE, LAMBDA_BALANCED, LAMBDA_AGGRESSIVE, 0.01, 2.0]:
            result = optimize_charter_portfolio(
                PortfolioInput(**self.base_input, risk_aversion_lambda=lam)
            )
            total = result.spot_pct + result.short_term_pct + result.medium_term_pct
            self.assertAlmostEqual(total, 100.0, delta=0.05)

    def test_lambda_labels(self):
        """Label mapping test per §13."""
        for lam, expected in [
            (LAMBDA_CONSERVATIVE, "Conservative"),
            (LAMBDA_BALANCED, "Balanced"),
            (LAMBDA_AGGRESSIVE, "Aggressive"),
        ]:
            result = optimize_charter_portfolio(
                PortfolioInput(**self.base_input, risk_aversion_lambda=lam)
            )
            self.assertEqual(result.lambda_label, expected)

    def test_provenance_and_disclaimer(self):
        """Provenance badges and §38 disclaimer enforcement."""
        result = optimize_charter_portfolio(
            PortfolioInput(**self.base_input, risk_aversion_lambda=LAMBDA_BALANCED)
        )
        self.assertTrue(result.disclaimer)
        self.assertIn("ILLUSTRATIVE", result.disclaimer)
        for alloc in result.allocations:
            self.assertTrue(alloc.data_provenance)
            self.assertEqual(alloc.data_provenance.get("basis"), "SIMULATED synthetic scenario")

    def test_named_assumptions_registered(self):
        """Config constants documented without inline magic numbers."""
        result = optimize_charter_portfolio(
            PortfolioInput(**self.base_input, risk_aversion_lambda=LAMBDA_BALANCED)
        )
        asmp = result.assumptions
        self.assertEqual(asmp["spot_variance_factor"], SPOT_VARIANCE_FACTOR)
        self.assertEqual(asmp["short_term_variance_factor"], SHORT_TERM_VARIANCE_FACTOR)
        self.assertEqual(asmp["medium_term_variance_factor"], MEDIUM_TERM_VARIANCE_FACTOR)

if __name__ == "__main__":
    unittest.main()
