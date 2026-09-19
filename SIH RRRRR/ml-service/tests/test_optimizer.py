"""Unit tests for Task 8: Market-Entry Optimizer (ETLC + SPLIT solver).

Verifies:
1. Three Parametrized Scenarios:
   - favor-wait: forecast lower than spot, low volatility, ample buffer -> WAIT / low p*
   - favor-now: forecast higher than spot, high volatility, ample buffer -> CHARTER_NOW / p*=1.0
   - deadline-infeasible-so-must-act-now: forecast strongly favors waiting, BUT buffer is insufficient -> CHARTER_NOW / p*=1.0
2. ETLC cost decomposition: verifies freight, bunker, port, demurrage, delay, risk components.
3. SPLIT solver grid-search: 21 points (0.0 to 1.0 in 0.05 steps) with valid cost curve.
"""

import sys
import unittest
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ML_DIR))

from app.optimization.etlc import (
    VesselSpec,
    RouteSpec,
    PortCondition,
    ForecastDistribution,
    compute_etlc,
)
from app.optimization.entry_timing import (
    check_deadline_feasibility,
    solve_entry_timing,
)


class TestMarketEntryOptimizer(unittest.TestCase):

    def test_three_entry_timing_scenarios_parametrized(self):
        """
        TASK 8 CORE ACCEPTANCE CRITERIA:
        Three parametrized test scenarios:
        1. favor-wait: price forecast drops, low volatility, ample buffer -> recommends WAIT (or low p*)
        2. favor-now: price forecast rises, high volatility, ample buffer -> recommends CHARTER_NOW (p*=1.0)
        3. deadline-infeasible-so-must-act-now: price drops strongly, BUT deadline is too close -> forces CHARTER_NOW (p*=1.0)
        """
        test_cases = [
            {
                "name": "favor-wait",
                "current_freight": 18.50,
                "deadline_days": 60.0,
                "forecast": ForecastDistribution(
                    expected_rate=12.00,  # $6.50/MT cheaper to wait
                    q_05=11.20,
                    q_25=11.60,
                    q_50=12.00,
                    q_75=12.40,
                    q_95=12.80,  # Tight $1.60 spread -> low risk
                ),
                "expected_action": "WAIT",
                "expected_p_max": 0.10,  # Highly favors waiting
                "expected_feasible": True,
            },
            {
                "name": "favor-now",
                "current_freight": 14.00,
                "deadline_days": 60.0,
                "forecast": ForecastDistribution(
                    expected_rate=21.50,  # $7.50/MT more expensive to wait (+53%)
                    q_05=17.00,
                    q_25=19.50,
                    q_50=21.50,
                    q_75=23.50,
                    q_95=26.00,  # High volatility $9.00 spread
                ),
                "expected_action": "CHARTER_NOW",
                "expected_p_min": 0.95,  # 100% lock now
                "expected_feasible": True,
            },
            {
                "name": "deadline-infeasible-so-must-act-now",
                "current_freight": 20.00,
                "deadline_days": 21.0,  # Very tight deadline! Required is ~24d (3d lead + 17.3d transit + 3.5d queue)
                "forecast": ForecastDistribution(
                    expected_rate=8.00,  # Massive 60% price drop! Economically favors waiting...
                    q_05=7.50,
                    q_25=7.80,
                    q_50=8.00,
                    q_75=8.20,
                    q_95=8.50,  # Zero volatility
                ),
                "expected_action": "CHARTER_NOW",  # Hard constraint MUST OVERRIDE price drop!
                "expected_p_min": 1.00,
                "expected_feasible": False,
            },
        ]

        print("\n" + "=" * 80)
        print("  TASK 8 — THREE PARAMETRIZED SCENARIO TESTS")
        print("=" * 80)

        for tc in test_cases:
            with self.subTest(scenario=tc["name"]):
                res = solve_entry_timing(
                    tonnage=75000.0,
                    current_freight_rate=tc["current_freight"],
                    current_bunker_price=650.0,
                    deadline_days=tc["deadline_days"],
                    forecast=tc["forecast"],
                    wait_days=7.0,
                )

                action = res["recommended_action"]
                optimal_p = res["optimal_p"]
                is_feasible = res["deadline_feasibility"]["is_wait_feasible"]
                buffer_days = res["deadline_feasibility"]["buffer_days"]

                print(f"\n[Scenario: {tc['name']}]")
                print(f"  Current Freight Rate  : ${tc['current_freight']:.2f}/MT")
                print(f"  Forecast Expected Rate: ${tc['forecast'].expected_rate:.2f}/MT (Spread: ${tc['forecast'].interval_90_width:.2f})")
                print(f"  Deadline Days         : {tc['deadline_days']:.1f}d (Buffer: {buffer_days:.1f}d)")
                print(f"  Wait Feasible         : {is_feasible}")
                print(f"  Recommended Action    : {action} (p* = {optimal_p:.2f})")
                print(f"  ETLC (NOW)            : ${res['etlc_now']:,.2f}")
                print(f"  ETLC (WAIT)           : ${res['etlc_wait']:,.2f}")
                print(f"  Optimal ETLC          : ${res['optimal_etlc']:,.2f}")
                print(f"  Rationale             : {res['rationale']['narrative']}")

                # Invariant Assertions
                self.assertEqual(
                    is_feasible,
                    tc["expected_feasible"],
                    f"Feasibility mismatch in scenario '{tc['name']}': expected {tc['expected_feasible']}, got {is_feasible}",
                )

                if tc["name"] == "favor-wait":
                    self.assertIn(action, ["WAIT", "SPLIT"])
                    self.assertLessEqual(optimal_p, tc["expected_p_max"])
                elif tc["name"] == "favor-now":
                    self.assertEqual(action, "CHARTER_NOW")
                    self.assertGreaterEqual(optimal_p, tc["expected_p_min"])
                elif tc["name"] == "deadline-infeasible-so-must-act-now":
                    # Hard constraint: MUST recommend CHARTER_NOW and p* = 1.0
                    self.assertEqual(action, "CHARTER_NOW")
                    self.assertEqual(optimal_p, 1.0)
                    self.assertFalse(is_feasible)

        print("\n" + "=" * 80)

    def test_etlc_cost_decomposition(self):
        """Verify each component of the ETLC formulation."""
        vessel = VesselSpec(dwt=75000.0, speed_knots=12.5, fuel_consumption_tpd=30.0, demurrage_rate_per_day=20000.0)
        route = RouteSpec(distance_nm=3000.0, typical_transit_days=10.0, port_cost=40000.0)
        port = PortCondition(congestion_score=50.0, avg_turnaround_days=3.0)
        forecast = ForecastDistribution(expected_rate=15.0, q_05=13.0, q_25=14.0, q_50=15.0, q_75=16.0, q_95=18.0)

        # 1. Charter now with 30-day deadline
        etlc_now = compute_etlc(
            action="CHARTER_NOW",
            tonnage=70000.0,
            vessel_spec=vessel,
            route_spec=route,
            port_condition=port,
            forecast=forecast,
            current_freight_rate=14.0,
            current_bunker_price=600.0,
            deadline_days=30.0,
        )

        # Freight: 70,000 * 14 = 980,000
        self.assertEqual(etlc_now.freight_cost, 980000.0)
        # Bunker: 10 days * 30 tpd * $600 = 180,000
        self.assertEqual(etlc_now.bunker_cost, 180000.0)
        # Port: 40,000
        self.assertEqual(etlc_now.port_cost, 40000.0)
        # Demurrage: 3.0 days * 20,000 = 60,000
        self.assertEqual(etlc_now.demurrage_cost, 60000.0)
        # Days to delivery: 3 (lead) + 10 (transit) + 3 (queue) = 16 <= 30 -> delay = 0
        self.assertEqual(etlc_now.delay_penalty, 0.0)
        # Risk premium on charter now = 0
        self.assertEqual(etlc_now.risk_premium, 0.0)
        # Total: 980k + 180k + 40k + 60k = 1,260,000
        self.assertEqual(etlc_now.total_cost, 1260000.0)

    def test_split_solver_grid_properties(self):
        """Verify SPLIT solver generates exactly 21 grid points with 0.05 step."""
        forecast = ForecastDistribution(expected_rate=14.5, q_05=12.0, q_25=13.5, q_50=14.5, q_75=15.5, q_95=17.5)
        res = solve_entry_timing(
            tonnage=75000.0,
            current_freight_rate=15.0,
            current_bunker_price=650.0,
            deadline_days=60.0,
            forecast=forecast,
        )

        cost_curve = res["cost_curve"]
        self.assertEqual(len(cost_curve), 21, "Grid search must produce exactly 21 points for step=0.05")

        p_values = [pt["p"] for pt in cost_curve]
        expected_p = [round(x * 0.05, 2) for x in range(21)]
        self.assertEqual(p_values, expected_p)

        # Check optimal p matches one of the grid points
        self.assertIn(res["optimal_p"], p_values)


if __name__ == "__main__":
    unittest.main()
