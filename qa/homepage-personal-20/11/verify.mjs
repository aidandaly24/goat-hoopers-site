import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const dir=fileURLToPath(new URL('.',import.meta.url));
const base='http://127.0.0.1:4207/qa/homepage-personal-20/11/';
const report={date:new Date().toISOString(),method:'Installed Playwright driving system Chromium; local static server; synthetic fixture only',matrix:[],journeys:[],structure:[],errors:[],requests:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>report.errors.push(e.message));
page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4207/'))report.requests.push(r.url());});
page.on('response',r=>{if(r.status()>=400)report.errors.push(`HTTP ${r.status()}: ${r.url()}`);});
async function load(persona,width=1440,stage=''){
  await page.setViewportSize({width,height:1000});
  await page.goto(`${base}?persona=${persona}${stage?'&stage='+stage:''}`);
  await page.waitForSelector('html[data-personal-study-ready="11"]');
}
async function closedWithFocus(selector){
  await page.waitForFunction(()=>!document.querySelector('#inspector').open);
  assert.equal(await page.locator(selector).evaluate(e=>e===document.activeElement),true,`focus restored: ${selector}`);
}
try{
for(const persona of ['reaves','neural','guest']){
  for(const width of [1440,1120]){
    for(const text of [100,200]){
      await load(persona,width);
      if(text===200){await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.evaluate(()=>document.fonts.ready);}
      const result=await page.evaluate(()=>({persona:document.documentElement.dataset.persona,ready:document.documentElement.dataset.personalStudyReady,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,teams:document.querySelectorAll('.club-node').length,games:document.querySelectorAll('.game-row').length,evidence:document.querySelectorAll('.evidence-row').length,mainHeight:Math.round(document.querySelector('main').getBoundingClientRect().height),controlFont:getComputedStyle(document.querySelector('#persona')).fontSize,overflowElements:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).display!=='inline').map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,50),scroll:e.scrollWidth,client:e.clientWidth})).slice(0,10)}));
      assert.equal(result.persona,persona);assert.equal(result.teams,10);assert.equal(result.games,5);assert.equal(result.evidence,persona==='reaves'?5:persona==='neural'?3:0);assert.ok(result.scrollWidth<=width,`page overflow ${persona} ${width} ${text}`);assert.ok(parseFloat(result.controlFont)>=18);
      assert.equal(result.overflowElements.length,0,`internal text overflow: ${JSON.stringify(result.overflowElements)}`);
      report.matrix.push({persona,width,text,...result});
      if((persona==='neural'&&width===1120&&text===100)||(persona==='reaves'&&width===1120&&text===200)) await page.screenshot({path:`${dir}check-${persona}-${width}-${text}.png`,fullPage:true});
    }
  }
}
for(const persona of ['reaves','neural']){
 await load(persona);
 await page.locator('#primary-matchup').click();
 await page.waitForFunction(()=>document.querySelector('#inspector').open);
 const content=await page.locator('#inspector-content').innerText();
 if(persona==='reaves'){assert.match(content,/56%/);assert.match(content,/44%/);assert.match(content,/0\.35/);assert.match(content,/not calibrated odds/);}
 else{assert.match(content,/Unavailable/);assert.match(content,/recorded zero/);assert.match(content,/No saved model estimate/);}
 await page.keyboard.press('Escape');await closedWithFocus('#primary-matchup');
 report.journeys.push({persona,journey:'1. Primary matchup → supplied scores/model or unknown status → Escape',result:'pass; dialog closed; primary trigger focus restored'});
 const club='.club-name[data-id="8"]';
 await page.locator(club).click();await page.waitForFunction(()=>document.querySelector('#inspector').open);
 assert.match(await page.locator('#inspector-content').innerText(),/previous manager as QBs Gremlins/);
 await page.goBack();await closedWithFocus(club);
 await page.goForward();await page.waitForFunction(()=>document.querySelector('#inspector').open);
 await page.locator('#close-inspector').click();await closedWithFocus(club);
 report.journeys.push({persona,journey:'2. Circuit NeuralNets → qualified 2025 context → browser Back → Forward → Close',result:'pass; correct dialog state and restored team trigger'});
 const id=persona==='reaves'?'1444':'1380',player=`#evidence [data-id="${id}"]`;
 await page.locator(player).click();await page.waitForFunction(()=>document.querySelector('#inspector').open);
 const playerText=await page.locator('#inspector-content').innerText();assert.match(playerText,/October 19–25, 2026/);assert.match(playerText,persona==='reaves'?/42\.5/:/45/);
 await page.locator('#close-inspector').click();await closedWithFocus(player);
 report.journeys.push({persona,journey:'3. Visible player evidence → points/period/quote inspection → Close',result:'pass; exact supplied period and points; restored player trigger'});
 await page.locator('#all-quotes summary').click();assert.equal(await page.locator('.quote-list li').count(),persona==='reaves'?24:22);
 if(persona==='neural'){
  const missing='.missing-names [data-id="4866"]';await page.locator(missing).click();assert.match(await page.locator('#inspector-content').innerText(),/Unpriced/);await page.keyboard.press('Escape');await closedWithFocus(missing);
 }
 const paths=['/','/news','/stocks','/history','/arcade','/teams','/transactions','/draft','/intel','/table','/ai-decides','/trade-analyzer','/weekly','/team','/login'];
 for(const path of paths){const a=page.locator(`#explore a[href="https://goathoopers.com${path}"]`);assert.ok(await a.count());assert.match(await a.first().innerText(),/Current site/);}
}
await load('guest');
assert.equal(await page.locator('#players').count(),0);assert.equal(await page.locator('#primary-matchup').count(),0);
await page.locator('.guest-center .action').click();assert.equal(new URL(page.url()).hash,'#games');
report.journeys.push({persona:'guest',journey:'1. Public center → Check the league games',result:'pass; normal #games navigation; all five games visible'});
const guestClub='.club-name[data-id="8"]';await page.locator(guestClub).click();await page.waitForFunction(()=>document.querySelector('#inspector').open);assert.match(await page.locator('#inspector-content').innerText(),/previous manager/);await page.goBack();await closedWithFocus(guestClub);
report.journeys.push({persona:'guest',journey:'2. Public circuit team → context → browser Back',result:'pass; no member claim; restored team trigger'});
await page.locator('.game-row[data-matchup="m4"] button').click();await page.waitForFunction(()=>document.querySelector('#inspector').open);const guestGame=await page.locator('#inspector-content').innerText();assert.match(guestGame,/recorded zero/);assert.match(guestGame,/No leader can be determined/);assert.doesNotMatch(guestGame,/56%/);await page.keyboard.press('Escape');await closedWithFocus('.game-row[data-matchup="m4"] button');
report.journeys.push({persona:'guest',journey:'3. papichooter–NeuralNets game → unknown/zero explanation → Escape',result:'pass; no private model; restored game trigger'});
await page.locator('a[href="#demo-sources"]').click();assert.equal(await page.locator('#demo-sources').evaluate(e=>e.open),true);
await page.locator('#persona').selectOption('neural');await page.waitForSelector('html[data-personal-study-ready="11"][data-persona="neural"]');assert.equal(new URL(page.url()).searchParams.get('persona'),'neural');
report.personaSelector='pass; native Guest → NeuralNets changed URL, document dataset and member content';
for(const persona of ['reaves','neural','guest']){
 for(const width of [1440,1120]){
  await load(persona,width);const normal=await page.evaluate(()=>({main:document.querySelector('main').getBoundingClientRect().height,circuit:document.querySelector('.circuit').getBoundingClientRect().height,text:document.querySelector('main').innerText}));
  await load(persona,width,'structure');const structure=await page.evaluate(()=>({main:document.querySelector('main').getBoundingClientRect().height,circuit:document.querySelector('.circuit').getBoundingClientRect().height,text:document.querySelector('main').innerText,stage:document.documentElement.dataset.stage}));
  assert.equal(structure.stage,'structure');assert.equal(structure.main,normal.main);assert.equal(structure.circuit,normal.circuit);assert.equal(structure.text,normal.text);
  report.structure.push({persona,width,result:'pass; identical main/circuit heights and complete main text'});
 }
}
await load('reaves');await page.screenshot({path:`${dir}check-1440.png`,fullPage:true});
report.verified='pass';assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);
}catch(error){report.verified='FAIL';report.failure=String(error.stack||error);process.exitCode=1;}
finally{await browser.close();await writeFile(`${dir}verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
