// Optional Chromium checks of the actual production Power component with synthetic inputs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const origin = process.argv[2];
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const evidence = process.env.HOME_POWER_EVIDENCE ?? '/tmp/goat-home-power-evidence';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', headless: true });
const checks = [], errors = [], external = [], failedResponses = [];
// This deliberately one-route fixture omits the surrounding homepage's existing
// destinations. Preserve their observed prefetch 404s separately, never suppress
// a failed asset, fixture request or unexpected application error.
const omittedDestination = value => {
  const url = new URL(value);
  return url.origin === origin && url.searchParams.has('_rsc')
    && /^\/(weekly|intel|stocks|trade-analyzer|arcade(?:\/free-throw)?|teams\/\d+)$/.test(url.pathname);
};
try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push({ message: message.text(), location: message.location() }); });
  page.on('response', response => { if (response.status() >= 400) failedResponses.push({ url: response.url(), status: response.status() }); });
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    external.push(route.request().url());
    return route.abort();
  });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?state=power-public`);
    const power = page.locator('[data-home-power="available"]');
    const rows = power.locator('[data-power-team]');
    assert.equal(await rows.count(), 10);
    assert.equal(await power.getByLabel('Power rank 8', { exact: true }).count(), 2);
    assert.equal(await power.getByLabel('Unranked', { exact: true }).count(), 1);
    const links = rows.locator('a');
    await links.first().focus();
    for (let index = 0; index < 10; index++) {
      const link = links.nth(index);
      assert.equal(await link.evaluate(element => element === document.activeElement), true);
      assert.ok((await link.boundingBox()).height >= 44, 'profile target below 44px');
      assert.match(await link.getAttribute('href'), /^\/teams\/\d+$/);
      await page.keyboard.press('Tab');
    }
    const summary = power.locator('summary');
    assert.equal(await summary.evaluate(element => element === document.activeElement), true);
    assert.equal(await summary.textContent(), 'Power sources & coverage');
    assert.ok((await summary.boundingBox()).height >= 44, 'sources target below 44px');
    for (let repeat = 0; repeat < 3; repeat++) {
      await page.keyboard.press('Enter');
      assert.equal(await power.locator('details').getAttribute('open'), '');
      await page.keyboard.press('Space');
      assert.equal(await power.locator('details').getAttribute('open'), null);
      assert.equal(await summary.evaluate(element => element === document.activeElement), true);
    }
    await page.keyboard.press('Enter');
    assert.match(await power.locator('time').getAttribute('datetime'), /^2026-/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
    await power.screenshot({ path: path.join(evidence, `power-${width}.png`) });
    await writeFile(path.join(evidence, `power-${width}-accessibility.txt`), await power.ariaSnapshot());
    await rows.locator('strong').evaluateAll(elements => {
      for (const element of elements) element.textContent = 'SyntheticVeryLongUnbrokenTeamIdentity'.repeat(5);
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `long-name overflow at ${width}`);
    checks.push({ width, teams: 10, keyboardLinks: 10, disclosureCycles: 3, focusRetained: true, targets: '44px minimum', reflow: 'pass', longNames: 'pass' });
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?state=power-member`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.locator('[data-home-power] summary').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '200% text overflow');
    await page.locator('[data-home-power]').screenshot({ path: path.join(evidence, `power-${width}-200-percent.png`) });
    checks.push({ width, textSize: '200%', reflow: 'pass', member: true });
  }
  await page.goto(`${origin}/?state=power-public`);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const power = page.locator('[data-home-power]');
    await power.locator('summary').focus();
    const contrast = await power.evaluate(section => {
      const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
        v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
      }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      let ancestor = section;
      while (ancestor && ['rgba(0, 0, 0, 0)', 'transparent'].includes(getComputedStyle(ancestor).backgroundColor)) ancestor = ancestor.parentElement;
      const background = ancestor ? getComputedStyle(ancestor).backgroundColor : 'rgb(255, 255, 255)';
      const ratio = color => { const [high, low] = [luminance(color), luminance(background)].sort((a, b) => b - a); return (high + .05) / (low + .05); };
      const summary = getComputedStyle(section.querySelector('summary'));
      return { text: ratio(summary.color), dimText: ratio(getComputedStyle(section.querySelector('[data-power-team] p')).color), link: ratio(getComputedStyle(section.querySelector('a')).color), focus: ratio(summary.outlineColor), focusWidth: summary.outlineWidth };
    });
    assert.ok(contrast.text >= 4.5 && contrast.dimText >= 4.5 && contrast.link >= 4.5 && contrast.focus >= 3 && parseFloat(contrast.focusWidth) >= 2, JSON.stringify(contrast));
    checks.push({ theme, contrast });
  }
  for (const state of ['power-unavailable', 'power-malformed', 'power-no-totals', 'power-missing-edition', 'power-archived']) {
    await page.goto(`${origin}/?state=${state}`);
    const rows = page.locator('[data-power-team]');
    assert.equal(await rows.count(), ['power-no-totals', 'power-missing-edition'].includes(state) ? 10 : 0);
    if (state === 'power-no-totals') {
      assert.equal(await page.getByLabel('Unranked', { exact: true }).count(), 10);
      assert.equal(await page.getByText('projected pts', { exact: true }).count(), 0);
    }
    if (state === 'power-archived') assert.equal(await page.locator('[data-home-power]').count(), 0);
    checks.push({ state, rows: await rows.count() });
  }
  await writeFile(path.join(evidence, 'network.json'), JSON.stringify({ errors, failedResponses }, null, 2));
  const fixture404s = failedResponses.filter(response => response.status === 404 && omittedDestination(response.url));
  assert.deepEqual(failedResponses.filter(response => !fixture404s.includes(response)), []);
  const unexpectedErrors = errors.filter(error => error.message !== 'Failed to load resource: the server responded with a status of 404 (Not Found)'
    || !omittedDestination(error.location.url) || !fixture404s.some(response => response.url === error.location.url));
  assert.deepEqual(unexpectedErrors, []);
  assert.deepEqual(external, []);
  const report = { method: 'Headless Chromium / isolated production Next.js / synthetic inputs / external requests blocked', browser: browser.version(), checks, unexpectedErrors, external,
    fixtureDestination404s: fixture404s.map(response => new URL(response.url).pathname),
    unverified: ['hosted live data/auth', 'physical devices', 'Safari', 'spoken screen reader', 'destination routes outside fixture'] };
  await writeFile(path.join(evidence, 'browser.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
