import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Bounded author check. Root owns the four final full-page captures.
const base = 'http://localhost:4207/qa/homepage-structures/homepage-corrections/08/';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = { checkedAt: new Date().toISOString(), method: 'Installed Playwright + headless Chromium; root enlargement via html font-size:200%', cases: [], keyboard: [], runtimeErrors: [], externalRequests: [] };
const settle = async page => page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
const page = await browser.newPage();
page.on('pageerror', error => results.runtimeErrors.push(error.message));
page.on('request', request => { if (!request.url().startsWith('http://localhost:4207/')) results.externalRequests.push(request.url()); });

try {
  for (const view of ['member', 'public']) {
    for (const width of [1440, 390, 320]) {
      for (const text of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`${base}?view=${view}`);
        await page.waitForFunction(() => document.documentElement.dataset.homepageReady === '08');
        await page.evaluate(size => document.documentElement.style.fontSize = `${size}%`, text);
        await settle(page);
        const facts = await page.evaluate(() => ({
          pageWidth: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          sections: [...document.querySelectorAll('main > section')].map(section => ({ id: section.id || section.className, visible: getComputedStyle(section).display !== 'none' && section.getBoundingClientRect().height > 0 })),
          internalScroll: [...document.querySelectorAll('main *')].filter(element => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1 && element.tagName !== 'SELECT').map(element => element.className),
          mainText: document.querySelector('main').innerText,
          hasPersonalTotal: document.querySelector('main').innerText.includes('$1095.25'),
          scores: [...document.querySelectorAll('.team-identity .score')].map(element => element.textContent),
          probabilities: [...document.querySelectorAll('#pair-reading .probability')].map(element => element.textContent),
          standings: document.querySelectorAll('.standings tbody tr').length,
          slate: document.querySelectorAll('.slate-pair').length,
          stories: document.querySelectorAll('.editorial-story').length,
          loadedFonts: document.fonts.check('16px "DM Sans"') && document.fonts.check('16px "Oswald"')
        }));
        assert.equal(facts.scrollWidth, width, `${view}/${width}/${text}: horizontal overflow`);
        assert.equal(facts.internalScroll.length, 0, 'Primary home content must use document scrolling');
        assert.equal(facts.sections.length, 6); assert.ok(facts.sections.every(section => section.visible));
        assert.equal(facts.standings, 10); assert.equal(facts.slate, 5); assert.equal(facts.stories, 3);
        assert.deepEqual(facts.scores, ['0.0', 'Pending']); assert.deepEqual(facts.probabilities, ['65%', '35%']);
        assert.ok(facts.loadedFonts);
        assert.equal(facts.hasPersonalTotal, view === 'member');
        if (view === 'public') assert.ok(!facts.mainText.includes('On form') && !facts.mainText.includes('Your team wire'));
        if (view === 'member') assert.ok(facts.mainText.includes('Week 2') && facts.mainText.includes('5 current roster players'));
        delete facts.mainText;
        results.cases.push({ view, width, text, ...facts });
      }
    }
  }
  for (const view of ['member', 'public']) {
    for (const ai of ['stale', 'missing']) {
      await page.setViewportSize({ width: 390, height: 1000 });
      await page.goto(`${base}?view=${view}&ai=${ai}`);
      await page.waitForFunction(() => document.documentElement.dataset.homepageReady === '08');
      await settle(page);
      assert.equal(await page.locator('.probability, .prob-track').count(), 0);
      assert.equal(await page.locator('.slate-pair').count(), 5);
      assert.ok((await page.locator('main').innerText()).includes(ai === 'stale' ? 'Stale saved slate' : 'Saved weekly pick unavailable'));
      await page.locator('#pair-selector').selectOption('4');
      assert.ok((await page.locator('#pair-reading').innerText()).includes('T Halibooty'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
      results.cases.push({ view, width: 390, text: 100, ai, noCurrentProbabilities: true, allFivePairs: true, pairChange: true });
    }
  }

  await page.goto(`${base}?view=member`);
  await page.waitForFunction(() => document.documentElement.dataset.homepageReady === '08');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').innerText(), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'matchup-heading');
  results.keyboard.push('Tab → skip → Enter focuses main heading');

  await page.locator('#pair-selector').focus();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#pair-selector').inputValue(), '1');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'pair-selector');
  assert.ok((await page.locator('#pair-reading').innerText()).includes('Stephon Castle’s Back'));
  await page.locator('[data-compare="2"]').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-compare="2"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'matchup-heading');
  results.keyboard.push('Native selector retains focus; slate Compare updates pressed state and focuses matchup heading');

  const menu = page.locator('.global-menu');
  await menu.locator('summary').focus(); await page.keyboard.press('Enter');
  assert.ok(await menu.evaluate(element => element.open));
  await menu.locator('a[href="#league"]').focus(); await page.keyboard.press('Enter');
  assert.ok(!await menu.evaluate(element => element.open));
  assert.equal(await page.locator(':focus').getAttribute('id'), 'league-heading');
  await menu.locator('summary').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Escape');
  assert.ok(!await menu.evaluate(element => element.open));
  assert.equal(await page.locator(':focus').innerText(), 'Menu');
  results.keyboard.push('Menu open → local link → heading focus; Escape closes and restores summary focus');

  await page.locator('footer a[href="#provenance"]').focus(); await page.keyboard.press('Enter');
  assert.ok(await page.locator('#provenance').evaluate(element => element.open));
  assert.equal(await page.locator(':focus').innerText(), 'Synthetic fixture · Nov 12, 2026');
  await page.keyboard.press('Escape');
  assert.ok(!await page.locator('#provenance').evaluate(element => element.open));
  results.keyboard.push('Footer provenance opens native disclosure; Escape restores its summary');

  await page.locator('.source-note').first().locator('summary').focus(); await page.keyboard.press('Enter');
  assert.ok(await page.locator('.source-note').first().evaluate(element => element.open));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('main > section').count(), 6);
  assert.ok(await page.locator('#notebook-heading').isVisible());
  results.keyboard.push('Model provenance expands with Enter; reduced motion keeps all six sections present');
  assert.equal(results.runtimeErrors.length, 0); assert.equal(results.externalRequests.length, 0);
  results.status = 'pass';
} catch (error) {
  results.status = 'fail'; results.failure = error.stack;
} finally {
  await browser.close();
  await writeFile(new URL('./checks.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
}
console.log(JSON.stringify({ status: results.status, cases: results.cases.length, keyboard: results.keyboard, failure: results.failure ?? null }));
if (results.status !== 'pass') process.exitCode = 1;
