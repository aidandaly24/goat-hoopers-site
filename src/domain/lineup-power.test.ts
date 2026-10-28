import { describe, expect, it } from "vitest";
import {
  isLineupPowerSnapshot, lineupPowerMovement, lineupPowerRanks,
  type LineupPowerSnapshot, type LineupPowerTeam,
} from "./lineup-power";

const ID_A = `lp1:${"a".repeat(64)}`;
const ID_B = `lp1:${"b".repeat(64)}`;
const ID_C = `lp1:${"c".repeat(64)}`;

const team = (rosterId: string, over: Partial<LineupPowerTeam> = {}): LineupPowerTeam => ({
  rosterId, projectedCountedPoints: 200, coverage: "complete", slotsProjected: 11, ...over,
});

function snapshot(over: Partial<LineupPowerSnapshot> = {}): LineupPowerSnapshot {
  return {
    snapshotId: ID_A,
    asOf: "2026-10-27T14:00:00.000Z",
    week: 3,
    horizon: "next-week",
    teams: Array.from({ length: 10 }, (_, n) => team(String(n + 1), { projectedCountedPoints: 300 - n * 10 })),
    priorSnapshotId: null,
    ...over,
  };
}

describe("isLineupPowerSnapshot", () => {
  it("accepts a contract-shaped snapshot, including partial and unavailable teams", () => {
    const s = snapshot();
    s.teams[3] = team("4", { coverage: "partial" });
    s.teams[4] = team("5", { projectedCountedPoints: null, coverage: "unavailable", slotsProjected: 9 });
    expect(isLineupPowerSnapshot(s)).toBe(true);
    expect(isLineupPowerSnapshot({ ...s, priorSnapshotId: ID_B })).toBe(true);
  });

  it("rejects an unavailable team carrying a total — a partial sum is not a rank input", () => {
    const s = snapshot();
    s.teams[0] = team("1", { projectedCountedPoints: 180, coverage: "unavailable", slotsProjected: 9 });
    expect(isLineupPowerSnapshot(s)).toBe(false);
  });

  it("rejects a complete/partial team short of 11 slots or without a total", () => {
    const short = snapshot();
    short.teams[0] = team("1", { slotsProjected: 10 });
    expect(isLineupPowerSnapshot(short)).toBe(false);
    const noTotal = snapshot();
    noTotal.teams[0] = team("1", { projectedCountedPoints: null });
    expect(isLineupPowerSnapshot(noTotal)).toBe(false);
  });

  it("coverage enum validation: rejects values outside the contract enum, however well-formed the rest", () => {
    for (const bad of ["unknown", null, 42]) {
      const s = snapshot();
      s.teams[0] = team("1", { coverage: bad as never });
      expect(isLineupPowerSnapshot(s)).toBe(false);
    }
  });

  it("rejects malformed identity, horizon, week and duplicate teams", () => {
    expect(isLineupPowerSnapshot(snapshot({ snapshotId: "sha256:abc" }))).toBe(false);
    expect(isLineupPowerSnapshot(snapshot({ horizon: " ROS" as never }))).toBe(false);
    expect(isLineupPowerSnapshot(snapshot({ week: 0 }))).toBe(false);
    expect(isLineupPowerSnapshot(snapshot({ week: 31 }))).toBe(false);
    expect(isLineupPowerSnapshot(snapshot({ priorSnapshotId: ID_A }))).toBe(false); // cannot chain to itself
    const dup = snapshot();
    dup.teams[1] = team("1");
    expect(isLineupPowerSnapshot(dup)).toBe(false);
    expect(isLineupPowerSnapshot(snapshot({ teams: snapshot().teams.slice(0, 9) }))).toBe(false);
  });
});

describe("lineupPowerRanks", () => {
  it("ranks by projected counted points descending; unavailable teams are unranked, never estimated in", () => {
    const s = snapshot();
    s.teams[9] = team("10", { projectedCountedPoints: null, coverage: "unavailable", slotsProjected: 7 });
    const ranks = lineupPowerRanks(s);
    expect(ranks["1"]).toBe(1);
    expect(ranks["9"]).toBe(9);
    expect(ranks["10"]).toBeNull();
  });

  it("tied totals share a rank and the next distinct total skips ahead", () => {
    const s = snapshot({
      teams: [250, 250, 240, 230, 220, 210, 200, 190, 180, 170].map((points, n) =>
        team(String(n + 1), { projectedCountedPoints: points })),
    });
    const ranks = lineupPowerRanks(s);
    expect(ranks["1"]).toBe(1);
    expect(ranks["2"]).toBe(1);
    expect(ranks["3"]).toBe(3);
  });
});

describe("lineupPowerMovement", () => {
  it("positive movement means the team climbed vs the prior snapshot", () => {
    const prior = snapshot({ snapshotId: ID_B, week: 2 });
    const current = snapshot({ priorSnapshotId: ID_B });
    // Team 10 was last in the prior snapshot's totals by construction; flip the order.
    current.teams = current.teams.map(t => team(t.rosterId, { projectedCountedPoints: 100 + Number(t.rosterId) * 10 }));
    const movement = lineupPowerMovement(current, prior);
    expect(movement["10"]).toBe(9); // was rank 10, now rank 1
    expect(movement["1"]).toBe(-9); // was rank 1, now rank 10
  });

  it("movement prior-chain validation: a missing or mismatched prior chain yields null movement everywhere", () => {
    const prior = snapshot({ snapshotId: ID_B, week: 2 });
    // First snapshot: priorSnapshotId is null, so no prior is comparable,
    // even a well-formed one from the week before.
    const first = snapshot();
    expect(Object.values(lineupPowerMovement(first, prior)).every(m => m === null)).toBe(true);
    // Chained to a different snapshot than the one supplied: the chain,
    // not mere ID inequality, decides comparability.
    const chained = snapshot({ priorSnapshotId: ID_B });
    const unrelated = snapshot({ snapshotId: ID_C, week: 2 });
    expect(Object.values(lineupPowerMovement(chained, unrelated)).every(m => m === null)).toBe(true);
  });

  it("movement is null when either snapshot leaves the team unranked, and for a snapshot against itself", () => {
    const prior = snapshot({ snapshotId: ID_B, week: 2 });
    prior.teams[0] = team("1", { projectedCountedPoints: null, coverage: "unavailable", slotsProjected: 8 });
    const current = snapshot({ priorSnapshotId: ID_B });
    expect(lineupPowerMovement(current, prior)["1"]).toBeNull();
    expect(lineupPowerMovement(current, current)["2"]).toBeNull();
  });
});
