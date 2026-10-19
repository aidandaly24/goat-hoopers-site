import type { LeagueOpening } from "@/domain/league-opening";

type Sources = { league(): Promise<unknown>; state(): Promise<unknown> };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const unavailable = (): LeagueOpening => ({ status: "unavailable", date: null, startsAtMs: null, message: "The league’s Week 1 start is awaiting a verified schedule." });

/** Two existing cached public reads; no DB, private state or inferred midnight. */
export async function loadLeagueOpening(sources: Sources): Promise<LeagueOpening> {
  try {
    const [league, state] = await Promise.all([sources.league(), sources.state()]);
    if (!object(league) || !object(state) || league.league_id !== "1387473752807190528"
      || typeof league.season !== "string" || !/^20\d{2}$/.test(league.season) || state.season !== league.season
      || !object(league.settings) || league.settings.start_week !== 1) return unavailable();
    const date = state.season_start_date;
    if (typeof date !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(date) || date.slice(0, 4) !== league.season
      || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return unavailable();
    // Sleeper supplies a date, not a scoring-start instant or timezone. Its
    // regular/season_has_scores flags may already be true before any tipoff.
    return { status: "date_only", season: league.season, week: 1, date, startsAtMs: null,
      message: "Exact league tipoff time is awaiting schedule confirmation." };
  } catch { return unavailable(); }
}
