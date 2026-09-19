# Freight Forecasting & Charter Analysis — Frontend

React · TypeScript · Vite · Tailwind CSS

## Quick Start

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

No backend required. The app ships with a built-in mock response (see below).

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `"true"` → use bundled mock data; `"false"` → call real backend |
| `VITE_API_BASE` | `http://localhost:8000` | Base URL of the FastAPI backend (Member 4) |

### Switching from mock to live backend

**That's it — one env-var flip:**

```env
VITE_USE_MOCK=false
VITE_API_BASE=http://localhost:8000   # or wherever the backend runs
```

No code changes are needed. The single swap point is `src/api/charter.ts` → `analyzeCharter()`, which already has the real `fetch` branch implemented.

## Mock Data

The bundled mock response lives in:

```
src/api/mockData.ts
```

It matches the team-contract response shape exactly and is returned after a simulated 600 ms delay to make loading states visible during development.

## Type Checking

```bash
npm run typecheck   # runs tsc --noEmit with strict mode
```

## Project Structure

```
frontend/
├── src/
│   ├── types/charter.ts          ← shared request/response types (strict, no `any`)
│   ├── api/charter.ts            ← single API swap point (mock ↔ real)
│   ├── api/mockData.ts           ← hardcoded mock response + 600ms delay helper
│   ├── lib/validation.ts         ← pure client-side form validation
│   └── components/
│       ├── DashboardLayout.tsx   ← owns all UI state (loading/error/empty/success)
│       ├── ScenarioForm.tsx      ← cargo scenario input form
│       ├── StatusBadge.tsx       ← shared risk/volatility badge
│       ├── SkeletonPanel.tsx     ← shared shimmer loading skeleton
│       ├── ForecastPanel.tsx
│       ├── VesselFeasibilityPanel.tsx
│       ├── VoyageCostPanel.tsx
│       ├── ChartTimingPanel.tsx
│       ├── RiskPanel.tsx
│       └── IdleManagementPanel.tsx
└── ...config files
```

## Notes for Other Team Members

- **Do not modify files under `/backend`, `/ml`, `/optimization`, or `/data`** — this frontend is Member 5's scope only.
- The frontend calls `POST /charter/analyze` on `VITE_API_BASE`. Ensure the backend (Member 4) exposes this endpoint with the agreed response shape.
- No Docker is used for this service. Run it with `npm run dev` alongside the backend.
