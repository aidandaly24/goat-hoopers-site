/** Explicit opt-in: synthetic Postgres 16 on localhost:55438 only; never ambient DB credentials. */
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { neonConfig } from "@neondatabase/serverless";
import { createImportDb } from "../db";
import { publishReconstructedPoints } from "../stocks";
import { createPriceHistoryArtifact, contentHash, artifactDatasetId } from "../price-history-artifact";
import { createPublicationPlan } from "../price-history-plan";
import type { ExistingHistoryPoint } from "../../domain/price-history-import";

const localUrl = "postgresql://postgres:local-test-only@127.0.0.1:55438/price_history_test";
const pool = new Pool({ connectionString: localUrl, options: "-c search_path=price_history_local_test", max: 4 });
const local = describe.skipIf(process.env.RUN_PRICE_HISTORY_LOCAL_TEST !== "1");
const readBackup = async (): Promise<ExistingHistoryPoint[]> => (await pool.query(`SELECT id, player_id AS "playerId",
  to_char(date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date,
  price_cents AS "priceCents", source, season FROM price_history ORDER BY player_id, date, source`)).rows;
const candidate = (price = 1000) => {
  const data = createPriceHistoryArtifact({ directorySeason: 2026, currentSeasonStartYear: 2026,
    directory: { p: { birth_date: "2000-01-01", years_exp: 3 } },
    players: { p: { games: [{ date: "2023-10-25", season: "2023-24", fppg: 10, minutes: 30 }] } },
    seasonHistory: {}, draftPicks: [] },
    { description: "Synthetic local database fixture", revision: "fixture", scoring: { pts: 0.5 }, limitations: ["Synthetic inputs"] }, "fixture-model");
  data.points = Array.from({ length: 1200 }, (_, i) => ({ ...data.points[0], playerId: `p${String(i).padStart(4, "0")}`, priceCents: price }));
  data.manifest.rows = 1200; data.manifest.players = 1200; data.manifest.pointsHash = contentHash(data.points);
  data.manifest.datasetId = artifactDatasetId(data.manifest);
  return data;
};

local("publication against isolated local Postgres", () => {
  const originalFetch = neonConfig.fetchFunction;
  let requestBytes = 0;
  beforeAll(async () => {
    await pool.query("CREATE SCHEMA IF NOT EXISTS price_history_local_test");
    // Exercise the actual Neon HTTP client + Drizzle batch query generation.
    // Only the HTTP service is replaced by a local Postgres transaction adapter;
    // this does not claim to test Neon deployment/configuration or service limits.
    neonConfig.fetchFunction = async (_url: string, init: RequestInit) => {
      const body = String(init.body);
      requestBytes = Buffer.byteLength(body);
      const queries = JSON.parse(body).queries;
      if (!Array.isArray(queries)) throw new Error("Publication must use one HTTP transaction batch");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const results = [];
        for (const q of queries) {
          const result = await client.query({ text: q.query, values: q.params, rowMode: "array" });
          results.push({ fields: result.fields, command: result.command, rowCount: result.rowCount,
            rows: result.rows.map(row => row.map((v: unknown) => v === null ? null : typeof v === "object" ? JSON.stringify(v) : String(v))) });
        }
        await client.query("COMMIT");
        return new Response(JSON.stringify({ results }), { status: 200 });
      } catch (error) {
        await client.query("ROLLBACK");
        return new Response(JSON.stringify({ message: (error as Error).message }), { status: 400 });
      } finally { client.release(); }
    };
  });
  afterAll(async () => {
    neonConfig.fetchFunction = originalFetch;
    await pool.query("DROP SCHEMA IF EXISTS price_history_local_test CASCADE");
    await pool.end();
  });
  beforeEach(async () => {
    await pool.query(`DROP TABLE IF EXISTS price_history, stock_snapshots, price_history_import_state CASCADE;
      CREATE TABLE price_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), player_id TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL, price_cents INTEGER NOT NULL, source TEXT NOT NULL, season TEXT NOT NULL);
      CREATE TABLE stock_snapshots (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), player_id TEXT NOT NULL, price_cents INTEGER NOT NULL);
      INSERT INTO price_history (player_id,date,price_cents,source,season) VALUES
        ('old','2023-10-25',1234,'gamelog','2023-24'),('observed','2026-10-08',4567,'live','2026-27');
      INSERT INTO stock_snapshots (player_id,price_cents) VALUES ('observed',4567);`);
    await pool.query(readFileSync("migrations/price-history-import-state.sql", "utf8"));
    await pool.query(`INSERT INTO price_history_import_state (id,dataset_id,manifest) VALUES ('current','previous','{}')`);
  });
  const db = () => createImportDb(localUrl);
  it("rolls back a real second-chunk constraint failure, then retries and preserves observed prices", async () => {
    const data = candidate(), backup = await readBackup(), plan = createPublicationPlan(backup, data);
    const observed = (await pool.query("SELECT * FROM stock_snapshots")).rows;
    await pool.query("ALTER TABLE price_history ADD CONSTRAINT synthetic_failure CHECK (player_id <> 'p0700')");
    await expect(publishReconstructedPoints(db(), data, plan)).rejects.toThrow(/synthetic_failure/);
    expect(await readBackup()).toEqual(backup);
    expect((await pool.query("SELECT dataset_id FROM price_history_import_state")).rows[0].dataset_id).toBe("previous");
    await pool.query("ALTER TABLE price_history DROP CONSTRAINT synthetic_failure");
    await publishReconstructedPoints(db(), data, plan);
    expect((await readBackup()).filter(p => p.source === "gamelog")).toHaveLength(1200);
    expect((await readBackup()).filter(p => p.source === "live")).toEqual(backup.filter(p => p.source === "live"));
    expect((await pool.query("SELECT * FROM stock_snapshots")).rows).toEqual(observed);
    expect((await pool.query("SELECT dataset_id FROM price_history_import_state")).rows[0].dataset_id).toBe(data.manifest.datasetId);
    expect(requestBytes).toBeLessThan(64 * 1024 * 1024);
  });
  it("serializes competing publications and rejects the stale baseline instead of mixing generations", async () => {
    const backup = await readBackup(), a = candidate(1000), b = candidate(1100);
    const results = await Promise.allSettled([
      publishReconstructedPoints(db(), a, createPublicationPlan(backup, a)),
      publishReconstructedPoints(db(), b, createPublicationPlan(backup, b)),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    const rows = (await readBackup()).filter(p => p.source === "gamelog");
    expect(rows).toHaveLength(1200);
    expect(new Set(rows.map(p => p.priceCents)).size).toBe(1);
  });
  it("repeats stable IDs with a fresh plan and enforces natural uniqueness", async () => {
    const data = candidate();
    await publishReconstructedPoints(db(), data, createPublicationPlan(await readBackup(), data));
    const first = await readBackup();
    const retry = createPublicationPlan(first, data);
    expect(retry).toMatchObject({ unchanged: 1200, added: 0, removed: 0, preservedRows: 1 });
    await publishReconstructedPoints(db(), data, retry);
    expect(await readBackup()).toEqual(first);
    await expect(pool.query(`INSERT INTO price_history (player_id,date,price_cents,source,season)
      SELECT player_id,date,price_cents,source,season FROM price_history WHERE player_id='p0000'`)).rejects.toThrow(/price_history_point_unique/);
  });
});
