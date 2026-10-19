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

/** Fixed clock for deterministic context validation: after the 2026
 *  season start (2026-10-20) in the STATE fixture. */
const FIXED_NOW = Date.UTC(2026, 10, 2, 12, 0, 0);

function makeAdapter(
  overrides: Partial<WeeklyEvidenceSources> = {},
  options: { now?: () => number; matchupCacheTtlMs?: number } = {},
) {
  const sources = makeSources(overrides);
  const adapter = createWeeklyPlayerEvidence({
    sources,
    now: options.now ?? (() => FIXED_NOW),
    matchupCacheTtlMs: options.matchupCacheTtlMs,
  });
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
      FIXED_NOW,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.currentWeek).toBe(2);
      expect(result.context.targetWeek).toBe(1);
    }
  });

  it("rejects state with week but no leg: week alone does not certify a completed score window", () => {
    const result = resolveObservedWeekContext(
      withoutKeys(STATE, ["leg"]),
      LEAGUE,
      FIXED_NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state-invalid");
  });

  it("rejects a malformed season even when state and league agree on it", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, season: "bad", league_season: "bad" },
      { ...LEAGUE, season: "bad" },
      FIXED_NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state-invalid");
  });

  it("rejects a regular leg-2 state whose season_start_date is still in the future", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 2, leg: 2, season_start_date: "2026-11-03" },
      LEAGUE,
      FIXED_NOW, // 2026-11-02: the start date is tomorrow
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state-invalid");
  });

  it("rejects a season_start_date that contradicts the season year", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, season_start_date: "2025-10-21" },
      LEAGUE,
      FIXED_NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state-invalid");
  });

  it("rejects preseason state (season_type pre, leg 0) even when the payload is all zeros", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 1, leg: 0, season_type: "pre", season_has_scores: false },
      LEAGUE,
      FIXED_NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("preseason");
  });

  it("rejects week 1 in progress: no completed week exists yet", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 1, leg: 1 },
      LEAGUE,
      FIXED_NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no-completed-week");
  });

  it("rejects state whose leg and week disagree, and state with neither", () => {
    const mismatch = resolveObservedWeekContext(
      { ...STATE, week: 5, leg: 6 },
      LEAGUE,
      FIXED_NOW,
    );
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.reason).toBe("state-invalid");
    const missing = resolveObservedWeekContext(
      withoutKeys(STATE, ["leg", "week"]),
      LEAGUE,
      FIXED_NOW,
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toBe("state-invalid");
  });

  it("rejects a rolled-over season: state season must equal league season", () => {
    const result = resolveObservedWeekContext(
      {
        ...STATE,
        season: "2027",
        league_season: "2027",
        season_start_date: "2027-10-19",
      },
      LEAGUE,
      Date.UTC(2027, 10, 2),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("season-mismatch");
  });

  it("rejects a league payload with no valid league_id instead of certifying a nullable identity", () => {
    const missing = resolveObservedWeekContext(
      STATE,
      withoutKeys(LEAGUE, ["league_id"]),
      FIXED_NOW,
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toBe("league-invalid");
    const wrongType = resolveObservedWeekContext(
      STATE,
      { ...LEAGUE, league_id: 1387473752807190528 },
      FIXED_NOW,
    );
    expect(wrongType.ok).toBe(false);
    if (!wrongType.ok) expect(wrongType.reason).toBe("league-invalid");
  });

  it("never lets league status certify a week: a complete league with preseason state is still preseason", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, week: 1, leg: 0, season_type: "pre" },
      { ...LEAGUE, status: "complete" },
      FIXED_NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("preseason");
  });

  it("rejects post-season state for this narrowed regular-season adapter", () => {
    const result = resolveObservedWeekContext(
      { ...STATE, season_type: "post" },
      LEAGUE,
      FIXED_NOW,
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
    let t = Date.UTC(2026, 10, 2, 12, 0, 0);
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

/* ---------- review regressions (PR #197, dot's counterexamples) ---------- */

/** One-team-3 payload whose only player "a" carries the given points. */
function singlePlayerMatchups(points: number) {
  return Array.from({ length: 10 }, (_, i) =>
    i + 1 === 3
      ? {
          roster_id: 3,
          matchup_id: 2,
          points,
          custom_points: null,
          players: ["a"],
          players_points: { a: points },
          starters: ["a"],
          starters_points: [points],
        }
      : matchupEntry(i + 1),
  );
}

describe("review regressions — cache identity (PR #197 finding 1)", () => {
  it("never serves league A's points under league B: a league change inside the TTL re-reads", async () => {
    const leg2State = { ...STATE, week: 2, leg: 2 };
    const { adapter, sources } = makeAdapter({
      loadState: vi.fn(async () => leg2State),
      loadLeague: vi.fn(async () => ({ ...LEAGUE, league_id: "league-a" })),
      loadMatchups: vi
        .fn()
        .mockResolvedValueOnce(singlePlayerMatchups(12.5))
        .mockResolvedValue(singlePlayerMatchups(99)),
    });
    sources.loadRosters = vi.fn(async () =>
      rosters().map((r) => (r.roster_id === 3 ? { ...r, players: ["a"] } : r)),
    );
    const first = await adapter.getObservedPreviousWeek(3);
    if (first.status !== "available") throw new Error("expected available");
    expect(first.evidence.leagueId).toBe("league-a");
    expect(first.evidence.week).toBe(1);
    expect(first.evidence.players[0]?.fantasyPoints).toBe(12.5);
    // Same factory, same TTL window: only the league identity changes.
    sources.loadLeague = vi.fn(async () => ({ ...LEAGUE, league_id: "league-b" }));
    const second = await adapter.getObservedPreviousWeek(3);
    if (second.status !== "available") throw new Error("expected available");
    expect(second.evidence.leagueId).toBe("league-b");
    expect(second.evidence.players[0]?.fantasyPoints).toBe(99); // fresh read, not A's cached 12.5
    expect(sources.loadMatchups).toHaveBeenCalledTimes(2);
  });

  it("never serves one season's points under another: a season change inside the TTL re-reads", async () => {
    const leg2State2026 = { ...STATE, week: 2, leg: 2 };
    // No season_start_date: the field is optional; absence must not block.
    const leg2State2027 = withoutKeys(
      { ...STATE, week: 2, leg: 2, season: "2027", league_season: "2027" },
      ["season_start_date"],
    );
    const { adapter, sources } = makeAdapter({
      loadState: vi.fn(async () => leg2State2026),
      loadLeague: vi.fn(async () => LEAGUE),
      loadMatchups: vi
        .fn()
        .mockResolvedValueOnce(singlePlayerMatchups(12.5))
        .mockResolvedValue(singlePlayerMatchups(99)),
    });
    sources.loadRosters = vi.fn(async () =>
      rosters().map((r) => (r.roster_id === 3 ? { ...r, players: ["a"] } : r)),
    );
    const first = await adapter.getObservedPreviousWeek(3);
    if (first.status !== "available") throw new Error("expected available");
    expect(first.evidence.season).toBe("2026");
    expect(first.evidence.players[0]?.fantasyPoints).toBe(12.5);
    sources.loadState = vi.fn(async () => leg2State2027);
    sources.loadLeague = vi.fn(async () => ({ ...LEAGUE, season: "2027" }));
    const second = await adapter.getObservedPreviousWeek(3);
    if (second.status !== "available") throw new Error("expected available");
    expect(second.evidence.season).toBe("2027");
    expect(second.evidence.week).toBe(1);
    expect(second.evidence.players[0]?.fantasyPoints).toBe(99);
    expect(sources.loadMatchups).toHaveBeenCalledTimes(2);
  });
});

describe("review regressions — single-flight (PR #197 finding 2)", () => {
  it("shares one in-flight matchup load across ten concurrent team calls", async () => {
    let calls = 0;
    const { adapter } = makeAdapter({
      loadMatchups: vi.fn(async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return tenTeamMatchups();
      }),
    });
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => adapter.getObservedPreviousWeek(i + 1)),
    );
    expect(results.every((r) => r.status === "available")).toBe(true);
    expect(calls).toBe(1);
  });

  it("shares one failing load across concurrent callers, then retries cleanly on the next call", async () => {
    let calls = 0;
    const { adapter } = makeAdapter({
      loadMatchups: vi.fn(async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (calls === 1) throw new Error("boom");
        return tenTeamMatchups();
      }),
    });
    const results = await Promise.all(
      [1, 2, 3].map((teamId) => adapter.getObservedPreviousWeek(teamId)),
    );
    for (const result of results) expectUnavailable(result, "matchups-unavailable");
    expect(calls).toBe(1); // the failure was shared, not fanned out
    // The failed load did not poison the slot: a later call retries.
    const retry = await adapter.getObservedPreviousWeek(3);
    expect(retry.status).toBe("available");
    expect(calls).toBe(2);
  });
});

describe("review regressions — duplicate current roster (PR #197 finding 3)", () => {
  it("rejects two different current-roster entries for the same roster as ambiguous", async () => {
    const { adapter } = makeAdapter({
      loadRosters: vi.fn(async () => [
        { roster_id: 1, players: ["x"] },
        { roster_id: 1, players: ["y"] },
        ...rosters().slice(1),
      ]),
    });
    expectUnavailable(await adapter.getObservedPreviousWeek(1), "rosters-invalid");
  });
});

describe("review regressions — pre-start context (PR #197 finding 4)", () => {
  it("returns unavailable, not a week of zeros, for a regular leg-2 state whose season starts tomorrow", async () => {
    const zeroMatchups = Array.from({ length: 10 }, (_, i) => ({
      roster_id: i + 1,
      matchup_id: Math.ceil((i + 1) / 2),
      points: 0,
      custom_points: null,
      players: [`p${i + 1}`],
      players_points: { [`p${i + 1}`]: 0 },
      starters: [`p${i + 1}`],
      starters_points: [0],
    }));
    const { adapter } = makeAdapter({
      loadState: vi.fn(async () => ({
        ...STATE,
        week: 2,
        leg: 2,
        season_start_date: "2026-11-03", // tomorrow at FIXED_NOW (2026-11-02)
      })),
      loadMatchups: vi.fn(async () => zeroMatchups),
    });
    expectUnavailable(await adapter.getObservedPreviousWeek(3), "state-invalid");
  });
});
