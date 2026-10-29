import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
const base = 'http://localhost:4207/qa/homepage-structures/homepage-corrections/07/';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = [];
const failures = [];
const errors = [];
const assetFailures = [];
const page = await browser.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400 && response.url().startsWith('http://localhost')) assetFailures.push({ url: response.url(), status: response.status() }); });
async function visit(width, view = 'member', text = 100, ai = 'ready') {
  await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
  await page.goto(`${base}?view=${view}&ai=${ai}`);
  await page.waitForFunction(() => document.documentElement.dataset.homepageReady === '07');
  await page.evaluate(async size => { document.documentElement.style.fontSize = `${size}%`; await document.fonts.ready; }, text);
  await page.waitForTimeout(80);
}
async function metrics() {
  return page.evaluate(() => {
    const internal = [...document.querySelectorAll('main *')].filter(el => ['auto', 'scroll'].includes(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(el => el.id || el.className);
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const primary = [...document.querySelectorAll('.matchup,.locker,.bench,.folder,.spotlight,.standings,.league-wire,.games-crate')];
    return {
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
      internal, duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      initiallyHiddenPrimary: primary.filter(el => el.closest('details:not([open])') || getComputedStyle(el).display === 'none' || !el.getBoundingClientRect().height).map(el => el.id || el.className),
      matchups: document.querySelectorAll('.matchup').length, lockers: document.querySelectorAll('.locker').length,
      folders: document.querySelectorAll('.folder').length, stories: document.querySelectorAll('.spotlight').length,
      standings: document.querySelectorAll('.standings>li').length,
      publicPrivateLeaks: new URLSearchParams(location.search).get('view') === 'public' ? document.querySelectorAll('#values,.team-wire,.completed-guide,a[href="/team"]').length : 0,
      bodyText: document.body.innerText,
      fonts: { dm: document.fonts.check('16px ClubDM'), lora: document.fonts.check('16px ClubLora') }
    };
  });
}
for (const width of [1440, 390, 320]) for (const view of ['member', 'public']) for (const text of [100, 200]) {
  await visit(width, view, text);
  const m = await metrics();
  if (m.scrollWidth > width || m.internal.length || m.duplicateIds.length || m.initiallyHiddenPrimary.length || m.publicPrivateLeaks || m.matchups !== 5 || m.lockers !== 10 || m.stories !== 3 || m.folders !== 2 || m.standings !== 10) failures.push({ width, view, text, reason: m });
  delete m.bodyText;
  results.push({ view, text, ai: 'ready', ...m });
}
for (const ai of ['stale', 'missing']) for (const view of ['member', 'public']) {
  await visit(390, view, 100, ai);
  const m = await metrics();
  const expected = ai === 'stale' ? 'Stale returned choice' : 'Saved model call unavailable';
  if (!m.bodyText.includes(expected) || m.matchups !== 5 || m.lockers !== 10 || m.scrollWidth > 390) failures.push({ ai, view, reason: expected });
  delete m.bodyText;
  results.push({ view, text: 100, ai, ...m });
}
const keyboard = [];
for (const width of [1440, 390]) {
  await visit(width);
  const trigger = page.locator('[data-compare="0"]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const pair = await page.evaluate(() => ({ open: ['locker-1', 'locker-2'].every(id => document.getElementById(id).open), focus: document.activeElement.id, top: document.querySelector('#locker-title').getBoundingClientRect().top }));
  if (!pair.open || pair.focus !== 'locker-title' || pair.top < 0) failures.push({ width, pair });
  await page.locator('[data-jump="2"]').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  const escape = await page.evaluate(() => ({ closed: !document.querySelector('#locker-2').open, firstRetained: document.querySelector('#locker-1').open, focused: document.activeElement === document.querySelector('#locker-2>summary') }));
  if (!escape.closed || !escape.firstRetained || !escape.focused) failures.push({ width, escape });
  await page.locator('#values>summary').focus();
  await page.keyboard.press('Enter');
  const values = await page.locator('#values .value-list>li').count();
  await page.locator('#values [data-close="values"]').focus();
  await page.keyboard.press('Enter');
  const valueClose = await page.evaluate(() => !document.querySelector('#values').open && document.activeElement === document.querySelector('#values>summary'));
  if (values !== 24 || !valueClose) failures.push({ width, values, valueClose });
  await page.locator('#locker-search').fill('AJ Dybantsa');
  const search = await page.evaluate(() => ({ count: document.querySelectorAll('.locker').length, text: document.querySelector('#cabinet').innerText, status: document.querySelector('#locker-count').innerText }));
  if (search.count !== 1 || !search.text.includes('AJ Dybantsa') || !search.status.includes('1 of 10')) failures.push({ width, search });
  await page.locator('#locker-search').fill('');
  await page.locator('#locker-sort').selectOption('name');
  const sort = await page.locator('.locker h3').allTextContents();
  if (sort.join() !== [...sort].sort((a, b) => a.localeCompare(b)).join()) failures.push({ width, sort });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-compare="1"]').focus();
  await page.keyboard.press('Enter');
  const reduced = await page.evaluate(() => ({ open: ['locker-3', 'locker-4'].every(id => document.getElementById(id).open), animations: document.getAnimations().length, allHome: document.querySelectorAll('.matchup').length === 5 && document.querySelectorAll('.spotlight').length === 3 }));
  if (!reduced.open || reduced.animations || !reduced.allHome) failures.push({ width, reduced });
  keyboard.push({ width, pair, escape, values, valueClose, search: { count: search.count, status: search.status }, sort: true, reduced });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
}
for (const width of [1440, 390]) {
  await visit(width);
  await page.screenshot({ path: `/tmp/clubhouse07-${width}.png`, fullPage: true });
}
const report = { checkedAt: new Date().toISOString(), route: base, method: 'Chromium static fixture; root font-size 100%/200%, not browser zoom', results, keyboard, errors, assetFailures, failures, limits: ['No physical device or screen reader', 'Existing product destinations were not executed', 'No production/auth/network provider verification', 'Representative layout/keyboard pass only; root owns four final captures'] };
await writeFile(new URL('./checks.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ combinations: results.length, keyboardWidths: keyboard.length, errors, assetFailures, failures, heights: results.map(item => ({ width: item.width, view: item.view, text: item.text, ai: item.ai, height: item.height })) }, null, 2));
await browser.close();
if (failures.length || errors.length || assetFailures.length) process.exitCode = 1;
