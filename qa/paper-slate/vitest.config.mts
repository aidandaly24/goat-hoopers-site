import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
/** Same include/setup/timeout as the root config, with a task-owned cache. */
export default defineConfig({
  cacheDir: fileURLToPath(new URL('./.cache/vitest', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  test: { include: ['src/**/*.test.ts'], setupFiles: ['./src/test/offline.ts'], testTimeout: 5000 },
});
