#!/usr/bin/env tsx
/** Check the surface contracts documented in ARCHITECTURE.md §3. */
import { join } from "node:path";
import { checkSurfaceContracts } from "./surface-contracts";

const { files, violations } = checkSurfaceContracts(join(__dirname, "..", "src"));

if (violations.length > 0) {
  console.error(`Surface contract check FAILED: ${violations.length} violation(s)\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}: ${v.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Surface contract check passed (${files.length} surface files).`);
}
