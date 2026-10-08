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
    include: ["src/**/*.test.ts"],
    testTimeout: 5000,
  },
});
