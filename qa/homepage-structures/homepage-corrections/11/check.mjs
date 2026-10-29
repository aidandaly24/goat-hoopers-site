import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('./', import.meta.url);
const base = 'http://localhost:4207/qa/homepage-structures/homepage-corrections/11/';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const interactionsOnly = process.argv.includes('--interactions-only');
const prior = interactionsOnly ? JSON.parse(await readFile(new URL('checks.json', root), 'utf8')) : null;
const report = { kind: 'Static component fixture; local Chromium', date: '2026-10-29', layouts: prior?.layouts ?? [], states: prior?.states ?? [], interactions: [], consoleErrors: [], failedRequests: [], navigationAborts: [], screenshots: ['desktop-check.png', 'phone-check.png'] };
page.on('pageerror', error => report.consoleErrors.push(error.message));
page.on('requestfailed', request => {
  const item = { url: request.url(), error: request.failure()?.errorText };
  (item.error === 'net::ERR_ABORTED' ? report.navigationAborts : report.failedRequests).push(item);
});
async function load(query = '') {
  await page.goto(base + query);
  await page.waitForFunction(() => document.documentElement.dataset.homepageReady === '11');
}
async function geometry() {
  return page.evaluate(() => {
    const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    const internal = [...document.querySelectorAll('#commons *')].filter(element => visible(element) && ['scroll', 'auto'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1).map(element => element.id || element.className || element.tagName);
    const outliers = [...document.querySelectorAll('body *')].filter(element => visible(element) && !element.closest('.skip') && element.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map(element => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right }));
    return { width: innerWidth, root: getComputedStyle(document.documentElement).fontSize, documentWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, internal, outliers, passages: [...document.querySelectorAll('.passage')].map(element => ({ id: element.id, visible: visible(element), height: element.offsetHeight })) };
  });
}
try {
  if (!interactionsOnly) {
  // One bounded 2-edition × 3-width matrix, each with independent root-text 200%.
  for (const edition of ['member', 'public']) {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await load('?view=' + edition);
      for (const size of ['16px', '32px']) {
        await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
        const result = await geometry();
        report.layouts.push({ edition, ...result });
        assert.equal(result.documentWidth, width, `${edition} ${width} ${size}: overflow`);
        assert.deepEqual(result.internal, [], 'internal reader');
        assert.deepEqual(result.outliers, [], 'offscreen content');
        assert.equal(result.passages.filter(passage => passage.visible).length, 6);
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const edition of ['member', 'public']) {
    for (const ai of ['stale', 'missing']) {
      await load(`?view=${edition}&ai=${ai}`);
      const text = await page.locator('#commons').innerText();
      if (ai === 'stale') {
        assert.match(text, /Stale saved result/);
        assert.match(text, /Ware the Hoes At\?/);
      } else {
        assert.equal(await page.locator('.model-source').count(), 0);
        assert.equal(await page.locator('.probability').count(), 0);
        assert.match(text, /Saved pick unavailable/);
        assert.doesNotMatch(text, /Returned choice:/);
      }
      const result = await geometry();
      assert.equal(result.documentWidth, 390);
      report.states.push({ edition, ai, width: 390, modelSources: await page.locator('.model-source').count(), overflow: false });
    }
  }
  await load();
  const home = page.locator('#commons');
  const text = await home.innerText();
  assert.match(text, /0\.0/); assert.match(text, /Pending/);
  assert.match(text, /24 priced \/ 0 unpriced/);
  assert.match(text, /\$1095\.25/);
  }
} catch (error) {
  report.failure = String(error.stack ?? error);
} finally {
  // Continue interaction evidence independently of any presentation assertion.
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await load();
    const commonsBefore = await page.locator('#commons').innerText();
    await page.locator('#query').focus();
    await page.keyboard.type('Reaves');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'trigger-team-1');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'trigger-player-2316');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#answer-player-2316 .total');
    assert.equal(await page.locator('#answer-player-2316 .total').innerText(), '$35.00');
    assert.equal(await page.locator('#commons').innerText(), commonsBefore);
    assert.equal(await page.locator('#trigger-player-2316').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#answer-player-2316')?.textContent);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'trigger-player-2316');
    await page.goForward();
    await page.waitForSelector('#answer-player-2316 .total');
    await page.locator('[data-close="player-2316"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('#answer-player-2316')?.textContent);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'trigger-player-2316');
    report.interactions.push('Keyboard: query → Enter → Tab to Austin Reaves → Enter inline $35 quote → Escape → exact trigger focus; Forward restores; Back to results restores focus. Commons text remains unchanged.');
    await page.locator('#query').focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('xyzzzz');
    await page.keyboard.press('Enter');
    assert.match(await page.locator('#results').innerText(), /No local match/);
    await page.locator('#return-home').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#query').inputValue(), '');
    assert.equal(await page.locator('#search-results').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'commons');
    report.interactions.push('No-match query → keyboard Return to the commons clears results and focuses the open home.');
    await page.locator('#query').fill('Hoes');
    await page.locator('#search-form').evaluate(form => form.requestSubmit());
    await page.locator('#trigger-team-2').click();
    await page.locator('#answer-team-2 summary').click();
    assert.equal(await page.locator('#answer-team-2 .roster-list li').count(), 27);
    report.interactions.push('Team result opens current/past context and native full-roster disclosure.');
    await page.locator('[data-filter="player"]').click();
    await page.locator('#query').fill('');
    await page.locator('#result-sort').selectOption('name');
    assert.match(await page.locator('#result-count').innerText(), /228 matches/);
    const names = await page.locator('.result-title').allTextContents();
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
    await page.locator('#more-results').click();
    assert.equal(await page.locator('.result').count(), 24);
    report.interactions.push('Players filter → Name A–Z → 228 count; explicit pagination extends 12 rows to 24.');
    await load();
    const valuesSummary = page.locator('#value details').first().locator('summary');
    await valuesSummary.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#value .roster-list li').count(), 24);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.equal(await page.locator('.passage:visible').count(), 6);
    report.interactions.push('Keyboard native valuation disclosure exposes all 24 values; live reduced-motion preference retains all six passages, zero active animations.');
    const hrefs = await page.locator('#destinations a').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')));
    for (const href of ['/stocks#player-board', '/ai-decides', '/teams', '/transactions', '/trade-analyzer', '/weekly', '/history', '/arcade/free-throw', '/team']) assert.ok(hrefs.includes(href));
    report.interactions.push('Required real destination hrefs present; destination application/auth runtime not exercised.');
    await load('?view=public');
    assert.equal(await page.locator('#value .face-list li').count(), 4);
    assert.equal(await page.locator('#value .total').count(), 0);
    assert.match(await page.locator('#value').innerText(), /public league edition/);
    assert.equal(await page.locator('#league .standing-list li').count(), 10);
    report.interactions.push('Public edition replaces personal valuation/form/wire with four labeled franchise anchors; ten standings and all league context remain.');
    for (const [width, height, file] of [[1440, 1000, 'desktop-check.png'], [390, 844, 'phone-check.png']]) {
      await page.setViewportSize({ width, height }); await load();
      await page.screenshot({ path: new URL(file, root).pathname });
    }
  } catch (error) { report.interactionFailure = String(error.stack ?? error); }
  for (const file of ['index.html', 'app.js', 'style.css']) report[file + 'SHA256'] = createHash('sha256').update(await readFile(new URL(file, root))).digest('hex');
  report.limits = ['Chromium emulation only; no physical device or screen reader.', 'Root text enlargement uses html font-size 32px; this is separate from browser zoom.', 'No real Next routing, auth, live providers, model generation or publication tested.', 'Two native viewport screenshots only; parent owns four full-page captures.'];
  await writeFile(new URL('checks.json', root), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ layouts: report.layouts.length, states: report.states.length, interactions: report.interactions.length, failure: report.failure, interactionFailure: report.interactionFailure, consoleErrors: report.consoleErrors, failedRequests: report.failedRequests }, null, 2));
  await browser.close();
  if (report.failure || report.interactionFailure || report.consoleErrors.length || report.failedRequests.length) process.exitCode = 1;
}
