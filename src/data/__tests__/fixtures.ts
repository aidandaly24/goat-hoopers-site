/**
 * fixtures.ts — tiny synthetic fixtures for offline regression tests.
 *
 * Everything here is fake and credential-free. Fixtures are intentionally
 * minimal: just enough shape for the domain transforms under test.
 * Units: Team totals are hundredths; Matchup scores are raw fantasy
 * points; stock prices are FAAB dollars (stored cents convert once).
 */
import type { Matchup } from "@/domain/matchup";
import type { Team } from "@/domain/team";
import type { RawTransaction } from "@/data/sleeper";

/** Two minimal teams, A (id "1") and B (id "2"). */
export function teamA(overrides: Partial<Team> = {}): Team {
  return {
    id: "1",
    name: "Alpha",
    managerName: "amy",
    avatar: null,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    ...overrides,
  };
}

export function teamB(overrides: Partial<Team> = {}): Team {
  return {
    id: "2",
    name: "Beta",
    managerName: "bob",
    avatar: null,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    ...overrides,
  };
}

/** A completed matchup in `week` where A beats B (raw fantasy points). */
export function winForA(week: number, homePts = 100, awayPts = 90): Matchup {
  return {
    week,
    home: teamA(),
    away: teamB(),
    homePoints: homePts,
    awayPoints: awayPts,
  };
}

/** A completed matchup in `week` where B beats A. */
export function winForB(week: number, homePts = 90, awayPts = 100): Matchup {
  return {
    week,
    home: teamA(),
    away: teamB(),
    homePoints: homePts,
    awayPoints: awayPts,
  };
}

/** An upcoming (unplayed) matchup in `week` — null scores, never zero. */
export function pendingMatchup(week: number): Matchup {
  return {
    week,
    home: teamA(),
    away: teamB(),
    homePoints: null,
    awayPoints: null,
  };
}

/** A finalized tie — ends streaks, distinct from pending. */
export function tiedMatchup(week: number, pts = 95): Matchup {
  return {
    week,
    home: teamA(),
    away: teamB(),
    homePoints: pts,
    awayPoints: pts,
  };
}

type RawTxOverrides = Partial<RawTransaction>;

/** Minimal raw Sleeper transaction. Defaults to a week-1 free-agent add. */
export function rawTransaction(overrides: RawTxOverrides = {}): RawTransaction {
  return {
    transaction_id: "tx-1",
    type: "free_agent",
    leg: 1,
    created: Date.parse("2026-10-01T12:00:00Z"),
    adds: { p1: 1 },
    drops: null,
    draft_picks: [],
    ...overrides,
  };
}

/** A two-sided trade: roster 1 gets p1, roster 2 gets p2. */
export function rawTrade(overrides: RawTxOverrides = {}): RawTransaction {
  return rawTransaction({
    transaction_id: "trade-1",
    type: "trade",
    leg: 2,
    created: Date.parse("2026-10-07T12:00:00Z"),
    adds: { p1: 1, p2: 2 },
    drops: { p1: 2, p2: 1 },
    ...overrides,
  });
}

/** A waiver claim with a FAAB bid. */
export function rawWaiver(overrides: RawTxOverrides = {}): RawTransaction {
  return rawTransaction({
    transaction_id: "waiver-1",
    type: "waiver",
    settings: { waiver_bid: 15 },
    ...overrides,
  });
}

/** Minimal player directory for name resolution in tests. */
export function playerDirectory(): Record<string, { full_name: string }> {
  return {
    p1: { full_name: "Player One" },
    p2: { full_name: "Player Two" },
    p3: { full_name: "Player Three" },
  };
}
