# SAIL Maritime Freight Intelligence Platform

Autonomous Decision-Intelligence Platform for Dry-Bulk Chartering at Steel Authority of India Limited (SAIL).

---

## 🚀 Quick Start & Judge Evaluation

The platform can be evaluated in two modes:

### Option A: Native Local Startup (One Command — Recommended on macOS/Local Hosts)
Prerequisites: Java 17+, Python 3.11+, Node 18+, PostgreSQL & Redis.

```bash
# Start all services (PostgreSQL, Redis, FastAPI, Spring Boot with Flyway migrations, and Next.js UI)
./scripts/start_local.sh
```
* **Command Center UI**: [http://localhost:3000/command-center](http://localhost:3000/command-center)
* **Spring Boot API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
* **FastAPI ML Service**: [http://localhost:8000/health](http://localhost:8000/health)

### Option B: Docker Compose (One Command — Containerized Stack)
Prerequisites: Docker & Docker Compose.

```bash
cd infrastructure
docker compose up --build
```

---

## 📊 End-to-End Walkthrough & Acceptance Testing

### 1. Economic Backtest Report (§20.1, Task 13)
```bash
./scripts/run_backtest.sh
```
Generates the walk-forward evaluation against the daily-spot baseline, printing all operational assumptions and data provenance in the report header.

### 2. Spring Boot Security & Concurrency Load Test (§27, §34)
```bash
cd backend
mvn test -Dtest=SecurityHardeningTest,CargoRequestLoadTest
```
- Verifies RBAC access control (VIEWER gets 403, MANAGER succeeds).
- Verifies FastAPI outage degraded-mode fallback (returns HTTP 200 with `degraded: true` and cached forecast).
- Runs 20–50 RPS concurrency benchmark with sub-10ms response times.

### 3. Frontend End-to-End Rehearsal & Provenance Badge Audit (§3.1, §34, §41)
```bash
cd frontend
npm run test
```
- Confirms 5-stage pipeline rendering: Feasibility (eliminates Capesize with draft explanation) &rarr; Quantile Forecast &rarr; Risk Engine &rarr; Scenario Simulator &rarr; SPLIT Optimizer.
- Confirms all 5 provenance badge states (`REAL_VERIFIED`, `PUBLIC_PROXY`, `SIMULATED`, `ASSUMPTION`, `MODEL_OUTPUT`).
- Confirms real-time in-place +15% freight shock perturbation without full page reload.

---

## 📈 Model Comparison & Honest Verdict

Full empirical benchmark across Naive, Seasonal-Naive, SARIMAX, Quantile LightGBM, and Conformal LightGBM is documented in [`docs/model_comparison.md`](docs/model_comparison.md).
- **Finding**: Liquid freight indices behave as near-martingales on a 2-year daily history. SARIMAX and Naive achieved superior sMAPE (3.92%) and pinball loss (0.1228) over tree-based ensembles, leading to SARIMAX being selected as the production forecast driver.

---

## 🚢 Presentation Demo Flow (5–7 Minutes)

Follow the 9-step demo script in Section 41 of [`docs/sih26006_architecture.md`](docs/sih26006_architecture.md#L838):
1. **The Problem** (30s)
2. **Market Snapshot** (30s)
3. **Command Center Input** (60s)
4. **Pipeline Walkthrough** (60s)
5. **Recommendation & Rationale** (45s)
6. **Scenario Simulator** (60s) — Use 1-click `Freight +15% (Spot Spike)` preset button.
7. **Risk Panel** (45s)
8. **Economic Backtest** (45s)
9. **Closing Statement** (30s)
