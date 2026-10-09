import { defineConfig } from "drizzle-kit";
/** Offline generation only. Applying this additive migration is separately operator-owned. */
export default defineConfig({ schema: "./src/data/friends-auth/schema.ts", out: "./db/friends-auth", dialect: "postgresql" });
