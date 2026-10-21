/**
 * Forward roster replay — GROUND-TRUTH acceptance (issues #224/#217).
 *
 * Runs the real chain loader against captured Sleeper receipts
 * (src/test/fixtures/roster-replay/, captured 2026-10-21; manifest
 * hashes verified below) and proves the acceptance gate frozen on
 * #217: the replay reproduces Sleeper's ACTUAL final 2025 rosters and
 * current 2026 rosters for all 10 teams, exactly. The loader itself
 * also asserts both equalities on every load — these tests pin the
 * captured facts around that proof (counts, the empty reconciliation,
 * the draft segmentation, the gap) so a silent data or engine change
 * cannot pass unnoticed.
 *
 * Captured facts (2026-10-21): the 2025 feed carries 400 rows, 392
 * complete (340 free_agent / 33 waiver / 15 trade / 4 commissioner);
 * 4 complete records are pick-only trades effective during the
 * startup draft (pre-anchor); 388 moves replay. The 2026 feed carries
 * 49 rows, 46 complete, split 12 pre-draft / 34 post-draft by the
 * 2026 draft's completion (2026-10-05T17:34:08.922Z). The boundary
 * reconciliation is EMPTY for every slot — no silent keeper cuts.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  LEAGUE_ID, type RawDraft, type RawDraftPick, type RawRoster, type RawTransaction,
} from "../sleeper";
import { SEASON_ONE_LEAGUE_ID, toHistoryMoves } from "../team-value-history";
import {
  deriveBoundaryReconciliation, loadChainRosterReplay,
  type RosterDraftEvent, type RosterReplayDeps,
} from "../roster-replay";

const FIXTURES = fileURLToPath(new URL("../../test/fixtures/roster-replay/", import.meta.url));
const readFixture = (name: string) => readFileSync(`${FIXTURES}${name}`);
const readJson = (name: string) => JSON.parse(readFixture(name).toString("utf8"));

const manifest = readJson("manifest.json") as {
  files: Record<string, { sha256: string; bytes: number }>;
};

type FixtureDraft = {
  draft_id: string; season: string; status: string; type: string;
  start_time: number; last_picked: number;
};
type FixturePick = { pick_no: number; round: number; draft_slot: number; roster_id: number; player_id: string };
type FixtureRoster = { roster_id: number; owner_id: string; players: string[] };

const ROSTER_SETTINGS = {
  wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0,
};

function fixtureDeps(): RosterReplayDeps {
  const drafts: Record<string, FixtureDraft> = {
    [SEASON_ONE_LEAGUE_ID]: readJson("season-2025-draft.json"),
    [LEAGUE_ID]: readJson("season-2026-draft.json"),
  };
  const picks: Record<string, FixturePick[]> = {
    [drafts[SEASON_ONE_LEAGUE_ID].draft_id]: readJson("season-2025-draft-picks.json"),
    [drafts[LEAGUE_ID].draft_id]: readJson("season-2026-draft-picks.json"),
  };
  const transactions: Record<string, RawTransaction[]> = {
    [SEASON_ONE_LEAGUE_ID]: readJson("season-2025-transactions.json"),
    [LEAGUE_ID]: readJson("season-2026-transactions.json"),
  };
  const rosters: Record<string, FixtureRoster[]> = {
    [SEASON_ONE_LEAGUE_ID]: readJson("season-2025-rosters.json"),
    [LEAGUE_ID]: readJson("season-2026-rosters.json"),
  };
  return {
    fetchDrafts: async leagueId => {
      const draft = drafts[leagueId];
      return [{
        draft_id: draft.draft_id, season: draft.season, status: draft.status,
        type: draft.type, start_time: draft.start_time, last_picked: draft.last_picked,
      } satisfies RawDraft];
    },
    fetchDraftPicks: async draftId => picks[draftId].map(pick => ({
      pick_no: pick.pick_no, round: pick.round, draft_slot: pick.draft_slot,
      player_id: pick.player_id, picked_by: "", roster_id: pick.roster_id, metadata: {},
    } satisfies RawDraftPick)),
    fetchRosters: async leagueId => rosters[leagueId].map(roster => ({
      roster_id: roster.roster_id, owner_id: roster.owner_id,
      players: roster.players, settings: ROSTER_SETTINGS,
    } satisfies RawRoster)),
    fetchMoves: async (leagueId, weeks) => {
      // The captured feeds are complete: 2025 over its fixed final
      // range, 2026 over week 1 (every 2026 record sits at leg 1).
      if (leagueId === SEASON_ONE_LEAGUE_ID) expect(weeks).toHaveLength(24);
      else expect(weeks).toEqual([1]);
      return toHistoryMoves(transactions[leagueId], leagueId);
    },
    seasonTwoWeeks: async () => [1],
  };
}

const sorted = (ids: readonly string[]) => [...ids].sort();
const fixtureRosters = (name: string) =>
  new Map((readJson(name) as FixtureRoster[]).map(roster => [roster.roster_id, sorted(roster.players)]));

describe("fixture integrity", () => {
  it("every fixture hashes to its manifest entry", () => {
    for (const [name, entry] of Object.entries(manifest.files)) {
      const bytes = readFixture(name);
      expect(bytes.byteLength, name).toBe(entry.bytes);
      expect(createHash("sha256").update(bytes).digest("hex"), name).toBe(entry.sha256);
    }
  });
});

describe("season 2025 — draft anchor + forward replay", () => {
  it("reproduces Sleeper's final rosters for all 10 teams, exactly", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    expect(chain.seasonOne.draftId).toBe("1282883197582987264");
    expect(chain.seasonOne.anchorAt).toBe("2025-10-20T02:50:32.772Z");

    const timeline = chain.seasonOne.timeline;
    expect(timeline.preAnchorMoves).toHaveLength(4);
    expect(timeline.preAnchorMoves.every(move => move.adds.length === 0 && move.drops.length === 0)).toBe(true);
    expect(timeline.appliedMoves).toHaveLength(388);

    const observed = fixtureRosters("season-2025-rosters.json");
    expect(chain.seasonOne.finalRosters).toEqual(observed);
    expect(Object.fromEntries([...observed].map(([id, players]) => [id, players.length]))).toEqual({
      1: 24, 2: 24, 3: 24, 4: 23, 5: 23, 6: 24, 7: 23, 8: 23, 9: 19, 10: 22,
    });
  });

  it("answers membership on draft day from the anchor alone", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    const picks = (readJson("season-2025-draft-picks.json") as FixturePick[])
      .filter(pick => pick.roster_id === 8).map(pick => pick.player_id);
    // At the anchor instant itself, slot 8's roster is exactly its
    // draft assignments and the replay depth is zero.
    const atAnchor = chain.membershipAt(8, Date.parse(chain.seasonOne.anchorAt));
    expect(atAnchor).not.toBeNull();
    expect(atAnchor!.provenance.anchorKind).toBe("draft");
    expect(atAnchor!.provenance.movesApplied).toBe(0);
    expect(atAnchor!.playerIds).toEqual(sorted(picks));
    expect(atAnchor!.playerIds).toHaveLength(20);
    // By end of draft day, 14 post-anchor moves have applied
    // league-wide — none touched slot 8, so its roster is still
    // exactly the draft assignments.
    const day = chain.membershipOnDay(8, "2025-10-20");
    expect(day!.provenance.movesApplied).toBe(14);
    expect(day!.playerIds).toEqual(sorted(picks));
  });

  it("tracks the audited trade and its commissioner reversal", async () => {
    // Sleeper records, captured in the fixture: trade 1286103697570435072
    // swaps 1801 (slot 6 → 3) for 1957 (slot 3 → 6); commissioner move
    // 1286142587706572800 then reverses it exactly.
    const chain = await loadChainRosterReplay(fixtureDeps());
    const raw = readJson("season-2025-transactions.json") as RawTransaction[];
    const eff = (id: string) => {
      const row = raw.find(entry => entry.transaction_id === id)!;
      return (row.status_updated ?? row.created) as number;
    };
    const tradeMs = eff("1286103697570435072");
    const reversalMs = eff("1286142587706572800");
    expect(chain.membershipAt(6, tradeMs - 1)!.playerIds).toContain("1801");
    expect(chain.membershipAt(3, tradeMs - 1)!.playerIds).not.toContain("1801");
    expect(chain.membershipAt(3, tradeMs)!.playerIds).toContain("1801");
    expect(chain.membershipAt(3, reversalMs)!.playerIds).not.toContain("1801");
    expect(chain.membershipAt(6, reversalMs)!.playerIds).toContain("1801");
  });
});

describe("season 2026 — boundary reconciliation + forward replay", () => {
  it("derives an EMPTY reconciliation: no silent keeper cuts", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    expect(chain.seasonTwo.reconciliation).toHaveLength(10);
    for (const entry of chain.seasonTwo.reconciliation) {
      expect(entry.cuts, `slot ${entry.rosterId} cuts`).toEqual([]);
      expect(entry.additions, `slot ${entry.rosterId} additions`).toEqual([]);
    }
    expect(chain.seasonTwo.timeline.appliedMoves).toHaveLength(46);
    expect(chain.seasonTwo.timeline.appliedDraftEvents).toHaveLength(1);
    expect(chain.seasonTwo.timeline.appliedDraftEvents[0].adds).toHaveLength(30);
    expect(chain.seasonTwo.finalRosters).toEqual(fixtureRosters("season-2026-rosters.json"));
  });

  it("segments the feed at the draft: 12 pre-draft moves, 34 post-draft", async () => {
    const deps = fixtureDeps();
    const movesTwo = await deps.fetchMoves!(LEAGUE_ID, [1]);
    const draftTwo = (await deps.fetchDrafts!(LEAGUE_ID))[0];
    const picksTwo = await deps.fetchDraftPicks!(draftTwo.draft_id);
    const draftEvent: RosterDraftEvent = {
      draftId: draftTwo.draft_id, effectiveMs: draftTwo.last_picked!,
      adds: picksTwo.map(pick => ({ playerId: pick.player_id, rosterId: pick.roster_id })),
    };
    const derived = deriveBoundaryReconciliation({
      priorFinalRosters: fixtureRosters("season-2025-rosters.json"),
      currentRosters: fixtureRosters("season-2026-rosters.json"),
      moves: movesTwo, draft: draftEvent,
    });
    expect(derived.preDraftMoves).toHaveLength(12);
    expect(derived.postDraftMoves).toHaveLength(34);
    // At the draft's completion every slot holds its keepers (minus
    // recorded pre-draft drops) plus all of its drafted players.
    expect(Object.fromEntries([...derived.atDraftCompletion].map(([id, players]) => [id, players.length]))).toEqual({
      1: 27, 2: 27, 3: 23, 4: 23, 5: 25, 6: 25, 7: 25, 8: 24, 9: 22, 10: 25,
    });
    // The boundary itself IS the 2025 final, slot for slot.
    expect(derived.boundaryRosters).toEqual(fixtureRosters("season-2025-rosters.json"));
  });

  it("serves pre-draft membership from recorded moves only", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    // The 2026 feed's first move (1393428077987532800, 2026-08-13)
    // drops 1434 from slot 5; by end of that day slot 5 is its 2025
    // final minus exactly that recorded drop — no draft yet, no cuts.
    const day = chain.membershipOnDay(5, "2026-08-13");
    expect(day).not.toBeNull();
    expect(day!.provenance.anchorKind).toBe("boundary-reconciliation");
    const final25 = fixtureRosters("season-2025-rosters.json").get(5)!;
    expect(day!.playerIds).toEqual(final25.filter(playerId => playerId !== "1434"));
    expect(day!.playerIds).toHaveLength(22);
  });
});

describe("the chain — gap honesty and coverage", () => {
  it("asserts no membership inside the offseason gap", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    expect(chain.gapRange).toEqual({ from: "2026-04-02", toExclusive: "2026-08-13" });
    expect(chain.membershipOnDay(1, "2026-06-01")).toBeNull();
    expect(chain.membershipAt(1, Date.parse("2026-04-02T00:00:00Z"))).toBeNull();
    expect(chain.membershipAt(1, Date.parse("2026-08-12T23:59:59Z"))).toBeNull();
    // The last 2025 day still answers, from the replayed final.
    expect(chain.membershipOnDay(9, "2026-04-01")!.playerIds)
      .toEqual(fixtureRosters("season-2025-rosters.json").get(9));
  });

  it("counts 373 distinct players rostered across the whole chain", async () => {
    const chain = await loadChainRosterReplay(fixtureDeps());
    const ever = new Set<string>();
    for (const players of chain.seasonOne.finalRosters.values()) players.forEach(id => ever.add(id));
    for (const players of chain.seasonTwo.finalRosters.values()) players.forEach(id => ever.add(id));
    for (const timeline of [chain.seasonOne.timeline, chain.seasonTwo.timeline]) {
      for (const move of [...timeline.preAnchorMoves, ...timeline.appliedMoves]) {
        move.adds.forEach(entry => ever.add(entry.playerId));
        move.drops.forEach(entry => ever.add(entry.playerId));
      }
    }
    const picks = readJson("season-2025-draft-picks.json") as FixturePick[];
    picks.forEach(pick => ever.add(pick.player_id));
    expect(picks).toHaveLength(200);
    expect(ever.size).toBe(373);
  });
});
