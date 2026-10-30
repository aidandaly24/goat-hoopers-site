const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/15/';
const results = { browser: 'System Chromium through existing Playwright', matrix: [], journeys: [], errors: [], nonlocalRequests: [] };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => results.errors.push(e.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4207/')) results.nonlocalRequests.push(request.url()); });
  async function load(persona, width = 1440, structure = false) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}?persona=${persona}${structure ? '&stage=structure' : ''}`);
    await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '15');
  }
  for (const width of [1440, 1120]) {
    for (const persona of ['reaves', 'neural', 'guest']) {
      for (const textScale of [100, 200]) {
        await load(persona, width);
        if (textScale === 200) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        const metrics = await page.evaluate(() => ({
          width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          h1s: document.querySelectorAll('h1').length,
          games: document.querySelectorAll('[data-game], [data-primary-matchup]').length,
          evidence: document.querySelectorAll('[data-evidence-player]').length,
          directory: document.querySelectorAll('.directory-team').length,
          firstFoldEvidence: [...document.querySelectorAll('[data-evidence-player]')].filter(el => el.getBoundingClientRect().top < innerHeight).length,
          primaryActionTop: Math.round(document.querySelector('#primary-matchup-action').getBoundingClientRect().top),
          font: getComputedStyle(document.body).fontFamily,
          persona: document.documentElement.dataset.persona,
        }));
        assert.equal(metrics.scrollWidth, width, `${persona} ${width}/${textScale}: horizontal overflow`);
        assert.equal(metrics.h1s, 1);
        assert.equal(metrics.games, 5);
        assert.equal(metrics.persona, persona);
        if (textScale === 100) {
          assert(metrics.primaryActionTop < 1000, `${persona}: opening matchup action below first fold`);
          assert(metrics.firstFoldEvidence > 0 || persona === 'guest');
        }
        if (persona === 'guest') {
          assert.equal(metrics.directory, 10); assert.equal(metrics.evidence, 0);
          assert.equal(await page.locator('#roster-quotes').count(), 0);
          assert.equal(await page.locator('.saved-model').count(), 0);
        } else {
          assert.equal(metrics.evidence, persona === 'reaves' ? 5 : 3);
          await page.locator('#quote-summary').click();
          assert.equal(await page.locator('[data-quote-player]').count(), persona === 'reaves' ? 24 : 22);
          assert.equal(await page.locator('.quote-number.unpriced').count(), persona === 'reaves' ? 0 : 6);
          const expandedWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          assert.equal(expandedWidth, width, `${persona} expanded quotes ${width}/${textScale}: horizontal overflow`);
          metrics.expandedQuoteWidth = expandedWidth;
        }
        results.matrix.push({ width, persona, textScale, pass: true, ...metrics });
      }
    }
  }

  // Journey 1: the returning Reaves member inspects actual counted points and returns.
  await load('reaves');
  const lillard = page.locator('[data-evidence-player="1444"] button');
  await lillard.click();
  await page.waitForSelector('#inspector[open]');
  assert.equal(await page.locator('#inspector-title').innerText(), 'Damian Lillard');
  assert.match(await page.locator('#inspector-content').innerText(), /42\.5/);
  assert.match(await page.locator('#inspector-content').innerText(), /October 19–25, 2026/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'inspector-title');
  await page.goBack();
  await page.waitForSelector('#inspector:not([open])', { state: 'attached' });
  assert.equal(await lillard.evaluate(el => el === document.activeElement), true);
  await page.goForward();
  await page.waitForSelector('#inspector[open]');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#inspector:not([open])', { state: 'attached' });
  assert.equal(await lillard.evaluate(el => el === document.activeElement), true);
  await page.locator('#primary-matchup-action').click();
  assert.match(await page.locator('#inspector-content').innerText(), /56%/);
  assert.match(await page.locator('#inspector-content').innerText(), /confidence: 0\.35/);
  await page.locator('#close-inspector').click();
  await page.waitForSelector('#inspector:not([open])', { state: 'attached' });
  results.journeys.push({ name: 'Reaves counted-player evidence → Back → Forward → Escape; matched saved-model inspection', selector: '[data-evidence-player="1444"] button', pass: true });

  // Journey 2: Neural locates an unpriced player without turning a missing value into zero.
  await load('neural', 1120);
  await page.locator('#quote-summary').click();
  await page.locator('#quote-sort').selectOption('value');
  assert.equal(await page.locator('[data-quote-player]').first().getAttribute('data-quote-player'), '1350');
  await page.locator('#quote-filter').fill('Ryan');
  assert.equal(await page.locator('[data-quote-player]').count(), 1);
  assert.match(await page.locator('[data-quote-player="4808"]').innerText(), /Unpriced/);
  const ryan = page.locator('[data-quote-player="4808"] button');
  await ryan.click();
  assert.equal(await page.locator('#inspector-title').innerText(), 'Ryan Nembhard');
  assert.match(await page.locator('#inspector-content').innerText(), /Unpriced/);
  assert.match(await page.locator('#inspector-content').innerText(), /Evidence not supplied/);
  await page.keyboard.press('Escape');
  await page.waitForSelector('#inspector:not([open])', { state: 'attached' });
  assert.equal(await ryan.evaluate(el => el === document.activeElement), true);
  await page.locator('#primary-matchup-action').click();
  const neuralGame = await page.locator('#inspector-content').innerText();
  assert.match(neuralGame, /Score not returned/);
  assert.match(neuralGame, /0 recorded/);
  assert.match(neuralGame, /No saved model estimate/);
  await page.keyboard.press('Escape');
  await page.waitForSelector('#inspector:not([open])', { state: 'attached' });
  results.journeys.push({ name: 'Neural partial quotes → search Ryan → unpriced player → missing/zero matchup', selectors: ['#quote-summary', '#quote-filter', '[data-quote-player="4808"] button', '#primary-matchup-action'], pass: true });

  // Journey 3: guest browses a public team with its previous-manager qualification intact.
  await load('guest');
  const neural = page.locator('.directory-team button[data-team="8"]');
  await neural.click();
  assert.match(await page.locator('#inspector-content').innerText(), /Under the previous manager as QBs Gremlins/);
  assert.match(await page.locator('#inspector-content').innerText(), /2025 historical reference/);
  await page.keyboard.press('Escape');
  await page.waitForSelector('#inspector:not([open])', { state: 'attached' });
  assert.equal(await neural.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('#account-link').getAttribute('href'), 'https://goathoopers.com/login');
  const routes = await page.locator('.footer-nav a').evaluateAll(links => links.map(a => new URL(a.href).pathname));
  for (const route of ['/news','/stocks','/history','/arcade','/teams','/transactions','/draft','/intel','/table','/ai-decides','/trade-analyzer','/weekly','/team','/login']) assert(routes.includes(route));
  await page.locator('.utility-line a').click();
  assert.equal(await page.locator('#source-notes').evaluate(el => el.open), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'source-notes');
  results.journeys.push({ name: 'Guest public Neural inspection → qualified history → account exit/source explanation', selector: '.directory-team button[data-team="8"]', pass: true });

  await load('reaves');
  await page.locator('#persona-select').selectOption('neural');
  await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '15' && document.documentElement.dataset.persona === 'neural');
  assert.match(page.url(), /persona=neural/);
  for (const persona of ['reaves','neural','guest']) {
    await load(persona, 1440, true);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.stage), 'structure');
    assert.equal(await page.locator('[data-game], [data-primary-matchup]').count(), 5);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load('neural');
  await page.locator('#primary-matchup-action').click();
  assert.equal(await page.locator('#inspector[open]').count(), 1);
  await page.keyboard.press('Escape');
  await page.waitForSelector('#inspector:not([open])', { state: 'attached' });
  assert.equal(results.errors.length, 0);
  assert.equal(results.nonlocalRequests.length, 0);
  results.pass = true;
  fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify(results, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ pass: results.pass, matrix: results.matrix.length, journeys: results.journeys.length, errors: results.errors, nonlocalRequests: results.nonlocalRequests }, null, 2));
})().catch(error => {
  results.pass = false; results.failure = error.stack;
  fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify(results, null, 2) + '\n');
  console.error(error); process.exit(1);
});
