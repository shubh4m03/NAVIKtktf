'use client';

import React, { useState } from 'react';
import ProvenanceBadge from './ProvenanceBadge';
import { PortfolioAllocationResponseDto } from '../lib/api-client';
import { formatUSD } from '../lib/formatCurrency';


interface PortfolioPanelProps {
  portfolioAllocation: PortfolioAllocationResponseDto;
  onLambdaChange?: (lambda: number) => void;
  isRecomputing?: boolean;
}

const LAMBDA_PRESETS: { label: string; value: number; color: string; description: string }[] = [
  {
    label: 'Conservative',
    value: 1.0,
    color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
    description: 'Maximise long-term price lock-in, minimise cost variance',
  },
  {
    label: 'Balanced',
    value: 0.5,
    color: 'text-sky-400 border-sky-500/50 bg-sky-950/40',
    description: 'Equal weight on expected cost and variance reduction',
  },
  {
    label: 'Aggressive',
    value: 0.1,
    color: 'text-amber-400 border-amber-500/50 bg-amber-950/40',
    description: 'Prioritise lowest expected cost, accept higher variance',
  },
];

function AllocationBar({
  label,
  pct,
  color,
  premiumPct,
}: {
  label: string;
  pct: number;
  color: string;
  premiumPct?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-mono font-semibold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          {premiumPct !== undefined && premiumPct > 0 && (
            <span className="text-amber-400/70 text-xs">+{premiumPct}% premium</span>
          )}
          <span className={`font-mono font-bold text-sm ${color}`}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color.replace('text-', 'bg-').split(' ')[0]}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function PortfolioPanel({
  portfolioAllocation,
  onLambdaChange,
  isRecomputing = false,
}: PortfolioPanelProps) {
  const [selectedLambda, setSelectedLambda] = useState<number>(
    portfolioAllocation.riskAversionLambda ?? 0.5
  );

  const handleLambdaSelect = (value: number) => {
    setSelectedLambda(value);
    if (onLambdaChange) {
      onLambdaChange(value);
    }
  };

  const pa = portfolioAllocation;

  // Extract per-type premiums from allocations array if available
  const shortPremium = pa.allocations?.find((a: any) => a.contract_type === 'SHORT_TERM')?.cost_premium_pct ?? 3.0;
  const mediumPremium = pa.allocations?.find((a: any) => a.contract_type === 'MEDIUM_TERM')?.cost_premium_pct ?? 8.0;

  return (
    <div className="p-5 bg-slate-900 border border-violet-800/50 rounded-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-violet-400 text-lg">📊</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-violet-300">
              Stage 7 — Charter Portfolio Strategy
            </h3>
            <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-violet-950 text-violet-400 border border-violet-500/30">
              Mean-Variance Optimizer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Mean-variance optimisation: minimise E[Cost] + λ·Var(Cost) across Spot / Short-Term / Medium-Term contracts
          </p>
        </div>
        <ProvenanceBadge
          provenance="MODEL_OUTPUT"
          label="MV OPTIMIZER"
          source={pa.solverUsed || 'scipy.SLSQP'}
        />
      </div>

      {/* §38-compliant disclaimer banner */}
      <div className="p-3 rounded-lg bg-violet-950/50 border border-violet-500/30 text-violet-300 text-xs font-mono flex items-start gap-2">
        <span className="text-violet-400 mt-0.5 shrink-0">⚠</span>
        <span>{pa.disclaimer}</span>
      </div>

      {/* Risk-Aversion Lambda Slider (§13) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Risk Aversion (λ) — UI Slider
          </span>
          <span className="text-xs font-mono text-slate-500">
            λ = {selectedLambda.toFixed(1)}
            {onLambdaChange && (
              <span className="text-violet-400 ml-1">
                {isRecomputing ? ' (recomputing…)' : ' (click to recompute)'}
              </span>
            )}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LAMBDA_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => handleLambdaSelect(preset.value)}
              disabled={isRecomputing}
              className={`
                p-2 rounded-lg border text-xs font-mono font-semibold text-center transition-all
                ${selectedLambda === preset.value
                  ? preset.color + ' ring-1 ring-current'
                  : 'text-slate-500 border-slate-700 bg-slate-800/60 hover:border-slate-600 hover:text-slate-400'}
                ${isRecomputing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="font-bold">{preset.label}</div>
              <div className="text-xs opacity-70 mt-0.5 normal-case font-normal">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active allocation (current result) */}
      <div className="space-y-3 p-4 bg-slate-800/60 rounded-lg border border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Optimal Allocation — {pa.lambdaLabel || 'Balanced'} (λ={pa.riskAversionLambda?.toFixed(1)})
          </span>
          <ProvenanceBadge provenance="MODEL_OUTPUT" label="MV-OPT" />
        </div>

        <AllocationBar
          label="Spot Charter"
          pct={pa.spotPct}
          color="text-amber-400"
          premiumPct={0}
        />
        <AllocationBar
          label="Short-Term (1-3 mo)"
          pct={pa.shortTermPct}
          color="text-sky-400"
          premiumPct={shortPremium}
        />
        <AllocationBar
          label="Medium-Term (6-12 mo)"
          pct={pa.mediumTermPct}
          color="text-emerald-400"
          premiumPct={mediumPremium}
        />

        {/* Total sum check */}
        <div className="flex justify-between items-center text-xs font-mono border-t border-slate-700/50 pt-2 mt-1">
          <span className="text-slate-400">Total Allocation</span>
          <span className="font-bold text-white">
            {(pa.spotPct + pa.shortTermPct + pa.mediumTermPct).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Expected Cost</div>
          <div className="text-lg font-mono font-bold text-white">{formatUSD(pa.totalExpectedCostUsd)}</div>
          <div className="flex items-center gap-1">
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="MODEL" />
            <span className="text-xs text-slate-500">SIMULATED</span>
          </div>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Portfolio Variance</div>
          <div className="text-lg font-mono font-bold text-violet-300">
            {pa.portfolioVariance?.toFixed(2) ?? '—'}
          </div>
          <div className="flex items-center gap-1">
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="MODEL" />
            <span className="text-xs text-slate-500">cost² units</span>
          </div>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Solver</div>
          <div className="text-sm font-mono font-bold text-sky-300 break-all">{pa.solverUsed ?? '—'}</div>
          <div className="flex items-center gap-1">
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="MODEL" />
          </div>
        </div>
      </div>

      {/* Assumptions disclosure */}
      {pa.assumptions && Object.keys(pa.assumptions).length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-mono text-slate-500 hover:text-slate-400 flex items-center gap-1 select-none">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Model Assumptions
          </summary>
          <div className="mt-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 text-xs font-mono text-slate-400 space-y-1">
            {Object.entries(pa.assumptions).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-300">{String(v)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
