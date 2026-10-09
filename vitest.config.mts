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
    // .test.tsx covers presentational surface contracts via
    // react-dom/server static markup (no DOM, no browser needed).
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Always guard I/O. Each explicit local DB flag allows only its fixed
    // numeric loopback host/port; fetch and every other socket stay blocked.
    setupFiles: ["./src/test/offline.ts"],
    testTimeout: 5000,
  },
});
