import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Offline only: no network, no secrets, no database.
    // Tests that need a live league or DB must opt in explicitly and
    // fail closed when their target is absent (see issue #26).
    include: ["src/**/*.test.ts"],
    testTimeout: 5000,
  },
});
