import { createRequire } from 'node:module';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';

const require = createRequire(import.meta.url);
const { build, version: compilerVersion } = require('esbuild');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = process.env.HOME_PLAYER_EVIDENCE ?? '/tmp/goat-home-player-context';
await mkdir(output, { recursive: true });
const shared = {
  bundle: true, jsx: 'automatic', logLevel: 'warning',
  alias: { '@': `${root}/src`, 'next/link': `${root}/qa/paper-slate/link.tsx`, 'next/navigation': `${root}/qa/controls/navigation.ts` },
  external: ['/design-preview/*', '/courtside/*'],
  define: { 'process.env': JSON.stringify({ NODE_ENV: 'development' }) },
};
await build({ ...shared, entryPoints: [`${root}/qa/home-player-context/verify.tsx`], platform: 'node', format: 'cjs', outfile: `${output}/verify.cjs` });
const verified = spawnSync(process.execPath, [`${output}/verify.cjs`], { encoding: 'utf8' });
process.stdout.write(verified.stdout); process.stderr.write(verified.stderr);
if (verified.status !== 0) process.exit(verified.status ?? 1);
await writeFile(`${output}/verification.json`, JSON.stringify({ compiler: `esbuild ${compilerVersion}`, node: process.version, ...JSON.parse(verified.stdout) }, null, 2));
if (!process.argv.includes('--serve') && !process.argv.includes('--browser-build')) process.exit(0);
await build({ ...shared, entryPoints: [`${root}/qa/home-player-context/main.tsx`], platform: 'browser', format: 'esm', outfile: `${output}/main.js` });
await writeFile(`${output}/index.html`, '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic player context review</title><link rel="stylesheet" href="/main.css"><div id="root"></div><script type="module" src="/main.js"></script></html>');
if (!process.argv.includes('--serve')) process.exit(0);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
createServer(async (request, response) => {
  if (request.method !== 'GET') { response.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:4204').pathname);
    const base = pathname.startsWith('/courtside/') || pathname.startsWith('/design-preview/') ? `${root}/public` : output;
    const target = resolve(base, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!target.startsWith(`${resolve(base)}/`)) { response.writeHead(403).end(); return; }
    const body = await readFile(target);
    response.writeHead(200, { 'Content-Type': mime[extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Offline fixture destination; use browser Back to return.'); }
}).listen(4204, '127.0.0.1', () => console.log('Offline component fixture: http://127.0.0.1:4204 (synthetic data; GET only)'));
