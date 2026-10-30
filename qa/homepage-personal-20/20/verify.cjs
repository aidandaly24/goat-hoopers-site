const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/20/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[], externalRequests=[], results={viewports:[],journeys:[],errors,externalRequests};
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4207/'))externalRequests.push(r.url())});
 const open=async(persona,width=1440,stage='')=>{await page.setViewportSize({width,height:1000});await page.goto(`${base}?persona=${persona}${stage?'&stage='+stage:''}`);await page.waitForSelector('html[data-personal-study-ready="20"]');};
 for(const width of [1440,1120])for(const persona of ['reaves','neural','guest']){
  await open(persona,width);
  const normal=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.body.scrollHeight,persona:document.documentElement.dataset.persona,branchCount:document.querySelectorAll('.branch').length,heading:document.querySelector('#home-title').textContent,contextBottom:document.querySelector('.context-line').getBoundingClientRect().bottom}));
  assert.equal(normal.width,normal.scrollWidth);assert.equal(normal.persona,persona);assert(normal.contextBottom<1000);
  if(persona==='guest'){const text=await page.locator('#home-view').innerText();assert(!text.includes('1,095.25'));assert(!text.includes('1,622.00'));assert.equal(await page.locator('.games li').count(),5);assert.equal(await page.locator('.club-list li').count(),10)}
  if(persona==='neural'){assert.match(await page.locator('#home-view').innerText(),/1,622.00/);assert.match(await page.locator('#matchup').innerText(),/Score unavailable/);assert.match(await page.locator('#matchup').innerText(),/No saved model estimate/)}
  const routeCount=await page.locator('#site-nav a').count();assert.equal(routeCount,14);
  if(width===1120&&persona==='guest')await page.screenshot({path:'/tmp/goat20-guest-1120.png',fullPage:true});
  if(width===1440&&persona==='neural')await page.screenshot({path:'/tmp/goat20-neural-1440.png',fullPage:true});
  await page.addStyleTag({content:':root{font-size:200%!important}'});
  const enlarged=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.body.scrollHeight,rootFont:getComputedStyle(document.documentElement).fontSize,branchLayout:getComputedStyle(document.querySelector('.branch')).display}));
  assert.equal(enlarged.width,enlarged.scrollWidth);assert.equal(enlarged.rootFont,'32px');assert.equal(enlarged.branchLayout,'block');
  results.viewports.push({width,persona,normal,enlarged});
 }
 // 1. Homepage -> evidence -> player -> browser Back -> explicit Back, with focus.
 await open('reaves');await page.locator('#review-evidence').click();await page.locator('#detail-title').waitFor();assert.match(await page.locator('#detail-view').innerText(),/Your supplied player evidence/);
 await page.locator('#detail-player-1444').click();await page.waitForFunction(()=>document.querySelector('#detail-title')?.textContent==='Damian Lillard');assert.match(await page.locator('#detail-view').innerText(),/42.5 synthetic points/);
 await page.goBack();await page.waitForFunction(()=>document.activeElement?.id==='detail-player-1444');await page.locator('#back-home').click();await page.waitForFunction(()=>document.activeElement?.id==='review-evidence');
 results.journeys.push({name:'Reaves evidence → Damian → browser Back → explicit home',selectors:['#review-evidence','#detail-player-1444','#back-home'],result:'passed; both return focus targets restored'});
 // 2. Neural roster -> unpriced AJ -> browser Back -> explicit Back.
 await open('neural',1120);await page.locator('#open-roster').click();await page.locator('#roster-player-4866').click();await page.waitForFunction(()=>document.querySelector('#detail-title')?.textContent==='AJ Dybantsa');assert.match(await page.locator('#detail-view').innerText(),/Unpriced/);assert(!await page.locator('#detail-view').innerText().then(x=>x.includes('0.00')));
 await page.goBack();await page.waitForFunction(()=>document.activeElement?.id==='roster-player-4866');await page.locator('#back-home').click();await page.waitForFunction(()=>document.activeElement?.id==='open-roster');
 results.journeys.push({name:'Neural full squad → unpriced AJ → browser Back → explicit home',selectors:['#open-roster','#roster-player-4866','#back-home'],result:'passed; Unpriced preserved and focus restored'});
 // 3. Matchup -> opponent -> browser Back -> home; null / zero and historical qualifier.
 await page.locator('#inspect-matchup').click();assert.match(await page.locator('#detail-view').innerText(),/Score unavailable/);await page.locator('#match-team-7-detail').click();await page.waitForFunction(()=>document.querySelector('#detail-title')?.textContent==='papichooter');await page.goBack();await page.waitForFunction(()=>document.activeElement?.id==='match-team-7-detail');await page.locator('#back-home').click();await page.waitForFunction(()=>document.activeElement?.id==='inspect-matchup');
 results.journeys.push({name:'Neural matchup → papichooter → browser Back → home',selectors:['#inspect-matchup','#match-team-7-detail','#back-home'],result:'passed; score unavailable and recorded zero remain distinct; focus restored'});
 await open('guest');await page.locator('#team-8-club').click();await page.waitForFunction(()=>document.querySelector('#detail-title')?.textContent==='NeuralNets');assert.match(await page.locator('#detail-view').innerText(),/Under the previous manager as QBs Gremlins/);assert.match(await page.locator('#detail-view').innerText(),/Roster detail is not supplied/);
 results.guestInspection='passed; public club detail, history qualifier and no private roster';
 await open('reaves');await page.locator('.demo-tag').click();await page.waitForFunction(()=>document.querySelector('#sources').open);results.sources='passed; visible demo label opens source explanation';
 // Structure mode retains content dimensions at a fixed width.
 await open('reaves',1440);const geometry=await page.locator('#home-view').boundingBox();const content=await page.locator('#home-view').innerText();await open('reaves',1440,'structure');const neutral=await page.locator('#home-view').boundingBox();assert.equal(content,await page.locator('#home-view').innerText());assert.deepEqual(geometry,neutral);results.structure='passed; same content and homepage geometry';
 await open('reaves',1440);
 results.contrastPairs=await page.evaluate(()=>{
  const lum=s=>{let rgb=s.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
  const pair=(name,fg,bg)=>({name,foreground:fg,background:bg,ratio:Number(((Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05)).toFixed(2))});
  const css=getComputedStyle(document.documentElement),canvas=css.backgroundColor,primary=getComputedStyle(document.querySelector('.primary')),rail=getComputedStyle(document.querySelector('.route-rail')),muted=getComputedStyle(document.querySelector('.scope'));
  return[pair('body / canvas',css.color,canvas),pair('scope / canvas',muted.color,canvas),pair('primary action',primary.color,primary.backgroundColor),pair('rail text',rail.color,rail.backgroundColor)];
 });assert(results.contrastPairs.every(p=>p.ratio>=4.5));
 await page.keyboard.press('Tab');
 const skip=await page.evaluate(()=>({class:document.activeElement.className,top:document.activeElement.getBoundingClientRect().top}));assert.equal(skip.class,'skip');assert(skip.top>=0);
 await page.keyboard.press('Enter');await page.locator('#review-evidence').focus();await page.keyboard.press('Enter');await page.locator('#detail-player-1444').waitFor();await page.goBack();await page.waitForFunction(()=>document.activeElement?.id==='review-evidence');
 const keyboardFocus=await page.locator('#review-evidence').evaluate(el=>({id:el.id,outline:getComputedStyle(el).outlineWidth,style:getComputedStyle(el).outlineStyle}));assert.equal(keyboardFocus.outline,'3px');
 results.keyboard={skip,enterEvidenceAndBack:'passed',focus:keyboardFocus};
 await open('reaves',1440,'structure');await page.locator('input[name=persona][value=guest]').check();await page.waitForSelector('html[data-persona=guest][data-personal-study-ready="20"]');assert.equal(await page.evaluate(()=>document.documentElement.dataset.stage),'structure');results.personaControl='passed; native radio navigates to guest and preserves structure query';
 await open('reaves',1440);await page.screenshot({path:'/tmp/goat20-final-reaves-1440.png',fullPage:true});
 assert.equal(errors.length,0);assert.equal(externalRequests.length,0);
 fs.writeFileSync('qa/homepage-personal-20/20/verification.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({viewports:results.viewports.length,journeys:results.journeys.length,guest:results.guestInspection,sources:results.sources,structure:results.structure,contrast:results.contrastPairs,errors,externalRequests},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
