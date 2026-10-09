import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

if (process.env.GITHUB_ACTIONS !== "true" || process.env.CI !== "true" || process.env.RUN_AI_POSTGRES_TEST !== "1") throw new Error("AI PostgreSQL tests require the explicit disposable GitHub CI job");

export default defineConfig({
  resolve: { alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "server-only": "next/dist/compiled/server-only/empty.js",
  } },
  test: {
    include: ["src/data/ai-decider/__tests__/postgres.integration.ts"],
    setupFiles: ["./src/test/ai-postgres.ts"],
    maxWorkers: 1,
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});
