import "server-only";
import type { AiWeekCalendarWindow } from "@/domain/ai-decider";
import calendar from "../../../docs/ai-week-calendar.json";

/**
 * Reviewed first-tip windows for current-week publication, loaded from the
 * versioned artifact docs/ai-week-calendar.json (provenance and derivation
 * in docs/ai-week-calendar.md). This is the codebase's calendar mechanism
 * for AI publication — the same docs-artifact pattern as the arcade week
 * calendars — not a runtime fetch and not a derived schedule. A season/week
 * with no entry has NO verified window: current-week selection fails closed
 * rather than guessing a tip time.
 */
type CalendarEntry = {
  id: string;
  season: string;
  week: number;
  firstTipAt: string;
  calendarVersion: string;
  calendarSource: string;
  fixtures: { id: string; date: string; startsAtMs: number }[];
};

const ENTRIES = calendar as CalendarEntry[];

/** Exact season/week lookup; null means unverified — never a guessed window. */
export function aiWeekCalendarWindow(season: string, week: number): AiWeekCalendarWindow | null {
  const entry = ENTRIES.find(e => e.season === season && e.week === week);
  if (!entry) return null;
  const firstTipMs = Date.parse(entry.firstTipAt);
  if (!Number.isFinite(firstTipMs)) return null;
  // The stated first tip must be one of the entry's own observed fixtures;
  // a version whose firstTipAt disagrees with its fixtures is corrupt.
  const fixtureIds = entry.fixtures.filter(f => f.startsAtMs === firstTipMs).map(f => f.id);
  if (fixtureIds.length === 0) return null;
  return { season: entry.season, week: entry.week, firstTipAt: entry.firstTipAt, calendarVersion: entry.calendarVersion, calendarSource: entry.calendarSource, fixtureIds };
}
