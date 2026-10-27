// Optional production-component browser checks. All fixture data is synthetic.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const origin = process.argv[2];
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const evidence = process.env.HOME_WEEKLY_EVIDENCE ?? '/tmp/goat-home-weekly-evidence';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', headless: true });
const checks = [];
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?state=weekly-public`);
    const recap = page.locator('[data-weekly-recap="available"]');
    const teams = recap.locator('[data-weekly-team]');
    assert.equal(await teams.count(), 10);
    const summaries = teams.locator('summary');
    await summaries.first().focus();
    await page.keyboard.press('Tab');
    assert.equal(await summaries.nth(1).evaluate(element => element === document.activeElement), true, 'closed detail links entered tab order');
    for (let index = 0; index < 10; index++) {
      const summary = summaries.nth(index);
      assert.ok((await summary.boundingBox()).height >= 44, 'disclosure target below 44px');
      await summary.focus();
      await page.keyboard.press('Enter');
      assert.equal(await teams.nth(index).getAttribute('open'), '');
      const profile = teams.nth(index).locator('a').first();
      assert.equal(await profile.isVisible(), true);
      assert.ok((await profile.boundingBox()).height >= 44, 'profile target below 44px');
      await page.keyboard.press('Enter');
      assert.equal(await teams.nth(index).getAttribute('open'), null);
    }
    for (const id of ['1', '2', '9']) await recap.locator(`[data-weekly-team="${id}"] summary`).click();
    assert.equal(await recap.locator('[data-weekly-team="9"] a[href^="/player/"]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
    await recap.screenshot({ path: path.join(evidence, `weekly-${width}.png`) });
    await page.evaluate(() => {
      for (const element of document.querySelectorAll('[data-weekly-recap] strong, [data-weekly-recap] a[href^="/player/"]')) element.textContent = 'SyntheticVeryLongUnbrokenIdentity'.repeat(5);
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `long-name overflow at ${width}`);
    checks.push({ width, keyboardDisclosures: 10, reflow: 'pass', longNames: 'pass', targets: '44px minimum' });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/?state=weekly-member`);
  assert.equal(await page.getByText('Actual recorded fantasy points for current roster players', { exact: false }).count(), 1);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.locator('[data-weekly-team="1"] summary').click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '200% text overflow');
  checks.push({ textSize: '200%', reflow: 'pass' });
  await page.goto(`${origin}/?state=weekly-public`);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const summary = page.locator('[data-weekly-team="1"] summary');
    await summary.focus();
    const contrast = await summary.evaluate(element => {
      const rgb = text => text.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
      const luminance = color => rgb(color).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
      let ancestor = element;
      while (ancestor && ['rgba(0, 0, 0, 0)', 'transparent'].includes(getComputedStyle(ancestor).backgroundColor)) ancestor = ancestor.parentElement;
      const background = ancestor ? getComputedStyle(ancestor).backgroundColor : 'rgb(255, 255, 255)';
      const ratio = foreground => { const levels = [luminance(foreground), luminance(background)].sort((a, b) => b - a); return (levels[0] + .05) / (levels[1] + .05); };
      const style = getComputedStyle(element);
      return { foreground: style.color, background, text: ratio(style.color), focus: ratio(style.outlineColor), outlineWidth: style.outlineWidth };
    });
    assert.ok(contrast.text >= 4.5 && contrast.focus >= 3 && parseFloat(contrast.outlineWidth) >= 2, JSON.stringify(contrast));
    checks.push({ theme, contrast });
    await page.locator('[data-weekly-recap]').screenshot({ path: path.join(evidence, `weekly-${theme}.png`) });
  }
  await page.goto(`${origin}/?state=weekly-archived`);
  assert.equal(await page.locator('[data-weekly-recap], [data-home-power]').count(), 0);
  assert.deepEqual(errors, []);
  const report = { method: 'Chromium / isolated production Next.js / synthetic inputs / external requests blocked', checks, pageErrors: errors, unverified: ['live data/auth', 'physical phones', 'screen reader', 'destination routes outside fixture'] };
  await writeFile(path.join(evidence, 'browser.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
