import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.HOME_EVIDENCE ?? '/tmp/goat-personal-home-review';
mkdirSync(output, { recursive: true });
const assert = (ok, message) => { if (!ok) throw Error(message); };
const files = [...new Set([...execFileSync('git', ['diff', '--name-only', 'e09399c'], { encoding: 'utf8' }).trim().split('\n'), ...execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n')])].filter(Boolean);
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const report = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceHashes: Object.fromEntries(files.map(file => [file, hash(file)])),
  method: 'Actual components via numeric-loopback Vite fixture; synthetic identities, scores, prices and saved AI. Not a live account or deployed app.', checks: [], pageErrors: [], external: [], writes: [] };
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  for (const settings of [
    { name: 'desktop-light', width: 1440, height: 1000, theme: 'light' },
    { name: 'phone-light', width: 390, height: 844, theme: 'light' },
    { name: 'phone-dark', width: 390, height: 844, theme: 'dark' },
    { name: 'narrow-200', width: 320, height: 740, theme: 'light', zoom: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: settings.width, height: settings.height }, reducedMotion: 'reduce', isMobile: settings.width === 390, hasTouch: settings.width === 390 });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') { report.writes.push(url.pathname); return route.abort(); }
      if (url.hostname !== '127.0.0.1') { report.external.push(url.hostname); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror', error => report.pageErrors.push(error.message));
    for (const [state, id] of [['member', '1'], ['member', '4'], ['signed_out', '1'], ['unclaimed', '1'], ['unavailable', '1'], ['preseason', '1'], ['offseason', '1'], ['no-matchup', '1'], ['ai-stale', '4'], ['ai-missing', '4'], ['missing-market', '1'], ['missing-edition', '1'], ['long-name', '1']]) {
      await page.goto(`http://127.0.0.1:4201/?state=${state}&fixture-team=${id}`);
      await page.getByRole('heading').first().waitFor();
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, settings.theme);
      await page.evaluate(() => document.fonts.ready);
      if (settings.zoom) await page.addStyleTag({ content: 'html{font-size:200%}' });
      const bodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (!settings.zoom) assert(!bodyOverflow, `${state}/${id} overflow at ${settings.name}`);
      const personalOverflow = await page.locator('[data-personal-home]').evaluateAll(nodes => nodes.some(panel => [panel, ...panel.querySelectorAll('*')].some(node => { const r = node.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1); })));
      assert(!personalOverflow, `${state}/${id} personalized edition overflow at ${settings.name}`);
      const panel = page.locator('[data-personal-home]');
      if (state === 'signed_out') { assert(await panel.count() === 0, 'Signed-out view personalized'); assert(await page.locator('[data-own-team]').count() === 0, 'Signed-out team marked'); }
      else if (state === 'unclaimed') { assert(await panel.getByRole('link', { name: 'Claim my team', exact: true }).getAttribute('href') === '/account', 'Missing claim path'); assert(await panel.locator('[data-team-id]').count() === 0, 'Unclaimed shows team'); }
      else if (state === 'unavailable') await panel.getByText('Your team is temporarily unavailable.', { exact: true }).waitFor();
      else {
        assert(await panel.getAttribute('data-team-id') === id, 'Wrong team in panel');
        assert(await panel.getByRole('link', { name: 'Full roster', exact: true }).getAttribute('href') === `/teams/${id}#team-roster`, 'Wrong roster destination');
        if (state === 'member') {
          assert(await page.locator('[data-own-team="true"]').count() === 2, 'Expected own team in matchup and standings');
          await panel.getByText('Saved analysis & source', { exact: true }).click();
          await panel.getByText(/fixture-model/).waitFor();
          const action = panel.getByRole('link', { name: 'My team', exact: true });
          await action.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
          assert(await action.evaluate(node => document.activeElement === node && parseFloat(getComputedStyle(node).outlineWidth) >= 2), 'Missing keyboard focus');
          for (const control of await panel.locator('nav a').all()) assert((await control.boundingBox()).height >= 44, 'Small navigation target');
          if (id === '1') { await panel.getByText('0.0', { exact: true }).waitFor(); await panel.getByText('Pending', { exact: true }).waitFor(); }
        }
        if (state === 'offseason') { await panel.getByText('No active weekly matchup in this season phase.', { exact: true }).waitFor(); assert(await panel.getByText('Your score', { exact: true }).count() === 0, 'Offseason old score retained'); }
        if (state === 'ai-stale') await panel.getByText(/Out-of-date saved result/).waitFor();
        if (state === 'ai-missing') assert(await panel.locator('strong').filter({ hasText: '%' }).count() === 0, 'Missing AI shows percentage');
      }
      report.checks.push({ state, teamId: id, viewport: settings.name, personalizedOverflow: false, pageOverflow: bodyOverflow });
      if (!settings.zoom && ['member', 'unclaimed', 'signed_out', 'ai-stale', 'offseason'].includes(state)) {
        await page.screenshot({ path: `${output}/${state}-${id}-${settings.name}.png`, fullPage: state === 'signed_out' });
        if (state === 'member') { const crop = await page.addStyleTag({ content: '[data-courtside-home],footer{display:none!important}' }); await page.screenshot({ path: `${output}/${state}-${id}-${settings.name}-edition.png`, fullPage: true }); await crop.evaluate(node => node.remove()); }
      }
    }
    await context.close();
  }
  assert(report.pageErrors.length === 0, `Page errors: ${report.pageErrors}`);
  assert(report.external.length === 0, `Unexpected external requests: ${report.external}`);
  assert(report.writes.length === 0, `Unexpected write requests: ${report.writes}`);
  report.sourceUnchanged = files.every(file => hash(file) === report.sourceHashes[file]);
  assert(report.sourceUnchanged, 'Source changed during browser review');
  writeFileSync(`${output}/verification.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, pageErrors: report.pageErrors, external: report.external, writes: report.writes, sourceUnchanged: report.sourceUnchanged, report: `${output}/verification.json` }));
} finally { await browser.close(); }
