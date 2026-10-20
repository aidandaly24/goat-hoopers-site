// Real Next.js production RSC boundary regression. No application credentials,
// live loaders, external requests or database writes: only synthetic projections.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const source = path.resolve(process.argv[2] ?? repo);
const temporary = await mkdtemp(path.join(os.tmpdir(), 'goat-home-next-'));
const next = path.join(repo, 'node_modules/next/dist/bin/next');
const env = { PATH: process.env.PATH, TMPDIR: os.tmpdir(), LANG: 'en_US.UTF-8', TZ: 'UTC',
  NEXT_TELEMETRY_DISABLED: '1', NODE_OPTIONS: `--import=${path.join(repo, 'src/test/arcade/block-external.mjs')}` };
const logs = [];
let server;
try {
  await mkdir(path.join(temporary, 'app'));
  for (const name of ['page.tsx', 'layout.tsx']) await copyFile(path.join(here, name), path.join(temporary, 'app', name));
  await symlink(path.join(repo, 'node_modules'), path.join(temporary, 'node_modules'));
  await symlink(path.join(repo, 'public'), path.join(temporary, 'public'));
  await writeFile(path.join(temporary, 'package.json'), JSON.stringify({ name: 'goat-home-rsc-regression', private: true }));
  await writeFile(path.join(temporary, 'next.config.mjs'), `export default { experimental: { externalDir: true }, webpack(config) { config.resolve.alias['@'] = ${JSON.stringify(path.join(source, 'src'))}; return config; } };\n`);
  await writeFile(path.join(temporary, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], strict: true, skipLibCheck: true,
    noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler',
    jsx: 'react-jsx', resolveJsonModule: true, isolatedModules: true, baseUrl: '.',
    paths: { '@/*': [path.join(source, 'src/*')] },
  }, include: ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'] }));
  const built = spawnSync(process.execPath, [next, 'build', temporary, '--webpack'], { cwd: temporary, env, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  assert.equal(built.status, 0, built.stdout + built.stderr);
  server = spawn(process.execPath, [next, 'start', temporary, '--hostname', '127.0.0.1', '--port', '0'], { cwd: temporary, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => logs.push(chunk.toString()));
  let origin;
  for (let attempt = 0; attempt < 100; attempt++) {
    origin = logs.join('').match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (origin) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(origin, logs.join(''));
  const checks = [];
  for (const state of ['public', 'member', 'missing-edition', 'archived']) {
    for (const flight of [false, true]) {
      const response = await fetch(`${origin}/?state=${state}`, { headers: flight ? { RSC: '1' } : {} });
      const body = await response.text();
      assert.equal(response.status, 200, `${state}/${flight}: HTTP ${response.status}\n${logs.join('')}`);
      assert.ok(!/Attempted to call|Application error:|"digest":/.test(body), `${state}/${flight}: Next.js error payload\n${logs.join('')}`);
      assert.ok(body.includes(state === 'missing-edition' ? 'The next weekly story is on its way.' : 'Synthetic home anchor fixture'), `${state}/${flight}: missing rendered homepage\n${logs.join('')}`);
      if (flight) assert.match(response.headers.get('content-type') ?? '', /text\/x-component/);
      checks.push({ state, transport: flight ? 'RSC' : 'HTML', status: response.status });
    }
  }
  assert.ok(!logs.join('').includes('Attempted to call'), logs.join(''));
  console.log(JSON.stringify({ source, checks, credentials: 'absent', externalFetches: 'blocked', writes: 'none' }, null, 2));
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise(resolve => server.once('exit', resolve));
  }
  await rm(temporary, { recursive: true, force: true });
}
