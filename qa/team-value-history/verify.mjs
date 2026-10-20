// Actual production Next.js + Chromium boundary and interaction evidence.
// Everything is synthetic; no application credentials, DB or upstream requests.
import assert from 'node:assert/strict';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../..');
const output = process.env.TEAM_HISTORY_EVIDENCE ?? '/tmp/goat-team-history-evidence';
const temporary = await mkdtemp(path.join(os.tmpdir(), 'goat-team-history-next-'));
const { chromium } = createRequire(import.meta.url)(process.env.TEAM_HISTORY_PLAYWRIGHT ?? 'playwright');
const env = { PATH: process.env.PATH, TMPDIR: os.tmpdir(), LANG: 'en_US.UTF-8', TZ: 'UTC', NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: `--import=${path.join(repo, 'src/test/arcade/block-external.mjs')}` };
const report = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  method: 'Actual Next.js production HTML/RSC and Chromium; synthetic history and read-only fixture app routes; no live source/ownership proof.',
  sourceHashes: {}, boundary: [], browser: [], pageErrors: [], external: [], writes: [] };
for (const name of ['src/domain/team-value-history.ts', 'src/surfaces/season-hub/TeamValueHistory.tsx', 'src/surfaces/season-hub/TeamValueHistoryChart.tsx',
  'src/surfaces/season-hub/TeamValueHistoryClient.ts', 'src/surfaces/season-hub/TeamValueHistory.module.css', 'src/test/team-value-history-fixture.ts',
  'qa/team-value-history/verify.mjs', 'qa/team-value-history/page.tsx', 'qa/team-value-history/layout.tsx', 'qa/team-value-history/detail-route.ts', 'qa/team-value-history/summary-route.ts']) {
  report.sourceHashes[name] = createHash('sha256').update(await readFile(path.join(repo, name))).digest('hex');
}
let server, browser;
const logs = [];
try {
  await mkdir(output, { recursive: true });
  await mkdir(path.join(temporary, 'app/api/history-detail'), { recursive: true });
  await mkdir(path.join(temporary, 'app/api/history-summary'), { recursive: true });
  for (const name of ['page.tsx', 'layout.tsx']) await copyFile(path.join(here, name), path.join(temporary, 'app', name));
  await copyFile(path.join(here, 'detail-route.ts'), path.join(temporary, 'app/api/history-detail/route.ts'));
  await copyFile(path.join(here, 'summary-route.ts'), path.join(temporary, 'app/api/history-summary/route.ts'));
  await symlink(path.join(repo, 'node_modules'), path.join(temporary, 'node_modules'));
  await writeFile(path.join(temporary, 'package.json'), JSON.stringify({ name: 'goat-team-history-verification', private: true }));
  await writeFile(path.join(temporary, 'next.config.mjs'), `export default { experimental: { externalDir: true }, webpack(config) { config.resolve.alias['@'] = ${JSON.stringify(path.join(repo, 'src'))}; return config; } };\n`);
  await writeFile(path.join(temporary, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], strict: true, skipLibCheck: true, noEmit: true, esModuleInterop: true,
    module: 'esnext', moduleResolution: 'bundler', jsx: 'react-jsx', resolveJsonModule: true, isolatedModules: true, baseUrl: '.',
    paths: { '@/*': [path.join(repo, 'src/*')] },
  }, include: ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'] }));
  const built = spawnSync(process.execPath, [path.join(repo, 'node_modules/next/dist/bin/next'), 'build', temporary, '--webpack'], { cwd: temporary, env, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  assert.equal(built.status, 0, built.stdout + built.stderr);
  server = spawn(process.execPath, [path.join(repo, 'node_modules/next/dist/bin/next'), 'start', temporary, '--hostname', '127.0.0.1', '--port', '0'], { cwd: temporary, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => logs.push(chunk.toString()));
  let origin;
  for (let attempt = 0; attempt < 100; attempt++) {
    origin = logs.join('').match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (origin) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(origin, logs.join(''));
  for (const state of ['mixed', 'empty', 'one', 'paged']) for (const flight of [false, true]) {
    const response = await fetch(`${origin}/?state=${state}`, { headers: flight ? { RSC: '1' } : {} });
    const body = await response.text();
    assert.equal(response.status, 200, `${state}/${flight}: ${body}\n${logs.join('')}`);
    assert.ok(!/Attempted to call|Application error:|"digest":/.test(body), `${state}/${flight}: boundary error`);
    assert.ok(body.includes(flight ? 'synthetic-history-v1' : 'Team value over time'), `${state}/${flight}: missing component`);
    report.boundary.push({ state, transport: flight ? 'RSC' : 'HTML', status: response.status });
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
  for (const view of [{ width: 1440, height: 1000, theme: 'light' }, { width: 390, height: 844, theme: 'light' },
    { width: 320, height: 740, theme: 'light' }, { width: 320, height: 740, theme: 'light', zoom: true },
    { width: 390, height: 844, theme: 'dark' }]) {
    const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, hasTouch: view.width < 400, reducedMotion: 'reduce' });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') { report.writes.push(url.pathname); return route.abort(); }
      if (url.origin !== origin) { report.external.push(url.hostname); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror', error => report.pageErrors.push(error.message));
    const overflow = async state => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${state}/${JSON.stringify(view)} overflows`);
    for (const state of ['mixed', 'empty', 'one', 'long']) {
      let detailRequests = 0; const count = request => { if (request.url().includes('/api/history-detail')) detailRequests++; };
      page.on('request', count);
      await page.goto(`${origin}/?state=${state}`);
      await page.locator('[data-team-value-history]').waitFor();
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, view.theme);
      if (view.zoom) await page.addStyleTag({ content: 'html{font-size:200%}' });
      await page.waitForTimeout(100); assert.equal(detailRequests, 0, 'detail fetched before inspection');
      await overflow(state);
      assert.equal(await page.getByRole('button', { name: 'All time', exact: true }).getAttribute('aria-pressed'), 'true');
      if (state === 'mixed') {
        assert.deepEqual(await page.locator('[data-history-segment]').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-segment-points')))), [1, 2, 2, 1, 3, 2]);
        await page.getByRole('button', { name: 'Last 30 days', exact: true }).click();
        assert.equal(await page.getByLabel('From', { exact: true }).inputValue(), '2026-09-21');
        await page.getByRole('button', { name: '2025 season', exact: true }).click();
        assert.equal(await page.locator('[data-history-point]').count(), 1);
        assert.equal(await page.locator('[data-team-history-chart] polyline').count(), 0);
        await page.getByRole('button', { name: 'All time', exact: true }).click();
        await page.getByLabel('From', { exact: true }).fill('2026-10-08');
        await page.getByLabel('Through', { exact: true }).fill('2026-10-09');
        await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
        assert.equal(await page.locator('[data-history-point]').count(), 2);
        await page.getByLabel('Inspect day · UTC', { exact: true }).fill('2026-10-09');
        await page.getByRole('button', { name: 'Previous day', exact: true }).click();
        assert.equal(await page.getByLabel('Inspect day · UTC', { exact: true }).inputValue(), '2026-10-08');
        await page.getByRole('button', { name: 'All time', exact: true }).click();
        await page.getByLabel('Inspect day · UTC', { exact: true }).fill('2026-10-13');
        assert.match(await page.locator('[data-history-readout]').innerText(), /Known-value subtotal/);
      }
      if (state === 'empty') assert.equal(await page.locator('[data-history-point]').count(), 0);
      if (state === 'one') assert.equal(await page.locator('[data-team-history-chart] polyline').count(), 0);
      const details = page.locator('details').filter({ has: page.locator('summary', { hasText: /^Roster & moves/ }) });
      await details.locator(':scope > summary').click();
      await page.locator('[data-history-detail]').waitFor();
      assert.equal(detailRequests, 1, 'inspection requested more than one detail');
      await overflow(`${state}/inspection`);
      if (state === 'mixed') {
        assert.match(await page.locator('[data-history-detail]').innerText(), /Unpriced/);
        assert.match(await page.locator('[data-history-detail]').innerText(), /Boundary reconciliation/);
        await page.getByLabel('Inspect day · UTC', { exact: true }).fill('2025-11-01');
        await page.waitForFunction(() => document.querySelector('[data-history-detail]')?.textContent?.includes('0 of 3 players priced'));
        assert.match(await page.locator('[data-history-readout]').innerText(), /Valuation unavailable/);
        await overflow('gap roster inspection');
      }
      if (state === 'one') {
        await page.getByLabel('From', { exact: true }).fill('2026-06-30'); await page.getByLabel('Through', { exact: true }).fill('2026-06-30');
        await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
        assert.equal(await page.getByRole('slider').isDisabled(), true);
        assert.equal(await page.getByRole('button', { name: 'Previous day' }).isDisabled(), true);
        assert.equal(await page.getByRole('button', { name: 'Next day' }).isDisabled(), true);
      }
      const controls = await page.locator('[data-team-value-history] button, [data-team-value-history] input[type=date]').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      assert.ok(controls.every(height => height >= 43.9), `small control at ${view.width}`);
      if (state === 'mixed' || view.width === 320 && state === 'one') await page.locator('[data-team-value-history]').screenshot({ path: path.join(output, `${view.width}-${view.theme}-${view.zoom ? '200' : '100'}-${state}.png`) });
      report.browser.push({ view, state, noInitialDetailFetch: true, rangeAndCoverage: 'passed', disclosure: 'passed', horizontalOverflow: false });
      page.off('request', count);
    }
    await context.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(10000);
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { report.writes.push(url.pathname); return route.abort(); }
    if (url.origin !== origin) { report.external.push(url.hostname); return route.abort(); }
    return route.continue();
  });
  page.on('pageerror', error => report.pageErrors.push(error.message));
  for (const state of ['retry', 'changed', 'malformed', 'race', 'paged']) {
    await page.goto(`${origin}/?state=${state}`);
    if (state === 'paged') {
      assert.equal(await page.locator('[data-history-point="synthetic-point-2026-10-19"]').count(), 0);
      await page.getByRole('button', { name: 'Load more history' }).click();
      await page.locator('[data-history-point="synthetic-point-2026-10-19"]').waitFor({ state: 'attached' });
    } else {
      await page.locator('summary').filter({ hasText: /^Roster & moves/ }).click();
      if (state === 'retry') { await page.getByRole('button', { name: 'Retry roster details' }).click(); await page.locator('[data-history-detail]').waitFor(); }
      if (state === 'changed') await page.getByText('History changed. Refresh the page to inspect the new roster evidence.').waitFor();
      if (state === 'malformed') { await page.getByRole('button', { name: 'Retry roster details' }).waitFor(); assert.equal(await page.locator('[data-history-detail]').count(), 0); }
      if (state === 'race') {
        await page.locator('[data-history-detail]').waitFor();
        await page.getByLabel('Inspect day · UTC', { exact: true }).fill('2026-10-18'); await page.waitForTimeout(300);
        await page.getByLabel('Inspect day · UTC', { exact: true }).fill('2026-10-13');
        await page.waitForFunction(() => document.querySelector('[data-history-detail]')?.textContent?.includes('2 of 3 players priced'));
        await page.waitForTimeout(900);
        assert.match(await page.locator('[data-history-detail]').innerText(), /2 of 3 players priced/);
      }
    }
    report.browser.push({ state, asynchronousBehavior: 'passed' });
  }
  await page.close();
  for (const touch of [false, true]) {
    const context = await browser.newContext({ viewport: { width: touch ? 390 : 1440, height: 900 }, hasTouch: touch, reducedMotion: 'reduce' });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') { report.writes.push(url.pathname); return route.abort(); }
      if (url.origin !== origin) { report.external.push(url.hostname); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror', error => report.pageErrors.push(error.message));
    await page.goto(`${origin}/?state=mixed`);
    const activate = async locator => { if (touch) await locator.tap(); else { await locator.focus(); await page.keyboard.press('Enter'); } };
    await activate(page.getByRole('button', { name: 'Last 30 days', exact: true }));
    await page.waitForFunction(() => document.querySelector('input[type=date]')?.value === '2026-09-21');
    const slider = page.getByRole('slider');
    const before = await page.getByLabel('Inspect day · UTC', { exact: true }).inputValue();
    if (touch) { await slider.scrollIntoViewIfNeeded(); const box = await slider.boundingBox(); await page.touchscreen.tap(box.x + box.width * .4, box.y + box.height / 2); }
    else { await slider.focus(); await page.keyboard.press('ArrowLeft'); }
    assert.notEqual(await page.getByLabel('Inspect day · UTC', { exact: true }).inputValue(), before, 'day scrubber did not respond');
    await activate(page.locator('summary').filter({ hasText: /^Roster & moves/ }));
    await page.locator('[data-history-detail]').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    report.browser.push({ input: touch ? 'touchscreen tap + native slider' : 'keyboard Enter + ArrowLeft', rangeSelection: 'passed', dateInspection: 'passed' });
    await context.close();
  }
  assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.external, []); assert.deepEqual(report.writes, []);
  await writeFile(path.join(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ evidence: output, revision: report.revision, boundary: report.boundary.length, browser: report.browser.length,
    pageErrors: report.pageErrors, externalRequests: report.external, writes: report.writes }, null, 2));
} catch (error) {
  await writeFile(path.join(output, 'failed-verification.json'), JSON.stringify({ ...report, failure: String(error), serverLogs: logs }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
  await rm(temporary, { recursive: true, force: true });
}
