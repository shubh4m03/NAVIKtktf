import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PortfolioPanel from '../PortfolioPanel';
import { PortfolioAllocationResponseDto } from '../../lib/api-client';

const mockAllocation: PortfolioAllocationResponseDto = {
  id: 1,
  cargoRequestId: 101,
  riskAversionLambda: 0.5,
  lambdaLabel: 'Balanced',
  spotPct: 35.0,
  shortTermPct: 35.0,
  mediumTermPct: 30.0,
  totalExpectedCostUsd: 2150000.0,
  portfolioVariance: 9.85,
  objectiveValue: 2150000.0 + 0.5 * 9.85,
  solverUsed: 'scipy.SLSQP',
  allocations: [
    {
      contract_type: 'SPOT',
      weight_pct: 35.0,
      expected_cost_usd: 735000.0,
      variance_contribution: 4.5,
      cost_premium_pct: 0.0,
      data_provenance: { rate: 'MODEL_OUTPUT', basis: 'SIMULATED synthetic scenario' },
    },
    {
      contract_type: 'SHORT_TERM',
      weight_pct: 35.0,
      expected_cost_usd: 757050.0,
      variance_contribution: 3.2,
      cost_premium_pct: 3.0,
      data_provenance: { rate: 'MODEL_OUTPUT', basis: 'SIMULATED synthetic scenario' },
    },
    {
      contract_type: 'MEDIUM_TERM',
      weight_pct: 30.0,
      expected_cost_usd: 657950.0,
      variance_contribution: 2.15,
      cost_premium_pct: 8.0,
      data_provenance: { rate: 'MODEL_OUTPUT', basis: 'SIMULATED synthetic scenario' },
    },
  ],
  assumptions: {
    spot_variance_factor: 1.0,
    short_term_variance_factor: 0.6,
    medium_term_variance_factor: 0.25,
    short_term_cost_premium_pct: 3.0,
    medium_term_cost_premium_pct: 8.0,
    min_weight_pct: 5.0,
    max_spot_weight_pct: 80.0,
  },
  disclaimer:
    'ILLUSTRATIVE MVP: Portfolio weights computed via mean-variance optimisation on SIMULATED forecast distribution. All cost figures apply to the synthetic cargo scenario only. Not a real SAIL contract recommendation.',
  dataProvenance: {
    allocations: 'MODEL_OUTPUT',
    costs: 'MODEL_OUTPUT',
    variance_factors: 'ASSUMPTION',
    premiums: 'ASSUMPTION',
    basis: 'SIMULATED synthetic scenario — not real SAIL contract data',
  },
  createdAt: new Date().toISOString(),
};

describe('PortfolioPanel Component', () => {
  it('renders Stage 7 header, disclaimer and §13 solver badge', () => {
    render(<PortfolioPanel portfolioAllocation={mockAllocation} />);
    expect(screen.getByText(/Stage 7 — Charter Portfolio Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/ILLUSTRATIVE MVP/i)).toBeInTheDocument();
    expect(screen.getByText(/Mean-Variance Optimizer/i)).toBeInTheDocument();
  });

  it('renders all three contract allocation bars with percentages', () => {
    render(<PortfolioPanel portfolioAllocation={mockAllocation} />);
    expect(screen.getByText(/Spot Charter/i)).toBeInTheDocument();
    expect(screen.getByText(/Short-Term \(1-3 mo\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium-Term \(6-12 mo\)/i)).toBeInTheDocument();
    expect(screen.getByText(/100.0%/i)).toBeInTheDocument();
  });

  it('renders lambda slider presets: Conservative, Balanced, Aggressive', () => {
    render(<PortfolioPanel portfolioAllocation={mockAllocation} />);
    expect(screen.getByText('Conservative')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Aggressive')).toBeInTheDocument();
  });

  it('triggers onLambdaChange when preset button is clicked', () => {
    const handleLambdaChange = vi.fn();
    render(
      <PortfolioPanel
        portfolioAllocation={mockAllocation}
        onLambdaChange={handleLambdaChange}
      />
    );
    fireEvent.click(screen.getByText('Conservative'));
    expect(handleLambdaChange).toHaveBeenCalledWith(1.0);

    fireEvent.click(screen.getByText('Aggressive'));
    expect(handleLambdaChange).toHaveBeenCalledWith(0.1);
  });
});
