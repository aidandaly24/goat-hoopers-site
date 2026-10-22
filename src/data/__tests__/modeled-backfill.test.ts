import { describe, expect, it } from "vitest";
import { createPriceHistoryArtifact, validatePriceHistoryArtifact } from "../price-history-artifact";
import type { ReconstructionInput } from "../../domain/price-history-import";
import {
  historyDetailMatchesPoint, isTeamValueHistoryDetail,
  type TeamHistoryPoint, type TeamValueHistoryDetail,
} from "../../domain/team-value-history";
import {
  assertModeledDataset, buildModeledGeneration, buildModeledPlayerTimelines,
  buildModeledTeamPoints, composeHistorySeries, endOfDay, type MembershipOnDay,
} from "../modeled-backfill";

/**
 * Stage 2 producer fixtures (#217). Three players exercise the three
 * evidence shapes the contract names:
 * - "101" has gamelog points in 2024-25 and 2025-26 (priced, carried).
 * - "102" has a gamelog point only in 2024-25 (cross-season carry must
 *   NOT price its 2025-26 days).
 * - "103" has season history only, so the artifact carries a backtest
 *   (annual) point for it — which the producer must never admit.
 */

const SOURCE = {
  description: "fixture source", revision: "fixture-rev",
  scoring: { pts: 0.5 }, limitations: ["fixture"],
};

function fixtureArtifact() {
  const input: ReconstructionInput = {
    directorySeason: 2026,
    currentSeasonStartYear: 2026,
    directory: {
      "101": { birth_date: "1998-03-01", years_exp: 6 },
      "102": { birth_date: "1999-06-15", years_exp: 5 },
      "103": { birth_date: "2000-01-20", years_exp: 4 },
    },
    players: {
      "101": { games: [
        { date: "2025-01-10", season: "2024-25", fppg: 30, minutes: 30 },
        { date: "2025-01-12", season: "2024-25", fppg: 30, minutes: 30 },
        { date: "2025-10-21", season: "2025-26", fppg: 30, minutes: 30 },
        { date: "2025-10-24", season: "2025-26", fppg: 36, minutes: 32 },
      ] },
      "102": { games: [
        { date: "2025-02-01", season: "2024-25", fppg: 20, minutes: 25 },
      ] },
      "103": { games: [] },
    },
    seasonHistory: {
      "101": [{ season: "2024", fppg: 30, games: 2 }],
      "102": [{ season: "2024", fppg: 20, games: 1 }],
      "103": [{ season: "2025", fppg: 18, games: 60 }],
    },
    draftPicks: [],
  };
  const artifact = createPriceHistoryArtifact(input, SOURCE, "fixture-code-hash");
  validatePriceHistoryArtifact(artifact);
  return artifact;
}

const MEMBERSHIP: Record<string, string[]> = {
  "2025-10-21": ["101", "102", "103"],
  "2025-10-22": ["101", "102", "103"],
  "2025-10-25": ["101", "102"],
  "2026-08-13": ["101", "102"],
};
const membershipOnDay: MembershipOnDay = (_rosterId, day) => {
  const playerIds = MEMBERSHIP[day];
  return playerIds ? { playerIds } : null;
};

function compose(recordedAdmits: (teamId: number, day: string) => boolean = () => false) {
  const artifact = fixtureArtifact();
  const built = buildModeledPlayerTimelines(artifact, {
    from: "2024-07-01T00:00:00.000Z", asOf: endOfDay("2026-08-13"),
  });
  const result = buildModeledTeamPoints({
    built, datasetId: artifact.manifest.datasetId, modelVersion: artifact.manifest.modelVersion,
    membershipOnDay, recordedAdmits, teamIds: [1],
    range: { fromDay: "2025-10-20", throughDay: "2026-08-13" },
    seasonTwoFromDay: "2026-08-13",
  });
  return { artifact, built, result };
}

const gamelogPoint = (artifact: ReturnType<typeof fixtureArtifact>, playerId: string, day: string) =>
  artifact.points.find(p => p.playerId === playerId && p.source === "gamelog" && p.date.startsWith(day))!;

describe("modeled backfill producer", () => {
  it("prices game days at the artifact point and carries the anchor forward within the season", () => {
    const { artifact, result } = compose();
    const byDay = new Map(result.points.map(entry => [entry.point.day, entry]));

    const gameDay = byDay.get("2025-10-21")!;
    const expected = gamelogPoint(artifact, "101", "2025-10-21");
    expect(gameDay.point).toMatchObject({
      priceKind: "reconstructed", rosterCount: 3, priced: 1,
      subtotalCents: expected.priceCents, standalone: false,
    });
    expect(gameDay.point.valuationAt).toBe(endOfDay("2025-10-21"));
    expect(gameDay.point.continuityId).toMatch(/^mseg-/);
    expect(gameDay.point.pricedSetId).toMatch(/^mps-/);
    const line101 = gameDay.players.find(l => l.playerId === "101")!;
    expect(line101).toMatchObject({ priceCents: expected.priceCents, anchorDate: "2025-10-21", anchorAgeDays: 0 });

    const carried = byDay.get("2025-10-22")!;
    const carried101 = carried.players.find(l => l.playerId === "101")!;
    expect(carried101).toMatchObject({
      priceCents: expected.priceCents, anchorDate: "2025-10-21", anchorAgeDays: 1,
    });

    const afterSecondGame = byDay.get("2025-10-25")!;
    const second = gamelogPoint(artifact, "101", "2025-10-24");
    expect(afterSecondGame.point.rosterCount).toBe(2);
    expect(afterSecondGame.players.find(l => l.playerId === "101")).toMatchObject({
      priceCents: second.priceCents, anchorDate: "2025-10-24", anchorAgeDays: 1,
    });
  });

  it("never carries an anchor across seasons and never admits annual points", () => {
    const { artifact, built, result } = compose();
    // The artifact really does carry an annual point for 103 — the
    // exclusion is the producer's doing, not the fixture's absence.
    expect(artifact.points.some(p => p.playerId === "103" && p.source === "backtest")).toBe(true);
    expect(built.timelines.has("103")).toBe(false);

    const gameDay = result.points.find(entry => entry.point.day === "2025-10-21")!;
    expect(gameDay.players.find(l => l.playerId === "102")).toMatchObject({
      priceCents: null, missingReason: "no-same-season-anchor", proof: null,
    });
    expect(gameDay.players.find(l => l.playerId === "103")).toMatchObject({
      priceCents: null, missingReason: "no-modeled-timeline", proof: null,
    });

    // 2026-08-13 has proven membership but only prior-season anchors:
    // no point is emitted for it at all.
    expect(result.points.some(entry => entry.point.day === "2026-08-13")).toBe(false);
    expect(result.diagnostics).toMatchObject({
      membershipTeamDays: 4, suppressedRecordedTeamDays: 0, unpricedTeamDays: 1, pointsEmitted: 3,
    });
  });

  it("keeps gaps as gaps: membership gaps and valueless days emit no point, never a zero", () => {
    const { result } = compose();
    const days = result.points.map(entry => entry.point.day);
    expect(days).toEqual(["2025-10-21", "2025-10-22", "2025-10-25"]);
    for (const entry of result.points) {
      expect(entry.point.priced).toBeGreaterThan(0);
      expect(entry.point.subtotalCents).toBeGreaterThan(0);
    }
  });

  it("admits modeled points only where the recorded lane admits nothing", () => {
    const { result } = compose((_teamId, day) => day === "2025-10-22");
    expect(result.points.map(entry => entry.point.day)).toEqual(["2025-10-21", "2025-10-25"]);
    expect(result.diagnostics.suppressedRecordedTeamDays).toBe(1);
  });

  it("composition never overwrites or merges into a recorded point", () => {
    const { result } = compose();
    const recordedPoint: TeamHistoryPoint = {
      id: "thp-1-2025-10-22", day: "2025-10-22", valuationAt: "2025-10-22T15:04:05.000000Z",
      seasonId: "2025", rosterRef: "roster-1-recorded", rosterStatus: "replayed",
      rosterCount: 3, priced: 3, subtotalCents: 12345, priceKind: "recorded",
      continuityId: "seg-recorded", pricedSetId: null, standalone: false,
    };
    const composed = composeHistorySeries([{ teamId: 1, point: recordedPoint }], result.points);
    expect(composed.droppedModeled).toBe(1);
    expect(composed.points).toHaveLength(3);
    const survivor = composed.points.find(entry => entry.point.day === "2025-10-22")!;
    expect(survivor.point).toBe(recordedPoint); // same object, untouched
    expect(composed.points.filter(entry => entry.point.priceKind === "reconstructed")).toHaveLength(2);
  });

  it("MODELED provenance survives end-to-end into a domain-valid detail", () => {
    const { artifact, result } = compose();
    const entry = result.points.find(e => e.point.day === "2025-10-25")!;
    const detail: TeamValueHistoryDetail = {
      version: 1, teamId: "1", generation: buildModeledGeneration(artifact.manifest.datasetId, "fixture-evidence"),
      day: entry.point.day, valuationAt: entry.point.valuationAt, pointId: entry.point.id,
      rosterRef: entry.point.rosterRef, rosterStatus: entry.point.rosterStatus,
      rosterCount: entry.point.rosterCount, priced: entry.point.priced,
      subtotalCents: entry.point.subtotalCents, rosterEvidence: ["fixture replay"],
      players: entry.players.map(line => ({
        id: line.playerId, name: `Player ${line.playerId}`, priceCents: line.priceCents,
        price: line.proof, missingReason: line.missingReason,
      })),
      movesRange: { from: "2025-10-24", toExclusive: "2025-10-26" }, moves: [], movesTruncated: false,
    };
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
    expect(historyDetailMatchesPoint(detail, entry.point)).toBe(true);

    const proof = entry.players.find(l => l.playerId === "101")!.proof!;
    expect(proof).toMatchObject({
      kind: "reconstructed", source: "gamelog",
      datasetId: artifact.manifest.datasetId, modelVersion: "v2",
      inputCutoff: endOfDay("2025-10-24"), availableFrom: endOfDay("2025-10-25"), validUntil: null,
    });
  });

  it("binds the run to the pinned dataset and the gamelog-carry generation", () => {
    const { artifact } = compose();
    expect(() => assertModeledDataset(artifact, artifact.manifest.datasetId)).not.toThrow();
    expect(() => assertModeledDataset(artifact, "some-other-dataset")).toThrow(/dataset mismatch/i);
    const a = buildModeledGeneration(artifact.manifest.datasetId, "evidence-a");
    expect(a).toContain("gamelog-carry-v1");
    expect(a).not.toBe(buildModeledGeneration(artifact.manifest.datasetId, "evidence-b"));
    expect(a).not.toBe(buildModeledGeneration("other-dataset", "evidence-a"));
  });
});
