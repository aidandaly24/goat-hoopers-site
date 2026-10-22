/**
 * Coverage reproduction for the 2025-26 gamelog append (issue #217).
 *
 * Derives the numbers recorded in data/gamelog_2025-26_validation.json
 * from first principles: the repo replay engine over the committed
 * replay fixtures gives membership for every census day of the 2025
 * segment (2025-10-20 -> 2026-04-01), and the committed
 * data/gamelog_mapped.json gives each player's same-season game dates.
 * A player-day is priceable when the player has a 2025-26 gamelog point
 * on or before that day — the frozen #217 contract (same-season anchors
 * only; a modeled point for day D is an end-of-day estimate).
 *
 * The first assertions reproduce the step-0 census totals exactly
 * (36,774 player-days / 1,640 team-days) so a harness drift fails here
 * before any coverage claim is read.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LEAGUE_ID, type RawDraft, type RawDraftPick, type RawRoster, type RawTransaction } from "../sleeper";
import { SEASON_ONE_LEAGUE_ID, toHistoryMoves } from "../team-value-history";
import { loadChainRosterReplay, type RosterReplayDeps } from "../roster-replay";

const FIXTURES = fileURLToPath(new URL("../../test/fixtures/roster-replay/", import.meta.url));
const DATA = fileURLToPath(new URL("../../../data/", import.meta.url));
const readJson = (base: string, name: string) => JSON.parse(readFileSync(`${base}${name}`, "utf8"));
const ROSTER_SETTINGS = { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0 };

function fixtureDeps(): RosterReplayDeps {
  const drafts: Record<string, any> = { [SEASON_ONE_LEAGUE_ID]: readJson(FIXTURES, "season-2025-draft.json"), [LEAGUE_ID]: readJson(FIXTURES, "season-2026-draft.json") };
  const picks: Record<string, any[]> = { [drafts[SEASON_ONE_LEAGUE_ID].draft_id]: readJson(FIXTURES, "season-2025-draft-picks.json"), [drafts[LEAGUE_ID].draft_id]: readJson(FIXTURES, "season-2026-draft-picks.json") };
  const transactions: Record<string, RawTransaction[]> = { [SEASON_ONE_LEAGUE_ID]: readJson(FIXTURES, "season-2025-transactions.json"), [LEAGUE_ID]: readJson(FIXTURES, "season-2026-transactions.json") };
  const rosters: Record<string, any[]> = { [SEASON_ONE_LEAGUE_ID]: readJson(FIXTURES, "season-2025-rosters.json"), [LEAGUE_ID]: readJson(FIXTURES, "season-2026-rosters.json") };
  return {
    fetchDrafts: async leagueId => { const d = drafts[leagueId]; return [{ draft_id: d.draft_id, league_id: d.league_id, season: d.season, status: d.status, type: d.type, start_time: d.start_time, last_picked: d.last_picked, settings: d.settings, draft_order: d.draft_order } satisfies RawDraft]; },
    fetchDraftPicks: async draftId => picks[draftId].map(p => ({ pick_no: p.pick_no, round: p.round, draft_slot: p.draft_slot, player_id: p.player_id, picked_by: "", roster_id: p.roster_id, metadata: {} } satisfies RawDraftPick)),
    fetchRosters: async leagueId => rosters[leagueId].map(r => ({ roster_id: r.roster_id, owner_id: r.owner_id, players: r.players, settings: ROSTER_SETTINGS } satisfies RawRoster)),
    fetchMoves: async leagueId => toHistoryMoves(transactions[leagueId], leagueId),
    seasonTwoWeeks: async () => [1],
    now: () => new Date("2026-10-21T12:00:00Z"),
  };
}

describe("2025-26 gamelog coverage vs the #217 census", () => {
  it("derives the recorded coverage numbers", async () => {
    const gamelog = readJson(DATA, "gamelog_mapped.json") as { players: Record<string, { games: { date: string; season: string }[] }> };
    const firstGame2025 = new Map<string, string>();
    for (const [pid, entry] of Object.entries(gamelog.players)) {
      const dates = entry.games.filter(g => g.season === "2025-26").map(g => g.date.slice(0, 10)).sort();
      if (dates.length) firstGame2025.set(pid, dates[0]);
    }
    const chain = await loadChainRosterReplay(fixtureDeps());
    const days: string[] = [];
    for (let t = Date.parse("2025-10-20T00:00:00Z"); t <= Date.parse("2026-04-01T00:00:00Z"); t += 86_400_000) days.push(new Date(t).toISOString().slice(0, 10));
    let total = 0, priceable = 0, preFirst = 0, teamDays = 0, complete = 0, partial = 0, unavailable = 0;
    const noGames = new Map<string, number>();
    for (const day of days) for (let slot = 1; slot <= 10; slot++) {
      const m = chain.membershipOnDay(slot, day); if (!m) continue; teamDays++;
      let priced = 0;
      for (const pid of m.playerIds) { total++; const first = firstGame2025.get(pid); if (first && first <= day) { priceable++; priced++; } else if (first) preFirst++; else noGames.set(pid, (noGames.get(pid) ?? 0) + 1); }
      if (priced === m.playerIds.length) complete++; else if (priced > 0) partial++; else unavailable++;
    }
    // Census reproduction first: the harness must land on the step-0 totals.
    expect({ days: days.length, teamDays, playerDays: total }).toEqual({ days: 164, teamDays: 1640, playerDays: 36774 });
    // Coverage with the appended 2025-26 season.
    expect(priceable).toBe(34755);
    expect(preFirst).toBe(1309);
    expect([...noGames.values()].reduce((a, b) => a + b, 0)).toBe(710);
    // The only rostered players with no 2025-26 NBA game: four season-long
    // injury absences, one rookie who missed the year, one legacy id.
    expect(Object.fromEntries(noGames)).toEqual({
      "1054": 164, "1444": 164, "2161": 164, "4762": 164, "1717": 45, "1228": 9,
    });
    expect({ complete, partial, unavailable }).toEqual({ complete: 621, partial: 1009, unavailable: 10 });
  }, 120_000);
});
