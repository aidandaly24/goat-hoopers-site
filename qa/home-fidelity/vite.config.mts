import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = process.env.HOME_REVIEW_SOURCE ?? root;
export default defineConfig({ cacheDir: `/tmp/home-fidelity-vite-${process.env.HOME_REVIEW_PORT ?? 4202}`, root: fileURLToPath(new URL('.', import.meta.url)), publicDir: `${source}/public`,
  resolve: { alias: { 'next/link': `${root}/qa/paper-slate/link.tsx`, 'next/navigation': `${root}/qa/controls/navigation.ts`, '@': `${source}/src` } },
  define: { 'process.env': JSON.stringify({ NODE_ENV: 'development' }) },
  server: { host: '127.0.0.1', port: Number(process.env.HOME_REVIEW_PORT ?? 4202), strictPort: true, fs: { allow: [root, source] } },
});
