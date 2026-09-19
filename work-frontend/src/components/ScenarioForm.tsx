// ─────────────────────────────────────────────────────────────
// components/ScenarioForm.tsx
// Compact cargo scenario input form.
// - Validates all fields via validation.ts before calling the API
// - Shows inline per-field error messages
// - Submit button shows loading spinner + "Analyzing..." text
// - "Other" commodity reveals a free-text input
// ─────────────────────────────────────────────────────────────

import { useState, useId } from 'react'
import type { ScenarioFormValues, FormErrors, CharterAnalyzeRequest } from '@/types/charter'
import {
  validateForm,
  buildRequest,
  getTodayString,
  COMMODITY_OPTIONS,
  ORIGIN_OPTIONS,
  DESTINATION_PORT_OPTIONS,
} from '@/lib/validation'

interface ScenarioFormProps {
  onSubmit: (request: CharterAnalyzeRequest) => void
  isLoading: boolean
}

const EMPTY_VALUES: ScenarioFormValues = {
  cargo_tonnage:    '',
  commodity:        '',
  commodity_other:  '',
  origin:           '',
  destination_port: '',
  required_date:    '',
  num_voyages:      '',
}

// ── Reusable field wrapper ─────────────────────────────────

interface FieldProps {
  id: string
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function Field({ id, label, error, required = true, children }: FieldProps) {
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-status-danger ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ── Spinner (inline in button) ─────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin w-3.5 h-3.5"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-30"
        cx="8" cy="8" r="6"
        stroke="currentColor" strokeWidth="2"
      />
      <path
        className="opacity-90"
        d="M14 8a6 6 0 0 1-6 6"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────

export default function ScenarioForm({ onSubmit, isLoading }: ScenarioFormProps) {
  const [values, setValues]       = useState<ScenarioFormValues>(EMPTY_VALUES)
  const [errors, setErrors]       = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const uid = useId()
  const id  = (field: string) => `${uid}-${field}`

  function handleChange(field: keyof ScenarioFormValues, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    // Live-validate only after first submit attempt
    if (submitted) {
      setErrors(validateForm(next))
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateForm(values)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSubmit(buildRequest(values))
  }

  const todayStr = getTodayString()
  const hasErrors = submitted && Object.keys(errors).length > 0

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Cargo scenario form"
      className="flex flex-col gap-2"
    >
      {/* ── Cargo tonnage ───────────────────────────────── */}
      <Field id={id('tonnage')} label="Cargo Tonnage (mt)" error={errors.cargo_tonnage}>
        <input
          id={id('tonnage')}
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          placeholder="e.g. 75000"
          value={values.cargo_tonnage}
          onChange={(e) => handleChange('cargo_tonnage', e.target.value)}
          className={`field-input ${errors.cargo_tonnage ? 'field-input-error' : ''}`}
          aria-describedby={errors.cargo_tonnage ? `${id('tonnage')}-error` : undefined}
          aria-invalid={!!errors.cargo_tonnage}
          disabled={isLoading}
        />
      </Field>

      {/* ── Commodity ───────────────────────────────────── */}
      <Field id={id('commodity')} label="Commodity" error={errors.commodity}>
        <select
          id={id('commodity')}
          value={values.commodity}
          onChange={(e) => handleChange('commodity', e.target.value)}
          className={`field-input ${errors.commodity ? 'field-input-error' : ''}`}
          aria-describedby={errors.commodity ? `${id('commodity')}-error` : undefined}
          aria-invalid={!!errors.commodity}
          disabled={isLoading}
        >
          <option value="">Select commodity…</option>
          {COMMODITY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      {/* Other commodity free-text (conditional) */}
      {values.commodity === 'Other' && (
        <Field
          id={id('commodity-other')}
          label="Specify Commodity"
          error={errors.commodity_other}
        >
          <input
            id={id('commodity-other')}
            type="text"
            placeholder="Describe the commodity"
            value={values.commodity_other}
            onChange={(e) => handleChange('commodity_other', e.target.value)}
            className={`field-input ${errors.commodity_other ? 'field-input-error' : ''}`}
            aria-describedby={errors.commodity_other ? `${id('commodity-other')}-error` : undefined}
            aria-invalid={!!errors.commodity_other}
            disabled={isLoading}
          />
        </Field>
      )}

      {/* ── Origin ──────────────────────────────────────── */}
      <Field id={id('origin')} label="Load Port / Origin" error={errors.origin}>
        <select
          id={id('origin')}
          value={values.origin}
          onChange={(e) => handleChange('origin', e.target.value)}
          className={`field-input ${errors.origin ? 'field-input-error' : ''}`}
          aria-describedby={errors.origin ? `${id('origin')}-error` : undefined}
          aria-invalid={!!errors.origin}
          disabled={isLoading}
        >
          <option value="">Select origin…</option>
          {ORIGIN_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>

      {/* ── Destination port ────────────────────────────── */}
      <Field id={id('dest')} label="Discharge Port" error={errors.destination_port}>
        <select
          id={id('dest')}
          value={values.destination_port}
          onChange={(e) => handleChange('destination_port', e.target.value)}
          className={`field-input ${errors.destination_port ? 'field-input-error' : ''}`}
          aria-describedby={errors.destination_port ? `${id('dest')}-error` : undefined}
          aria-invalid={!!errors.destination_port}
          disabled={isLoading}
        >
          <option value="">Select port…</option>
          {DESTINATION_PORT_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>

      {/* ── Required date ───────────────────────────────── */}
      <Field id={id('date')} label="Laycan / Required Date" error={errors.required_date}>
        <input
          id={id('date')}
          type="date"
          min={todayStr}
          value={values.required_date}
          onChange={(e) => handleChange('required_date', e.target.value)}
          className={`field-input ${errors.required_date ? 'field-input-error' : ''}`}
          aria-describedby={errors.required_date ? `${id('date')}-error` : undefined}
          aria-invalid={!!errors.required_date}
          disabled={isLoading}
        />
      </Field>

      {/* ── Number of voyages ───────────────────────────── */}
      <Field id={id('voyages')} label="Number of Voyages" error={errors.num_voyages}>
        <input
          id={id('voyages')}
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          placeholder="e.g. 1"
          value={values.num_voyages}
          onChange={(e) => handleChange('num_voyages', e.target.value)}
          className={`field-input ${errors.num_voyages ? 'field-input-error' : ''}`}
          aria-describedby={errors.num_voyages ? `${id('voyages')}-error` : undefined}
          aria-invalid={!!errors.num_voyages}
          disabled={isLoading}
        />
      </Field>

      {/* ── Validation summary (screen reader) ──────────── */}
      {hasErrors && (
        <p className="sr-only" role="status">
          Form has {Object.keys(errors).length} validation error{Object.keys(errors).length > 1 ? 's' : ''}. Please correct them before submitting.
        </p>
      )}

      {/* ── Submit button ───────────────────────────────── */}
      <button
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded font-bold text-sm text-white bg-category-simulation hover:bg-category-simulation/90 transition-colors"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner />
            Analyzing…
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Analyze Scenario
          </>
        )}
      </button>
    </form>
  )
}
