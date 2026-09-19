"""Generic Walk-Forward Backtesting Harness for Forecasting Models (Task 6).

Evaluates models strictly chronologically:
- No lookahead: training data at cutoff T contains only rows with date <= T.
- Multi-horizon evaluation across expanding or rolling historical windows.
- Computes comprehensive probabilistic and point metrics:
  MAE, RMSE, sMAPE, Pinball Loss, Calibration Coverage (50%, 90%), Directional Accuracy.
- Generates a multi-route comparison table: model x route x metric.
"""

import os
import sys
import argparse
import logging
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse

import numpy as np
import pandas as pd
import psycopg2

from app.backtesting.metrics import calculate_all_metrics
from app.models.base import BaseModel
from app.models.naive import NaiveModel
from app.models.seasonal_naive import SeasonalNaiveModel
from app.models.sarimax import SARIMAXModel
from app.models.lgbm_quantile import QuantileLGBMModel
from app.models.conformal import ConformalQuantileModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("walk_forward_harness")


def get_db_connection():
    """Create a connection to the charter PostgreSQL database."""
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


def load_route_data_from_db(
    conn=None,
    vessel_class_id: int = 1,
) -> pd.DataFrame:
    """Load curated feature store series grouped by route."""
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    query = f"""
        SELECT *
        FROM feature_store
        WHERE vessel_class_id = {vessel_class_id}
        ORDER BY route_id, date ASC;
    """
    try:
        df = pd.read_sql(query, conn)
        df["date"] = pd.to_datetime(df["date"])
        return df
    finally:
        if should_close:
            conn.close()


def run_walk_forward_single(
    df: pd.DataFrame,
    models: Dict[str, BaseModel],
    target_col: str = "freight_val",
    date_col: str = "date",
    train_window: int = 200,
    horizon: int = 14,
    step: int = 28,
    alphas: List[float] = [0.05, 0.25, 0.5, 0.75, 0.95],
) -> Dict[str, Dict[str, float]]:
    """
    Run chronological walk-forward backtesting on a single time-series DataFrame.
    Returns: {model_name: {metric_name: value}}
    """
    df_sorted = df.sort_values(date_col).reset_index(drop=True)
    n = len(df_sorted)

    if n < train_window + horizon:
        raise ValueError(
            f"Series length ({n}) is too short for train_window ({train_window}) + horizon ({horizon})"
        )

    # Accumulate predictions and truth across all folds
    records = {
        name: {"y_true": [], "y_pred": [], "quantiles": {a: [] for a in alphas}}
        for name in models
    }

    fold_cutoffs = range(train_window, n - horizon + 1, step)
    for cutoff in fold_cutoffs:
        train_df = df_sorted.iloc[:cutoff]
        test_df = df_sorted.iloc[cutoff : cutoff + horizon]
        y_true_fold = test_df[target_col].values

        for name, model in models.items():
            try:
                model.fit(train_df, target_col=target_col, date_col=date_col)
                pred_df = model.predict_quantiles(
                    horizon=len(test_df), alphas=alphas, test_df=test_df
                )

                records[name]["y_true"].extend(y_true_fold)
                records[name]["y_pred"].extend(pred_df["prediction"].values)
                for a in alphas:
                    if f"q_{a}" in pred_df.columns:
                        records[name]["quantiles"][a].extend(pred_df[f"q_{a}"].values)
            except Exception as e:
                logger.warning(f"Fold cutoff {cutoff} model '{name}' fit/predict failed: {e}")

    # Compute aggregate metrics for each model
    results = {}
    for name in models:
        y_t = np.array(records[name]["y_true"])
        y_p = np.array(records[name]["y_pred"])
        q_dict = {a: np.array(records[name]["quantiles"][a]) for a in alphas}
        if len(y_t) > 0:
            results[name] = calculate_all_metrics(
                y_true=y_t, y_pred=y_p, quantiles_dict=q_dict
            )
        else:
            results[name] = {}

    return results


def run_walk_forward_harness(
    df: pd.DataFrame,
    models: Dict[str, BaseModel],
    routes: Optional[List[int]] = None,
    target_col: str = "freight_val",
    date_col: str = "date",
    route_col: str = "route_id",
    train_window: int = 200,
    horizon: int = 14,
    step: int = 28,
    alphas: List[float] = [0.05, 0.25, 0.5, 0.75, 0.95],
) -> pd.DataFrame:
    """
    Run multi-route walk-forward backtesting harness across multiple models.
    Produces a results table of (model x route x metric).
    """
    if routes is None:
        routes = sorted(df[route_col].unique())

    all_rows = []

    for route_id in routes:
        route_df = df[df[route_col] == route_id].copy()
        if len(route_df) < train_window + horizon:
            logger.warning(f"Route {route_id} skipped: insufficient data points.")
            continue

        route_metrics = run_walk_forward_single(
            df=route_df,
            models=models,
            target_col=target_col,
            date_col=date_col,
            train_window=train_window,
            horizon=horizon,
            step=step,
            alphas=alphas,
        )

        for model_name, metrics in route_metrics.items():
            row = {"model": model_name, "route_id": route_id}
            row.update(metrics)
            all_rows.append(row)

    results_df = pd.DataFrame(all_rows)

    # Compute macro-average across all evaluated routes
    if not results_df.empty:
        metric_cols = [c for c in results_df.columns if c not in ("model", "route_id")]
        avg_df = (
            results_df.groupby("model")[metric_cols]
            .mean()
            .reset_index()
            .round(4)
        )
        avg_df["route_id"] = "MACRO_AVG"
        results_df = pd.concat([results_df, avg_df], ignore_index=True)

    return results_df


def format_results_table(df: pd.DataFrame) -> str:
    """Format the results DataFrame into a clean Markdown table."""
    cols = ["model", "route_id", "sMAPE", "MAE", "RMSE", "Pinball_Loss", "Coverage_90", "MDA"]
    present_cols = [c for c in cols if c in df.columns]
    sub_df = df[present_cols]
    try:
        return sub_df.to_markdown(index=False)
    except Exception:
        # Robust fallback string formatting
        header = " | ".join(present_cols)
        sep = " | ".join(["---"] * len(present_cols))
        rows = []
        for _, row in sub_df.iterrows():
            rows.append(" | ".join(str(row[c]) for c in present_cols))
        return "\n".join([header, sep] + rows)


def main():
    parser = argparse.ArgumentParser(description="Task 6: Walk-Forward Backtesting Harness")
    parser.add_argument("--routes", type=str, default="1,2,3,4,5", help="Comma-separated route IDs to test")
    parser.add_argument("--horizon", type=int, default=14, help="Forecast horizon in days")
    parser.add_argument("--step", type=int, default=28, help="Walk-forward step size between cutoffs in days")
    parser.add_argument("--train-window", type=int, default=200, help="Initial training window in days")
    parser.add_argument("--all-routes", action="store_true", help="Run across all 13 routes")
    args = parser.parse_args()

    conn = get_db_connection()
    try:
        logger.info("Loading feature_store data from PostgreSQL...")
        df = load_route_data_from_db(conn, vessel_class_id=1)
        logger.info(f"Loaded {len(df)} rows across {df['route_id'].nunique()} routes.")

        if args.all_routes:
            selected_routes = sorted(df["route_id"].unique())
        else:
            selected_routes = [int(r.strip()) for r in args.routes.split(",")]

        # Initialize benchmark and ML models
        models = {
            "Naive": NaiveModel(),
            "SeasonalNaive": SeasonalNaiveModel(season_length=7),
            "SARIMAX": SARIMAXModel(order=(1, 1, 1), seasonal_order=(0, 0, 0, 0)),
            "QuantileLGBM": QuantileLGBMModel(n_estimators=40, learning_rate=0.05),
            "ConformalLGBM": ConformalQuantileModel(
                base_model=QuantileLGBMModel(n_estimators=40, learning_rate=0.05)
            ),
        }

        logger.info(f"Running walk-forward evaluation on routes {selected_routes}...")
        logger.info(f"Parameters: train_window={args.train_window}, horizon={args.horizon}, step={args.step}")

        results_df = run_walk_forward_harness(
            df=df,
            models=models,
            routes=selected_routes,
            target_col="freight_val",
            date_col="date",
            route_col="route_id",
            train_window=args.train_window,
            horizon=args.horizon,
            step=args.step,
        )

        print("\n" + "=" * 90)
        print("  TASK 6 — FORECASTING BENCHMARK RESULTS (MODEL x ROUTE x METRIC)")
        print("=" * 90)
        print(format_results_table(results_df))
        print("=" * 90)

        # Statistical comparison summary
        macro = results_df[results_df["route_id"] == "MACRO_AVG"].set_index("model")
        if "Naive" in macro.index and "SARIMAX" in macro.index:
            naive_smape = macro.loc["Naive", "sMAPE"]
            sarimax_smape = macro.loc["SARIMAX", "sMAPE"]
            diff = sarimax_smape - naive_smape
            pct_improvement = (naive_smape - sarimax_smape) / naive_smape * 100.0

            print("\n--- Model Benchmark Verdict (SARIMAX vs Naive on sMAPE) ---")
            print(f"  Naive Macro sMAPE   : {naive_smape:.4f}%")
            print(f"  SARIMAX Macro sMAPE : {sarimax_smape:.4f}%")
            if sarimax_smape < naive_smape:
                print(f"  VERDICT: SARIMAX OUTPERFORMS Naive by {abs(pct_improvement):.2f}% relative sMAPE reduction (-{abs(diff):.4f}% absolute).")
            else:
                print(f"  VERDICT: SARIMAX did NOT beat Naive on sMAPE (+{diff:.4f}% higher error). Reporting honestly per §31 acceptance criteria.")
            print("-" * 60)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
