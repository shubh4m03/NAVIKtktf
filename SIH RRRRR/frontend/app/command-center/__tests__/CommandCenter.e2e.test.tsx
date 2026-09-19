import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CommandCenterPage from '../page';
import * as apiClient from '../../lib/api-client';

describe('CommandCenter End-to-End Pipeline & Demo Rehearsal (§34, §41, Task 17)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits a realistic cargo request, runs full multi-stage pipeline, and renders recommendation with provenance badges', async () => {
    render(<CommandCenterPage />);

    // 1. Initial State assertions
    expect(screen.getByText(/SAIL Maritime Freight Command Center/i)).toBeInTheDocument();
    expect(screen.getByTestId('cargo-input-form')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-results')).not.toBeInTheDocument();

    // 2. Realistic cargo input: 75,000 MT coking coal to Paradip
    const tonnageInput = screen.getByTestId('input-tonnage');
    fireEvent.change(tonnageInput, { target: { value: '75000' } });

    const portSelect = screen.getByTestId('select-port');
    fireEvent.change(portSelect, { target: { value: '1' } }); // Paradip

    const submitBtn = screen.getByTestId('btn-submit-cargo');
    expect(submitBtn).toBeInTheDocument();

    // 3. Submit Cargo Request
    fireEvent.click(submitBtn);

    // 4. Await pipeline resolution
    await waitFor(() => {
      expect(screen.getByTestId('pipeline-results')).toBeInTheDocument();
    });

    // 5. Verify Stage 1: Feasibility Table renders eliminated Capesize with draft explanation
    expect(screen.getByText(/1. Physical Feasibility & Scoring/i)).toBeInTheDocument();
    expect(screen.getAllByText('Panamax').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Capesize')).toBeInTheDocument();
    expect(screen.getByText(/Vessel draft 18.0m exceeds port max draft 14.5m/i)).toBeInTheDocument();

    // 6. Verify Stage 2: Distributional Forecast Panel
    expect(screen.getByText(/2. Distributional Freight Forecast/i)).toBeInTheDocument();
    expect(screen.getByText(/\$27.50/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantile Median/i)).toBeInTheDocument();

    // 7. Verify Stage 3: Risk Panel
    expect(screen.getByText(/3. Comprehensive Risk Score & Top Drivers/i)).toBeInTheDocument();
    expect(screen.getByText(/42.5/i)).toBeInTheDocument();
    expect(screen.getByText(/Port Congestion & Turnaround Delay/i)).toBeInTheDocument();

    // 8. Verify Stage 4: Scenario Controls
    expect(screen.getByText(/4. Interactive What-If Scenario Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/Execute What-If Perturbation/i)).toBeInTheDocument();

    // 9. Verify Stage 5: Recommendation Card Hero Action & Split Allocation
    const recCard = screen.getByTestId('recommendation-card');
    expect(recCard).toBeInTheDocument();

    const actionBadge = screen.getByTestId('recommendation-action');
    expect(actionBadge.textContent).toContain('SPLIT');

    const splitPct = screen.getByTestId('recommendation-split-pct');
    expect(splitPct.textContent).toContain('45%');

    // 10. Verify §21 Explainability Layer (Narrative & Driver-by-Driver Breakdown)
    expect(screen.getByTestId('explainability-section')).toBeInTheDocument();
    expect(screen.getByTestId('rationale-narrative')).toBeInTheDocument();
    const drivers = screen.getAllByTestId('rationale-driver-item');
    expect(drivers.length).toBeGreaterThanOrEqual(3);

    // 11. Verify Hard Requirement: ProvenanceBadges are present across all components
    const badges = screen.getAllByTestId('provenance-badge');
    expect(badges.length).toBeGreaterThanOrEqual(10);

    const provenancesPresent = new Set(
      badges.map((b) => b.getAttribute('data-provenance')).filter(Boolean)
    );

    expect(provenancesPresent.has('REAL_VERIFIED')).toBe(true);
    expect(provenancesPresent.has('PUBLIC_PROXY')).toBe(true);
    expect(provenancesPresent.has('SIMULATED')).toBe(true);
    expect(provenancesPresent.has('ASSUMPTION')).toBe(true);
    expect(provenancesPresent.has('MODEL_OUTPUT')).toBe(true);
  });

  it('triggers a +15% freight shock scenario and confirms recommendation visibly updates in real time', async () => {
    render(<CommandCenterPage />);

    // Submit base request
    fireEvent.click(screen.getByTestId('btn-submit-cargo'));
    await waitFor(() => {
      expect(screen.getByTestId('pipeline-results')).toBeInTheDocument();
    });

    // Baseline recommendation was SPLIT 45%
    expect(screen.getByTestId('recommendation-action').textContent).toContain('SPLIT');
    expect(screen.getByTestId('recommendation-split-pct').textContent).toContain('45%');

    // Click +15% Freight Spike preset button (§41 live demo script)
    const preset15Btn = screen.getByTestId('preset-freight-15');
    fireEvent.click(preset15Btn);

    // Execute perturbation
    const executeSimBtn = screen.getByText(/Execute What-If Perturbation/i);
    fireEvent.click(executeSimBtn);

    // Verify in-place update without page reload
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-split-pct').textContent).toContain('70%');
    });

    expect(screen.getByTestId('recommendation-action').textContent).toContain('SPLIT');
    expect(screen.getAllByText(/STRESSED SCENARIO/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Freight shocked \+15%: increasing immediate commitment to 70%/i)).toBeInTheDocument();
  });

  it('handles simulated FastAPI outage by displaying degraded-mode fallback banner with cached forecast', async () => {
    // Simulate backend returning degraded: true
    const degradedMock = {
      id: 999,
      tonnage: 75000,
      originRegion: 'AUSTRALIA_GLADSTONE',
      destinationPortId: 1,
      destinationPortName: 'Paradip',
      deadline: '2026-10-30',
      contractPreference: 'spot',
      status: 'DEGRADED',
      degraded: true,
      forecast: {
        expectedValueUsdPerTon: 27.5,
        interval50Low: 25.0,
        interval50High: 30.0,
        interval90Low: 23.0,
        interval90High: 33.0,
        probIncreasePct: 40.0,
        confidenceScore: 65.0,
        modelUsed: 'cached_baseline_sarimax [DEGRADED]',
        dataProvenance: { freight_index: 'PUBLIC_PROXY' },
      },
      vesselRankings: [
        {
          vesselClassId: 1,
          vesselClassName: 'Panamax',
          score: 80.0,
          rank: 1,
          feasible: true,
          estimatedLandedCost: 1400000.0,
          expectedDelayDays: 3.0,
        },
      ],
      risk: {
        riskScore: 38.0,
        category: 'MEDIUM',
        mitigationSuggestion: 'Degraded mode: secure 50% now under conservative policy.',
        topDrivers: [],
      },
      recommendation: {
        action: 'SPLIT',
        splitPct: 50.0,
        rationaleJson: JSON.stringify({
          action: 'SPLIT',
          split_pct: 50,
          degraded: true,
          narrative: 'ML service unavailable. Recommendation derived from cached baseline under degraded mode.',
        }),
      },
    };

    vi.spyOn(apiClient, 'createCargoRequest').mockResolvedValue(degradedMock as any);

    render(<CommandCenterPage />);

    fireEvent.click(screen.getByTestId('btn-submit-cargo'));

    await waitFor(() => {
      expect(screen.getByTestId('pipeline-results')).toBeInTheDocument();
    });

    // Assert degraded banner renders visibly (§18, §41)
    expect(screen.getByText(/Degraded Pipeline Operating Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/FastAPI ML service was unreachable/i)).toBeInTheDocument();
    expect(screen.getByText(/STATUS: DEGRADED/i)).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-split-pct').textContent).toContain('50%');
  });
});
