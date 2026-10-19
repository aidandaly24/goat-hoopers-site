/**
 * weekly-player-evidence.test.ts — ObservedPlayerWeek adapter (issue #190).
 *
 * Fixtures are synthetic but shaped from the live receipts in
 * docs/weekly-player-evidence.md: the matchup payload key set, the state
 * payload's leg semantics, and the all-zero unplayed-week trap. Sources are
 * injected fakes (rule 11); nothing here touches the network or sleeper.ts.
 */
import { describe, expect, it, vi } from "vitest";
import {
  createWeeklyPlayerEvidence,
  resolveObservedWeekContext,
  shapeObservedPlayerWeek,
  type ObservedPlayerWeekResult,
  type WeeklyEvidenceSources,
} from "../weekly-player-evidence";

/* ---------- fixtures ---------- */

const STATE = {
  week: 6,
  leg: 6,
  season: "2026",
  league_season: "2026",
  season_type: "regular",
  previous_season: "2025",
  season_start_date: "2026-10-20",
  season_has_scores: true,
};

const LEAGUE = {
  league_id: "1387473752807190528",
  season: "2026",
  status: "in_season",
};

/**
 * Team 3's week roster: a (recorded), b (recorded zero), c (recorded),
 * d (null in the points map), e (absent from the points map), f (departed —
 * not on the current roster). "a" appears twice in the source list.
 * Current roster: a, b, c, d, e, g — g joined after the week (unrecorded).
 */
const TEAM3_ENTRY = {
  roster_id: 3,
  matchup_id: 2,
  points: 43.75,
  custom_points: null,
  players: ["a", "b", "c", "d", "e", "f", "a"],
  players_points: { a: 31.25, b: 0, c: 12.5, d: null },
  starters: ["a", "b", "c"],
  starters_points: [31.25, 0, 12.5],
};

function matchupEntry(rosterId: number) {
  return {
    roster_id: rosterId,
    matchup_id: Math.ceil(rosterId / 2),
    points: 100,
    custom_points: null,
    players: [`p${rosterId}`],
    players_points: { [`p${rosterId}`]: 10 },
    starters: [`p${rosterId}`],
    starters_points: [10],
  };
}

/** All ten teams in one payload, with team 3's rich entry swapped in. */
function tenTeamMatchups() {
  return Array.from({ length: 10 }, (_, i) =>
    i + 1 === 3 ? TEAM3_ENTRY : matchupEntry(i + 1),
  );
}

function rosters() {
  return Array.from({ length: 10 }, (_, i) => ({
    roster_id: i + 1,
    players:
      i + 1 === 3 ? ["a", "b", "c", "d", "e", "g"] : [`p${i + 1}`],
  }));
}

function makeSources(
  overrides: Partial<WeeklyEvidenceSources> = {},
): WeeklyEvidenceSources {
  return {
    loadState: vi.fn(async () => STATE),
    loadLeague: vi.fn(async () => LEAGUE),
    loadRosters: vi.fn(async () => rosters()),
    loadMatchups: vi.fn(async () => tenTeamMatchups()),
    ...overrides,
  };
}

function makeAdapter(
  overrides: Partial<WeeklyEvidenceSources> = {},
  options: { now?: () => number; matchupCacheTtlMs?: number } = {},
) {
  const sources = makeSources(overrides);
  const adapter = createWeeklyPlayerEvidence({ sources, ...options });
  return { adapter, sources };
}

/** Copy of a fixture with keys removed (absent-field test cases). */
function withoutKeys(
  fixture: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const out = { ...fixture };
  for (const key of keys) delete out[key];
  return out;
}

function expectUnavailable(
  result: ObservedPlayerWeekResult,
  reason: string,
) {
  expect(result.status).toBe("unavailable");
  if (result.status === "unavailable") expect(result.reason).toBe(reason);
}

/* ---------- happy path + contract shape ---------- */

describe("getObservedPreviousWeek — available evidence", () => {
  it("returns canonical league/season/week, recorded points and coverage for the target team", async () => {
    const { adapter, sources } = makeAdapter();
    const result = await adapter.getObservedPreviousWeek(3);
    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    const { evidence } = result;
    expect(evidence.kind).toBe("observed-player-week");
    expect(evidence.leagueId).toBe("1387473752807190528");
    expect(evidence.season).toBe("2026");
    expect(evidence.week).toBe(5); // leg 6 - 1; the current week is never certified
    expect(evidence.teamId).toBe(3);
    expect(sources.loadMatchups).toHaveBeenCalledTimes(1);
    expect(sources.loadMatchups).toHaveBeenCalledWith(5);
    expect(evidence.rosterPlayerIds).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(evidence.players).toEqual([
      { playerId: "a", fantasyPoints: 31.25, participation: "unknown", gamesPlayed: null },
      { playerId: "b", fantasyPoints: 0, participation: "unknown", gamesPlayed: null },
      { playerId: "c", fantasyPoints: 12.5, participation: "unknown", gamesPlayed: null },
      { playerId: "d", fantasyPoints: null, participation: "unknown", gamesPlayed: null },
      { playerId: "e", fantasyPoints: null, participation: "unknown", gamesPlayed: null },
    ]);
    expect(evidence.coverage).toEqual({
      weekRosterCount: 6,
      currentRosterCount: 6,
      recordedCount: 3,
      departedPlayerIds: ["f"],
      unrecordedPlayerIds: ["g"],
      missingPointPlayerIds: ["d", "e"],
      invalidPointPlayerIds: [],
      duplicateSourcePlayerIds: ["a"],
    });
  });

  it("preserves source values exactly and keeps zero a recorded zero with participation unknown", async () => {
    const { adapter } = makeAdapter();
    const result = await adapter.getObservedPreviousWeek(3);
    if (result.status !== "available") throw new Error("expected available");
    const zero = result.evidence.players.find((p) => p.playerId === "b");
    expect(zero?.fantasyPoints).toBe(0);
    expect(zero?.participation).toBe("unknown");
    expect(zero?.gamesPlayed).toBeNull();
    const top = result.evidence.players.find((p) => p.playerId === "a");
    expect(top?.fantasyPoints).toBe(31.25); // no rounding, no rescoring
  });

  it("is visibly not a CompletedPlayerWeek: no period bounds, no completion flag, no games gate", async () => {
    const { adapter } = makeAdapter();
    const result = await adapter.getObservedPreviousWeek(3);
    if (result.status !== "available") throw new Error("expected available");
    expect(result.evidence).not.toHaveProperty("startsAt");
    expect(result.evidence).not.toHaveProperty("endsAt");
    expect(result.evidence).not.toHaveProperty("complete");
    for (const row of result.evidence.players) {
      expect(row).not.toHaveProperty("injuryNote");
      expect(row.gamesPlayed).toBeNull();
      expect(row.participation).toBe("unknown");
    }
  });

  it("serves all ten teams from the single matchup read, and reuses it across teams within the TTL", async () => {
    const { adapter, sources } = makeAdapter();
    const third = await adapter.getObservedPreviousWeek(3);
    const seventh = await adapter.getObservedPreviousWeek(7);
    expect(third.status).toBe("available");
    expect(seventh.status).toBe("available");
    if (seventh.status === "available") {
      expect(seventh.evidence.players).toEqual([
        { playerId: "p7", fantasyPoints: 10, participation: "unknown", gamesPlayed: null },
      ]);
    }
    expect(sources.loadMatchups).toHaveBeenCalledTimes(1);
  });
});

/* ---------- row-level validation ---------- */

describe("shapeObservedPlayerWeek — row handling", () => {
  const context = {
    leagueId: "1387473752807190528",
    season: "2026",
    currentWeek: 6,
    targetWeek: 5,
  };

  function shape(entry: unknown, currentPlayers: string[]) {
    return shapeObservedPlayerWeek({
      context,
      teamId: 3,
      rostersRaw: [{ roster_id: 3, players: currentPlayers }],
      matchupsRaw: [entry],
    });
  }

  it("marks non-numeric and non-finite points values invalid, never preserving them", () => {
    const result = shape(
      {
        roster_id: 3,
        players: ["a", "b", "c"],
        players_points: { a: "12.5", b: Number.NaN, c: Number.POSITIVE_INFINITY },
      },
      ["a", "b", "c"],
    );
    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    expect(result.evidence.coverage.invalidPointPlayerIds).toEqual(["a", "b", "c"]);
    expect(result.evidence.coverage.recordedCount).toBe(0);
    expect(result.evidence.players.every((p) => p.fantasyPoints === null)).toBe(true);
  });

  it("rejects an entry with no players_points map instead of inventing points", () => {
    const result = shape({ roster_id: 3, players: ["a"] }, ["a"]);
    expectUnavailable(result, "matchups-invalid");
  });

  it("rejects duplicate matchup entries for the same roster as ambiguous", () => {
    const entry = {
      roster_id: 3,
      players: ["a"],
      players_points: { a: 5 },
    };
    const result = shapeObservedPlayerWeek({
      context,
      teamId: 3,
      rostersRaw: [{ roster_id: 3, players: ["a"] }],
      matchupsRaw: [entry, entry],
    });
    expectUnavailable(result, "matchups-invalid");
  });

  it("reports a missing entry and a missing current roster distinctly", () => {
    const missingEntry = shapeObservedPlayerWeek({
      context,
      teamId: 3,
      rostersRaw: [{ roster_id: 3, players: ["a"] }],
      matchupsRaw: [{ roster_id: 4, players: ["a"], players_points: { a: 5 } }],
    });
    expectUnavailable(missingEntry, "matchup-entry-missing");
    const missingRoster = shapeObservedPlayerWeek({
      context,
      teamId: 3,
      rostersRaw: [{ roster_id: 4, players: ["a"] }],
      matchupsRaw: [{ roster_id: 3, players: ["a"], players_points: { a: 5 } }],
    });
    expectUnavailable(missingRoster, "team-not-found");
  });
});

/* ---------- completion / week determination ---------- */

describe("resolveObservedWeekContext — completion gates", () => {
  it("certifies leg - 1 as the first completed week at the season boundary (leg 2 → week 1)", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 2, leg: 2 },
      LEAGUE,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.currentWeek).toBe(2);
      expect(result.context.targetWeek).toBe(1);
    }
  });

  it("falls back to week when leg is absent, as league.ts does", () => {
    const result = resolveObservedWeekContext(
      withoutKeys(STATE, ["leg"]),
      LEAGUE,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.context.targetWeek).toBe(5);
  });

  it("rejects preseason state (season_type pre, leg 0) even when the payload is all zeros", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 1, leg: 0, season_type: "pre", season_has_scores: false },
      LEAGUE,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("preseason");
  });

  it("rejects week 1 in progress: no completed week exists yet", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 1, leg: 1 },
      LEAGUE,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no-completed-week");
  });

  it("rejects state whose leg and week disagree, and state with neither", () => {
    const mismatch = resolveObservedWeekContext(
      { ...STATE, week: 5, leg: 6 },
      LEAGUE,
    );
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.reason).toBe("state-invalid");
    const missing = resolveObservedWeekContext(
      withoutKeys(STATE, ["leg", "week"]),
      LEAGUE,
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toBe("state-invalid");
  });

  it("rejects a rolled-over season: state season must equal league season", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, season: "2027", league_season: "2027" },
      LEAGUE,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("season-mismatch");
  });

  it("never lets league status certify a week: a complete league with preseason state is still preseason", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 1, leg: 0, season_type: "pre" },
      { ...LEAGUE, status: "complete" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("preseason");
  });

  it("rejects post-season state for this narrowed regular-season adapter", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, season_type: "post" },
      LEAGUE,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unsupported-season-type");
  });
});

/* ---------- source failure honesty ---------- */

describe("getObservedPreviousWeek — source failures are explicit unavailables, never throws", () => {
  it("maps a state load failure to state-unavailable", async () => {
    const { adapter } = makeAdapter({
      loadState: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    expectUnavailable(await adapter.getObservedPreviousWeek(3), "state-unavailable");
  });

  it("maps a matchups load failure to matchups-unavailable", async () => {
    const { adapter } = makeAdapter({
      loadMatchups: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    expectUnavailable(await adapter.getObservedPreviousWeek(3), "matchups-unavailable");
  });

  it("treats an empty matchups payload as unavailable, not as a week of zeros", async () => {
    const { adapter } = makeAdapter({
      loadMatchups: vi.fn(async () => []),
    });
    expectUnavailable(await adapter.getObservedPreviousWeek(3), "matchups-unavailable");
  });
});

/* ---------- cache bounds ---------- */

describe("matchup payload cache", () => {
  it("re-reads after the TTL and when the target week advances", async () => {
    let t = 1_000_000;
    const now = () => t;
    const { adapter, sources } = makeAdapter({}, { now, matchupCacheTtlMs: 60_000 });
    await adapter.getObservedPreviousWeek(3);
    await adapter.getObservedPreviousWeek(4);
    expect(sources.loadMatchups).toHaveBeenCalledTimes(1);
    t += 60_001; // past the TTL: revisions are re-read, stale payloads are not served
    await adapter.getObservedPreviousWeek(3);
    expect(sources.loadMatchups).toHaveBeenCalledTimes(2);
    // The state advances: a new target week is a new read even within the TTL.
    sources.loadState = vi.fn(async () => ({ ...STATE, week: 7, leg: 7 }));
    await adapter.getObservedPreviousWeek(3);
    expect(sources.loadMatchups).toHaveBeenCalledTimes(3);
    expect(sources.loadMatchups).toHaveBeenLastCalledWith(6);
  });
});
