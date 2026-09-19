import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProvenanceBadge } from '../ProvenanceBadge';
import { ProvenanceState } from '../../lib/api-client';

describe('ProvenanceBadge Component (§3.1 Hard Requirement)', () => {
  const provenanceStates: ProvenanceState[] = [
    'REAL_VERIFIED',
    'PUBLIC_PROXY',
    'SIMULATED',
    'ASSUMPTION',
    'MODEL_OUTPUT',
  ];

  it.each(provenanceStates)(
    'renders correctly for provenance state: %s with proper taxonomy text and tooltip',
    (state) => {
      const { container } = render(
        <ProvenanceBadge
          provenance={state}
          source="Test Source Agency"
          date="2026-09-12"
        />
      );

      const badge = screen.getByTestId('provenance-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-provenance', state);

      // Verify custom or default displayText is rendered
      const expectedText = state.replace('_', ' ');
      expect(badge.textContent).toContain(expectedText);

      // Verify tooltip contains standard taxonomy text and source
      const titleAttr = badge.getAttribute('title') || '';
      expect(titleAttr).toContain('Source: Test Source Agency');
      expect(titleAttr).toContain('Verified: 2026-09-12');
    }
  );

  it('renders custom label when provided', () => {
    render(<ProvenanceBadge provenance="REAL_VERIFIED" label="IPA TARIFF" />);
    const badge = screen.getByTestId('provenance-badge');
    expect(badge.textContent).toContain('IPA TARIFF');
  });

  it('handles case-insensitivity and fallback gracefully', () => {
    // @ts-ignore
    render(<ProvenanceBadge provenance="public_proxy" />);
    const badge = screen.getByTestId('provenance-badge');
    expect(badge).toHaveAttribute('data-provenance', 'PUBLIC_PROXY');
    expect(badge.textContent).toContain('PUBLIC PROXY');
  });
});
