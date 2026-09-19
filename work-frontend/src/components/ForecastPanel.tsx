// ─────────────────────────────────────────────────────────────
// components/ForecastPanel.tsx
// Displays freight rate forecast: current rate, 7d/14d/30d
// horizon, and volatility badge.
// ─────────────────────────────────────────────────────────────

import type { Forecast } from '@/types/charter'
import StatusBadge from './StatusBadge'

interface ForecastPanelProps {
  data: Forecast
}

interface HorizonRowProps {
  label: string
  value: number
  unit: string
}

function HorizonRow({ label, value, unit }: HorizonRowProps) {
  return (
    <div className="hover-row flex items-center justify-between">
      <span className="text-xs text-ink-secondary font-medium">{label}</span>
      <span className="num text-sm text-ink">
        {value.toFixed(1)}
        <span className="text-xs text-ink-muted ml-1">{unit}</span>
      </span>
    </div>
  )
}

export default function ForecastPanel({ data }: ForecastPanelProps) {
  return (
    <div className="card panel-enter flex flex-col" role="region" aria-label="Freight Rate Forecast">
      <div className="card-header border-b border-border-subtle bg-category-freight/5">
        <svg className="w-3.5 h-3.5 text-category-freight" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <polyline points="1,12 5,7 8,10 11,5 15,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="card-title">Freight Rate Forecast</span>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Current rate — hero value */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xs text-ink-muted uppercase tracking-wide mb-0.5">Current Rate</p>
            <p className="num-hero">
              {data.current_rate.toFixed(1)}
              <span className="text-sm font-normal text-ink-secondary ml-1">$/t</span>
            </p>
          </div>
          <StatusBadge
            level={data.volatility}
            label={`${data.volatility.charAt(0).toUpperCase()}${data.volatility.slice(1)} volatility`}
          />
        </div>

        <div className="divider" />

        {/* Horizon table */}
        <p className="text-2xs text-ink-muted uppercase tracking-wide">Rate Horizon ($/t)</p>
        <div className="flex flex-col gap-0.5">
          <HorizonRow label="7-day"  value={data.horizon['7d']}  unit="$/t" />
          <HorizonRow label="14-day" value={data.horizon['14d']} unit="$/t" />
          <HorizonRow label="30-day" value={data.horizon['30d']} unit="$/t" />
        </div>

        {/* Trend indicator */}
        <div className="mt-auto pt-2 border-t border-border-subtle">
          <p className="text-xs text-category-freight font-medium">
            <span className="font-bold">↑</span>{' '}
            30-day rate {((data.horizon['30d'] - data.current_rate) / data.current_rate * 100).toFixed(1)}% above current
          </p>
        </div>
      </div>
    </div>
  )
}
