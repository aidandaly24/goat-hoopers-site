/**
 * Offline shape + storage-contract tests for the team-value-history store
 * (#217, lane a).
 *
 * No live database is required: the drizzle definitions in src/data/db.ts
 * (the schema source of truth) are pinned via getTableConfig, and
 * migrations/team-value-history.sql is parsed strictly — column SQL type,
 * nullability AND default, plus every index's uniqueness and ordered
 * column list — so the two reviewed artifacts cannot drift. The guard's
 * sensitivity is itself tested: isolated mutations of the migration text
 * (type swap, default flip, unique-key narrowing) must all fail it.
 *
 * The storage contract for uncertain membership is specified here too
 * (Blocker 2, PR #219 review): roster CONFIDENCE (verified | replayed |
 * ambiguous | unavailable) is stored separately from reconciliation
 * ORIGIN (boundary-reconciliation lives only on derived boundary moves),
 * undated moves keep unknown timing (precision 'unknown', effective_at
 * and day NULL), and the round trip from stored rows to the presentation
 * contract's detail semantics invents no dates and promotes no ambiguous
 * membership into a valued roster. The mapping helpers below are the
 * reference implementation of that contract; the producer lane that fills
 * these tables is separately reviewed.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SQL } from "drizzle-orm";
import { PgDialect, getTableConfig, type IndexedColumn } from "drizzle-orm/pg-core";
import {
  rosterBoundaryMoves,
  rosterSnapshotsDaily,
  schema,
  sleeperTransactions,
  teamValuePoints,
} from "../db";

/* ------------------------------------------------------------------ */
/* Contracted shape                                                    */
/* ------------------------------------------------------------------ */

/** Index columns can be SQL expressions in the type; ours are all plain. */
const indexColumnNames = (columns: readonly unknown[]): string[] =>
  columns.map((c) => (c as Partial<IndexedColumn>).name ?? "<expression>");

const dialect = new PgDialect();

/** Normalized SQL for a column default: null when the column has none. */
const defaultSqlOf = (column: { hasDefault: boolean; default?: unknown }): string | null => {
  if (!column.hasDefault) return null;
  const value = column.default;
  if (value instanceof SQL) return dialect.sqlToQuery(value).sql.trim();
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return `'${value}'`;
  throw new Error(`unhandled column default: ${String(value)}`);
};

type ColumnSpec = { type: string; notNull: boolean; default: string | null };
type TableSpec = {
  table: Parameters<typeof getTableConfig>[0];
  name: string;
  columns: Record<string, ColumnSpec>;
  indexes: Record<string, { unique: boolean; columns: string[] }>;
};

const NN = true;
const NULLABLE = false;
const NO_DEFAULT = null;
const col = (type: string, notNull: boolean, def: string | null = NO_DEFAULT): ColumnSpec => ({
  type,
  notNull,
  default: def,
});
const text = col("text", NN);
const tstz = col("timestamp with time zone", NN);
const jsonbNN = col("jsonb", NN);
const intNN = col("integer", NN);
const uuidPk = col("uuid", NN, "gen_random_uuid()");
const createdAt = col("timestamp with time zone", NN, "now()");

const specs: TableSpec[] = [
  {
    table: sleeperTransactions,
    name: "sleeper_transactions",
    columns: {
      id: uuidPk,
      transaction_id: text,
      league_id: text,
      season: text,
      type: text,
      status: text,
      effective_at: tstz,
      source_created_at: tstz,
      week: col("integer", NULLABLE),
      roster_ids: jsonbNN,
      adds: col("jsonb", NULLABLE),
      drops: col("jsonb", NULLABLE),
      waiver_bid: col("integer", NULLABLE),
      settings: col("jsonb", NULLABLE),
      metadata: col("jsonb", NULLABLE),
      raw_payload: jsonbNN,
      retrieved_at: createdAt,
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
      id: uuidPk,
      league_id: text,
      season: text,
      roster_id: intNN,
      date: col("date", NN),
      player_ids: jsonbNN,
      roster_count: col("integer", NULLABLE),
      roster_status: text,
      roster_evidence: col("jsonb", NULLABLE),
      generation: text,
      created_at: createdAt,
    },
    indexes: {
      roster_snapshots_daily_unique: { unique: true, columns: ["league_id", "roster_id", "date", "generation"] },
      roster_snapshots_daily_range_idx: { unique: false, columns: ["league_id", "roster_id", "date"] },
    },
  },
  {
    table: rosterBoundaryMoves,
    name: "roster_boundary_moves",
    columns: {
      id: uuidPk,
      league_id: text,
      season: text,
      roster_id: intNN,
      origin: text,
      type: text,
      status: text,
      precision: text,
      effective_at: col("timestamp with time zone", NULLABLE),
      day: col("date", NULLABLE),
      adds: col("jsonb", NULLABLE),
      drops: col("jsonb", NULLABLE),
      note: col("text", NULLABLE),
      generation: text,
      created_at: createdAt,
    },
    indexes: {
      roster_boundary_moves_roster_idx: { unique: false, columns: ["league_id", "roster_id"] },
    },
  },
  {
    table: teamValuePoints,
    name: "team_value_points",
    columns: {
      id: uuidPk,
      league_id: text,
      season: text,
      roster_id: intNN,
      date: col("date", NN),
      valuation_at: col("timestamp with time zone", NULLABLE),
      subtotal_cents: col("integer", NULLABLE),
      priced_count: intNN,
      roster_count: col("integer", NULLABLE),
      status: text,
      provenance_class: text,
      continuity_id: col("text", NULLABLE),
      priced_set_id: col("text", NULLABLE),
      standalone: col("boolean", NN, "false"),
      source_refs: col("jsonb", NULLABLE),
      generation: text,
      created_at: createdAt,
    },
    indexes: {
      team_value_points_unique: { unique: true, columns: ["league_id", "roster_id", "date", "generation"] },
      team_value_points_range_idx: { unique: false, columns: ["league_id", "roster_id", "date"] },
    },
  },
];

/* ------------------------------------------------------------------ */
/* Strict migration parser — the lockstep guard                        */
/* ------------------------------------------------------------------ */

type ParsedColumn = { type: string; notNull: boolean; default: string | null };
type ParsedTable = {
  columns: Record<string, ParsedColumn>;
  indexes: Record<string, { unique: boolean; table: string; columns: string[] }>;
};

/** Drizzle getSQLType() spellings for the SQL types the migration uses. */
const SQL_TYPE_TO_DRIZZLE: Record<string, string> = {
  TIMESTAMPTZ: "timestamp with time zone",
};

const parseColumnLine = (line: string): { name: string; column: ParsedColumn } | null => {
  const match = line.match(/^(\w+)\s+(.+)$/);
  if (!match) return null;
  const [, name, restRaw] = match;
  let rest = restRaw.replace(/,$/, "").trim();
  let defaultValue: string | null = null;
  const defaultMatch = rest.match(/\s+DEFAULT\s+(.+)$/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1].trim();
    rest = rest.slice(0, defaultMatch.index).trim();
  }
  const primaryKey = /\bPRIMARY KEY\b/.test(rest);
  const notNull = primaryKey || /\bNOT NULL\b/.test(rest);
  const typeToken = rest
    .replace(/\bPRIMARY KEY\b/, "")
    .replace(/\bNOT NULL\b/, "")
    .trim()
    .toUpperCase();
  return {
    name,
    column: {
      type: SQL_TYPE_TO_DRIZZLE[typeToken] ?? typeToken.toLowerCase(),
      notNull,
      default: defaultValue,
    },
  };
};

/**
 * Parse the hand-written migration into tables/indexes. Any statement
 * that is not a CREATE TABLE or CREATE [UNIQUE] INDEX for a contracted
 * table fails the parse (returns null).
 */
const parseMigration = (sql: string): Record<string, ParsedTable> | null => {
  const tables: Record<string, ParsedTable> = {};
  const statements = sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    const tableMatch = statement.match(/^CREATE TABLE (\w+) \(\n([\s\S]*)\n\)$/);
    if (tableMatch) {
      const [, name, body] = tableMatch;
      const columns: Record<string, ParsedColumn> = {};
      for (const rawLine of body.split("\n")) {
        const parsed = parseColumnLine(rawLine.trim());
        if (!parsed || columns[parsed.name]) return null;
        columns[parsed.name] = parsed.column;
      }
      if (tables[name]) return null;
      tables[name] = { columns, indexes: {} };
      continue;
    }
    const indexMatch = statement.match(
      /^CREATE (UNIQUE )?INDEX (\w+)\s+ON (\w+) \(([^)]+)\)$/,
    );
    if (indexMatch) {
      const [, unique, indexName, tableName, columnList] = indexMatch;
      const target = tables[tableName];
      if (!target || target.indexes[indexName]) return null;
      target.indexes[indexName] = {
        unique: Boolean(unique),
        table: tableName,
        columns: columnList.split(",").map((c) => c.trim()),
      };
      continue;
    }
    return null;
  }
  return tables;
};

/** True iff the migration text matches the contracted shape exactly. */
const migrationMatchesSchema = (sql: string): boolean => {
  const parsed = parseMigration(sql);
  if (!parsed) return false;
  const expectedTables = Object.fromEntries(
    specs.map((spec) => [
      spec.name,
      {
        columns: spec.columns,
        indexes: Object.fromEntries(
          Object.entries(spec.indexes).map(([indexName, indexSpec]) => [
            indexName,
            { unique: indexSpec.unique, table: spec.name, columns: indexSpec.columns },
          ]),
        ),
      },
    ]),
  );
  try {
    expect(parsed).toEqual(expectedTables);
    return true;
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------------ */
/* Storage-contract mapping (Blocker 2) — reference implementation     */
/* ------------------------------------------------------------------ */

/** Mirrors of the relevant #218 v1 presentation-contract types. */
type ContractRosterStatus = "verified" | "replayed" | "ambiguous" | "unavailable";
type ContractMove = {
  origin: "transaction" | "draft" | "boundary-reconciliation";
  type: string;
  status: "complete" | "derived";
  effectiveAt: string | null;
  day: string | null;
  precision: "instant" | "day" | "unknown";
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  note: string | null;
};
type ContractDetail = {
  rosterStatus: ContractRosterStatus;
  rosterCount: number | null;
  priced: number;
  subtotalCents: number | null;
  players: string[];
  rosterEvidence: string[];
};

type SnapshotRow = typeof rosterSnapshotsDaily.$inferSelect;
type PointRow = typeof teamValuePoints.$inferSelect;
type BoundaryMoveRow = typeof rosterBoundaryMoves.$inferSelect;

const CONTRACT_ROSTER_STATUSES: readonly string[] = ["verified", "replayed", "ambiguous", "unavailable"];

/**
 * Map a stored snapshot (+ its value point, if any) to the presentation
 * contract's on-inspection detail semantics. Ambiguous/unavailable
 * membership NEVER yields players or a subtotal, whatever is stored; an
 * independently supported count may persist with an empty player list.
 */
const detailFromStorage = (snapshot: SnapshotRow, point: PointRow | null): ContractDetail => {
  if (!CONTRACT_ROSTER_STATUSES.includes(snapshot.rosterStatus)) {
    throw new Error(`stored roster_status is not a contract confidence: ${snapshot.rosterStatus}`);
  }
  const status = snapshot.rosterStatus as ContractRosterStatus;
  const evidence = (snapshot.rosterEvidence as string[] | null) ?? [];
  if (status === "ambiguous" || status === "unavailable") {
    return {
      rosterStatus: status,
      rosterCount: snapshot.rosterCount,
      priced: 0,
      subtotalCents: null,
      players: [],
      rosterEvidence: evidence,
    };
  }
  const playerIds = snapshot.playerIds as string[];
  return {
    rosterStatus: status,
    rosterCount: snapshot.rosterCount ?? playerIds.length,
    priced: point?.pricedCount ?? 0,
    subtotalCents: point?.subtotalCents ?? null,
    players: playerIds,
    rosterEvidence: evidence,
  };
};

/** Map a stored boundary move to the contract move shape, verbatim timing. */
const moveFromStorage = (move: BoundaryMoveRow): ContractMove => ({
  origin: move.origin as ContractMove["origin"],
  type: move.type,
  status: move.status as ContractMove["status"],
  effectiveAt: move.effectiveAt ? move.effectiveAt.toISOString() : null,
  day: move.day,
  precision: move.precision as ContractMove["precision"],
  adds: move.adds as Record<string, number> | null,
  drops: move.drops as Record<string, number> | null,
  note: move.note,
});

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe("team value history schema (#217)", () => {
  for (const spec of specs) {
    describe(spec.name, () => {
      const config = getTableConfig(spec.table);

      it("is registered in the exported drizzle schema", () => {
        expect(Object.values(schema)).toContain(spec.table);
        expect(config.name).toBe(spec.name);
      });

      it("has exactly the contracted columns, types, nullability and defaults", () => {
        const actual = Object.fromEntries(
          config.columns.map((c) => [
            c.name,
            { type: c.getSQLType(), notNull: c.notNull, default: defaultSqlOf(c) },
          ]),
        );
        expect(actual).toEqual(spec.columns);
      });

      it("has a single uuid primary key", () => {
        const pks = config.columns.filter((c) => c.primary);
        expect(pks.map((c) => c.name)).toEqual(["id"]);
      });

      it("has exactly the contracted indexes (uniqueness and ordered columns)", () => {
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

  it("keeps an unknown roster count NULL instead of zero on both roster-bearing tables", () => {
    for (const table of [rosterSnapshotsDaily, teamValuePoints]) {
      const count = getTableConfig(table).columns.find((c) => c.name === "roster_count");
      expect(count?.getSQLType()).toBe("integer");
      expect(count?.notNull).toBe(false);
      expect(count?.hasDefault).toBe(false);
    }
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

  it("keeps boundary-move timing nullable: unknown precision stores no time and no day", () => {
    const config = getTableConfig(rosterBoundaryMoves);
    const effectiveAt = config.columns.find((c) => c.name === "effective_at");
    const day = config.columns.find((c) => c.name === "day");
    expect(effectiveAt?.getSQLType()).toBe("timestamp with time zone");
    expect(effectiveAt?.notNull).toBe(false);
    expect(effectiveAt?.hasDefault).toBe(false);
    expect(day?.getSQLType()).toBe("date");
    expect(day?.notNull).toBe(false);
    expect(day?.hasDefault).toBe(false);
  });
});

describe("roster confidence and reconciliation origin stay separate (Blocker 2 contract)", () => {
  const snapshotColumns = getTableConfig(rosterSnapshotsDaily).columns.map((c) => c.name);
  const boundaryColumns = getTableConfig(rosterBoundaryMoves).columns.map((c) => c.name);

  it("the storage shape carries both meanings in their own places", () => {
    // Confidence + its evidence live on the snapshot…
    expect(snapshotColumns).toContain("roster_status");
    expect(snapshotColumns).toContain("roster_evidence");
    // …origin/timing of derived moves live only on the boundary-move table.
    expect(boundaryColumns).toContain("origin");
    expect(snapshotColumns).not.toContain("origin");
  });

  it("round trip: an ambiguous interval + undated boundary evidence read back exactly", () => {
    // What the producer stores for the 2026 offseason boundary of roster 8:
    // coverage over the interval is ambiguous (membership unestablished),
    // no identities are promoted, the count is unsupported (null), the
    // reconciliation reasoning persists as evidence, and NO value point
    // exists for the day.
    const snapshot: SnapshotRow = {
      id: "00000000-0000-4000-8000-000000000001",
      leagueId: "1387473752807190528",
      season: "2026",
      rosterId: 8,
      date: "2026-08-01",
      playerIds: [],
      rosterCount: null,
      rosterStatus: "ambiguous",
      rosterEvidence: [
        "boundary-move:bm-roster8-2026",
        "Keeper cut set derived by reconciling the 2025 final roster against the 2026 opening lineage; cuts are not transactions in either league feed, so no effective day is proven.",
      ],
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };
    const boundaryMove: BoundaryMoveRow = {
      id: "00000000-0000-4000-8000-000000000002",
      leagueId: "1387473752807190528",
      season: "2026",
      rosterId: 8,
      origin: "boundary-reconciliation",
      type: "boundary-reconciliation",
      status: "derived",
      precision: "unknown",
      effectiveAt: null,
      day: null,
      adds: null,
      drops: { "10001": 8, "10002": 8 },
      note: "Derived keeper cuts at the 2025→2026 boundary; effective day unproven.",
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };

    // On-inspection detail: ambiguous, null count, nothing priced, no
    // players — exactly the adopted contract mapping.
    expect(detailFromStorage(snapshot, null)).toEqual({
      rosterStatus: "ambiguous",
      rosterCount: null,
      priced: 0,
      subtotalCents: null,
      players: [],
      rosterEvidence: snapshot.rosterEvidence,
    });

    // The derived move reads back with unknown timing — no invented
    // effectiveAt or day, and its origin is the reconciliation, not a
    // roster status.
    expect(moveFromStorage(boundaryMove)).toEqual({
      origin: "boundary-reconciliation",
      type: "boundary-reconciliation",
      status: "derived",
      effectiveAt: null,
      day: null,
      precision: "unknown",
      adds: null,
      drops: { "10001": 8, "10002": 8 },
      note: "Derived keeper cuts at the 2025→2026 boundary; effective day unproven.",
    });
  });

  it("round trip: an independently supported count persists without identities or value", () => {
    const snapshot: SnapshotRow = {
      id: "00000000-0000-4000-8000-000000000003",
      leagueId: "1387473752807190528",
      season: "2026",
      rosterId: 8,
      date: "2026-08-02",
      playerIds: [],
      rosterCount: 21,
      rosterStatus: "ambiguous",
      rosterEvidence: ["Roster size confirmed by dated league page capture; identities unresolved."],
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };
    expect(detailFromStorage(snapshot, null)).toEqual({
      rosterStatus: "ambiguous",
      rosterCount: 21,
      priced: 0,
      subtotalCents: null,
      players: [],
      rosterEvidence: snapshot.rosterEvidence,
    });
  });

  it("round trip: an unavailable day maps to unavailable with no value, and an explicit unavailable point invents no line", () => {
    const snapshot: SnapshotRow = {
      id: "00000000-0000-4000-8000-000000000004",
      leagueId: "1282883196567977984",
      season: "2025",
      rosterId: 3,
      date: "2025-09-15",
      playerIds: [],
      rosterCount: null,
      rosterStatus: "unavailable",
      rosterEvidence: null,
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };
    // The producer MAY persist an explicit unavailable point for the day…
    const point: PointRow = {
      id: "00000000-0000-4000-8000-000000000005",
      leagueId: "1282883196567977984",
      season: "2025",
      rosterId: 3,
      date: "2025-09-15",
      valuationAt: null,
      subtotalCents: null,
      pricedCount: 0,
      rosterCount: null,
      status: "unavailable",
      provenanceClass: "unavailable",
      continuityId: null,
      pricedSetId: null,
      standalone: false,
      sourceRefs: null,
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };
    // …but it carries no valuation and no continuity segment.
    expect(point.subtotalCents).toBeNull();
    expect(point.continuityId).toBeNull();
    expect(detailFromStorage(snapshot, point)).toEqual({
      rosterStatus: "unavailable",
      rosterCount: null,
      priced: 0,
      subtotalCents: null,
      players: [],
      rosterEvidence: [],
    });
  });

  it("round trip: a dated verified snapshot stays valid and valued at its own date", () => {
    const snapshot: SnapshotRow = {
      id: "00000000-0000-4000-8000-000000000006",
      leagueId: "1387473752807190528",
      season: "2026",
      rosterId: 8,
      date: "2026-10-19",
      playerIds: ["9001", "9002"],
      rosterCount: null,
      rosterStatus: "verified",
      rosterEvidence: ["Dated Sleeper roster capture at the 2026 opening anchor."],
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };
    const point: PointRow = {
      id: "00000000-0000-4000-8000-000000000007",
      leagueId: "1387473752807190528",
      season: "2026",
      rosterId: 8,
      date: "2026-10-19",
      valuationAt: new Date("2026-10-19T12:00:00.000Z"),
      subtotalCents: 12345,
      pricedCount: 2,
      rosterCount: 2,
      status: "complete",
      provenanceClass: "recorded",
      continuityId: "seg-2026-open",
      pricedSetId: null,
      standalone: false,
      sourceRefs: [{ playerId: "9001", quoteId: "q-1" }],
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };
    expect(detailFromStorage(snapshot, point)).toEqual({
      rosterStatus: "verified",
      rosterCount: 2,
      priced: 2,
      subtotalCents: 12345,
      players: ["9001", "9002"],
      rosterEvidence: snapshot.rosterEvidence,
    });
  });

  it("rejects 'boundary-reconciliation' as a stored roster status", () => {
    const snapshot: SnapshotRow = {
      id: "00000000-0000-4000-8000-000000000008",
      leagueId: "1387473752807190528",
      season: "2026",
      rosterId: 8,
      date: "2026-08-01",
      playerIds: [],
      rosterCount: null,
      rosterStatus: "boundary-reconciliation",
      rosterEvidence: null,
      generation: "gen-test",
      createdAt: new Date("2026-10-19T00:00:00.000Z"),
    };
    expect(() => detailFromStorage(snapshot, null)).toThrow(/not a contract confidence/);
  });
});

describe("migrations/team-value-history.sql stays in lockstep with db.ts", () => {
  const sql = readFileSync("migrations/team-value-history.sql", "utf8");

  it("creates exactly the four contracted tables", () => {
    const created = [...sql.matchAll(/CREATE TABLE (\w+) \(/g)].map((m) => m[1]);
    expect(created.sort()).toEqual([
      "roster_boundary_moves",
      "roster_snapshots_daily",
      "sleeper_transactions",
      "team_value_points",
    ]);
  });

  it("matches the contracted shape exactly (types, nullability, defaults, index columns)", () => {
    expect(migrationMatchesSchema(sql)).toBe(true);
  });

  it("never writes or destroys data (additive DDL only)", () => {
    const statements = sql
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n");
    expect(statements).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/);
  });

  describe("guard sensitivity — isolated migration mutations must fail the lockstep check", () => {
    it("(a) a column SQL type change: subtotal_cents INTEGER → TEXT", () => {
      const mutated = sql.replace("subtotal_cents INTEGER", "subtotal_cents TEXT");
      expect(mutated).not.toBe(sql);
      expect(migrationMatchesSchema(mutated)).toBe(false);
    });

    it("(b) a temporal type change: date DATE → TIMESTAMPTZ", () => {
      const mutated = sql.replace("  date DATE NOT NULL,", "  date TIMESTAMPTZ NOT NULL,");
      expect(mutated).not.toBe(sql);
      expect(migrationMatchesSchema(mutated)).toBe(false);
    });

    it("(c) a narrowed unique key: league isolation removed", () => {
      const mutated = sql.replace(
        "ON sleeper_transactions (league_id, transaction_id)",
        "ON sleeper_transactions (transaction_id)",
      );
      expect(mutated).not.toBe(sql);
      expect(migrationMatchesSchema(mutated)).toBe(false);
    });

    it("(d) a flipped default: standalone DEFAULT false → true", () => {
      const mutated = sql.replace("standalone BOOLEAN NOT NULL DEFAULT false", "standalone BOOLEAN NOT NULL DEFAULT true");
      expect(mutated).not.toBe(sql);
      expect(migrationMatchesSchema(mutated)).toBe(false);
    });
  });
});
