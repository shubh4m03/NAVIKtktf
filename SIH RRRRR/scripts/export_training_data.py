#!/usr/bin/env python3
"""
Export Script: Extract all datasets used to train, calibrate, and evaluate
every model in the SAIL Charter Market Decision System.

Exports:
1. data/model_training_dataset.csv (Full 37,960 rows x 67 columns feature store)
2. data/raw_series/*.csv (Freight index, Bunker fuel, FX, Port Congestion)
3. data/reference_data/*.csv (Port constraints, Vessels, Routes, Weather risk)
4. data/TRAINING_DATA_README.md (Detailed documentation and model mapping)
"""

import os
import sys
from pathlib import Path
import psycopg2
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
RAW_DIR = DATA_DIR / "raw_series"
REF_DIR = DATA_DIR / "reference_data"

DATA_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)
REF_DIR.mkdir(parents=True, exist_ok=True)


def get_db_connection():
    return psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DB", "charter_db"),
        user=os.environ.get("POSTGRES_USER", "charter_user"),
        password=os.environ.get("POSTGRES_PASSWORD", "charter_pass"),
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", 5432)),
    )


def export_table(conn, table_name: str, output_path: Path, order_by: str = None) -> int:
    query = f"SELECT * FROM {table_name}"
    if order_by:
        query += f" ORDER BY {order_by}"
    query += ";"
    
    df = pd.read_sql(query, conn)
    df.to_csv(output_path, index=False)
    print(f"✓ Exported {len(df):>5} rows from '{table_name}' -> {output_path.relative_to(REPO_ROOT)}")
    return len(df)


def main():
    print("Connecting to PostgreSQL charter_db...")
    conn = get_db_connection()
    try:
        print("\n--- 1. Exporting Master Curated Feature Store (Primary Training Data) ---")
        fs_path = DATA_DIR / "model_training_dataset.csv"
        export_table(conn, "feature_store", fs_path, order_by="route_id, vessel_class_id, date ASC")

        print("\n--- 2. Exporting Raw Time Series Datasets ---")
        export_table(conn, "freight_index_series", RAW_DIR / "freight_index_series.csv", order_by="date ASC")
        export_table(conn, "bunker_price_series", RAW_DIR / "bunker_price_series.csv", order_by="date ASC")
        export_table(conn, "fx_rate_series", RAW_DIR / "fx_rate_series.csv", order_by="date ASC")
        export_table(conn, "congestion_series", RAW_DIR / "congestion_series.csv", order_by="port_id, date ASC")

        print("\n--- 3. Exporting Reference Domain Datasets ---")
        export_table(conn, "port_constraints", REF_DIR / "port_constraints.csv", order_by="port_id ASC")
        export_table(conn, "ports", REF_DIR / "ports.csv", order_by="id ASC")
        export_table(conn, "vessel_classes", REF_DIR / "vessel_classes.csv", order_by="id ASC")
        export_table(conn, "vessels", REF_DIR / "vessels.csv", order_by="id ASC")
        export_table(conn, "routes", REF_DIR / "routes.csv", order_by="id ASC")
        export_table(conn, "weather_risk_calendar", REF_DIR / "weather_risk_calendar.csv", order_by="id ASC")

        print("\nAll datasets exported successfully!")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
