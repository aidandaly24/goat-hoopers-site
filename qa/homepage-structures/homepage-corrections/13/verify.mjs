import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';

const url = 'http://localhost:4207/qa/homepage-structures/homepage-corrections/13/';
const browser = await chromium.launch({executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
const results = [];
const cases = [
  {width: 1440, edition: 'member', ai: 'ready', root: 16},
  {width: 390, edition: 'member', ai: 'ready', root: 16},
  {width: 320, edition: 'member', ai: 'ready', root: 16},
  {width: 390, edition: 'member', ai: 'ready', root: 32},
  {width: 1440, edition: 'public', ai: 'ready', root: 16},
  {width: 390, edition: 'public', ai: 'ready', root: 16},
  {width: 320, edition: 'public', ai: 'stale', root: 16},
  {width: 390, edition: 'public', ai: 'missing', root: 32}
];
for (const c of cases) {
  const page = await browser.newPage({viewport: {width: c.width, height: 900}});
  const errors = [], remote = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith('http://localhost:4207/')) remote.push(r.url()); });
  await page.goto(`${url}?view=${c.edition}&ai=${c.ai}`);
  await page.waitForSelector('html[data-homepage-ready="13"]');
  if (c.root === 32) await page.addStyleTag({content: ':root{font-size:32px!important}'});
  const initial = await page.evaluate(() => {
    const visible = e => !!(e.getBoundingClientRect().width && e.getBoundingClientRect().height);
    const body = document.body.innerText;
    return {
      pageWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      openPrimarySpreads: [...document.querySelectorAll('.chapter > .spread')].filter(visible).length,
      hiddenNotes: document.querySelectorAll('.notes-leaf[hidden]').length,
      standingsRows: document.querySelectorAll('.standings tbody tr').length,
      portraitsLoaded: [...document.images].filter(i => i.complete && i.naturalWidth > 0).length,
      images: document.images.length,
      synthetic: body.includes('Synthetic concept'),
      datedFixture: body.includes('2026-11-12 12:00:00 UTC'),
      knownZero: body.includes('0.0'),
      pending: body.includes('Pending'),
      threeStories: document.querySelectorAll('.spotlight').length,
      historicalFinal: body.includes('326.0 – 251.5'),
      privateValue: body.includes('$1095.25'),
      scouting: body.includes('Scouting notebook'),
      aiMissing: body.includes('Saved picks unavailable.'),
      aiStale: body.includes('Stale saved slate; reference only.'),
      aiRows: document.querySelectorAll('.picks li').length,
      savedChoice: body.includes('Returned choice: Ware the Hoes At?'),
      independentConfidence: body.includes('Independent confidence 20%'),
      internalScroll: [...document.querySelectorAll('main *')].filter(e => ['auto','scroll'].includes(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight).map(e => e.id || e.className),
      fonts: [document.fonts.check('16px "Folio Contents"'), document.fonts.check('16px "Folio Chapter"')]
    };
  });
  // Open this page's five secondary leaves once; primary content must stay.
  for (const id of ['week','club','league','stories','next']) await page.locator(`#spine-${id}`).click();
  const expanded = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    primary: [...document.querySelectorAll('.chapter > .spread')].filter(e => e.getBoundingClientRect().height).length,
    openNotes: document.querySelectorAll('.notes-leaf:not([hidden])').length
  }));
  const ok = initial.pageWidth === initial.scrollWidth && expanded.scrollWidth === c.width && initial.openPrimarySpreads === 5 && initial.standingsRows === 10 && initial.threeStories === 3 && initial.historicalFinal && initial.internalScroll.length === 0 && errors.length === 0 && remote.length === 0 && expanded.primary === 5 && expanded.openNotes === 5 && (c.edition === 'member' ? initial.privateValue && initial.scouting : !initial.privateValue && !initial.scouting) && (c.ai === 'missing' ? initial.aiMissing && initial.aiRows === 0 : initial.aiRows === 5 && initial.savedChoice && initial.independentConfidence) && (c.ai !== 'stale' || initial.aiStale);
  results.push({...c, ok, initial, expanded, errors, remote});
  await page.close();
}
const page = await browser.newPage({viewport: {width: 390, height: 900}, reducedMotion: 'reduce'});
await page.goto(url);
await page.waitForSelector('html[data-homepage-ready="13"]');
await page.keyboard.press('Tab');
const skipFocused = await page.locator('.skip').evaluate(e => e === document.activeElement);
await page.keyboard.press('Enter');
const skipWorks = await page.locator('#folio').evaluate(e => e === document.activeElement);
await page.locator('#spine-week').focus();
await page.keyboard.press('ArrowDown');
const arrowFocus = await page.locator('#spine-club').evaluate(e => e === document.activeElement);
await page.keyboard.press('Enter');
const openedByKeyboard = await page.locator('#notes-club').evaluate(e => !e.hidden && e === document.activeElement);
await page.keyboard.press('Escape');
const escapeReturn = await page.locator('#spine-club').evaluate(e => e === document.activeElement && e.getAttribute('aria-expanded') === 'false');
await page.keyboard.press('Space');
await page.locator('[data-close="club"]').focus();
await page.keyboard.press('Enter');
const buttonReturn = await page.locator('#spine-club').evaluate(e => e === document.activeElement && e.getAttribute('aria-expanded') === 'false');
await page.locator('.contents a[href="#stories"]').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(50);
const anchorWorks = await page.locator('#stories').evaluate(e => e === document.activeElement && Math.abs(e.getBoundingClientRect().top) < 20);
await page.locator('#stories .folio-foot a[href="#next"]').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(50);
const nextAnchor = await page.locator('#next').evaluate(e => e === document.activeElement && Math.abs(e.getBoundingClientRect().top) < 20);
await page.locator('#next .folio-foot a[href="#cover"]').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(50);
const coverReturn = await page.locator('#cover').evaluate(e => e === document.activeElement && Math.abs(e.getBoundingClientRect().top) < 20);
const keyboard = {skipFocused, skipWorks, arrowFocus, openedByKeyboard, escapeReturn, buttonReturn, anchorWorks, nextAnchor, coverReturn, animations: await page.evaluate(() => document.getAnimations().length)};
await browser.close();
const report = {checkedAt: new Date().toISOString(), route: url, cases: results, keyboard, passed: results.every(r => r.ok) && Object.entries(keyboard).every(([key,value]) => key === 'animations' ? value === 0 : value)};
await fs.writeFile(new URL('./checks.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
