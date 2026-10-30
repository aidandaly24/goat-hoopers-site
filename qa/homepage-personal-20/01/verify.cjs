const { chromium } = require('playwright');
const fs = require('node:fs');
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/01/';
const assert = (test, message) => { if (!test) throw new Error(message); };
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const results = { browser: 'Chromium via Playwright, /usr/bin/chromium; desktop emulation', pages: [], interactions: [] };
  for (const persona of ['reaves', 'neural', 'guest']) {
    for (const width of [1440, 1120]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(`${base}?persona=${persona}`);
      await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '01');
      const measurements = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, persona: document.documentElement.dataset.persona }));
      assert(measurements.scrollWidth === measurements.clientWidth, `Overflow: ${persona} at ${width}`);
      assert(!errors.length, errors.join('; '));
      assert(measurements.persona === persona, 'Incorrect persona marker');
      assert(!(await page.locator('main').innerText()).includes('No. null'), 'Null value rank');
      const routeCount = await page.locator('footer a[href^="https://goathoopers.com"]').count();
      assert(routeCount === 15, 'A GOAT destination is missing');
      if (persona === 'guest') {
        assert(await page.locator('.pair-row').count() === 5, 'Guest must see five matchups');
        assert(await page.locator('#roster').count() === 0, 'Guest claims a roster');
      } else {
        assert(await page.locator('#roster-body tr').count() === (persona === 'reaves' ? 24 : 22), 'Wrong roster rows');
        if (persona === 'neural') {
          assert(await page.locator('.missing-list li').count() === 6, 'Missing quotes count');
          assert((await page.locator('#matchup').innerText()).includes('Pending'), 'Missing score is not pending');
          assert((await page.locator('#matchup').innerText()).includes('0.00'), 'Recorded zero missing');
        }
      }
      results.pages.push({ persona, width, height: 1000, ...measurements, pageErrors: errors, destinations: routeCount });
      await page.close();
    }
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '01');
  const matchupTrigger = page.locator('#matchup [data-matchup]');
  await matchupTrigger.focus(); await page.keyboard.press('Enter');
  assert(await page.locator('#inspector').evaluate(d => d.open), 'Keyboard matchup inspection failed');
  const matchupText = await page.locator('#detail-content').innerText();
  assert(matchupText.includes('56%') && matchupText.includes('44%') && matchupText.includes('0.35'), 'Saved AI context not separated');
  await page.keyboard.press('Escape');
  assert(await matchupTrigger.evaluate(el => el === document.activeElement), 'Escape did not restore focus');
  results.interactions.push('Keyboard Enter opens matchup; saved 56/44 estimate and separate 0.35 confidence visible; Escape closes and restores trigger focus.');
  await page.locator('#matchup [data-team="1"]').click();
  await page.locator('#detail-content [data-player="1511"]').click();
  assert((await page.locator('#detail-title').innerText()) === 'Joel Embiid', 'Nested player inspection failed');
  await page.locator('.dialog-back').click();
  assert((await page.locator('#detail-title').innerText()) === 'Reaves Dropper', 'Back did not restore team');
  assert(await page.locator('#detail-content [data-player="1511"]').evaluate(el => el === document.activeElement), 'Back focus did not return to player');
  await page.locator('.close').click();
  assert(await page.locator('#matchup [data-team="1"]').evaluate(el => el === document.activeElement), 'Close did not restore root trigger');
  results.interactions.push('Team → player → Back restores team content and player focus; Close returns to original team trigger.');
  await page.locator('#roster-search').fill('Embiid');
  assert(await page.locator('#roster-body tr').count() === 1, 'Roster search failed');
  await page.locator('#roster-body [data-player]').click();
  assert((await page.locator('#detail-content').innerText()).includes('137.50'), 'Quote inspection missing');
  await page.keyboard.press('Escape');
  await page.locator('#roster-search').fill('xyznoresults');
  assert(await page.locator('#no-roster-results').isVisible(), 'Empty search state missing');
  await page.locator('#roster-search').fill('');
  assert(await page.locator('#roster-body tr').count() === 24, 'Clear search failed');
  results.interactions.push('Roster name search, quote inspection, zero-result message and clear restore the correct rows.');
  await page.locator('.utility [data-source]').click();
  assert((await page.locator('#detail-content').innerText()).includes('does not sign you in'), 'Source/demo boundary missing');
  await page.keyboard.press('Escape');
  await page.locator('#persona').selectOption('neural');
  await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '01' && document.documentElement.dataset.persona === 'neural');
  await page.locator('.missing-list [data-player="4866"]').click();
  const gapText = await page.locator('#detail-content').innerText();
  assert(gapText.includes('Unpriced') && gapText.includes('never treated as zero'), 'Missing quote semantics failed');
  await page.keyboard.press('Escape');
  results.interactions.push('Demo selector navigates to NeuralNets; missing quote inspection says Unpriced and never zero.');
  await page.setViewportSize({ width: 1120, height: 1000 });
  await page.addStyleTag({ content: 'html{font-size:200%}' });
  const zoom = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, rootFont: getComputedStyle(document.documentElement).fontSize }));
  assert(zoom.scrollWidth === zoom.clientWidth, 'Enlarged text overflow');
  results.enlargedText = { persona: 'neural', viewport: 1120, ...zoom, note: 'CSS root text size 200%; no browser zoom or physical device claim.' };
  await page.goto(`${base}?persona=reaves&stage=structure`);
  await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '01');
  assert(await page.locator('html').getAttribute('data-stage') === 'structure', 'Structure state failed');
  assert(await page.locator('#roster-body tr').count() === 24, 'Structure state removed content');
  results.interactions.push('Structure mode preserves the 24 roster rows and sets its neutral palette state.');
  assert(!errors.length, errors.join('; '));
  results.interactionPageErrors = errors;
  results.notTested = ['Physical devices', 'Safari/Firefox', 'Live GOAT destination behavior', 'Real authentication or APIs'];
  fs.writeFileSync('qa/homepage-personal-20/01/verification.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
