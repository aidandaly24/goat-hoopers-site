import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LEAGUE_ID, type RawDraft, type RawDraftPick, type RawRoster, type RawTransaction } from "../sleeper";
import { SEASON_ONE_LEAGUE_ID, toHistoryMoves } from "../team-value-history";
import { loadChainRosterReplay, type RosterReplayDeps } from "../roster-replay";
import { exportMembershipSnapshot } from "../modeled-backfill";

/**
 * Operator harness (not a CI gate): regenerates the committed
 * membership snapshot the offline backfill runner consumes, from the
 * captured roster-replay receipts — the same fixture-fed chain the
 * coverage harness and the chain test validate. Runs only when
 * MODELED_BACKFILL_MEMBERSHIP_OUT names the output path:
 *
 *   MODELED_BACKFILL_MEMBERSHIP_OUT=data/reconstruction/membership.json \
 *     npx vitest run src/data/__tests__/modeled-backfill-export.test.ts
 *
 * To refresh the underlying evidence, re-capture the receipts first
 * (scripts/capture-roster-replay-fixtures.mjs) and re-run the chain
 * test, which fails if the committed snapshot drifts from the replay.
 */

const FIXTURES = fileURLToPath(new URL("../../test/fixtures/roster-replay/", import.meta.url));
const readJson = (name: string) => JSON.parse(readFileSync(`${FIXTURES}${name}`, "utf8"));
const ROSTER_SETTINGS = { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0 };

function fixtureDeps(): RosterReplayDeps {
  const drafts: Record<string, any> = { [SEASON_ONE_LEAGUE_ID]: readJson("season-2025-draft.json"), [LEAGUE_ID]: readJson("season-2026-draft.json") };
  const picks: Record<string, any[]> = { [drafts[SEASON_ONE_LEAGUE_ID].draft_id]: readJson("season-2025-draft-picks.json"), [drafts[LEAGUE_ID].draft_id]: readJson("season-2026-draft-picks.json") };
  const transactions: Record<string, RawTransaction[]> = { [SEASON_ONE_LEAGUE_ID]: readJson("season-2025-transactions.json"), [LEAGUE_ID]: readJson("season-2026-transactions.json") };
  const rosters: Record<string, any[]> = { [SEASON_ONE_LEAGUE_ID]: readJson("season-2025-rosters.json"), [LEAGUE_ID]: readJson("season-2026-rosters.json") };
  return {
    fetchDrafts: async leagueId => { const d = drafts[leagueId]; return [{ draft_id: d.draft_id, league_id: d.league_id, season: d.season, status: d.status, type: d.type, start_time: d.start_time, last_picked: d.last_picked, settings: d.settings, draft_order: d.draft_order } satisfies RawDraft]; },
    fetchDraftPicks: async draftId => picks[draftId].map(p => ({ pick_no: p.pick_no, round: p.round, draft_slot: p.draft_slot, player_id: p.player_id, picked_by: "", roster_id: p.roster_id, metadata: {} } satisfies RawDraftPick)),
    fetchRosters: async leagueId => rosters[leagueId].map(r => ({ roster_id: r.roster_id, owner_id: r.owner_id, players: r.players, settings: ROSTER_SETTINGS } satisfies RawRoster)),
    fetchMoves: async leagueId => toHistoryMoves(transactions[leagueId], leagueId),
    seasonTwoWeeks: async () => [1],
    now: () => new Date("2026-10-21T12:00:00Z"),
  };
}

const out = process.env.MODELED_BACKFILL_MEMBERSHIP_OUT;

describe("modeled backfill membership export", () => {
  it.skipIf(!out)("writes the membership snapshot", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    const snapshot = exportMembershipSnapshot(chain);
    writeFileSync(out!, `${JSON.stringify(snapshot, null, 1)}\n`);
    expect(snapshot.teamIds).toHaveLength(10);
    expect(snapshot.seasonTwoFromDay).toBe("2026-08-13");
  }, 120_000);
});
