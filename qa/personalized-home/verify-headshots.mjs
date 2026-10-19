import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.HOME_EVIDENCE ?? '/tmp/goat-home-portrait-review';
mkdirSync(output, { recursive: true });
const assert = (ok, text) => { if (!ok) throw Error(text); };
const image = readFileSync('public/courtside/portraits/player-1362.png');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const report = { checks: [], requests: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url()); report.requests.push(url.origin + url.pathname);
    if (url.origin === 'http://127.0.0.1:4210') {
      if (url.pathname === '/missing-portrait.png') return route.fulfill({ status: 404, body: '' });
      return route.continue();
    }
    if (url.origin === 'https://a.espncdn.com') return route.fulfill({ status: url.pathname.includes('fixture-fail') ? 404 : 200, contentType: 'image/png', body: url.pathname.includes('fixture-fail') ? '' : image });
    throw Error(`Unexpected external request ${url.origin}`);
  });
  await page.goto('http://127.0.0.1:4210/headshots.html');
  await page.getByRole('heading', {name: 'Offline player photograph checks'}).waitFor();
  const teams = page.locator('[data-portrait-team]');
  assert(await teams.count() === 10, 'Expected ten shared team mappings');
  for (const team of await teams.all()) {
    await team.scrollIntoViewIfNeeded();
    await page.waitForFunction(element => [...element.querySelectorAll('img')].length === 3 && [...element.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0), await team.elementHandle());
    report.checks.push(`roster-${await team.getAttribute('data-portrait-team')}: three readable local portraits`);
  }
  for (const id of ['local-priority', 'espn-existing', 'local-failure']) {
    const img = page.locator(`[data-case="${id}"] img`); await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(element => element.complete && element.naturalWidth > 0, await img.elementHandle());
    const src = await img.getAttribute('src');
    assert(id === 'local-priority' ? src.startsWith('/courtside/portraits/') : src.startsWith('https://a.espncdn.com/'), `Wrong source for ${id}`);
    report.checks.push(id);
  }
  for (const id of ['both-fail', 'unknown', 'changed-source']) {
    const node = page.locator(`[data-case="${id}"]`); await node.scrollIntoViewIfNeeded();
    await node.getByRole('img', { name: /headshot unavailable/ }).waitFor();
    assert(await node.locator('img').count() === 0, `Broken image in ${id}`); report.checks.push(id);
  }
  await page.getByRole('button', { name: 'Recover portrait source' }).click();
  const recovered = page.locator('[data-case="changed-source"] img');
  await page.waitForFunction(element => element?.complete && element?.naturalWidth > 0, await recovered.elementHandle());
  report.checks.push('source-change recovery');
  assert(!report.requests.some(url => url.includes('fixture-unused')), 'ESPN fetched despite readable local portrait');
  assert(report.errors.length === 0, `Browser errors: ${report.errors}`);
  await page.screenshot({ path: `${output}/portrait-fallbacks.png`, fullPage: true });
  writeFileSync(`${output}/verification.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, errors: report.errors, report: `${output}/verification.json` }));
} finally { await browser.close(); }
