import { describe, expect, it } from "vitest";
import {
  WEEKLY_EVIDENCE_RECEIPTS,
  getCompletedPlayerWeek,
  getPreviousCompletedPlayerWeek,
  getWeekShowcase,
  parseWeeklyEvidenceReceipt,
  type WeeklyEvidenceReceipt,
} from "../weekly-player-evidence";

function receiptWith(teams: WeeklyEvidenceReceipt["teams"]): WeeklyEvidenceReceipt {
  return {
    season: "2026",
    week: 1,
    startsAt: "2026-10-20T23:00:00Z",
    endsAt: "2026-10-26T23:00:00Z",
    generatedAt: "2026-10-26T16:00:00Z",
    generator: "scripts/generate-weekly-evidence.py",
    source: "test fixture",
    teams,
  };
}

function team(teamId: string, players: { playerId: string; gamesPlayed: number; countedPoints: number | null }[], residual = 0) {
  const computedPoints = players.reduce((sum, p) => sum + (p.countedPoints ?? 0), 0);
  return {
    teamId,
    officialPoints: computedPoints - residual,
    computedPoints,
    residual,
    status: residual === 0 ? "verified" as const : "verified-foul-residual" as const,
    players: players.map((p) => ({
      ...p,
      countedGameId: p.countedPoints === null ? null : `game-${p.playerId}`,
      locked: false,
    })),
  };
}

describe("committed week 1 receipt", () => {
  it("loads and validates", () => {
    expect(WEEKLY_EVIDENCE_RECEIPTS).toHaveLength(1);
    expect(WEEKLY_EVIDENCE_RECEIPTS[0].season).toBe("2026");
    expect(WEEKLY_EVIDENCE_RECEIPTS[0].week).toBe(1);
    expect(WEEKLY_EVIDENCE_RECEIPTS[0].teams).toHaveLength(10);
  });

  it("serves NeuralNets' verified locks at their counted values", () => {
    const week = getCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 1, teamId: "8" });
    expect(week).not.toBeNull();
    expect(week?.complete).toBe(true);
    const byId = new Map(week?.players.map((p) => [p.playerId, p]));
    // Locks verified against the authenticated matchup leg for week 1.
    expect(byId.get("1380")?.fantasyPoints).toBe(39.5); // Giannis, locked
    expect(byId.get("2086")?.fantasyPoints).toBe(29.5); // Herro, locked
    expect(byId.get("2449")?.fantasyPoints).toBe(25.0); // Daniels, locked
    expect(byId.get("1697")?.fantasyPoints).toBe(27.0); // Zubac, locked
    // Unlocked starter: final played game counts.
    expect(byId.get("1433")?.fantasyPoints).toBe(18.5); // Durant, final game
    expect(week?.players).toHaveLength(11);
  });

  it("refuses the unreconciled team instead of inventing numbers", () => {
    expect(getCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 1, teamId: "9" })).toBeNull();
  });

  it("previous-week lookup follows the current week", () => {
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: 2, teamId: "8" })?.week).toBe(1);
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: 1, teamId: "8" })).toBeNull();
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: null, teamId: "8" })).toBeNull();
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: 3, teamId: "8" })).toBeNull();
  });

  it("showcase ranks each reconciled team's counted best and reports the gap", () => {
    const showcase = getWeekShowcase(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 1 });
    expect(showcase).not.toBeNull();
    expect(showcase?.teams).toHaveLength(9);
    expect(showcase?.unavailableTeamIds).toEqual(["9"]);
    const papichooter = showcase?.teams.find((t) => t.teamId === "7");
    expect(papichooter?.topPlayers[0].fantasyPoints).toBe(53.0);
    expect(papichooter?.topPlayers).toHaveLength(3);
    const neuralNets = showcase?.teams.find((t) => t.teamId === "8");
    expect(neuralNets?.topPlayers.map((p) => p.fantasyPoints)).toEqual([39.5, 29.5, 27.0]);
    expect(getWeekShowcase(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 2 })).toBeNull();
  });
});

describe("receipt validation", () => {
  it("keeps a verified zero with participation instead of dropping it", () => {
    const receipt = receiptWith([team("4", [
      { playerId: "a", gamesPlayed: 3, countedPoints: 21.5 },
      { playerId: "b", gamesPlayed: 2, countedPoints: 0 },
    ])]);
    const week = getCompletedPlayerWeek([receipt], { season: "2026", week: 1, teamId: "4" });
    expect(week?.players.find((p) => p.playerId === "b")?.fantasyPoints).toBe(0);
    expect(week?.players.find((p) => p.playerId === "b")?.gamesPlayed).toBe(2);
  });

  it("keeps a DNP starter as null points with zero games", () => {
    const receipt = receiptWith([team("4", [
      { playerId: "a", gamesPlayed: 3, countedPoints: 21.5 },
      { playerId: "b", gamesPlayed: 0, countedPoints: null },
    ])]);
    const week = getCompletedPlayerWeek([receipt], { season: "2026", week: 1, teamId: "4" });
    const dnp = week?.players.find((p) => p.playerId === "b");
    expect(dnp?.fantasyPoints).toBeNull();
    expect(dnp?.gamesPlayed).toBe(0);
  });

  it("rejects a receipt whose rows do not sum to its recorded totals", () => {
    const bad = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }])]);
    bad.teams[0].computedPoints = 999;
    expect(parseWeeklyEvidenceReceipt(bad)).toBeNull();
  });

  it("rejects a verified status that carries a residual", () => {
    const bad = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }], 2)]);
    bad.teams[0].status = "verified";
    expect(parseWeeklyEvidenceReceipt(bad)).toBeNull();
  });

  it("rejects an impossible week period", () => {
    const bad = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }])]);
    bad.endsAt = bad.startsAt;
    expect(parseWeeklyEvidenceReceipt(bad)).toBeNull();
  });

  it("rejects counted points without a counted game", () => {
    const bad = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }])]);
    bad.teams[0].players[0].countedGameId = null;
    expect(parseWeeklyEvidenceReceipt(bad)).toBeNull();
  });

  it("returns null for a team the receipt does not cover", () => {
    const receipt = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }])]);
    expect(getCompletedPlayerWeek([receipt], { season: "2026", week: 1, teamId: "5" })).toBeNull();
  });
});
