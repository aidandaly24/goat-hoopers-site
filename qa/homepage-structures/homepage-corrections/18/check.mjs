import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:4207/qa/homepage-structures/homepage-corrections/18/index.html';
const dir=new URL('.',import.meta.url);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results={date:'2026-10-29',method:'Local static fixture / installed Chromium and Playwright',cases:[],keyboard:{},errors:[]};
const context=await browser.newContext({reducedMotion:'reduce'});
const page=await context.newPage();
page.on('pageerror',e=>results.errors.push(e.message));
page.on('requestfailed',r=>results.errors.push(r.url()+': '+r.failure()?.errorText));
const inspect=()=>page.evaluate(()=>{
  const internal=[...document.querySelectorAll('main *')].filter(el=>{const s=getComputedStyle(el);return ['auto','scroll'].includes(s.overflowY)&&el.scrollHeight>el.clientHeight+1;}).map(el=>el.id||el.className);
  const overflow=[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&getComputedStyle(el).position!=='absolute';}).map(el=>el.id||el.className).slice(0,8);
  return {width:innerWidth,rootFont:getComputedStyle(document.documentElement).fontSize,documentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,internal,overflow,member:document.querySelectorAll('[data-member-content]').length,cohort:document.querySelectorAll('.cohort').length,standings:document.querySelectorAll('.standing-row').length,pairings:document.querySelectorAll('.slate-row').length+1,editorial:document.querySelectorAll('.editorial-take').length,archives:document.querySelectorAll('.archive-entry').length,portraits:[...document.images].map(x=>({src:x.getAttribute('src'),ok:x.complete&&x.naturalWidth>0})),fonts:[document.fonts.check('16px "DM Sans"'),document.fonts.check('16px "Space Grotesk"')],animations:document.getAnimations().length};
});
for(const view of ['member','public'])for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  await page.goto(base+'?view='+view);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='18');
  await page.locator('#editorial-title').scrollIntoViewIfNeeded();await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.evaluate(()=>scrollTo(0,0));
  results.cases.push({view,scale:1,...await inspect()});
  if(view==='member'&&(width===1440||width===390))await page.screenshot({path:new URL('checkpoint-'+width+'.png',dir).pathname});
  await page.evaluate(()=>document.documentElement.style.fontSize='32px');await page.waitForFunction(()=>document.body.classList.contains('large-text'));
  results.cases.push({view,scale:2,...await inspect()});
}
await page.setViewportSize({width:390,height:844});
await page.goto(base+'?view=member');await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='18');
await page.locator('#pin-chooser>summary').focus();await page.keyboard.press('Enter');
await page.keyboard.press('Tab');await page.keyboard.type('Dybantsa');
await page.keyboard.press('Tab');await page.keyboard.press('Home');
await page.keyboard.press('Tab');await page.keyboard.press('Enter');
results.keyboard.pin=await page.locator('#comparison-table thead [data-column]').count()===3&&await page.locator('#comparison-table thead [data-column="4866"]').count()===1;
results.keyboard.pinFocus=await page.evaluate(()=>document.activeElement.parentElement.id);
await page.locator('#follow-pins').focus();await page.keyboard.press('Enter');
results.keyboard.follow=await page.evaluate(()=>({context:document.body.dataset.comparisonContext,focus:document.activeElement.id,teams:[...document.querySelectorAll('#comparison-table thead [data-column]')].map(x=>x.dataset.column)}));
await page.locator('#edition-link').focus();const depart=await page.evaluate(()=>({y:scrollY,columns:[...document.querySelectorAll('#comparison-table thead [data-column]')].map(x=>x.dataset.column)}));await page.keyboard.press('Enter');await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='18');
results.keyboard.publicNoMember=await page.locator('[data-member-content]').count()===0;
await page.goBack();await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='18');
results.keyboard.return=await page.evaluate(()=>({focus:document.activeElement.id,y:scrollY,context:document.body.dataset.comparisonContext,columns:[...document.querySelectorAll('#comparison-table thead [data-column]')].map(x=>x.dataset.column)}));results.keyboard.departure=depart;
for(const state of ['stale','missing']){
  await page.goto(base+'?view=public&ai='+state);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='18');
  results.cases.push({view:'public',ai:state,...await inspect(),stateText:await page.locator('.model-note').innerText()});
}
// The long-name and maximum-pin view is a focused reflow check, not another capture run.
await page.goto(base+'?view=public');await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='18');
await page.setViewportSize({width:320,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='32px');
for(const query of ['Niederhäuser']){await page.locator('#pin-chooser>summary').click();await page.locator('#identity-search').fill(query);await page.locator('#pin-button').click();}
results.longName={...await inspect(),found:await page.locator('#comparison-table').innerText().then(t=>t.includes('Yanic Konan Niederhäuser'))};
await writeFile(new URL('checks.json',dir),JSON.stringify(results,null,2));
await browser.close();
console.log(JSON.stringify({cases:results.cases.length,errors:results.errors,failures:results.cases.filter(x=>x.documentWidth>x.width||x.internal.length||x.overflow.length),keyboard:results.keyboard,longName:results.longName},null,2));
