import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import RecommendationCard from '../RecommendationCard';

describe('RecommendationCard & Explainability Layer (§21 / Task 15)', () => {
  const mockRecommendation = {
    action: 'SPLIT',
    splitPct: 45,
    rationaleJson: JSON.stringify({
      action: 'SPLIT',
      split_pct: 45,
      confidence_score: 78,
      drivers: [
        {
          factor: 'expected_freight_change',
          value: '+8% to +11%',
          direction: 'unfavorable_to_wait',
        },
        {
          factor: 'vessel_availability_proxy',
          value: 'tightening',
          direction: 'unfavorable_to_wait',
        },
        {
          factor: 'congestion_trend',
          value: 'decreasing',
          direction: 'favorable_to_wait',
        },
        {
          factor: 'prob_increase_gt_8pct',
          value: 0.67,
          direction: 'unfavorable_to_wait',
        },
      ],
      narrative:
        'Freight is expected to rise 8-11% with 67% probability of exceeding an 8% increase; vessel availability is tightening. Waiting fully is not favorable, but full commitment now forgoes optionality given moderate confidence (score 78/100). Securing 45% now balances expected cost against downside risk.',
    }),
  };

  it('renders executive decision rationale narrative matching §21', () => {
    render(<RecommendationCard recommendation={mockRecommendation} deadline="2026-10-15" />);

    expect(screen.getByTestId('explainability-section')).toBeInTheDocument();
    const narrativeEl = screen.getByTestId('rationale-narrative');
    expect(narrativeEl).toBeInTheDocument();
    expect(narrativeEl.textContent).toContain('Freight is expected to rise 8-11% with 67% probability');
    expect(narrativeEl.textContent).toContain('Securing 45% now balances expected cost against downside risk.');
  });

  it('renders driver-by-driver cards with visually distinguished directions', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);

    const driverItems = screen.getAllByTestId('rationale-driver-item');
    expect(driverItems.length).toBe(4);

    // Verify drivers are rendered
    expect(screen.getByText('Expected Freight Change')).toBeInTheDocument();
    expect(screen.getByText('+8% to +11%')).toBeInTheDocument();

    expect(screen.getByText('Vessel Availability Proxy')).toBeInTheDocument();
    expect(screen.getByText('tightening')).toBeInTheDocument();

    expect(screen.getByText('Port Congestion Trend')).toBeInTheDocument();
    expect(screen.getByText('decreasing')).toBeInTheDocument();

    expect(screen.getByText('Prob. Escalation > 8%')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();

    // Verify directional tags
    const directions = screen.getAllByTestId('rationale-driver-direction');
    expect(directions.length).toBe(4);

    const unfavorableBadges = screen.getAllByText(/UNFAVORABLE TO WAIT/i);
    expect(unfavorableBadges.length).toBe(3);

    const favorableBadges = screen.getAllByText(/\bFAVORABLE TO WAIT/i);
    expect(favorableBadges.length).toBe(1);
  });

  it('updates rendered drivers and directions when rationale changes', () => {
    const updatedRecommendation = {
      action: 'WAIT',
      splitPct: 0,
      rationaleJson: JSON.stringify({
        action: 'WAIT',
        split_pct: 0,
        drivers: [
          {
            factor: 'expected_freight_change',
            value: '-12.5%',
            direction: 'favorable_to_wait',
          },
          {
            factor: 'vessel_availability_proxy',
            value: 'abundant',
            direction: 'favorable_to_wait',
          },
        ],
        narrative: 'Freight is expected to fall 12.5%. Deferring commitment captures softening.',
      }),
    };

    render(<RecommendationCard recommendation={updatedRecommendation} />);

    expect(screen.getByText('-12.5%')).toBeInTheDocument();
    expect(screen.getByText('abundant')).toBeInTheDocument();

    const favorableBadges = screen.getAllByText(/FAVORABLE TO WAIT/i);
    expect(favorableBadges.length).toBe(2);
    expect(screen.queryByText(/UNFAVORABLE TO WAIT/i)).not.toBeInTheDocument();
  });
});
