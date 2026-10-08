/** Offline row model for Drizzle-generated SELECTs, not a SQL executor or plan probe. */
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { schema } from "../db";

type FixtureRow = Record<string, string | number>;
export type StockQueryFixture = {
  snapshots: FixtureRow[];
  reconstructed: FixtureRow[];
  missing?: Set<string>;
};
export type FixtureQuery = { sql: string; params: unknown[]; rows: number; bytes: number };
const column = (expression: string) => expression.replaceAll('"', "").trim().split(".").at(-1)!;
const parameter = (placeholder: string, params: unknown[]) => params[Number(placeholder.trim().slice(1)) - 1];

export function fixtureDb(fixture: StockQueryFixture) {
  const calls: FixtureQuery[] = [];
  const query = async (sql: string, params: unknown[]) => {
    const call = { sql, params: [...params], rows: 0, bytes: 0 }; calls.push(call);
    const match = sql.match(/^select(?: distinct on \((.*?)\))? (.*?) from "(.*?)"(.*)$/);
    if (!match) throw new Error(`Unsupported fixture query: ${sql}`);
    const [, distinct, projection, table, rest] = match;
    if (fixture.missing?.has(table)) throw new Error(`Missing fixture table: ${table}`);
    if (!["stock_snapshots", "price_history"].includes(table)) throw new Error(`Unexpected fixture table: ${table}`);
    let rows = [...(table === "stock_snapshots" ? fixture.snapshots : fixture.reconstructed)];
    const where = rest.match(/where ([\w".]+) (?:in \(([^)]*)\)|= (\$\d+))/);
    if (rest.includes("where") && !where) throw new Error(`Unsupported fixture filter: ${rest}`);
    if (where) {
      const allowed = (where[2] ?? where[3]).split(",").map(p => parameter(p, params));
      rows = rows.filter(row => allowed.includes(row[column(where[1])]));
    }
    const order = rest.match(/order by (.*?)(?: limit|$)/)?.[1].split(",").map(part => {
      const [key, direction] = part.trim().split(/\s+/);
      return { key: column(key), direction: direction === "desc" ? -1 : 1 };
    }) ?? [];
    rows.sort((a, b) => {
      for (const { key, direction } of order) {
        if (!(key in a) || !(key in b)) throw new Error(`Unknown fixture column: ${key}`);
        if (a[key] !== b[key]) return (a[key] < b[key] ? -1 : 1) * direction;
      }
      return 0;
    });
    if (distinct) {
      const seen = new Set(); const key = column(distinct);
      rows = rows.filter(row => { if (seen.has(row[key])) return false; seen.add(row[key]); return true; });
    }
    const limit = rest.match(/limit (\$\d+)/)?.[1];
    if (limit) rows = rows.slice(0, Number(parameter(limit, params)));
    const fields = projection.split(",").map(column);
    const values = rows.map(row => fields.map(field => {
      if (!(field in row)) throw new Error(`Unknown fixture projection: ${field}`);
      return row[field];
    }));
    call.rows = values.length;
    // UTF-8 bytes of JSON row arrays returned by the fake transport (no wire overhead).
    call.bytes = Buffer.byteLength(JSON.stringify(values), "utf8");
    return { rows: values };
  };
  // This client is entirely in memory; it never creates a Neon connection.
  const db = drizzle({ query } as unknown as NeonQueryFunction<false, false>, { schema });
  return { db, calls };
}

const uuid = (seed: string, tie?: number) => {
  const hash = createHash("sha256").update(seed).digest("hex");
  const suffix = tie == null ? hash.slice(20, 32) : String(tie).padStart(12, "0");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${suffix}`;
};
export const snapshot = (player: string, date: string, cents: number, tie?: number): FixtureRow => ({
  id: uuid(`${player}|${date}`, tie ?? cents),
  player_id: player, snapshot_at: date, price_cents: cents,
});
export const reconstructed = (player: string, date: string, cents: number, source = "gamelog"): FixtureRow => ({
  id: uuid(`${player}|${date}|${source}`), player_id: player, date,
  price_cents: cents, source, season: "2025-26",
});

export function denseHistoryFixture(): StockQueryFixture {
  return {
    reconstructed: Array.from({ length: 10 }, (_, p) => Array.from({ length: 120 }, (_, d) =>
      reconstructed(`p${p}`, new Date(Date.UTC(2025, 0, 1 + d)).toISOString(), 1000 + d))).flat(),
    snapshots: Array.from({ length: 10 }, (_, p) => Array.from({ length: 30 }, (_, d) =>
      snapshot(`p${p}`, new Date(Date.UTC(2026, 8, 1 + d)).toISOString().replace("T", " ").replace("Z", ""), 2000 + p + d, p * 30 + d + 1))).flat(),
  };
}
