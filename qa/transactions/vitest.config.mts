import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({
  cacheDir:'qa/transactions/.cache/vitest',
  resolve:{alias:{'@':fileURLToPath(new URL('../../src',import.meta.url))}},
  test:{include:['qa/transactions/source-regressions.test.ts'],setupFiles:['./src/test/offline.ts']},
});
