// ─────────────────────────────────────────────────────────────
// lib/validation.ts
// Pure client-side form validation — no side effects, easily testable.
// Returns a Record of field-name → error message.
// Empty record means the form is valid.
// ─────────────────────────────────────────────────────────────

import type { ScenarioFormValues, FormErrors, CharterAnalyzeRequest, Origin, DestinationPort } from '@/types/charter'
import { ORIGIN_OPTIONS, DESTINATION_PORT_OPTIONS, COMMODITY_OPTIONS } from '@/types/charter'

/**
 * Validate all scenario form fields.
 * Returns an object mapping each invalid field to its error string.
 * An empty object signals "all valid".
 */
export function validateForm(values: ScenarioFormValues): FormErrors {
  const errors: FormErrors = {}

  // ── cargo_tonnage ────────────────────────────────────────
  const tonnage = parseFloat(values.cargo_tonnage)
  if (values.cargo_tonnage.trim() === '') {
    errors.cargo_tonnage = 'Cargo tonnage is required.'
  } else if (isNaN(tonnage) || tonnage <= 0) {
    errors.cargo_tonnage = 'Cargo tonnage must be a number greater than 0.'
  }

  // ── commodity ────────────────────────────────────────────
  if (!values.commodity) {
    errors.commodity = 'Commodity is required.'
  }

  // If "Other" is selected, the free-text field must be filled
  if (values.commodity === 'Other') {
    if (values.commodity_other.trim() === '') {
      errors.commodity_other = 'Please specify the commodity.'
    }
  }

  // ── origin ───────────────────────────────────────────────
  if (!values.origin) {
    errors.origin = 'Origin is required.'
  } else if (!(ORIGIN_OPTIONS as string[]).includes(values.origin)) {
    errors.origin = 'Please select a valid origin.'
  }

  // ── destination_port ─────────────────────────────────────
  if (!values.destination_port) {
    errors.destination_port = 'Destination port is required.'
  } else if (!(DESTINATION_PORT_OPTIONS as string[]).includes(values.destination_port)) {
    errors.destination_port = 'Please select a valid destination port.'
  }

  // ── required_date ────────────────────────────────────────
  if (!values.required_date) {
    errors.required_date = 'Required date is required.'
  } else {
    const selectedDate = new Date(values.required_date)
    const today = new Date()
    // Compare date-only (no time component) so "today" is always invalid
    today.setHours(0, 0, 0, 0)
    if (isNaN(selectedDate.getTime())) {
      errors.required_date = 'Please enter a valid date.'
    } else if (selectedDate <= today) {
      errors.required_date = 'Required date must be strictly after today.'
    }
  }

  // ── num_voyages ──────────────────────────────────────────
  const voyages = Number(values.num_voyages)
  if (values.num_voyages.trim() === '') {
    errors.num_voyages = 'Number of voyages is required.'
  } else if (!Number.isInteger(voyages) || voyages < 1) {
    errors.num_voyages = 'Number of voyages must be a whole number ≥ 1.'
  }

  return errors
}

/**
 * Returns true only if validateForm() returns an empty object.
 */
export function isFormValid(values: ScenarioFormValues): boolean {
  return Object.keys(validateForm(values)).length === 0
}

/**
 * Build a CharterAnalyzeRequest from validated form values.
 * MUST only be called after validateForm() returns an empty error object.
 * The non-null assertions below are safe because validation guarantees
 * these fields are non-empty and in the allowed sets.
 */
export function buildRequest(values: ScenarioFormValues): CharterAnalyzeRequest {
  const commodity =
    values.commodity === 'Other'
      ? values.commodity_other.trim()
      : (values.commodity as string)

  return {
    cargo_tonnage:    parseFloat(values.cargo_tonnage),
    // origin and destination_port are guaranteed non-empty by validation
    commodity,
    origin:           values.origin as Origin,
    destination_port: values.destination_port as DestinationPort,
    required_date:    values.required_date,
    num_voyages:      parseInt(values.num_voyages, 10),
  }
}

/**
 * Helper: returns today's date as YYYY-MM-DD string for the min attribute
 * on the date input (today itself is excluded per validation rules).
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

// Re-export constants so form components don't import from types directly
export { COMMODITY_OPTIONS, ORIGIN_OPTIONS, DESTINATION_PORT_OPTIONS }
