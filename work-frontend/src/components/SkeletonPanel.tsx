// ─────────────────────────────────────────────────────────────
// components/SkeletonPanel.tsx
// Shimmer skeleton — reused across all six panel positions
// during the loading state. Matches the approximate visual
// footprint of each panel so layout doesn't shift on load.
// ─────────────────────────────────────────────────────────────

interface SkeletonPanelProps {
  /** Number of shimmer rows to render (default 4). */
  rows?: number
  /** Optional title to show above the skeleton (matches panel header). */
  title?: string
}

function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={`skeleton rounded ${width} ${height}`} />
}

export default function SkeletonPanel({ rows = 4, title }: SkeletonPanelProps) {
  return (
    <div className="card p-0 overflow-hidden" aria-busy="true" aria-label={title ? `Loading ${title}` : 'Loading panel'}>
      {/* Header */}
      <div className="card-header">
        <div className="skeleton h-3 w-24 rounded" />
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2">
        {/* Hero value placeholder */}
        <SkeletonLine width="w-2/5" height="h-6" />

        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}
            height="h-3"
          />
        ))}
      </div>
    </div>
  )
}
