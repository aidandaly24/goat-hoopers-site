/**
 * Display-boundary number formatting for league totals.
 *
 * Fantasy totals arrive in Sleeper "hundredths" (e.g. fpts * 100 +
 * fpts_decimal). In the preseason some settings are absent from the raw
 * payload, so the domain value can be NaN at runtime even where the type
 * says `number`. This module is the single boundary that keeps nonfinite
 * input from reaching visible text or accessible labels: a missing total
 * gets an honest "not yet recorded" presentation, never an invented value.
 */

/** Glyph shown when a total is unknown — matches the codebase's existing convention. */
export const UNAVAILABLE_TOTAL = "—";

/**
 * Format a hundredths total for display. Finite values render with one
 * decimal (existing site convention); missing or nonfinite input renders
 * the unavailable glyph. Never throws, never returns "NaN"/"Infinity".
 */
export function fmtTotal(hundredths: number | null | undefined): string {
  if (!Number.isFinite(hundredths)) return UNAVAILABLE_TOTAL;
  return ((hundredths as number) / 100).toFixed(1);
}

/**
 * Accessible label for a metric that may be unknown. Distinguishes a known
 * numeric zero ("Points against 0.0") from missing input
 * ("Points against not yet recorded").
 */
export function totalLabel(
  name: string,
  hundredths: number | null | undefined
): string {
  if (!Number.isFinite(hundredths)) return `${name} not yet recorded`;
  return `${name} ${fmtTotal(hundredths)}`;
}
