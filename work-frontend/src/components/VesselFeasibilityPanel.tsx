// ─────────────────────────────────────────────────────────────
// components/VesselFeasibilityPanel.tsx
// Shows feasible vessels (green) and infeasible vessels (red)
// with hover states on each row.
// ─────────────────────────────────────────────────────────────

import type { VesselFeasibility } from '@/types/charter'

interface VesselFeasibilityPanelProps {
  data: VesselFeasibility
}

export default function VesselFeasibilityPanel({ data }: VesselFeasibilityPanelProps) {
  const feasibleCount   = data.feasible.length
  const infeasibleCount = data.infeasible.length

  return (
    <div className="card panel-enter flex flex-col" role="region" aria-label="Vessel Feasibility">
      <div className="card-header">
        <svg className="w-3.5 h-3.5 text-ink-secondary" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="8" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1 8 L3 5 L13 5 L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="8" y1="5" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="2" x2="11" y2="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="card-title">Vessel Feasibility</span>
        <span className="ml-auto text-2xs text-ink-muted">
          {feasibleCount} feasible · {infeasibleCount} infeasible
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Feasible */}
        {feasibleCount > 0 && (
          <div>
            <p className="text-2xs text-ink-muted uppercase tracking-wide mb-1">
              Feasible ({feasibleCount})
            </p>
            <ul className="flex flex-col gap-0.5" aria-label="Feasible vessel classes">
              {data.feasible.map((vessel) => (
                <li
                  key={vessel.class}
                  className="hover-row flex items-start gap-2"
                >
                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-sm bg-status-success-bg border border-status-success flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-status-success" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <polyline points="2,5 4,7 8,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-ink">{vessel.class}</span>
                    <p className="text-xs text-ink-secondary mt-0.5 leading-snug">{vessel.notes}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {feasibleCount > 0 && infeasibleCount > 0 && <div className="divider" />}

        {/* Infeasible */}
        {infeasibleCount > 0 && (
          <div>
            <p className="text-2xs text-ink-muted uppercase tracking-wide mb-1">
              Infeasible ({infeasibleCount})
            </p>
            <ul className="flex flex-col gap-0.5" aria-label="Infeasible vessel classes">
              {data.infeasible.map((vessel) => (
                <li
                  key={vessel.class}
                  className="hover-row flex items-start gap-2 opacity-60"
                >
                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-sm bg-surface border border-border-strong flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-ink-muted" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-ink-muted line-through">{vessel.class}</span>
                    <span className="text-xs font-bold text-ink-muted ml-2 uppercase tracking-wide">ELIMINATED</span>
                    <p className="text-xs text-ink-secondary mt-0.5 leading-snug">{vessel.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
