import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base='http://localhost:4207/qa/homepage-structures/homepage-corrections/17/';
const results={cases:[],interactions:[],errors:[]};
const check=(name,pass,detail)=>{results.interactions.push({name,pass,detail});if(!pass)results.errors.push(name);};
for(const view of ['member','public'])for(const width of [1440,390,320])for(const text of [100,200]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4207/'))errors.push(`External request: ${r.url()}`);});
 await page.goto(`${base}?view=${view}`);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='17');await page.evaluate(async()=>{await document.fonts.ready;});
 if(text===200)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 const metrics=await page.evaluate(()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,heads:[...document.querySelectorAll('main h2')].filter(e=>e.getClientRects().length).map(e=>e.textContent),internalScroll:[...document.querySelectorAll('main *')].filter(e=>/(auto|scroll)/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+2).map(e=>e.id||e.className),offenders:[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+2).slice(0,10).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,60)})),pairCount:document.querySelectorAll('#matchups .record-row').length,teamCount:document.querySelectorAll('#sheet .record-row').length,personal:!!document.querySelector('#member:not([hidden]) h2'),body:document.body.innerText,fonts:[document.fonts.check('16px "Ledger Records"'),document.fonts.check('16px "Ledger Identity"')]}));
 const pass=metrics.docWidth<=width&&metrics.internalScroll.length===0&&metrics.pairCount===5&&metrics.teamCount===10&&metrics.personal===(view==='member')&&errors.length===0&&metrics.fonts.every(Boolean);
 results.cases.push({view,width,text,pass,...metrics,body:undefined,errors});
 if(!pass)results.errors.push(`${view}/${width}/${text}`);
 if(view==='member'&&text===100&&width!==320)await page.screenshot({path:new URL(`check-${width}.png`,import.meta.url).pathname});
 check(`${view}/${width}/${text} dated and score truth`,metrics.body.includes('0.0 / Pending')&&metrics.body.includes('Oct 5–11, 2026')&&metrics.body.includes('2025–26 college · BYU')&&metrics.body.includes('326.0–251.5')&&metrics.body.includes('previous manager')&&metrics.body.includes('Player identities unavailable.'),null);
 await page.close();
}
// One actual keyboard path through the phone selector, search, row reader and disclosures.
const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(base);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='17');
await page.locator('#category-select').focus();await page.keyboard.press('ArrowDown');
check('Keyboard sheet jump retains all home sections',await page.locator('#category-select').inputValue()==='member'&&await page.locator('#matchups .record-row').count()===5&&await page.locator('#editorial .editorial-pick').count()===3,await page.evaluate(()=>({active:document.activeElement.id,scroll:scrollY})));
await page.locator('#search').fill('Embiid');
check('Full roster search opens matching reader',await page.locator('#sheet .record-row').count()===1&&await page.locator('#detail-team-1').count()===1&&await page.locator('#detail-team-1 .mini-table tbody tr').count()===24,null);
await page.locator('[data-toggle="team-1"][data-kind="roster"]').focus();await page.keyboard.press('Enter');
check('Keyboard row toggle closes',await page.locator('#detail-team-1').count()===0,null);
await page.keyboard.press('Enter');await page.locator('#detail-team-1 .mini-table a').last().focus();await page.keyboard.press('Escape');
check('Deep Escape closes and restores visible trigger',await page.locator('#detail-team-1').count()===0&&await page.evaluate(()=>document.activeElement.dataset.toggle==='team-1'&&document.activeElement.getBoundingClientRect().top>=0&&document.activeElement.getBoundingClientRect().bottom<=innerHeight),null);
await page.locator('#clear').click();await page.locator('#fields').selectOption('week');
check('Extra fields retain core record and PF',await page.locator('#team-1 .field-standings').first().isVisible()&&await page.locator('#team-1 .field-standings').nth(1).isVisible()&&await page.locator('#team-1 .field-week').isVisible(),null);
await page.locator('#sort').selectOption('name');
check('Name sorting works',await page.locator('#sheet .record-row').first().getAttribute('id')==='team-6',null);
await page.locator('#recap-record summary').focus();await page.keyboard.press('Enter');
check('Completed-week disclosure renders metric and coverage',await page.locator('#recap-record').getAttribute('open')!==null&&(await page.locator('#recap-record').innerText()).includes('5 current roster players have verified games.'),null);
await page.keyboard.press('Escape');check('Native recap Escape returns summary',await page.locator('#recap-record').getAttribute('open')===null&&await page.evaluate(()=>document.activeElement===document.querySelector('#recap-record summary')),null);
check('Returned choice preserves 35% versus 65% and independent 20%',(await page.locator('#matchups .record-row').first().innerText()).includes('Ware the Hoes At?')&&(await page.locator('#matchups .record-row').first().innerText()).includes('35%')&&(await page.locator('#matchups .record-row').first().innerText()).includes('65%')&&(await page.locator('#matchups .record-row').first().innerText()).includes('20% confidence'),null);
await page.locator('#archive-record summary').focus();await page.keyboard.press('Enter');
check('Archive disclosure contains both editions and four happenings',await page.locator('#archive-record .disclosure-content article').count()===2&&(await page.locator('#archive-record').innerText()).includes('Roster 8 changed hands after a 1–20 season'),null);
await page.keyboard.press('Escape');
await page.locator('.site-navigation summary').focus();await page.keyboard.press('Enter');check('Phone menu opens with keyboard',await page.locator('.site-navigation').getAttribute('open')!==null,null);await page.keyboard.press('Escape');check('Phone menu Escape restores summary',await page.locator('.site-navigation').getAttribute('open')===null&&await page.evaluate(()=>document.activeElement===document.querySelector('.site-navigation summary')),null);
for(const ai of ['stale','missing']){
 await page.goto(`${base}?view=public&ai=${ai}`);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='17');
 const text=await page.locator('#matchups').innerText();check(`${ai} visible state and public omission`,ai==='stale'?text.includes('Stale saved pick'):text.includes('No saved model result')&&await page.locator('#matchups .bar').count()===0, null);
 await page.locator('[data-toggle="pair-1"]').focus();await page.keyboard.press('Enter');
 check(`${ai} receipt truth`,(await page.locator('#detail-pair-1').innerText()).includes(ai==='stale'?'Stale saved result':'Saved AI unavailable'),null);
 check(`${ai} public has no personal value`,!(await page.locator('body').innerText()).includes('$1095.25'),null);
}
await page.goto(base);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='17');await page.setViewportSize({width:320,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.locator('[data-toggle="team-1"][data-kind="roster"]').click();await page.locator('#recap-record summary').click();await page.locator('#archive-record summary').click();check('320 / root 200% expanded readers remain within document',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),null);
await page.close();await browser.close();
await writeFile(new URL('checks.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify({cases:results.cases.length,interactions:results.interactions.length,errors:results.errors,failedCases:results.cases.filter(x=>!x.pass)},null,2));
