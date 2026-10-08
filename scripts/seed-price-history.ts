#!/usr/bin/env npx tsx
/**
 * Seed price_history on Vercel build — runs once, no-ops after.
 *
 * Checks if price_history has any rows. If empty, runs the full game-log
 * backfill (scripts/backfill-price-history.ts) using the committed JSON
 * data in data/. If already seeded, exits immediately.
 *
 * Safe to run on every build: the count check makes it idempotent.
 * Requires DATABASE_URL (available during Vercel builds).
 */
import { getDb } from "../src/data/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();
  const result = await db.execute(
    sql`SELECT count(*) as count FROM price_history`
  );
  const count = Number((result as any).rows?.[0]?.count ?? 0);
  console.log(`price_history has ${count} rows.`);

  if (count > 0) {
    console.log("Already seeded — skipping backfill.");
    return;
  }

  console.log("Table empty — running backfill…");
  // Point the backfill at the repo's data/ directory.
  process.env.GAMELOG_JSON = "./data/gamelog_mapped.json";
  process.env.SLEEPER_PLAYERS_JSON = "./data/sleeper_players.json";
  await import("./backfill-price-history");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
