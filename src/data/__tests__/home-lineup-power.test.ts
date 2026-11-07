import { describe, expect, it, vi } from "vitest";
import { buildHomeLineupPower, loadHomeLineupPowerSource } from "../home-lineup-power";
import { produceLineupPowerSnapshot, type LineupPowerDeps } from "../lineup-power";
import type { RawLeague, RawNbaState, RawRoster } from "../sleeper";
import { homeLineupPowerFixture } from "@/test/home-lineup-power-fixture";
import { weeklyHomeFixture } from "@/test/home-weekly-fixture";

const NOW = Date.parse("2026-10-27T12:00:00.000Z");
function inputs(): LineupPowerDeps {
  const rosters: RawRoster[] = Array.from({ length: 10 }, (_, index) => ({
    roster_id: index + 1, owner_id: `synthetic-owner-${index}`, players: [], reserve: null, taxi: null,
    starters: Array.from({ length: 11 }, (_, slot) => `${index}-${slot}`),
    settings: { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0 },
  }));
  const current = Object.fromEntries(rosters.flatMap(roster => roster.starters!.map(id => [id, { gp: 2, pts: 40 }])));
  delete current['1-0'];
  delete current['2-0'];
  return {
    league: vi.fn(async (): Promise<RawLeague> => ({ name: "Synthetic", season: "2026", status: "in_season", total_rosters: 10,
      settings: { playoff_teams: 6, playoff_week_start: 20, divisions: 1 }, scoring_settings: { pts: 1 } })),
    state: vi.fn(async (): Promise<RawNbaState> => ({ season: "2026", previous_season: "2025", leg: 2, week: 2, season_type: "regular" })),
    rosters: vi.fn(async () => rosters),
    stats: vi.fn(async (season: string) => season === "2026" ? current : { '1-0': { gp: 2, pts: 30 } }),
    now: () => NOW,
  };
}

describe("homepage Lineup Power source adapter", () => {
  it("uses the merged producer once and captures the same state context, without another source read", async () => {
    const deps = inputs(), fetch = vi.spyOn(globalThis, "fetch");
    try {
      const source = await loadHomeLineupPowerSource({ inputs: deps, produce: produceLineupPowerSnapshot });
      expect(source.status).toBe("available");
      if (source.status !== "available") throw new Error("Missing source");
      expect(source.context).toEqual({ season: "2026", priorStatsSeason: "2025", sourceLeg: 2 });
      expect(source.snapshot.week).toBe(3);
      expect(source.snapshot.priorSnapshotId).toBeNull();
      expect(source.snapshot.teams[0]).toMatchObject({ projectedCountedPoints: 220, coverage: "complete" });
      expect(source.snapshot.teams[1]).toMatchObject({ projectedCountedPoints: 215, coverage: "partial" });
      expect(source.snapshot.teams[2]).toMatchObject({ projectedCountedPoints: null, slotsProjected: 10, coverage: "unavailable" });
      expect(deps.league).toHaveBeenCalledTimes(1);
      expect(deps.state).toHaveBeenCalledTimes(1);
      expect(deps.rosters).toHaveBeenCalledTimes(1);
      expect(deps.stats).toHaveBeenCalledTimes(2);
      expect(deps.stats).toHaveBeenCalledWith("2026");
      expect(deps.stats).toHaveBeenCalledWith("2025");
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it.each(["source-error", "bad-snapshot", "bad-coverage", "missing-context", "wrong-week", "future", "stale-calculation", "false-prior", "wrong-phase"])("fails closed for %s", async kind => {
    const deps = inputs(), fixture = homeLineupPowerFixture();
    const produce = vi.fn(async (_prior: string | null, wrapped: LineupPowerDeps): Promise<unknown> => {
      if (kind === "source-error") throw new Error("Synthetic source failure");
      if (kind !== "missing-context") await wrapped.state();
      if (kind === "bad-snapshot") return {};
      if (kind === "bad-coverage") return { ...fixture.snapshot, teams: fixture.snapshot.teams.map((row, index) => index ? row : { ...row, coverage: "unknown" }) };
      if (kind === "wrong-week") return { ...fixture.snapshot, week: 4 };
      if (kind === "future") return { ...fixture.snapshot, asOf: new Date(NOW + 1).toISOString() };
      if (kind === "stale-calculation") return { ...fixture.snapshot, asOf: new Date(NOW - 1).toISOString() };
      if (kind === "false-prior") return { ...fixture.snapshot, priorSnapshotId: `lp1:${'a'.repeat(64)}` };
      return fixture.snapshot;
    });
    if (kind === "wrong-phase") deps.state = vi.fn(async () => ({ season: "2026", previous_season: "2025", leg: 2, week: 2, season_type: "pre" }));
    expect((await loadHomeLineupPowerSource({ inputs: deps, produce })).status).toBe("unavailable");
    expect(produce).toHaveBeenCalledWith(null, expect.any(Object));
  });

  it("turns a producer stats failure into an explicit source-unavailable state", async () => {
    const deps = inputs(); deps.stats = vi.fn(async () => { throw new Error("Synthetic stats outage"); });
    expect(await loadHomeLineupPowerSource({ inputs: deps, produce: produceLineupPowerSnapshot })).toMatchObject({ status: "unavailable", message: expect.stringContaining("No ranks are inferred") });
  });
});

describe("home Power context and identity projection", () => {
  it("joins current identities without changing snapshot values or inventing a prior", () => {
    const { home } = weeklyHomeFixture(), source = homeLineupPowerFixture();
    home.hub!.teams[0].name = 'Renamed current club';
    const result = buildHomeLineupPower(home, source);
    if (result.status !== "available") throw new Error("Missing home Power");
    expect(result.snapshot).toBe(source.snapshot);
    expect(result.prior).toBeNull();
    expect(result.teams[0].name).toBe('Renamed current club');
    expect(Object.keys(result.teams[0]).sort()).toEqual(['avatar', 'id', 'name']);
    expect(result.teams).toHaveLength(10);
  });

  it.each(["no-hub", "wrong-season", "wrong-phase", "missing-team", "duplicate-team", "foreign-team", "wrong-week", "invalid-snapshot"])("does not render a plausible rank for %s", kind => {
    const { home } = weeklyHomeFixture(), source = homeLineupPowerFixture();
    if (kind === "no-hub") home.hub = null;
    if (kind === "wrong-season") home.hub!.season.seasonYear = "2027";
    if (kind === "wrong-phase") home.hub!.season.status = "off_season";
    if (kind === "missing-team") home.hub!.teams = home.hub!.teams.slice(1);
    if (kind === "duplicate-team") home.hub!.teams[0] = home.hub!.teams[1];
    if (kind === "foreign-team") source.snapshot.teams[0].rosterId = "99";
    if (kind === "wrong-week") source.context.sourceLeg = 3;
    if (kind === "invalid-snapshot") source.snapshot.teams[0].coverage = "unknown" as never;
    expect(buildHomeLineupPower(home, source).status).toBe("unavailable");
  });

  it("preserves an explicit source failure and an all-unavailable snapshot without synthesizing zeros", () => {
    const { home } = weeklyHomeFixture();
    const unavailable = { status: "unavailable" as const, message: "Synthetic unavailable" };
    expect(buildHomeLineupPower(home, unavailable)).toBe(unavailable);
    const result = buildHomeLineupPower(home, homeLineupPowerFixture(true));
    expect(result.status === "available" && result.snapshot.teams.every(team => team.projectedCountedPoints === null)).toBe(true);
  });
});
