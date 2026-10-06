import { defineConfig } from "drizzle-kit";

/**
 * drizzle.config.ts — schema push configuration.
 *
 * The single source of truth for tables is `src/data/db.ts`.
 * Run `npx drizzle-kit push` with DATABASE_URL set to create or update
 * the tables in Neon (safe to re-run; it diffs against the live schema).
 */
export default defineConfig({
  schema: "./src/data/db.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
