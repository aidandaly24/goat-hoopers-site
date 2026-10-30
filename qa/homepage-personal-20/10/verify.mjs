import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const directory = fileURLToPath(new URL('.', import.meta.url));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
const failedRequests = [];
const requestOrigins = new Set();
page.on('pageerror', error => errors.push(String(error)));
page.on('response', response => { if (response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() }); });
page.on('request', request => requestOrigins.add(new URL(request.url()).origin));
const checks = [];
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/10/';
const assert = (condition, label) => { if (!condition) throw new Error(label); checks.push(label); };
async function ready(persona, width = 1440, suffix = '') {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${base}?persona=${persona}${suffix}`);
  await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '10');
}
const measurements = [];
for (const width of [1440, 1120]) {
  for (const persona of ['reaves', 'neural', 'guest']) {
    await ready(persona, width);
    const measure = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, persona: document.documentElement.dataset.persona, readiness: document.documentElement.dataset.personalStudyReady, controls: [...document.querySelectorAll('button')].filter(button => button.getBoundingClientRect().height < 43.9 && button.getBoundingClientRect().height > 0).map(button => button.textContent.trim()), brokenImages: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.src) }));
    measurements.push({ ...measure, view: persona });
    assert(measure.scrollWidth <= width, `${persona} at ${width}: no horizontal page overflow`);
    assert(measure.persona === persona && measure.readiness === '10', `${persona} at ${width}: resolved persona and ready contract`);
    assert(measure.controls.length === 0, `${persona} at ${width}: rendered button targets at least 44px`);
    assert(measure.brokenImages.length === 0, `${persona} at ${width}: loaded images`);
  }
}
for (const [persona, position, player, matchup] of [['reaves', 'C', '1511', 'm1'], ['neural', 'PF', '1380', 'm4']]) {
  await ready(persona);
  await page.locator('#primary-position').click();
  assert(await page.locator(`[data-position-inspector="${position}"]`).isVisible(), `${persona}: primary position opens`);
  assert(await page.locator('#inspection-title').evaluate(element => element === document.activeElement), `${persona}: position heading receives focus`);
  await page.locator(`#inspection [data-open="player-${player}"]`).click();
  assert(await page.locator(`[data-player-inspector="${player}"]`).isVisible(), `${persona}: position-to-player inspection`);
  await page.goBack();
  assert(await page.locator(`[data-position-inspector="${position}"]`).isVisible(), `${persona}: browser Back restores position`);
  await page.goBack();
  assert(await page.locator('#inspection').isHidden(), `${persona}: browser Back closes inspection`);
  assert(await page.locator('#primary-position').evaluate(element => element === document.activeElement), `${persona}: browser Back restores primary focus`);
  await page.goForward();
  assert(await page.locator(`[data-position-inspector="${position}"]`).isVisible(), `${persona}: browser Forward restores position`);
  await page.keyboard.press('Escape');
  assert(await page.locator('#primary-position').evaluate(element => element === document.activeElement), `${persona}: Escape restores origin focus`);
  await page.locator('#lead-player').click();
  assert(await page.locator(`[data-player-inspector="${player}"]`).isVisible(), `${persona}: named lead holding opens`);
  await page.locator('#inspection [data-close]').first().click();
  assert(await page.locator('#lead-player').evaluate(element => element === document.activeElement), `${persona}: Close restores named holding focus`);
  await page.locator('#primary-matchup').click();
  assert(await page.locator(`[data-matchup-inspector="${matchup}"]`).isVisible(), `${persona}: own matchup opens`);
  const text = await page.locator('#inspection').innerText();
  assert(persona === 'reaves' ? text.includes('56%') && text.includes('0.35') && text.includes('not calibrated odds') : text.includes('Not returned') && text.includes('0.0') && text.includes('No leader'), `${persona}: exact model or null-versus-zero context`);
  await page.keyboard.press('Escape');
  assert(await page.locator('#primary-matchup').evaluate(element => element === document.activeElement), `${persona}: matchup Escape restores focus`);
}
await ready('guest');
await page.locator('#primary-matchup').click();
assert(await page.locator('[data-matchup-inspector="m1"]').isVisible(), 'guest: first public matchup opens');
assert(!(await page.locator('#inspection').innerText()).includes('56%'), 'guest: no personal saved model');
await page.keyboard.press('Escape');
await page.locator('#matchup-m4').click();
assert((await page.locator('#inspection').innerText()).includes('Not returned'), 'guest: partial public matchup remains unknown');
await page.keyboard.press('Escape');
await page.locator('[data-team-disclosure="8"] summary').click();
assert((await page.locator('[data-team-disclosure="8"]').innerText()).includes('Under the previous manager as QBs Gremlins.'), 'guest: Neural historical ownership qualification');

await ready('neural');
assert(await page.locator('.unpriced-note').count() === 2, 'neural: unknown PF and PG players are unscaled text');
assert((await page.locator('.overview-foot').innerText()).includes('1,622.00'), 'neural: exact known-only subtotal');
const colored = await page.locator('.overview').boundingBox();
await ready('neural', 1440, '&stage=structure');
const structure = await page.locator('.overview').boundingBox();
assert(colored.width === structure.width && colored.height === structure.height, 'structure: same overview geometry and content');
assert(await page.locator('.allocation-ribbon span').count() === 5, 'structure: allocation geometry retained');

await ready('reaves');
await page.screenshot({ path: `${directory}browser-reaves-1440.png`, fullPage: false });
await ready('neural');
await page.screenshot({ path: `${directory}browser-neural-1440.png`, fullPage: false });
for (const persona of ['reaves', 'neural', 'guest']) {
  await ready(persona, 1120);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const enlarged = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('main *,header *,footer *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 15).map(element => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right })) }));
  measurements.push({ view: `${persona} enlarged text 200% at 1120`, ...enlarged });
  assert(enlarged.scrollWidth <= enlarged.width, `${persona} enlarged text 200% at 1120: no horizontal page overflow`);
}
await ready('reaves');
await page.keyboard.press('Tab');
assert(await page.locator('.skip-link').evaluate(element => element === document.activeElement), 'keyboard: first Tab exposes Skip to content');
await page.keyboard.press('Enter');
assert(await page.locator('#main').evaluate(element => element === document.activeElement), 'keyboard: Skip to content focuses main');
await page.locator('#primary-position').focus();
await page.keyboard.press('Enter');
assert(await page.locator('[data-position-inspector="C"]').isVisible(), 'keyboard: Enter activates primary position');
await page.keyboard.press('Escape');
assert(await page.locator('#primary-position').evaluate(element => element === document.activeElement), 'keyboard: Escape returns to primary position');
assert(failedRequests.length === 0, 'no HTTP error responses');
assert([...requestOrigins].every(origin => origin === 'http://127.0.0.1:4207'), 'all page requests stayed on the existing local static server');
assert(errors.length === 0, 'no browser page errors');
const output = { scope: 'Bounded system Chromium verification, reduced motion enabled. Six viewport/persona loads, actual first-three task flows, browser Back/Forward, source-safe missing states, structure geometry and all-persona 200% text at 1120px.', checks, measurements, pageErrors: errors, failedRequests, requestOrigins: [...requestOrigins] };
await writeFile(`${directory}browser-evidence.json`, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
await browser.close();
