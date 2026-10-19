import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.HOME_EVIDENCE ?? '/tmp/goat-home-integrated-review';
const origin = 'http://127.0.0.1:4210';
mkdirSync(output, { recursive: true });
const assert = (ok, message) => { if (!ok) throw Error(message); };
const files = [...new Set([...execFileSync('git', ['diff', '--name-only', '2e2e1c3'], { encoding: 'utf8' }).trim().split('\n'), ...execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n')])].filter(Boolean);
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const report = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), clean: !execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(), sourceHashes: Object.fromEntries(files.map(file => [file, hash(file)])),
  method: 'Actual production components in an offline Vite fixture; synthetic identities, scores, quotes, saved AI and clocks. No live account, DB or deployment claim.', checks: [], errors: [], external: [], writes: [] };
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  for (const settings of [
    { name: 'desktop', width: 1440, height: 1000, theme: 'light' },
    { name: 'phone', width: 390, height: 844, theme: 'light' },
    { name: 'phone-dark', width: 390, height: 844, theme: 'dark' },
    { name: 'narrow', width: 320, height: 740, theme: 'light' },
    { name: 'text-200', width: 390, height: 844, theme: 'light', enlarged: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: settings.width, height: settings.height }, reducedMotion: 'reduce', hasTouch: settings.width === 390 });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') { report.writes.push(url.pathname); return route.abort(); }
      if (url.hostname !== '127.0.0.1') { report.external.push(url.href); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(String(error)));
    const cases = [['member','1'], ['member','4'], ['signed_out','1'], ['unclaimed','1'], ['unavailable','1'], ['preseason','1'], ['offseason','1'], ['ai-stale','1'], ['ai-missing','1'], ['missing-market','1'], ['missing-edition','1'], ['no-editorial-players','1'], ['no-matchup','1'], ['guide-unavailable','1'], ['long-name','1']];
    if (settings.name === 'desktop') for (let id=2; id<=10; id++) if(id!==4) cases.push(['member',String(id)]);
    for (const [state,id] of cases) {
      await page.goto(`${origin}/?state=${state}&fixture-team=${id}`);
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, settings.theme);
      if (settings.enlarged) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
      await page.locator('[data-courtside-home]').waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${settings.name}/${state}/${id}: page overflow`);
      const bar = page.locator('[data-personal-home]'), matchup = page.locator('[data-personal-section="matchup"]');
      const players = page.locator('[data-personal-section="players"]'), wire = page.locator('[data-personal-section="wire"]');
      assert(await page.locator('figure [data-league-opening]').count() === 1, 'Public court overlay omitted');
      assert(await page.locator('[data-server-clock]').count() === 0, 'Date-only source started ticking');
      if (state === 'signed_out') {
        assert(await bar.count() === 0 && await page.locator('[data-personal-section]').count() === 0, 'Anonymous personalized content');
        assert(await page.locator('[data-own-team]').count() === 0, 'Anonymous viewer marker');
      } else if (state === 'unclaimed') assert(await bar.getByRole('link', { name: 'Claim my team' }).getAttribute('href') === '/account', 'Claim path');
      else if (state === 'unavailable') await bar.getByText('Your team is temporarily unavailable.').waitFor();
      else {
        assert(await bar.getAttribute('data-team-id') === id, 'Wrong viewer');
        assert(await bar.getByRole('link', {name:'Full roster',exact:true}).getAttribute('href') === `/teams/${id}#team-roster`, 'Wrong roster');
        assert(await players.count() === 1 && await wire.count() === 1, 'Integrated content omitted');
        if (state === 'member') {
          assert(await page.locator('[data-own-team="true"]').count() === 2, 'Expected matchup/standings viewer markers');
          await page.locator('h1').filter({hasText:`Fixture Club ${id}`}).waitFor();
          assert(await players.locator('xpath=ancestor::*[@id="watch"]').count() === 1, 'Players separated from league editorial');
          await players.getByRole('link',{name:'View full roster valuation'}).click();
          assert(await page.locator('#your-roster-value').getAttribute('open') !== null, 'Value link did not reveal disclosure');
          await page.getByText('All 4 roster player values',{exact:true}).click();
          assert(await page.locator('#your-roster-value li').count() === 4, 'Full roster removed');
          await matchup.getByText('Saved analysis & source',{exact:true}).click();
          await matchup.getByText('Model provenance',{exact:true}).click();
          await matchup.getByText(/fixture-model/).waitFor();
          const action = bar.getByRole('link',{name:'My team',exact:true});
          await action.focus();
          assert(await action.evaluate(node => document.activeElement === node && parseFloat(getComputedStyle(node).outlineWidth) >= 2), 'Focus indicator');
          for (const control of await bar.locator('nav a').all()) assert((await control.boundingBox()).height >= 44, 'Small team action');
        }
        if (state === 'ai-stale') await matchup.getByText(/Out-of-date saved result/).first().waitFor();
        if (state === 'ai-missing') assert(await matchup.locator('strong').filter({hasText:'%'}).count() === 0, 'Missing AI invented probability');
        if (state === 'preseason') assert(await matchup.getByText(/scoring has not started/).count() === 1, 'Preseason status');
        if (state === 'no-editorial-players') assert(await players.isVisible(), 'Missing editorial hid team players');
      }
      report.checks.push({viewport:settings.name,state,teamId:id,overflow:false});
      if (['member','signed_out'].includes(state) && id === '1') {
        await page.locator('details[open]').evaluateAll(nodes => nodes.forEach(node => node.removeAttribute('open')));
        await page.evaluate(() => scrollTo(0,0));
        await page.screenshot({path:`${output}/${state}-${settings.name}.png`,fullPage:true});
      }
    }
    await context.close();
  }
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  page.on('pageerror', error => report.errors.push(String(error)));
  await page.goto(origin);
  const picks = page.locator('button[aria-controls="game-title matchup-context"]');
  await picks.nth(2).click();
  await page.locator('h1').filter({hasText:'Fixture Club 5 vs Fixture Club 6'}).waitFor();
  assert(await page.locator('[data-personal-section="matchup"]').count() === 0, 'Own AI attached to another matchup');
  await page.getByRole('button',{name:'League featured matchup',exact:true}).click();
  await page.locator('h1').filter({hasText:'Fixture Club 5 vs Fixture Club 6'}).waitFor();
  await picks.first().click();
  const rail = page.getByRole('group',{name:'Select matchup team'});
  await rail.getByRole('button',{name:'Fixture Club 2',exact:true}).click();
  const track = page.locator('[id="team-context-window"] > div');
  assert(await track.evaluate(node => parseFloat(getComputedStyle(node).transitionDuration) > 0), 'Missing selection motion');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert(await track.evaluate(node => parseFloat(getComputedStyle(node).transitionDuration) === 0), 'Live reduced motion failed');
  assert(await page.evaluate(() => document.getAnimations().filter(a=>a.playState==='running').length) === 0, 'Reduced motion retained animation');
  await page.getByRole('button',{name:'Matchup notes',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  assert(await page.getByRole('dialog').count() === 0, 'Notes Escape failed');
  report.checks.push({interaction:'pair selection, correct AI association, team rail, live reduced motion, notes Escape'});
  for (const state of ['date-only','uncertain','ended','running']) {
    await page.goto(`${origin}/opening.html?state=${state}`);
    if (state === 'date-only') assert(await page.locator('[data-server-clock]').count() === 0,'Date ticking');
    else if (state === 'uncertain') await page.locator('[data-server-clock="uncertain"]').waitFor();
    else {
      if (state === 'running') await page.locator('[data-server-clock="running"]').waitFor();
      await page.locator('[data-server-clock="ended"]').waitFor();
      await page.getByText('Week 1 has started',{exact:true}).waitFor();
      assert(await page.locator('[data-server-clock] strong').textContent() === '00:00', 'Negative or false terminal clock');
    }
    report.checks.push({countdown:state});
  }
  await page.close();
  assert(report.errors.length === 0, `Browser errors: ${report.errors}`);
  assert(report.external.length === 0 && report.writes.length === 0, 'Unexpected network request');
  report.sourceUnchanged = files.every(file => hash(file) === report.sourceHashes[file]);
  assert(report.sourceUnchanged, 'Source changed during review');
  writeFileSync(`${output}/verification.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({checks:report.checks.length,revision:report.revision,clean:report.clean,errors:report.errors,report:`${output}/verification.json`}));
} catch(error) {
  writeFileSync(`${output}/failed.json`,JSON.stringify({...report,error:String(error)},null,2));
  throw error;
} finally { await browser.close(); }
