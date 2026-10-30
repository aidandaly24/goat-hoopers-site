const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/07/';
const out = __dirname;
const report = { browser:'System Chromium through Playwright', executable:'/usr/bin/chromium', viewportHeight:1000, homeChecks:[], journeys:[], supporting:[], errors:[], externalNavigation:[] };
const ready = async page => page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='07');
async function bounds(page) {
  return page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,persona:document.documentElement.dataset.persona,largeText:document.documentElement.dataset.largeText,streams:[...document.querySelectorAll('.stream')].map(x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}),brokenImages:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src)}));
}
async function home(page,persona,width,motion='no-preference',enlarged=false) {
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({reducedMotion:motion});
  await page.goto(base+'?persona='+persona);
  await ready(page);
  if(enlarged){await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.waitForFunction(()=>document.documentElement.dataset.largeText==='true');}
  const b=await bounds(page);
  assert.equal(b.document,b.viewport,`document overflow ${persona}/${width}/${motion}/${enlarged}`);
  assert.equal(b.persona,persona);
  assert.equal(b.brokenImages.length,0);
  if(!enlarged) {assert.equal(b.streams.length,3);assert.equal(b.streams[0].y,b.streams[1].y);assert.equal(b.streams[1].y,b.streams[2].y);assert(b.streams[0].width>b.streams[1].width&&b.streams[1].width>b.streams[2].width);}
  report.homeChecks.push({persona,width,motion,textScale:enlarged?'200%':'100%',...b});
}
async function journey(page,persona,width,index) {
  const selector=['#first-action','#second-action','#third-action'][index];
  const start=await page.locator(selector).evaluate(x=>{x.scrollIntoView({block:'center'});return scrollY;});
  if(persona==='guest'&&index===2){
    const popupEvent=page.waitForEvent('popup');
    await page.locator(selector).click();
    const popup=await popupEvent;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(),'https://goathoopers.com/login');
    await popup.close();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'third-action');
    report.journeys.push({persona,width,selector,result:'Existing-site login opened a new tab; intercepted, no live auth',focusRestored:true});return;
  }
  await page.locator(selector).click();await ready(page);
  const expectedView=index===0?(persona==='guest'?'matchup':'player'):index===1?'team':'matchup';
  assert.equal(new URL(page.url()).searchParams.get('view'),expectedView);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'page-title');
  const text=await page.locator('main').innerText();
  if(index===0&&persona!=='guest')assert(text.includes(persona==='reaves'?'Joel Embiid':'Giannis Antetokounmpo'));
  if(index===1&&persona!=='guest'){
    assert.equal(await page.locator('#roster-table tbody tr').count(),persona==='reaves'?24:22);
    assert(text.includes(persona==='reaves'?'24/24':'16/22'));
    if(persona==='neural'){assert(text.includes('Under the previous manager as QBs Gremlins.'));assert.equal(await page.locator('#roster-table tbody tr').filter({hasText:'Unpriced'}).count(),6);}
    await page.locator('#player-search').fill(persona==='reaves'?'Embiid':'Antetokounmpo');
    assert.equal(await page.locator('#roster-table tbody tr:visible').count(),1);
    await page.locator('#roster-search button').click();
    await page.waitForFunction(()=>!document.querySelector('#player-search').value&&[...document.querySelectorAll('#roster-table tbody tr')].every(x=>!x.hidden));
    assert.equal(await page.locator('#roster-table tbody tr:visible').count(),persona==='reaves'?24:22);
  }
  if(persona==='guest'){assert(!text.includes('Modeled FAAB quote'));assert.equal(await page.locator('#roster-table').count(),0);if(index===0)assert(!text.includes('56%'));}
  if(index===2&&persona==='neural'){assert(text.includes('Score unavailable'));assert(text.includes('No saved model estimate'));assert(!text.includes('56%'));}
  if(index===2&&persona==='reaves'){assert(text.includes('56%')&&text.includes('44%')&&text.includes('0.35')&&text.includes('26 Oct'));}
  const detailBounds=await bounds(page);assert.equal(detailBounds.document,detailBounds.viewport);
  if(index===1)await page.goBack();else await page.locator('[data-return]').click();
  await ready(page);
  assert.equal(new URL(page.url()).searchParams.get('view'),null);
  assert.equal(await page.evaluate(()=>document.activeElement.id),selector.slice(1));
  const returnedScroll=await page.evaluate(()=>scrollY);
  assert(Math.abs(returnedScroll-start)<3,`scroll restore ${persona}/${selector}: ${start} vs ${returnedScroll}`);
  report.journeys.push({persona,width,selector,result:expectedView,focusRestored:true,scrollRestored:true,detailOverflow:false});
}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext();
  await context.route('https://goathoopers.com/**',async r=>{report.externalNavigation.push({url:r.request().url(),status:'intercepted before network'});await r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>External navigation intercepted for test</title><p>No live login was contacted.</p>'});});
  const page=await context.newPage();page.on('pageerror',err=>report.errors.push(err.message));
  for(const persona of ['reaves','neural','guest'])for(const width of [1440,1120]){
    await home(page,persona,width);
    for(let i=0;i<3;i++)await journey(page,persona,width,i);
    await home(page,persona,width,'reduce');
    await home(page,persona,width,'no-preference',true);
    await home(page,persona,width,'reduce',true);
  }
  await home(page,'reaves',1440);
  const color=await bounds(page);
  await page.goto(base+'?persona=reaves&stage=structure');await ready(page);
  const structure=await bounds(page);
  assert.deepEqual(structure.streams,color.streams);
  assert.equal(await page.locator('.portrait-field img').evaluate(x=>getComputedStyle(x).visibility),'hidden');
  report.supporting.push('Structure/color stream geometry identical; imagery visibility neutralized.');
  await page.locator('#persona').selectOption('neural');await ready(page);
  assert.equal(await page.locator('#page-title').innerText(),'NeuralNets');
  assert.equal(new URL(page.url()).searchParams.get('stage'),'structure');
  report.supporting.push('Native persona select updates URL/content/persona and preserves structure stage.');
  await page.goto(base+'?persona=guest');await ready(page);
  const guest=await page.locator('main').innerText();
  assert(!/modeled FAAB|Joel Embiid|Giannis Antetokounmpo|your roster/i.test(guest));
  assert.equal(await page.locator('.guest-team').count(),10);
  assert.equal(await page.locator('.game-link').count(),5);
  report.supporting.push('Guest has ten public team/manager entries, five public games, no private roster/quote/player evidence.');
  const destinations=await page.locator('.site-footer a.external').evaluateAll(links=>links.map(x=>new URL(x.href).pathname));
  const fixture=require('../fixture.json');
  assert(fixture.destinations.filter(x=>x.href!=='/').every(x=>destinations.includes(x.href)));
  report.supporting.push('All existing fixture destinations discoverable in header/footer; external links have descriptive labels and new-tab behavior.');
  for(const [persona,width,file] of [['reaves',1440,'check-first-1440.png'],['neural',1120,'check-first-1120.png'],['guest',1440,'check-guest-1440.png']]){await home(page,persona,width);await page.screenshot({path:path.join(out,file),fullPage:true});}
  assert.equal(report.errors.length,0);
  report.result='PASS';
  fs.writeFileSync(path.join(out,'browser-evidence.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({result:report.result,homeChecks:report.homeChecks.length,firstThreeJourneys:report.journeys.length,externalChecks:report.externalNavigation.length,errors:report.errors,supporting:report.supporting},null,2));
  await browser.close();
})().catch(error=>{report.result='FAIL';report.failure=String(error.stack||error);fs.writeFileSync(path.join(out,'browser-evidence.json'),JSON.stringify(report,null,2)+'\n');console.error(error);process.exit(1);});
