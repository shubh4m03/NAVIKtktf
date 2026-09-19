# SIH26006 — Charter Intelligence Platform
## Architecture, Strategy & Antigravity Execution Blueprint
### Prepared for: SAIL / Ministry of Steel — Intelligent Freight Forecasting & Vessel Chartering

---

## 0. HOW TO READ THIS DOCUMENT

This is long because the ask was long. But I am not going to pretend every one of the 60 items deserves equal weight — that itself would be the "average SIH submission" failure mode. So:

- **Full treatment**: problem deconstruction, decision framing, data strategy (incl. proxy strategy), forecasting architecture, optimization math, port/vessel engine, risk engine, scenario engine, system architecture, DB/API design, ML pipeline + backtesting, explainability, security, MVP/Prod/Enterprise scoping, phase plan, and a working set of Antigravity task packets + prompts you can paste today.
- **Deliberately compressed**: the 50-question judge bank (I give you 20 of the hardest, with the method to generate the rest yourself in 10 minutes using the red-team section), carbon/GNN/marketplace explorations (given a clear verdict, not a essay each), cost tables (ranges, not fake vendor quotes).
- **Called out explicitly with 🚫 DO NOT BUILD, ⚠️ PROXY/SIMULATION REQUIRED, or 🔴 WILL BE ATTACKED** wherever your brief asked me to be brutal. I've taken that instruction seriously — this is the actual difference between a top-10 SIH team and everyone else.

If you want the 50-question bank in full, the remaining Antigravity packets for every microservice, or a slide-by-slide PPT script — say so and I'll produce them as a follow-up; they're each substantial documents in their own right.

---

## 1. THE REAL PROBLEM (NOT THE PROBLEM STATEMENT)

**What SIH26006 says**: build a forecasting model for freight rates to optimize vessel chartering and bulk cargo procurement, overseas → East Coast India.

**What SAIL actually has**: SAIL imports coking coal (and some thermal coal/other bulk raw materials) from Australia, US, Mozambique, Russia, and increasingly Indonesia, landing it at Paradip, Vizag, Gangavaram, Dhamra, Haldia etc. for its steel plants (Bhilai, Rourkela, Durgapur, Bokaro, Burnpur). Freight is procured largely through **ship-broker-mediated spot or short-term charters**, negotiated by a small commercial/logistics team that:

1. Watches Baltic indices, broker circulars, and market chatter manually.
2. Gets nomination requirements from plants (tonnage, grade, delivery window).
3. Calls brokers, collects indicative rates for Capesize/Panamax/Supramax candidates.
4. Picks a vessel/timing largely on **experience + urgency**, not a quantified cost-risk tradeoff.
5. Locks a charter — sometimes right before a rate spike, sometimes leaving money on the table by locking too early out of risk-aversion.
6. Deals with demurrage/congestion after the fact as an operational headache, not a forecasted cost.

**The actual pain is not "we don't know what freight will be."** No one can know that precisely. The pain is:

- Decisions are made **without a quantified cost-of-waiting vs cost-of-acting**, so timing is gut-feel.
- There is **no systematic vessel-class selection logic** tied to port draft/LOA constraints — this is done from memory/experience by a handful of people.
- There is **no visibility into how spot-vs-term contract mix affects total cost and risk** — SAIL likely defaults to spot too often because no one can quantify what a term contract would have saved.
- **Congestion, demurrage, and repositioning cost are treated as after-the-fact losses**, not forecasted and priced into the decision.
- Institutional knowledge is **tribal** — it leaves with people, isn't captured, isn't auditable.

### 1.1 Economic consequence (order of magnitude, not SAIL-verified)
SAIL imports several million tonnes of coking coal annually. Freight is typically 20–40% of landed coal cost depending on route and market conditions. A **1–2% timing/vessel-selection inefficiency** on a multi-million-tonne annual freight bill is a real, multi-crore number — but we will **never claim a specific rupee figure as fact** unless it's derived transparently from stated assumptions (see §54).

### 1.2 What SAIL actually needs from a system (in priority order)
1. A **defensible, auditable recommendation** ("charter now / wait / split") with a quantified reason, not a black-box number.
2. A way to **compare spot vs short-term vs medium-term contracting** with real tradeoffs shown.
3. **Vessel–port compatibility filtering** so no one manually checks draft tables.
4. **Risk visibility** (what could go wrong, how much it could cost) before signing.
5. Something a **junior officer can operate** without a PhD in time-series econometrics — i.e., the explainability layer is not optional polish, it's core to adoption.
6. A system that is **honest about what it doesn't know** (uncertainty, missing data) — SAIL cannot deploy something that quietly guesses.

### 1.3 What a judge expects to see (and why most SIH teams fail this)
Judges have seen 40 "LSTM predicts stock/freight price" dashboards. They expect: (a) a real decision output, not a number; (b) proof the model beats a naive baseline **in business terms**, not just RMSE; (c) an honest data story (most teams either fake data or don't disclose fake data — both are penalized once discovered); (d) something that doesn't collapse the moment congestion or a port constraint is asked about live.

### 1.4 What makes us materially better than competitors (your likely SIH cohort)
Not "we used a transformer." It's:
- We forecast a **distribution + a decision**, not a point value.
- We have a genuine **constraint-based vessel-port feasibility engine**, not a lookup table pretending to be an "AI vessel selector."
- We run an **economic backtest** ("our strategy vs spot-only over N months would have saved/cost X%") — this is the single most persuasive slide in the whole deck.
- We are explicit, in the UI itself, about **REAL vs PROXY vs SIMULATED** data — this defuses the #1 attack vector before a judge can raise it.

---

## 2. REFRAMING: FROM "PREDICT A NUMBER" TO A DECISION ENGINE

The system answers, in this order, every time a cargo requirement is entered:

```
CAN THIS PHYSICALLY BE SHIPPED?          → Vessel–Port Feasibility Engine
WHAT WILL IT COST, AND HOW SURE ARE WE?  → Forecasting Engine (distributional)
WHEN SHOULD WE ACT?                      → Market-Entry Optimizer (buy now / wait / split)
WHAT COULD GO WRONG?                     → Risk Engine
HOW DOES THE ANSWER CHANGE UNDER STRESS? → Scenario Simulator
HOW SHOULD WE STRUCTURE THE CONTRACT?    → Charter Portfolio Optimizer (spot/short/medium mix)
WHY?                                     → Explainability Layer (traceable to inputs, not LLM vibes)
```

This chain **is** the product. Every screen in the UI should visibly walk this pipeline (see §30–32).

---

## 3. DOMAIN RESEARCH — WITH DATA PROVENANCE DISCIPLINE

I'm giving you the structurally correct facts (vessel class definitions, general port constraint categories, general market mechanics) that are stable and well-documented. I am **not** going to hand you a specific numeric draft/LOA limit for Dhamra or Gangavaram dressed up as fact — those numbers move (dredging, monsoon, berth upgrades) and a wrong hardcoded number is exactly the kind of thing that gets a project torn apart live. Below is how every fact you use must be labeled in your knowledge base and in the UI itself.

### 3.1 Data provenance taxonomy (use this literally as an enum in your DB — see §19)
| Label | Meaning | Example | UI treatment |
|---|---|---|---|
| `REAL_VERIFIED` | From an official, citable source (Indian Ports Association, IWAI, port trust notices, Baltic Exchange, EIA, RBI, MMSI/AIS provider) | Public IPA vessel-related draft advisories | Shown with source + fetch date |
| `PUBLIC_PROXY` | Real public data used as a stand-in for something we don't have direct access to | Using Baltic Dry sub-indices (BCI/BPI/BSI) as a proxy for lane-specific spot rates | Shown with "proxy for X" badge |
| `SIMULATED` | Statistically generated, not observed | Synthetic congestion series calibrated to plausible ranges | Shown with a persistent "SIMULATED" watermark |
| `ASSUMPTION` | A number we chose for demo purposes, explicitly flagged | Assumed berth turnaround of 4 days at a given port | Shown with a tooltip: "assumption — confirm with port authority" |
| `MODEL_OUTPUT` | Derived by our own models | Forecast, risk score, recommendation | Shown with confidence interval, never as bare fact |

**This taxonomy is a first-class UI element, not a disclaimer buried in an appendix.** A judge who sees a small colored badge next to every number ("PROXY", "ASSUMED") will trust you *more*, not less — it signals you understand the difference between a toy and a system someone could actually deploy.

### 3.2 Vessel classes (stable, well-documented structural facts — safe to hardcode as reference data)
| Class | Approx DWT | Typical draft | Typical LOA | Coal suitability |
|---|---|---|---|---|
| Handysize | 10,000–40,000 | ~9–11 m | ~150–190 m | Smaller parcels, ports with shallow draft/berth limits |
| Supramax/Ultramax | 40,000–65,000 | ~11–13 m | ~190–200 m | Flexible, geared (own cranes) — useful where port cargo-handling infra is limited |
| Panamax | 65,000–100,000 | ~13–15 m | ~225–230 m | Workhorse for coal on medium-large parcels |
| Capesize | 100,000–180,000+ | ~17–18 m | ~290–300 m | Large parcels, needs deep-draft, high-capacity berths — cannot enter draft-restricted ports |

⚠️ **These are class-level generic ranges from public maritime references, not a specific vessel or a specific port's live limit.** Your system must pull actual port draft/berth data from official notices at build time and store it with `REAL_VERIFIED` + source + date, or fall back to `ASSUMPTION` with a flag. **Never let the demo silently present a class-range number as a specific port's hard limit.**

### 3.3 Ports (East Coast India) — what to model, not what number to hardcode
Model each port with the schema in §10. For the hackathon, populate real fields you can **cite** (port trust websites, IPA yearbooks, Ministry of Shipping reports) and mark everything else `ASSUMPTION`. Structurally, every East Coast port differs on: max permissible draft (varies further with tide), berth count and specialization (mechanized coal berths vs general cargo), mechanized unloading capacity (tonnes/day), typical pre-berthing waiting time (a strong proxy for congestion), and monsoon-driven operational restrictions (cyclone season on the East Coast, roughly Apr–Jun and Oct–Dec, is a real structural fact you can safely encode as a seasonal risk *category*, even without exact port-level closure dates).

🔴 **Will be attacked**: "Where did you get Dhamra's draft limit?" Your answer must be: *"This field is sourced from [X, dated Y] / OR flagged ASSUMPTION pending port authority confirmation — here's exactly which fields in our schema require that confirmation before production use."* That answer, said confidently, **wins the exchange**. A hardcoded number with no source **loses it**.

### 3.4 Origins
Australia (Newcastle/Dalrymple Bay/Gladstone — major coking coal export terminals), US (Gulf/East coast coal export terminals), Mozambique (Nacala/Beira — coking coal), Russia (Far East/Baltic depending on route), Indonesia (thermal coal, Kalimantan). Model these as `origin_region` nodes with typical distance/transit-time bands to each East Coast port — this is what feeds voyage-cost estimation (§8).

---

## 4–5. DATA STRATEGY & PROXY STRATEGY (COMBINED — THIS IS THE MOST IMPORTANT SECTION FOR CREDIBILITY)

You will not get commercial AIS feeds, Clarksons/Platts freight data, or SAIL's internal contracts for a hackathon. Design around that from day one — do not discover this in week 3.

| Category | Real source (public, free/low-cost) | Role | Depth/frequency | Known issues |
|---|---|---|---|---|
| **Freight benchmark** | Baltic Exchange headline BDI is subscription-gated for granular data, but historical BDI/BCI/BPI/BSI level series are widely republished (financial data aggregators, TradingEconomics-style sites, some free financial APIs) | Primary proxy for route-level freight direction & volatility | Daily, multi-year history available | Index-level, not lane-specific — must be explicitly labeled `PUBLIC_PROXY` for any lane-specific number |
| **Bunker fuel price** | Public bunker price trackers / crude benchmarks (Brent/WTI via free finance APIs) as a proxy for bunker cost trend | Input to voyage cost model | Daily | Bunker ≠ crude 1:1; use as a *directional* proxy, document the gap |
| **Coal price** | Public thermal/coking coal price indices republished by financial data sites; India coal import data via Ministry of Coal / DGCI&S trade statistics | Demand-side driver feature | Monthly | Coarser granularity than freight |
| **FX (USD/INR)** | RBI reference rate (public, free) | Landed cost conversion | Daily | None significant |
| **Vessel positions/AIS** | Free-tier AIS providers (e.g., limited free API tiers) give delayed, sparse coverage — **not reliable for a live demo** | Illustrative only | Sparse | ⚠️ **PROXY/SIMULATION REQUIRED**: build a simulated AIS/vessel-position layer calibrated to plausible transit times, clearly labeled `SIMULATED`, for demo reliability |
| **Port congestion** | No good free real-time source at port-berth granularity for Indian ports | — | — | ⚠️ **SIMULATION REQUIRED**: simulate congestion as a stochastic process (seasonally modulated) with a `SIMULATED` badge; document how a production deployment would ingest port trust berth-occupancy data instead |
| **Weather/cyclone** | India Meteorological Department public bulletins/archives; global cyclone track archives | Seasonal risk feature, event-driven risk spikes | Public, event-based | Requires manual mapping from bulletin to a structured feature — build a lightweight seasonal calendar instead of trying to scrape live IMD for the demo |
| **Port physical constraints** | Port trust official websites / IPA publications | Vessel–port feasibility filter | Static, updated rarely | Coverage inconsistent across ports — flag missing fields as `ASSUMPTION` |
| **Calendar/seasonality** | Public holiday calendars, known monsoon windows, known Australian/Indonesian export seasonality patterns | Seasonality features | Static | Safe, no proxy needed |

### 5.1 The honest proxy pyramid (say this exact structure to judges)
```
LEVEL 1 — DIRECTLY FORECASTABLE from real/proxy public data:
   Freight *direction and volatility regime* (via BDI-family indices), bunker trend, FX.

LEVEL 2 — FORECASTABLE THROUGH PROXY VARIABLES:
   Lane-specific freight rate = f(index-level freight, distance, vessel class, seasonality)
   i.e., we don't have Australia→Dhamra Panamax rate history, so we model it as a function
   of the public index plus a route/vessel adjustment factor we make transparent and tunable.

LEVEL 3 — SIMULATED FOR DEMONSTRATION:
   Port congestion, AIS positions, individual charter fixtures. Statistically generated,
   watermarked, and explicitly reproducible (seeded) so judges can see the simulation logic.

LEVEL 4 — MODEL OUTPUT:
   Forecasts, risk scores, recommendations — always shown with uncertainty, never bare.
```
**Never let Level 3 output be visually indistinguishable from Level 1.** This single design discipline is worth more to your judging score than any model architecture choice.

### 5.2 Path to production
Every proxy/simulated component has a named real-data replacement path: BDI-proxy → Clarksons/commercial freight data or SAIL's own historical fixture records; simulated congestion → port-trust berth-occupancy feed or AIS-derived dwell time; simulated AIS → commercial AIS subscription. State this explicitly in the deck — it's what turns "hackathon toy" into "credible platform with a funding ask."

---

## 6. FORECASTING ENGINE

### 6.1 Benchmark hierarchy (mandatory — never skip the baseline comparison)
1. **Naive** (last value) and **seasonal naive** (last-same-period value) — the bar everything must beat.
2. **Statistical**: SARIMAX (with bunker/FX/seasonality as exogenous regressors) — often competitive on freight-index-like series and gives you a legitimate probabilistic baseline (native confidence intervals) almost for free.
3. **ML (gradient boosting)**: LightGBM/XGBoost with engineered features (lags, rolling stats, index levels, seasonality, calendar) — typically the strongest performer on the data volume you'll realistically have (a few years of daily/weekly index data is *not* "big data"; tree ensembles usually beat deep nets here).
4. **Deep learning**: LSTM/GRU/TFT — include **only if backtesting shows it beats LightGBM on your actual data**. 🔴 **Will be attacked**: "why deep learning on a few thousand data points?" Your answer must be data-driven ("we benchmarked it and it did not outperform LightGBM by a statistically meaningful margin, so we use LightGBM as primary and report the DL comparison for rigor") **or** ("it did outperform — here's the backtest, here's why we think TFT's multi-horizon quantile head specifically helps here"). Never say "we used LSTM because it's advanced."
5. **Ensemble**: weighted blend of top-2 models by backtested pinball loss, only if it measurably improves calibration.

🚫 **DO NOT BUILD**: a from-scratch Transformer/TFT trained without transfer learning on a dataset of a few hundred/thousand points — it will overfit, underperform LightGBM, and be an easy target ("your training data is too small for that architecture").

### 6.2 Distributional forecasting (this is your differentiator, do this properly)
Use **quantile regression** (LightGBM supports quantile objectives natively — predict at least the 5th/25th/50th/75th/95th percentiles) as the primary method: cheap, fast, easy to explain to a judge ("we don't predict one number, we predict a range and the shape of the range"). Layer **conformal prediction** on top of the quantile outputs for a calibration guarantee (empirically covers the stated interval on held-out backtests) — this is the single sentence that will impress a technically literate judge: *"our intervals are conformally calibrated, so a stated 90% interval empirically contains the true outcome ~90% of the time in backtest, not just by assumption."*

Derived outputs per forecast:
```
expected_value          (median quantile)
interval_50             (25th–75th)
interval_90             (5th–95th)
prob_increase_gt_x_pct  (fraction of Monte-Carlo/quantile-implied paths exceeding threshold)
volatility_regime       (low/medium/high, from rolling realized volatility)
confidence_score        (0–100, derived from recent backtested calibration + data recency/completeness — NOT vibes)
```
`confidence_score` formula (be ready to defend this exact logic): a weighted combination of (a) inverse of recent rolling backtest pinball loss (normalized), (b) data completeness/freshness of inputs for this specific forecast, (c) interval width relative to historical norm (tighter interval given calibration = higher confidence). Document the weights; make them a config, not a magic constant.

---

## 7. MARKET-ENTRY OPTIMIZATION (MATH)

**Decision**: for a cargo requirement of tonnage `Q` needed by deadline `T`, choose action `a ∈ {CHARTER_NOW, WAIT, MONITOR, SPLIT(p)}` where `SPLIT(p)` locks fraction `p` now and leaves `(1-p)` open.

**Expected Total Logistics Cost** for a given action, vessel class `v`, and forecast distribution at decision time `t`:

```
ETLC(a, v, t) = E[Freight(t', v)] · Q
              + BunkerCost(v, distance)
              + PortCost(destination, v)
              + E[DemurrageCost | congestion_dist(destination)]
              + E[DelayPenalty | ETA_dist, deadline T]
              + RepositioningCost(v, origin_next_leg)
              + RiskPremium(a, forecast_volatility)
```
where `t'` is the effective charter-fixing time implied by action `a` (now, or a modeled future point for WAIT), and each `E[...]` is computed via the forecast's quantile/conformal distribution — **not** a point estimate. `RiskPremium` is a tunable risk-aversion coefficient `λ` times the forecast's interval width (captures "waiting when volatility is high costs more in risk-adjusted terms even if expected value looks better").

**Decision rule**: choose `a* = argmin_a ETLC(a, v, t)` subject to `deadline`, `min/max lot size`, and `contract policy constraints` (e.g., "at least 30% must be locked within 15 days" if SAIL has such a policy — configurable, not hardcoded).

**WAIT is only rational when**: `E[ETLC(WAIT)] + λ·Var(WAIT) < ETLC(CHARTER_NOW)` **and** there is enough time buffer before `T` to still execute a charter after waiting (a hard feasibility constraint, not just a cost comparison — this is the check most naive designs forget and a judge will catch it).

**SPLIT(p)** is the practically dominant recommendation for realistic volumes — it's a convex combination that reduces variance without betting everything on a single forecast draw. Solve for optimal `p*` via a 1-D numerical minimization of `p·ETLC(NOW) + (1-p)·E[ETLC(WAIT)]` over `p ∈ [0,1]`, subject to policy floor/ceiling on `p`. This is computationally trivial (grid search over 21 points is enough) — do not over-engineer this into a full stochastic control problem for the MVP; a rolling-horizon dynamic program is the Level-3 (enterprise) upgrade (§43).

---

## 8. VESSEL–PORT FEASIBILITY & SELECTION ENGINE

**Step 1 — Hard feasibility filter (constraint satisfaction, not optimization)**: eliminate any vessel class/specific vessel where `vessel.draft > port.max_draft(tide-adjusted)` OR `vessel.LOA > port.max_LOA` OR `vessel.beam > port.max_beam` OR `vessel.DWT_cargo_capacity < required_parcel_min` (some ports/berths have minimum economic parcel sizes too). This is a simple boolean filter over structured reference data — **do not use MILP for this step**, it's overkill; MILP is for the next step.

**Step 2 — Ranking / selection among feasible candidates**: this *is* where optimization adds value, because you're trading off multiple objectives (cost, transit time, port turnaround, availability) subject to constraints. Use a **weighted multi-objective scoring function** for the MVP:
```
Score(v) = w1·(-EstimatedLandedCost(v)) + w2·(-ExpectedDelay(v)) + w3·AvailabilityScore(v) - w4·RiskPenalty(v)
```
with weights exposed as sliders in the UI (this doubles as a great demo moment — "watch the recommendation change as SAIL's priorities shift from cost to reliability").

**Should you use full MILP?** Only if you extend to **multi-cargo, multi-vessel portfolio scheduling** (e.g., "allocate 5 cargoes across a mix of vessels over 6 months to minimize total cost subject to fleet/berth availability") — that is a genuine integer/mixed-integer program (assignment-problem structure, solvable with a free solver like OR-Tools/PuLP). For a **single cargo request**, MILP is 🚫 **overengineering** — a scored ranking over a small feasible set (typically <10 candidates after Step 1) is mathematically equivalent in outcome and far more explainable. Reserve MILP for the "portfolio" feature (§14) where it's genuinely justified.

---

## 9. PORT DIGITAL TWIN (AS A CONSTRAINT ENGINE, NOT A STATIC TABLE)

Schema (see §19 for full DB form). The key design decision: **congestion and turnaround are not static fields — they are distributions conditioned on season and recent trend**, even in simulated form. This is what makes it a "twin" rather than a lookup table: querying `port.expected_turnaround(date, vessel_class)` returns a distribution (mean, p90) derived from a seasonally-modulated simulation (or real data once available), which then **feeds directly into the ETLC demurrage term** in §7. This closes the loop: port intelligence isn't decoration, it's a load-bearing input to the cost model — say this explicitly to judges.

---

## 10. IDLE-TIME & REPOSITIONING ENGINE — MVP vs PRODUCTION

⚠️ Fleet-level idle/deadheading optimization genuinely requires **private fleet schedule data SAIL doesn't expose to a hackathon team.** Be upfront about this rather than fabricating capability.

**MVP (honest scope)**: given a single voyage's estimated arrival, estimate *post-discharge* vessel availability window and present 2–3 illustrative "next opportunity" lanes using **public seasonal export/import flow patterns** (e.g., "vessels discharging coal on the East Coast often reposition toward Australia/Indonesia backhaul grain/ore lanes") as a labeled `ASSUMPTION`/`PUBLIC_PROXY` insight, not a fleet-optimized recommendation.

**Production**: requires ingestion of the charterer's/owner's actual fleet position data or a commercial AIS+fixture feed; then this becomes a genuine assignment/matching optimization (idle vessel × candidate next cargo, maximizing utilization). State this gap plainly in the deck — judges respect "this requires data we don't have access to for a hackathon, here's exactly what would unlock it" far more than a fabricated capability.

---

## 11. RISK ENGINE

**Risk Score (0–100)** = weighted, documented combination of sub-scores, not an arbitrary number:
```
RiskScore = 100 · (
    w_vol   · normalize(forecast_volatility)
  + w_cong  · normalize(port_congestion_trend)
  + w_wx    · seasonal_weather_risk(destination, month)     # calendar-based, defensible
  + w_avail · normalize(vessel_availability_tightness_proxy)  # derived from freight-index momentum as a proxy
  + w_conc  · commodity_price_shock_indicator(coal/bunker)
)
```
Every weight (`w_vol`, `w_cong`, etc.) is a named, tunable, documented config value — never a black box. Each sub-score maps to a **stated data source and provenance label** from §3.1. The output is always presented as: **score, category (LOW/MED/HIGH), top-2 contributing drivers with their individual sub-scores, and a mitigation suggestion template** ("secure X% now, retain Y% flexible") whose X/Y comes directly from the SPLIT(p) optimizer in §7, not a separate hardcoded rule — **this consistency between the risk engine's suggestion and the optimizer's actual math is exactly the kind of internal coherence that survives a hostile Q&A.**

---

## 12. SCENARIO SIMULATOR

Implementation is straightforward given the architecture above: it's a **re-run of the entire pipeline (forecast adjustment → ETLC → risk → recommendation) with one or more input parameters perturbed**, not a separate model. This is important to say explicitly: *"the scenario engine has no separate logic — it's proof our pipeline is a real function of its inputs, not a static recommendation with a scenario UI bolted on."* That single sentence pre-empts a very common judge trap ("is your scenario simulator just changing a label?").

Implementation: freight/bunker/congestion/availability shocks are applied as multiplicative or additive adjustments to the relevant forecast/feature inputs; the full pipeline (§2) re-executes server-side (should complete in well under a second given lightweight models) and the UI re-renders the decision chain live. This is your best live-demo moment — budget real engineering time here.


---

## 13. CHARTER PORTFOLIO STRATEGY (SPOT / SHORT-TERM / MEDIUM-TERM)

Rather than hardcoding "60/25/15," compute the split as an optimization over a simplified **mean-variance framework** (Markowitz-style, applied to cost instead of returns):
```
Minimize:  E[PortfolioCost] + λ · Var(PortfolioCost)
subject to: sum(allocations) = total requirement
            each allocation ∈ [contract-type min/max lot constraints]
            medium-term contracts assumed to have lower cost variance but a
            (configurable) cost premium vs spot expected value, and lower flexibility
```
`λ` is SAIL's stated/assumed risk aversion — expose it as a UI slider ("conservative / balanced / aggressive"). This is a legitimate, well-known quantitative-finance technique repurposed sensibly for procurement — it is *not* overengineering because it directly answers the brief's ask ("determine how such percentages could be calculated rather than hardcoding them").

---

## 14. FULL OPTIMIZATION FORMULATION (SYSTEM-LEVEL)

**Decision variables**: `x_{c,v,k}` = tonnage of cargo `c` assigned to vessel class `v` under contract type `k ∈ {spot, short, medium}`; `t_c` = fixing time for cargo `c`.

**Objective** (minimize):
```
Σ_c Σ_v Σ_k  ETLC(c, v, k, t_c) · x_{c,v,k}
+ Σ_c  RiskPenalty(c)
+ Σ_c  DelayPenalty(c)
+ Σ_v  IdleCost(v)          [production only — needs fleet data, see §10]
+ Σ_v  RepositioningCost(v) [production only]
```
**Subject to**:
```
Σ_v Σ_k x_{c,v,k} = Q_c                         (cargo demand satisfied)
vessel-port feasibility (Step 1, §8)             (hard boolean constraints)
delivery deadline: ETA(c) ≤ T_c                  (feasibility)
contract policy bounds on k-mix (§13)
vessel/berth availability capacity (production)
```
**Algorithm choice**: for a single cargo, this collapses to the scored-ranking + SPLIT(p) approach in §7–8 (closed-form/grid-search, O(1)). For **multi-cargo portfolio scheduling** (the genuinely hard version — several cargoes, several months, shared vessel/berth capacity), this is a legitimate **Mixed-Integer Linear Program**; use a free solver (Google OR-Tools CP-SAT or PuLP+CBC). **Complexity**: assignment-style MILPs of this size (tens of cargoes × handful of vessel classes × 3 contract types) solve in milliseconds to low seconds with CBC/CP-SAT — no need for anything exotic. Practical implementation: build this as a distinct, optional "Portfolio Planner" feature (Phase 2), not required for the single-cargo Command Center MVP.

---

## 15. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend — React + Next.js (Command Center, dashboards)     │
└───────────────────────────┬───────────────────────────────────┘
                             │ REST/JSON (JWT-authenticated)
┌───────────────────────────▼───────────────────────────────────┐
│  Backend — Java Spring Boot                                    │
│  Auth/RBAC · Cargo/Vessel/Port/Contract domain APIs             │
│  Orchestrates calls to ML service · persists everything         │
│  Audit logging · business validation                            │
└───────────────────────────┬────────────┬───────────────────────┘
                             │            │
             ┌───────────────▼───┐   ┌────▼────────────────────┐
             │ PostgreSQL         │   │ Redis (cache: forecasts, │
             │ (system of record) │   │ port/vessel reference)   │
             └────────────────────┘   └───────────────────────────┘
                             │
┌───────────────────────────▼───────────────────────────────────┐
│  ML Service — Python + FastAPI                                 │
│  Forecasting (quantile LightGBM + conformal) · Risk scoring     │
│  Market-entry optimizer · Vessel scoring · Scenario re-run      │
│  (Portfolio MILP — Phase 2, OR-Tools)                           │
└───────────────────────────┬───────────────────────────────────┘
                             │
┌───────────────────────────▼───────────────────────────────────┐
│  Data Pipeline — scheduled Python jobs                         │
│  Ingest public indices/FX/coal/weather-calendar → clean →       │
│  feature store (Postgres tables/parquet) → simulate congestion  │
│  & AIS (labeled SIMULATED) → feed ML service                    │
└─────────────────────────────────────────────────────────────────┘

Optional (justify before adding, see §15.1): LLM explainer/analyst layer
sitting beside the ML service, read-only against structured outputs.
```

### 15.1 Technology justification (why each piece exists — say this out loud to judges)
- **Spring Boot for the business backend**: because the actual system-of-record (cargo requests, users, roles, audit, contracts) is a transactional CRUD+workflow domain — exactly Spring Boot's strength — and it demonstrates real backend engineering depth beyond a Python monolith.
- **Python/FastAPI for ML only**: keeps the numerical/statistical code where the ecosystem (pandas/sklearn/lightgbm/statsmodels) actually lives; Spring Boot never re-implements ML logic, it calls a clean HTTP contract.
- **PostgreSQL**: relational integrity for cargo/contract/audit data is non-negotiable (financial/audit trail); also stores time-series feature tables fine at this scale — no need for a separate time-series DB for a hackathon volume of data. 🚫 **DO NOT add** a dedicated time-series DB (InfluxDB/TimescaleDB) unless data volume actually demands it — it doesn't, at this scale, and it's an unjustified complexity line judges will ask about.
- **Redis**: cache expensive-ish forecast/optimization results and static port/vessel reference data — genuinely improves demo responsiveness (scenario simulator needs to feel instant).
- **Kafka/RabbitMQ**: 🚫 **DO NOT BUILD for MVP.** You have scheduled batch ingestion jobs and synchronous request/response ML calls — there is no genuine streaming/event-driven need yet. A message queue here is decoration that invites the question "what problem does this actually solve for you?" — and you won't have a good answer. If you want it justified, use it only for the *idle repositioning alerting* concept in Phase 3, and say so explicitly.
- **MLflow**: justified — you have multiple candidate models per §6 and a real backtesting need; lightweight local MLflow tracking demonstrates real ML engineering discipline (experiment tracking, not just training a notebook).
- **Docker**: yes, for reproducible local dev + judge-runnable demo. **Kubernetes: 🚫 not for the hackathon** — a docker-compose stack is the right scale; mention K8s only as the stated production target.
- **Prometheus/Grafana**: nice-to-have if time allows (a live metrics/health dashboard is a good "we thought about production" signal), but lower priority than the core decision pipeline — build only after Phases 0–9 are solid.


---

## 16. JAVA / PYTHON BOUNDARY (EXACT CONTRACT)

**Spring Boot owns**: `User, Role, Port, PortConstraint, Vessel, VesselClass, Route, CargoRequest, Contract, Voyage, Recommendation (persisted), Scenario (persisted), AuditLog` entities; all authN/authZ; all business validation (e.g., "cargo tonnage must be positive," "deadline must be future"); orchestration ("when a CargoRequest is created, call ML service for forecast+recommendation, persist the result, return it"); audit logging of every recommendation shown to a user (critical for the "why did the system suggest this at the time" defensibility story).

**Python/FastAPI owns**: `/forecast`, `/risk/score`, `/optimize/entry-timing`, `/optimize/vessel-rank`, `/optimize/portfolio` (Phase 2), `/scenario/simulate`. Stateless where possible — receives structured input, returns structured output with confidence/provenance metadata, never writes directly to the system-of-record DB (Spring Boot persists ML outputs it receives).

Spring Boot → FastAPI calls use a versioned internal contract (`/internal/v1/...`), authenticated with a service-to-service token (not the user's JWT) — call this out explicitly in the security section as good practice.

### 16.1 Example DTO contract (forecast request/response)
```json
// POST /internal/v1/forecast  (FastAPI)
// Request
{
  "origin_region": "AUSTRALIA_NEWCASTLE",
  "destination_port": "DHAMRA",
  "vessel_class": "PANAMAX",
  "horizon_days": 30,
  "as_of_date": "2026-09-11"
}
// Response
{
  "expected_value_usd_per_ton": 27.5,
  "interval_50": [26.8, 28.2],
  "interval_90": [24.9, 31.7],
  "prob_increase_gt_8pct": 0.31,
  "confidence_score": 78,
  "model_used": "lightgbm_quantile_v3",
  "data_provenance": {
    "freight_index": "PUBLIC_PROXY",
    "bunker": "PUBLIC_PROXY",
    "fx": "REAL_VERIFIED"
  },
  "generated_at": "2026-09-11T10:00:00Z"
}
```

---

## 17. DATABASE SCHEMA (KEY ENTITIES — CONDENSED ER)

```
users(id, username, password_hash, role_id, created_at)
roles(id, name)                                  -- ADMIN, ANALYST, MANAGER, VIEWER

ports(id, name, code, region, lat, lon)
port_constraints(id, port_id FK, max_draft_m, max_loa_m, max_beam_m,
                  berth_count, handling_rate_tph, avg_turnaround_days,
                  data_provenance, source_url, last_verified_at)

vessel_classes(id, name, dwt_min, dwt_max, typical_draft_m, typical_loa_m, typical_beam_m)
vessels(id, name, vessel_class_id FK, dwt, draft_m, loa_m, beam_m)   -- can be generic per-class if no fleet data

routes(id, origin_region, destination_port_id FK, distance_nm, typical_transit_days)

freight_index_series(id, index_name, date, value, data_provenance, source)
bunker_price_series(id, date, value, data_provenance, source)
fx_rate_series(id, date, pair, value, data_provenance, source)
congestion_series(id, port_id FK, date, congestion_score, data_provenance)  -- SIMULATED for MVP
weather_risk_calendar(id, region, month, risk_level, note)

cargo_requests(id, user_id FK, tonnage, origin_region, destination_port_id FK,
               deadline, contract_preference, created_at, status)

forecast_runs(id, cargo_request_id FK, route_id FK, vessel_class_id FK,
              model_used, generated_at)
forecast_results(id, forecast_run_id FK, expected_value, interval_50_low,
                  interval_50_high, interval_90_low, interval_90_high,
                  prob_increase_pct, confidence_score, data_provenance_json)

vessel_rankings(id, forecast_run_id FK, vessel_class_id FK, score,
                 estimated_landed_cost, expected_delay_days, feasible bool,
                 infeasibility_reason)

risk_events(id, cargo_request_id FK, risk_score, category, top_drivers_json,
             mitigation_suggestion, computed_at)

recommendations(id, cargo_request_id FK, action, split_pct, rationale_json,
                  forecast_run_id FK, risk_event_id FK, created_at)

scenarios(id, cargo_request_id FK, input_perturbation_json,
           resulting_recommendation_json, created_at)

contracts(id, cargo_request_id FK, contract_type ENUM(spot,short,medium),
           tonnage, fixed_rate, fixed_at, status)

voyages(id, contract_id FK, vessel_id FK, eta_estimate, eta_actual,
         demurrage_actual, status)

audit_logs(id, user_id FK, action, entity_type, entity_id, payload_json, created_at)
```
Indexing: composite index on `(port_id, date)` for congestion/turnaround lookups; `(route_id, vessel_class_id, generated_at)` on forecast tables for fast "latest forecast" queries; `cargo_requests(user_id, status)` for dashboard queries. Partitioning is unnecessary at hackathon/prototype data volumes — defer to production scoping (§43).

---

## 18. API DESIGN (SELECTED — SPRING BOOT PUBLIC SURFACE)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/cargo-requests` | ANALYST+ | Create a cargo requirement → triggers full pipeline |
| GET | `/api/v1/cargo-requests/{id}/recommendation` | ANALYST+ | Full decision chain output |
| POST | `/api/v1/cargo-requests/{id}/scenario` | ANALYST+ | Run a what-if against an existing cargo request |
| GET | `/api/v1/ports/{id}` | VIEWER+ | Port constraint detail incl. provenance |
| GET | `/api/v1/vessel-classes` | VIEWER+ | Reference data |
| POST | `/api/v1/contracts` | MANAGER | Record an actual charter decision (feeds backtest ground truth over time) |
| GET | `/api/v1/dashboard/summary` | VIEWER+ | Market snapshot for landing dashboard |
| GET | `/api/v1/audit` | ADMIN | Audit trail |

Each endpoint: standard bean-validated request DTOs, `400` on validation failure with field-level errors, `403` on role mismatch, `404` on missing entity, `502`/graceful-degradation response (with `data_provenance: DEGRADED` and last-cached forecast) if the ML service is unreachable — **this fallback path is something you should actually build and demo** ("watch what happens when we kill the ML service — the system doesn't crash, it degrades honestly").

---

## 19. ML PIPELINE

```
Raw public data (indices, FX, coal, calendar)
   → ingestion jobs (scheduled, idempotent, source+timestamp stamped)
   → validation (schema checks, range checks, staleness checks)
   → cleaning (missing-value handling: forward-fill for slow series, flag+impute for gaps)
   → feature engineering (lags, rolling stats, seasonality encodings, index deltas)
   → curated feature tables (Postgres)
   → training (time-ordered split — NEVER random shuffle)
   → walk-forward backtesting (§20)
   → model selection (best pinball loss + calibration, not just point-metric)
   → MLflow registry
   → FastAPI loads registered model at startup / on scheduled refresh
   → inference (per forecast request)
   → monitoring (log every prediction + eventual realized value once available → rolling calibration dashboard)
```
**Leakage prevention**: strict time-ordered feature construction (no rolling stat computed using future rows); train/validation split always chronological; any exogenous series (bunker, FX) lagged appropriately so inference-time inputs are genuinely available at decision time. **Drift detection**: rolling comparison of recent prediction error/calibration vs the backtest baseline — flag when it degrades materially → trigger retraining job. **Retraining strategy**: scheduled periodic retrain (e.g., weekly) plus drift-triggered retrain; keep the previous model version available for rollback (MLflow registry stages handle this cleanly).

---

## 20. BACKTESTING METHODOLOGY

**Never random-split.** Use **rolling-origin / walk-forward evaluation**: train on `[0, t]`, predict `t+1..t+h`, slide `t` forward, repeat. Compare Naive vs Seasonal-Naive vs SARIMAX vs LightGBM(quantile) vs (if justified) DL vs Ensemble on: MAE, RMSE, sMAPE (better behaved than MAPE near zero/volatile series), **pinball loss** (the correct metric for quantile forecasts — report this prominently, it signals real rigor), **calibration** (empirical coverage of stated intervals vs nominal), and **directional accuracy** (did we get the sign of the move right — often more decision-relevant than magnitude).

### 20.1 Economic backtest (your strongest single proof point — build this, do not skip it)
For each historical date in the backtest window: (1) generate the forecast+recommendation as if standing at that date (using only data available up to that date — strict no-lookahead), (2) simulate the hypothetical decision (charter now / wait / split), (3) compute the realized cost using the *actual* subsequent observed freight path, (4) compare cumulative realized cost against a **daily-spot-decision baseline** (always charter at today's rate, no timing intelligence) over the same window. Report: cumulative savings %, worst-case single-decision loss, volatility reduction (std-dev of realized cost per decision, strategy vs baseline), and number of decisions where the strategy chose correctly vs baseline. State the assumptions explicitly (demurrage/congestion cost is simulated, not observed, for this backtest) — this transparency is what makes the number defensible instead of fabricated.

---

## 21. EXPLAINABLE AI

Every recommendation ships with a `rationale_json` built **deterministically from the same numbers used in the decision** — e.g.:
```json
{
  "action": "SPLIT",
  "split_pct": 45,
  "drivers": [
    {"factor": "expected_freight_change", "value": "+8% to +11%", "direction": "unfavorable_to_wait"},
    {"factor": "vessel_availability_proxy", "value": "tightening", "direction": "unfavorable_to_wait"},
    {"factor": "congestion_trend", "value": "decreasing", "direction": "favorable_to_wait"},
    {"factor": "prob_increase_gt_8pct", "value": 0.67}
  ],
  "narrative": "Freight is expected to rise 8-11% with 67% probability of exceeding an 8% increase; vessel availability is tightening. Waiting fully is not favorable, but full commitment now forgoes optionality given moderate confidence (score 78/100). Securing 45% now balances expected cost against downside risk."
}
```
The `narrative` string can be templated directly from `drivers` (no LLM needed) **or** generated by an LLM that is given *only* this structured JSON and instructed to phrase it in natural language — never given free rein to invent numbers. This is the correct LLM boundary (§22).

---

## 22. LLM ROLE & AGENT LAYER

**Use an LLM for**: phrasing the rationale JSON into natural language; answering analyst questions like "why wait on this lane" by retrieving the relevant `recommendations`/`forecast_results` rows and summarizing them; generating a management-report summary of the dashboard state. **Never** for: producing a numeric forecast, risk score, or recommendation action directly — those must always come from the deterministic pipeline. Enforce this with a strict system prompt + tool-use pattern (LLM calls a `get_recommendation(cargo_request_id)` tool that returns the real structured object; it is not allowed to answer numeric questions without first calling the tool) and **input validation that rejects any LLM output containing an unsourced numeric claim** the tool didn't emit — a lightweight regex/number-cross-check is enough for a hackathon-grade guardrail.

**Agent architecture**: justified as a **thin orchestrator** over the existing deterministic services (forecast → optimize → risk → scenario), not a free-roaming agent. A query like "find the lowest-risk procurement strategy for 500,000 tons over six months" maps to a **fixed, auditable call sequence** through your own APIs — this is valuable (it's a nicer interface) but is explicitly **not** where your technical credibility comes from; don't oversell it in the pitch. Prompt-injection guardrail: the agent only ever calls your own typed internal tools with typed arguments — it cannot execute arbitrary DB queries or accept instructions embedded in retrieved data as commands (standard tool-use sandboxing).


---

## 23. FEATURE VERDICTS — RUTHLESS, PER YOUR INSTRUCTION

| Idea | Verdict | Why |
|---|---|---|
| Uncertainty/quantile forecasting | ✅ BUILD, MVP | Core differentiator, cheap with LightGBM quantile objective |
| Decision confidence score | ✅ BUILD, MVP | Needed for trust/adoption; formula must be documented (§6.2) |
| Economic backtest | ✅ BUILD, MVP — highest priority after core pipeline | Single best proof point in the whole deck |
| Scenario engine | ✅ BUILD, MVP | Best live-demo moment; cheap since it reuses the pipeline (§12) |
| Vessel-port feasibility filter | ✅ BUILD, MVP | Directly required by problem statement; simple, high credibility |
| Charter portfolio (spot/short/medium) | ✅ BUILD, MVP (single-cargo mean-variance version) | Directly required by problem statement |
| Portfolio MILP (multi-cargo scheduling) | ✅ BUILD, Phase 2 | Real value, real math, but not needed to answer the base problem |
| Digital twin (event-driven simulation) | ⚠️ PARTIAL — build the *constraint-engine* twin (§9), not a full event simulator | Full DES (SimPy-style port/berth/queue simulation) is high effort for demo value that a simpler stochastic model already delivers |
| Explainable AI (structured rationale) | ✅ BUILD, MVP | Directly required; cheap given deterministic pipeline |
| LLM analyst layer | ✅ BUILD, Phase 2, thin | Good UX polish, not core credibility — don't over-invest |
| Constrained AI agent | ⚠️ BUILD ONLY IF TIME REMAINS, Phase 3 | Nice demo flourish, real risk of looking like a gimmick if rushed |
| Vessel-port graph (as a literal graph structure/GNN) | 🚫 DO NOT BUILD | Your "graph" has a handful of ports × 4 vessel classes — a GNN is absurd overkill for a table with <100 edges; a plain relational filter (§8) does the same job better and is more explainable |
| Reinforcement learning for timing decisions | 🚫 DO NOT BUILD | You do not have anywhere near the environment interactions/historical episodes needed to train a meaningful RL policy; it will not outperform the quantile+optimization approach and will not survive a "how did you validate this" question |
| Carbon/ESG optimization | ⚠️ WEAK — see §24 | Only include as a small, clearly-labeled bonus, not a headline feature |
| Digital marketplace (bids/negotiation) | 🚫 DO NOT BUILD for SIH | Out of scope of the problem statement; mention only as "future roadmap," never implement |
| Knowledge graph | 🚫 DO NOT BUILD | Your relational schema already captures every relationship you need; a separate KG layer adds engineering cost with no query your Postgres schema can't answer |
| Berth waiting / probabilistic ETA prediction | ✅ BUILD, MVP (folded into port digital twin, §9) | Not a separate system — it's literally the `expected_turnaround` distribution already needed for demurrage cost |
| Anomaly detection on market data | ⚠️ Phase 2, small | Useful for risk engine's "shock" driver, low effort if built as a rolling z-score, not a separate ML model |

---

## 24. CARBON/ESG — VERDICT

Genuinely defensible only as: **estimated emissions per voyage = f(distance, vessel class fuel-consumption class-average, bunker fuel type)** — this is legitimate back-of-envelope estimation using publicly documented class-average fuel consumption figures, and can inform a "carbon cost per tonne" line item alongside freight/bunker/port costs, useful if EU-style carbon regulation cost pass-through becomes a factor. **Verdict: include as one additional line item in the landed-cost breakdown, not a standalone "carbon optimization engine."** 🚫 Do not build a separate carbon-optimization objective function or claim emissions-based vessel selection — you don't have per-vessel real fuel consumption data, and pretending otherwise is exactly the kind of decorative ESG-washing a red-team judge will puncture in one question.

---

## 25. COMPETITOR LANDSCAPE (HONEST POSITIONING)

Commercial maritime analytics/chartering platforms (Clarksons/Veson/Baltic Exchange data terminals, AIS-based tracking platforms, freight-derivative desks) already provide strong **market data and vessel tracking** — but they are (a) **expensive**, licensed per-seat/enterprise, largely inaccessible to a mid-size PSU logistics desk at the granularity needed; (b) **generic** — built for shipowners/brokers, not tuned to a specific buyer's port-constraint set and contract-portfolio decision; (c) **not decision-integrated** — they show you data, they don't compute "charter now vs wait" as a quantified, risk-adjusted, auditable recommendation tied to *your* ports and *your* cargo. **Our honest gap-fill**: a SAIL-specific decision layer — feasibility + timing + portfolio recommendation with traceable rationale — sitting on top of (eventually) the same class of market data those platforms provide, not competing with their data acquisition at all. Say this plainly rather than claiming uniqueness you can't evidence.

---

## 26. RED-TEAM: HOSTILE JUDGE ATTACKS + YOUR ANSWERS

| Attack | Answer |
|---|---|
| "Is your data real?" | "Freight index and FX data are real public data; port-level congestion and AIS are explicitly labeled SIMULATED for the demo — here's the exact provenance badge on every number, and here's the path to swap in real port-authority/AIS feeds in production." |
| "Why isn't this just an LSTM dashboard?" | "We benchmarked naive/SARIMAX/LightGBM/DL on walk-forward backtests — LightGBM with conformal-calibrated quantiles won on pinball loss and calibration; the differentiator isn't the model, it's the decision layer (timing optimization, feasibility filtering, portfolio allocation, and an economic backtest proving business value) built on top of it." |
| "What happens when the model is wrong?" | "Every forecast ships with a calibrated uncertainty interval; the optimizer's SPLIT recommendation is specifically designed to hedge against being wrong rather than betting fully on a point forecast; and our confidence score drops automatically when input data is stale or incomplete." |
| "Can SAIL actually deploy this?" | "The business backend, schema, and API contracts are production-shaped Spring Boot/Postgres; what's missing for production is licensed market/AIS data and port-authority data-sharing — both integration points, not architecture rewrites." |
| "What is novel here, specifically?" | "Distributional (not point) freight forecasting with conformal calibration; a feasibility-then-optimization vessel engine tied to real port constraint data; an economic backtest that quantifies decision value in rupees, not RMSE; and full data-provenance labeling built into the product, not the appendix." |
| "How do you prove the savings are real?" | "We don't claim they're SAIL's actual savings — we show a transparent, assumption-labeled economic backtest methodology and state exactly what real historical fixture data would be needed to compute SAIL's true number." |
| "Why not use an existing maritime platform?" | See §25 — data access cost/generality gap plus lack of decision integration. |
| "Are you overengineering?" | "We deliberately did NOT build Kafka, Kubernetes, a knowledge graph, GNNs, or RL — see our own scoping table; every component we did build maps to a specific line in the problem statement." |
| "Which parts are fake?" | Answer with the provenance taxonomy (§3.1) without flinching — naming your own simulated components confidently is a strength, not a weakness. |
| "Can it scale?" | "The heavy compute (LightGBM inference, optimization) is sub-second per request; Postgres/Redis handle the data volumes involved comfortably; the documented production path adds managed DB, horizontal FastAPI replicas, and a real data-ingestion SLA." |

**Method to generate the remaining ~40 questions yourself**: for every section number in this document, ask "what is the single hardest one-sentence objection to this section?" — the pattern above (data reality → model justification → business value → deployability → scope discipline) repeats across ML, optimization, security, and UX questions alike. I can produce the full 50-question bank with short 20-second answers verbatim as a follow-up artifact if you want it drilled for practice.


---

## 27. SECURITY

JWT access tokens (short-lived) + refresh tokens; RBAC enforced at Spring Boot controller/service layer (`ADMIN/MANAGER/ANALYST/VIEWER`); service-to-service auth between Spring Boot and FastAPI via a separate internal API key/token (never the user's JWT passed through); input validation via Bean Validation annotations on every DTO; rate limiting at the gateway/filter layer (simple bucket4j-style limiter is sufficient for a hackathon, mention API Gateway/WAF as production upgrade); secrets via environment variables/`.env` locally, a secrets manager in production (never committed); encryption at rest for Postgres in production (managed DB feature), TLS everywhere; full audit logging of every recommendation shown and every contract recorded (`audit_logs` table, §17); LLM/agent layer restricted to typed tool calls only, with output validated against known numeric fields before display (prompt-injection mitigation, §22). **Threat model summary**: primary risks are (1) unauthorized role escalation → mitigated by strict RBAC + audit; (2) stale/poisoned market data silently driving bad recommendations → mitigated by data validation/staleness checks feeding into the confidence score; (3) LLM layer hallucinating a number → mitigated by the tool-boundary design in §22; (4) ML service outage → mitigated by the graceful-degradation fallback (§18).

---

## 28. MVP / PRODUCTION-PROTOTYPE / ENTERPRISE SCOPING

### LEVEL 1 — Hackathon MVP (buildable in the contest window)
Command Center single-cargo flow end-to-end: cargo request → vessel-port feasibility → distributional forecast (LightGBM quantile + conformal) → market-entry recommendation (NOW/WAIT/SPLIT with computed p) → risk score → scenario simulator → structured explainability. Spot/short/medium comparison via mean-variance split. Economic backtest report as a dashboard page. Spring Boot + FastAPI + Postgres + Redis, Dockerized, real public data for freight-index/bunker/FX, clearly labeled simulated congestion/AIS. No portfolio MILP, no LLM layer required (template-based rationale is enough), no Kafka/K8s.

### LEVEL 2 — Strong Production Prototype
Add: Phase-2 items from §23 (portfolio MILP planner, thin LLM analyst layer, anomaly detection, MLflow-tracked retraining job, Prometheus/Grafana). Begin integrating any real port-authority data obtainable by then. Add automated walk-forward retraining schedule and drift monitoring dashboard.

### LEVEL 3 — Enterprise SAIL Platform
Real licensed freight/AIS data integration; real port-authority congestion feed or IoT/AIS-derived berth occupancy; fleet-data integration enabling genuine idle/repositioning optimization (§10 production path); full rolling-horizon dynamic-programming timing optimizer (upgrade from the single-decision SPLIT heuristic); Kubernetes-based deployment with managed Postgres, autoscaled FastAPI inference; formal model governance/versioning process; SSO/enterprise auth integration; SLA-backed data ingestion pipelines.

---

## 29. DEVELOPMENT ORDER (DEPENDENCY-OPTIMIZED)

```
Phase 0: Repo scaffold, docker-compose skeleton, CI stub
Phase 1: Postgres schema + Spring Boot entities/repositories (no business logic yet)
Phase 2: Reference data seeding — ports, vessel classes, routes (labeled provenance)
Phase 3: Data ingestion pipeline — real public series (freight index/bunker/FX) + simulated congestion/AIS generators
Phase 4: ML service skeleton (FastAPI) + baseline models (naive/SARIMAX) + backtesting harness FIRST
          (build the evaluation harness before the fancy model — this prevents "we never actually
           validated it" late in the project)
Phase 5: LightGBM quantile model + conformal calibration; plug into backtesting harness; compare
Phase 6: Vessel-port feasibility filter + scoring (Java, using seeded reference data)
Phase 7: Market-entry optimizer (ETLC formulation) + SPLIT(p) solver — Python, exposed via FastAPI
Phase 8: Risk engine — Python, consuming forecast + congestion + calendar
Phase 9: Spring Boot orchestration — cargo-request pipeline wiring all of the above end-to-end
Phase 10: Scenario simulator (reuses Phase 9 pipeline with perturbed inputs)
Phase 11: Economic backtest report generation
Phase 12: Frontend — Command Center + dashboards
Phase 13: Explainability layer (structured rationale + optional LLM phrasing)
Phase 14: Security hardening (RBAC, audit, rate limiting)
Phase 15: Integration testing, demo rehearsal, deck/script
Phase 16 (if time remains): Portfolio MILP planner, LLM analyst, observability stack
```
Note the deliberate ordering: **the backtesting harness (Phase 4) comes before the sophisticated model (Phase 5)** — this is the single most important sequencing decision in the whole plan, because it forces every subsequent model choice to be evidence-based rather than retrofitted.


---

## 30. REPOSITORY STRUCTURE

```
/backend                 -- Spring Boot (Java 17+, Maven/Gradle)
  /src/main/java/com/sail/charter/
    /domain/entity/       -- JPA entities
    /domain/repository/
    /domain/service/
    /api/controller/
    /api/dto/
    /security/
    /client/mlservice/    -- typed HTTP client to FastAPI
    /config/
  /src/test/java/...

/ml-service               -- Python FastAPI
  /app/models/            -- forecasting model wrappers
  /app/optimization/      -- ETLC, SPLIT solver, vessel scoring
  /app/risk/
  /app/scenario/
  /app/api/routers/
  /app/schemas/           -- pydantic request/response models
  /tests/

/data-pipeline             -- Python scheduled jobs
  /ingestion/               -- per-source fetchers (freight index, bunker, fx)
  /simulation/              -- congestion/AIS simulators (labeled clearly)
  /features/                -- feature engineering, writes to Postgres
  /backtesting/             -- walk-forward harness, economic backtest runner

/frontend                  -- React + Next.js
  /app/dashboard
  /app/command-center
  /app/components
  /app/lib/api-client

/infrastructure
  docker-compose.yml
  /postgres/init/           -- schema + seed SQL
  /monitoring/              -- (Phase 2) Prometheus/Grafana configs

/docs
  architecture.md           -- (this document, trimmed for repo)
  data-provenance.md
  api-contracts.md

/scripts
  seed_reference_data.py
  run_backtest.sh
```

---

## 31. ANTIGRAVITY TASK PACKETS

Each packet below is independently executable. Antigravity should be told to **read the packet fully, inspect existing repo state first, implement incrementally, run the specified tests, and report failures rather than silently "fixing" them by guessing.**

### TASK 0 — Repo & Docker Scaffold
**Objective**: create the monorepo skeleton and a working `docker-compose up` that starts Postgres, Redis, an empty Spring Boot service, and an empty FastAPI service, all healthy.
**Files to create**: directory tree from §30; `infrastructure/docker-compose.yml`; `backend/Dockerfile`; `ml-service/Dockerfile`; `backend/pom.xml` (Spring Boot 3.x, Java 17, dependencies: web, data-jpa, security, validation, postgresql driver, lombok); `ml-service/requirements.txt` (fastapi, uvicorn, pandas, numpy, scikit-learn, lightgbm, statsmodels, pydantic).
**Acceptance criteria**: `docker-compose up` starts 4 services; `GET /actuator/health` on Spring Boot returns 200; `GET /health` on FastAPI returns 200; Postgres accepts connections on the configured port.
**Tests**: a smoke-test script `scripts/smoke_test.sh` that curls both health endpoints and checks Postgres connectivity via `psql`.

### TASK 1 — Database Schema
**Objective**: implement the full schema from §17 as Flyway/Liquibase migrations (prefer Flyway — simpler for a hackathon).
**Files**: `backend/src/main/resources/db/migration/V1__init_schema.sql` (all tables from §17), `V2__seed_reference_data.sql` (ports, vessel_classes, routes — every field explicitly tagged with `data_provenance` per §3.1; use `ASSUMPTION` for any port constraint value not backed by a cited source; leave a `source_url` column populated only where real).
**Entities**: create matching JPA `@Entity` classes for every table in `backend/.../domain/entity/`, with `@Enumerated` for provenance/status enums.
**Acceptance criteria**: migrations run cleanly on a fresh Postgres container; every `port_constraints` row has a non-null `data_provenance` value; Spring Boot starts and Hibernate validates entity mappings against the schema without error (`ddl-auto=validate`, not `update`).
**Tests**: a JUnit `@DataJpaTest` that loads each entity type and asserts row counts > 0 for seeded reference tables.

### TASK 2 — Spring Boot Domain APIs (Cargo, Port, Vessel reference)
**Objective**: implement CRUD/read APIs for `Port`, `VesselClass`, `CargoRequest` per the contract in §18 (subset: `GET /api/v1/ports/{id}`, `GET /api/v1/vessel-classes`, `POST /api/v1/cargo-requests` — creation only stores the request at this stage, no pipeline call yet).
**Files**: controllers/services/repositories/DTOs under `backend/.../api` and `.../domain`; a `GlobalExceptionHandler` (`@ControllerAdvice`) mapping validation errors to 400 with field details, not-found to 404.
**Acceptance criteria**: Postman/curl examples in the packet must work verbatim; invalid `CargoRequest` (negative tonnage, past deadline) returns 400 with a clear field-level error message; valid request returns 201 with a generated id.
**Tests**: `@SpringBootTest` + `MockMvc` covering happy path + at least 3 validation-failure cases (negative tonnage, missing destination, past deadline).

### TASK 3 — Data Ingestion Jobs (Real Public Data)
**Objective**: implement scheduled Python jobs that fetch and store: (a) a public freight-index-family time series, (b) a public bunker/crude proxy series, (c) RBI USD/INR reference rate, into the `freight_index_series`, `bunker_price_series`, `fx_rate_series` tables — each row stamped with `data_provenance='PUBLIC_PROXY'` or `'REAL_VERIFIED'` as appropriate, plus `source` URL/name.
**Files**: `data-pipeline/ingestion/freight_index.py`, `bunker.py`, `fx.py`, each with a `fetch()` and `validate_and_store()` function; `data-pipeline/ingestion/run_all.py` as the scheduled entrypoint; a `data-pipeline/ingestion/base.py` shared idempotent-upsert helper (dedupe by date+source).
**Acceptance criteria**: running `run_all.py` against a live network populates at least 1 year of daily/weekly history where available, without duplicate rows on re-run; every stored row has non-null provenance and source; a failure in one source does not crash the others (isolated try/except per source, logged).
**Tests**: unit tests with mocked HTTP responses verifying parsing + provenance tagging; an idempotency test (run twice, assert row count unchanged on the second run).

### TASK 4 — Congestion & AIS Simulation (Clearly Labeled)
**Objective**: implement a seasonally-modulated stochastic simulator for port congestion and a coarse vessel-position/ETA simulator, writing to `congestion_series` with `data_provenance='SIMULATED'`.
**Files**: `data-pipeline/simulation/congestion_sim.py` (a seeded, documented stochastic process — e.g., mean-reverting process with a seasonal multiplier for monsoon/cyclone months from `weather_risk_calendar`), `data-pipeline/simulation/ais_sim.py` (transit-time distribution per route, used only for illustrative "vessel position" UI elements, not for any cost calculation that could be mistaken for real telemetry).
**Acceptance criteria**: simulation is deterministic given a seed (reproducible for judges); output is written with the `SIMULATED` tag on every row; a `--seed` CLI flag is documented.
**Tests**: assert reproducibility (same seed → identical output); assert seasonal months show materially different average congestion than non-seasonal months (sanity check the seasonality logic actually does something).

### TASK 5 — Feature Engineering + Feature Tables
**Objective**: build the curated feature table(s) consumed by the ML service — lags, rolling means/vol, calendar encodings, joined index/bunker/fx/congestion features per route/vessel-class/date.
**Files**: `data-pipeline/features/build_features.py`; output to a `feature_store` table or parquet files under a mounted volume (document the choice — Postgres table is simpler for a hackathon, use it).
**Acceptance criteria**: no feature uses information from a future date relative to its own row's date (write an explicit assertion for this — compare each feature's max lookback date against the row date); output schema documented in `docs/api-contracts.md`.
**Tests**: a leakage-check unit test that deliberately tries to break the no-lookahead invariant and confirms the assertion catches it.

### TASK 6 — Baseline Models + Backtesting Harness (BEFORE the advanced model)
**Objective**: implement naive, seasonal-naive, and SARIMAX baselines, plus the **walk-forward backtesting harness** itself, before any ML/DL model exists.
**Files**: `ml-service/app/models/naive.py`, `seasonal_naive.py`, `sarimax.py`; `ml-service/app/backtesting/walk_forward.py` (generic harness accepting any model implementing a `fit(train_df)`/`predict_quantiles(horizon)` interface); `ml-service/app/backtesting/metrics.py` (MAE, RMSE, sMAPE, pinball loss, calibration coverage, directional accuracy).
**Acceptance criteria**: harness produces a results table (model × route × metric) from a single command; SARIMAX beats naive on at least sMAPE on the seeded data (if it doesn't, the packet must report this honestly rather than silently discarding SARIMAX).
**Tests**: harness unit test on synthetic data with a known seasonal pattern, asserting seasonal-naive outperforms plain naive (sanity check the harness logic itself, independent of real data quality).

### TASK 7 — Quantile LightGBM + Conformal Calibration
**Objective**: implement the primary forecasting model.
**Files**: `ml-service/app/models/lgbm_quantile.py` (train separate LightGBM models at quantiles [0.05, 0.25, 0.5, 0.75, 0.95] or use LightGBM's native quantile objective looped over alphas); `ml-service/app/models/conformal.py` (split-conformal calibration wrapping the quantile outputs using a held-out calibration set).
**Acceptance criteria**: run through the Task 6 harness; report pinball loss and empirical interval coverage vs nominal (e.g., the 90% interval should empirically cover ~90% ± reasonable tolerance on the calibration/test split); document the comparison against SARIMAX/naive in `docs/model_comparison.md` — including if it does NOT win, per the brief's instruction to be honest.
**Tests**: unit test asserting quantile monotonicity (5th ≤ 25th ≤ 50th ≤ 75th ≤ 95th, since raw independently-trained quantile models can cross — add a sorting/rearrangement safeguard if so); calibration test on synthetic data with known distribution.

### TASK 8 — Market-Entry Optimizer (ETLC + SPLIT solver)
**Objective**: implement §7's ETLC function and the `p*` SPLIT solver.
**Files**: `ml-service/app/optimization/etlc.py`, `ml-service/app/optimization/entry_timing.py` (grid-search over `p ∈ [0,1]` in steps of 0.05, returns `p*` and the cost curve for UI visualization).
**Acceptance criteria**: given a synthetic scenario where the forecast clearly favors waiting (rising expected value, low volatility, ample time buffer), the optimizer recommends `WAIT` or a high split-to-wait; given the opposite, it recommends `CHARTER_NOW`; deadline-feasibility constraint is enforced (never recommend WAIT if there isn't enough time buffer left before the deadline to still execute a charter).
**Tests**: three parametrized unit tests exactly matching the three scenarios above (favor-wait, favor-now, deadline-infeasible-so-must-act-now).

### TASK 9 — Vessel-Port Feasibility & Scoring
**Objective**: implement §8 Step 1 (hard filter) and Step 2 (weighted scoring), calling Spring Boot's port/vessel reference APIs (or a direct read replica for the ML service, per your infra choice — document which).
**Files**: `ml-service/app/optimization/vessel_feasibility.py`, `vessel_scoring.py`.
**Acceptance criteria**: a cargo requiring a port with a shallow max draft correctly eliminates Capesize from the candidate list with a human-readable `infeasibility_reason` (e.g., "vessel draft 17.5m exceeds port max draft 14.0m"); scoring weights are a named config object, not inline magic numbers.
**Tests**: unit test with a synthetic port (small draft) confirming Capesize/Panamax elimination and Handysize/Supramax survival.

### TASK 10 — Risk Engine
**Objective**: implement §11's weighted risk score.
**Files**: `ml-service/app/risk/risk_engine.py`.
**Acceptance criteria**: risk score is reproducible and traceable — calling the function twice with identical inputs gives identical output and an identical `top_drivers` breakdown; changing any single sub-score input changes the total score monotonically in the expected direction (write this as an explicit test, not just eyeballed).
**Tests**: monotonicity unit tests, one per weighted sub-component.

### TASK 11 — Orchestration Pipeline (Spring Boot ↔ FastAPI end-to-end)
**Objective**: wire `POST /api/v1/cargo-requests` to call FastAPI's `/forecast`, `/optimize/vessel-rank`, `/optimize/entry-timing`, `/risk/score` in sequence, persist all results (`forecast_runs`, `forecast_results`, `vessel_rankings`, `risk_events`, `recommendations`), and return the full decision chain in the response.
**Files**: `backend/.../client/mlservice/MlServiceClient.java` (typed `RestClient`/`WebClient` wrapper with the internal service token from §16), `backend/.../domain/service/CargoDecisionOrchestrator.java`.
**Acceptance criteria**: end-to-end call from `POST /api/v1/cargo-requests` returns a fully populated recommendation within a few seconds on local dev; if FastAPI is down, the endpoint still returns a 200 with a `degraded: true` flag and the last cached forecast for that route/vessel-class from Redis, rather than a 500 (§18 fallback requirement — build and test this explicitly).
**Tests**: integration test with FastAPI mocked/stubbed for both the happy path and a simulated outage, asserting the degraded-response behavior.

### TASK 12 — Scenario Simulator Endpoint
**Objective**: implement `POST /api/v1/cargo-requests/{id}/scenario`, accepting a perturbation payload (e.g., `{"freight_shock_pct": 15, "congestion_shock_pct": 30}`) and re-running the exact same orchestration pipeline from Task 11 with adjusted inputs, without persisting a new `cargo_request` row (store under `scenarios`).
**Acceptance criteria**: identical code path to Task 11's orchestration is reused (no duplicated business logic) — the packet must explicitly refactor Task 11 into a reusable pipeline function first, then call it from both the normal and scenario endpoints.
**Tests**: assert a large freight-shock-up scenario shifts the recommendation toward CHARTER_NOW / higher split percentage vs. the unperturbed baseline for the same cargo request.

### TASK 13 — Economic Backtest Report
**Objective**: implement `data-pipeline/backtesting/economic_backtest.py` per §20.1, producing a report (JSON + a simple table) of cumulative strategy-vs-baseline savings over the available historical window.
**Acceptance criteria**: strict no-lookahead is enforced (reuse the Task 5 leakage-check pattern); report includes cumulative savings %, worst single-decision loss, and volatility reduction; all assumptions (demurrage cost basis, congestion source) are printed in the report header, not hidden.
**Tests**: a synthetic-data test where the "AI strategy" is deliberately constructed to be provably better than the naive baseline (e.g., feed it a sawtooth pattern it should exploit), confirming the harness correctly detects and reports the expected savings direction.

### TASK 14 — Frontend Command Center
**Objective**: build the primary demo screen per §32/§34: cargo input form → the full visual decision pipeline (feasibility → forecast → cost → risk → scenario → recommendation) rendered as a step-by-step flow, each step showing its data-provenance badges.
**Files**: `frontend/app/command-center/page.tsx` + supporting components (`ForecastPanel`, `VesselRankingTable`, `RiskPanel`, `ScenarioControls`, `RecommendationCard`, `ProvenanceBadge`).
**Acceptance criteria**: submitting a cargo request drives a single API call chain to the backend and renders every stage of §2's pipeline visibly and in order; every numeric value on screen carries a provenance badge (§3.1) rendered via the shared `ProvenanceBadge` component — this is a hard UI requirement, not optional polish.
**Tests**: component tests for `ProvenanceBadge` rendering all 5 provenance states correctly; an end-to-end (Playwright/Cypress) happy-path test submitting a cargo request and asserting a recommendation renders.

---

## 32. EXACT ANTIGRAVITY PROMPTS (PASTE THESE VERBATIM, ONE PER PHASE)

> **Before every prompt below**, prepend: *"Inspect the current repository state fully before writing any code. Do not rewrite or delete working code from a prior task. If a file already exists and conflicts with this task, tell me the conflict instead of guessing a resolution. Implement incrementally, run the specified tests after every meaningful change, and report any test failures verbatim rather than silently modifying tests to pass."*

**Prompt — Task 0**: "Implement TASK 0 — Repo & Docker Scaffold exactly as specified in the architecture doc section 31. Create the full directory structure from section 30. Do not add any dependency not listed in the task. After scaffolding, run `docker-compose up` and report the health-check results for all four services."

**Prompt — Task 1**: "Implement TASK 1 — Database Schema. Use Flyway migrations under `backend/src/main/resources/db/migration/`. Every table and column must match section 17 of the architecture doc exactly — do not add or omit columns without flagging it to me first. Seed data must have a non-null `data_provenance` value on every row per section 3.1; use 'ASSUMPTION' for any port constraint value you cannot cite a real source for, and leave `source_url` null in that case. Run the acceptance tests specified in the task and report results."

**Prompt — Task 2**: "Implement TASK 2 — Spring Boot Domain APIs for Port, VesselClass, and CargoRequest, exactly matching the request/response shapes in section 18. Implement the GlobalExceptionHandler as specified. Write and run the three validation-failure MockMvc tests listed in the task before reporting completion."

*(Continue this same pattern for Tasks 3–14 — each prompt is: "Implement TASK N — <name> exactly as specified in section 31 of the architecture doc. <any task-specific emphasis, e.g. 'Do not build the advanced model before the backtesting harness exists — that ordering is mandatory.'> Run the specified tests and report results before moving to the next task.")*

**Universal guard prompt (use if Antigravity starts over-scoping)**: "Stop. Only implement what TASK N specifies. Do not add Kafka, Kubernetes, GNN, RL, or any component explicitly marked 'DO NOT BUILD' in section 23 of the architecture doc, even if it seems like a natural extension. Flag scope-creep ideas to me instead of implementing them."


---

## 33. GIT STRATEGY

Branches: `main` (always demoable), `develop` (integration), `feature/<task-name>` per Antigravity task packet. Commit convention (Conventional Commits): `feat(forecast): add conformal calibration wrapper`, `fix(port): correct draft constraint validation`, `test(optimizer): add deadline-infeasibility case`, `docs(architecture): update backtest methodology`. Tag milestones after each phase in §29 completes (`v0.1-schema`, `v0.2-baseline-models`, `v0.3-orchestration`, `v1.0-demo-ready`). Protect `main` — merge only after the task's specified tests pass.

## 34. TESTING STRATEGY (SUMMARY — DETAIL PER-TASK IN §31)

Unit tests co-located per task (JUnit for Spring Boot, pytest for Python). Integration tests for the Spring Boot ↔ FastAPI boundary including the degraded-mode fallback. API contract tests validating every DTO against the schemas in §18/§16.1. ML-specific tests: leakage checks, calibration checks, monotonicity checks (these are not optional — they're what makes your ML "tested" rather than "trained once and hoped"). One end-to-end Playwright/Cypress happy-path test on the Command Center. Load testing: a simple k6/Locust script hitting `/api/v1/cargo-requests` at modest concurrency (20–50 rps) is sufficient evidence of scalability awareness for a hackathon — do not over-invest here. Security testing: verify role-gated endpoints reject wrong-role tokens with 403 (a handful of targeted tests, not a full pen-test).

## 35. DATA & MODEL VERSIONING

Dataset versioning: every ingestion job run is timestamped and idempotent-upserted (§Task 3) — the `generated_at`/`date` columns are your version key, no separate DVC-style tool needed at this scale (adding one would be unjustified complexity). Model versioning: MLflow registry (Phase 2) or, for MVP, a simple `model_used` string + a version-stamped `.pkl`/`.txt` model file naming convention (`lgbm_quantile_v{n}.txt`) is enough — document which you chose and why. Experiment tracking: MLflow local tracking server (single Docker container) logs every backtest run's metrics — cheap, and a strong "we did this properly" signal.

## 36. DEPLOYMENT

**Local/hackathon**: `docker-compose up` runs everything (§Task 0) — this *is* your judge-facing deployment; make it a one-command, no-manual-config experience. **Small production**: containers on a single managed VM or a small managed-Postgres + 2 app-container setup (e.g., a modest cloud VM or basic managed container service) — no Kubernetes needed at this scale. **Enterprise**: Kubernetes only once genuine horizontal-scaling/multi-tenant needs exist; managed Postgres with read replicas for the ML service's feature reads; a proper model-serving layer if inference volume grows materially; full CI/CD with staged rollout for model updates.

## 37. COST (ORDER-OF-MAGNITUDE RANGES — NOT VENDOR QUOTES)

**Prototype (hackathon → pilot)**: low, primarily a single small VM/managed-container spend plus a managed Postgres instance at the smallest tier — a few thousand INR/month range is plausible for a lightweight pilot; do not present this as a firm quote. **Small production**: scales with add of licensed market data (this is typically the dominant cost line if commercial freight/AIS data is licensed — and that cost is genuinely unknown to us without a vendor quote, say so explicitly). **Enterprise**: dominated by (a) licensed data feeds, (b) managed DB/compute at scale, (c) engineering/ops headcount — not by the software architecture itself. **State clearly in the deck**: "our infrastructure is deliberately lightweight; the primary future cost driver is data licensing, not compute" — this is an honest and judge-credible framing.

## 38. BUSINESS CASE (ILLUSTRATIVE, ASSUMPTION-LABELED)

```
ASSUMPTIONS (explicitly labeled, not claimed as SAIL fact):
  Annual coking-coal import volume: illustrative demo value, NOT SAIL's actual figure
  Freight share of landed cost: ~20-40% (industry-typical range, cite as general knowledge)
  Baseline strategy: always-spot, no timing intelligence
  Our strategy: economic-backtest-validated timing + portfolio split

ILLUSTRATIVE FRAMEWORK:
  Potential_Savings = Annual_Freight_Spend × Backtested_Savings_Pct (from §20.1's own backtest output)

WHAT WOULD BE NEEDED TO MAKE THIS A REAL SAIL NUMBER:
  - SAIL's actual annual import volume and freight spend (confidential/internal)
  - SAIL's actual historical charter-fixture timestamps and rates (to run OUR backtest on
    THEIR real decisions, not a simulated baseline)
  - Confirmed port-level congestion/demurrage history
```
State this framework explicitly on a slide with the caveat printed on the slide itself, not just in your speaking notes — it demonstrates rigor rather than undermining confidence.

## 39. NOVELTY STATEMENT

Not "we use AI and machine learning." Instead: **"We convert freight-market uncertainty into a calibrated probability distribution, filter it through real physical port-vessel constraints, and resolve it into an auditable, risk-adjusted procurement action — with every number in the system traceable to a labeled data source, and every recommendation validated against a transparent historical backtest rather than asserted."**

## 40. VALUE PROPOSITION (IMPROVED)

> "A decision-intelligence platform that turns freight-market uncertainty, physical port and vessel constraints, and operational risk into a single auditable recommendation — charter now, wait, or split — backed by a calibrated forecast and a transparent backtest of its own track record, so SAIL's chartering decisions are evidence-based instead of gut-feel, and defensible in an audit instead of just in a meeting."

## 41. DEMO STRATEGY (5–7 MINUTES)

1. **(30s) The problem** — one slide: "chartering decisions today are timing-blind and vessel-selection is manual." 2. **(30s) Market snapshot dashboard** — real freight-index/bunker/FX data, live. 3. **(60s) Command Center input** — enter a real-shaped cargo requirement (tonnage/origin/destination/deadline). 4. **(60s) Pipeline walkthrough live** — feasibility filter eliminates Capesize with a stated reason; distributional forecast renders with interval + probability-of-increase; provenance badges visible throughout. 5. **(45s) Recommendation + rationale** — SPLIT(p) with the structured "why" narrative. 6. **(60s) Scenario simulator live** — bump freight +15%, show the recommendation shift in real time; this is your best visual moment, don't rush it. 7. **(45s) Risk panel** — score + drivers + mitigation suggestion, tied numerically to the same optimizer. 8. **(45s) Economic backtest slide** — cumulative savings vs spot-only baseline, with assumptions printed on-slide. 9. **(30s) Close** — novelty statement (§39) + honest "what's real vs simulated vs future" summary. Rehearse the scenario-simulator moment until it is completely reliable — if one thing must never fail live, it's that one.

## 42. FAILURE MODES

| Failure | Cause | Impact | Detection | Fallback | Recovery |
|---|---|---|---|---|---|
| Missing freight data | Upstream public source down/rate-limited | Stale forecast | Staleness check on ingestion timestamp | Serve last-cached forecast, flag `degraded` | Retry job, alert if stale > threshold |
| ML service down | Deploy/crash | Orchestrator can't get forecast | HTTP timeout/error from client | Redis-cached last forecast + `degraded:true` flag (Task 11) | Restart container, health-check gate before traffic |
| Port data outdated | Manual reference data, rarely refreshed | Wrong feasibility filter | `last_verified_at` age check | Show `ASSUMPTION`/stale badge in UI | Manual re-verification workflow |
| Quantile crossing | Independently trained quantile models | Nonsensical interval (5th > 95th) | Monotonicity unit test (Task 7) | Sort/rearrange quantiles post-hoc | Retrain with joint quantile objective if recurring |
| Model drift | Market regime shift | Degraded calibration | Rolling calibration monitor (§19) | Fall back to SARIMAX baseline temporarily | Trigger retraining job |
| DB unavailable | Infra outage | Full system down | Spring Boot health check | None — this is a hard dependency, be honest about it | Standard managed-DB HA in production |
| Extreme market shock (outside training range) | Black-swan event | Forecast interval too narrow, unreliable | Interval width vs historical norm check | Widen interval / flag low confidence explicitly rather than presenting false precision | Manual override path for a human decision-maker — always keep one |

## 43. FINAL SUMMARY & WHAT I'D DO FIRST IF I WERE YOU

Build in this order and you will have a genuinely defensible, demoable system rather than a stitched-together pile of features: **schema → real data ingestion → backtesting harness → baseline models → the quantile+conformal model → feasibility filter → ETLC/SPLIT optimizer → risk engine → orchestration → scenario simulator → economic backtest → frontend Command Center → explainability polish.** Everything else in this document (portfolio MILP, LLM analyst, agent layer, observability) is real, justified, and worth doing — but only after the above is solid and rehearsed. The thing that wins this competition is not any single clever model; it's that **every number on screen is traceable, every "advanced" component has a stated reason to exist, and the one slide that says "here's how much this would have saved, and here's exactly what we assumed to calculate that" is airtight.**

---

*Ready on request: the full 50-question judge bank with 20-second answers, the Phase-2 Antigravity packets (portfolio MILP, LLM analyst layer), a slide-by-slide pitch deck script, or the actual FastAPI/Spring Boot starter code for Task 0–2.*
