/** Explicitly synthetic cutoff/month windows; no actual league-history claim. */
import { moversHistory, moversDetail } from "./movers-fixture";
export function rangesHistory() {
  const h = moversHistory(); h.asOf = "2026-11-22T00:10:00.000Z";
  h.leagueRange = h.requestedRange = h.loadedRange = { ...h.leagueRange, toExclusive: "2026-11-23" };
  h.seasons[1].range.toExclusive = h.leagueRange.toExclusive;
  for (const rows of Object.values(h.coverage)) for (const row of rows) row.toExclusive = h.leagueRange.toExclusive;
  return h;
}
export function rangesDetail(day: string) {
  const d = moversDetail(day);
  if (d.valuationAt > rangesHistory().asOf) d.valuationAt = rangesHistory().asOf;
  return d;
}
