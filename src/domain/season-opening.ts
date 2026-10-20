/**
 * First tip of the 2026–27 NBA regular season: Boston at Detroit,
 * Oct 20, 2026 at 19:00 UTC. This is the accepted first NBA tip, not
 * Sleeper's unpublished scoring-start time.
 *
 * This plain module is shared by server-rendered homepage gates and the
 * client countdown. Do not move it behind a React client boundary.
 */
export const WEEK_ONE_TIP_OFF_ISO = "2026-10-20T19:00:00.000Z";

export type OpeningPhase = "before" | "started" | "past";

/** Countdown before tip, started through Week 1, then no opening clock. */
export function openingPhase(nowMs: number, targetMs: number, week: number | null): OpeningPhase {
  if (!Number.isFinite(nowMs) || !Number.isFinite(targetMs)) return "past";
  if (nowMs < targetMs) return "before";
  if (week === 1) return "started";
  if (week === null && nowMs < targetMs + 7 * 86_400_000) return "started";
  return "past";
}
