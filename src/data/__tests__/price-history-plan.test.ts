import { describe, expect, it } from "vitest";
import { createPublicationPlan, reconstructedFingerprint, validatePublicationPlan } from "../price-history-plan";
import { createPriceHistoryArtifact } from "../price-history-artifact";
import type { ExistingHistoryPoint } from "../../domain/price-history-import";
const candidate = () => createPriceHistoryArtifact({ directorySeason: 2026, currentSeasonStartYear: 2026,
  directory: { p: { years_exp: 3 } }, players: { p: { games: [{ date: "2023-10-25", season: "2023-24", fppg: 10, minutes: 30 }] } },
  seasonHistory: {}, draftPicks: [] }, { description: "Fixture", revision: "fixture", scoring: { pts: 0.5 }, limitations: ["Synthetic"] }, "fixture");
const backup = (): ExistingHistoryPoint[] => [
  { id: "old", playerId: "old", date: "2023-10-25T00:00:00.000Z", priceCents: 1234, source: "backtest", season: "2023-24" },
  { id: "live", playerId: "live", date: "2026-10-08T00:00:00.000Z", priceCents: 4567, source: "live", season: "2026-27" },
];
describe("read-only publication plan", () => {
  it("reports exact replacement classes while preserving other sources", () => {
    const plan = createPublicationPlan(backup(), candidate());
    expect(plan).toMatchObject({ replacedRows: 1, candidateRows: 1, preservedRows: 1, added: 1, removed: 1, repriced: 0 });
    expect(plan.before).toEqual({ "backtest|2023-24": 1 });
    expect(plan.after).toEqual({ "gamelog|2023-24": 1 });
  });
  it("binds the reviewed candidate and detects changes to reconstructed rows", () => {
    const data = candidate(), rows = backup(), plan = createPublicationPlan(rows, data);
    expect(() => validatePublicationPlan(plan, data)).not.toThrow();
    rows[0].priceCents++;
    expect(reconstructedFingerprint(rows)).not.toBe(plan.reconstructedFingerprint);
    plan.candidateDatasetId = "different";
    expect(() => validatePublicationPlan(plan, data)).toThrow();
  });
  it("has deterministic ordering and excludes observed prices from the replacement fingerprint", () => {
    const rows = backup(), hash = reconstructedFingerprint(rows);
    rows.reverse(); rows.find(p => p.source === "live")!.priceCents++;
    expect(reconstructedFingerprint(rows)).toBe(hash);
  });
});
