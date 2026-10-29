import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = 'http://localhost:4207/qa/homepage-structures/homepage-corrections/15/';
const cases = [
  ...[1440, 390, 320].flatMap(width => ['member', 'public'].map(view => ({ width, view, ai: 'ready', text: 100 }))),
  ...[1440, 390, 320].map(width => ({ width, view: 'member', ai: 'ready', text: 200 })),
  { width: 1440, view: 'member', ai: 'stale', text: 100 },
  { width: 390, view: 'member', ai: 'missing', text: 100 },
  { width: 320, view: 'public', ai: 'stale', text: 100 },
  { width: 390, view: 'public', ai: 'missing', text: 100 },
];
const results = [];
const errors = [];
const failed = [];
const assert = (value, label) => { if (!value) throw new Error(label); };
try {
  for (const test of cases) {
    const page = await browser.newPage({ viewport: { width: test.width, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push({ ...test, message: error.message }));
    page.on('requestfailed', request => failed.push({ ...test, url: request.url() }));
    page.on('response', response => { if (response.status() >= 400) failed.push({ ...test, url: response.url(), status: response.status() }); });
    await page.goto(`${base}?view=${test.view}&ai=${test.ai}`);
    await page.waitForFunction(() => document.documentElement.dataset.homepageReady === '15');
    if (test.text === 200) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.evaluate(async () => { await document.fonts.ready; });
    const result = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      internalScroll: [...document.querySelectorAll('main *')].filter(element => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1).map(element => element.className),
      lanes: document.querySelectorAll('.match-lane').length,
      standings: document.querySelectorAll('.standings>li').length,
      spotlights: document.querySelectorAll('.spotlight').length,
      completed: !!document.querySelector('.completed-source'),
      savedPicks: document.querySelectorAll('.saved-pick').length,
      fontLoaded: document.fonts.check('16px "Sky DM Sans"'),
      animations: document.getAnimations().length,
      zero: document.querySelector('.match-lane .score').textContent,
      pending: document.querySelectorAll('.match-lane .score')[1].textContent,
      initialContentHidden: [...document.querySelectorAll('.match-lane,.notebook,.league-book,.completed-source,.editorial-source,.spotlight,.closing')].some(element => !element.getClientRects().length),
      firstPairY: Math.round(document.querySelector('.match-lane').getBoundingClientRect().top),
      bodyHeight: document.body.scrollHeight,
    }));
    assert(!result.overflow, `Page overflow: ${JSON.stringify(test)}`);
    assert(!result.internalScroll.length, `Internal scroll: ${JSON.stringify(test)}`);
    assert(result.lanes === 5 && result.standings === 10 && result.spotlights === 3, 'Open content counts');
    assert(result.completed === (test.view === 'member'), 'Member boundary');
    assert(result.savedPicks === (test.ai === 'ready' ? 5 : 0), 'AI status boundary');
    assert(result.zero === '0.0' && result.pending === 'Pending', 'Score null boundary');
    assert(!result.initialContentHidden && result.animations === 0 && result.fontLoaded, 'Initial content/font/motion');
    // Open secondary evidence and complete values at the same narrow/enlarged size.
    await page.locator('[data-event="match-0"]').focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('#agenda-match-0 .agenda-title').evaluate(element => element === document.activeElement), 'Matchup agenda heading focus');
    if (test.ai === 'ready') assert((await page.locator('#agenda-match-0').innerText()).includes('Ware the Hoes At? (35%)'), 'Actual lower-probability returned choice');
    else assert(!(await page.locator('#agenda-match-0').innerText()).includes('%'), 'No stale/missing percentages');
    await page.keyboard.press('Escape');
    assert(await page.locator('[data-event="match-0"]').evaluate(element => element === document.activeElement), 'Matchup origin focus restored');
    await page.locator('[data-event="2026-W41"]').focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('#agenda-2026-W41 .agenda-title').evaluate(element => element === document.activeElement), 'Edition agenda heading focus');
    assert((await page.locator('#agenda-2026-W41').innerText()).includes('2026-10-12T00:00:00Z (end exclusive)'), 'Edition source range');
    await page.keyboard.press('Escape');
    assert(await page.locator('[data-event="2026-W41"]').evaluate(element => element === document.activeElement), 'Edition origin focus restored');
    await page.locator('[data-event="2026-W40"]').click();
    assert((await page.locator('[id="2026-W40"]').innerText()).includes('326.0–251.5'), 'Historical final');
    await page.keyboard.press('Escape');
    if (test.view === 'member') {
      await page.locator('.notebook>details').evaluate(element => { element.open = true; });
      assert(await page.locator('.full-values>li').count() === 24, 'Full member values');
    }
    if (test.width <= 390) {
      await page.locator('[data-format="calendar"]').click();
      assert(await page.locator('.source-nav').isVisible(), 'Phone calendar navigation');
      await page.locator('.source-nav a[href="#2026-W41"]').click();
      assert(await page.locator('[id="2026-W41"]').evaluate(element => element === document.activeElement), 'Calendar date focus');
      await page.locator('[data-format="agenda"]').click();
      await page.locator('#source-jump').selectOption('current');
      assert(await page.locator('#current').evaluate(element => element === document.activeElement), 'Agenda jump keeps source focus');
      await page.locator('.phone-menu summary').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');
      assert(!(await page.locator('.phone-menu').getAttribute('open')), 'Phone menu Escape');
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), 'Expanded content reflow');
    results.push({ ...test, ...result, keyboardAgendaReturn: true, editions: true, expandedReflow: true });
    await page.close();
  }
  assert(errors.length === 0 && failed.length === 0, 'Browser errors or failed requests');
  const report = { checkedAt: new Date().toISOString(), method: 'Local static Chromium fixture; root fontSize=200%, reduced motion', cases: results, errors, failed, limits: ['No physical device, Safari or screen-reader check', 'No production/auth/provider/destination-route validation', 'No full-page captures; root owns final four complete captures'] };
  await writeFile(new URL('./checks.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ cases: results.length, errors: errors.length, failedRequests: failed.length, overflow: results.some(result => result.overflow), internalScroll: results.some(result => result.internalScroll.length), firstPairY: results.filter(result => result.text === 100 && result.ai === 'ready' && result.view === 'member').map(result => [result.width, result.firstPairY]) }, null, 2));
} finally {
  await browser.close();
}
