const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:4207/qa/homepage-personal-20/17/';
const out=path.join(__dirname,'evidence');
async function fontsUsed(page){
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument');const result={};
 for(const [role,selector]of Object.entries({heading:'#main h1',reading:'.period',control:'.game-ribbon .inspect',data:'.ribbon-score'})){
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
  result[role]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
 }
 await cdp.detach();return result;
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 const requests=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4207/'))requests.push(r.url());});
 const results=[];
 for(const width of [1440,1120])for(const persona of ['reaves','neural','guest']){
  await page.setViewportSize({width,height:1000});await page.goto(`${base}?persona=${persona}`);await page.waitForSelector('html[data-personal-study-ready="17"]');
  assert.equal(await page.locator('html').getAttribute('data-persona'),persona);
  assert.equal(await page.locator('.fixture').count(),5);
  assert.equal(await page.locator('.footer-groups a').count(),15);
  assert.equal(await page.locator('.fixture-side .team-link').count(),10);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${persona} at ${width} horizontal overflow`);
  if(persona==='reaves')assert.equal(await page.locator('.evidence-list>li').count(),5);
  if(persona==='neural'){
   assert.equal(await page.locator('.evidence-list>li').count(),3);
   assert.match(await page.locator('#record').innerText(),/previous manager as QBs Gremlins/);
   assert.match(await page.locator('.ribbon-state').innerText(),/missing score is not zero/);
   assert.match(await page.locator('#work-title').innerText(),/opponent/);
  }
  if(persona==='guest'){assert.equal(await page.locator('.franchise-index>li').count(),10);assert.equal(await page.locator('.quote-work').count(),0);}
  results.push({persona,width,overflow:false,fixtures:5,footerDestinations:15,height:await page.locator('body').evaluate(el=>el.scrollHeight)});
  if((width===1440&&persona==='reaves')||(width===1120&&persona==='neural')||(width===1440&&persona==='guest'))await page.screenshot({path:path.join(out,`${persona}-${width}.png`),fullPage:true});
 }
 await page.goto(`${base}?persona=reaves`);await page.waitForSelector('html[data-personal-study-ready="17"]');
 const platformFonts=await fontsUsed(page);
 const receipt=page.locator('[data-inspect="player:1444"]');await receipt.click();assert(await page.locator('#inspection').evaluate(el=>el.open));assert.match(await page.locator('#inspection-body').innerText(),/42.5 points/);
 await page.goBack();await page.waitForFunction(()=>!document.querySelector('#inspection').open);assert(await receipt.evaluate(el=>el===document.activeElement));await page.goForward();await page.waitForFunction(()=>document.querySelector('#inspection').open);assert.match(await page.locator('#inspection-body').innerText(),/42.5 points/);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#inspection').open);
 await receipt.click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#inspection').open);assert(await receipt.evaluate(el=>el===document.activeElement));
 await page.locator('[data-inspect="quotes"]').click();await page.locator('#quote-search').fill('Joel');assert.equal(await page.locator('#quote-roster li:visible').count(),1);await page.locator('[data-close-inspection]').click();await page.waitForFunction(()=>!document.querySelector('#inspection').open);
 await page.locator('#demo-persona').selectOption('neural');await page.waitForSelector('html[data-persona="neural"][data-personal-study-ready="17"]');
 await page.locator('[data-inspect="team:7"]').first().click();assert.match(await page.locator('#inspection-body').innerText(),/2025 franchise record/);await page.locator('[data-close-inspection]').click();await page.waitForFunction(()=>!document.querySelector('#inspection').open);
 await page.locator('[data-inspect="quotes"]').click();await page.locator('#unpriced-only').check();assert.equal(await page.locator('#quote-roster li:visible').count(),6);await page.locator('[data-close-inspection]').click();await page.waitForFunction(()=>!document.querySelector('#inspection').open);
 await page.locator('[data-inspect="matchup"]').click();assert.match(await page.locator('#inspection-body').innerText(),/recorded zero/);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#inspection').open);
 await page.goto(`${base}?persona=guest&stage=structure`);await page.waitForSelector('html[data-personal-study-ready="17"]');assert.equal(await page.locator('html').getAttribute('data-stage'),'structure');assert.equal(await page.locator('.fixture').count(),5);
 for(const width of [1440,1120])for(const enlargedPersona of ['reaves','neural','guest']){
  await page.setViewportSize({width,height:1000});await page.goto(`${base}?persona=${enlargedPersona}`);await page.waitForSelector('html[data-personal-study-ready="17"]');
  await page.evaluate(()=>{const sizes=[...document.querySelectorAll('body *')].filter(el=>!['SCRIPT','STYLE','IMG'].includes(el.tagName)).map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const[el,size]of sizes)el.style.fontSize=`${size*2}px`;});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const clipped=await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(el=>el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflowX==='visible'&&el.clientWidth>0).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,55),width:el.clientWidth,scroll:el.scrollWidth})).slice(0,15));
  assert(!overflow,`${enlargedPersona} enlarged overflow`); assert.equal(clipped.length,0,JSON.stringify(clipped)); results.push({persona:enlargedPersona,width,textScale:2,overflow,clipped});
  if(width===1120&&enlargedPersona==='neural')await page.screenshot({path:path.join(out,'neural-1120-text200.png'),fullPage:true});
 }
 const structureGeometry=[]; await page.setViewportSize({width:1440,height:1000});for(const mode of ['reaves','neural','guest']){await page.goto(`${base}?persona=${mode}`);await page.waitForSelector('html[data-personal-study-ready="17"]');const normal=await page.evaluate(()=>({height:document.body.scrollHeight,sections:[...document.querySelectorAll('main section')].map(el=>Math.round(el.getBoundingClientRect().height))}));await page.goto(`${base}?persona=${mode}&stage=structure`);await page.waitForSelector('html[data-personal-study-ready="17"]');const structure=await page.evaluate(()=>({height:document.body.scrollHeight,sections:[...document.querySelectorAll('main section')].map(el=>Math.round(el.getBoundingClientRect().height))}));assert.deepEqual(structure,normal);structureGeometry.push({persona:mode,sameGeometry:true});}await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${base}?persona=neural`);await page.waitForSelector('html[data-personal-study-ready="17"]');assert.equal(await page.locator('.fixture').count(),5);assert.equal(await page.locator('.evidence-list>li').count(),3);assert.equal(errors.length,0);assert.equal(requests.length,0);
 const report={results,platformFonts,structureGeometry,reducedMotionContent:true,interactionChecks:['receipt open/Back/Forward/focus','receipt Escape/focus','quote search','persona selector','opponent record inspection','six unpriced filter','matchup known-zero explanation','structure state'],pageErrors:errors,externalRequests:requests};
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
