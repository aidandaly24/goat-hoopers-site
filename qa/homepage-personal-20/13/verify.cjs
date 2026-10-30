const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.GOAT_13_BASE || 'http://127.0.0.1:4207/qa/homepage-personal-20/13/';
const out = path.join(__dirname,'checks');
async function focused(page,loc){await page.waitForFunction(el=>el===document.activeElement,await loc.elementHandle());}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const report={revision:'priority correction',engine:'Headless Chromium /usr/bin/chromium; preinstalled Playwright',base,layouts:[],journeys:[],errors:[],limits:['Focused changed-content checks, not a rerun of the original exhaustive matrix','Desktop Chromium only; no remote auth/tool requests']};
 const page=await browser.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`)});
 const cases=['reaves','neural','guest'].flatMap(persona=>[{persona,width:1440,text:16},{persona,width:1120,text:16}]);cases.push({persona:'neural',width:1120,text:24});
 for(const c of cases){
  await page.setViewportSize({width:c.width,height:1000});await page.goto(`${base}?persona=${c.persona}`);await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='13');
  if(c.text===24)await page.addStyleTag({content:'html{font-size:24px!important}'});
  const metrics=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,openingBottom:document.querySelector('.following').getBoundingClientRect().bottom,sourceLogOpen:document.getElementById('source-update-log').open,sourceTop:document.getElementById('updates').getBoundingClientRect().top,firstReadingTop:document.querySelector('#evidence .evidence-table tbody tr:not([data-local-panel]),#league .pair-item')?.getBoundingClientRect().top}));
  assert.equal(metrics.viewport,metrics.scrollWidth);assert.equal(metrics.sourceLogOpen,false);assert.ok(metrics.openingBottom<1000);assert.ok(metrics.sourceTop>1000);
  const reading=c.persona==='guest'?page.locator('#league .pair-item').first():page.locator('#evidence .evidence-table tbody tr:not([data-local-panel])').first();
  const box=await reading.boundingBox();assert.ok(box.y+box.height<1000,`${c.persona} ${c.width}/${c.text}: useful first reading in fold`);
  if(c.persona!=='guest'){assert.match(await reading.textContent(),c.persona==='neural'?/Giannis Antetokounmpo.*45/s:/Damian Lillard.*42.5/s);assert.ok(await page.locator('#evidence').evaluate(el=>el.compareDocumentPosition(document.getElementById('league'))&Node.DOCUMENT_POSITION_FOLLOWING));}
  assert.equal(await page.locator('.entry:visible').count(),0);
  await page.screenshot({path:path.join(out,`priority-${c.persona}-${c.width}-${c.text}px.png`),fullPage:false});
  report.layouts.push({...c,...metrics,firstReadingBottom:box.y+box.height,pass:true});
 }
 for(const persona of ['reaves','neural']){
  await page.setViewportSize({width:1440,height:1000});await page.goto(`${base}?persona=${persona}`);await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='13');
  await page.locator('#first-evidence-action').click();await focused(page,page.locator('#evidence-title'));
  const player=page.locator(`[data-evidence-player="${persona==='neural'?'1380':'1444'}"]`);await player.click();const ep=page.locator(`#evidence-${persona==='neural'?'1380':'1444'}`);assert.match(await ep.textContent(),persona==='neural'?/45 counted points/:/42.5 counted points/);await ep.locator('[data-close]').click();await focused(page,player);
  report.journeys.push({persona,task:'Leading owned-player reading, period, inspect and close focus',pass:true});
  const quote=page.locator('.following [data-panel="quotes"]');await quote.click();assert.ok(await page.locator('#quotes').isVisible());assert.equal(await page.locator('#quotes').evaluate(el=>!!el.closest('#source-update-log')),false);assert.match(await page.locator('#quotes').textContent(),persona==='neural'?/Partial modeled subtotal.*1,622.00/s:/Complete modeled quote.*1,095.25/s);
  await page.locator('#quote-search').fill(persona==='neural'?'Giannis':'Joel');const qp=page.locator('#quote-rows [data-quote-player]').first();await qp.click();const detail=page.locator('#quote-rows [data-local-panel]:visible');await detail.locator('[data-close]').click();await focused(page,qp);await page.locator('#clear-search').click();assert.match(await page.locator('#quote-count').textContent(),persona==='neural'?/22 of 22/:/24 of 24/);await page.locator('#quotes > [data-close]').click();await focused(page,quote);
  report.journeys.push({persona,task:'Relocated quote inspector, search/reset and nested/parent focus',pass:true});
  const pairing=page.locator('.opening-matchup [data-panel="opening-pair-detail"]');await pairing.click();assert.match(await page.locator('#opening-pair-detail').textContent(),persona==='neural'?/recorded zero/:/184.5/);await page.goBack();assert.ok(await page.locator('#opening-pair-detail').isHidden());await focused(page,pairing);
  report.journeys.push({persona,task:'Opening opponent context and browser Back focus',pass:true});
  await page.locator('#source-update-log > summary').click();assert.equal(await page.locator('.entry:visible').count(),4);const supporting=page.locator(`#update-${persona==='neural'?'c3':'c2'} [data-panel="quotes"]`);await supporting.click();assert.ok(await page.locator('#quotes').isVisible());await page.locator('#quotes > [data-close]').click();await focused(page,supporting);
  report.journeys.push({persona,task:'Supporting source disclosure and cross-document quote return',pass:true});
 }
 await page.goto(`${base}?persona=guest`);await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='13');
 const pair=page.locator('[data-matchup="m4"]').first();await pair.click();assert.match(await page.locator('[data-local-panel]:visible').textContent(),/recorded zero/);await page.keyboard.press('Escape');await focused(page,pair);
 await page.locator('#full-standings > summary').click();assert.equal(await page.locator('#full-standings tbody > tr').count(),10);const team=page.locator('#full-standings [data-team="8"]');await team.click();assert.match(await page.locator('[data-local-panel]:visible').textContent(),/previous manager as QBs Gremlins/);await page.keyboard.press('Escape');await focused(page,team);assert.equal(await page.locator('#quotes').count(),0);assert.equal(await page.locator('.site-links > a[href="https://goathoopers.com/login"]').count(),1);
 report.journeys.push({persona:'guest',task:'Leading public league reading, zero/null pair, ten-team directory/history and real sign-in href',pass:true});
 await page.goto(`${base}?persona=neural&stage=structure`);await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='13');assert.equal(await page.locator('#source-update-log').evaluate(el=>el.open),false);assert.equal(await page.locator('.evidence-table tbody > tr:not([data-local-panel])').count(),3);
 report.journeys.push({persona:'neural',task:'Changed priority and supporting disclosure remain in structure mode',pass:true});
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'priority-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({layouts:report.layouts.length,journeys:report.journeys.length,errors:report.errors,pass:true}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
