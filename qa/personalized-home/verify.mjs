import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.HOME_EVIDENCE ?? '/tmp/goat-personal-home-review';
const redesignDir = process.env.REDESIGN_DIR ?? '/home/hatch/workspace/goat-hoopers-site-qa';
mkdirSync(output, { recursive: true });
mkdirSync(redesignDir, { recursive: true });
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
    for (const [state, id] of [['member', '1'], ['member', '4'], ['signed_out', '1'], ['unclaimed', '1'], ['unavailable', '1'], ['preseason', '1'], ['offseason', '1'], ['no-matchup', '1'], ['ai-stale', '4'], ['ai-missing', '4'], ['missing-market', '1'], ['missing-edition', '1'], ['long-name', '1'], ['guide-unavailable', '1'], ['champion', '1'], ['showcase', '1'], ['showcase-public', '1']]) {
      await page.goto(`http://127.0.0.1:4201/?state=${state}&fixture-team=${id}`);
      await page.getByRole('heading').first().waitFor();
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, settings.theme);
      await page.evaluate(() => document.fonts.ready);
      if (settings.zoom) await page.addStyleTag({ content: 'html{font-size:200%}' });
      const bodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (!settings.zoom) assert(!bodyOverflow, `${state}/${id} overflow at ${settings.name}`);
      // The approved composition holds at every size: no element in the
      // homepage surface may stick out of the viewport horizontally,
      // unless an ancestor clips or scrolls it (the scaled court image
      // inside its overflow-hidden figure; the faces strip's own
      // horizontal scroll). At 200% text zoom the pre-existing league
      // tables can exceed the viewport (recorded, as before); the new
      // composition is asserted at the three real sizes.
      const surfaceOverflow = await page.locator('[data-courtside-home]').evaluateAll(nodes => nodes.some(panel => [panel, ...panel.querySelectorAll('*')].some(node => {
        const r = node.getBoundingClientRect();
        if (!(r.width > 0 && (r.left < -1 || r.right > innerWidth + 1))) return false;
        for (let up = node.parentElement; up && up !== panel.parentElement; up = up.parentElement) {
          const overflowX = getComputedStyle(up).overflowX;
          if (overflowX === 'hidden' || overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'clip') return false;
        }
        return true;
      })));
      if (!settings.zoom) assert(!surfaceOverflow, `${state}/${id} homepage surface overflow at ${settings.name}`);
      // Aidan's exclusion: the homepage champion showcase is never built.
      assert(await page.locator('[data-champion-showcase]').count() === 0, `${state} renders a champion showcase`);
      assert(await page.getByText('Open the champions').count() === 0, `${state} renders the champions showcase link`);
      // Aidan's clarification: no dedicated champion content on the homepage
      // at all — the public faces section's champion record panel (and its
      // champion-framed heading) never renders; champions live in history.
      assert(await page.getByText('The reigning champion').count() === 0, `${state} renders the champion record panel`);
      assert(await page.getByText('The bar is set.').count() === 0, `${state} keeps the champion-framed faces heading`);
      // Standings/leaders/moves are a visible section, not collapsed details.
      const league = page.locator('[data-league-section]');
      assert(await league.count() === 1, `${state} missing the visible league section`);
      assert(await league.locator('details').count() === 0, `${state} buries league content in a collapsed details`);
      assert(await league.getByText('Standings, leaders & moves.').count() === 1, `${state} league section heading missing`);
      // AI Decides lives down-page as its own section with all five rows.
      const ai = page.locator('[data-ai-decides]');
      assert(await ai.count() === 1, `${state} missing the AI Decides section`);
      if (state === 'signed_out') {
        assert(await page.locator('[data-team-desk]').count() === 0, 'Signed-out view personalized');
        assert(await page.locator('[data-league-desk]').count() === 1, 'Signed-out view lacks the league desk');
        assert(await page.locator('[data-own-team]').count() === 0, 'Signed-out team marked');
      } else if (state === 'unclaimed') {
        assert(await page.getByRole('link', { name: 'Claim my team', exact: true }).getAttribute('href') === '/account', 'Missing claim path');
        assert(await page.locator('[data-team-desk]').count() === 0, 'Unclaimed shows a team desk');
      } else if (state === 'unavailable') {
        await page.getByText('Your team is temporarily unavailable.', { exact: true }).waitFor();
      } else if (state === 'showcase-public') {
        assert(await page.locator('[data-league-desk]').count() === 1, 'Public showcase lacks the league desk');
        assert(await page.locator('[data-bar-set]').count() === 1, 'Public showcase lacks the featured-faces section');
        assert(await page.locator('[data-bar-set]').getByText('Opening-week roster anchors').count() === 1, 'Public faces section lost its featured faces');
        assert(await page.locator('[data-bar-set]').getByText('The reigning champion').count() === 0, 'Public faces section still renders the champion record panel');
        assert(await page.locator('[data-bar-set]').getByText('THE CHAMP').count() === 0, 'Public faces section still renders the champion outline type');
        assert(await page.locator('[data-court-clock="countdown"]').count() === 1, 'Public showcase must show exactly one countdown');
      } else {
        // Member states: the team desk is the personal surface — except
        // missing-edition, where no feature renders and the member block
        // (value section + action bar) carries the context instead.
        const desk = page.locator('[data-team-desk]');
        if (state !== 'missing-edition') {
          assert(await desk.count() === 1, `${state} missing the team desk`);
          assert((await desk.locator('h2').first().innerText()).length > 0, 'Desk team name empty');
          assert(await desk.getByRole('link', { name: 'My team', exact: true }).getAttribute('href') === '/team', 'Wrong My team destination');
          assert(await desk.getByRole('link', { name: 'View roster', exact: true }).getAttribute('href') === `/teams/${id}#team-roster`, 'Wrong roster destination');
          for (const control of await desk.locator('nav a').all()) assert((await control.boundingBox()).height >= 44, 'Desk action under 44px');
        }
        assert(await page.locator('[data-roster-value]').count() === 1, `${state} missing the roster-value section`);
        if (state === 'missing-market') {
          assert(await page.locator('[data-value-unavailable]').count() === 1, 'Missing market must show the honest value-unavailable state');
          assert(await page.locator('[data-team-value]').count() === 0, 'Missing market invents a team value');
        } else {
          assert(await page.locator('[data-team-value]').count() === 1, `${state} must show the team value exactly once`);
        }
        assert(await page.locator('[data-hero-valuation]').count() === 1, `${state} missing the full valuation disclosure`);
        if (state === 'member') {
          assert(await page.locator('[data-own-team="true"]').count() === 2, 'Expected own team in standings and AI rows');
          assert(await ai.locator('[data-ai-row]').count() === 5, 'AI Decides must render all five pairings');
          assert(await ai.locator('details').count() === 5, 'Every AI row carries its provenance disclosure');
          await page.locator('[data-hero-valuation] summary').click();
          assert(await page.locator('[data-hero-valuation] li').count() === 4, 'Full roster valuation omitted a player');
          const action = desk.getByRole('link', { name: 'My team', exact: true });
          await action.focus();
          assert(await action.evaluate(node => document.activeElement === node && parseFloat(getComputedStyle(node).outlineWidth) >= 2), 'Missing keyboard focus');
        }
        if (state === 'ai-stale') await desk.getByText(/Stale · saved Week/).waitFor();
        if (state === 'ai-missing') assert(await ai.locator('details').count() === 0, 'Missing AI invents provenance');
        if (state === 'missing-edition') await page.getByText('The next weekly story is on its way.', { exact: true }).waitFor();
        if (state === 'showcase') {
          // Pre-tip: exactly one clock, honestly captioned, on the court.
          assert(await page.locator('[data-court-clock="countdown"]').count() === 1, 'Showcase must show exactly one countdown');
          await page.getByText(/Sleeper confirms the Oct 20 date/).waitFor();
          // Desk carries the verified 2025 lines.
          await desk.getByText('16–5').waitFor();
          await desk.getByText('4th').waitFor();
          // The chart is the genuine recorded series, labelled as a repricing.
          assert(await page.locator('[data-value-trend]').count() === 1, 'Showcase lacks the recorded value chart');
          await page.getByText('Current roster repriced from recorded player quotes').waitFor();
          await page.getByText(/not the team’s historical value or performance/).waitFor();
        }
      }
      if (state === 'champion') {
        // The crown badge + directory label stay; only the section is gone.
        assert((await page.locator('[data-champion-crown="badge"]').count()) >= 3, 'Champion crown badges missing');
        await page.getByText('· 2025 champion').first().waitFor();
      }
      report.checks.push({ state, teamId: id, viewport: settings.name, surfaceOverflow, pageOverflow: bodyOverflow });
      if (!settings.zoom && ['member', 'unclaimed', 'signed_out', 'ai-stale', 'offseason', 'showcase', 'showcase-public'].includes(state)) {
        await page.screenshot({ path: `${output}/${state}-${id}-${settings.name}.png`, fullPage: state === 'signed_out' });
      }
    }
    await context.close();
  }
  // The approved-design captures at the brief's named paths.
  const captureContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await captureContext.route('**/*', route => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET' || url.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
  const capture = await captureContext.newPage();
  await capture.goto('http://127.0.0.1:4201/?state=showcase&fixture-team=1');
  await capture.getByRole('heading').first().waitFor();
  await capture.evaluate(() => document.fonts.ready);
  await capture.screenshot({ path: `${redesignDir}/redesign-desktop.png`, fullPage: true });
  await capture.setViewportSize({ width: 390, height: 844 });
  await capture.screenshot({ path: `${redesignDir}/redesign-mobile.png`, fullPage: true });
  await capture.goto('http://127.0.0.1:4201/?state=showcase-public&fixture-team=1');
  await capture.getByRole('heading').first().waitFor();
  await capture.setViewportSize({ width: 1440, height: 1000 });
  await capture.evaluate(() => document.fonts.ready);
  await capture.screenshot({ path: `${redesignDir}/redesign-public.png`, fullPage: true });
  await captureContext.close();
  assert(report.pageErrors.length === 0, `Page errors: ${report.pageErrors}`);
  assert(report.external.length === 0, `Unexpected external requests: ${report.external}`);
  assert(report.writes.length === 0, `Unexpected write requests: ${report.writes}`);
  report.sourceUnchanged = files.every(file => hash(file) === report.sourceHashes[file]);
  assert(report.sourceUnchanged, 'Source changed during browser review');
  writeFileSync(`${output}/verification.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, pageErrors: report.pageErrors, external: report.external, writes: report.writes, sourceUnchanged: report.sourceUnchanged, report: `${output}/verification.json` }));
} finally { await browser.close(); }
