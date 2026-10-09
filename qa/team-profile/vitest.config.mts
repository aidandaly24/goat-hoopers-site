import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  cacheDir: fileURLToPath(new URL("./.cache/vitest", import.meta.url)),
  resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/offline.ts"],
    testTimeout: 5000,
    maxWorkers: 1,
  },
});
