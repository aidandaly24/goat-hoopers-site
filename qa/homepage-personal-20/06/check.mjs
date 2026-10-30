import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./evidence/', import.meta.url));
await mkdir(root, { recursive: true });
await writeFile(`${root}/browser-checks.json`, JSON.stringify({ passed: false, status: 'Checks running; previous evidence superseded.' }, null, 2));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
const badRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => badRequests.push({ url: request.url(), failure: request.failure() }));
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/06/';
const result = { browser: 'Chromium /usr/bin/chromium', checks: [], errors, badRequests };
function assert(condition, message) { if (!condition) throw new Error(message); }
async function ready() { await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '06'); }
async function home(persona, extra = '') { await page.goto(`${base}?persona=${persona}${extra}`); await ready(); }
async function widthCheck(label) {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(Math.max(sizes.document, sizes.body) <= sizes.viewport + 1, `Horizontal overflow: ${label}: ${JSON.stringify(sizes)}`);
  result.checks.push({ check: label, ...sizes, pass: true });
}
const actions = {
  reaves: [['#act-matchup','Reaves Dropper vs Ware the Hoes At?'],['#act-team','Reaves Dropper · Club sheet'],['#act-player','Joel Embiid']],
  neural: [['#act-matchup','papichooter vs NeuralNets'],['#act-team','NeuralNets · Club sheet'],['#act-player','Giannis Antetokounmpo']],
  guest: [['#act-matchup','Reaves Dropper vs Ware the Hoes At?'],['#act-club','Reaves Dropper'],['#act-directory','The ten clubs.']]
};
for (const persona of ['reaves','neural','guest']) {
  await home(persona);
  assert(await page.locator('.clubs > li').count() === 10, `${persona}: ten clubs missing`);
  assert(await page.locator('html').getAttribute('data-persona') === persona, `${persona}: persona dataset`);
  const unloaded = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).map(img => img.src));
  assert(unloaded.length === 0, `${persona}: images unavailable: ${unloaded.join(',')}`);
  await widthCheck(`${persona}: 1440px home`);
  if (persona === 'reaves') {
    assert((await page.locator('[data-score-team="1"]').innerText()) === '184.5', 'Reaves score');
    assert(await page.locator('[data-evidence]').count() === 5, 'Reaves evidence count');
    await page.screenshot({ path: `${root}/reaves-1440.png`, fullPage: true });
  }
  if (persona === 'neural') {
    assert((await page.locator('[data-score-team="8"]').innerText()) === 'Score unavailable', 'Neural null score');
    assert((await page.locator('[data-score-team="7"]').innerText()) === '0', 'papichooter true zero');
    assert(await page.locator('[data-evidence]').count() === 3, 'Neural evidence count');
  }
  if (persona === 'guest') assert(await page.locator('[data-evidence]').count() === 0, 'Guest inherited private sample');
  for (const [selector, expected] of actions[persona]) {
    await page.locator(selector).click();
    await ready();
    await page.locator('[data-detail-heading]').waitFor();
    assert((await page.locator('[data-detail-heading]').innerText()) === expected, `${persona} ${selector}: heading`);
    assert(await page.locator('[data-detail-heading]').evaluate(el => el === document.activeElement), `${persona} ${selector}: heading focus`);
    if (selector === '#act-team') {
      assert(await page.locator('[data-roster-name]').count() === (persona === 'reaves' ? 24 : 22), `${persona}: roster size`);
      if (persona === 'neural') assert(await page.locator('.roster-table tbody td:nth-child(2)').filter({ hasText: /^Unpriced$/ }).count() === 6, 'Neural unpriced count');
      await page.locator('#roster-search').fill(persona === 'reaves' ? 'Embiid' : 'Giannis');
      assert((await page.locator('#roster-count').innerText()) === '1 player shown', 'Roster search');
      await page.locator('#clear-search').click();
    }
    await page.locator('#detail-back').click();
    await ready();
    await page.locator(selector).waitFor();
    assert(await page.locator(selector).evaluate(el => el === document.activeElement), `${persona} ${selector}: restored origin focus`);
    result.checks.push({ check: `${persona}: ${selector} → ${expected} → Back`, headingFocus: true, originFocus: true, pass: true });
  }
}
await page.setViewportSize({ width: 1120, height: 900 });
for (const persona of ['reaves','neural','guest']) {
  await home(persona);
  await widthCheck(`${persona}: 1120px home`);
  if (persona === 'neural') await page.screenshot({ path: `${root}/neural-1120.png`, fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await widthCheck(`${persona}: 1120px + 200% root text`);
  const clipped = await page.locator('.club-link,.club-summary,.score-panel,.sample-row,.game-link,.center-line').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(el => ({ className: el.className, text: el.innerText })));
  assert(clipped.length === 0, `${persona}: enlarged text clipped: ${JSON.stringify(clipped)}`);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
}
await home('neural','&stage=structure');
assert((await page.locator('html').getAttribute('data-stage')) === 'structure', 'Structure stage');
assert((await page.locator('[data-score-team="8"]').innerText()) === 'Score unavailable', 'Structure lost null');
const hiddenImages = await page.locator('img').evaluateAll(images => images.every(img => getComputedStyle(img).visibility === 'hidden'));
assert(hiddenImages, 'Structure image treatment');
result.checks.push({ check: 'Structure mode preserves content and hides imagery without removing boxes', pass: true });
await page.emulateMedia({ reducedMotion: 'reduce' });
await home('reaves');
assert(await page.locator('[data-action]').count() === 3, 'Reduced motion actions');
await page.locator('#act-player').click();
await ready();
assert((await page.locator('[data-detail-heading]').innerText()) === 'Joel Embiid', 'Reduced motion inspection');
result.checks.push({ check: 'Reduced motion: all three actions present; player inspection works', pass: true });
await home('guest');
const routes = await page.locator('.footer-group a').evaluateAll(links => links.map(link => new URL(link.href).pathname));
for (const route of ['/news','/stocks','/history','/arcade','/teams','/transactions','/draft','/intel','/table','/ai-decides','/trade-analyzer','/weekly','/team','/login']) assert(routes.includes(route), `Missing footer route ${route}`);
result.checks.push({ check: 'All 14 non-home fixture destinations in visibly labelled exit footer', pass: true });
await home('reaves');
const colors = await page.evaluate(() => {
  const selectors = ['.clubs .own .club-name','.score-caption','.sample-foot','.game-status','.action.primary','.explore .exit-note','.footer-bottom p'];
  return selectors.map(selector => {
    const el = document.querySelector(selector);
    let ancestor = el;
    let background;
    while (ancestor) { background = getComputedStyle(ancestor).backgroundColor; if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') break; ancestor = ancestor.parentElement; }
    return { selector, foreground: getComputedStyle(el).color, background };
  });
});
function luminance(color) {
  const channels = color.match(/[\d.]+/g).slice(0,3).map(Number).map(value => { const n=value/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4; });
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
for (const color of colors) {
  const a=luminance(color.foreground), b=luminance(color.background);
  color.ratio = Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2));
  assert(color.ratio>=4.5, `Contrast ${JSON.stringify(color)}`);
}
result.checks.push({ check: 'Seven rendered text foreground/background samples meet 4.5:1', samples: colors, pass: true });
await page.locator('#act-team').click();await ready();
await page.locator('#roster-1511').click();await ready();
assert((await page.locator('#detail-back').innerText())==='Back to previous view', 'Nested Back label');
await page.locator('#detail-back').click();await ready();
assert(await page.locator('#roster-1511').evaluate(el=>el===document.activeElement), 'Nested roster focus restoration');
await page.goForward();await ready();
assert((await page.locator('[data-detail-heading]').innerText())==='Joel Embiid', 'Browser Forward detail');
result.checks.push({ check: 'Nested team → player → Back restores roster link; browser Forward restores detail', pass: true });
await home('guest','&view=player&id=1380');
assert((await page.locator('[data-detail-heading]').innerText())==='Not included in this view.', 'Guest direct URL exposed member player');
result.checks.push({ check: 'Guest direct player URL does not inherit member sample', pass: true });
assert(errors.length === 0, `Page errors: ${errors.join(',')}`);
assert(badRequests.length === 0, `Failed requests: ${JSON.stringify(badRequests)}`);
result.passed = true;
await writeFile(`${root}/browser-checks.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
