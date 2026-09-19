"""Seasonally-modulated stochastic simulator for port congestion.

Generates deterministic, seeded daily congestion score series for ports,
modulated by the seasonal weather risk calendar (monsoon/cyclone seasons).
Every generated and stored row is stamped with data_provenance='SIMULATED'.
"""

import argparse
import logging
from datetime import date, timedelta
from typing import Dict, List, Optional
import numpy as np
import psycopg2
from urllib.parse import urlparse
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("simulation.congestion")

PROVENANCE = "SIMULATED"

# Base average congestion score per port (0-100 scale)
# Calibrated to port infrastructure and turnaround days (§17 & §3.3)
DEFAULT_PORT_BASE_SCORES: Dict[str, float] = {
    "PRT": 42.0,  # Paradip: busy mechanized coal hub
    "VTZ": 36.0,  # Visakhapatnam: outer + inner harbor
    "DHM": 24.0,  # Dhamra: deep draft private modern terminal, faster turnaround
    "HAL": 54.0,  # Haldia: riverine draft restrictions, tidal wait delays
    "GGV": 30.0,  # Gangavaram: deep draft bulk terminal
}

# Weather risk multipliers based on §3.3 (monsoon/cyclone calendar for Bay of Bengal)
RISK_MULTIPLIERS: Dict[str, float] = {
    "HIGH": 1.65,    # Apr-May pre-monsoon & Oct-Nov post-monsoon cyclone peaks
    "MEDIUM": 1.25,  # Jun-Sep active southwest monsoon (swell, rain delays)
    "LOW": 0.90,     # Dec-Mar calm winter weather
}

# Default month -> risk level mapping (§3.3)
MONTH_RISK_MAP: Dict[int, str] = {
    1: "LOW", 2: "LOW", 3: "LOW",
    4: "HIGH", 5: "HIGH",
    6: "MEDIUM", 7: "MEDIUM", 8: "MEDIUM", 9: "MEDIUM",
    10: "HIGH", 11: "HIGH",
    12: "LOW"
}


def get_connection():
    """Create database connection."""
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        result = urlparse(db_url)
        return psycopg2.connect(
            dbname=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port or 5432,
        )
    return psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DB", "charter_db"),
        user=os.environ.get("POSTGRES_USER", "charter_user"),
        password=os.environ.get("POSTGRES_PASSWORD", "charter_pass"),
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", 5432)),
    )


def load_weather_risk_map(conn) -> Dict[int, str]:
    """Load monthly risk levels from weather_risk_calendar table if available."""
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT month, risk_level FROM weather_risk_calendar WHERE region = 'Bay of Bengal' ORDER BY month;")
            rows = cur.fetchall()
            if rows:
                return {row[0]: row[1] for row in rows}
    except Exception as e:
        logger.warning(f"Could not load weather_risk_calendar: {e}. Using default calendar.")
    return MONTH_RISK_MAP


def load_ports(conn) -> List[dict]:
    """Load active ports from ports table."""
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, code, name FROM ports ORDER BY id;")
            rows = cur.fetchall()
            if rows:
                return [{"id": r[0], "code": r[1], "name": r[2]} for r in rows]
    except Exception as e:
        logger.warning(f"Could not load ports from DB: {e}. Using default ports.")
    return [
        {"id": 1, "code": "PRT", "name": "Paradip"},
        {"id": 2, "code": "VTZ", "name": "Visakhapatnam"},
        {"id": 3, "code": "DHM", "name": "Dhamra"},
        {"id": 4, "code": "HAL", "name": "Haldia"},
        {"id": 5, "code": "GGV", "name": "Gangavaram"},
    ]


def simulate_congestion_series(
    port_id: int,
    port_code: str,
    start_date: date,
    end_date: date,
    seed: int = 42,
    weather_map: Optional[Dict[int, str]] = None,
) -> List[dict]:
    """
    Simulate daily port congestion scores using a seasonally-modulated
    Ornstein-Uhlenbeck (mean-reverting) stochastic process.

    S_t = S_{t-1} + theta * (mu(t) - S_{t-1}) + sigma * epsilon_t + jump_t
    """
    if weather_map is None:
        weather_map = MONTH_RISK_MAP

    rng = np.random.default_rng(seed + port_id * 1000)
    base_mu = DEFAULT_PORT_BASE_SCORES.get(port_code, 35.0)

    theta = 0.14  # Reversion speed to seasonal mean
    sigma = 3.8   # Daily Brownian volatility

    current_val = base_mu * RISK_MULTIPLIERS.get(weather_map.get(start_date.month, "LOW"), 1.0)
    num_days = (end_date - start_date).days + 1

    records = []
    for i in range(num_days):
        cur_date = start_date + timedelta(days=i)
        risk_level = weather_map.get(cur_date.month, "LOW")
        multiplier = RISK_MULTIPLIERS.get(risk_level, 1.0)
        target_mu = base_mu * multiplier

        # Stochastic mean-reversion step
        drift = theta * (target_mu - current_val)
        diffusion = sigma * rng.standard_normal()

        # Occasional jump shock (cyclone weather alert or berth breakdown)
        jump = 0.0
        if risk_level == "HIGH" and rng.random() < 0.05:
            jump = rng.uniform(8.0, 18.0)
        elif risk_level == "MEDIUM" and rng.random() < 0.03:
            jump = rng.uniform(4.0, 10.0)

        current_val = current_val + drift + diffusion + jump
        # Clamp to realistic bounds [5.0, 98.0]
        current_val = float(np.clip(current_val, 5.0, 98.0))

        records.append({
            "port_id": port_id,
            "port_code": port_code,
            "date": cur_date,
            "congestion_score": round(current_val, 2),
            "data_provenance": PROVENANCE,
        })

    return records


def store_congestion_records(records: List[dict], conn) -> int:
    """Idempotently insert congestion records into congestion_series table."""
    query = """
        INSERT INTO congestion_series (port_id, date, congestion_score, data_provenance)
        SELECT %(port_id)s, %(date)s, %(congestion_score)s, %(data_provenance)s
        WHERE NOT EXISTS (
            SELECT 1 FROM congestion_series
            WHERE port_id = %(port_id)s AND date = %(date)s
        );
    """
    inserted = 0
    with conn.cursor() as cur:
        for r in records:
            if r.get("data_provenance") != PROVENANCE:
                raise ValueError(f"Every row MUST have data_provenance='{PROVENANCE}', got: {r.get('data_provenance')}")
            cur.execute(query, r)
            inserted += cur.rowcount
        conn.commit()
    return inserted


def run_simulation(
    seed: int = 42,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    store_db: bool = True,
) -> Dict[str, any]:
    """
    Run the deterministic congestion simulation for all ports.
    """
    if end_date is None:
        end_date = date(2026, 9, 10)
    if start_date is None:
        start_date = end_date - timedelta(days=730)  # 2 years

    conn = get_connection()
    weather_map = load_weather_risk_map(conn)
    ports = load_ports(conn)

    all_records = []
    logger.info(f"Running deterministic congestion simulation with seed={seed}")
    logger.info(f"Time range: {start_date} to {end_date} ({len(ports)} ports)")

    for p in ports:
        port_records = simulate_congestion_series(
            port_id=p["id"],
            port_code=p["code"],
            start_date=start_date,
            end_date=end_date,
            seed=seed,
            weather_map=weather_map,
        )
        all_records.extend(port_records)
        logger.info(f"  Port {p['name']} ({p['code']}): simulated {len(port_records)} daily scores")

    inserted = 0
    if store_db:
        inserted = store_congestion_records(all_records, conn)
        logger.info(f"Stored congestion records: {len(all_records)} generated, {inserted} newly inserted")

    conn.close()

    return {
        "seed": seed,
        "total_generated": len(all_records),
        "total_inserted": inserted,
        "records": all_records,
        "ports": [p["code"] for p in ports],
        "data_provenance": PROVENANCE,
    }


def main():
    parser = argparse.ArgumentParser(description="Deterministic Port Congestion Simulator")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic simulation (default: 42)")
    parser.add_argument("--start-date", type=str, default=None, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, default=None, help="End date (YYYY-MM-DD)")
    parser.add_argument("--no-db", action="store_true", help="Run simulation without writing to database")
    args = parser.parse_args()

    s_date = date.fromisoformat(args.start_date) if args.start_date else None
    e_date = date.fromisoformat(args.end_date) if args.end_date else None

    result = run_simulation(
        seed=args.seed,
        start_date=s_date,
        end_date=e_date,
        store_db=not args.no_db,
    )
    print(f"\nSimulation complete. Generated {result['total_generated']} rows (seed={result['seed']}), newly inserted: {result['total_inserted']}.")


if __name__ == "__main__":
    main()
