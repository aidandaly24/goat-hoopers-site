import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Offline only: no network, no secrets, no database.
    include: ["src/**/*.test.ts"],
    // The existing explicit local Postgres command uses a hardcoded loopback
    // target. The default suite rejects fetch and Node socket connections.
    setupFiles: process.env.RUN_PRICE_HISTORY_LOCAL_TEST === "1"
      ? []
      : ["./src/test/offline.ts"],
    testTimeout: 5000,
  },
});
