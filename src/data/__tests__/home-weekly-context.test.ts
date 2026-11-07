import { describe, expect, it, vi } from "vitest";
import { buildHomeWeeklyContext } from "../home-weekly-context";
import { WEEKLY_EVIDENCE_RECEIPTS } from "../weekly-player-evidence";
import { buildPersonalizedHome } from "../personalized-home";
import { weeklyHomeFixture } from "@/test/home-weekly-fixture";
import { playerGuideFixture } from "@/test/personalized-home-fixture";

describe("homepage completed-week evidence integration", () => {
  it("supplies exact points to the existing member guide, intersects current ownership and excludes DNP", () => {
    const { home, receipt, weekly, market } = weeklyHomeFixture();
    const fetch = vi.spyOn(globalThis, "fetch");
    try {
      const sources = playerGuideFixture("2");
      const context = buildHomeWeeklyContext(home, [receipt], "2", sources);
      expect(context.guideSources?.form).toBe(sources.form);
      expect(context.guideSources?.completedWeek?.week).toBe(1);
      const personal = buildPersonalizedHome({ kind: "member", teamId: "2" }, home, weekly, market, null, context.guideSources);
      expect(personal.kind === "member" && personal.summary?.playerGuide.eligiblePlayed).toBe(3);
      if (personal.kind !== "member" || !personal.summary) throw new Error("Member missing");
      expect(personal.summary.playerGuide.best.map(player => player.value)).toEqual([31, 5, 0]);
      home.directory[1].players = home.directory[1].players.slice(1);
      const changed = buildPersonalizedHome({ kind: "member", teamId: "2" }, home, weekly, market, null, context.guideSources);
      expect(changed.kind === "member" && changed.summary?.playerGuide.eligiblePlayed).toBe(2);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it.each(["1", "6", "8", "9"])("keeps estimated/unreconciled team %s out of the exact guide", id => {
    const { home, receipt } = weeklyHomeFixture();
    expect(buildHomeWeeklyContext(home, [receipt], id, playerGuideFixture(id)).guideSources?.completedWeek).toBeNull();
  });

  it("keeps official extremes independent of player coverage, with all exact/estimated/no-game states", () => {
    const { home, receipt } = weeklyHomeFixture();
    const { recap } = buildHomeWeeklyContext(home, [receipt]);
    if (recap.status !== "available") throw new Error("Missing recap");
    expect(recap.teams).toHaveLength(10);
    expect(recap.studTeamIds).toEqual(["10"]);
    expect(recap.chudTeamIds).toEqual(["9"]);
    expect(recap.teams.find(team => team.id === "9")?.breakdown).toEqual({ basis: "unavailable", players: [] });
    const estimated = recap.teams.find(team => team.id === "1")!.breakdown;
    expect(estimated.basis).toBe("estimated");
    expect(estimated.players[0]).not.toHaveProperty("fantasyPoints");
    const exact = recap.teams.find(team => team.id === "2")!.breakdown;
    expect(exact.basis).toBe("verified");
    expect(exact.players.at(-1)).toMatchObject({ gamesPlayed: 0, fantasyPoints: null });
  });

  it("shares ties and withholds league awards under partial official-total coverage", () => {
    const { home, receipt } = weeklyHomeFixture();
    receipt.teams[6].officialPoints = receipt.teams[9].officialPoints;
    const tied = buildHomeWeeklyContext(home, [receipt]).recap;
    expect(tied.status === "available" && tied.studTeamIds).toEqual(["10", "7"]);
    receipt.teams.pop();
    const partial = buildHomeWeeklyContext(home, [receipt]).recap;
    expect(partial.status === "available" && partial.totalsComplete).toBe(false);
    expect(partial.status === "available" && partial.studTeamIds).toEqual([]);
  });

  it.each(["no-hub", "phase", "no-week", "mixed-weeks", "week-one", "season", "missing-receipt", "duplicate-receipt", "future-end", "future-generation"])("fails closed for %s and clears any prior supplied guide week", state => {
    const { home, receipt } = weeklyHomeFixture();
    let receipts = [receipt];
    if (state === "no-hub") home.hub = null;
    if (state === "phase") home.hub!.season.status = "off_season";
    if (state === "no-week") home.directory.forEach(entry => { entry.currentMatchup = null; });
    if (state === "mixed-weeks") home.directory[0].currentMatchup = { ...home.directory[0].currentMatchup!, week: 3 };
    if (state === "week-one") home.directory.forEach(entry => { entry.currentMatchup!.week = 1; });
    if (state === "season") home.hub!.season.seasonYear = "2027";
    if (state === "missing-receipt") receipts = [];
    if (state === "duplicate-receipt") receipts.push(receipt);
    if (state === "future-end") home.checkedAt = "2026-10-26T22:59:59Z";
    if (state === "future-generation") receipt.generatedAt = "2026-10-28T00:00:00Z";
    const result = buildHomeWeeklyContext(home, receipts, "2", playerGuideFixture("2"));
    expect(result.recap.status).toBe("unavailable");
    expect(result.guideSources?.completedWeek).toBeNull();
  });

  it("resolves departed players by ID and never presents today's new arrivals as past starters", () => {
    const { home, receipt } = weeklyHomeFixture();
    home.directory[1].players = [{ ...home.directory[1].players[0], id: "new-arrival", fullName: "New arrival" }];
    const result = buildHomeWeeklyContext(home, [receipt], "2");
    expect(result.guideSources?.completedWeek).not.toBeNull(); // Independent of market/form availability.
    if (result.recap.status !== "available") throw new Error("Missing recap");
    expect(result.recap.teams.find(team => team.id === "2")?.breakdown.players[0].name).toBe("Player 2-player-0");
    expect(JSON.stringify(result.recap)).not.toContain("New arrival");
  });

  it("wires the deployed receipt: six exact, three estimated, roster 9 unavailable", () => {
    const { home } = weeklyHomeFixture();
    const { recap } = buildHomeWeeklyContext(home, WEEKLY_EVIDENCE_RECEIPTS);
    if (recap.status !== "available") throw new Error("Missing deployed receipt");
    expect(recap.teams.filter(team => team.breakdown.basis === "verified")).toHaveLength(6);
    expect(recap.teams.filter(team => team.breakdown.basis === "estimated")).toHaveLength(3);
    expect(recap.teams.filter(team => team.breakdown.basis === "unavailable").map(team => team.id)).toEqual(["9"]);
    expect(recap.teams.reduce((sum, team) => sum + team.officialPoints, 0)).toBe(WEEKLY_EVIDENCE_RECEIPTS[0].teams.reduce((sum, team) => sum + team.officialPoints, 0));
    expect(buildHomeWeeklyContext(home, WEEKLY_EVIDENCE_RECEIPTS, "2").guideSources?.completedWeek).not.toBeNull();
  });
});
