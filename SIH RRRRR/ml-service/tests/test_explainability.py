"""Unit tests for Deterministic Explainability Layer (§21 / Task 15)."""

import re
import sys
import unittest
from pathlib import Path
from typing import Any, Dict

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ML_DIR))

from app.explainability.narrative import generate_deterministic_narrative


class TestExplainabilityLayer(unittest.TestCase):
    def setUp(self):
        self.reference_rationale: Dict[str, Any] = {
            "action": "SPLIT",
            "split_pct": 45,
            "confidence_score": 78,
            "drivers": [
                {
                    "factor": "expected_freight_change",
                    "value": "+8% to +11%",
                    "direction": "unfavorable_to_wait",
                },
                {
                    "factor": "vessel_availability_proxy",
                    "value": "tightening",
                    "direction": "unfavorable_to_wait",
                },
                {
                    "factor": "congestion_trend",
                    "value": "decreasing",
                    "direction": "favorable_to_wait",
                },
                {
                    "factor": "prob_increase_gt_8pct",
                    "value": 0.67,
                },
            ],
        }

    def test_section_21_exact_match(self):
        """Verify deterministic template reproduces exact Section 21 reference string."""
        expected_narrative = (
            "Freight is expected to rise 8-11% with 67% probability of exceeding an 8% increase; "
            "vessel availability is tightening. Waiting fully is not favorable, but full commitment "
            "now forgoes optionality given moderate confidence (score 78/100). Securing 45% now "
            "balances expected cost against downside risk."
        )
        actual_narrative = generate_deterministic_narrative(self.reference_rationale)
        self.assertEqual(actual_narrative, expected_narrative)

    def test_no_invented_numbers(self):
        """Confirm the narrative text is generated only from fields already present in rationale_json."""
        rationale_no_confidence = {
            "action": "SPLIT",
            "split_pct": 50,
            "drivers": [
                {
                    "factor": "expected_freight_change",
                    "value": "+12%",
                    "direction": "unfavorable_to_wait",
                },
                {
                    "factor": "vessel_availability_proxy",
                    "value": "tightening",
                    "direction": "unfavorable_to_wait",
                },
            ],
        }
        narrative = generate_deterministic_narrative(rationale_no_confidence)

        # Confidence score was NOT passed, so no confidence number / score must appear
        self.assertNotIn("score", narrative)
        self.assertNotIn("/100", narrative)
        self.assertNotIn("78", narrative)

        # Numbers appearing in narrative: 12 (from freight change) and 50 (from split_pct)
        numbers_in_narrative = set(re.findall(r"\b\d+\b", narrative))
        expected_numbers = {"12", "50"}
        self.assertEqual(numbers_in_narrative, expected_numbers)

    def test_freight_change_value_sensitivity(self):
        """Assert narrative changes correctly when expected_freight_change driver value changes."""
        # Baseline
        narrative_up = generate_deterministic_narrative(self.reference_rationale)
        self.assertIn("rise 8-11%", narrative_up)

        # Change freight change to downward trend
        downward_rationale = {
            "action": "SPLIT",
            "split_pct": 45,
            "confidence_score": 78,
            "drivers": [
                {
                    "factor": "expected_freight_change",
                    "value": "-5% to -8%",
                    "direction": "favorable_to_wait",
                },
                {
                    "factor": "vessel_availability_proxy",
                    "value": "tightening",
                    "direction": "unfavorable_to_wait",
                },
                {
                    "factor": "prob_increase_gt_8pct",
                    "value": 0.67,
                },
            ],
        }
        narrative_down = generate_deterministic_narrative(downward_rationale)
        self.assertIn("fall 5-8%", narrative_down)
        self.assertNotIn("rise", narrative_down)
        self.assertNotEqual(narrative_up, narrative_down)

    def test_probability_driver_value_sensitivity(self):
        """Assert narrative changes correctly when probability driver value changes."""
        modified_prob_rationale = dict(self.reference_rationale)
        modified_prob_rationale["drivers"] = [
            d if d["factor"] != "prob_increase_gt_8pct" else {"factor": "prob_increase_gt_8pct", "value": 0.22}
            for d in self.reference_rationale["drivers"]
        ]
        narrative = generate_deterministic_narrative(modified_prob_rationale)
        self.assertIn("22% probability", narrative)
        self.assertNotIn("67%", narrative)

    def test_vessel_availability_driver_sensitivity(self):
        """Assert narrative changes when vessel availability proxy value changes."""
        modified_vessel_rationale = dict(self.reference_rationale)
        modified_vessel_rationale["drivers"] = [
            d if d["factor"] != "vessel_availability_proxy" else {"factor": "vessel_availability_proxy", "value": "abundant", "direction": "favorable_to_wait"}
            for d in self.reference_rationale["drivers"]
        ]
        narrative = generate_deterministic_narrative(modified_vessel_rationale)
        self.assertIn("vessel availability is abundant", narrative)
        self.assertNotIn("tightening", narrative)

    def test_direction_flip_sensitivity(self):
        """Assert narrative posture flips when drivers change from unfavorable to favorable to wait."""
        favorable_rationale = {
            "action": "SPLIT",
            "split_pct": 30,
            "drivers": [
                {"factor": "expected_freight_change", "value": "-6%", "direction": "favorable_to_wait"},
                {"factor": "vessel_availability_proxy", "value": "easing", "direction": "favorable_to_wait"},
                {"factor": "congestion_trend", "value": "improving", "direction": "favorable_to_wait"},
            ],
        }
        narrative = generate_deterministic_narrative(favorable_rationale)
        self.assertIn("Waiting fully is favorable", narrative)
        self.assertNotIn("Waiting fully is not favorable", narrative)
        self.assertIn("Securing 30% now", narrative)

    def test_action_commitments(self):
        """Assert CHARTER_NOW and WAIT actions produce appropriate commitment directives."""
        charter_now_rationale = {
            "action": "CHARTER_NOW",
            "split_pct": 100,
            "drivers": [
                {"factor": "expected_freight_change", "value": "+15%", "direction": "unfavorable_to_wait"},
            ],
        }
        narrative_now = generate_deterministic_narrative(charter_now_rationale)
        self.assertIn("Securing 100% now locks current rates", narrative_now)

        wait_rationale = {
            "action": "WAIT",
            "split_pct": 0,
            "drivers": [
                {"factor": "expected_freight_change", "value": "-10%", "direction": "favorable_to_wait"},
            ],
        }
        narrative_wait = generate_deterministic_narrative(wait_rationale)
        self.assertIn("Deferring commitment allows capturing projected market softening", narrative_wait)


if __name__ == "__main__":
    unittest.main()
