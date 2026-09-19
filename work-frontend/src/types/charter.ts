// ─────────────────────────────────────────────────────────────
// types/charter.ts
// Strict TypeScript types for the charter analysis API.
// No `any` — every field explicitly typed.
// Shape matches the team contract verbatim.
// ─────────────────────────────────────────────────────────────

// ── Enumerations ────────────────────────────────────────────

export type Commodity =
  | 'Coal'
  | 'Iron Ore'
  | 'Grain'
  | 'Bauxite'
  | 'Fertilizer'
  | 'Other'

export type Origin =
  | 'Australia'
  | 'USA'
  | 'Mozambique'
  | 'Indonesia'
  | 'Russia'

export type DestinationPort =
  | 'Paradip'
  | 'Visakhapatnam'
  | 'Gangavaram'
  | 'Gopalpur'
  | 'Dhamra'
  | 'Sagar-Sandheads'
  | 'Haldia'

export type VolatilityLevel = 'low' | 'medium' | 'high'

export type RiskLevel = 'low' | 'medium' | 'high'

// ── Request ──────────────────────────────────────────────────

export interface CharterAnalyzeRequest {
  cargo_tonnage: number
  commodity: Commodity | string   // string allows the "Other" free-text value
  origin: Origin
  destination_port: DestinationPort
  required_date: string           // ISO date string: YYYY-MM-DD
  num_voyages: number
}

// ── Response sub-types ───────────────────────────────────────

export interface ForecastHorizon {
  '7d': number
  '14d': number
  '30d': number
}

export interface Forecast {
  current_rate: number
  horizon: ForecastHorizon
  volatility: VolatilityLevel
}

export interface FeasibleVessel {
  class: string
  notes: string
}

export interface InfeasibleVessel {
  class: string
  reason: string
}

export interface VesselFeasibility {
  feasible: FeasibleVessel[]
  infeasible: InfeasibleVessel[]
}

export interface VoyageCostBreakdown {
  freight: number
  fuel: number
  port: number
  waiting: number
}

export interface VoyageCost {
  total_usd: number
  breakdown: VoyageCostBreakdown
}

export interface CharterTiming {
  condition: string
  suggested_window: string
  reason: string
}

export interface Risk {
  market: number          // 0–1 score
  port_congestion: number // 0–1 score
  overall: RiskLevel
}

export interface IdleManagement {
  expected_idle_days: number
  alternative_employment: string
}

// ── Root Response ────────────────────────────────────────────

export interface CharterAnalyzeResponse {
  forecast: Forecast
  vessel_feasibility: VesselFeasibility
  voyage_cost: VoyageCost
  charter_timing: CharterTiming
  risk: Risk
  idle_management: IdleManagement
}

// ── Form state (internal UI type, not sent to API) ───────────

export interface ScenarioFormValues {
  cargo_tonnage: string   // string while in input; parsed to number on submit
  commodity: Commodity | ''
  commodity_other: string
  origin: Origin | ''
  destination_port: DestinationPort | ''
  required_date: string
  num_voyages: string     // string while in input; parsed to integer on submit
}

export type FormErrors = Partial<Record<keyof ScenarioFormValues, string>>

// ── Constants (shared across form + validation) ──────────────

export const COMMODITY_OPTIONS: Commodity[] = [
  'Coal',
  'Iron Ore',
  'Grain',
  'Bauxite',
  'Fertilizer',
  'Other',
]

export const ORIGIN_OPTIONS: Origin[] = [
  'Australia',
  'USA',
  'Mozambique',
  'Indonesia',
  'Russia',
]

export const DESTINATION_PORT_OPTIONS: DestinationPort[] = [
  'Paradip',
  'Visakhapatnam',
  'Gangavaram',
  'Gopalpur',
  'Dhamra',
  'Sagar-Sandheads',
  'Haldia',
]
