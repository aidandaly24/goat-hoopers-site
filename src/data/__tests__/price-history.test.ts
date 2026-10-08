import { describe, expect, it } from "vitest";
import { calendarDate, historicalAge, reconstructPriceHistory } from "../reconstruct-price-history";
import { createPriceHistoryArtifact, validatePriceHistoryArtifact } from "../price-history-artifact";
import { computeStockMarket } from "../transform";
import type { ReconstructionInput, PriceHistoryArtifact } from "../../domain/price-history-import";

const game = (date: string, fppg: number, season = "2023-24") => ({ date, fppg, season, minutes: 30 });
const input = (games = [game("2023-10-25", 10), game("2023-10-27", 10)]): ReconstructionInput => ({
  directorySeason: 2026, currentSeasonStartYear: 2026,
  directory: { p: { birth_date: "2004-01-04", years_exp: 3 } },
  players: { p: { games } }, seasonHistory: {}, draftPicks: [],
});
const source = { description: "Synthetic fixture", revision: "fixture-1", scoring: { pts: 0.5 }, limitations: ["Synthetic fixture"] };

describe("reconstructed price history", () => {
  it("places Sleeper 2023 at 2023-24 season end, after the rookie debut", () => {
    const fixture = input();
    fixture.seasonHistory.p = [{ season: "2023", fppg: 32.77, games: 71 }, { season: "2025", fppg: 34.58, games: 64 }];
    const points = reconstructPriceHistory(fixture);
    expect(points.filter(p => p.source === "backtest").map(p => [p.date, p.season])).toEqual([
      ["2024-06-30T00:00:00.000Z", "2023-24"], ["2026-06-30T00:00:00.000Z", "2025-26"],
    ]);
    expect(points.some(p => p.date < "2023-10-25")).toBe(false);
  });
  it("keeps annual fallback until that same season has complete game coverage", () => {
    const fixture = input();
    fixture.seasonHistory.p = [{ season: "2023", fppg: 10, games: 2 }];
    expect(reconstructPriceHistory(fixture).every(p => p.source === "gamelog")).toBe(true);
    fixture.seasonHistory.p[0].games = 3;
    expect(reconstructPriceHistory(fixture).some(p => p.source === "backtest")).toBe(true);
  });
  it("folds the current game's production into its after-game point", () => {
    const normal = reconstructPriceHistory(input());
    const shock = reconstructPriceHistory(input([game("2023-10-25", 10), game("2023-10-27", 100)]));
    expect(shock[0]).toEqual(normal[0]);
    expect(shock[1].priceCents).toBeGreaterThan(normal[1].priceCents);
  });
  it("resets the in-season EMA at the next season boundary", () => {
    const next = game("2024-10-25", 10, "2024-25");
    const lowFirst = reconstructPriceHistory(input([game("2023-10-25", 0), game("2023-10-27", 20), next]));
    const highFirst = reconstructPriceHistory(input([game("2023-10-25", 20), game("2023-10-27", 0), next]));
    expect(lowFirst.at(-1)).toEqual(highFirst.at(-1));
  });
  it("uses timezone-independent calendar dates and birthdays", () => {
    expect(calendarDate("2023-10-25 00:00:00")).toBe("2023-10-25T00:00:00.000Z");
    expect(historicalAge("2004-01-04", "2024-01-03")).toBe(19);
    expect(historicalAge("2004-01-04", "2024-01-04")).toBe(20);
    expect(() => calendarDate("2024-02-30")).toThrow();
  });
  it("does not apply a later league draft pick to earlier dates", () => {
    const fixture = input();
    fixture.draftPicks = [{ playerId: "p", pick: 1, availableOn: "2026-10-01" }];
    expect(reconstructPriceHistory(fixture)).toEqual(reconstructPriceHistory(input()));
  });
  it("rejects duplicated source games and nonfinite production", () => {
    expect(() => reconstructPriceHistory(input([game("2023-10-25", 10), game("2023-10-25", 10)]))).toThrow(/Duplicate/);
    expect(() => reconstructPriceHistory(input([game("2023-10-25", NaN)]))).toThrow(/Invalid/);
  });
  it("repeats the same versioned artifact from the same frozen inputs", () => {
    const first = createPriceHistoryArtifact(input(), source, "model-code-fixture");
    expect(createPriceHistoryArtifact(input(), source, "model-code-fixture")).toEqual(first);
    expect(first.manifest.modelVersion).toBe("v2");
    expect(first.manifest.reconstructionVersion).toBe("2");
    expect(first.points.every(p => p.source !== ("live" as string))).toBe(true);
    expect(createPriceHistoryArtifact(input(), source, "changed-model-code").manifest.datasetId).not.toBe(first.manifest.datasetId);
    expect(() => validatePriceHistoryArtifact(first)).not.toThrow();
    first.points[0].priceCents++;
    expect(() => validatePriceHistoryArtifact(first)).toThrow();
  });
  it.each<[string, (a: PriceHistoryArtifact) => void]>([
    ["source.description", a => { a.manifest.source.description = "Changed source"; }],
    ["source.revision", a => { a.manifest.source.revision = "Changed revision"; }],
    ["source.scoring", a => { a.manifest.source.scoring.pts = 999; }],
    ["source.limitations", a => { a.manifest.source.limitations = []; }],
    ["assumptions", a => { a.manifest.assumptions = ["Observed exact prices"]; }],
    ["directorySeason", a => { a.manifest.directorySeason = 2030; }],
    ["currentSeasonStartYear", a => { a.manifest.currentSeasonStartYear = 2030; }],
  ])("rejects changed %s at the unchanged reviewed dataset ID", (_field, mutate) => {
    const original = createPriceHistoryArtifact(input(), source, "model-code-fixture");
    const saved = structuredClone(original); mutate(saved);
    expect(saved.manifest.datasetId).toBe(original.manifest.datasetId);
    expect(() => validatePriceHistoryArtifact(saved)).toThrow(/Invalid or changed/);
  });
  it("changes the dataset ID when published assumptions change", () => {
    const first = createPriceHistoryArtifact(input(), source, "model-code-fixture");
    const changed = createPriceHistoryArtifact(input(), { ...source, limitations: ["Different coverage limitation"] }, "model-code-fixture");
    expect(changed.manifest.datasetId).not.toBe(first.manifest.datasetId);
    expect(() => validatePriceHistoryArtifact(changed)).not.toThrow();
  });
  it("uses available completed-season production without prior game logs", () => {
    const fixture = input([game("2023-10-25", 0)]);
    fixture.directory.p = { birth_date: "1995-01-01", years_exp: 10 };
    fixture.seasonHistory.p = [{ season: "2022", fppg: 30, games: 82 }];
    // Independent review fixture: 95% of 30 + 5% of 0 = 28.5 production FPPG.
    expect(reconstructPriceHistory(fixture).find(p => p.source === "gamelog")!.priceCents).toBe(6412);
  });
  it("prefers full prior-season totals over partial logs and falls back to logs when absent", () => {
    const fixture = input([game("2022-10-25", 100, "2022-23"), game("2023-10-25", 0)]);
    fixture.directory.p = { birth_date: "1995-01-01", years_exp: 10 };
    fixture.seasonHistory.p = [{ season: "2022", fppg: 30, games: 82 }];
    const opening = (f: ReconstructionInput) => reconstructPriceHistory(f).find(p => p.source === "gamelog" && p.season === "2023-24")!.priceCents;
    expect(opening(fixture)).toBe(6412);
    fixture.seasonHistory = {};
    expect(opening(fixture)).toBeGreaterThan(6412);
    fixture.players.p.games[0].fppg = 30;
    expect(opening(fixture)).toBe(6412);
  });
  it("never uses current or future full-season totals in a dated game price", () => {
    const fixture = input([game("2023-10-25", 0)]);
    fixture.directory.p = { birth_date: "1995-01-01", years_exp: 10 };
    fixture.seasonHistory.p = [{ season: "2022", fppg: 30, games: 82 }];
    const before = reconstructPriceHistory(fixture).filter(p => p.source === "gamelog");
    fixture.seasonHistory.p.push({ season: "2023", fppg: 2000, games: 82 }, { season: "2024", fppg: 5000, games: 82 });
    expect(reconstructPriceHistory(fixture).filter(p => p.source === "gamelog")).toEqual(before);
  });
  it("combines the two completed prior seasons before the opening-game blend", () => {
    const fixture = input([game("2023-10-25", 0)]);
    fixture.directory.p = { birth_date: "1995-01-01", years_exp: 10 };
    fixture.seasonHistory.p = [{ season: "2021", fppg: 10, games: 82 }, { season: "2022", fppg: 30, games: 82 }];
    // 0.65*30 + 0.35*10 = 23; opening production is 0.95*23 = 21.85.
    expect(reconstructPriceHistory(fixture).find(p => p.source === "gamelog")!.priceCents).toBe(4916);
  });
  it("does not create normal movers from a reconstructed-only baseline", () => {
    const market = computeStockMarket({ players: { p: { full_name: "Fixture", age: 27, years_exp: 5 } },
      rosteredCount: { p: 1 }, totalRosters: 10, faabSpent: {}, faabBudget: 200, flow: {}, tradeCount: {}, draftPick: {},
      statProfiles: { p: { fppg: 20, careerMinutes: 7500, emaFppg: null, emaGames: 0, leaguePick: null, seasonHistory: [] } },
      history: { p: [{ date: "2023-06-30T00:00:00.000Z", price: 1, source: "backtest" }] }, now: Date.UTC(2026, 9, 8) });
    expect(market.stocks[0].changePct).toBeNull();
    expect(market.hasHistory).toBe(false);
    expect(market.trending).toEqual([]);
  });
});
