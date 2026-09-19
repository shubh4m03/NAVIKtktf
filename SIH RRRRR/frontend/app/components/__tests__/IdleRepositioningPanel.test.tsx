import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IdleRepositioningPanel from '../IdleRepositioningPanel';
import { getFallbackIdleEstimate } from '../../lib/api-client';

describe('IdleRepositioningPanel (§10 Task 18)', () => {
  it('renders nothing when idleEstimate is undefined', () => {
    const { container } = render(<IdleRepositioningPanel idleEstimate={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Section 10 mandatory disclaimer banner prominently', () => {
    const mockEstimate = getFallbackIdleEstimate(101);
    render(<IdleRepositioningPanel idleEstimate={mockEstimate} />);

    const banner = screen.getByTestId('idle-disclaimer-banner');
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain('Operational Context & Fleet Disclosure');
    expect(banner.textContent).toContain(
      'ILLUSTRATIVE MVP ONLY: Single-voyage heuristic based on public seasonal trade flows'
    );
    expect(banner.textContent).toContain('Fleet-level deadheading optimization requires proprietary vessel schedule data');
  });

  it('renders turnaround, arrival, and available date with correct provenance badges', () => {
    const mockEstimate = getFallbackIdleEstimate(101);
    render(<IdleRepositioningPanel idleEstimate={mockEstimate} />);

    const turnaround = screen.getByTestId('idle-turnaround-days');
    expect(turnaround.textContent).toBe('4.8 days');

    const arrival = screen.getByTestId('idle-arrival-date');
    expect(arrival.textContent).toBe(mockEstimate.estimatedArrivalDate);

    const available = screen.getByTestId('idle-available-date');
    expect(available.textContent).toBe(mockEstimate.availableDate);

    // Verify all badges render
    const badges = screen.getAllByTestId('provenance-badge');
    expect(badges.length).toBeGreaterThan(5);

    // Verify presence of ASSUMPTION disclosure badge and REAL_VERIFIED port turnaround badge
    const badgeProvenances = badges.map((b) => b.getAttribute('data-provenance'));
    expect(badgeProvenances).toContain('REAL_VERIFIED');
    expect(badgeProvenances).toContain('PUBLIC_PROXY');
    expect(badgeProvenances).toContain('ASSUMPTION');
    expect(badgeProvenances).toContain('MODEL_OUTPUT');
  });

  it('renders 3 opportunity lanes with ballast distance, transit days, and repositioning costs', () => {
    const mockEstimate = getFallbackIdleEstimate(101);
    render(<IdleRepositioningPanel idleEstimate={mockEstimate} />);

    const lanes = screen.getAllByTestId('opportunity-lane-card');
    expect(lanes.length).toBe(3);

    expect(screen.getByText('IN-EAST-TO-AUS-EAST')).toBeDefined();
    expect(screen.getByText('IN-EAST-TO-IDN-KAL')).toBeDefined();
    expect(screen.getByText('IN-EAST-TO-ZAF-RB')).toBeDefined();

    expect(screen.getByText('4,500 NM')).toBeDefined();
    expect(screen.getByText('15.0 days')).toBeDefined();
    expect(screen.getByText('$247,500')).toBeDefined();
  });
});
