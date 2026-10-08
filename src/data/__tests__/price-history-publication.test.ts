import { describe, expect, it } from "vitest";
import { publishReconstructedPoints } from "../stocks";
import { createPriceHistoryArtifact, contentHash, artifactDatasetId } from "../price-history-artifact";
import { createPublicationPlan } from "../price-history-plan";
import type { Db } from "../db";

type Operation = { kind: "lock" | "delete" | "points" | "manifest"; values?: unknown[] };
function fakePublisher() {
  let rows: unknown[] = ["previous-good-generation"];
  let manifest: unknown = "previous-manifest";
  let failAfterFirstChunk = false;
  let batches = 0;
  let tail = Promise.resolve();
  const db = {
    execute: () => ({ kind: "lock" }),
    delete: () => ({ where: () => ({ kind: "delete" }) }),
    insert: () => ({ values: (values: unknown) => {
      const operation = { kind: Array.isArray(values) ? "points" : "manifest", values: Array.isArray(values) ? values : [values] };
      return { ...operation, onConflictDoUpdate: () => operation };
    } }),
    batch: (operations: Operation[]) => {
      batches++;
      const run = tail.then(async () => {
        expect(operations[0].kind).toBe("lock");
        let stagedRows = [...rows], stagedManifest = manifest, chunks = 0;
        for (const op of operations) {
          if (op.kind === "delete") stagedRows = [];
          if (op.kind === "points") {
            if (failAfterFirstChunk && ++chunks === 2) throw new Error("synthetic second-chunk failure");
            stagedRows.push(...op.values!);
          }
          if (op.kind === "manifest") stagedManifest = op.values![0];
        }
        rows = stagedRows; manifest = stagedManifest;
      });
      tail = run.catch(() => {});
      return run;
    },
  };
  return { db: db as unknown as Db, rows: () => rows, manifest: () => manifest, batches: () => batches,
    fail: (value: boolean) => { failAfterFirstChunk = value; } };
}
const artifact = () => {
  const result = createPriceHistoryArtifact({ directorySeason: 2026, currentSeasonStartYear: 2026,
    directory: { p: { birth_date: "2000-01-01", years_exp: 3 } }, players: { p: { games: [{ date: "2023-10-25", season: "2023-24", fppg: 10, minutes: 30 }] } },
    seasonHistory: {}, draftPicks: [] }, { description: "Synthetic", revision: "fixture", scoring: { pts: 0.5 }, limitations: ["Synthetic fixture"] }, "fixture-model");
  result.points = Array.from({ length: 1200 }, (_, i) => ({ ...result.points[0], playerId: `p${i}` }));
  result.manifest.rows = 1200; result.manifest.players = 1200; result.manifest.pointsHash = contentHash(result.points);
  result.manifest.datasetId = artifactDatasetId(result.manifest);
  return result;
};

describe("explicit publication transaction", () => {
  it("rolls back both points and completion state on failure, then retries completely", async () => {
    const store = fakePublisher(); store.fail(true);
    await expect(publishReconstructedPoints(store.db, artifact(), createPublicationPlan([], artifact()))).rejects.toThrow(/second-chunk/);
    expect(store.rows()).toEqual(["previous-good-generation"]);
    expect(store.manifest()).toBe("previous-manifest");
    store.fail(false);
    await publishReconstructedPoints(store.db, artifact(), createPublicationPlan([], artifact()));
    expect(store.rows()).toHaveLength(1200);
    expect(store.manifest()).toMatchObject({ datasetId: artifact().manifest.datasetId });
    expect(store.batches()).toBe(2);
  });
  it("serializes simultaneous publications and repeats stable point identities", async () => {
    const store = fakePublisher(), data = artifact();
    await Promise.all([publishReconstructedPoints(store.db, data, createPublicationPlan([], data)), publishReconstructedPoints(store.db, data, createPublicationPlan([], data))]);
    expect(store.rows()).toHaveLength(1200);
    const previous = store.rows();
    await publishReconstructedPoints(store.db, data, createPublicationPlan([], data));
    expect(store.rows()).toEqual(previous);
  });
  it("validates changed artifacts before submitting any database work", async () => {
    const store = fakePublisher(), data = artifact(), plan = createPublicationPlan([], data);
    data.points[0].priceCents++;
    await expect(publishReconstructedPoints(store.db, data, plan)).rejects.toThrow();
    expect(store.batches()).toBe(0);
  });
  it("rejects changed audit metadata before submitting any database work", async () => {
    const store = fakePublisher(), data = artifact(), plan = createPublicationPlan([], data);
    data.manifest.source.revision = "Different unreviewed revision";
    await expect(publishReconstructedPoints(store.db, data, plan)).rejects.toThrow(/Invalid or changed/);
    expect(store.batches()).toBe(0);
    expect(store.rows()).toEqual(["previous-good-generation"]);
  });
});
