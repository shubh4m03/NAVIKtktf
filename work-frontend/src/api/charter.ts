// ─────────────────────────────────────────────────────────────
// api/charter.ts
// Single swap point between mock and real backend.
//
// VITE_USE_MOCK=true  → calls mockAnalyzeCharter() (no network)
// VITE_USE_MOCK=false → POSTs to ${VITE_API_BASE}/charter/analyze
//
// To go live: set VITE_USE_MOCK=false in .env — no code change needed.
// ─────────────────────────────────────────────────────────────

import type { CharterAnalyzeRequest, CharterAnalyzeResponse } from '@/types/charter'
import { mockAnalyzeCharter } from './mockData'

const USE_MOCK = import.meta.env['VITE_USE_MOCK'] === 'true'
const API_BASE = (import.meta.env['VITE_API_BASE'] as string | undefined) ?? 'http://localhost:8000'

/**
 * Analyze a charter scenario.
 *
 * Mock branch:  delegates to mockAnalyzeCharter() (600 ms simulated delay).
 * Real branch:  POST ${API_BASE}/charter/analyze with JSON body.
 *               Throws an Error with the server's error message if the
 *               response status is not 2xx.
 */
export async function analyzeCharter(
  request: CharterAnalyzeRequest,
): Promise<CharterAnalyzeResponse> {
  if (USE_MOCK) {
    return mockAnalyzeCharter()
  }

  // ── Real fetch branch ──────────────────────────────────────
  const response = await fetch(`${API_BASE}/charter/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    let message = `Server error: ${response.status} ${response.statusText}`
    try {
      const body = (await response.json()) as Record<string, unknown>
      if (typeof body['detail'] === 'string') {
        message = body['detail']
      } else if (typeof body['message'] === 'string') {
        message = body['message']
      }
    } catch {
      // JSON parse failed — use the status-based message above
    }
    throw new Error(message)
  }

  return response.json() as Promise<CharterAnalyzeResponse>
}
