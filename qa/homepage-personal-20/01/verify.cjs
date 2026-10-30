const { chromium } = require('playwright');
const fs = require('node:fs');
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/01/';
const assert = (test, message) => { if (!test) throw new Error(message); };
const visibleTextBounds = () => {
  const text=[]; const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let node;
  while(node=walker.nextNode()) {
    if(!node.textContent.trim()) continue;
    const el=node.parentElement;
    if(!el||el.closest('.sr-only,script,style,dialog:not([open])')) continue;
    const css=getComputedStyle(el); if(css.display==='none'||css.visibility==='hidden') continue;
    const range=document.createRange(); range.selectNodeContents(node);
    for(const r of range.getClientRects()) if(r.width>0&&(r.left<-.5||r.right>innerWidth+.5)) text.push({text:node.textContent.trim().slice(0,70),left:Math.round(r.left),right:Math.round(r.right)});
  }
  return text;
};
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const results = { revision: 'Dark sports revision of concept 01', browser: await browser.version(), environment: 'System Chromium via Playwright; desktop emulation', pages: [], interactions: [], enlargedText: [] };
  for (const persona of ['reaves', 'neural', 'guest']) {
    for (const width of [1440, 1120]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(`${base}?persona=${persona}`);
      await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '01');
      const measurements = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, persona: document.documentElement.dataset.persona }));
      const text = await page.evaluate(visibleTextBounds);
      assert(measurements.scrollWidth === measurements.clientWidth, `Overflow: ${persona} at ${width}`);
      assert(!text.length, `Visible text outside viewport: ${JSON.stringify(text)}`);
      assert(!errors.length, errors.join('; '));
      assert(measurements.persona === persona, 'Incorrect persona marker');
      assert(await page.locator('main table').count() === 0, 'Homepage should not be a complete table spine');
      assert(await page.locator('.slate-game').count() === 4, 'Other four pairings missing');
      assert(await page.locator('.race-row').count() === 3, 'Focused league slice missing');
      assert(await page.locator('footer a[href^="https://goathoopers.com"]').count() === 15, 'A GOAT destination is missing');
      assert(await page.locator('.portrait-button img').count() === (persona === 'guest' ? 4 : 3), 'Visible player portraits missing');
      if(persona==='neural') assert((await page.locator('#matchup').innerText()).includes('Pending')&&(await page.locator('#matchup').innerText()).includes('0.00'),'Missing score was treated as zero');
      if(persona==='guest') assert(!(await page.locator('main').innerText()).includes('Your roster'),'Guest claims private roster');
      results.pages.push({ ...measurements, width, height: 1000, pageErrors: errors, visibleTextOutOfViewport: text, otherPairings: 4, leagueSlice: 3, homepageTables: 0, destinations: 15 });
      if(width===1120) {
        await page.evaluate(() => {
          const nodes=[...document.querySelectorAll('body *')].filter(el=>el instanceof HTMLElement&&!el.closest('.sr-only'));
          const sizes=nodes.map(el=>parseFloat(getComputedStyle(el).fontSize));
          nodes.forEach((el,i)=>el.style.fontSize=`${sizes[i]*2}px`);
        });
        const bounds=await page.evaluate(visibleTextBounds);
        const enlarged=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
        assert(enlarged.scrollWidth===enlarged.clientWidth,'True doubled text document overflow');
        assert(!bounds.length,'True doubled visible text beyond viewport');
        results.enlargedText.push({persona,viewport:1120,method:'Snapshot every HTMLElement computed font size, then apply 2× original size; screen-reader-only text excluded. Root rem size unchanged.',...enlarged,visibleTextOutOfViewport:bounds});
      }
      await page.close();
    }
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='01');
  const matchup=page.locator('.hero-actions [data-matchup]');
  await matchup.focus();await page.keyboard.press('Enter');
  assert(await page.locator('#inspector').evaluate(el=>el.open),'Keyboard matchup failed');
  const modelText=await page.locator('#detail-content').innerText();
  assert(modelText.includes('56%')&&modelText.includes('44%')&&modelText.includes('0.35'),'Saved model context incomplete');
  await page.keyboard.press('Escape');assert(await matchup.evaluate(el=>el===document.activeElement),'Escape focus return failed');
  results.interactions.push('Keyboard Enter opens current matchup; 56/44 saved estimate and separate 0.35 confidence visible. Escape restores trigger focus.');
  const roster=page.locator('.header-account[data-roster]');await roster.click();
  assert(await page.locator('#roster-body tr').count()===24,'Complete Reaves local roster missing');
  await page.locator('#roster-search').fill('Embiid');assert(await page.locator('#roster-body tr').count()===1,'Roster name filter failed');
  const filtered=page.locator('#roster-body [data-player="1511"]');await filtered.click();
  assert((await page.locator('#detail-title').innerText())==='Joel Embiid','Nested player failed');
  assert((await page.locator('#detail-content').innerText()).includes('137.50'),'Quote missing');
  await page.locator('.dialog-back').click();
  assert(await page.locator('#roster-search').inputValue()==='Embiid','Back lost search');
  assert(await page.locator('#roster-body [data-player="1511"]').evaluate(el=>el===document.activeElement),'Back lost row focus');
  await page.locator('#roster-search').fill('xyznoresults');assert(await page.locator('#no-roster-results').isVisible(),'Search empty state missing');
  await page.locator('#roster-search').fill('');assert(await page.locator('#roster-body tr').count()===24,'Clear roster search failed');
  await page.locator('.close').click();assert(await roster.evaluate(el=>el===document.activeElement),'Roster close focus failed');
  results.interactions.push('Local full roster has 24 rows; search, player quote, Back with filtered state/focus, no-result state and clear passed. Close restores roster trigger.');
  await page.locator('.hero-actions [data-team]').click();
  await page.locator('#detail-content [data-roster]').click();
  await page.locator('#roster-body [data-player="1511"]').click();
  await page.locator('.dialog-back').click();await page.locator('.dialog-back').click();
  assert((await page.locator('#detail-title').innerText())==='Reaves Dropper','Nested Back failed');
  assert(await page.locator('#detail-content [data-roster]').evaluate(el=>el===document.activeElement),'Team roster action focus missing');
  await page.keyboard.press('Escape');
  results.interactions.push('Team → full roster → player → Back → Back restores team and original roster action focus.');
  await page.locator('.race-intro [data-standings]').click();assert(await page.locator('.standings tbody tr').count()===10,'Full league table missing');
  await page.locator('.standings [data-team="8"]').click();assert((await page.locator('#detail-content').innerText()).includes('Under the previous manager as QBs Gremlins.'),'Previous-manager qualifier missing');
  await page.keyboard.press('Escape');
  results.interactions.push('Full local standings has 10 teams; NeuralNets profile retains previous-manager qualification.');
  await page.locator('.demo-controls [data-source]').click();assert((await page.locator('#detail-content').innerText()).includes('does not sign you in'),'Demo boundary missing');await page.keyboard.press('Escape');
  await page.locator('#persona').selectOption('neural');await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='01'&&document.documentElement.dataset.persona==='neural');
  await page.locator('.header-account[data-roster]').click();assert(await page.locator('#roster-body tr').count()===22,'Neural roster wrong');
  assert((await page.locator('.roster-summary').innerText()).includes('Partial modeled subtotal'),'Partial valuation mislabeled');
  await page.locator('#roster-body [data-player="4866"]').click();assert((await page.locator('#detail-content').innerText()).includes('never treated as zero'),'Missing quote semantics failed');await page.keyboard.press('Escape');
  await page.locator('.hero-actions [data-matchup]').click();assert((await page.locator('#detail-content').innerText()).includes('No saved AI estimate'),'Missing AI fabricated');await page.keyboard.press('Escape');
  results.interactions.push('Persona switch loads NeuralNets; 22-row roster, partial quote label, unpriced AJ Dybantsa and absent AI are correct.');
  await page.goto(`${base}?persona=reaves`);await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='01');
  const geometry=()=>[...document.querySelectorAll('.hero,.pulse,.players-section,.slate-section,.race-section,.beyond-section')].map(el=>({class:el.className,top:Math.round(el.getBoundingClientRect().top),height:Math.round(el.getBoundingClientRect().height)}));
  const normal=await page.evaluate(geometry);await page.goto(`${base}?persona=reaves&stage=structure`);await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='01');const structure=await page.evaluate(geometry);
  assert(JSON.stringify(normal)===JSON.stringify(structure),'Structure mode changes geometry');results.structure={sameGeometry:true,sections:structure};
  await page.emulateMedia({reducedMotion:'reduce'});assert(await page.locator('.slate-game').count()===4,'Reduced motion loses content');results.interactions.push('Structure mode preserves all six section geometries; reduced-motion preference retains content.');
  assert(!errors.length,errors.join('; '));results.interactionPageErrors=errors;
  results.notTested=['Physical devices','Safari/Firefox','Real GOAT destination behavior','Real authentication/APIs','Production builds, because this is static QA-only work'];
  fs.writeFileSync('qa/homepage-personal-20/01/verification.json',JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
