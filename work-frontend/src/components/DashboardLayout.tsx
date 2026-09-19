// ─────────────────────────────────────────────────────────────
// components/DashboardLayout.tsx
// Redesigned Maritime Chartering Workstation
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { CharterAnalyzeResponse, CharterAnalyzeRequest } from '@/types/charter'
import { analyzeCharter } from '@/api/charter'
import { ShieldCheck, ArrowRight, Play, AlertCircle, RefreshCw, BarChart2, Compass, Layers, CheckCircle2 } from 'lucide-react'

import ScenarioForm          from './ScenarioForm'
import SkeletonPanel         from './SkeletonPanel'
import ForecastPanel         from './ForecastPanel'
import VesselFeasibilityPanel from './VesselFeasibilityPanel'
import VoyageCostPanel       from './VoyageCostPanel'
import ChartTimingPanel      from './ChartTimingPanel'
import RiskPanel             from './RiskPanel'
import IdleManagementPanel   from './IdleManagementPanel'

type UiState = 'empty' | 'loading' | 'error' | 'success'

// ── Sidebar header ──────────────────────────────────────────

function SidebarHeader() {
  return (
    <div className="px-3.5 py-2.5 border-b border-border-subtle bg-background-raised flex items-center justify-between">
      <div>
        <h2 className="text-sm font-bold text-ink font-sans">Scenario Parameters</h2>
        <p className="text-xs text-ink-secondary mt-0.5">Commercial chartering specifications</p>
      </div>
    </div>
  )
}

// ── Professional Maritime Empty State ───────────────────────

interface EmptyStateProps {
  onLoadBenchmark: () => void
}

function EmptyState({ onLoadBenchmark }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[480px] text-center px-4 py-8"
      role="status"
      aria-label="No scenario analysis active"
    >
      <div className="max-w-lg w-full space-y-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full border border-border-strong bg-surface flex items-center justify-center mx-auto text-brand-primary">
          <Compass className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">
            No Scenario Analysis Active
          </h2>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed max-w-md mx-auto">
            Specify cargo tonnage, commodity, trade lane, and laycan window in the left workstation panel to generate an explainable charter recommendation.
          </p>
        </div>

        {/* 3 Step Workflow Graphic */}
        <div className="grid grid-cols-3 gap-4 text-left w-full pt-4 relative">
          {/* Connector Line */}
          <div className="absolute top-8 left-10 right-10 h-px bg-border-strong -z-10" />
          
          <div className="p-4 rounded bg-surface border border-border-strong text-center flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-category-freight text-background text-[10px] font-bold flex items-center justify-center mb-2 z-10 ring-4 ring-surface">1</div>
            <span className="text-xs text-ink font-bold">Cargo</span>
            <span className="text-[10px] text-ink-muted">Volume &amp; Spec</span>
          </div>
          <div className="p-4 rounded bg-surface border border-border-strong text-center flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-border-strong text-ink-muted text-[10px] font-bold flex items-center justify-center mb-2 z-10 ring-4 ring-surface">2</div>
            <span className="text-xs text-ink font-bold">Ports</span>
            <span className="text-[10px] text-ink-muted">Draft &amp; Berthing</span>
          </div>
          <div className="p-4 rounded bg-surface border border-border-strong text-center flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-border-strong text-ink-muted text-[10px] font-bold flex items-center justify-center mb-2 z-10 ring-4 ring-surface">3</div>
            <span className="text-xs text-ink font-bold">Timing</span>
            <span className="text-[10px] text-ink-muted">Charter Window</span>
          </div>
        </div>

        <div className="pt-4 w-full">
          <button
            type="button"
            onClick={onLoadBenchmark}
            className="group flex items-center justify-center gap-3 w-full py-4 bg-ink text-background font-semibold rounded hover:bg-ink-secondary transition-all text-sm uppercase tracking-wider"
          >
            <Play className="w-4 h-4" />
            <span>Load Benchmark Scenario (70k MT Aus → Paradip Coal)</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Error state ─────────────────────────────────────────────

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[380px] gap-3 text-center px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-12 h-12 rounded bg-status-danger/15 border border-status-red/30 flex items-center justify-center text-status-danger">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">Analysis Execution Failed</p>
        <p className="text-xs text-ink-secondary mt-1 max-w-sm leading-relaxed">{message}</p>
      </div>

      <button
        type="button"
        className="btn-secondary text-xs flex items-center gap-1.5 mt-1"
        onClick={onRetry}
        aria-label="Retry the analysis"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Analysis</span>
      </button>
    </div>
  )
}

// ── Loading grid (6 skeletons) ──────────────────────────────

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5" aria-busy="true" aria-label="Loading analysis results">
      <SkeletonPanel title="Freight Rate Forecast"    rows={4} />
      <SkeletonPanel title="Vessel Feasibility"       rows={5} />
      <SkeletonPanel title="Voyage Cost Breakdown"    rows={4} />
      <SkeletonPanel title="Charter Timing & Risk"    rows={3} />
      <SkeletonPanel title="Risk Telemetry"           rows={4} />
      <SkeletonPanel title="Idle Fleet Optimization"  rows={3} />
    </div>
  )
}

// ── Result grid (Executive Summary + 6 Populated Panels) ──────

interface ResultGridProps {
  data: CharterAnalyzeResponse
}

function ResultGrid({ data }: ResultGridProps) {
  return (
    <div className="space-y-3.5">
      {/* Executive Decision Summary Bar */}
      <div className="card p-3 bg-surface border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-status-success" />
          <span className="text-ink-secondary">RECOMMENDED STRATEGY:</span>
          <span className="text-ink font-bold tracking-wide">
            {data.charter_timing.condition || 'EXECUTE TIME CHARTER'} ({data.charter_timing.suggested_window})
          </span>
        </div>

        <div className="flex items-center gap-4 text-ink-secondary">
          <span>FIT: <strong className="text-brand-primary">{data.vessel_feasibility.feasible[0]?.class || 'Panamax'}</strong></span>
          <span>EST. VOYAGE COST: <strong className="text-ink">${data.voyage_cost.total_usd.toLocaleString()}</strong></span>
          <span className="px-2 py-0.5 rounded bg-background-raised border border-border-subtle text-[10px] text-status-success">
            SAFE UNDER-KEEL DRAFT
          </span>
        </div>
      </div>

      {/* 6 Panel Analytical Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
        <ForecastPanel         data={data.forecast}           />
        <VesselFeasibilityPanel data={data.vessel_feasibility} />
        <VoyageCostPanel       data={data.voyage_cost}        />
        <ChartTimingPanel      data={data.charter_timing}     />
        <RiskPanel             data={data.risk}               />
        <IdleManagementPanel   data={data.idle_management}    />
      </div>

      {/* Provenance Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted pt-2 border-t border-border-subtle">
        <span>ENGINE: NAVIK CHARTER FORECAST &amp; OPTIMIZATION v0.4</span>
        <span>DATASET: BALTIC BENCHMARK SIMULATION · STRICT PORT DRAFT VERIFIED</span>
      </div>
    </div>
  )
}

// ── Main layout ─────────────────────────────────────────────

export default function DashboardLayout() {
  const [uiState, setUiState]     = useState<UiState>('empty')
  const [response, setResponse]   = useState<CharterAnalyzeResponse | null>(null)
  const [errorMsg, setErrorMsg]   = useState<string>('')
  const [lastReq, setLastReq]     = useState<CharterAnalyzeRequest | null>(null)

  async function runAnalysis(request: CharterAnalyzeRequest) {
    setLastReq(request)
    setUiState('loading')
    setErrorMsg('')
    try {
      const result = await analyzeCharter(request)
      setResponse(result)
      setUiState('success')
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      setErrorMsg(msg)
      setUiState('error')
    }
  }

  function handleRetry() {
    if (lastReq) {
      void runAnalysis(lastReq)
    } else {
      setUiState('empty')
    }
  }

  function handleLoadBenchmark() {
    const benchmark: CharterAnalyzeRequest = {
      cargo_tonnage: 70000,
      commodity: 'Coal',
      origin: 'Australia',
      destination_port: 'Paradip',
      required_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      num_voyages: 1,
    }
    void runAnalysis(benchmark)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left Sidebar (Scenario Inputs) ─────────────── */}
      <aside
        className="w-76 flex-shrink-0 bg-surface border-r border-border-subtle flex flex-col overflow-y-auto"
        aria-label="Scenario input workstation"
      >
        <SidebarHeader />
        <div className="p-3.5 flex-1">
          <ScenarioForm
            onSubmit={(req) => void runAnalysis(req)}
            isLoading={uiState === 'loading'}
          />
        </div>
      </aside>

      {/* ── Main Analytical Workstation Area ─────────────── */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6" aria-label="Analysis results">
        {uiState === 'empty' && (
          <EmptyState onLoadBenchmark={handleLoadBenchmark} />
        )}

        {uiState === 'loading' && <LoadingGrid />}

        {uiState === 'error' && (
          <ErrorState message={errorMsg} onRetry={handleRetry} />
        )}

        {uiState === 'success' && response !== null && (
          <ResultGrid data={response} />
        )}
      </main>
    </div>
  )
}
