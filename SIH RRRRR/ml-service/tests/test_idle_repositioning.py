"""Unit and acceptance tests for TASK 18 — Idle-Time & Repositioning Engine (§10).

Verifies:
1. Single-voyage post-discharge availability calculation reusing Task 9 port turnaround distribution.
2. 2-3 illustrative opportunity lanes generated with all required fields (distance, transit days, cost, seasonality).
3. Every numeric field carries a data_provenance tag.
4. Mandatory Section 10 disclaimer is strictly present on output.
"""

import sys
import unittest
from pathlib import Path
from datetime import datetime

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ML_DIR))

from app.optimization.idle_repositioning import (
    estimate_idle_and_repositioning,
    SECTION_10_DISCLAIMER,
)


class TestIdleRepositioning(unittest.TestCase):

    def test_post_discharge_availability_calculation(self):
        """Reuses Task 9 port turnaround distribution (handling time + queue days)."""
        result = estimate_idle_and_repositioning(
            discharge_port_id=1,
            discharge_port_name="Paradip",
            vessel_class_id=3,
            vessel_class_name="Panamax",
            cargo_tonnage=75000.0,
            estimated_arrival_date="2026-10-15",
            avg_turnaround_days=3.5,
            handling_rate_tph=2500.0,
            congestion_ratio=1.0,
        )

        # Handling time: 75,000 MT / 2500 TPH = 30 hours = 1.25 days
        self.assertAlmostEqual(result.handling_days, 1.25, delta=0.05)
        # Queue days: 3.5 * 1.0 = 3.5 days
        self.assertAlmostEqual(result.queue_days, 3.5, delta=0.05)
        # Total turnaround: 1.25 + 3.5 = 4.75 -> 4.8 days
        self.assertAlmostEqual(result.turnaround_days, 4.8, delta=0.1)

        # Available date: 2026-10-15 + ceil(4.8) days = 2026-10-20
        self.assertEqual(result.available_date, "2026-10-20")

    def test_opportunity_lanes_structure_and_provenance(self):
        """Verifies 2-3 illustrative lanes with explicit provenance on every metric."""
        result = estimate_idle_and_repositioning(
            discharge_port_id=1,
            discharge_port_name="Paradip",
            vessel_class_id=3,
            vessel_class_name="Panamax",
            cargo_tonnage=75000.0,
            estimated_arrival_date="2026-10-15",
        )

        self.assertGreaterEqual(len(result.opportunity_lanes), 2)
        self.assertLessEqual(len(result.opportunity_lanes), 4)

        for lane in result.opportunity_lanes:
            self.assertTrue(lane.lane_id)
            self.assertTrue(lane.destination_region)
            self.assertGreater(lane.ballast_distance_nm, 1000.0)
            self.assertGreater(lane.ballast_transit_days, 3.0)
            self.assertGreater(lane.est_repositioning_cost_usd, 50000.0)
            self.assertGreater(lane.demand_seasonality_score, 0.0)

            # Strict provenance on metrics
            self.assertIn("distance", lane.provenance)
            self.assertIn("transit_days", lane.provenance)
            self.assertIn("cost", lane.provenance)
            self.assertIn("demand", lane.provenance)
            self.assertIn("source", lane.provenance)

    def test_mandatory_section_10_disclaimer_present(self):
        """Confirms Section 10 disclosure is strictly enforced."""
        result = estimate_idle_and_repositioning(
            discharge_port_id=1,
            discharge_port_name="Paradip",
            vessel_class_id=3,
            vessel_class_name="Panamax",
            cargo_tonnage=75000.0,
            estimated_arrival_date="2026-10-15",
        )

        self.assertEqual(result.disclaimer, SECTION_10_DISCLAIMER)
        self.assertIn("ILLUSTRATIVE MVP ONLY", result.disclaimer)
        self.assertIn("Fleet-level deadheading optimization requires proprietary vessel schedule data", result.disclaimer)


if __name__ == "__main__":
    unittest.main()
