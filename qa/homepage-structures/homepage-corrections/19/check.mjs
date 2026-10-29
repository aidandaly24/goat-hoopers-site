import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const base='http://localhost:4207/qa/homepage-structures/homepage-corrections/19/index.html';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const errors=[],badResponses=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)badResponses.push(r.url()+':'+r.status())});
const results={route:base,checks:[],errors,badResponses};
async function load(mode='member',width=1440,extra=''){
 await page.setViewportSize({width,height:1000});await page.goto(`${base}?view=${mode}${extra}`);await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='19');await page.evaluate(()=>document.fonts.ready);
}
async function geometry(label){const g=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,primaryScroll:[...document.querySelectorAll('main *')].filter(e=>{const s=getComputedStyle(e);return /(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+1}).map(e=>e.className),visibleStories:[...document.querySelectorAll('.home-story')].filter(e=>e.checkVisibility()).length,visibleStandings:[...document.querySelectorAll('.league-order tbody tr')].filter(e=>e.checkVisibility()).length,directoryOpen:document.querySelector('#directory-details')?.open,member:!!document.querySelector('.member-spread'),portraitCollision:[...document.querySelectorAll('.cover-portrait')].some(img=>{const a=img.getBoundingClientRect(),b=img.parentElement.querySelector('.cover-club-facts').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}),endingBeforeSearch:document.querySelector('.home-ending')?.compareDocumentPosition(document.querySelector('.directory-section'))===4}));results.checks.push({label,...g});if(g.doc>g.width+1||g.primaryScroll.length||g.portraitCollision)throw Error(label+' geometry '+JSON.stringify(g));return g}
for(const mode of ['member','public']){
 for(const width of [1440,390,320]){await load(mode,width);await geometry(`${mode}-${width}`);if(width===1440||width===390)await page.screenshot({path:`/tmp/goat19-${mode}-${width}-opening.png`});}
}
for(const width of [1440,390,320]){await load('member',width);await page.evaluate(()=>document.documentElement.style.fontSize='200%');await geometry(`member-${width}-root200`);if(width===320)await page.screenshot({path:'/tmp/goat19-320-root200.png'});}
// Real keyboard directory → query → roster → Escape; all controls use native keys.
await load('member',390);
await page.locator('#directory-details>summary').focus();await page.keyboard.press('Enter');await page.locator('#roster-search').focus();await page.keyboard.type('Lillard');
await page.locator('#team-sort').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
const before=await page.locator('#result-count').innerText();await page.locator('.hits button').focus();const originY=await page.evaluate(()=>scrollY);await page.keyboard.press('Enter');
await page.waitForSelector('.dossier h2');const rosterCount=await page.locator('.roster-row').count();if(rosterCount!==24)throw Error('roster count '+rosterCount);
await geometry('keyboard-open-roster');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.dossier'));const returned=await page.evaluate(()=>({q:document.querySelector('#roster-search').value,sort:document.querySelector('#team-sort').value,focus:document.activeElement?.outerHTML,scrollY}));
if(returned.q!=='Lillard')throw Error('query not restored');results.keyboard={before,rosterCount,originY,returned};
// Home identity opening returns to the original home button and closes optional directory.
await load('member',1440);await page.locator('#cover-team-1').focus();await page.keyboard.press('Enter');await page.waitForSelector('.dossier h2');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.dossier'));results.homeReturn=await page.evaluate(()=>({focus:document.activeElement.id,open:document.querySelector('#directory-details').open,scrollY}));
if(results.homeReturn.focus!=='cover-team-1'||results.homeReturn.open)throw Error('home return');
// Required missing/stale and dated edition boundaries.
for(const ai of ['missing','stale']){await load('public',320,'&ai='+ai);await geometry('public-320-'+ai);const cover=await page.locator('.cover-ai').innerText();if(ai==='missing'&&await page.locator('.cover-ai .ai-pick').count())throw Error('fabricated AI');results.checks.push({label:'AI '+ai,cover});}
await load('member',390);await page.locator('.home-archive [data-edition="1"]').focus();await page.keyboard.press('Enter');await page.waitForSelector('.edition');results.edition={text:await page.locator('.edition').innerText(),url:page.url()};if(!results.edition.text.includes('326.0 / 251.5')||!results.edition.text.includes('A rebuild to follow'))throw Error('historical edition');await page.goBack();await page.waitForSelector('.home-ending');
await page.emulateMedia({reducedMotion:'reduce'});results.reducedMotion={homeVisible:await page.locator('.yearbook-cover').isVisible(),stories:await page.locator('.home-story').count(),animations:await page.evaluate(()=>document.getAnimations().length)};
results.fonts=await page.evaluate(()=>({identity:document.fonts.check('16px "Yearbook Identity"'),entry:document.fonts.check('16px "Yearbook Entry"')}));
await fs.writeFile(new URL('./CHECKS.json',import.meta.url),JSON.stringify(results,null,2)+'\n');await browser.close();console.log(JSON.stringify(results,null,2));
