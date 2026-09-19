# Model Training & Calibration Data Directory

This directory contains the complete data used to train, calibrate, benchmark, and evaluate every predictive, heuristic, and optimization model in the **SAIL Charter Market Decision Support System**.

---

## 1. Master Training Dataset

| File | Format | Rows | Columns | Description |
|---|---|:---:|:---:|---|
| **[`model_training_dataset.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/model_training_dataset.csv)** | Raw CSV | 37,960 | 67 | Full curated feature store table exported from PostgreSQL (`feature_store`). Master dataset for model training. |
| **[`model_training_dataset.csv.gz`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/model_training_dataset.csv.gz)** | Gzip CSV | 37,960 | 67 | Compressed version of the master training dataset (8.5 MB). |

---

## 2. Model-to-Data Mapping Matrix

| Model | Model Type | Consumed Data & Target | Training / Backtest Horizon | Primary Features Used |
|---|---|---|---|---|
| **Quantile LightGBM** | Gradient Boosted Decision Trees (Pinball Loss at $\alpha \in \{0.05, 0.25, 0.5, 0.75, 0.95\}$) | Target: `freight_val` from `model_training_dataset.csv` | Initial window = 200 days, walk-forward evaluation $H=14$ days, step = 28 days | 27 causal features: freight lags (1, 7, 14, 30), rolling means & std devs, bunker lags, FX lags, port congestion lags, cyclonic/monsoon seasonal flags |
| **Conformalized LightGBM (CQR)** | Split-Conformal Prediction Wrapper (Romano et al., 2019) | Calibration on 20% chronological split of `model_training_dataset.csv` | Evaluated across walk-forward folds ($H=14$) | Quantile spreads $(q_{0.05}, q_{0.95})$ adjusted with empirical conformity score quantiles |
| **SARIMAX(1,1,1)** *(Backtest Winner)* | State-Space Gaussian ARMA Time Series | Target: `freight_val` series per route & vessel class | 2-year daily history (~500 business days) | Autoregressive $(p=1)$, differencing $(d=1)$, moving average $(q=1)$ on `freight_val` |
| **Naive Persistence Baseline** | Random Walk ($\hat{y}_{T+h} = y_T$) | Target: `freight_val` | Walk-forward expanding window | Latest observed freight rate $y_T$; variance scaling $\sigma \sqrt{h}$ |
| **Seasonal-Naive Baseline** | 7-day cyclical persistence | Target: `freight_val` | Walk-forward expanding window | $y_{T+h - 7\lceil h/7 \rceil}$; seasonal variance scaling $\sigma_S \sqrt{\lceil h/7 \rceil}$ |
| **Physical Feasibility & Scoring Engine** | Hard physical filtering + multi-attribute scoring | Vessel catalogue vs port master plan limits | Static reference constraints | `port_constraints.csv` (max draft, LOA, beam, handling rates) + `vessels.csv` |
| **Deterministic Risk Engine** | Multi-factor weighted composite scoring | Combined operational risk indices | Real-time / Daily fixture assessment | Congestion score, forecast volatility, weather risk calendar (`weather_risk_calendar.csv`) |
| **Estimated Total Landed Cost (ETLC) & SPLIT Optimizer** | Stochastic cost simulation & grid search | Freight forecast distribution + bunker + port fees | 35-day laycan horizon, 7-day decision deferral | Forecast intervals, fuel consumption (28 MT/day), demurrage ($20,000/day), port charges ($50,000) |
| **Idle-Time & Repositioning Heuristic** | Probabilistic turnaround & ballast voyage modeling | IPA turnaround distributions + sea distances | Single-voyage turnaround window | Turnaround distribution parameters (mean 3.8–4.8d) + ballast routes in `routes.csv` |
| **Charter Portfolio Optimizer** | Mean-Variance Quadratic Optimization ($\min E[C] + \lambda \text{Var}(C)$) | Forecast distribution + contract premiums | Portfolio horizon across 3 contract tenors | Forecast variance, short-term premium (+3%), medium-term premium (+8%), $\lambda \in [0.1, 1.0]$ |

---

## 3. Constituent Raw Time-Series Datasets

Located in **[`data/raw_series/`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/raw_series/)**:

| File | Rows | Frequency | Source / Provenance | Description |
|---|:---:|:---:|:---:|---|
| **[`freight_index_series.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/raw_series/freight_index_series.csv)** | 502 | Daily | `PUBLIC_PROXY` (Breakwave Dry Bulk BDRY ETF / Baltic Capesize/Panamax) | Daily freight market price proxy in USD/ton. Covers 2024-01-01 to 2026-01-15. |
| **[`bunker_price_series.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/raw_series/bunker_price_series.csv)** | 505 | Daily | `PUBLIC_PROXY` (FRED Brent Crude Spot / Singapore 380CST VLSFO proxy) | Marine fuel prices in USD/MT. |
| **[`fx_rate_series.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/raw_series/fx_rate_series.csv)** | 511 | Daily | `REAL_VERIFIED` (Reserve Bank of India Reference Rate) | Daily USD/INR reference exchange rate. |
| **[`congestion_series.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/raw_series/congestion_series.csv)** | 3,655 | Daily | `SIMULATED` (Synthetic AIS Berthing Simulation across 5 ports) | Port congestion score (0–100), queue counts, and turnaround delay days. |

---

## 4. Reference & Domain Operational Datasets

Located in **[`data/reference_data/`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/reference_data/)**:

| File | Rows | Provenance | Description |
|---|:---:|:---:|---|
| **[`ports.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/reference_data/ports.csv)** | 5 | `REAL_VERIFIED` | Indian East Coast destination ports (Paradip, Visakhapatnam, Dhamra, Haldia, Gangavaram) with geographic coordinates. |
| **[`port_constraints.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/reference_data/port_constraints.csv)** | 5 | `REAL_VERIFIED` / `ASSUMPTION` | Draft limits (8.5m–18.0m), max LOA (230m–320m), max beam (32.5m–48.0m), berth counts, and hourly handling rates cited from Port Trust Master Plans. |
| **[`vessel_classes.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/reference_data/vessel_classes.csv)** | 4 | `REAL_VERIFIED` | Dimensional bounds for Handysize, Supramax, Panamax, and Capesize bulk carriers. |
| **[`vessels.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/reference_data/vessels.csv)** | 4 | `REAL_VERIFIED` | Representative fleet assets (*Handy Pioneer*, *Supra Voyager*, *Oceanic Panamax*, *Cape Enterprise*) with exact physical specs. |
| **[`routes.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/reference_data/routes.csv)** | 13 | `REAL_VERIFIED` / `PUBLIC_PROXY` | 13 international coking coal import shipping lanes (Australia, Mozambique, US Gulf, Russia, Indonesia) with nautical mile distances and sailing days. |
| **[`weather_risk_calendar.csv`](file:///Users/shadow/Desktop/SIH%20RRRRR/data/reference_data/weather_risk_calendar.csv)** | 12 | `REAL_VERIFIED` | Bay of Bengal monthly weather risk matrix (Pre-monsoon/Post-monsoon cyclone peaks in May and October/November). |

---

## 5. Feature Engineering Schema (67 Columns in `model_training_dataset.csv`)

Strict causality invariant enforced: **zero lookahead bias** (no future data in historical rows).

- **Keys & Dimensions**: `id`, `route_id`, `vessel_class_id`, `date`, `origin_region`, `destination_port_id`, `distance_nm`, `typical_transit_days`, `vessel_class_name`, `typical_draft_m`, `typical_loa_m`, `typical_beam_m`, `dwt_min`, `dwt_max`.
- **Freight Index Target & Dynamics**:
  - Target: `freight_val`
  - Lags: `freight_lag_1`, `freight_lag_7`, `freight_lag_14`, `freight_lag_30`
  - Rolling Averages: `freight_rolling_mean_7`, `freight_rolling_mean_14`, `freight_rolling_mean_30`
  - Volatility / Std: `freight_rolling_std_7`, `freight_rolling_std_14`, `freight_rolling_std_30`
  - Returns / Momentum: `freight_pct_change_7`, `freight_pct_change_30`
- **Bunker Fuel Predictors**:
  - `bunker_val`, lags (`1, 7, 14, 30`), rolling means (`7, 30`), rolling stds (`7, 30`), pct changes (`7, 30`)
- **Foreign Exchange (USD/INR) Predictors**:
  - `fx_val`, lags (`1, 7, 14, 30`), rolling means (`7, 30`), rolling stds (`7, 30`), pct changes (`7, 30`)
- **Port Congestion Predictors**:
  - `congestion_score`, lags (`1, 7, 14`), rolling means (`7, 14`), rolling std (`7`)
- **Seasonality & Calendar Indicators**:
  - `month`, `day_of_week`, `day_of_year`, `sin_month`, `cos_month`, `sin_day_of_year`, `cos_day_of_year`
  - `is_cyclone_season` (Bay of Bengal post-monsoon cyclone flag)
  - `is_monsoon_season` (Southwest monsoon June–September flag)
- **Metadata**:
  - `data_provenance`, `created_at`
