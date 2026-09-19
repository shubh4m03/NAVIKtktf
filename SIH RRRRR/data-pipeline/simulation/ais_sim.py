"""Coarse vessel-position / AIS and transit-time distribution simulator.

Used ONLY for illustrative 'vessel position' and live fleet UI elements,
NOT for any landed-cost calculation that could be mistaken for real telemetry.
Every output is stamped with data_provenance='SIMULATED' (§31 Task 4).
"""

import argparse
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("simulation.ais")

PROVENANCE = "SIMULATED"

# Waypoints / Port coordinates (Lat, Lon) for maritime route interpolation
PORT_COORDINATES: Dict[str, tuple] = {
    # Destination Ports (East Coast India)
    "PRT": (20.2644, 86.6713),   # Paradip
    "VTZ": (17.6868, 83.2185),   # Visakhapatnam
    "DHM": (20.8167, 86.9667),   # Dhamra
    "HAL": (22.0223, 88.0583),   # Haldia
    "GGV": (17.6186, 83.2355),   # Gangavaram

    # Origins
    "AUSTRALIA_GLADSTONE": (-23.8431, 151.2555),
    "AUSTRALIA_HAY_POINT": (-21.2894, 149.3006),
    "AUSTRALIA_NEWCASTLE": (-32.9272, 151.7765),
    "MOZAMBIQUE_NACALA": (-14.5428, 40.6728),
    "US_GULF_HOUSTON": (29.7604, -95.3698),
    "RUSSIA_VOSTOCHNY": (42.7333, 133.0833),
    "INDONESIA_KALIMANTAN": (-1.2654, 116.8312),
}

REPRESENTATIVE_VOYAGES = [
    {
        "vessel_name": "Cape Enterprise",
        "vessel_class": "Capesize",
        "dwt": 175000,
        "origin": "AUSTRALIA_GLADSTONE",
        "destination": "DHM",
        "distance_nm": 5100,
        "typical_transit_days": 17.5,
        "cargo_tonnage": 160000,
        "cargo_type": "Coking Coal",
    },
    {
        "vessel_name": "Oceanic Panamax",
        "vessel_class": "Panamax",
        "dwt": 82000,
        "origin": "AUSTRALIA_NEWCASTLE",
        "destination": "PRT",
        "distance_nm": 5300,
        "typical_transit_days": 18.3,
        "cargo_tonnage": 75000,
        "cargo_type": "Coking Coal",
    },
    {
        "vessel_name": "Supra Voyager",
        "vessel_class": "Supramax",
        "dwt": 58000,
        "origin": "INDONESIA_KALIMANTAN",
        "destination": "HAL",
        "distance_nm": 2150,
        "typical_transit_days": 7.4,
        "cargo_tonnage": 52000,
        "cargo_type": "Thermal Coal",
    },
    {
        "vessel_name": "Handy Pioneer",
        "vessel_class": "Handysize",
        "dwt": 35000,
        "origin": "MOZAMBIQUE_NACALA",
        "destination": "VTZ",
        "distance_nm": 4100,
        "typical_transit_days": 14.0,
        "cargo_tonnage": 32000,
        "cargo_type": "Coking Coal",
    },
    {
        "vessel_name": "Bengal Glory",
        "vessel_class": "Panamax",
        "dwt": 80000,
        "origin": "AUSTRALIA_HAY_POINT",
        "destination": "GGV",
        "distance_nm": 5000,
        "typical_transit_days": 17.2,
        "cargo_tonnage": 74000,
        "cargo_type": "Coking Coal",
    },
]


def interpolate_position(coord1: tuple, coord2: tuple, fraction: float) -> tuple:
    """Linear interpolation between two geographical coordinates."""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    cur_lat = lat1 + (lat2 - lat1) * fraction
    cur_lon = lon1 + (lon2 - lon1) * fraction
    return round(cur_lat, 4), round(cur_lon, 4)


def calculate_heading(coord1: tuple, coord2: tuple) -> float:
    """Approximate bearing/heading in degrees from origin to destination."""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    d_lon = lon2 - lon1
    y = np.sin(np.radians(d_lon)) * np.cos(np.radians(lat2))
    x = (np.cos(np.radians(lat1)) * np.sin(np.radians(lat2)) -
         np.sin(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.cos(np.radians(d_lon)))
    bearing = np.degrees(np.arctan2(y, x))
    return round((bearing + 360) % 360, 1)


def simulate_fleet_positions(seed: int = 42, as_of_time: datetime = None) -> List[dict]:
    """
    Generate deterministic, illustrative AIS positions for active fleet vessels.
    """
    if as_of_time is None:
        as_of_time = datetime(2026, 9, 11, 12, 0, 0, tzinfo=timezone.utc)

    rng = np.random.default_rng(seed)
    fleet = []

    for idx, voy in enumerate(REPRESENTATIVE_VOYAGES):
        # Progress along the voyage route (0.05 to 0.95)
        progress = float(rng.uniform(0.10, 0.92))
        orig_coord = PORT_COORDINATES[voy["origin"]]
        dest_coord = PORT_COORDINATES[voy["destination"]]

        cur_lat, cur_lon = interpolate_position(orig_coord, dest_coord, progress)
        heading = calculate_heading(orig_coord, dest_coord)

        # Transit time distribution: log-normal around typical transit days
        transit_std = 0.08 * voy["typical_transit_days"]
        actual_transit_days = float(rng.normal(voy["typical_transit_days"], transit_std))
        actual_transit_days = max(voy["typical_transit_days"] * 0.8, actual_transit_days)

        remaining_days = round(actual_transit_days * (1.0 - progress), 1)
        eta = as_of_time + timedelta(days=remaining_days)

        # Speed (knots)
        speed = round(float(rng.normal(12.4, 0.6)), 1)

        status = "UNDERWAY_LADEN"
        if progress > 0.90:
            status = "WAITING_ANCHORAGE"
            speed = 0.5

        fleet.append({
            "vessel_id": idx + 1,
            "vessel_name": voy["vessel_name"],
            "vessel_class": voy["vessel_class"],
            "dwt": voy["dwt"],
            "origin_region": voy["origin"],
            "destination_port_code": voy["destination"],
            "cargo_tonnage": voy["cargo_tonnage"],
            "cargo_type": voy["cargo_type"],
            "progress_pct": round(progress * 100, 1),
            "current_lat": cur_lat,
            "current_lon": cur_lon,
            "speed_knots": speed,
            "heading_deg": heading,
            "status": status,
            "eta_estimate": eta.isoformat(),
            "remaining_transit_days": remaining_days,
            "data_provenance": PROVENANCE,
            "provenance_notice": "SIMULATED AIS — Illustrative only, not based on real satellite telemetry",
        })

    return fleet


def main():
    parser = argparse.ArgumentParser(description="Coarse Vessel Position / AIS Simulator")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic AIS simulation (default: 42)")
    parser.add_argument("--format", choices=["table", "json"], default="table", help="Output format")
    args = parser.parse_args()

    fleet = simulate_fleet_positions(seed=args.seed)

    if args.format == "json":
        print(json.dumps(fleet, indent=2))
    else:
        print(f"\n=== SIMULATED FLEET AIS POSITIONS (Seed: {args.seed}) ===")
        print(f"{'Vessel':18} | {'Class':10} | {'Origin -> Dest':25} | {'Progress':8} | {'Speed':7} | {'Status':18} | {'Provenance':10}")
        print("-" * 110)
        for v in fleet:
            route = f"{v['origin_region'][:10]} -> {v['destination_port_code']}"
            prog = f"{v['progress_pct']}%"
            spd = f"{v['speed_knots']} kts"
            print(f"{v['vessel_name']:18} | {v['vessel_class']:10} | {route:25} | {prog:8} | {spd:7} | {v['status']:18} | {v['data_provenance']:10}")
        print("-" * 110)
        print(f"Total vessels tracked: {len(fleet)} | All tagged {PROVENANCE}\n")


if __name__ == "__main__":
    main()
