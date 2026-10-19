import { describe, expect, it } from "vitest";
import { loadLeagueOpening } from "./league-opening";

const league = { league_id: "1387473752807190528", season: "2026", settings: { start_week: 1 } };
const state = { season: "2026", season_start_date: "2026-10-20", season_type: "regular", season_has_scores: true, leg: 1 };
const read = (l: unknown = league, s: unknown = state) => loadLeagueOpening({ league: async () => l, state: async () => s });

describe("public league opening evidence", () => {
  it("retains the provider date without treating early regular/scoring flags as a verified instant", async () => {
    expect(await read()).toMatchObject({ status: "date_only", date: "2026-10-20", startsAtMs: null });
  });
  it.each([
    [{ ...league, league_id: "another-league" }, state],
    [league, { ...state, season: "2025" }],
    [{ ...league, settings: { start_week: 2 } }, state],
    [league, { ...state, season_start_date: "2026-02-30" }],
    [league, { ...state, season_start_date: "2026-10-20T19:00:00Z" }],
    [league, { ...state, season_start_date: "2025-10-20" }],
    [null, state],
  ])("withholds inconsistent or incomplete source evidence %#", async (l, s) => {
    expect(await read(l, s)).toMatchObject({ status: "unavailable", date: null, startsAtMs: null });
  });
  it("fails soft when either public read is unavailable", async () => {
    const result = await loadLeagueOpening({ league: async () => league, state: async () => { throw Error("source down"); } });
    expect(result.status).toBe("unavailable");
  });
});
