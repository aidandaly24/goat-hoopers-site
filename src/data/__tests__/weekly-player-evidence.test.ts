import { describe, expect, it } from "vitest";
import {
  WEEKLY_EVIDENCE_RECEIPTS,
  classifyWeeklyResidual,
  getCompletedPlayerWeek,
  getPreviousCompletedPlayerWeek,
  getWeekShowcase,
  parseWeeklyEvidenceReceipt,
  type WeeklyEvidenceReceipt,
  type WeeklyTeamEvidence,
} from "../weekly-player-evidence";

function receiptWith(teams: WeeklyEvidenceReceipt["teams"]): WeeklyEvidenceReceipt {
  return {
    season: "2026",
    week: 1,
    startsAt: "2026-10-20T19:00:00Z",
    endsAt: "2026-10-26T23:00:00Z",
    generatedAt: "2026-10-26T17:30:00Z",
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
    status: residual === 0 ? "verified" as const
      : residual === 2 || residual === 4 ? "estimated-foul-residual" as const
      : "unreconciled" as const,
    evidenceComplete: true,
    players: players.map((p) => ({
      ...p,
      countedGameId: p.countedPoints === null ? null : `game-${p.playerId}`,
      locked: false,
    })),
  };
}

describe("committed week 1 receipt", () => {
  it("loads and validates with honest per-team statuses", () => {
    expect(WEEKLY_EVIDENCE_RECEIPTS).toHaveLength(1);
    const receipt = WEEKLY_EVIDENCE_RECEIPTS[0];
    expect(receipt.season).toBe("2026");
    expect(receipt.week).toBe(1);
    expect(receipt.teams).toHaveLength(10);
    const byStatus = (status: string) => receipt.teams.filter((t) => t.status === status).map((t) => t.teamId);
    expect(byStatus("verified")).toEqual(["2", "3", "4", "5", "7", "10"]);
    expect(byStatus("estimated-foul-residual")).toEqual(["1", "6", "8"]);
    expect(byStatus("unreconciled")).toEqual(["9"]);
    expect(receipt.teams.every((t) => t.evidenceComplete)).toBe(true);
  });

  it("serves a verified team's actuals through the exact-points contract", () => {
    const week = getCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 1, teamId: "7" });
    expect(week).not.toBeNull();
    expect(week?.complete).toBe(true);
    const byId = new Map(week?.players.map((p) => [p.playerId, p]));
    expect(byId.get("1970")?.fantasyPoints).toBe(53.0); // Dončić, locked
    expect(byId.get("1074")?.fantasyPoints).toBe(37.5); // Paul George, locked
    expect(week?.players).toHaveLength(11);
  });

  it("fails residual teams closed in the exact-points contract — estimates are never actuals", () => {
    // Rosters 1 (+4), 6 (+2) and 8 (+2) carry explained foul residuals.
    // Their box-score values (e.g. Durant's 18.5) must not reach the
    // guide's "Actual recorded fantasy points" contract.
    for (const teamId of ["1", "6", "8"]) {
      expect(getCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 1, teamId })).toBeNull();
      expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: 2, teamId })).toBeNull();
    }
  });

  it("refuses the unreconciled team instead of inventing numbers", () => {
    expect(getCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 1, teamId: "9" })).toBeNull();
  });

  it("previous-week lookup follows the current week", () => {
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: 2, teamId: "5" })?.week).toBe(1);
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: 1, teamId: "5" })).toBeNull();
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: null, teamId: "5" })).toBeNull();
    expect(getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", currentWeek: 3, teamId: "5" })).toBeNull();
  });

  it("showcase separates verified actuals from explicitly estimated teams", () => {
    const showcase = getWeekShowcase(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 1 });
    expect(showcase).not.toBeNull();
    expect(showcase?.teams).toHaveLength(9);
    expect(showcase?.unavailableTeamIds).toEqual(["9"]);

    const papichooter = showcase?.teams.find((t) => t.teamId === "7");
    expect(papichooter?.basis).toBe("verified");
    if (papichooter?.basis === "verified") {
      expect(papichooter.topPlayers[0].fantasyPoints).toBe(53.0);
      expect(papichooter.topPlayers).toHaveLength(3);
    }

    // NeuralNets is an estimated team: values arrive as estimatedPoints
    // with the residual disclosed, and no actual-points field exists.
    const neuralNets = showcase?.teams.find((t) => t.teamId === "8");
    expect(neuralNets?.basis).toBe("estimated-foul-residual");
    if (neuralNets?.basis === "estimated-foul-residual") {
      expect(neuralNets.officialPoints).toBe(247.5);
      expect(neuralNets.computedPoints).toBe(249.5);
      expect(neuralNets.residual).toBe(2.0);
      expect(neuralNets.topPlayers.map((p) => p.estimatedPoints)).toEqual([39.5, 29.5, 27.0]);
      expect(neuralNets.topPlayers.every((p) => !("fantasyPoints" in p))).toBe(true);
    }
    const aidan = showcase?.teams.find((t) => t.teamId === "1");
    expect(aidan?.basis).toBe("estimated-foul-residual");
    if (aidan?.basis === "estimated-foul-residual") {
      expect(aidan.residual).toBe(4.0);
    }
    expect(getWeekShowcase(WEEKLY_EVIDENCE_RECEIPTS, { season: "2026", week: 2 })).toBeNull();
  });
});

describe("residual classification", () => {
  it("only zero and positive multiples of the -2 foul unit are explainable", () => {
    expect(classifyWeeklyResidual(0)).toBe("verified");
    expect(classifyWeeklyResidual(2)).toBe("estimated-foul-residual");
    expect(classifyWeeklyResidual(4)).toBe("estimated-foul-residual");
    expect(classifyWeeklyResidual(-2)).toBe("unreconciled");
    expect(classifyWeeklyResidual(1)).toBe("unreconciled");
    expect(classifyWeeklyResidual(3)).toBe("unreconciled");
    expect(classifyWeeklyResidual(2.5)).toBe("unreconciled");
    expect(classifyWeeklyResidual(6)).toBe("unreconciled");
    expect(classifyWeeklyResidual(26)).toBe("unreconciled");
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

  it("keeps a proven-zero locked game: present in the box score, never played", () => {
    const provenZero = team("4", [
      { playerId: "a", gamesPlayed: 3, countedPoints: 21.5 },
      { playerId: "b", gamesPlayed: 0, countedPoints: 0 },
    ]);
    provenZero.players[1].locked = true;
    provenZero.players[1].countedGameId = "game-b";
    const receipt = receiptWith([provenZero]);
    const week = getCompletedPlayerWeek([receipt], { season: "2026", week: 1, teamId: "4" });
    expect(week?.players.find((p) => p.playerId === "b")?.fantasyPoints).toBe(0);
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

  it("rejects an estimated status for a residual fouls cannot explain", () => {
    for (const residual of [-2, 3]) {
      const bad = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }], residual)]);
      bad.teams[0].status = "estimated-foul-residual";
      expect(parseWeeklyEvidenceReceipt(bad)).toBeNull();
    }
  });

  it("rejects an unreconciled label on a reconciled team with complete evidence", () => {
    const bad = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }])]);
    bad.teams[0].status = "unreconciled";
    expect(parseWeeklyEvidenceReceipt(bad)).toBeNull();
  });

  it("accepts incomplete lock evidence only as unreconciled, and never serves it", () => {
    const incomplete = team("4", [
      { playerId: "a", gamesPlayed: 3, countedPoints: 21.5 },
      { playerId: "b", gamesPlayed: 2, countedPoints: null },
    ]);
    const receipt = receiptWith([{
      ...incomplete,
      status: "unreconciled" as const,
      evidenceComplete: false,
    }]);
    expect(parseWeeklyEvidenceReceipt(receipt)).not.toBeNull();
    expect(getCompletedPlayerWeek([receipt], { season: "2026", week: 1, teamId: "4" })).toBeNull();
    expect(getWeekShowcase([receipt], { season: "2026", week: 1 })?.unavailableTeamIds).toEqual(["4"]);
  });

  it("accepts incomplete unlocked evidence only as unreconciled, and never serves it", () => {
    // The shape the generator emits when an unlocked starter's derived
    // final game is unproven: he HAS validated appearances, but rejected
    // box-score data elsewhere in his week means no game may be
    // certified as counted, so his points are null. The team's sums
    // still reconcile (residual 0) — a coincidental sum must not
    // upgrade the team through either contract.
    const incomplete = team("4", [
      { playerId: "a", gamesPlayed: 3, countedPoints: 21.5 },
      { playerId: "b", gamesPlayed: 1, countedPoints: null },
    ]);
    expect(incomplete.players[1].locked).toBe(false);
    const receipt = receiptWith([{
      ...incomplete,
      status: "unreconciled" as const,
      evidenceComplete: false,
    }]);
    expect(parseWeeklyEvidenceReceipt(receipt)).not.toBeNull();
    expect(getCompletedPlayerWeek([receipt], { season: "2026", week: 1, teamId: "4" })).toBeNull();
    expect(getWeekShowcase([receipt], { season: "2026", week: 1 })?.unavailableTeamIds).toEqual(["4"]);
  });

  it("rejects a receipt that does not record evidence completeness", () => {
    // A certified zero's only proof is the generator's evidence
    // accounting; a team that records none cannot serve one.
    const provenZero = team("4", [
      { playerId: "a", gamesPlayed: 3, countedPoints: 21.5 },
      { playerId: "b", gamesPlayed: 0, countedPoints: 0 },
    ]);
    provenZero.players[1].locked = true;
    provenZero.players[1].countedGameId = "game-b";
    const bad = receiptWith([provenZero]);
    delete (bad.teams[0] as Partial<WeeklyTeamEvidence>).evidenceComplete;
    expect(parseWeeklyEvidenceReceipt(bad)).toBeNull();
  });

  it("rejects incomplete evidence dressed as verified", () => {
    const bad = receiptWith([team("4", [{ playerId: "a", gamesPlayed: 1, countedPoints: 10 }])]);
    bad.teams[0].evidenceComplete = false;
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
