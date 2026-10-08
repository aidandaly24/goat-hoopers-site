#!/usr/bin/env npx tsx
/**
 * Check surface composition and data-access contracts (issue #33).
 *
 * Verifies the documented policy in ARCHITECTURE.md §3:
 * 1. No surface imports Sleeper/DB runtime modules. `import type` is
 *    always allowed (types are erased).
 * 2. Cross-surface component imports are only allowed from documented
 *    composite surfaces to documented public entrypoints.
 * 3. fetch() calls in surfaces must be same-origin (/api/*) — the
 *    allowed on-demand detail boundary. No direct Sleeper/DB URLs.
 *
 * Exit 0 if all contracts hold, 1 with a violation list otherwise.
 * Run: npx tsx scripts/check-surface-contracts.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(__dirname, "..", "src");
const SURFACES = join(SRC, "surfaces");

// Documented composite surfaces and their allowed sibling entrypoints.
// Keep in sync with ARCHITECTURE.md §3.
const COMPOSITE_ALLOWLIST: Record<string, string[]> = {
  intel: [
    "@/surfaces/preview/MatchupPreview",
    "@/surfaces/playoffs/PlayoffOdds",
    "@/surfaces/power-rankings/PowerRankings",
    "@/surfaces/records/RecordBook",
  ],
  teams: ["@/surfaces/history/FranchiseSection"],
};

// Runtime modules surfaces must never import (type-only is fine).
const FORBIDDEN_RUNTIME = [
  "@/data/sleeper",
  "@/data/db",
  "drizzle-orm",
  "@neondatabase/serverless",
  "api.sleeper.app",
];

type Violation = { file: string; line: number; message: string };
const violations: Violation[] = [];

function surfaceOf(file: string): string | null {
  const rel = relative(SURFACES, file);
  if (rel.startsWith("..")) return null;
  return rel.split("/")[0];
}

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      walk(full, out);
    } else if (/\.(tsx?|ts)$/.test(entry)) {
      out.push(full);
    }
  }
}

const files: string[] = [];
walk(SURFACES, files);

for (const file of files) {
  const surf = surfaceOf(file);
  if (!surf) continue;
  const lines = readFileSync(file, "utf8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    const trimmed = line.trim();

    // --- Import checks ---
    const importMatch = trimmed.match(
      /^import\s+(type\s+)?(?:[\w*{}\s,]+from\s+)?["']([^"']+)["']/
    );
    if (importMatch) {
      const isTypeOnly = !!importMatch[1];
      const spec = importMatch[2];

      // 1. Forbidden runtime data-client imports (type-only is OK).
      if (!isTypeOnly) {
        for (const forbidden of FORBIDDEN_RUNTIME) {
          if (spec.includes(forbidden)) {
            violations.push({
              file: relative(SRC, file),
              line: lineNo,
              message: `runtime import of data client "${spec}" — surfaces must use @/data/league loaders or /api/* routes`,
            });
          }
        }
      }

      // 2. Cross-surface imports.
      const surfImport = spec.match(/^@\/surfaces\/([^/]+)(\/.*)?$/);
      if (surfImport) {
        const targetSurf = surfImport[1];
        if (targetSurf !== surf) {
          if (isTypeOnly) continue; // type-only is always allowed
          const allowed = COMPOSITE_ALLOWLIST[surf] ?? [];
          if (!allowed.includes(spec)) {
            violations.push({
              file: relative(SRC, file),
              line: lineNo,
              message: `"${surf}" imports sibling surface "${spec}" — only documented composite entrypoints allowed (ARCHITECTURE.md §3)`,
            });
          }
        }
      }
    }

    // --- fetch() checks: must be same-origin ---
    // Matches fetch("...") / fetch(`...`) with a string literal URL.
    const fetchMatch = line.match(/fetch\(\s*[`'"]([^`'"]+)[`'"]/);
    if (fetchMatch) {
      const url = fetchMatch[1];
      if (!url.startsWith("/")) {
        violations.push({
          file: relative(SRC, file),
          line: lineNo,
          message: `fetch("${url}") is not same-origin — surfaces may only fetch the app's own /api/* routes`,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `Surface contract check FAILED: ${violations.length} violation(s)\n`
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}: ${v.message}`);
  }
  process.exit(1);
}

console.log(
  `Surface contract check passed (${files.length} surface files, ` +
    `${Object.keys(COMPOSITE_ALLOWLIST).length} composite surfaces).`
);
