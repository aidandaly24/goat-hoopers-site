import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/03/';
const results = [];
for (const persona of ['reaves','neural','guest']) {
  for (const width of [1440,1120]) {
    const page = await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    const errors = [], failedRequests = [], remoteRequests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('requestfailed',r=>failedRequests.push(r.url()));
    page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4207/'))remoteRequests.push(r.url());});
    await page.goto(`${base}?persona=${persona}`);
    await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='03');
    const checks = await page.evaluate(()=>({
      persona:document.documentElement.dataset.persona,
      width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
      mainHeading:document.querySelector('h1').textContent,
      evidenceRows:document.querySelectorAll('.evidence-table tbody>tr').length,
      rosterRows:document.querySelectorAll('[data-roster-name]').length,
      leagueRows:document.querySelectorAll('.standings-table tbody>tr').length,
      publicPairings:document.querySelectorAll('.pair-list>li').length,
      externalPaths:[...new Set([...document.querySelectorAll('a[href^="https://goathoopers.com"]')].map(a=>new URL(a.href).pathname))],
      brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)
    }));
    const source = page.locator('#source-trigger');
    await source.click();
    checks.sourceOpened=await page.locator('#sources').evaluate(e=>e.open);
    await page.keyboard.press('Escape');
    checks.sourceClosedWithFocus=await source.evaluate(e=>!document.querySelector('#sources').open&&document.activeElement===e);
    if(persona!=='guest') {
      const first=page.locator('.evidence-table [data-player]').first();
      await first.click();
      checks.playerInspectionOpened=await first.getAttribute('aria-expanded')==='true';
      checks.playerInspectionFocus=await page.locator('[data-close-inspection]').evaluate(e=>document.activeElement===e);
      await page.keyboard.press('Escape');
      checks.playerClosedWithFocus=await first.evaluate(e=>e.getAttribute('aria-expanded')==='false'&&document.activeElement===e);
      const match=page.locator('#matchup .local-detail');
      await match.locator('summary').click();
      checks.matchupExpanded=await match.evaluate(e=>e.open);
      await match.locator('summary').click();
      const firstName=persona==='reaves'?'Damian':'Giannis';
      await page.locator('#roster-search').fill(firstName);
      checks.searchVisibleRows=await page.locator('[data-roster-name]:visible').count();
      await page.locator('#roster-search').fill('no-matching-person');
      checks.searchEmptyState=await page.locator('#empty-search').isVisible();
      await page.locator('#roster-search').fill('');
      const quote=page.locator('.roster-table [data-player]').last();
      await quote.click();
      checks.quoteInspectionOpened=await quote.getAttribute('aria-expanded')==='true';
      await page.locator('[data-close-inspection]').click();
      checks.quoteClosedWithFocus=await quote.evaluate(e=>document.activeElement===e);
      if(persona==='neural') {
        const gap=page.locator('[data-gap]').first();await gap.click();
        checks.missingQuoteInspectionOpened=await gap.getAttribute('aria-expanded')==='true';
        await page.keyboard.press('Escape');
        checks.missingQuoteClosedWithFocus=await gap.evaluate(e=>document.activeElement===e);
        checks.scoreUnknownVisible=await page.locator('.score.missing').textContent()==='Score unavailable';
        checks.noModelPercentages=await page.locator('.model-numbers').count()===0;
      }
    } else {
      const pair=page.locator('.pair-list details').nth(3);await pair.locator('summary').click();
      checks.partialPairingExpanded=await pair.evaluate(e=>e.open);
      checks.publicNoRoster=await page.locator('[data-player],#valuation,[data-gap]').count()===0;
    }
    const team=page.locator('[data-team="8"]');await team.click();
    checks.previousManagerQualification=await page.locator('.inline-detail').textContent().then(t=>t.includes('previous manager as QBs Gremlins'));
    await page.keyboard.press('Escape');
    checks.teamClosedWithFocus=await team.evaluate(e=>document.activeElement===e);
    await page.evaluate(()=>document.documentElement.style.fontSize='150%');
    checks.enlargedText=await page.evaluate(()=>({rootSize:getComputedStyle(document.documentElement).fontSize,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,horizontalOverflow:document.documentElement.scrollWidth>innerWidth}));
    await page.evaluate(()=>document.documentElement.style.fontSize='');
    await page.goto(`${base}?persona=${persona}&stage=structure`);
    await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='03');
    checks.structure=await page.evaluate(()=>({stage:document.documentElement.dataset.stage,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rosterRows:document.querySelectorAll('[data-roster-name]').length,leagueRows:document.querySelectorAll('.standings-table tbody>tr').length}));
    results.push({persona,width,checks,errors,failedRequests,remoteRequests});
    await page.close();
  }
}
await browser.close();
await writeFile(new URL('./browser-evidence.json',import.meta.url),JSON.stringify({method:'Headless system Chromium, localhost static server; 1440 and 1120 CSS px; reduced motion; 150% root text enlargement. Local inspection checks only, not production or release verification.',results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
