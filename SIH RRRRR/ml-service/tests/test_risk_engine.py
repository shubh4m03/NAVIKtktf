"""
Unit and Monotonicity Tests for Risk Engine (§11 and §31).
Acceptance criteria:
1. Risk score is fully reproducible: calling twice with identical inputs gives identical output
   and an identical top_drivers breakdown.
2. Monotonicity test for each weighted sub-component: changing any single sub-score input
   in the expected direction moves total score monotonically in the expected direction.
3. Named config weights object validation.
4. Coherent mitigation suggestion parameterized by SPLIT(p) optimizer.
"""

import unittest
import copy
from app.risk.risk_engine import (
    RiskInput,
    RiskWeightsConfig,
    RiskEvaluation,
    DEFAULT_BALANCED_WEIGHTS,
    WEATHER_FOCUSED_WEIGHTS,
    MARKET_VOLATILITY_WEIGHTS,
    CONGESTION_FOCUSED_WEIGHTS,
    compute_risk_score,
    classify_risk_category,
    lookup_seasonal_weather_risk,
)


class TestRiskEngine(unittest.TestCase):

    def setUp(self):
        # Base realistic scenario input
        self.base_input = RiskInput(
            volatility_sub_score=0.35,
            congestion_sub_score=0.40,
            weather_sub_score=0.30,
            availability_sub_score=0.45,
            shock_sub_score=0.25,
            split_pct=45.0,
        )

    def test_risk_score_reproducibility(self):
        """
        TASK 10 REPRODUCIBILITY ACCEPTANCE TEST:
        Calling compute_risk_score twice with identical inputs MUST produce
        bitwise identical outputs and identical top_drivers breakdown.
        """
        eval_run_1 = compute_risk_score(self.base_input)
        eval_run_2 = compute_risk_score(self.base_input)

        # 1. Total score exact match
        self.assertEqual(eval_run_1.risk_score, eval_run_2.risk_score)
        self.assertEqual(eval_run_1.category, eval_run_2.category)

        # 2. Weights used exact match
        self.assertEqual(eval_run_1.weights_used, eval_run_2.weights_used)

        # 3. Mitigation suggestion exact match
        self.assertEqual(eval_run_1.mitigation_suggestion, eval_run_2.mitigation_suggestion)

        # 4. Top drivers breakdown exact match
        self.assertEqual(len(eval_run_1.top_drivers), len(eval_run_2.top_drivers))
        self.assertEqual(len(eval_run_1.top_drivers), 2)
        for d1, d2 in zip(eval_run_1.top_drivers, eval_run_2.top_drivers):
            self.assertEqual(d1.factor, d2.factor)
            self.assertEqual(d1.sub_score, d2.sub_score)
            self.assertEqual(d1.weight, d2.weight)
            self.assertEqual(d1.weighted_contribution, d2.weighted_contribution)
            self.assertEqual(d1.direction, d2.direction)
            self.assertEqual(d1.provenance, d2.provenance)
            self.assertEqual(d1.source, d2.source)

        # 5. Full dictionary representation exact match
        self.assertEqual(eval_run_1.to_dict(), eval_run_2.to_dict())

        # Print formatted reproducibility output
        print("\n" + "=" * 80)
        print("  TASK 10 — RISK ENGINE REPRODUCIBILITY VERIFICATION")
        print("=" * 80)
        print(f"  Run 1 Risk Score        : {eval_run_1.risk_score:.2f} ({eval_run_1.category})")
        print(f"  Run 2 Risk Score        : {eval_run_2.risk_score:.2f} ({eval_run_2.category})")
        print(f"  Scores Identical?       : {eval_run_1.risk_score == eval_run_2.risk_score} (Bitwise Match)")
        print(f"  Mitigation Suggestion   : \"{eval_run_1.mitigation_suggestion}\"")
        print("\n  Top Contributing Drivers:")
        for idx, d in enumerate(eval_run_1.top_drivers, 1):
            print(f"    {idx}. {d.display_name:<34} | Sub-Score: {d.sub_score:.2f} | Weight: {d.weight:.2f} | Contrib: {d.weighted_contribution:.2f} pts | [{d.provenance}]")
        print("=" * 80)


    def test_monotonicity_forecast_volatility(self):
        """
        TASK 10 MONOTONICITY: Sub-component 1 — Forecast Volatility
        Increasing forecast volatility MUST strictly increase composite risk score.
        """
        scores = []
        vol_values = [0.10, 0.30, 0.50, 0.75, 1.00]
        for val in vol_values:
            inp = copy.copy(self.base_input)
            inp.volatility_sub_score = val
            res = compute_risk_score(inp)
            scores.append(res.risk_score)

        for i in range(len(scores) - 1):
            self.assertGreater(
                scores[i + 1],
                scores[i],
                f"Volatility monotonicity violated: s={vol_values[i]} ({scores[i]}) vs s={vol_values[i+1]} ({scores[i+1]})"
            )

    def test_monotonicity_port_congestion(self):
        """
        TASK 10 MONOTONICITY: Sub-component 2 — Port Congestion
        Increasing port congestion MUST strictly increase composite risk score.
        """
        scores = []
        cong_values = [0.05, 0.25, 0.55, 0.80, 0.95]
        for val in cong_values:
            inp = copy.copy(self.base_input)
            inp.congestion_sub_score = val
            res = compute_risk_score(inp)
            scores.append(res.risk_score)

        for i in range(len(scores) - 1):
            self.assertGreater(
                scores[i + 1],
                scores[i],
                f"Congestion monotonicity violated: s={cong_values[i]} ({scores[i]}) vs s={cong_values[i+1]} ({scores[i+1]})"
            )

    def test_monotonicity_seasonal_weather(self):
        """
        TASK 10 MONOTONICITY: Sub-component 3 — Seasonal Weather / Cyclone Risk
        Increasing weather risk MUST strictly increase composite risk score.
        """
        scores = []
        wx_values = [0.15, 0.35, 0.60, 0.85, 1.00]
        for val in wx_values:
            inp = copy.copy(self.base_input)
            inp.weather_sub_score = val
            res = compute_risk_score(inp)
            scores.append(res.risk_score)

        for i in range(len(scores) - 1):
            self.assertGreater(
                scores[i + 1],
                scores[i],
                f"Weather monotonicity violated: s={wx_values[i]} ({scores[i]}) vs s={wx_values[i+1]} ({scores[i+1]})"
            )

    def test_monotonicity_vessel_availability_tightness(self):
        """
        TASK 10 MONOTONICITY: Sub-component 4 — Vessel Availability Tightness Proxy
        Increasing fleet tightness (positive momentum) MUST strictly increase composite risk score.
        """
        scores = []
        avail_values = [0.10, 0.30, 0.50, 0.70, 0.90]
        for val in avail_values:
            inp = copy.copy(self.base_input)
            inp.availability_sub_score = val
            res = compute_risk_score(inp)
            scores.append(res.risk_score)

        for i in range(len(scores) - 1):
            self.assertGreater(
                scores[i + 1],
                scores[i],
                f"Availability tightness monotonicity violated: s={avail_values[i]} ({scores[i]}) vs s={avail_values[i+1]} ({scores[i+1]})"
            )

    def test_monotonicity_commodity_price_shock(self):
        """
        TASK 10 MONOTONICITY: Sub-component 5 — Commodity / Bunker Price Shock
        Increasing commodity/bunker price shock MUST strictly increase composite risk score.
        """
        scores = []
        shock_values = [0.10, 0.25, 0.45, 0.75, 1.00]
        for val in shock_values:
            inp = copy.copy(self.base_input)
            inp.shock_sub_score = val
            res = compute_risk_score(inp)
            scores.append(res.risk_score)

        for i in range(len(scores) - 1):
            self.assertGreater(
                scores[i + 1],
                scores[i],
                f"Price shock monotonicity violated: s={shock_values[i]} ({scores[i]}) vs s={shock_values[i+1]} ({scores[i+1]})"
            )

    def test_named_configuration_weights_validation(self):
        """
        Verify that weights config is a named, strictly validated object.
        Negative weights and non-unit sums MUST be rejected.
        """
        # Valid custom config
        cfg = RiskWeightsConfig(w_vol=0.20, w_cong=0.30, w_wx=0.20, w_avail=0.15, w_shock=0.15)
        self.assertEqual(cfg.w_vol, 0.20)

        # Invalid negative weight
        with self.assertRaises(ValueError):
            RiskWeightsConfig(w_vol=-0.10, w_cong=0.40, w_wx=0.30, w_avail=0.20, w_shock=0.20)

        # Invalid non-unit sum
        with self.assertRaises(ValueError):
            RiskWeightsConfig(w_vol=0.50, w_cong=0.50, w_wx=0.50, w_avail=0.10, w_shock=0.10)

        # Verify all presets sum to 1.0
        for preset in [DEFAULT_BALANCED_WEIGHTS, WEATHER_FOCUSED_WEIGHTS, MARKET_VOLATILITY_WEIGHTS, CONGESTION_FOCUSED_WEIGHTS]:
            total = preset.w_vol + preset.w_cong + preset.w_wx + preset.w_avail + preset.w_shock
            self.assertAlmostEqual(total, 1.0, places=4)

    def test_top_drivers_and_provenance_integrity(self):
        """
        Verify that top-2 drivers represent the highest weighted contributions,
        and that each driver is stamped with a non-null, valid §3.1 provenance tag.
        """
        # Create input where congestion and weather dominate
        high_wx_cong_input = RiskInput(
            volatility_sub_score=0.10,
            congestion_sub_score=0.85,
            weather_sub_score=0.90,
            availability_sub_score=0.20,
            shock_sub_score=0.15,
        )
        res = compute_risk_score(high_wx_cong_input)

        self.assertEqual(len(res.top_drivers), 2)
        top_factors = [d.factor for d in res.top_drivers]
        self.assertIn("port_congestion", top_factors)
        self.assertIn("seasonal_weather", top_factors)

        # Check provenance taxonomy on all drivers
        valid_provenance = {"REAL_VERIFIED", "PUBLIC_PROXY", "SIMULATED", "MODEL_OUTPUT", "ASSUMPTION"}
        for driver in res.all_drivers:
            self.assertIn(driver.provenance, valid_provenance)
            self.assertTrue(len(driver.source) > 0)
            self.assertGreaterEqual(driver.sub_score, 0.0)
            self.assertLessEqual(driver.sub_score, 1.0)
            self.assertGreaterEqual(driver.weighted_contribution, 0.0)

    def test_mitigation_suggestion_coherence_with_split_optimizer(self):
        """
        Verify that mitigation suggestion template directly reflects X%/Y%
        from the SPLIT(p) optimizer (§11 & §7).
        """
        # Scenario 1: Balanced Split (p* = 0.45)
        inp_split = copy.copy(self.base_input)
        inp_split.split_pct = 45.0
        res1 = compute_risk_score(inp_split)
        self.assertIn("Secure 45% now, retain 55% flexible", res1.mitigation_suggestion)

        # Scenario 2: Strong Charter Now (p* = 1.00)
        inp_now = copy.copy(self.base_input)
        inp_now.split_pct = 100.0
        res2 = compute_risk_score(inp_now)
        self.assertIn("Secure 100% of requirement under immediate contract now", res2.mitigation_suggestion)

        # Scenario 3: Strong Wait (p* = 0.00)
        inp_wait = copy.copy(self.base_input)
        inp_wait.split_pct = 0.0
        res3 = compute_risk_score(inp_wait)
        self.assertIn("Retain 100% flexible", res3.mitigation_suggestion)

    def test_calendar_weather_lookup(self):
        """Verify Bay of Bengal weather calendar returns correct seasonal risk categories."""
        # May is peak pre-monsoon cyclone season -> HIGH
        may = lookup_seasonal_weather_risk("Bay of Bengal", 5)
        self.assertEqual(may["risk_level"], "HIGH")
        self.assertGreaterEqual(may["sub_score"], 0.85)

        # July is active monsoon -> MEDIUM
        jul = lookup_seasonal_weather_risk("Bay of Bengal", 7)
        self.assertEqual(jul["risk_level"], "MEDIUM")

        # January is winter calm -> LOW
        jan = lookup_seasonal_weather_risk("Bay of Bengal", 1)
        self.assertEqual(jan["risk_level"], "LOW")
        self.assertLessEqual(jan["sub_score"], 0.20)

    def tearDown(self):
        pass


    def test_all_five_monotonicity_deltas_summary(self):
        """
        TASK 10 MONOTONICITY SUMMARY:
        Prints explicit progression of total risk score as each sub-component
        is increased from minimum (0.00) to maximum (1.00), validating positive gradients.
        """
        sub_components = [
            ("Forecast Volatility (w=0.25)", "volatility_sub_score", 0.25),
            ("Port Congestion (w=0.25)", "congestion_sub_score", 0.25),
            ("Seasonal Weather (w=0.20)", "weather_sub_score", 0.20),
            ("Vessel Availability Tightness (w=0.15)", "availability_sub_score", 0.15),
            ("Commodity Price Shock (w=0.15)", "shock_sub_score", 0.15),
        ]
        test_points = [0.00, 0.25, 0.50, 0.75, 1.00]

        print("\n" + "=" * 80)
        print("  TASK 10 — SUB-COMPONENT MONOTONICITY VERIFICATION TABLE")
        print("=" * 80)
        print(f"  {'Sub-Component':<40} | s=0.00  | s=0.25  | s=0.50  | s=0.75  | s=1.00  | Monotonic?")
        print("  " + "-" * 76)

        for comp_name, attr, weight in sub_components:
            row_scores = []
            for pt in test_points:
                inp = copy.copy(self.base_input)
                setattr(inp, attr, pt)
                res = compute_risk_score(inp)
                row_scores.append(res.risk_score)

            # Check strictly increasing
            is_monotonic = all(row_scores[i] < row_scores[i+1] for i in range(len(row_scores)-1))
            self.assertTrue(is_monotonic, f"Monotonicity failed for {comp_name}")

            # Verify analytical gradient: delta_score = 100 * weight * delta_s
            delta = row_scores[-1] - row_scores[0]
            expected_delta = 100.0 * weight * (test_points[-1] - test_points[0])
            self.assertAlmostEqual(delta, expected_delta, places=2)

            scores_str = " | ".join(f"{sc:5.2f} " for sc in row_scores)
            status_str = "✓ PASS (Strictly Increasing)" if is_monotonic else "✗ FAIL"
            print(f"  {comp_name:<40} | {scores_str} | {status_str}")

        print("=" * 80)


if __name__ == "__main__":
    unittest.main()

