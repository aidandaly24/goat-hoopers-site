/**
 * Offline shape tests for the team-value-history store (#217, lane a).
 *
 * No database: these pin the drizzle definitions in src/data/db.ts (the
 * schema source of truth) and guard migrations/team-value-history.sql
 * against drifting from them, since the two are applied through separate
 * reviewed paths. The contract invariants that matter — unknown value is
 * NULL (never 0), failed transactions are stored rather than excluded,
 * roster days are calendar dates — are asserted directly.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getTableConfig, type IndexedColumn } from "drizzle-orm/pg-core";
import {
  rosterSnapshotsDaily,
  schema,
  sleeperTransactions,
  teamValuePoints,
} from "../db";

/** Index columns can be SQL expressions in the type; ours are all plain. */
const indexColumnNames = (columns: readonly unknown[]): string[] =>
  columns.map((c) => (c as Partial<IndexedColumn>).name ?? "<expression>");

type ColumnSpec = { type: string; notNull: boolean };
type TableSpec = {
  table: Parameters<typeof getTableConfig>[0];
  name: string;
  columns: Record<string, ColumnSpec>;
  indexes: Record<string, { unique: boolean; columns: string[] }>;
};

const NN = true;
const NULLABLE = false;
const text = { type: "text", notNull: NN };
const tstz = { type: "timestamp with time zone", notNull: NN };
const jsonbNN = { type: "jsonb", notNull: NN };
const intNN = { type: "integer", notNull: NN };

const specs: TableSpec[] = [
  {
    table: sleeperTransactions,
    name: "sleeper_transactions",
    columns: {
      id: { type: "uuid", notNull: NN },
      transaction_id: text,
      league_id: text,
      season: text,
      type: text,
      status: text,
      effective_at: tstz,
      source_created_at: tstz,
      week: { type: "integer", notNull: NULLABLE },
      roster_ids: jsonbNN,
      adds: { type: "jsonb", notNull: NULLABLE },
      drops: { type: "jsonb", notNull: NULLABLE },
      waiver_bid: { type: "integer", notNull: NULLABLE },
      settings: { type: "jsonb", notNull: NULLABLE },
      metadata: { type: "jsonb", notNull: NULLABLE },
      raw_payload: jsonbNN,
      retrieved_at: tstz,
    },
    indexes: {
      sleeper_transactions_league_txn_unique: { unique: true, columns: ["league_id", "transaction_id"] },
      sleeper_transactions_replay_idx: { unique: false, columns: ["league_id", "status", "effective_at"] },
    },
  },
  {
    table: rosterSnapshotsDaily,
    name: "roster_snapshots_daily",
    columns: {
      id: { type: "uuid", notNull: NN },
      league_id: text,
      season: text,
      roster_id: intNN,
      date: { type: "date", notNull: NN },
      player_ids: jsonbNN,
      roster_status: text,
      generation: text,
      created_at: tstz,
    },
    indexes: {
      roster_snapshots_daily_unique: { unique: true, columns: ["league_id", "roster_id", "date", "generation"] },
      roster_snapshots_daily_range_idx: { unique: false, columns: ["league_id", "roster_id", "date"] },
    },
  },
  {
    table: teamValuePoints,
    name: "team_value_points",
    columns: {
      id: { type: "uuid", notNull: NN },
      league_id: text,
      season: text,
      roster_id: intNN,
      date: { type: "date", notNull: NN },
      valuation_at: { type: "timestamp with time zone", notNull: NULLABLE },
      subtotal_cents: { type: "integer", notNull: NULLABLE },
      priced_count: intNN,
      roster_count: intNN,
      status: text,
      provenance_class: text,
      continuity_id: { type: "text", notNull: NULLABLE },
      priced_set_id: { type: "text", notNull: NULLABLE },
      standalone: { type: "boolean", notNull: NN },
      source_refs: { type: "jsonb", notNull: NULLABLE },
      generation: text,
      created_at: tstz,
    },
    indexes: {
      team_value_points_unique: { unique: true, columns: ["league_id", "roster_id", "date", "generation"] },
      team_value_points_range_idx: { unique: false, columns: ["league_id", "roster_id", "date"] },
    },
  },
];

describe("team value history schema (#217)", () => {
  for (const spec of specs) {
    describe(spec.name, () => {
      const config = getTableConfig(spec.table);

      it("is registered in the exported drizzle schema", () => {
        expect(Object.values(schema)).toContain(spec.table);
        expect(config.name).toBe(spec.name);
      });

      it("has exactly the contracted columns, types and nullability", () => {
        const actual = Object.fromEntries(
          config.columns.map((c) => [c.name, { type: c.getSQLType(), notNull: c.notNull }]),
        );
        expect(actual).toEqual(spec.columns);
      });

      it("has a single uuid primary key", () => {
        const pks = config.columns.filter((c) => c.primary);
        expect(pks.map((c) => c.name)).toEqual(["id"]);
      });

      it("has exactly the contracted indexes", () => {
        const actual = Object.fromEntries(
          config.indexes.map((i) => [
            i.config.name,
            { unique: i.config.unique, columns: indexColumnNames(i.config.columns) },
          ]),
        );
        expect(actual).toEqual(spec.indexes);
      });

      it("carries no check constraints (filtering is a read-time concern)", () => {
        expect(config.checks).toEqual([]);
      });
    });
  }

  it("keeps an unknown team value NULL instead of zero", () => {
    const config = getTableConfig(teamValuePoints);
    const subtotal = config.columns.find((c) => c.name === "subtotal_cents");
    expect(subtotal?.getSQLType()).toBe("integer");
    expect(subtotal?.notNull).toBe(false);
    expect(subtotal?.hasDefault).toBe(false);
  });

  it("stores failed transactions: status is a plain verbatim column", () => {
    const config = getTableConfig(sleeperTransactions);
    const status = config.columns.find((c) => c.name === "status");
    expect(status?.getSQLType()).toBe("text");
    expect(status?.notNull).toBe(true);
    // Replay dedupes per league; nothing in the schema drops a league's rows.
    const unique = config.indexes.find((i) => i.config.name === "sleeper_transactions_league_txn_unique");
    expect(unique && indexColumnNames(unique.config.columns)).toEqual(["league_id", "transaction_id"]);
  });

  it("uses UTC calendar dates, not timestamps, for daily roster/value rows", () => {
    for (const table of [rosterSnapshotsDaily, teamValuePoints]) {
      const day = getTableConfig(table).columns.find((c) => c.name === "date");
      expect(day?.getSQLType()).toBe("date");
      expect(day?.notNull).toBe(true);
    }
  });
});

describe("migrations/team-value-history.sql stays in lockstep with db.ts", () => {
  const sql = readFileSync("migrations/team-value-history.sql", "utf8");

  const tableBlock = (name: string): string => {
    const start = sql.indexOf(`CREATE TABLE ${name} (`);
    expect(start, `CREATE TABLE ${name}`).toBeGreaterThanOrEqual(0);
    const end = sql.indexOf(");", start);
    return sql.slice(start, end);
  };

  it("creates exactly the three contracted tables", () => {
    const created = [...sql.matchAll(/CREATE TABLE (\w+) \(/g)].map((m) => m[1]);
    expect(created.sort()).toEqual(["roster_snapshots_daily", "sleeper_transactions", "team_value_points"]);
  });

  for (const spec of specs) {
    it(`${spec.name}: every column matches name and nullability`, () => {
      const block = tableBlock(spec.name);
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const [column, colSpec] of Object.entries(spec.columns)) {
        const line = lines.find((l) => l.startsWith(`${column} `));
        expect(line, `${spec.name}.${column} present in migration`).toBeDefined();
        if (colSpec.notNull) {
          expect(line, `${spec.name}.${column} is NOT NULL or PRIMARY KEY`).toMatch(/NOT NULL|PRIMARY KEY/);
        } else {
          expect(line, `${spec.name}.${column} stays nullable`).not.toMatch(/NOT NULL/);
        }
      }
      const defined = lines
        .filter((l) => !l.startsWith("CREATE TABLE"))
        .map((l) => l.split(/\s+/)[0]);
      expect(defined.sort()).toEqual(Object.keys(spec.columns).sort());
    });

    it(`${spec.name}: every index exists with matching uniqueness`, () => {
      for (const [indexName, indexSpec] of Object.entries(spec.indexes)) {
        const pattern = indexSpec.unique
          ? new RegExp(`CREATE UNIQUE INDEX ${indexName}\\b`)
          : new RegExp(`CREATE INDEX ${indexName}\\b`);
        expect(sql, indexName).toMatch(pattern);
      }
    });
  }

  it("never writes or destroys data (additive DDL only)", () => {
    const statements = sql
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n");
    expect(statements).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/);
  });
});
