import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createPriceHistoryArtifact, validatePriceHistoryArtifact } from "../price-history-artifact";
import type { ReconstructionInput } from "../../domain/price-history-import";
import { LEAGUE_ID, type RawDraft, type RawDraftPick, type RawRoster, type RawTransaction } from "../sleeper";
import { HISTORY_SEASON_TWO_FROM, SEASON_ONE_LEAGUE_ID, toHistoryMoves } from "../team-value-history";
import { loadChainRosterReplay, type RosterReplayDeps } from "../roster-replay";
import {
  buildModeledPlayerTimelines, buildModeledTeamPoints, endOfDay, exportMembershipSnapshot,
} from "../modeled-backfill";

/**
 * End-to-end producer validation (#217 Stage 2): the real roster
 * replay (committed receipts) composed with the pinned reconstruction
 * artifact must reproduce the Stage 1 harness's coverage numbers
 * exactly — 34,755 priced player-days over the 2025 segment, split
 * 621 complete / 1,009 partial / 10 unavailable team-days — because
 * both harnesses price a player-day exactly when a same-season gamelog
 * point exists on or before it. The gap and the 2026 segment must emit
 * nothing, and the committed membership snapshot must be the replay's
 * own export, byte-for-byte in structure.
 */

const FIXTURES = fileURLToPath(new URL("../../test/fixtures/roster-replay/", import.meta.url));
const DATA = fileURLToPath(new URL("../../../data/", import.meta.url));
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const readJsonAt = (base: string, name: string) => JSON.parse(readFileSync(`${base}${name}`, "utf8"));
const ROSTER_SETTINGS = { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0 };

function fixtureDeps(): RosterReplayDeps {
  const drafts: Record<string, any> = { [SEASON_ONE_LEAGUE_ID]: readJsonAt(FIXTURES, "season-2025-draft.json"), [LEAGUE_ID]: readJsonAt(FIXTURES, "season-2026-draft.json") };
  const picks: Record<string, any[]> = { [drafts[SEASON_ONE_LEAGUE_ID].draft_id]: readJsonAt(FIXTURES, "season-2025-draft-picks.json"), [drafts[LEAGUE_ID].draft_id]: readJsonAt(FIXTURES, "season-2026-draft-picks.json") };
  const transactions: Record<string, RawTransaction[]> = { [SEASON_ONE_LEAGUE_ID]: readJsonAt(FIXTURES, "season-2025-transactions.json"), [LEAGUE_ID]: readJsonAt(FIXTURES, "season-2026-transactions.json") };
  const rosters: Record<string, any[]> = { [SEASON_ONE_LEAGUE_ID]: readJsonAt(FIXTURES, "season-2025-rosters.json"), [LEAGUE_ID]: readJsonAt(FIXTURES, "season-2026-rosters.json") };
  return {
    fetchDrafts: async leagueId => { const d = drafts[leagueId]; return [{ draft_id: d.draft_id, league_id: d.league_id, season: d.season, status: d.status, type: d.type, start_time: d.start_time, last_picked: d.last_picked, settings: d.settings, draft_order: d.draft_order } satisfies RawDraft]; },
    fetchDraftPicks: async draftId => picks[draftId].map(p => ({ pick_no: p.pick_no, round: p.round, draft_slot: p.draft_slot, player_id: p.player_id, picked_by: "", roster_id: p.roster_id, metadata: {} } satisfies RawDraftPick)),
    fetchRosters: async leagueId => rosters[leagueId].map(r => ({ roster_id: r.roster_id, owner_id: r.owner_id, players: r.players, settings: ROSTER_SETTINGS } satisfies RawRoster)),
    fetchMoves: async leagueId => toHistoryMoves(transactions[leagueId], leagueId),
    seasonTwoWeeks: async () => [1],
    now: () => new Date("2026-10-21T12:00:00Z"),
  };
}

function pinnedArtifact() {
  const config = readJsonAt(DATA, "reconstruction/inputs.json");
  const input: ReconstructionInput = {
    directorySeason: config.directorySeason,
    currentSeasonStartYear: config.currentSeasonStartYear,
    directory: readJsonAt(DATA, "reconstruction/directory.json"),
    players: readJsonAt(DATA, "gamelog_mapped.json").players,
    seasonHistory: readJsonAt(DATA, "reconstruction/season-history.json"),
    draftPicks: readJsonAt(DATA, "reconstruction/draft-picks.json"),
  };
  const modelCodeHash = createHash("sha256")
    .update(readFileSync(`${ROOT}src/data/transform.ts`))
    .update(readFileSync(`${ROOT}src/data/reconstruct-price-history.ts`))
    .digest("hex");
  const artifact = createPriceHistoryArtifact(input, config.source, modelCodeHash);
  validatePriceHistoryArtifact(artifact);
  return artifact;
}

describe("modeled backfill over the real chain", () => {
  it("reproduces the Stage 1 coverage numbers and emits nothing past the 2025 segment", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    const snapshot = exportMembershipSnapshot(chain);
    expect(snapshot.seasonTwoFromDay).toBe(HISTORY_SEASON_TWO_FROM);
    expect(snapshot).toEqual(readJsonAt(DATA, "reconstruction/membership.json"));

    const artifact = pinnedArtifact();
    const range = { fromDay: snapshot.range.fromDay, throughDay: snapshot.range.throughDay };
    const built = buildModeledPlayerTimelines(artifact, {
      from: "2022-07-01T00:00:00.000Z", asOf: endOfDay(range.throughDay),
    });
    const { points, diagnostics } = buildModeledTeamPoints({
      built, datasetId: artifact.manifest.datasetId, modelVersion: artifact.manifest.modelVersion,
      membershipOnDay: (rosterId, day) => chain.membershipOnDay(rosterId, day),
      recordedAdmits: () => false,
      teamIds: snapshot.teamIds, range, seasonTwoFromDay: snapshot.seasonTwoFromDay,
    });

    // Membership over the whole window: 1,640 segment-one team-days
    // plus 690 in the 2026 segment through the fixture as-of day
    // (the census's 2,200 stopped at its own earlier as-of).
    expect(diagnostics.membershipTeamDays).toBe(2330);
    const segmentOne = points.filter(entry => entry.point.day <= "2026-04-01");
    const pricedPlayerDays = segmentOne.reduce((n, entry) => n + entry.point.priced, 0);
    expect(pricedPlayerDays).toBe(34_755);
    expect(segmentOne.filter(entry => entry.point.priced === entry.point.rosterCount)).toHaveLength(621);
    expect(segmentOne.filter(entry => entry.point.rosterCount !== null && entry.point.priced < entry.point.rosterCount)).toHaveLength(1_009);
    // 1,640 segment-one team-days, 1,630 points: exactly 10 unavailable.
    expect(segmentOne).toHaveLength(1_630);

    // The membership gap and the whole 2026 segment stay unpriced gaps.
    expect(points).toHaveLength(segmentOne.length);
    for (const entry of points) {
      expect(entry.point.priceKind).toBe("reconstructed");
      expect(entry.point.standalone).toBe(false);
      expect(entry.point.subtotalCents).toBeGreaterThan(0);
      expect(entry.point.continuityId).toMatch(/^mseg-/);
      expect(entry.point.pricedSetId).toMatch(/^mps-/);
      for (const line of entry.players) {
        if (line.priceCents == null) {
          expect(line.proof).toBeNull();
        } else {
          expect(line.proof).toMatchObject({
            kind: "reconstructed", source: "gamelog", datasetId: artifact.manifest.datasetId,
          });
          expect(line.anchorDate! <= entry.point.day).toBe(true);
        }
      }
    }
  }, 120_000);
});
