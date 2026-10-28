import { describe, expect, it, vi } from "vitest";
import { isLineupPowerSnapshot } from "@/domain/lineup-power";
import {
  buildLineupPowerSnapshot, buildLineupPowerTeam, lineupPowerSlotContribution,
  loadLineupPowerEvidence, produceLineupPowerSnapshot,
  type LineupPowerDeps, type LineupPowerEvidence, type LineupPowerSlotEvidence, type LineupPowerTeamEvidence,
} from "../lineup-power";
import type { RawLeague, RawNbaState, RawRoster } from "../sleeper";

const AS_OF = "2026-10-27T14:00:00.000Z";

const slot = (playerId: string, over: Partial<LineupPowerSlotEvidence> = {}): LineupPowerSlotEvidence => ({
  playerId, lockedPoints: null, finalPoints: null, projectionPpg: 20, projectionBasis: "current", ...over,
});
const eleven = (base: number, over: Partial<LineupPowerSlotEvidence> = {}): LineupPowerSlotEvidence[] =>
  Array.from({ length: 11 }, (_, i) => slot(String(base + i), over));
const teamEvidence = (rosterId: string, starters: LineupPowerSlotEvidence[]): LineupPowerTeamEvidence => ({ rosterId, starters });
const evidence = (teams: LineupPowerTeamEvidence[], over: Partial<LineupPowerEvidence> = {}): LineupPowerEvidence => ({
  asOf: AS_OF, week: 3, teams, ...over,
});
const leagueOf = (teams: LineupPowerTeamEvidence[]) => evidence(teams);

describe("slot contribution — lock-in semantics", () => {
  it("a locked slot contributes its locked game only, never a projection on top", () => {
    expect(lineupPowerSlotContribution(slot("1", { lockedPoints: 33.5, projectionPpg: 28 })))
      .toEqual({ points: 33.5, kind: "locked", basis: null });
  });

  it("a slot with no games remaining contributes its determinate final counted points", () => {
    expect(lineupPowerSlotContribution(slot("1", { finalPoints: 12.25, projectionPpg: 28 })))
      .toEqual({ points: 12.25, kind: "final", basis: null });
  });

  it("an open slot contributes exactly one projected counted game at observed PPG", () => {
    // The evidence carries no games-remaining multiplier by design: one
    // counted game per slot, so a 20-PPG player contributes 20, not 60.
    expect(lineupPowerSlotContribution(slot("1", { projectionPpg: 20 })))
      .toEqual({ points: 20, kind: "projected", basis: "current" });
  });

  it("a proven zero lock is a real contribution of 0, not missing evidence", () => {
    expect(lineupPowerSlotContribution(slot("1", { lockedPoints: 0 })))
      .toEqual({ points: 0, kind: "locked", basis: null });
  });

  it("structurally inconsistent evidence contributes nothing", () => {
    expect(lineupPowerSlotContribution(slot("1", { projectionPpg: 20, projectionBasis: null }))).toBeNull();
    expect(lineupPowerSlotContribution(slot("1", { projectionPpg: null, projectionBasis: "current" }))).toBeNull();
    expect(lineupPowerSlotContribution(slot("1", { lockedPoints: -4 }))).toBeNull();
    expect(lineupPowerSlotContribution(slot("1", { projectionPpg: Number.NaN }))).toBeNull();
    expect(lineupPowerSlotContribution(slot("1", { projectionPpg: null, projectionBasis: null }))).toBeNull();
  });
});

describe("team assembly and coverage", () => {
  it("complete: 11 current-basis projections sum once each", () => {
    const team = buildLineupPowerTeam(teamEvidence("1", eleven(100, { projectionPpg: 20 })));
    expect(team).toEqual({ rosterId: "1", projectedCountedPoints: 220, coverage: "complete", slotsProjected: 11 });
  });

  it("locked and final slots count toward the total at their counted values", () => {
    const starters = eleven(100, { projectionPpg: 20 });
    starters[0] = slot("100", { lockedPoints: 41.5, projectionPpg: 30 });
    starters[1] = slot("101", { finalPoints: 9.5, projectionPpg: 30 });
    const team = buildLineupPowerTeam(teamEvidence("1", starters));
    expect(team.projectedCountedPoints).toBe(41.5 + 9.5 + 9 * 20);
    expect(team.coverage).toBe("complete");
    expect(team.slotsProjected).toBe(11);
  });

  it("partial: a full 11-slot total resting on any prior-season-only projection is flagged, not hidden", () => {
    const starters = eleven(100, { projectionPpg: 20 });
    starters[5] = slot("105", { projectionPpg: 18, projectionBasis: "prior" });
    const team = buildLineupPowerTeam(teamEvidence("1", starters));
    expect(team).toEqual({ rosterId: "1", projectedCountedPoints: 218, coverage: "partial", slotsProjected: 11 });
  });

  it("unavailable: one slot without evidence nulls the total — no partial sum is emitted", () => {
    const starters = eleven(100, { projectionPpg: 20 });
    starters[7] = slot("107", { projectionPpg: null, projectionBasis: null });
    const team = buildLineupPowerTeam(teamEvidence("1", starters));
    expect(team).toEqual({ rosterId: "1", projectedCountedPoints: null, coverage: "unavailable", slotsProjected: 10 });
  });

  it("unavailable: a short or over-long lineup cannot support a total (legal 11 only)", () => {
    expect(buildLineupPowerTeam(teamEvidence("1", eleven(100).slice(0, 10))).coverage).toBe("unavailable");
    const twelve = [...eleven(100), slot("999")];
    const team = buildLineupPowerTeam(teamEvidence("1", twelve));
    expect(team.coverage).toBe("unavailable");
    expect(team.projectedCountedPoints).toBeNull();
    expect(team.slotsProjected).toBe(11); // contributions counted, capped at the legal 11
  });
});

describe("snapshot assembly", () => {
  const tenTeams = () => Array.from({ length: 10 }, (_, n) => teamEvidence(String(n + 1), eleven(1000 + n * 100, { projectionPpg: 20 + n })));

  it("produces a contract-valid snapshot with teams ordered by roster id", () => {
    const shuffled = [...tenTeams()].reverse();
    const snap = buildLineupPowerSnapshot(leagueOf(shuffled), null);
    expect(isLineupPowerSnapshot(snap)).toBe(true);
    expect(snap.teams.map(t => t.rosterId)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(snap.week).toBe(3);
    expect(snap.horizon).toBe("next-week");
    expect(snap.priorSnapshotId).toBeNull();
    expect(snap.teams[0].projectedCountedPoints).toBe(220);
    expect(snap.teams[9].projectedCountedPoints).toBe(319);
  });

  it("is deterministic: identical evidence yields the identical content-addressed snapshot", () => {
    const a = buildLineupPowerSnapshot(leagueOf(tenTeams()), null);
    const b = buildLineupPowerSnapshot(leagueOf(tenTeams()), null);
    expect(a).toEqual(b);
    const chained = buildLineupPowerSnapshot(leagueOf(tenTeams()), a.snapshotId);
    expect(chained.priorSnapshotId).toBe(a.snapshotId);
    expect(chained.snapshotId).not.toBe(a.snapshotId);
    expect(isLineupPowerSnapshot(chained)).toBe(true);
  });
});

/* ------------------------------- loader ------------------------------- */

const SCORING = { pts: 1, reb: 1 };
const statLine = (fppgPoints: number) => ({ gp: 10, pts: fppgPoints * 10, reb: 0 });

function fakeDeps(over: Partial<LineupPowerDeps> = {}, stats: {
  current?: Record<string, Record<string, number>>;
  prior?: Record<string, Record<string, number>>;
} = {}): LineupPowerDeps {
  const rosters: RawRoster[] = Array.from({ length: 10 }, (_, n) => ({
    roster_id: n + 1,
    owner_id: `owner-${n + 1}`,
    settings: { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0 },
    players: Array.from({ length: 14 }, (_, i) => String(1000 + n * 100 + i)),
    // 11 starters; players 11..13 on each roster are bench and must never be projected.
    starters: Array.from({ length: 11 }, (_, i) => String(1000 + n * 100 + i)),
    reserve: null, taxi: null,
  }));
  const allStats: Record<string, Record<string, number>> = {};
  for (const r of rosters) for (const id of r.players) allStats[id] = statLine(20);
  return {
    league: vi.fn(async (): Promise<RawLeague> => ({
      name: "GOAT Hoopers", season: "2026", status: "in_season", total_rosters: 10,
      settings: { playoff_teams: 6, playoff_week_start: 15, divisions: 1 },
      scoring_settings: { ...SCORING },
    })),
    state: vi.fn(async (): Promise<RawNbaState> => ({
      week: 2, season_type: "regular", season: "2026", leg: 2, previous_season: "2025",
    })),
    rosters: vi.fn(async () => rosters),
    stats: vi.fn(async (season: string) => (season === "2026" ? (stats.current ?? allStats) : (stats.prior ?? {}))),
    now: () => Date.parse(AS_OF),
    ...over,
  };
}

describe("live evidence loader", () => {
  it("projects the next week (leg + 1) over the legal 11 starters only, at one game of observed PPG each", async () => {
    const ev = await loadLineupPowerEvidence(fakeDeps());
    expect(ev.week).toBe(3);
    expect(ev.asOf).toBe(AS_OF);
    expect(ev.teams).toHaveLength(10);
    for (const t of ev.teams) {
      expect(t.starters).toHaveLength(11);
      // Starters are the roster's first 11; the 3 bench ids never appear.
      expect(t.starters.map(s => s.playerId)).not.toContain(String(1000 + (Number(t.rosterId) - 1) * 100 + 11));
      for (const s of t.starters) {
        expect(s.projectionPpg).toBe(20);
        expect(s.projectionBasis).toBe("current");
        expect(s.lockedPoints).toBeNull();
        expect(s.finalPoints).toBeNull();
      }
    }
    const snap = await produceLineupPowerSnapshot(null, fakeDeps());
    expect(isLineupPowerSnapshot(snap)).toBe(true);
    expect(snap.teams.every(t => t.projectedCountedPoints === 220 && t.coverage === "complete")).toBe(true);
  });

  it("a player with prior-season evidence only makes his team partial; a player with neither makes it unavailable", async () => {
    const current: Record<string, Record<string, number>> = {};
    const prior: Record<string, Record<string, number>> = {};
    for (let n = 0; n < 10; n++) for (let i = 0; i < 14; i++) current[String(1000 + n * 100 + i)] = statLine(20);
    delete current["1105"]; // team 2, a starter: prior-season evidence only
    prior["1105"] = statLine(15);
    delete current["1207"]; // team 3, a starter: no evidence anywhere
    const snap = await produceLineupPowerSnapshot(null, fakeDeps({}, { current, prior }));
    const team2 = snap.teams.find(t => t.rosterId === "2")!;
    expect(team2.coverage).toBe("partial");
    expect(team2.projectedCountedPoints).toBe(215);
    const team3 = snap.teams.find(t => t.rosterId === "3")!;
    expect(team3).toEqual({ rosterId: "3", projectedCountedPoints: null, coverage: "unavailable", slotsProjected: 10 });
    expect(isLineupPowerSnapshot(snap)).toBe(true);
  });

  it("fails closed on a non-regular phase, a season mismatch, or a short league", async () => {
    await expect(loadLineupPowerEvidence(fakeDeps({
      state: vi.fn(async (): Promise<RawNbaState> => ({ week: 2, season_type: "pre", season: "2026", leg: 0, previous_season: "2025" })),
    }))).rejects.toThrow("lineup_power_context");
    await expect(loadLineupPowerEvidence(fakeDeps({
      rosters: vi.fn(async () => [] as RawRoster[]),
    }))).rejects.toThrow("lineup_power_evidence");
  });
});
