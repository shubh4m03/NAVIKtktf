// ─────────────────────────────────────────────────────────────
// components/ChartTimingPanel.tsx
// Displays chartering timing recommendation:
// condition, suggested_window, and detailed reason.
// ─────────────────────────────────────────────────────────────

import type { CharterTiming } from '@/types/charter'

interface ChartTimingPanelProps {
  data: CharterTiming
}

export default function ChartTimingPanel({ data }: ChartTimingPanelProps) {
  return (
    <div className="card panel-enter flex flex-col" role="region" aria-label="Charter Timing Recommendation">
      <div className="card-header border-b border-category-recommend/30 bg-category-recommend/10">
        <svg className="w-3.5 h-3.5 text-category-recommend" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <polyline points="8,4 8,8 10.5,10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="card-title text-category-recommend">Charter Timing</span>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Suggested window — hero */}
        <div className="rounded bg-category-recommend/10 border border-category-recommend/40 px-3 py-2 shadow-[0_0_8px_rgba(212,162,76,0.2)]">
          <p className="text-2xs text-category-recommend font-semibold uppercase tracking-wide mb-0.5">
            Suggested Window
          </p>
          <p className="text-lg font-bold text-ink leading-tight">
            {data.suggested_window}
          </p>
        </div>

        {/* Market condition */}
        <div>
          <p className="text-2xs text-ink-muted uppercase tracking-wide mb-0.5">Market Condition</p>
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 flex-shrink-0 text-status-success">
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <polyline points="2,7 5.5,10.5 12,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="text-sm text-ink font-medium">{data.condition}</p>
          </div>
        </div>

        <div className="divider" />

        {/* Reason / rationale */}
        <div className="flex-1">
          <p className="text-2xs text-ink-muted uppercase tracking-wide mb-1">Rationale</p>
          <p className="text-xs text-ink-secondary leading-relaxed">{data.reason}</p>
        </div>
      </div>
    </div>
  )
}
