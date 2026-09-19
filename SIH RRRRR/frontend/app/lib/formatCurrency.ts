/**
 * Currency formatting utilities — always uses en-US (international comma grouping).
 * Never passes the browser/OS locale to avoid Indian lakh-style grouping (e.g. $14,50,000).
 */

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const USD_FORMATTER_2DP = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

/**
 * Format a USD dollar amount with international comma grouping.
 * - Values ≥ 1,000,000 → abbreviated as "$X.XXM"
 * - Values ≥ 1,000 → "$1,450" (no decimals)
 * - Otherwise → "$450"
 *
 * @param value  The raw numeric USD value
 * @param opts.abbreviate  If true, values ≥ 1M are shown as "$X.XXM". Default: true.
 * @param opts.forceFullNumber  If true, always shows the full number with commas. Default: false.
 */
export function formatUSD(
  value: number,
  opts: { abbreviate?: boolean; forceFullNumber?: boolean } = {},
): string {
  const { abbreviate = true, forceFullNumber = false } = opts;

  if (!isFinite(value)) return '$—';

  if (!forceFullNumber && abbreviate && Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m.toFixed(2)}M`;
  }

  return USD_FORMATTER.format(value);
}

/**
 * Format a USD rate (e.g. $/tonne) to 2 decimal places, always with en-US grouping.
 */
export function formatUSDRate(value: number): string {
  if (!isFinite(value)) return '$—';
  return USD_FORMATTER_2DP.format(value);
}

/**
 * Format a plain integer with en-US comma grouping (no $ sign).
 * Useful for distances in NM, MT quantities, etc.
 */
export function formatInt(value: number): string {
  if (!isFinite(value)) return '—';
  return INT_FORMATTER.format(Math.round(value));
}
