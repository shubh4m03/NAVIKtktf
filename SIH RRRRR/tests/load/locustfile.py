"""
TASK 17 — Load Test with Locust (§34).
Simulates realistic concurrent cargo requests at 20-50 RPS.
Usage:
    locust -f tests/load/locustfile.py --headless -u 35 -r 5 --run-time 1m --host http://localhost:8080
"""

import json
from locust import HttpUser, task, between, events


class CargoRequestUser(HttpUser):
    # Pacing to hit ~20-50 RPS across 30-50 virtual users
    wait_time = between(0.8, 1.5)

    def on_start(self):
        """Simulate MANAGER JWT Authentication (§27)."""
        # Fixed manager token format for load testing
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYW5hZ2VyX3VzZXIiLCJyb2xlIjoiTUFOQUdFUiJ9.demo_token",
            "X-Forwarded-For": f"10.0.1.{self.user_id if hasattr(self, 'user_id') else 10}"
        }

    @task(3)
    def submit_cargo_request(self):
        """Realistic 75k MT cargo requirement per §41 Demo Flow."""
        payload = {
            "userId": 1,
            "tonnage": 75000.0,
            "originRegion": "AUSTRALIA_GLADSTONE",
            "destinationPortId": 1,
            "deadline": "2026-10-15",
            "contractPreference": "spot"
        }
        with self.client.post(
            "/api/v1/cargo-requests",
            json=payload,
            headers=self.headers,
            catch_response=True,
            name="POST /api/v1/cargo-requests"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "recommendation" in data or data.get("degraded") is True:
                    response.success()
                else:
                    response.failure(f"Unexpected response structure: {data}")
            else:
                response.failure(f"Expected 200, got {response.status_code}")

    @task(1)
    def simulate_scenario(self):
        """Scenario simulation endpoint perturbation test."""
        payload = {
            "freightShockPct": 15.0,
            "congestionShockPct": 10.0,
            "fuelShockPct": 5.0
        }
        with self.client.post(
            "/api/v1/cargo-requests/1/scenario",
            json=payload,
            headers=self.headers,
            catch_response=True,
            name="POST /api/v1/cargo-requests/1/scenario"
        ) as response:
            if response.status_code in (200, 404):  # 404 acceptable if request 1 not seeded yet
                response.success()
            else:
                response.failure(f"Status {response.status_code}")
