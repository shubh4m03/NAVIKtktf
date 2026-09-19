# API Contracts & Data Specifications

This document defines the schema, data contracts, and interface specifications for services across the platform.

---

## 1. Domain API Contracts (Spring Boot)

Implemented per Section 16.1 & Section 18 of the architecture blueprint:
- `GET /api/v1/ports/{id}`: Port details and physical constraints (draft, LOA, beam, berths, handling rate).
- `GET /api/v1/vessel-classes`: Supported bulk carrier vessel classes and specifications.
- `POST /api/v1/cargo-requests`: Submission and validation of cargo charter requirements.
  - Validation rules: `tonnage > 0`, `destinationPortId != null`, `deadline` must be strictly in the future.
  - Global error responses: standard RFC 7807 problem details / structured JSON with `timestamp`, `status`, `error`, `message`, `path`.

---

## 2. Curated Feature Store Schema (Task 5)

Curated feature tables are materialized in PostgreSQL under the `feature_store` table.
- **Grain**: One row per `(route_id, vessel_class_id, date)`.
- **Primary / Unique Key**: `uq_route_vessel_date (route_id, vessel_class_id, date)`.
- **Performance Indexes**:
  - `idx_feature_store_date ON feature_store(date)`
  - `idx_feature_store_route_date ON feature_store(route_id, date)`
  - `idx_feature_store_lookup ON feature_store(route_id, vessel_class_id, date)`

### 2.1 Table Columns

| Column Name | Type | Nullable | Description / Provenance |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL PRIMARY KEY` | No | Auto-incrementing identifier |
| `route_id` | `BIGINT REFERENCES routes(id)` | No | Route identifier |
| `vessel_class_id` | `BIGINT REFERENCES vessel_classes(id)` | No | Vessel class identifier |
| `date` | `DATE` | No | Observation / As-of date ($T$) |
| `origin_region` | `VARCHAR(100)` | No | Loading region (e.g., Australia, Indonesia, South Africa) |
| `destination_port_id` | `BIGINT REFERENCES ports(id)` | No | Destination discharge port |
| `distance_nm` | `DOUBLE PRECISION` | No | Nautical miles for route |
| `typical_transit_days` | `DOUBLE PRECISION` | No | Average sailing days |
| `vessel_class_name` | `VARCHAR(50)` | No | Name (Handysize, Supramax, Panamax, Capesize) |
| `typical_draft_m` | `DOUBLE PRECISION` | Yes | Typical laden vessel draft (meters) |
| `typical_loa_m` | `DOUBLE PRECISION` | Yes | Typical length overall (meters) |
| `typical_beam_m` | `DOUBLE PRECISION` | Yes | Typical beam width (meters) |
| `dwt_min` | `DOUBLE PRECISION` | Yes | Minimum deadweight tonnage |
| `dwt_max` | `DOUBLE PRECISION` | Yes | Maximum deadweight tonnage |

#### Market Features — Freight Index (BDRY / Proxy)
| Column Name | Type | Window / Lag | Description |
| :--- | :--- | :--- | :--- |
| `freight_val` | `DOUBLE PRECISION` | $t$ | Current day freight index closing value |
| `freight_lag_1` | `DOUBLE PRECISION` | $t-1$ | 1-day lagged freight index |
| `freight_lag_7` | `DOUBLE PRECISION` | $t-7$ | 7-day lagged freight index |
| `freight_lag_14` | `DOUBLE PRECISION` | $t-14$ | 14-day lagged freight index |
| `freight_lag_30` | `DOUBLE PRECISION` | $t-30$ | 30-day lagged freight index |
| `freight_rolling_mean_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling mean (causal backward) |
| `freight_rolling_mean_14` | `DOUBLE PRECISION` | $[t-13, t]$ | 14-day rolling mean (causal backward) |
| `freight_rolling_mean_30` | `DOUBLE PRECISION` | $[t-29, t]$ | 30-day rolling mean (causal backward) |
| `freight_rolling_std_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling volatility / standard deviation |
| `freight_rolling_std_14` | `DOUBLE PRECISION` | $[t-13, t]$ | 14-day rolling volatility / standard deviation |
| `freight_rolling_std_30` | `DOUBLE PRECISION` | $[t-29, t]$ | 30-day rolling volatility / standard deviation |
| `freight_pct_change_7` | `DOUBLE PRECISION` | $[t-7, t]$ | 7-day relative price change |
| `freight_pct_change_30` | `DOUBLE PRECISION` | $[t-30, t]$ | 30-day relative price change |

#### Market Features — Bunker Fuel Price (Brent Crude Proxy)
| Column Name | Type | Window / Lag | Description |
| :--- | :--- | :--- | :--- |
| `bunker_val` | `DOUBLE PRECISION` | $t$ | Current day bunker price proxy (\$/bbl) |
| `bunker_lag_1` | `DOUBLE PRECISION` | $t-1$ | 1-day lagged bunker price |
| `bunker_lag_7` | `DOUBLE PRECISION` | $t-7$ | 7-day lagged bunker price |
| `bunker_lag_14` | `DOUBLE PRECISION` | $t-14$ | 14-day lagged bunker price |
| `bunker_lag_30` | `DOUBLE PRECISION` | $t-30$ | 30-day lagged bunker price |
| `bunker_rolling_mean_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling mean bunker price |
| `bunker_rolling_mean_30` | `DOUBLE PRECISION` | $[t-29, t]$ | 30-day rolling mean bunker price |
| `bunker_rolling_std_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling volatility bunker price |
| `bunker_rolling_std_30` | `DOUBLE PRECISION` | $[t-29, t]$ | 30-day rolling volatility bunker price |
| `bunker_pct_change_7` | `DOUBLE PRECISION` | $[t-7, t]$ | 7-day relative bunker price change |
| `bunker_pct_change_30` | `DOUBLE PRECISION` | $[t-30, t]$ | 30-day relative bunker price change |

#### Market Features — FX Rate (USD/INR)
| Column Name | Type | Window / Lag | Description |
| :--- | :--- | :--- | :--- |
| `fx_val` | `DOUBLE PRECISION` | $t$ | Current day USD/INR exchange rate |
| `fx_lag_1` | `DOUBLE PRECISION` | $t-1$ | 1-day lagged FX rate |
| `fx_lag_7` | `DOUBLE PRECISION` | $t-7$ | 7-day lagged FX rate |
| `fx_lag_14` | `DOUBLE PRECISION` | $t-14$ | 14-day lagged FX rate |
| `fx_lag_30` | `DOUBLE PRECISION` | $t-30$ | 30-day lagged FX rate |
| `fx_rolling_mean_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling mean FX rate |
| `fx_rolling_mean_30` | `DOUBLE PRECISION` | $[t-29, t]$ | 30-day rolling mean FX rate |
| `fx_rolling_std_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling FX volatility |
| `fx_rolling_std_30` | `DOUBLE PRECISION` | $[t-29, t]$ | 30-day rolling FX volatility |
| `fx_pct_change_7` | `DOUBLE PRECISION` | $[t-7, t]$ | 7-day relative FX change |
| `fx_pct_change_30` | `DOUBLE PRECISION` | $[t-30, t]$ | 30-day relative FX change |

#### Congestion Features (Destination Port)
| Column Name | Type | Window / Lag | Description |
| :--- | :--- | :--- | :--- |
| `congestion_score` | `DOUBLE PRECISION` | $t$ | Current day port congestion score (0-100) |
| `congestion_lag_1` | `DOUBLE PRECISION` | $t-1$ | 1-day lagged congestion score |
| `congestion_lag_7` | `DOUBLE PRECISION` | $t-7$ | 7-day lagged congestion score |
| `congestion_lag_14` | `DOUBLE PRECISION` | $t-14$ | 14-day lagged congestion score |
| `congestion_rolling_mean_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling mean congestion |
| `congestion_rolling_mean_14` | `DOUBLE PRECISION` | $[t-13, t]$ | 14-day rolling mean congestion |
| `congestion_rolling_std_7` | `DOUBLE PRECISION` | $[t-6, t]$ | 7-day rolling volatility congestion |

#### Calendar & Seasonality Encodings
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `month` | `INTEGER` | Calendar month (1-12) |
| `day_of_week` | `INTEGER` | Day of week (0=Monday, 6=Sunday) |
| `day_of_year` | `INTEGER` | Day of year (1-366) |
| `sin_month` | `DOUBLE PRECISION` | Harmonic $\sin(2\pi \cdot \text{month}/12)$ |
| `cos_month` | `DOUBLE PRECISION` | Harmonic $\cos(2\pi \cdot \text{month}/12)$ |
| `sin_day_of_year` | `DOUBLE PRECISION` | Harmonic $\sin(2\pi \cdot \text{day}/365.25)$ |
| `cos_day_of_year` | `DOUBLE PRECISION` | Harmonic $\cos(2\pi \cdot \text{day}/365.25)$ |
| `is_cyclone_season` | `INTEGER` | 1 if month $\in \{4, 5, 10, 11\}$ (Bay of Bengal cyclone peaks), else 0 |
| `is_monsoon_season` | `INTEGER` | 1 if month $\in \{6, 7, 8, 9\}$ (SW Monsoon), else 0 |

#### Metadata & Audit
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `data_provenance` | `VARCHAR(50)` | Always `'CURATED_FEATURE'` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Feature generation timestamp |

---

## 3. Strict No-Lookahead Guarantee

Per Section 31 Task 5 acceptance criteria:
- **Invariant**: No feature row at date $T$ may incorporate information from any date $t' > T$.
  $$\max(\text{lookback\_date}) \le T$$
- **Enforcement**:
  1. `assert_no_lookahead(df, date_col='date')` strictly verifies every feature's lookback window:
     $\text{max\_lookback\_date} \le \text{row\_date}$.
  2. If any feature violates this condition (e.g. negative lag `shift(-1)` or centered rolling window `center=True`), `DataLeakageError` is immediately raised.
  3. Dynamic causality perturbation test verifies that perturbing future data ($t > T$) produces 0 change in features computed at date $T$.

---

## 4. Charter Portfolio Strategy Configuration (§13 / Task 19)

All term-contract variance and cost assumptions are registered below as named constants. No magic numbers are permitted inline in optimization logic.

| Constant Name | Value | Provenance | Description / Rationale |
| :--- | :--- | :--- | :--- |
| `SPOT_VARIANCE_FACTOR` | `1.0` | `ASSUMPTION` | Spot contracts carry baseline unhedged freight market variance ($100\%$). |
| `SHORT_TERM_VARIANCE_FACTOR` | `0.60` | `ASSUMPTION` | 1–3 month fixed charter reduces price variance by $40\%$ ($60\%$ spot variance remains). |
| `MEDIUM_TERM_VARIANCE_FACTOR` | `0.25` | `ASSUMPTION` | 6–12 month paper lock-in suppresses price variance by $75\%$ ($25\%$ spot variance remains). |
| `SHORT_TERM_COST_PREMIUM` | `0.03` | `ASSUMPTION` | $3\%$ price premium above expected spot rate for 1–3 month paper flexibility. |
| `MEDIUM_TERM_COST_PREMIUM` | `0.08` | `ASSUMPTION` | $8\%$ price premium above expected spot rate for long-term lock-in commitment. |
| `MIN_WEIGHT` | `0.05` | `ASSUMPTION` | Minimum $5\%$ weight assigned to each contract type to prevent corner solutions. |
| `MAX_SPOT_WEIGHT` | `0.80` | `ASSUMPTION` | Maximum $80\%$ cap on spot market exposure to safeguard against catastrophic budget blowout. |
| `LAMBDA_CONSERVATIVE` | `1.0` | `ASSUMPTION` | Risk aversion parameter for Conservative preset: prioritizes medium-term variance reduction. |
| `LAMBDA_BALANCED` | `0.5` | `ASSUMPTION` | Risk aversion parameter for Balanced preset: balanced trade-off between cost and volatility. |
| `LAMBDA_AGGRESSIVE` | `0.1` | `ASSUMPTION` | Risk aversion parameter for Aggressive preset: prioritizes lowest expected cost via spot. |

### Mathematical Formulation
$$\min_{w} \quad \sum_{i} w_i \cdot \mu_i + \lambda \sum_{i} w_i^2 \cdot \sigma_i^2$$
$$\text{subject to} \quad \sum_{i} w_i = 1, \quad 0.05 \le w_i \le 1$$
Where $i \in \{\text{SPOT}, \text{SHORT\_TERM}, \text{MEDIUM\_TERM}\}$.
