// ─────────────────────────────────────────────────────────────
// components/RiskPanel.tsx
// Market risk, port congestion risk (0–1 scores with bar gauges),
// and overall risk StatusBadge.
// ─────────────────────────────────────────────────────────────

import type { Risk } from '@/types/charter'
import StatusBadge from './StatusBadge'

interface RiskPanelProps {
  data: Risk
}

interface RiskBarProps {
  label: string
  value: number   // 0–1
  id: string
}

function riskColorClass(value: number): string {
  if (value <= 0.33) return 'bg-status-success'
  if (value <= 0.66) return 'bg-status-warning'
  return 'bg-status-danger'
}

function riskLabel(value: number): string {
  if (value <= 0.33) return 'Low'
  if (value <= 0.66) return 'Medium'
  return 'High'
}

function RiskBar({ label, value, id }: RiskBarProps) {
  const pct = (value * 100).toFixed(0)
  const barColor = riskColorClass(value)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-ink-secondary">{label}</label>
        <div className="flex items-center gap-1.5">
          <span className="num text-xs text-ink">{pct}%</span>
          <span className={`text-2xs font-medium ${value <= 0.33 ? 'text-status-success' : value <= 0.66 ? 'text-status-warning' : 'text-status-danger'}`}>
            {riskLabel(value)}
          </span>
        </div>
      </div>
      <div id={id} className="risk-track" role="progressbar" aria-valuenow={value * 100} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${pct}%`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function RiskPanel({ data }: RiskPanelProps) {
  return (
    <div className="card panel-enter flex flex-col" role="region" aria-label="Risk Assessment">
      <div className="card-header border-b border-border-subtle bg-category-risk/5">
        <svg className="w-3.5 h-3.5 text-category-risk" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="8" y1="6" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
        </svg>
        <span className="card-title text-ink">Risk Assessment</span>
        <div className="ml-auto">
          <StatusBadge level={data.overall} label={`Overall: ${data.overall.charAt(0).toUpperCase()}${data.overall.slice(1)}`} />
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1">
        {/* Risk bars */}
        <RiskBar label="Market Risk"         value={data.market}          id="risk-market" />
        <RiskBar label="Port Congestion"     value={data.port_congestion} id="risk-port" />

        <div className="divider" />

        {/* Overall summary */}
        <div className="rounded bg-surface border border-border-subtle p-2 flex items-center justify-between">
          <span className="text-xs text-ink-secondary font-medium">Overall Risk</span>
          <StatusBadge level={data.overall} size="md" />
        </div>

        {/* Composite score note */}
        <p className="text-xs text-ink-muted leading-relaxed">
          Market score{' '}
          <span className="num font-medium text-ink-secondary">{(data.market * 100).toFixed(0)}%</span>
          {' '}· Port congestion{' '}
          <span className="num font-medium text-ink-secondary">{(data.port_congestion * 100).toFixed(0)}%</span>
          {' '}→ composite{' '}
          <span className="num font-medium text-ink-secondary">
            {(((data.market + data.port_congestion) / 2) * 100).toFixed(0)}%
          </span>
        </p>
      </div>
    </div>
  )
}
