// Actual production root/parallel slot in a private, credential-free Next app.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const source = path.resolve(process.argv[2] ?? repo);
const next = path.join(repo, 'node_modules/next/dist/bin/next');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'goat-ticker-scope-'));
const probeLog = path.join(temporary, 'probe.jsonl');
const env = { PATH: process.env.PATH, TMPDIR: os.tmpdir(), LANG: 'en_US.UTF-8', TZ: 'UTC',
  NEXT_TELEMETRY_DISABLED: '1', GOAT_TICKER_PROBE_LOG: probeLog,
  NODE_OPTIONS: `--import=${path.join(here, 'guard.mjs')}` };
const logs = [], checks = [];
let server;
const utilityRoots = ['account', 'admin', 'login', 'signup', 'claim', 'forgot-password', 'reset-password'];
const utilityRoutes = utilityRoots.flatMap(root => [`/${root}`, `/${root}/fixture/deep`]);
const contentRoutes = ['/', '/news', '/stocks', '/history', '/teams', '/teams/1', '/team', '/player/fixture-athlete', '/table', '/intel', '/transactions', '/draft', '/weekly/synthetic', '/arcade/free-throw', '/ai-decides', '/accounting', '/login-history'];
const primaryRoutes = [...new Set([...utilityRoutes, ...contentRoutes])].filter(route => route !== '/player/fixture-athlete');
const unmatchedRoute = '/fixture-unmatched-missing/nested';
const matchedNotFoundRoute = '/fixture-matched-missing';
const ids = (body, prefix) => [...new Set([...body.matchAll(new RegExp(`${prefix}_(\\d{2})`, 'g'))].map(match => Number(match[1])))].sort((a, b) => a - b);
const range = count => Array.from({ length: count }, (_, index) => index);
async function callsFor(id) {
  return (await readFile(probeLog, 'utf8')).split('\n').filter(Boolean).map(line => JSON.parse(line)).filter(row => row.id === id);
}
async function clientAssets(origin, body) {
  const references = [...new Set([...body.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+\.js(?:\?[^" ]*)?)"/g)].map(match => match[1]))];
  const texts = await Promise.all(references.map(async href => {
    const url = new URL(href.replaceAll('&amp;', '&'), origin);
    assert.equal(url.origin, origin, 'Fixture asset must remain on its private loopback origin');
    const response = await fetch(url);
    assert.equal(response.status, 200, `Client asset ${href}`);
    return { href, text: await response.text() };
  }));
  return { assets: texts.length, bytes: texts.reduce((total, asset) => total + Buffer.byteLength(asset.text), 0),
    tickerCodePresent: texts.some(asset => asset.text.includes('Live ticker')), liveScoreHook: 'fixture-null-adapter' };
}
try {
  assert.equal(Number(process.versions.node.split('.')[0]), 22, 'Run this production Next fixture on the repository Node22 CI runtime; do not install a runtime for this probe.');
  await mkdir(path.join(temporary, 'app'), { recursive: true });
  await writeFile(probeLog, '');
  const rootLayout = await readFile(path.join(source, 'src/app/layout.tsx'), 'utf8');
  const fontImport = 'import { Anton, Geist_Mono, Inter } from "next/font/google";';
  assert.equal(rootLayout.split(fontImport).length - 1, 1, 'Copied root must have exactly the reviewed next/font import');
  await writeFile(path.join(temporary, 'app/layout.tsx'), rootLayout.replace(fontImport, 'import { Anton, Geist_Mono, Inter } from "./fixture-fonts";'));
  await copyFile(path.join(source, 'src/app/globals.css'), path.join(temporary, 'app/globals.css'));
  await copyFile(path.join(here, 'fonts.ts'), path.join(temporary, 'app/fixture-fonts.ts'));
  const primaryContent = path.join(temporary, 'app/fixture-content.tsx');
  await copyFile(path.join(here, 'content.tsx'), primaryContent);
  for (const route of primaryRoutes) {
    const directory = path.join(temporary, 'app', ...route.split('/').filter(Boolean));
    await mkdir(directory, { recursive: true });
    const relativeImport = path.relative(directory, primaryContent).split(path.sep).join('/').replace(/\.tsx$/, '');
    const contentImport = relativeImport.startsWith('.') ? relativeImport : `./${relativeImport}`;
    await writeFile(path.join(directory, 'page.tsx'), `import FixtureContent from ${JSON.stringify(contentImport)};\nexport const dynamic = 'force-dynamic';\nexport default function Page() { return <FixtureContent route=${JSON.stringify(route)} />; }\n`);
  }
  await mkdir(path.join(temporary, 'app/player/[playerId]'), { recursive: true });
  await mkdir(path.join(temporary, 'app', matchedNotFoundRoute.slice(1)), { recursive: true });
  await mkdir(path.join(temporary, 'app/api/ticker-probe'), { recursive: true });
  await copyFile(path.join(here, 'dynamic-page.tsx'), path.join(temporary, 'app/player/[playerId]/page.tsx'));
  await copyFile(path.join(here, 'matched-not-found-page.tsx'), path.join(temporary, 'app', matchedNotFoundRoute.slice(1), 'page.tsx'));
  await copyFile(path.join(here, 'not-found.tsx'), path.join(temporary, 'app/not-found.tsx'));
  await copyFile(path.join(here, 'route.ts'), path.join(temporary, 'app/api/ticker-probe/route.ts'));
  await copyFile(path.join(here, 'robots.ts'), path.join(temporary, 'app/robots.ts'));
  await cp(path.join(source, 'src/app/@ticker'), path.join(temporary, 'app/@ticker'), { recursive: true, filter: filename => !filename.includes('.test.') });
  const slotFiles = await readdir(path.join(temporary, 'app/@ticker'));
  assert.ok(['default.tsx', 'page.tsx', 'Ticker.tsx', '[...segments]'].every(filename => slotFiles.includes(filename)), 'Actual production root page, required catch-all, implementation and default must be copied');
  assert.ok(!slotFiles.includes('[[...segments]]'), 'Ticker root and required catch-all must avoid the optional-catch-all specificity collision');
  const primaryFiles = await readdir(path.join(temporary, 'app'));
  assert.ok(!primaryFiles.includes('[...segments]') && !primaryFiles.includes('[[...segments]]') && !primaryFiles.includes('fixture-unmatched-missing'), 'Unknown-path check must have no primary catch-all or matching page');
  await symlink(path.join(repo, 'node_modules'), path.join(temporary, 'node_modules'));
  await symlink(path.join(repo, 'public'), path.join(temporary, 'public'));
  await writeFile(path.join(temporary, 'package.json'), JSON.stringify({ name: 'goat-ticker-scope-regression', private: true }));
  const aliases = { '@/data/league$': path.join(here, 'league.ts'), '@/app/actions$': path.join(here, 'actions.ts'), '@/data/espn-client$': path.join(here, 'espn-client.ts'), '@': path.join(source, 'src') };
  await writeFile(path.join(temporary, 'next.config.mjs'), `export default { experimental: { externalDir: true }, webpack(config) { config.resolve.alias = { ...config.resolve.alias, ...${JSON.stringify(aliases)} }; return config; } };\n`);
  await writeFile(path.join(temporary, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], strict: true, skipLibCheck: true,
    noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', jsx: 'react-jsx',
    resolveJsonModule: true, isolatedModules: true, baseUrl: '.', paths: {
      '@/data/league': [path.join(here, 'league.ts')], '@/app/actions': [path.join(here, 'actions.ts')],
      '@/data/espn-client': [path.join(here, 'espn-client.ts')], '@/*': [path.join(source, 'src/*')],
    },
  }, include: ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'] }));
  const built = spawnSync(process.execPath, [next, 'build', temporary, '--webpack'], { cwd: temporary, env, encoding: 'utf8', timeout: 180000, maxBuffer: 5 * 1024 * 1024 });
  assert.equal(built.status, 0, built.stdout + built.stderr);
  server = spawn(process.execPath, [next, 'start', temporary, '--hostname', '127.0.0.1', '--port', '0'], { cwd: temporary, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => logs.push(chunk.toString()));
  let origin;
  for (let attempt = 0; attempt < 100; attempt++) {
    origin = logs.join('').match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (origin || server.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(origin, logs.join(''));
  const matrix = [
    ...utilityRoutes.map(route => ({ route, scenario: 'full', stockCount: 0, newsCount: 0, excluded: true })),
    ...contentRoutes.map(route => ({ route, scenario: 'full', stockCount: 25, newsCount: 12, excluded: false })),
    ...['empty', 'market-failure', 'news-failure', 'market-only', 'news-only'].map(scenario => ({ route: '/stocks', scenario, stockCount: scenario === 'market-only' ? 25 : 0, newsCount: scenario === 'news-only' ? 12 : 0, excluded: false })),
  ];
  let assets;
  for (const item of matrix) for (const flight of [false, true]) {
    const id = `probe-${checks.length}-${flight ? 'flight' : 'html'}`;
    const response = await fetch(`${origin}${item.route}?fixture=${item.scenario}`, { headers: {
      'x-ticker-probe': id, 'x-ticker-fixture-case': item.scenario, ...(flight ? { RSC: '1' } : {}),
    }, signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    const context = `${item.route}/${item.scenario}/${flight ? 'Flight' : 'HTML'}`;
    assert.equal(response.status, 200, `${context}\n${body.slice(0, 1000)}\n${logs.join('')}`);
    assert.ok(!/Attempted to call|Application error:|"digest":/.test(body), `${context}: Next error payload`);
    assert.ok(body.includes('Synthetic ticker scope primary page'), `${context}: missing primary route`);
    if (flight) assert.match(response.headers.get('content-type') ?? '', /text\/x-component/);
    assert.ok(body.includes('GOAT Hoopers — Fantasy Basketball League'), `${context}: inherited root metadata missing`);
    if (item.route === '/player/fixture-athlete') {
      assert.ok(body.includes('Synthetic dynamic player route'), `${context}: specific dynamic primary route missing`);
      assert.ok(body.includes('Synthetic ticker player fixture-athlete'), `${context}: dynamic metadata missing`);
    } else if (!flight) assert.match(body, /<title>GOAT Hoopers — Fantasy Basketball League<\/title>/);
    const calls = await callsFor(id);
    assert.deepEqual(calls.map(row => row.loader).sort(), item.excluded ? [] : ['market', 'news'], `${context}: loader calls`);
    assert.deepEqual(ids(body, 'TICKER_STOCK_FIXTURE'), range(item.stockCount), `${context}: stock DTO bounds`);
    assert.deepEqual(ids(body, 'TICKER_NEWS_FIXTURE'), range(item.newsCount), `${context}: headline DTO bounds`);
    assert.ok(!body.includes('TICKER_DEEP_FIELD_MUST_NOT_SHIP'), `${context}: deep source fields leaked`);
    const expectedTicker = item.stockCount + item.newsCount > 0;
    if (!flight) {
      assert.equal(body.includes('aria-label="Live ticker"'), expectedTicker, `${context}: rendered ticker`);
      assert.ok(body.includes('<header') && body.includes('<footer') && body.includes('id="main-content"'), `${context}: production shell missing`);
    }
    if (!flight && item.route === '/account' && item.scenario === 'full') assets = await clientAssets(origin, body);
    checks.push({ route: item.route, scenario: item.scenario, transport: flight ? 'Flight' : 'HTML', status: response.status,
      marketCalls: calls.filter(row => row.loader === 'market').length, newsCalls: calls.filter(row => row.loader === 'news').length,
      stockDtoCount: item.stockCount, newsDtoCount: item.newsCount, bytes: Buffer.byteLength(body) });
  }
  for (const route of [unmatchedRoute, matchedNotFoundRoute]) for (const flight of [false, true]) {
    const id = `not-found-${checks.length}-${flight ? 'flight' : 'html'}`;
    const response = await fetch(`${origin}${route}`, { headers: {
      'x-ticker-probe': id, 'x-ticker-fixture-case': 'full', 'User-Agent': 'Googlebot', ...(flight ? { RSC: '1' } : {}),
    }, signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    if (!flight) {
      assert.equal(response.status, 404, 'Non-streamed bot HTML must retain 404 status');
      assert.ok(body.includes('TICKER_FIXTURE_NOT_FOUND') && /name="robots"[^>]*content="noindex"/.test(body), 'Not-found boundary/noindex missing');
    } else {
      assert.ok(response.status === 404 || response.status === 200, 'Unexpected Flight not-found status');
      assert.match(body, /NEXT_HTTP_ERROR_FALLBACK;404/, 'Flight must carry the 404 control signal');
      assert.match(response.headers.get('content-type') ?? '', /text\/x-component/);
    }
    assert.ok(!body.includes('Synthetic ticker scope primary page'), 'Unknown path became a successful primary page');
    const calls = await callsFor(id);
    checks.push({ route, transport: flight ? 'Flight' : 'HTML', status: response.status,
      notFound: true, marketCalls: calls.filter(row => row.loader === 'market').length, newsCalls: calls.filter(row => row.loader === 'news').length,
      primaryMatch: route === unmatchedRoute ? 'none' : 'explicit page invoking notFound()',
      note: 'A matching ticker slot must preserve the primary 404 boundary; streamed Flight may retain HTTP200 with the 404 control signal.' });
  }
  for (const route of ['/api/ticker-probe', '/robots.txt']) for (const flight of [false, true]) {
    const id = `precedence-${checks.length}`;
    const response = await fetch(`${origin}${route}`, { headers: { 'x-ticker-probe': id, ...(flight ? { RSC: '1' } : {}) }, signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    assert.equal(response.status, 200, `${route}: handler status`);
    assert.deepEqual(await callsFor(id), [], `${route}: slot/layout must not run for handlers`);
    assert.ok(!body.includes('TICKER_STOCK_FIXTURE') && !body.includes('TICKER_NEWS_FIXTURE') && !body.includes('<header'), `${route}: application slot intercepted handler`);
    if (route === '/api/ticker-probe') {
      assert.match(response.headers.get('content-type') ?? '', /application\/json/);
      assert.deepEqual(JSON.parse(body), { fixture: 'ticker-route-handler-precedence', probe: id });
    } else {
      assert.match(response.headers.get('content-type') ?? '', /text\/plain/);
      assert.match(body, /User-Agent: \*/); assert.match(body, /Allow: \//);
    }
    checks.push({ route, transport: flight ? 'RSC-header handler request' : 'HTTP', status: response.status, marketCalls: 0, newsCalls: 0, handlerPrecedence: true });
  }
  assert.ok(!logs.join('').includes('Attempted to call'), logs.join(''));
  console.log(JSON.stringify({ source, fixture: 'actual production root layout + root/required-catch-all ticker slot + default + policy', checks,
    explicitPrimaryRoutes: primaryRoutes, dynamicPrimaryRoute: '/player/[playerId]', unmatchedPrimaryRoute: unmatchedRoute,
    utilityClientAssets: assets, fontImportReplacements: 1, credentials: 'absent', externalFetchesAndSockets: 'blocked',
    productionWrites: 'none', fixtureWrites: 'temporary build and request probe log only',
    browserSoftNavigation: 'not exercised; HTML + Flight verify server route matching only' }, null, 2));
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    const timeout = setTimeout(() => server.kill('SIGKILL'), 5000);
    await new Promise(resolve => server.once('exit', resolve));
    clearTimeout(timeout);
  }
  await rm(temporary, { recursive: true, force: true });
}
