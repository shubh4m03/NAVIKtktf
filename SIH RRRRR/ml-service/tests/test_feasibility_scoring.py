"""Unit tests for Task 9: Vessel-Port Feasibility & Multi-Objective Scoring.

Verifies:
1. Synthetic shallow-draft port test:
   - Confirms Capesize and Panamax are eliminated with human-readable infeasibility_reasons.
   - Confirms Handysize and Supramax survive as feasible candidates.
2. Physical constraint filters:
   - LOA limit elimination.
   - Beam limit elimination.
   - DWT parcel capacity elimination.
3. Multi-objective scoring & ranking:
   - Uses named ScoringWeightsConfig (no inline magic numbers).
   - Confirms candidate rankings adapt to slider shifts between cost and urgency.
"""

import sys
import unittest
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ML_DIR))

from app.optimization.vessel_feasibility import (
    PortConstraintData,
    VesselCandidate,
    filter_vessel_candidates,
    evaluate_vessel_feasibility,
)
from app.optimization.vessel_scoring import (
    ScoringWeightsConfig,
    SCORING_PRESETS,
    VesselVoyageMetrics,
    rank_vessel_candidates,
)


class TestVesselPortFeasibilityAndScoring(unittest.TestCase):

    def setUp(self):
        # The 4 standard bulk carrier vessel classes
        self.handysize = VesselCandidate(
            id=1,
            name="Handysize-Standard",
            vessel_class="Handysize",
            draft_m=10.0,
            loa_m=170.0,
            beam_m=27.0,
            dwt=35000.0,
            daily_rate=14000.0,
            speed_knots=12.0,
        )
        self.supramax = VesselCandidate(
            id=2,
            name="Supramax-Standard",
            vessel_class="Supramax",
            draft_m=12.0,
            loa_m=195.0,
            beam_m=32.2,
            dwt=58000.0,
            daily_rate=16500.0,
            speed_knots=12.5,
        )
        self.panamax = VesselCandidate(
            id=3,
            name="Panamax-Standard",
            vessel_class="Panamax",
            draft_m=14.0,
            loa_m=228.0,
            beam_m=32.3,
            dwt=75000.0,
            daily_rate=19000.0,
            speed_knots=13.0,
        )
        self.capesize = VesselCandidate(
            id=4,
            name="Capesize-Standard",
            vessel_class="Capesize",
            draft_m=18.0,
            loa_m=295.0,
            beam_m=45.0,
            dwt=180000.0,
            daily_rate=25000.0,
            speed_knots=14.0,
        )
        self.fleet = [self.handysize, self.supramax, self.panamax, self.capesize]

    def test_synthetic_shallow_draft_port_elimination(self):
        """
        TASK 9 CORE ACCEPTANCE TEST:
        Synthetic shallow-draft port (max draft = 13.0m):
        - Capesize (18.0m) and Panamax (14.0m) MUST BE ELIMINATED with human-readable reasons.
        - Handysize (10.0m) and Supramax (12.0m) MUST SURVIVE.
        """
        shallow_port = PortConstraintData(
            port_id=99,
            port_name="Synthetic-Shallow-Port",
            port_code="SSP",
            max_draft_m=13.0,  # Shallow draft constraint
            max_loa_m=240.0,
            max_beam_m=35.0,
        )

        result = filter_vessel_candidates(
            candidates=self.fleet,
            port=shallow_port,
            cargo_tonnage=30000.0,
        )

        surviving_names = [v.vessel_class for v in result.feasible_vessels]
        eliminated_dict = {
            e.vessel.vessel_class: e.primary_infeasibility_reason
            for e in result.eliminated_vessels
        }

        print("\n" + "=" * 80)
        print("  TASK 9 — VESSEL-PORT FEASIBILITY FILTER TEST OUTPUT")
        print("  Port: Synthetic Shallow Port (Max Draft: 13.0m, Max LOA: 240m, Max Beam: 35m)")
        print("=" * 80)

        print(f"\n[SURVIVING FEASIBLE VESSELS ({len(result.feasible_vessels)})]")
        for v in result.feasible_vessels:
            print(f"  ✓ {v.vessel_class:10} | Draft: {v.draft_m:.1f}m <= 13.0m | LOA: {v.loa_m:.1f}m | Beam: {v.beam_m:.1f}m | DWT: {v.dwt:,.0f} MT")

        print(f"\n[ELIMINATED INFEASIBLE VESSELS ({len(result.eliminated_vessels)})]")
        for e in result.eliminated_vessels:
            print(f"  ✗ {e.vessel.vessel_class:10} | REASON: {e.primary_infeasibility_reason}")
            if len(e.reasons) > 1:
                for additional_reason in e.reasons[1:]:
                    print(f"               | Also:   {additional_reason}")

        print("=" * 80 + "\n")

        # 1. Assert survival of Handysize and Supramax
        self.assertIn("Handysize", surviving_names, "Handysize must survive shallow draft port (10m <= 13m)")
        self.assertIn("Supramax", surviving_names, "Supramax must survive shallow draft port (12m <= 13m)")
        self.assertEqual(len(result.feasible_vessels), 2, "Only Handysize and Supramax should survive")

        # 2. Assert elimination of Panamax and Capesize
        self.assertIn("Panamax", eliminated_dict, "Panamax must be eliminated by shallow draft (14m > 13m)")
        self.assertIn("Capesize", eliminated_dict, "Capesize must be eliminated by shallow draft (18m > 13m)")

        # 3. Assert exact human-readable infeasibility reasons
        panamax_reason = eliminated_dict["Panamax"]
        self.assertIn("draft 14.0m exceeds port max draft 13.0m", panamax_reason)
        self.assertIn("exceeds by 1.0m", panamax_reason)

        capesize_reason = eliminated_dict["Capesize"]
        self.assertIn("draft 18.0m exceeds port max draft 13.0m", capesize_reason)
        self.assertIn("exceeds by 5.0m", capesize_reason)

    def test_additional_physical_constraints(self):
        """Verify LOA, Beam, and Cargo DWT capacity constraints eliminate correctly."""
        # Port with tight LOA and tight Beam
        tight_port = PortConstraintData(
            port_id=101,
            port_name="Narrow-Berth-Port",
            port_code="NBP",
            max_draft_m=15.0,
            max_loa_m=180.0,   # Eliminates Supramax (195m), Panamax (228m), Capesize (295m)
            max_beam_m=30.0,   # Eliminates Supramax (32.2m), Panamax (32.3m), Capesize (45m)
        )

        res = filter_vessel_candidates(self.fleet, tight_port, cargo_tonnage=25000.0)
        surviving = [v.vessel_class for v in res.feasible_vessels]
        self.assertEqual(surviving, ["Handysize"])

        # DWT capacity check: requesting 80,000 MT parcel
        res_dwt = filter_vessel_candidates(self.fleet, tight_port, cargo_tonnage=80000.0)
        # Even Handysize is eliminated because 80k MT exceeds its 35k MT capacity
        self.assertEqual(len(res_dwt.feasible_vessels), 0)
        handysize_eval = next(e for e in res_dwt.eliminated_vessels if e.vessel.vessel_class == "Handysize")
        self.assertIn("exceeds vessel DWT capacity", handysize_eval.primary_infeasibility_reason)

    def test_multi_objective_vessel_scoring_and_ranking(self):
        """
        Verify Step 2 Multi-Objective Scoring:
        - Named ScoringWeightsConfig object used (no magic numbers).
        - Demonstrates ranking shift when business weights pivot between Cost and Urgency.
        """
        # Two surviving feasible candidates from shallow port
        metrics_handy = VesselVoyageMetrics(
            vessel=self.handysize,
            estimated_landed_cost_usd_per_mt=28.50,  # Higher cost per MT
            expected_delay_days=14.0,                # Faster turnaround / less queue
            availability_score=95.0,                 # Highly available promptly
            risk_penalty=15.0,                       # Low risk
        )
        metrics_supra = VesselVoyageMetrics(
            vessel=self.supramax,
            estimated_landed_cost_usd_per_mt=22.10,  # Cheaper economies of scale
            expected_delay_days=18.5,                # Slower turnaround / larger parcel
            availability_score=70.0,                 # Less prompt
            risk_penalty=25.0,
        )
        candidates = [metrics_handy, metrics_supra]

        # 1. Cost Priority Preset (Cost weight = 0.65)
        cost_weights = SCORING_PRESETS["COST_PRIORITY"]
        self.assertEqual(cost_weights.name, "COST_PRIORITY")
        ranked_cost = rank_vessel_candidates(candidates, weights=cost_weights)

        # Under Cost Priority, Supramax should win (Rank 1) due to cheaper landed cost
        self.assertEqual(ranked_cost[0].vessel.vessel_class, "Supramax")
        self.assertEqual(ranked_cost[1].vessel.vessel_class, "Handysize")

        # 2. Urgent Dispatch Preset (Delay weight = 0.55, Availability = 0.25)
        urgent_weights = SCORING_PRESETS["URGENT_DISPATCH"]
        self.assertEqual(urgent_weights.name, "URGENT_DISPATCH")
        ranked_urgent = rank_vessel_candidates(candidates, weights=urgent_weights)

        # Under Urgent Dispatch, Handysize should win (Rank 1) due to faster delivery & prompt availability
        self.assertEqual(ranked_urgent[0].vessel.vessel_class, "Handysize")
        self.assertEqual(ranked_urgent[1].vessel.vessel_class, "Supramax")

        print("[Scoring Weight Pivot Verification Passed]")
        print(f"  Cost Priority Winner   : {ranked_cost[0].vessel.vessel_class} (Score: {ranked_cost[0].total_score:.2f})")
        print(f"  Urgent Priority Winner : {ranked_urgent[0].vessel.vessel_class} (Score: {ranked_urgent[0].total_score:.2f})")


if __name__ == "__main__":
    unittest.main()
