const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const out=path.join(__dirname,'evidence');
fs.mkdirSync(out,{recursive:true});
const base='http://127.0.0.1:4207/qa/homepage-personal-20/09/index.html';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[];const failures=[];const errors=[];const remote=[];
 for(const persona of ['reaves','neural','guest']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(persona+': '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(persona+': HTTP '+r.status()+' '+r.url());});
  page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4207/'))remote.push(r.url());});
  await page.goto(base+'?persona='+persona);
  await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='09');
  for(const width of [1440,1120]){
   await page.setViewportSize({width,height:1000});
   const geometry=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,players:document.querySelectorAll('.player-reading').length,h1:document.querySelector('h1').textContent,fonts:[document.fonts.check('400 18px Lora'),document.fonts.check('500 30px Oswald'),document.fonts.check('400 18px Plex')]}));
   assert.ok(geometry.scroll<=width,persona+' '+width+' overflow');
   assert.equal(geometry.players,persona==='reaves'?5:persona==='neural'?3:0);
   assert.ok(geometry.fonts.every(Boolean));
   results.push({persona,width,mode:'normal',...geometry});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:path.join(out,persona+'-1440-review.png'),fullPage:true});
  for(const id of ['first-player','first-roster','first-opponent']){
   const original=await page.locator('#'+id).textContent();
   await page.locator('#'+id).click();
   await page.locator('#detail-title').waitFor();
   const detail=await page.locator('#detail-title').textContent();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-title');
   if(persona==='reaves'&&id==='first-player')assert.match(await page.locator('.detail').innerText(),/42\.50/);
   if(persona==='neural'&&id==='first-player')assert.match(await page.locator('.detail').innerText(),/45\.00/);
   if(persona!=='guest'&&id==='first-roster')assert.equal(await page.locator('tbody tr').count(),persona==='reaves'?24:22);
   if(persona==='guest'&&id==='first-roster')assert.match(await page.locator('.detail').innerText(),/previous manager as QBs Gremlins/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('[data-back]').first().click();
   await page.waitForFunction(id=>document.activeElement.id===id,id);
   assert.equal(await page.locator('#'+id).textContent(),original);
   results.push({persona,journey:id,detail,returnFocus:id});
  }
  await page.locator('#first-opponent').click();
  await page.goBack();
  await page.waitForFunction(()=>document.activeElement.id==='first-opponent');
  await page.goForward();
  await page.locator('#detail-title').waitFor();
  await page.goBack();
  await page.locator('#home-title').waitFor();
  for(const width of [1440,1120]){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(()=>document.documentElement.style.fontSize='32px');
   const geometry=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,rootSize:getComputedStyle(document.documentElement).fontSize,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2).slice(0,5).map(e=>e.className)}));
   results.push({persona,width,mode:'2x text',...geometry});
   if(geometry.scroll>width)failures.push({persona,width,mode:'2x text',...geometry});
   if(width===1120)for(const id of ['first-player','first-roster','first-opponent']){
    await page.locator('#'+id).click();await page.locator('#detail-title').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),persona+' 2x detail overflow '+id);
    await page.locator('[data-back]').first().click();await page.waitForFunction(id=>document.activeElement.id===id,id);
   }
   await page.evaluate(()=>document.documentElement.style.fontSize='');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.player-reading').count(),persona==='reaves'?5:persona==='neural'?3:0);
  await page.locator('#first-player').click();await page.locator('#detail-title').waitFor();await page.locator('[data-back]').first().click();await page.locator('#home-title').waitFor();
  results.push({persona,mode:'reduced motion',journey:'player/team reading and return',passed:true});
  await page.locator('.synthetic').click();
  await page.waitForFunction(()=>location.hash==='#sources');
  await page.waitForTimeout(80);
  assert.ok(await page.locator('#sources').evaluate(el=>el.getBoundingClientRect().top<innerHeight),'source anchor must reach source content');
  results.push({persona,mode:'navigation',journey:'Synthetic demo → source explanation',passed:true});
  await page.goto(base+'?persona='+persona+'&stage=structure');
  await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='09');
  assert.equal(await page.locator('.player-reading').count(),persona==='reaves'?5:persona==='neural'?3:0);
  results.push({persona,mode:'structure',ready:true});
  await page.close();
 }
 const report={checkedAt:new Date().toISOString(),browser:'Playwright Chromium headless',results,failures,errors,remoteRequests:remote};
 fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(report,null,2));
 await browser.close();console.log(JSON.stringify(report,null,2));
 if(failures.length||errors.length||remote.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
