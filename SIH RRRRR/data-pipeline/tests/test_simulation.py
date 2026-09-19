"""Tests for Task 4: Congestion and AIS simulation.

Verifies:
1. Deterministic reproducibility: same seed -> bitwise identical output
2. Seasonality sanity: monsoon/cyclone months show materially different average congestion than calm months
3. Provenance guarantee: every row has data_provenance == 'SIMULATED'
"""

import unittest
from datetime import date
import sys
from pathlib import Path
import numpy as np

CURRENT_DIR = Path(__file__).resolve().parent
PIPELINE_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(PIPELINE_DIR / "simulation"))
sys.path.insert(0, str(PIPELINE_DIR))

import congestion_sim
import ais_sim


class TestSimulation(unittest.TestCase):

    def test_congestion_reproducibility(self):
        """Assert identical seed produces identical congestion series across all ports."""
        start_d = date(2025, 1, 1)
        end_d = date(2025, 12, 31)

        run1 = congestion_sim.simulate_congestion_series(
            port_id=1, port_code="PRT", start_date=start_d, end_date=end_d, seed=42
        )
        run2 = congestion_sim.simulate_congestion_series(
            port_id=1, port_code="PRT", start_date=start_d, end_date=end_d, seed=42
        )
        run_diff_seed = congestion_sim.simulate_congestion_series(
            port_id=1, port_code="PRT", start_date=start_d, end_date=end_d, seed=99
        )

        self.assertEqual(len(run1), len(run2))
        scores1 = [r["congestion_score"] for r in run1]
        scores2 = [r["congestion_score"] for r in run2]
        scores_diff = [r["congestion_score"] for r in run_diff_seed]

        # Same seed -> identical output
        self.assertEqual(scores1, scores2, "Same seed must produce identical congestion scores")

        # Different seed -> different output
        self.assertNotEqual(scores1, scores_diff, "Different seeds must produce different series")

    def test_seasonality_sanity(self):
        """
        Assert monsoon/cyclone months show materially different average congestion
        than non-seasonal (calm) months.
        """
        start_d = date(2025, 1, 1)
        end_d = date(2025, 12, 31)

        # Simulate for all ports
        high_risk_scores = []
        medium_risk_scores = []
        low_risk_scores = []

        ports = [
            (1, "PRT"), (2, "VTZ"), (3, "DHM"), (4, "HAL"), (5, "GGV")
        ]

        for p_id, p_code in ports:
            records = congestion_sim.simulate_congestion_series(
                port_id=p_id, port_code=p_code, start_date=start_d, end_date=end_d, seed=42
            )
            for r in records:
                m = r["date"].month
                score = r["congestion_score"]
                risk = congestion_sim.MONTH_RISK_MAP.get(m, "LOW")
                if risk == "HIGH":
                    high_risk_scores.append(score)
                elif risk == "MEDIUM":
                    medium_risk_scores.append(score)
                else:
                    low_risk_scores.append(score)

        mean_high = np.mean(high_risk_scores)
        mean_med = np.mean(medium_risk_scores)
        mean_low = np.mean(low_risk_scores)

        print(f"\n--- Seasonality Sanity Test Metrics ---")
        print(f"  HIGH risk months (Apr-May, Oct-Nov) mean congestion  : {mean_high:.2f}")
        print(f"  MEDIUM risk months (Jun-Sep monsoon) mean congestion : {mean_med:.2f}")
        print(f"  LOW risk months (Dec-Mar winter calm) mean congestion: {mean_low:.2f}")
        print(f"  Elevation ratio (HIGH / LOW)                          : {mean_high / mean_low:.2f}x")
        print(f"  Elevation ratio (MEDIUM / LOW)                        : {mean_med / mean_low:.2f}x")
        print("---------------------------------------\n")

        # Material difference assertions
        self.assertGreater(mean_high, mean_med, "HIGH risk months must have higher average congestion than MEDIUM risk")
        self.assertGreater(mean_med, mean_low, "MEDIUM risk months must have higher average congestion than LOW risk")
        self.assertGreaterEqual(
            mean_high / mean_low, 1.35,
            f"HIGH risk congestion must be at least 35% higher than LOW risk (actual ratio: {mean_high / mean_low:.2f})"
        )

    def test_provenance_tagging(self):
        """Assert every single simulated row has data_provenance == 'SIMULATED'."""
        start_d = date(2025, 1, 1)
        end_d = date(2025, 1, 31)
        records = congestion_sim.simulate_congestion_series(
            port_id=1, port_code="PRT", start_date=start_d, end_date=end_d, seed=42
        )
        for r in records:
            self.assertEqual(r["data_provenance"], "SIMULATED")

    def test_ais_reproducibility_and_provenance(self):
        """Assert AIS fleet simulator is deterministic and tagged SIMULATED."""
        fleet1 = ais_sim.simulate_fleet_positions(seed=42)
        fleet2 = ais_sim.simulate_fleet_positions(seed=42)
        fleet_diff = ais_sim.simulate_fleet_positions(seed=99)

        self.assertEqual(fleet1, fleet2, "Same seed must produce identical AIS fleet positions")
        self.assertNotEqual(fleet1, fleet_diff, "Different seed must produce different AIS positions")

        for v in fleet1:
            self.assertEqual(v["data_provenance"], "SIMULATED")
            self.assertIn("SIMULATED", v["provenance_notice"])
            self.assertGreater(v["progress_pct"], 0)
            self.assertLess(v["progress_pct"], 100)


if __name__ == "__main__":
    unittest.main()
