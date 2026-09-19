// ─────────────────────────────────────────────────────────────
// components/VoyageCostPanel.tsx
// Total voyage cost (USD) with breakdown bar and table.
// All numeric values use tabular-nums via .num/.num-hero classes.
// ─────────────────────────────────────────────────────────────

import type { VoyageCost, VoyageCostBreakdown } from '@/types/charter'

interface VoyageCostPanelProps {
  data: VoyageCost
}

interface BreakdownItem {
  key: keyof VoyageCostBreakdown
  label: string
  colorClass: string
  barClass: string
}

const BREAKDOWN_ITEMS: BreakdownItem[] = [
  { key: 'freight', label: 'Freight',    colorClass: 'text-brand-primary',           barClass: 'bg-brand-primary' },
  { key: 'fuel',    label: 'Fuel',       colorClass: 'text-status-warning',       barClass: 'bg-status-warning' },
  { key: 'port',    label: 'Port',       colorClass: 'text-ink-secondary',      barClass: 'bg-ink-tertiary' },
  { key: 'waiting', label: 'Waiting',    colorClass: 'text-status-danger',         barClass: 'bg-status-danger' },
]

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}k`
  return `$${value.toLocaleString()}`
}

export default function VoyageCostPanel({ data }: VoyageCostPanelProps) {
  const { total_usd, breakdown } = data

  return (
    <div className="card panel-enter flex flex-col" role="region" aria-label="Voyage Cost">
      <div className="card-header">
        <svg className="w-3.5 h-3.5 text-ink-secondary" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.5v1M8 10.5v1M5.5 7a1.5 1.5 0 0 1 2.5-1.118M10.5 9A1.5 1.5 0 0 1 8 10.118" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span className="card-title">Voyage Cost</span>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Hero total */}
        <div>
          <p className="text-2xs text-ink-muted uppercase tracking-wide mb-0.5">Total Cost</p>
          <p className="num-hero animate-countUp">
            {formatUsd(total_usd)}
            <span className="text-sm font-normal text-ink-secondary ml-1">USD</span>
          </p>
        </div>

        <div className="divider" />

        {/* Stacked bar */}
        <div>
          <p className="text-2xs text-ink-muted uppercase tracking-wide mb-1">Cost Breakdown</p>
          <div className="flex h-2 rounded overflow-hidden gap-px mb-2" role="img" aria-label="Cost breakdown bar">
            {BREAKDOWN_ITEMS.map(({ key, barClass }) => {
              const pct = (breakdown[key] / total_usd) * 100
              return (
                <div
                  key={key}
                  className={`${barClass} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${key}: ${pct.toFixed(1)}%`}
                />
              )
            })}
          </div>
        </div>

        {/* Breakdown table */}
        <div className="flex flex-col gap-0.5">
          {BREAKDOWN_ITEMS.map(({ key, label, colorClass }) => {
            const value = breakdown[key]
            const pct   = ((value / total_usd) * 100).toFixed(1)
            return (
              <div key={key} className="hover-row flex items-center justify-between">
                <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xs text-ink-muted">{pct}%</span>
                  <span className="num text-sm text-ink">{formatUsd(value)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
