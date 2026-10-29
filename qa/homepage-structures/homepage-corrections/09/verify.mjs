import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const route = 'http://127.0.0.1:4207/qa/homepage-structures/homepage-corrections/09/';
const cases = [];
for (const view of ['member','public']) for (const width of [1440,390,320]) cases.push({view,width});
for (const view of ['member','public']) for (const width of [1440,320]) cases.push({view,width,text:200});
for (const view of ['member','public']) for (const ai of ['stale','missing']) cases.push({view,width:390,ai});
const results=[];
for (const c of cases) {
 const page=await browser.newPage({viewport:{width:c.width,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${route}?view=${c.view}&ai=${c.ai??'ready'}`);
 await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='09');
 await page.evaluate(()=>document.fonts.ready);
 if(c.text)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 const actual=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,headings:[...document.querySelectorAll('h1,h2')].map(x=>x.textContent),register:document.querySelectorAll('.register-list>li').length,pairs:document.querySelectorAll('.pair-row').length,stories:document.querySelectorAll('.story').length,personal:document.querySelectorAll('.valuation').length,internal:[...document.querySelectorAll('main *')].filter(e=>['scroll','auto'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).map(e=>e.className),broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),text:document.body.innerText}));
 let expanded=null;
 if(c.width===320){await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));expanded=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,internal:[...document.querySelectorAll('main *')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).length}));}
 const checks={expandedReflow:!expanded||(expanded.documentWidth<=expanded.width&&expanded.internal===0),noOverflow:actual.documentWidth<=actual.width,normalDocument:actual.internal.length===0,noErrors:errors.length===0,tenTeams:actual.register===10,fivePairs:actual.pairs===5,threeStories:actual.stories===3,editionBoundary:actual.personal===(c.view==='member'?1:0),scoreBoundary:actual.text.includes('0.0')&&actual.text.includes('Pending'),historicalBoundary:actual.text.includes('Verified 2025 final')&&actual.text.includes('Unpublished sample draft'),modelBoundary:c.ai==='missing'?actual.text.includes('Saved model slate unavailable')&&!actual.text.includes('Returned Ware the Hoes At?'):actual.text.includes('Returned Ware the Hoes At? 35%')&&actual.text.includes('Confidence 20%'),stale:c.ai!=='stale'||actual.text.includes('STALE outputs')};
 results.push({...c,checks,documentWidth:actual.documentWidth,height:actual.height,errors,expanded,internal:actual.internal,broken:actual.broken});
 await page.close();
}
const page=await browser.newPage({viewport:{width:390,height:900}});
await page.goto(`${route}?view=member`);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='09');await page.evaluate(()=>document.fonts.ready);
await page.keyboard.press('Tab');const skip=await page.locator(':focus').textContent();await page.keyboard.press('Enter');const skipped=await page.locator(':focus').getAttribute('id');
await page.locator('.menu>summary').focus();await page.keyboard.press('Enter');const menuOpen=await page.locator('.menu').getAttribute('open')!==null;await page.keyboard.press('Escape');const menuClosed=await page.locator('.menu').getAttribute('open')===null;const menuFocus=await page.locator(':focus').textContent();
await page.locator('#league-search').fill('Embiid');const search=await page.locator('#register').innerText();const searchCount=await page.locator('#result-count').innerText();await page.locator('#league-search').fill('no-such-player');const empty=await page.locator('#register').innerText();await page.locator('#league-search').fill('');await page.locator('#league-sort').selectOption('name');const sortFirst=await page.locator('.register-list>li .team-name>a').first().textContent();
const summary=page.locator('.pair-row .secondary>summary').first();await summary.focus();await page.keyboard.press('Enter');const sourceOpen=await page.locator('.pair-row .secondary').first().getAttribute('open')!==null;await page.keyboard.press('Escape');const sourceClosed=await page.locator('.pair-row .secondary').first().getAttribute('open')===null;const sourceFocus=await page.locator(':focus').textContent();
const focus=await page.locator(':focus').evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth,color:getComputedStyle(e).outlineColor}));
const keyboard={skip,skipped,menuOpen,menuClosed,menuFocus,searchCount,searchFound:search.includes('Joel Embiid'),emptyFound:empty.includes('No match'),sortFirst,sourceOpen,sourceClosed,sourceFocus,focus};
// Inspect only two bounded local renders; root owns four full-page final captures.
await page.goto(`${route}?view=member`);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='09');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'qa/homepage-structures/homepage-corrections/09/check-390.png',fullPage:true});
await page.setViewportSize({width:1440,height:1100});await page.goto(`${route}?view=member`);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='09');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'qa/homepage-structures/homepage-corrections/09/check-1440.png'});
await fs.writeFile('qa/homepage-structures/homepage-corrections/09/checks.json',JSON.stringify({method:'Standalone static fixture; installed Chromium, Playwright; reduced motion in 14 render cases. Root text 200% uses html.style.fontSize, distinct from viewport reflow.',results,keyboard},null,2));
console.log(JSON.stringify({cases:results.length,failed:results.filter(r=>Object.values(r.checks).some(v=>!v)),keyboard},null,2));
await browser.close();
