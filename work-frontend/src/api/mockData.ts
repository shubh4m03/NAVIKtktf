// ─────────────────────────────────────────────────────────────
// api/mockData.ts
// Hardcoded mock response matching the team contract shape exactly.
// Used when VITE_USE_MOCK=true (no backend required).
// ─────────────────────────────────────────────────────────────

import type { CharterAnalyzeResponse } from '@/types/charter'

/**
 * One canonical mock response.
 * All field names, nesting, and value types match the team contract verbatim.
 */
export const MOCK_RESPONSE: CharterAnalyzeResponse = {
  forecast: {
    current_rate: 14.2,
    horizon: {
      '7d':  14.6,
      '14d': 15.1,
      '30d': 15.9,
    },
    volatility: 'medium',
  },

  vessel_feasibility: {
    feasible: [
      { class: 'Panamax',    notes: 'Meets all port limits' },
      { class: 'Supramax',   notes: 'Within draft and beam constraints' },
      { class: 'Handymax',   notes: 'Suitable; lower economies of scale' },
    ],
    infeasible: [
      { class: 'Capesize',   reason: 'Exceeds max draft (18.2 m > 17.0 m limit at Paradip)' },
      { class: 'VLOC',       reason: 'LOA exceeds berth capacity (330 m > 290 m)' },
    ],
  },

  voyage_cost: {
    total_usd: 742_000,
    breakdown: {
      freight: 710_000,
      fuel:     18_000,
      port:      9_000,
      waiting:   5_000,
    },
  },

  charter_timing: {
    condition:        'Rates below 60-day median',
    suggested_window: 'Next 7–10 days',
    reason:
      'Baltic Panamax Index is tracking 4.2 % below its 60-day rolling average. ' +
      'Seasonal demand from the Atlantic basin is expected to tighten supply from ' +
      'mid-October onward — chartering inside the next 10-day window captures the ' +
      'current dip before the seasonal upswing.',
  },

  risk: {
    market:          0.4,
    port_congestion: 0.6,
    overall:         'medium',
  },

  idle_management: {
    expected_idle_days:      2.5,
    alternative_employment:  'Backhaul option on Indonesia–India route (thermal coal, est. $8 k/day TCE)',
  },
}

/**
 * Simulates a network round-trip so loading skeletons are visible during dev.
 * Resolves after 600 ms — the minimum perceptible delay for testing UX states.
 */
export function mockAnalyzeCharter(): Promise<CharterAnalyzeResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_RESPONSE), 600)
  })
}
