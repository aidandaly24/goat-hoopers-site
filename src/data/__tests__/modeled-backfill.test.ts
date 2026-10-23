import { describe, expect, it } from "vitest";
import { createPriceHistoryArtifact, validatePriceHistoryArtifact } from "../price-history-artifact";
import type { ReconstructionInput } from "../../domain/price-history-import";
import {
  historyDetailMatchesPoint, isTeamValueHistoryDetail,
  type TeamHistoryPoint, type TeamValueHistoryDetail,
} from "../../domain/team-value-history";
import {
  assertMembershipSnapshot, assertModeledDataset, buildModeledBackfillPackage,
  buildModeledGeneration, buildModeledPlayerTimelines, buildModeledTeamPoints,
  composeHistorySeries, computeMembershipSnapshotHash, computeRecordedAdmissionHash,
  endOfDay, parseRecordedInventory,
  type MembershipOnDay, type MembershipSnapshot,
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
      version: 1, teamId: "1", generation: buildModeledGeneration(artifact.manifest.datasetId, "fixture-evidence", "fixture-membership", "fixture-admissions"),
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
    const a = buildModeledGeneration(artifact.manifest.datasetId, "evidence-a", "membership-a", "admissions-a");
    expect(a).toContain("gamelog-carry-v1");
    expect(a).not.toBe(buildModeledGeneration(artifact.manifest.datasetId, "evidence-b", "membership-a", "admissions-a"));
    expect(a).not.toBe(buildModeledGeneration(artifact.manifest.datasetId, "evidence-a", "membership-b", "admissions-a"));
    expect(a).not.toBe(buildModeledGeneration(artifact.manifest.datasetId, "evidence-a", "membership-a", "admissions-b"));
    expect(a).not.toBe(buildModeledGeneration("other-dataset", "evidence-a", "membership-a", "admissions-a"));
  });
});

/**
 * Offline input integrity (dot's P2s on the first Stage 2 head,
 * 7a55775): the generation bound only final rosters, so a corrected
 * historical membership kept the old generation; and the runner's
 * loose input checks let a duplicated member double-count and a
 * non-canonical inventory day silently drop recorded suppression.
 * Each test below names a failure the old head permitted.
 */
describe("modeled backfill offline input integrity", () => {
  const snapshotFixture = (days: MembershipSnapshot["days"]): MembershipSnapshot => {
    const content = {
      seasonTwoFromDay: "2026-08-13",
      range: { fromDay: "2025-10-20", throughDay: "2026-08-13" },
      teamIds: [1],
      days,
    };
    return {
      version: "membership-snapshot-v1",
      rosterEvidenceHash: "a".repeat(64),
      membershipHash: computeMembershipSnapshotHash(content),
      ...content,
    };
  };
  // Final day identical in both: only a PAST membership differs.
  const finalsPreserved = snapshotFixture({
    "1": { "2025-10-21": ["101", "102"], "2026-08-13": ["101", "102"] },
  });
  const pastCorrected = snapshotFixture({
    "1": { "2025-10-21": ["101", "103"], "2026-08-13": ["101", "102"] },
  });

  it("binds dated membership: a corrected past membership changes the hash and the generation, finals preserved", () => {
    expect(pastCorrected.membershipHash).not.toBe(finalsPreserved.membershipHash);
    const generation = (s: MembershipSnapshot) =>
      buildModeledGeneration("dataset-x", s.rosterEvidenceHash, s.membershipHash, "fixture-admissions");
    expect(generation(pastCorrected)).not.toBe(generation(finalsPreserved));
    expect(() => assertMembershipSnapshot(finalsPreserved)).not.toThrow();
    expect(() => assertMembershipSnapshot(pastCorrected)).not.toThrow();
  });


  it("canonicalizes the hash: key order and per-day list order do not change it", () => {
    const shuffled = snapshotFixture({
      "1": { "2026-08-13": ["102", "101"], "2025-10-21": ["102", "101"] },
    });
    expect(shuffled.membershipHash).toBe(finalsPreserved.membershipHash);
    expect(() => assertMembershipSnapshot(shuffled)).not.toThrow();
  });

  it("rejects altered membership carrying an unchanged claimed hash", () => {
    const tampered: MembershipSnapshot = {
      ...pastCorrected,
      membershipHash: finalsPreserved.membershipHash,
    };
    expect(() => assertMembershipSnapshot(tampered)).toThrow(/membershipHash does not match/);
  });

  it("rejects a duplicated player in a snapshot team-day instead of pricing it twice", () => {
    const duplicated = snapshotFixture({ "1": { "2025-10-21": ["101", "101"] } });
    expect(() => assertMembershipSnapshot(duplicated)).toThrow(/more than once/);
  });

  it("rejects a non-canonical snapshot day key instead of letting it miss every composition day", () => {
    const instantKeyed = snapshotFixture({ "1": { "2025-10-21T00:00:00Z": ["101"] } });
    expect(() => assertMembershipSnapshot(instantKeyed)).toThrow(/non-canonical day key/);
  });

  it("rejects duplicated membership at composition time too", () => {
    const artifact = fixtureArtifact();
    const built = buildModeledPlayerTimelines(artifact, {
      from: "2024-07-01T00:00:00.000Z", asOf: endOfDay("2026-08-13"),
    });
    expect(() => buildModeledTeamPoints({
      built, datasetId: artifact.manifest.datasetId, modelVersion: artifact.manifest.modelVersion,
      membershipOnDay: () => ({ playerIds: ["101", "101"] }),
      recordedAdmits: () => false, teamIds: [1],
      range: { fromDay: "2025-10-21", throughDay: "2025-10-21" },
      seasonTwoFromDay: "2026-08-13",
    })).toThrow(/more than once/);
  });

  it("rejects a non-canonical inventory day instead of silently missing its recorded suppression", () => {
    expect(parseRecordedInventory({ admittedTeamDays: [{ teamId: 1, day: "2025-10-22" }] }, [1]))
      .toEqual(new Set(["1|2025-10-22"]));
    expect(() => parseRecordedInventory(
      { admittedTeamDays: [{ teamId: 1, day: "2025-10-22T00:00:00Z" }] }, [1],
    )).toThrow(/Malformed recorded-inventory entry/);
  });

  it("rejects duplicate inventory entries and teams the snapshot does not carry", () => {
    expect(() => parseRecordedInventory(
      { admittedTeamDays: [{ teamId: 1, day: "2025-10-22" }, { teamId: 1, day: "2025-10-22" }] }, [1],
    )).toThrow(/more than once/);
    expect(() => parseRecordedInventory(
      { admittedTeamDays: [{ teamId: 99, day: "2025-10-22" }] }, [1],
    )).toThrow(/does not carry/);
    expect(() => parseRecordedInventory({ admittedTeamDays: "nope" }, [1]))
      .toThrow(/admittedTeamDays array/);
  });
});

/**
 * Recorded-admission identity binding (the dot's remaining P2 on
 * head 89a6303): suppression consumes the recorded inventory, but
 * its identity reached neither the package nor the generation — an
 * empty inventory emitted a point for a team-day while admitting
 * that team-day emitted zero points for it, both under the SAME
 * generation. Each test below names a failure that head permitted.
 */
describe("modeled backfill recorded-admission identity", () => {
  const packageFor = (admitted: ReadonlySet<string>) => {
    const { artifact, result } = compose((teamId, day) => admitted.has(`${teamId}|${day}`));
    return buildModeledBackfillPackage({
      artifact,
      rosterEvidenceHash: "fixture-evidence",
      membershipHash: "fixture-membership",
      recordedAdmissionHash: computeRecordedAdmissionHash(admitted),
      range: { fromDay: "2025-10-20", throughDay: "2026-08-13" },
      result,
    });
  };

  it("canonicalizes the admission hash: entry reordering does not change it", () => {
    const forward = parseRecordedInventory({ admittedTeamDays: [
      { teamId: 1, day: "2025-10-21" }, { teamId: 1, day: "2025-10-22" }, { teamId: 2, day: "2025-10-21" },
    ] }, [1, 2]);
    const shuffled = parseRecordedInventory({ admittedTeamDays: [
      { teamId: 2, day: "2025-10-21" }, { teamId: 1, day: "2025-10-22" }, { teamId: 1, day: "2025-10-21" },
    ] }, [1, 2]);
    expect(computeRecordedAdmissionHash(shuffled)).toBe(computeRecordedAdmissionHash(forward));
    expect(computeRecordedAdmissionHash(new Set(["2|2025-10-21", "1|2025-10-21"])))
      .toBe(computeRecordedAdmissionHash(new Set(["1|2025-10-21", "2|2025-10-21"])));
    expect(packageFor(shuffled).generation).toBe(packageFor(forward).generation);
  });

  it("changes the hash, the package identity, and the generation on any effective admission change", () => {
    const base = new Set(["1|2025-10-21", "1|2025-10-22"]);
    expect(computeRecordedAdmissionHash(new Set([...base, "1|2025-10-25"])))
      .not.toBe(computeRecordedAdmissionHash(base));
    expect(computeRecordedAdmissionHash(new Set(["1|2025-10-21"])))
      .not.toBe(computeRecordedAdmissionHash(base));

    // Even an admission change that suppresses nothing (a day with
    // no proven membership) must move the identity: dataset and
    // membership stay fixed, the emitted points are identical, and
    // only the admission binding differs.
    const plain = packageFor(new Set());
    const admittedOutside = packageFor(new Set(["1|2025-10-23"]));
    expect(admittedOutside.points.map(e => e.point.day)).toEqual(plain.points.map(e => e.point.day));
    expect(admittedOutside.datasetId).toBe(plain.datasetId);
    expect(admittedOutside.membershipHash).toBe(plain.membershipHash);
    expect(admittedOutside.recordedAdmissionHash).not.toBe(plain.recordedAdmissionHash);
    expect(admittedOutside.generation).not.toBe(plain.generation);
  });

  it("gives the empty admission set a distinct identity from every admitted set", () => {
    const emptyHash = computeRecordedAdmissionHash(new Set());
    expect(emptyHash).not.toBe(computeRecordedAdmissionHash(new Set(["1|2025-10-21"])));

    // The dot's probe shape: the empty inventory emits a point for
    // 2025-10-21; admitting that team-day emits none. The two runs
    // must not share an identifier.
    const empty = packageFor(new Set());
    const admitted = packageFor(new Set(["1|2025-10-21"]));
    expect(empty.points.map(e => e.point.day)).toContain("2025-10-21");
    expect(admitted.points.map(e => e.point.day)).not.toContain("2025-10-21");
    expect(admitted.diagnostics.suppressedRecordedTeamDays).toBe(1);
    expect(empty.recordedAdmissionHash).toBe(emptyHash);
    expect(empty.generation.endsWith(`:${emptyHash}`)).toBe(true);
    expect(admitted.generation).not.toBe(empty.generation);
  });

  it("verifies a stamped admission claim before composing, and rejects a stale or malformed one", () => {
    const entries = [{ teamId: 1, day: "2025-10-21" }];
    const set = parseRecordedInventory({ admittedTeamDays: entries }, [1]);
    const claim = computeRecordedAdmissionHash(set);
    expect(parseRecordedInventory({ admittedTeamDays: entries, recordedAdmissionHash: claim }, [1]))
      .toEqual(set);
    // A claim computed over a DIFFERENT set (here: the empty set)
    // rejects — an inventory edited after hashing never composes.
    expect(() => parseRecordedInventory(
      { admittedTeamDays: entries, recordedAdmissionHash: computeRecordedAdmissionHash(new Set()) }, [1],
    )).toThrow(/recordedAdmissionHash does not match/);
    expect(() => parseRecordedInventory(
      { admittedTeamDays: [], recordedAdmissionHash: "not-a-hash" }, [1],
    )).toThrow(/not a sha256/);
    // Unclaimed inputs still parse: the claim is verified when
    // present, and the runner always binds the recomputed hash.
    expect(parseRecordedInventory({ admittedTeamDays: [] }, [1])).toEqual(new Set());
  });

  it("rejects a malformed admission key instead of hashing it into an identity", () => {
    expect(() => computeRecordedAdmissionHash(new Set(["bogus"])))
      .toThrow(/Malformed recorded-admission key/);
    expect(() => computeRecordedAdmissionHash(new Set(["1|2025-10-21T00:00:00Z"])))
      .toThrow(/Malformed recorded-admission key/);
  });
});
