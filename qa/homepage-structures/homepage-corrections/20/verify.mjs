import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='qa/homepage-structures/homepage-corrections/20';
const base='http://localhost:4207/'+dir+'/index.html';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[],external=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4207/'))external.push(r.url());});
const results=[];
async function load(width,view='member',scale=1,ai='ready'){
 await page.setViewportSize({width,height:900});await page.goto(base+`?view=${view}&ai=${ai}`);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='20');
 if(scale===2)await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 const r=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,branches:document.querySelectorAll('.home-branch').length,pairs:document.querySelectorAll('.slate-list>li').length,standings:document.querySelectorAll('.branch-content .standings tbody tr').length,spotlights:document.querySelectorAll('.home-spotlight').length,bodyChars:document.querySelector('#matchbook').innerText.length,internal:[...document.querySelectorAll('main *')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).map(e=>e.className),font:document.fonts.check('16px "DM Sans"'),pixelFont:document.fonts.check('16px "Press Start 2P"')}));
 assert(r.scrollWidth<=width+1,JSON.stringify(r));assert.equal(r.branches,5);assert.equal(r.pairs,5);assert.equal(r.standings,10);assert.equal(r.spotlights,3);assert(r.bodyChars>6000);assert.equal(r.internal.length,0);assert(r.font&&r.pixelFont);
 const text=await page.locator('main').innerText();assert(text.includes('Pending is unknown'));assert(text.includes('2025 historical final'));assert(text.includes('previous manager'));assert(text.includes('Added/dropped player details are not supplied'));
 if(view==='public'){assert.equal(await page.locator('a[href="/team"]').count(),0);assert(!text.includes('$1095.25'));}
 if(ai==='missing'){assert(text.includes('Saved AI unavailable'));assert.equal(await page.locator('.home-ai .probabilities').count(),0);}else{assert(text.includes('35%'));assert(text.includes('65%'));assert(text.includes('20%'));}
 if(ai==='stale')assert(text.includes('Stale saved return'));
 results.push({width,view,scale,ai,...r});
}
try{
 for(const w of [1440,390,320])await load(w);
 for(const w of [1440,390,320])await load(w,'member',2);
 await load(390,'public');await load(320,'public',2);
 await load(390,'member',1,'stale');await load(390,'public',1,'missing');
 await load(1440);await page.screenshot({path:dir+'/native-1440.png'});
 await load(390);await page.screenshot({path:dir+'/native-390.png'});
 const opener=page.locator('#intent-players button');await opener.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.depth h2').innerText(),'Your team, before the next decision.');assert.equal(await page.locator('.home-branch').count(),5);
 const child=page.locator('.depth .choice[data-node="form"]');await child.focus();await page.keyboard.press('Enter');assert((await page.locator('.breadcrumbs').innerText()).includes('My players'));assert.equal(await page.evaluate(()=>document.activeElement.id),'step-heading');assert.equal(await page.evaluate(()=>document.body.dataset.branchMotion),'none');
 await page.locator('#back-path').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.dataset.node),'form');assert.equal(await page.evaluate(()=>document.body.dataset.studyState),'players');
 await page.locator('#back-path').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.closest('h3').id),'intent-players');assert.equal(await page.evaluate(()=>document.body.dataset.studyState),'home');
 await page.locator('#intent-compare button').focus();await page.keyboard.press('Enter');await page.goBack();assert.equal(await page.evaluate(()=>document.body.dataset.studyState),'home');assert.equal(await page.evaluate(()=>document.activeElement.closest('h3').id),'intent-compare');
 await page.locator('#intent-league button').click();await page.locator('#directory-search').fill('no-such-player');assert(await page.locator('#directory-empty').isVisible());await page.locator('#clear-search').click();assert.equal(await page.locator('#team-list>li').count(),10);await page.locator('#directory-search').fill('sengun');assert.equal(await page.locator('#team-list>li').count(),1);assert((await page.locator('#team-list').innerText()).includes('Şengün'));await page.locator('#team-sort').selectOption('name');await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='20');assert.equal(await page.locator('#directory-search').inputValue(),'sengun');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#intent-read button').click();assert.equal(await page.evaluate(()=>document.body.dataset.branchMotion),'none');assert.equal(await page.locator('.home-branch').count(),5);assert.equal(await page.locator('.depth .editorial').count(),2);assert.equal(await page.locator('.depth .spotlight').count(),3);
 const deepOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!deepOverflow);
 await page.locator('#open-index').click();assert(await page.locator('#destination-index').isVisible());await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'open-index');
 await page.locator('#show-provenance').click();assert(await page.locator('#provenance-body').isVisible());assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#provenance-body')).position),'static');await page.keyboard.press('Escape');
 const loaded=await page.locator('main img').evaluateAll(imgs=>imgs.every(i=>!i.complete||i.naturalWidth>0));assert(loaded);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 const report={status:'passed',cases:results,keyboard:'Enter: home→players→form; in-page Back twice and browser Back restored exact opener focus. Ancestry and immediate keyboard state passed.',directory:'search, empty, clear, accent normalization, sort and URL reload passed',editions:'member/public and ready/stale/missing; two archive samples with publication/period labels',reducedMotion:'retained all five home branches and dated depth',provenance:'normal document flow; Escape returns focus',screenshots:['native-1440.png','native-390.png'],errors,external,limits:'Local static Chromium fixture; no production route/auth, physical device, Safari or screen reader testing. Root owns full-page captures.'};
 await writeFile(dir+'/checks.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
