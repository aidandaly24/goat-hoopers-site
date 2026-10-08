import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkSurfaceContracts, checkSurfaceSource } from "../../scripts/surface-contracts";

const file = "surfaces/stock-market/StockRow.tsx";
const check = (source: string) => checkSurfaceSource(file, source);

// These inputs describe policy outcomes; none of the fixture source is executed.
describe("surface runtime boundaries", () => {
  it.each([
    'import {\n getDb,\n} from "@/data/db";',
    'import {\n getDb,\n} from "../../data/db";',
    'import "../../data/db.ts";',
    'import * as sleeper from "@/data/sleeper";',
    'import {\n toSeason,\n} from "@/data/transform";',
    'import { toSeason } from "../../data/transform";',
    'import { sql } from "drizzle-orm/pg-core";',
    'import { neon } from "@neondatabase/serverless";',
    'import { Client } from "pg";',
    'export { getDb } from "../../data/db";',
    'export * from "@/data/sleeper";',
    'const db = await import(\n "../../data/db"\n);',
    'const db = require("@/data/db");',
    'import db = require("../../data/db");',
    'import { type Database, getDb } from "@/data/db";',
    'import Database, { type Row } from "@/data/db";',
  ])("rejects a runtime data-client dependency: %s", (source) => {
    expect(check(source)).toEqual([expect.objectContaining({ file, line: 1, message: expect.stringContaining("runtime import of data client") })]);
  });

  it.each([
    'import type {\n Database,\n} from "../../data/db";',
    'import { type Database, type Row } from "@/data/db";',
    'import type * as Db from "@/data/db";',
    'export type { Database } from "../../data/db";',
    'export { type Database } from "@/data/db";',
    'type Database = import("../../data/db").Database;',
    'import type db = require("../../data/db");',
    'import type { toSeason } from "@/data/transform";',
    'import { type toSeason } from "../../data/transform";',
    'import { getSeasonHubData } from "@/data/league";',
    'import { fetchStockDetail } from "@/data/stock-detail-client";',
    'import { useLiveGames } from "@/data/espn-client";',
    'import { pgLabel } from "./pg-label";',
  ])("allows erased types and supported seams: %s", (source) => {
    expect(check(source)).toEqual([]);
  });

  it("resolves nested relative paths and reports the import's starting line", () => {
    expect(checkSurfaceSource("surfaces/stock-market/internal/Row.tsx", '\n// a note\nimport {\n getDb\n} from "../../../data/db.ts";')).toEqual([
      expect.objectContaining({ file: "surfaces/stock-market/internal/Row.tsx", line: 3, message: expect.stringContaining("runtime import") }),
    ]);
  });

  it("ignores import/fetch text in comments and ordinary strings", () => {
    expect(check('// import { getDb } from "@/data/db";\n/* fetch("//evil.example/api") */\nconst example = `fetch("https://evil.example")`;')).toEqual([]);
  });

  it("fails closed on a nonliteral runtime module path", () => {
    expect(check("const target = '../../data/db'; import(target);")).toEqual([
      expect.objectContaining({ message: expect.stringContaining("literal path") }),
    ]);
  });
});

describe("documented composite entrypoints", () => {
  it.each([
    ["surfaces/intel/IntelHub.tsx", "@/surfaces/preview/MatchupPreview"],
    ["surfaces/intel/IntelHub.tsx", "../playoffs/PlayoffOdds.tsx"],
    ["surfaces/intel/IntelHub.tsx", "@/surfaces/power-rankings/PowerRankings"],
    ["surfaces/intel/IntelHub.tsx", "../records/RecordBook"],
    ["surfaces/teams/TeamProfile.tsx", "../history/FranchiseSection"],
  ])("allows %s to compose %s", (importer, target) => {
    expect(checkSurfaceSource(importer, `import {\n Component\n} from "${target}";`)).toEqual([]);
  });

  it.each([
    ["surfaces/stock-market/StockRow.tsx", "../history/FranchiseSection"],
    ["surfaces/intel/IntelHub.tsx", "../preview/internal/helper"],
    ["surfaces/intel/Other.tsx", "../preview/MatchupPreview"],
    ["surfaces/teams/internal/Profile.tsx", "../../history/FranchiseSection"],
    ["surfaces/teams/TeamProfile.tsx", "@/surfaces/history/private/helper"],
  ])("rejects private or undocumented composition by %s of %s", (importer, target) => {
    expect(checkSurfaceSource(importer, `import {\n Component\n} from "${target}";`)).toEqual([
      expect.objectContaining({ message: expect.stringContaining("sibling surface") }),
    ]);
  });

  it("allows same-surface internals and cross-surface erased types", () => {
    expect(check('import { formatPrice } from "./format";\nimport type { DetailState } from "../history/internal/types";')).toEqual([]);
    expect(check('import { type DetailState } from "@/surfaces/history/internal/types";')).toEqual([]);
  });

  it.each([
    'export { FranchiseSection } from "../history/FranchiseSection";',
    'import("@/surfaces/history/FranchiseSection");',
    'require("../history/FranchiseSection");',
  ])("checks runtime re-exports and dynamic imports: %s", (source) => {
    expect(check(source)).toEqual([expect.objectContaining({ message: expect.stringContaining("sibling surface") })]);
  });
});

describe("surface fetch boundary", () => {
  it.each([
    'fetch("/api/stocks/123");',
    'fetch(\n "/api/stocks/123?detail=1"\n);',
    'fetch(`/api/stocks/${playerId}`);',
    'globalThis.fetch("/api/stocks/123");',
    'window.fetch(("/api/stocks/123"));',
    'fetch("/api/stocks/123"); fetch("/api/stocks/456");',
  ])("allows a fixed app API prefix: %s", (source) => {
    expect(check(source)).toEqual([]);
  });

  it.each([
    '//evil.example/api/stocks/123',
    'https://api.sleeper.app/v1/league/123',
    '/stocks/123',
    '/api-elsewhere/123',
    '/api',
    '/api/../outside',
    '/api/%2e%2e/outside',
    '/\\evil.example/api/stocks/123',
    '/api/\\..\\outside',
    ' /api/stocks/123',
  ])("rejects a URL outside the app API boundary: %s", (url) => {
    expect(check(`fetch(\n ${JSON.stringify(url)}\n);`)).toEqual([
      expect.objectContaining({ line: 1, message: expect.stringContaining("same-origin /api/*") }),
    ]);
  });

  it.each([
    'fetch(`//${host}/api/stocks/123`);',
    'fetch(`${origin}/api/stocks/123`);',
    'fetch(endpoint);',
    'fetch();',
    'globalThis.fetch("//evil.example/api/123");',
  ])("fails closed when an API prefix cannot be established: %s", (source) => {
    expect(check(source)).toEqual([expect.objectContaining({ message: expect.stringContaining("same-origin /api/*") })]);
  });

  it("checks every fetch on a line and ignores safe calls", () => {
    expect(check('fetch("/api/stocks/123"); fetch("//evil.example/api/123"); fetch("/outside");')).toHaveLength(2);
  });
});

it("walks production sources without treating test fixtures as shipped dependencies", () => {
  const src = mkdtempSync(join(tmpdir(), "surface-contracts-"));
  const write = (path: string, content: string) => {
    mkdirSync(dirname(join(src, path)), { recursive: true });
    writeFileSync(join(src, path), content);
  };
  try {
    write("surfaces/teams/TeamProfile.tsx", 'import { FranchiseSection } from "../history/FranchiseSection";');
    write("surfaces/teams/nested/Bad.ts", 'import { getDb } from "../../../data/db";');
    write("surfaces/teams/client.mts", 'fetch("//evil.example/api/123");');
    write("surfaces/teams/example.test.ts", 'import { getDb } from "@/data/db";');
    write("surfaces/teams/__tests__/fixture.tsx", 'fetch("//evil.example/api/123");');
    const result = checkSurfaceContracts(src);
    expect(result.files).toHaveLength(3);
    expect(result.violations.map((v) => v.file)).toEqual(["surfaces/teams/client.mts", "surfaces/teams/nested/Bad.ts"]);
  } finally {
    rmSync(src, { recursive: true, force: true });
  }
});

it("enforces the contracts on the current production surface tree", () => {
  expect(checkSurfaceContracts(fileURLToPath(new URL("../", import.meta.url))).violations).toEqual([]);
});
