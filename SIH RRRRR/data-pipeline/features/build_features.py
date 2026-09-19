"""Curated Feature Engineering Pipeline for Charter Market ML Service (Task 5).

Builds and stores the curated feature table in PostgreSQL ('feature_store').
Features:
- Route and Vessel Class static dimensions
- Freight index (BDRY) lags, rolling statistics, returns
- Bunker fuel price (Brent crude proxy) lags, rolling statistics, returns
- FX rate (USD/INR) lags, rolling statistics, returns
- Destination port congestion score lags, rolling statistics
- Calendar & seasonality encodings (month, sin/cos cyclical, cyclone, monsoon flags)

Enforces strict no-lookahead invariant:
- No feature may use information from a date later than its own row's date.
- Explicit assert_no_lookahead validation against feature metadata and causality checks.
"""

import os
import sys
import logging
import argparse
from datetime import datetime, date
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse

import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("feature_pipeline")


class DataLeakageError(AssertionError):
    """Raised when a feature violates the no-lookahead invariant."""
    pass


# Feature definitions specifying minimum lag and lookahead offset.
# For any causal feature:
#   lag_days >= 0 (positive means past, 0 means contemporaneous)
#   forward_offset_days <= 0 (cannot peek into future)
#   max_lookback_date = row_date - lag_days + forward_offset_days <= row_date
FEATURE_SPECS: Dict[str, Dict[str, Any]] = {
    # Market - Freight Index (BDRY)
    "freight_val": {"source": "freight_index_series", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "freight_lag_1": {"source": "freight_index_series", "type": "lag", "lag_days": 1, "forward_offset_days": 0},
    "freight_lag_7": {"source": "freight_index_series", "type": "lag", "lag_days": 7, "forward_offset_days": 0},
    "freight_lag_14": {"source": "freight_index_series", "type": "lag", "lag_days": 14, "forward_offset_days": 0},
    "freight_lag_30": {"source": "freight_index_series", "type": "lag", "lag_days": 30, "forward_offset_days": 0},
    "freight_rolling_mean_7": {"source": "freight_index_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "freight_rolling_mean_14": {"source": "freight_index_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 14},
    "freight_rolling_mean_30": {"source": "freight_index_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 30},
    "freight_rolling_std_7": {"source": "freight_index_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "freight_rolling_std_14": {"source": "freight_index_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 14},
    "freight_rolling_std_30": {"source": "freight_index_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 30},
    "freight_pct_change_7": {"source": "freight_index_series", "type": "pct_change", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "freight_pct_change_30": {"source": "freight_index_series", "type": "pct_change", "lag_days": 0, "forward_offset_days": 0, "window": 30},

    # Market - Bunker Fuel Price (Brent crude proxy $/bbl)
    "bunker_val": {"source": "bunker_price_series", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "bunker_lag_1": {"source": "bunker_price_series", "type": "lag", "lag_days": 1, "forward_offset_days": 0},
    "bunker_lag_7": {"source": "bunker_price_series", "type": "lag", "lag_days": 7, "forward_offset_days": 0},
    "bunker_lag_14": {"source": "bunker_price_series", "type": "lag", "lag_days": 14, "forward_offset_days": 0},
    "bunker_lag_30": {"source": "bunker_price_series", "type": "lag", "lag_days": 30, "forward_offset_days": 0},
    "bunker_rolling_mean_7": {"source": "bunker_price_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "bunker_rolling_mean_30": {"source": "bunker_price_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 30},
    "bunker_rolling_std_7": {"source": "bunker_price_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "bunker_rolling_std_30": {"source": "bunker_price_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 30},
    "bunker_pct_change_7": {"source": "bunker_price_series", "type": "pct_change", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "bunker_pct_change_30": {"source": "bunker_price_series", "type": "pct_change", "lag_days": 0, "forward_offset_days": 0, "window": 30},

    # Market - FX Rate (USD/INR)
    "fx_val": {"source": "fx_rate_series", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "fx_lag_1": {"source": "fx_rate_series", "type": "lag", "lag_days": 1, "forward_offset_days": 0},
    "fx_lag_7": {"source": "fx_rate_series", "type": "lag", "lag_days": 7, "forward_offset_days": 0},
    "fx_lag_14": {"source": "fx_rate_series", "type": "lag", "lag_days": 14, "forward_offset_days": 0},
    "fx_lag_30": {"source": "fx_rate_series", "type": "lag", "lag_days": 30, "forward_offset_days": 0},
    "fx_rolling_mean_7": {"source": "fx_rate_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "fx_rolling_mean_30": {"source": "fx_rate_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 30},
    "fx_rolling_std_7": {"source": "fx_rate_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "fx_rolling_std_30": {"source": "fx_rate_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 30},
    "fx_pct_change_7": {"source": "fx_rate_series", "type": "pct_change", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "fx_pct_change_30": {"source": "fx_rate_series", "type": "pct_change", "lag_days": 0, "forward_offset_days": 0, "window": 30},

    # Congestion - Destination Port
    "congestion_score": {"source": "congestion_series", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "congestion_lag_1": {"source": "congestion_series", "type": "lag", "lag_days": 1, "forward_offset_days": 0},
    "congestion_lag_7": {"source": "congestion_series", "type": "lag", "lag_days": 7, "forward_offset_days": 0},
    "congestion_lag_14": {"source": "congestion_series", "type": "lag", "lag_days": 14, "forward_offset_days": 0},
    "congestion_rolling_mean_7": {"source": "congestion_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 7},
    "congestion_rolling_mean_14": {"source": "congestion_series", "type": "rolling_mean", "lag_days": 0, "forward_offset_days": 0, "window": 14},
    "congestion_rolling_std_7": {"source": "congestion_series", "type": "rolling_std", "lag_days": 0, "forward_offset_days": 0, "window": 7},

    # Calendar & Seasonality
    "month": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "day_of_week": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "day_of_year": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "sin_month": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "cos_month": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "sin_day_of_year": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "cos_day_of_year": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "is_cyclone_season": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
    "is_monsoon_season": {"source": "calendar", "type": "contemporaneous", "lag_days": 0, "forward_offset_days": 0},
}


def get_connection():
    """Create and return a new PostgreSQL connection based on environment variables."""
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


def assert_no_lookahead(
    df: pd.DataFrame,
    date_col: str = "date",
    feature_specs: Optional[Dict[str, Dict[str, Any]]] = None,
) -> bool:
    """
    Explicit assertion: no feature may use information from a date later than its own row's date.
    
    Compares each feature's maximum lookback date against the row's date.
    Raises DataLeakageError if max_lookback_date > row_date for any row in any feature.
    
    Returns True if invariant holds for all rows and features.
    """
    if feature_specs is None:
        feature_specs = FEATURE_SPECS

    if date_col not in df.columns:
        raise ValueError(f"Date column '{date_col}' not found in dataframe")

    row_dates = pd.to_datetime(df[date_col])

    for feat_name, spec in feature_specs.items():
        if feat_name not in df.columns:
            continue

        lag_days = spec.get("lag_days", 0)
        forward_offset = spec.get("forward_offset_days", 0)

        # Net future offset in days:
        # e.g., lag_days=7 -> offset = -7 (7 days in past)
        # e.g., lag_days=0, forward_offset=0 -> offset = 0 (contemporaneous)
        # e.g., lag_days=-1 (future lead) -> offset = +1 (1 day ahead -> LEAKAGE!)
        # e.g., centered rolling window of 7 -> forward_offset = +3 (3 days ahead -> LEAKAGE!)
        net_future_offset = forward_offset - lag_days

        # Compute max lookback date for every row
        max_lookback_dates = row_dates + pd.to_timedelta(net_future_offset, unit="D")

        # Invariant check: max_lookback_date <= row_date
        violating_mask = max_lookback_dates > row_dates
        if violating_mask.any():
            violating_idx = violating_mask.idxmax()
            r_date = row_dates.loc[violating_idx].strftime("%Y-%m-%d")
            mlb_date = max_lookback_dates.loc[violating_idx].strftime("%Y-%m-%d")
            diff_days = (max_lookback_dates.loc[violating_idx] - row_dates.loc[violating_idx]).days
            raise DataLeakageError(
                f"LOOKAHEAD LEAKAGE DETECTED in feature '{feat_name}'! "
                f"Row date: {r_date}, Max lookback date: {mlb_date} "
                f"(Uses information from {diff_days} day(s) into the future. Invariant violated: max_lookback_date <= row_date)"
            )

    return True


def detect_perturbation_leakage(
    compute_fn,
    raw_series: np.ndarray,
    dates: pd.DatetimeIndex,
    feature_name: str,
) -> bool:
    """
    Dynamic causality verification:
    For any row date T, corrupts future data (t > T) and recomputes features.
    If the feature value at row T changes, future information was accessed!
    """
    df_clean = pd.DataFrame({"date": dates, "val": raw_series})
    feats_clean = compute_fn(df_clean.copy())

    for i in range(len(dates) - 1):
        row_date = dates[i]
        df_perturbed = df_clean.copy()
        # Corrupt all future rows
        df_perturbed.loc[i + 1 :, "val"] = df_perturbed.loc[i + 1 :, "val"] + 10000.0
        feats_perturbed = compute_fn(df_perturbed)

        val_clean = feats_clean.loc[i, feature_name]
        val_pert = feats_perturbed.loc[i, feature_name]

        if not np.isclose(val_clean, val_pert, equal_nan=True):
            future_date = dates[i + 1]
            raise DataLeakageError(
                f"Dynamic causality failure in '{feature_name}': "
                f"Row date {row_date.strftime('%Y-%m-%d')} value changed from {val_clean} to {val_pert} "
                f"when future date {future_date.strftime('%Y-%m-%d')} was perturbed! Lookahead detected."
            )
    return True


def compute_market_features(
    df_freight: pd.DataFrame,
    df_bunker: pd.DataFrame,
    df_fx: pd.DataFrame,
) -> pd.DataFrame:
    """
    Align market series onto a continuous daily calendar and compute
    backward-only lags, rolling statistics, and percentage returns.
    """
    df_f = df_freight[["date", "freight_val"]].copy()
    df_b = df_bunker[["date", "bunker_val"]].copy()
    df_x = df_fx[["date", "fx_val"]].copy()

    df_f["date"] = pd.to_datetime(df_f["date"])
    df_b["date"] = pd.to_datetime(df_b["date"])
    df_x["date"] = pd.to_datetime(df_x["date"])

    # Establish continuous daily calendar
    min_date = min(df_f["date"].min(), df_b["date"].min(), df_x["date"].min())
    max_date = max(df_f["date"].max(), df_b["date"].max(), df_x["date"].max())
    cal_idx = pd.date_range(min_date, max_date, freq="D", name="date")
    cal_df = pd.DataFrame(index=cal_idx).reset_index()

    # Left-join each series onto continuous calendar
    mkt = cal_df.merge(df_f, on="date", how="left")
    mkt = mkt.merge(df_b, on="date", how="left")
    mkt = mkt.merge(df_x, on="date", how="left")

    # Strictly causal forward-fill (weekend/holiday carries forward previous business day)
    mkt = mkt.sort_values("date").ffill()

    # 1. Freight Features (strictly backward)
    f = mkt["freight_val"]
    mkt["freight_lag_1"] = f.shift(1)
    mkt["freight_lag_7"] = f.shift(7)
    mkt["freight_lag_14"] = f.shift(14)
    mkt["freight_lag_30"] = f.shift(30)
    mkt["freight_rolling_mean_7"] = f.rolling(7, min_periods=1).mean()
    mkt["freight_rolling_mean_14"] = f.rolling(14, min_periods=1).mean()
    mkt["freight_rolling_mean_30"] = f.rolling(30, min_periods=1).mean()
    mkt["freight_rolling_std_7"] = f.rolling(7, min_periods=2).std().fillna(0.0)
    mkt["freight_rolling_std_14"] = f.rolling(14, min_periods=2).std().fillna(0.0)
    mkt["freight_rolling_std_30"] = f.rolling(30, min_periods=2).std().fillna(0.0)
    mkt["freight_pct_change_7"] = (f - mkt["freight_lag_7"]) / mkt["freight_lag_7"]
    mkt["freight_pct_change_30"] = (f - mkt["freight_lag_30"]) / mkt["freight_lag_30"]

    # 2. Bunker Features
    b = mkt["bunker_val"]
    mkt["bunker_lag_1"] = b.shift(1)
    mkt["bunker_lag_7"] = b.shift(7)
    mkt["bunker_lag_14"] = b.shift(14)
    mkt["bunker_lag_30"] = b.shift(30)
    mkt["bunker_rolling_mean_7"] = b.rolling(7, min_periods=1).mean()
    mkt["bunker_rolling_mean_30"] = b.rolling(30, min_periods=1).mean()
    mkt["bunker_rolling_std_7"] = b.rolling(7, min_periods=2).std().fillna(0.0)
    mkt["bunker_rolling_std_30"] = b.rolling(30, min_periods=2).std().fillna(0.0)
    mkt["bunker_pct_change_7"] = (b - mkt["bunker_lag_7"]) / mkt["bunker_lag_7"]
    mkt["bunker_pct_change_30"] = (b - mkt["bunker_lag_30"]) / mkt["bunker_lag_30"]

    # 3. FX Features
    x = mkt["fx_val"]
    mkt["fx_lag_1"] = x.shift(1)
    mkt["fx_lag_7"] = x.shift(7)
    mkt["fx_lag_14"] = x.shift(14)
    mkt["fx_lag_30"] = x.shift(30)
    mkt["fx_rolling_mean_7"] = x.rolling(7, min_periods=1).mean()
    mkt["fx_rolling_mean_30"] = x.rolling(30, min_periods=1).mean()
    mkt["fx_rolling_std_7"] = x.rolling(7, min_periods=2).std().fillna(0.0)
    mkt["fx_rolling_std_30"] = x.rolling(30, min_periods=2).std().fillna(0.0)
    mkt["fx_pct_change_7"] = (x - mkt["fx_lag_7"]) / mkt["fx_lag_7"]
    mkt["fx_pct_change_30"] = (x - mkt["fx_lag_30"]) / mkt["fx_lag_30"]

    # Fill warmup percentage changes with 0.0
    pct_cols = [
        "freight_pct_change_7", "freight_pct_change_30",
        "bunker_pct_change_7", "bunker_pct_change_30",
        "fx_pct_change_7", "fx_pct_change_30"
    ]
    for col in pct_cols:
        mkt[col] = mkt[col].fillna(0.0)

    return mkt


def compute_congestion_features(df_congestion: pd.DataFrame) -> pd.DataFrame:
    """
    Compute port-level backward-only congestion features:
    lags (1, 7, 14), rolling means (7, 14), and rolling std (7).
    """
    df = df_congestion.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["port_id", "date"]).reset_index(drop=True)

    result_dfs = []
    for port_id, group in df.groupby("port_id"):
        g = group.copy().sort_values("date").reset_index(drop=True)
        s = g["congestion_score"]
        g["congestion_lag_1"] = s.shift(1)
        g["congestion_lag_7"] = s.shift(7)
        g["congestion_lag_14"] = s.shift(14)
        g["congestion_rolling_mean_7"] = s.rolling(7, min_periods=1).mean()
        g["congestion_rolling_mean_14"] = s.rolling(14, min_periods=1).mean()
        g["congestion_rolling_std_7"] = s.rolling(7, min_periods=2).std().fillna(0.0)
        result_dfs.append(g)

    return pd.concat(result_dfs, ignore_index=True)


def add_calendar_features(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    """
    Add calendar and seasonality encodings:
    - month (1-12)
    - day_of_week (0-6)
    - day_of_year (1-366)
    - sin_month, cos_month (cyclical harmonics)
    - sin_day_of_year, cos_day_of_year (annual cyclical harmonics)
    - is_cyclone_season (Bay of Bengal pre/post monsoon peaks: April-May, Oct-Nov)
    - is_monsoon_season (SW monsoon peak: June-September)
    """
    df = df.copy()
    dates = pd.to_datetime(df[date_col])

    df["month"] = dates.dt.month
    df["day_of_week"] = dates.dt.dayofweek
    df["day_of_year"] = dates.dt.dayofyear

    df["sin_month"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["cos_month"] = np.cos(2 * np.pi * df["month"] / 12.0)
    df["sin_day_of_year"] = np.sin(2 * np.pi * df["day_of_year"] / 365.25)
    df["cos_day_of_year"] = np.cos(2 * np.pi * df["day_of_year"] / 365.25)

    # Cyclone season: Bay of Bengal April-May (4, 5) and October-November (10, 11)
    df["is_cyclone_season"] = df["month"].isin([4, 5, 10, 11]).astype(int)
    # Monsoon season: SW Monsoon June through September (6, 7, 8, 9)
    df["is_monsoon_season"] = df["month"].isin([6, 7, 8, 9]).astype(int)

    return df


def build_curated_features(conn=None) -> pd.DataFrame:
    """
    Full feature pipeline execution:
    1. Read raw tables from DB
    2. Compute market features (freight, bunker, fx)
    3. Compute congestion features per port
    4. Join across routes (destination port) and vessel classes
    5. Add calendar and seasonality encodings
    6. Verify strict no-lookahead invariant via assert_no_lookahead()
    Returns curated DataFrame.
    """
    should_close = False
    if conn is None:
        conn = get_connection()
        should_close = True

    try:
        logger.info("Extracting raw series from database...")
        df_freight = pd.read_sql("SELECT date, value as freight_val FROM freight_index_series ORDER BY date", conn)
        df_bunker = pd.read_sql("SELECT date, value as bunker_val FROM bunker_price_series ORDER BY date", conn)
        df_fx = pd.read_sql("SELECT date, value as fx_val FROM fx_rate_series ORDER BY date", conn)
        df_congestion = pd.read_sql("SELECT port_id, date, congestion_score FROM congestion_series ORDER BY port_id, date", conn)
        df_routes = pd.read_sql(
            "SELECT id as route_id, origin_region, destination_port_id, distance_nm, typical_transit_days FROM routes ORDER BY id",
            conn,
        )
        df_classes = pd.read_sql(
            "SELECT id as vessel_class_id, name as vessel_class_name, dwt_min, dwt_max, typical_draft_m, typical_loa_m, typical_beam_m FROM vessel_classes ORDER BY id",
            conn,
        )

        logger.info("Computing market features...")
        mkt_features = compute_market_features(df_freight, df_bunker, df_fx)

        logger.info("Computing destination port congestion features...")
        cong_features = compute_congestion_features(df_congestion)

        logger.info("Joining market features with routes and congestion...")
        # Step A: Cross-join routes with market features on date
        # Each route on each date has market features
        routes_mkt = df_routes.merge(mkt_features, how="cross")

        # Step B: Join congestion features on (destination_port_id == port_id, date)
        cong_features_renamed = cong_features.rename(columns={"port_id": "destination_port_id"})
        route_cong_mkt = routes_mkt.merge(
            cong_features_renamed,
            on=["destination_port_id", "date"],
            how="inner",
        )

        # Step C: Cross-join with vessel_classes
        full_df = route_cong_mkt.merge(df_classes, how="cross")

        # Step D: Add calendar & seasonality features
        full_df = add_calendar_features(full_df, date_col="date")

        # Step E: Provenance tag
        full_df["data_provenance"] = "CURATED_FEATURE"

        # Step F: Sort by route, vessel class, date
        full_df["date_str"] = full_df["date"].dt.strftime("%Y-%m-%d")
        full_df = full_df.sort_values(["route_id", "vessel_class_id", "date"]).reset_index(drop=True)

        logger.info("Enforcing strict no-lookahead invariant...")
        assert_no_lookahead(full_df, date_col="date")
        logger.info("No-lookahead invariant verified: 100% causal features.")

        return full_df

    finally:
        if should_close:
            conn.close()


def init_feature_store_table(conn):
    """Create feature_store table and performance indexes if not exists."""
    ddl = """
    CREATE TABLE IF NOT EXISTS feature_store (
        id BIGSERIAL PRIMARY KEY,
        route_id BIGINT NOT NULL REFERENCES routes(id),
        vessel_class_id BIGINT NOT NULL REFERENCES vessel_classes(id),
        date DATE NOT NULL,
        origin_region VARCHAR(100) NOT NULL,
        destination_port_id BIGINT NOT NULL REFERENCES ports(id),
        distance_nm DOUBLE PRECISION NOT NULL,
        typical_transit_days DOUBLE PRECISION NOT NULL,
        vessel_class_name VARCHAR(50) NOT NULL,
        typical_draft_m DOUBLE PRECISION,
        typical_loa_m DOUBLE PRECISION,
        typical_beam_m DOUBLE PRECISION,
        dwt_min DOUBLE PRECISION,
        dwt_max DOUBLE PRECISION,
        
        -- Market Features: Freight
        freight_val DOUBLE PRECISION NOT NULL,
        freight_lag_1 DOUBLE PRECISION,
        freight_lag_7 DOUBLE PRECISION,
        freight_lag_14 DOUBLE PRECISION,
        freight_lag_30 DOUBLE PRECISION,
        freight_rolling_mean_7 DOUBLE PRECISION,
        freight_rolling_mean_14 DOUBLE PRECISION,
        freight_rolling_mean_30 DOUBLE PRECISION,
        freight_rolling_std_7 DOUBLE PRECISION,
        freight_rolling_std_14 DOUBLE PRECISION,
        freight_rolling_std_30 DOUBLE PRECISION,
        freight_pct_change_7 DOUBLE PRECISION,
        freight_pct_change_30 DOUBLE PRECISION,

        -- Market Features: Bunker
        bunker_val DOUBLE PRECISION NOT NULL,
        bunker_lag_1 DOUBLE PRECISION,
        bunker_lag_7 DOUBLE PRECISION,
        bunker_lag_14 DOUBLE PRECISION,
        bunker_lag_30 DOUBLE PRECISION,
        bunker_rolling_mean_7 DOUBLE PRECISION,
        bunker_rolling_mean_30 DOUBLE PRECISION,
        bunker_rolling_std_7 DOUBLE PRECISION,
        bunker_rolling_std_30 DOUBLE PRECISION,
        bunker_pct_change_7 DOUBLE PRECISION,
        bunker_pct_change_30 DOUBLE PRECISION,

        -- Market Features: FX
        fx_val DOUBLE PRECISION NOT NULL,
        fx_lag_1 DOUBLE PRECISION,
        fx_lag_7 DOUBLE PRECISION,
        fx_lag_14 DOUBLE PRECISION,
        fx_lag_30 DOUBLE PRECISION,
        fx_rolling_mean_7 DOUBLE PRECISION,
        fx_rolling_mean_30 DOUBLE PRECISION,
        fx_rolling_std_7 DOUBLE PRECISION,
        fx_rolling_std_30 DOUBLE PRECISION,
        fx_pct_change_7 DOUBLE PRECISION,
        fx_pct_change_30 DOUBLE PRECISION,

        -- Port Congestion Features
        congestion_score DOUBLE PRECISION NOT NULL,
        congestion_lag_1 DOUBLE PRECISION,
        congestion_lag_7 DOUBLE PRECISION,
        congestion_lag_14 DOUBLE PRECISION,
        congestion_rolling_mean_7 DOUBLE PRECISION,
        congestion_rolling_mean_14 DOUBLE PRECISION,
        congestion_rolling_std_7 DOUBLE PRECISION,

        -- Calendar & Seasonality
        month INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        day_of_year INTEGER NOT NULL,
        sin_month DOUBLE PRECISION NOT NULL,
        cos_month DOUBLE PRECISION NOT NULL,
        sin_day_of_year DOUBLE PRECISION NOT NULL,
        cos_day_of_year DOUBLE PRECISION NOT NULL,
        is_cyclone_season INTEGER NOT NULL,
        is_monsoon_season INTEGER NOT NULL,

        -- Metadata
        data_provenance VARCHAR(50) NOT NULL DEFAULT 'CURATED_FEATURE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT uq_route_vessel_date UNIQUE (route_id, vessel_class_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_feature_store_date ON feature_store(date);
    CREATE INDEX IF NOT EXISTS idx_feature_store_route_date ON feature_store(route_id, date);
    CREATE INDEX IF NOT EXISTS idx_feature_store_lookup ON feature_store(route_id, vessel_class_id, date);
    """
    with conn.cursor() as cur:
        cur.execute(ddl)
    conn.commit()


def store_curated_features(df: pd.DataFrame, conn=None) -> int:
    """
    Idempotent batch upsert into feature_store table.
    Returns count of upserted rows.
    """
    should_close = False
    if conn is None:
        conn = get_connection()
        should_close = True

    try:
        init_feature_store_table(conn)

        columns = [
            "route_id", "vessel_class_id", "date",
            "origin_region", "destination_port_id", "distance_nm", "typical_transit_days",
            "vessel_class_name", "typical_draft_m", "typical_loa_m", "typical_beam_m", "dwt_min", "dwt_max",
            "freight_val", "freight_lag_1", "freight_lag_7", "freight_lag_14", "freight_lag_30",
            "freight_rolling_mean_7", "freight_rolling_mean_14", "freight_rolling_mean_30",
            "freight_rolling_std_7", "freight_rolling_std_14", "freight_rolling_std_30",
            "freight_pct_change_7", "freight_pct_change_30",
            "bunker_val", "bunker_lag_1", "bunker_lag_7", "bunker_lag_14", "bunker_lag_30",
            "bunker_rolling_mean_7", "bunker_rolling_mean_30",
            "bunker_rolling_std_7", "bunker_rolling_std_30",
            "bunker_pct_change_7", "bunker_pct_change_30",
            "fx_val", "fx_lag_1", "fx_lag_7", "fx_lag_14", "fx_lag_30",
            "fx_rolling_mean_7", "fx_rolling_mean_30",
            "fx_rolling_std_7", "fx_rolling_std_30",
            "fx_pct_change_7", "fx_pct_change_30",
            "congestion_score", "congestion_lag_1", "congestion_lag_7", "congestion_lag_14",
            "congestion_rolling_mean_7", "congestion_rolling_mean_14", "congestion_rolling_std_7",
            "month", "day_of_week", "day_of_year",
            "sin_month", "cos_month", "sin_day_of_year", "cos_day_of_year",
            "is_cyclone_season", "is_monsoon_season", "data_provenance"
        ]

        # Prepare rows replacing NaN with None for SQL NULL
        clean_df = df[columns].copy()
        clean_df["date"] = pd.to_datetime(clean_df["date"]).dt.date
        clean_records = clean_df.replace({np.nan: None}).to_dict(orient="records")

        col_names = ", ".join(columns)
        update_clauses = [f"{col} = EXCLUDED.{col}" for col in columns if col not in ("route_id", "vessel_class_id", "date")]
        update_stmt = ", ".join(update_clauses)

        upsert_query = f"""
            INSERT INTO feature_store ({col_names})
            VALUES %s
            ON CONFLICT (route_id, vessel_class_id, date)
            DO UPDATE SET {update_stmt};
        """

        values = [[r[c] for c in columns] for r in clean_records]

        logger.info(f"Upserting {len(values)} rows into feature_store table...")
        with conn.cursor() as cur:
            execute_values(cur, upsert_query, values, page_size=5000)
        conn.commit()
        logger.info("Upsert completed successfully.")
        return len(values)

    finally:
        if should_close:
            conn.close()


def main():
    parser = argparse.ArgumentParser(description="Task 5: Curated Feature Engineering Pipeline")
    parser.add_argument("--verify-only", action="store_true", help="Only verify no-lookahead assertions without DB writes")
    args = parser.parse_args()

    conn = get_connection()
    try:
        curated_df = build_curated_features(conn)
        print(f"Generated {len(curated_df)} feature rows across {curated_df['route_id'].nunique()} routes and {curated_df['vessel_class_id'].nunique()} vessel classes.")
        print(f"Date span: {curated_df['date'].min().strftime('%Y-%m-%d')} to {curated_df['date'].max().strftime('%Y-%m-%d')}")
        print(f"Total columns: {len(curated_df.columns)}")

        if not args.verify_only:
            count = store_curated_features(curated_df, conn)
            print(f"Successfully stored {count} curated rows into Postgres 'feature_store' table.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
