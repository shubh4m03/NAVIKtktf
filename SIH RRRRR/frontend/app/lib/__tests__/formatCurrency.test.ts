import { describe, it, expect } from 'vitest';
import { formatUSD, formatUSDRate, formatInt } from '../formatCurrency';

describe('formatCurrency utility', () => {
  it('formats values >= 1M with abbreviation by default', () => {
    expect(formatUSD(1450000)).toBe('$1.45M');
    expect(formatUSD(25000000)).toBe('$25.00M');
  });

  it('formats values >= 1M with full commas if forceFullNumber is true or abbreviate is false', () => {
    expect(formatUSD(1450000, { forceFullNumber: true })).toBe('$1,450,000');
    expect(formatUSD(1450000, { abbreviate: false })).toBe('$1,450,000');
  });

  it('formats values under 1M using standard international comma grouping (no Indian lakh commas)', () => {
    expect(formatUSD(145000)).toBe('$145,000');
    expect(formatUSD(1450)).toBe('$1,450');
    expect(formatUSD(500)).toBe('$500');
  });

  it('formats rates with 2 decimal places and standard commas', () => {
    expect(formatUSDRate(1450.5)).toBe('$1,450.50');
    expect(formatUSDRate(28.75)).toBe('$28.75');
  });

  it('formats integer counts and distances without currency symbol', () => {
    expect(formatInt(12500)).toBe('12,500');
    expect(formatInt(75000)).toBe('75,000');
  });

  it('handles non-finite values safely', () => {
    expect(formatUSD(NaN)).toBe('$—');
    expect(formatUSDRate(Infinity)).toBe('$—');
    expect(formatInt(NaN)).toBe('—');
  });
});
