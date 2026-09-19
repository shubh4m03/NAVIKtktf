#!/usr/bin/env python3
"""Master data ingestion runner.

Executes all market data ingestion jobs (freight index, bunker, FX).
Isolates each job with try/except so failure in one source does not crash the others.
"""

import sys
import logging
from pathlib import Path

# Add current directory and repo root to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent.parent
sys.path.insert(0, str(CURRENT_DIR))
sys.path.insert(0, str(REPO_ROOT))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ingestion.run_all")

from base import get_connection
import freight_index
import bunker
import fx


def run_all():
    """Run all ingestion jobs with per-source isolation."""
    logger.info("=== Starting Market Data Ingestion Pipeline ===")
    results = {}

    try:
        conn = get_connection()
    except Exception as e:
        logger.error(f"FATAL: Unable to connect to database: {e}")
        sys.exit(1)

    # 1. Freight Index Job
    logger.info("--- [1/3] Running Freight Index Ingestion Job ---")
    try:
        results["freight_index"] = freight_index.validate_and_store(conn=conn)
        logger.info(f"Freight Index Result: {results['freight_index']}")
    except Exception as e:
        logger.error(f"Freight Index job failed: {e}", exc_info=True)
        results["freight_index"] = {"status": "FAILED", "error": str(e), "inserted": 0}

    # 2. Bunker / Crude Oil Job
    logger.info("--- [2/3] Running Bunker / Crude Oil Ingestion Job ---")
    try:
        results["bunker"] = bunker.validate_and_store(conn=conn)
        logger.info(f"Bunker Result: {results['bunker']}")
    except Exception as e:
        logger.error(f"Bunker job failed: {e}", exc_info=True)
        results["bunker"] = {"status": "FAILED", "error": str(e), "inserted": 0}

    # 3. FX (USD/INR) Rate Job
    logger.info("--- [3/3] Running FX Rate Ingestion Job ---")
    try:
        results["fx"] = fx.validate_and_store(conn=conn)
        logger.info(f"FX Result: {results['fx']}")
    except Exception as e:
        logger.error(f"FX job failed: {e}", exc_info=True)
        results["fx"] = {"status": "FAILED", "error": str(e), "inserted": 0}

    # Total counts verification
    logger.info("=== Ingestion Pipeline Completed ===")
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM freight_index_series;")
        total_freight = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM bunker_price_series;")
        total_bunker = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM fx_rate_series;")
        total_fx = cur.fetchone()[0]

    conn.close()

    print("\n================ INGESTION SUMMARY ================")
    for source, res in results.items():
        print(f"  {source:15}: {res.get('status')} | Fetched: {res.get('fetched', 0):4} | New Inserted: {res.get('inserted', 0):4}")
    print("---------------------------------------------------")
    print(f"  Total DB Rows -> freight: {total_freight}, bunker: {total_bunker}, fx: {total_fx}")
    print("===================================================\n")

    return {
        "results": results,
        "totals": {
            "freight_index_series": total_freight,
            "bunker_price_series": total_bunker,
            "fx_rate_series": total_fx,
        }
    }


if __name__ == "__main__":
    run_all()
