import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base='http://localhost:4207/qa/homepage-structures/homepage-corrections/10/';
const results=[];
for(const c of [
 {width:1440,view:'member'}, {width:390,view:'member'}, {width:320,view:'member'},
 {width:1440,view:'member',text:200}, {width:1440,view:'public'}, {width:390,view:'public'},
 {width:1440,view:'member',ai:'stale'}, {width:390,view:'public',ai:'missing'}
]){
 const page=await browser.newPage({viewport:{width:c.width,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://localhost'))errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(`${base}?view=${c.view}&ai=${c.ai||'ready'}`);
 await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='10');
 await page.evaluate(()=>document.fonts.ready);
 if(c.text)await page.addStyleTag({content:':root{font-size:32px!important}'});
 const layout=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>innerWidth,
  width:innerWidth,document:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
  primaryInnerScroll:[...document.querySelectorAll('main *')].filter(e=>getComputedStyle(e).overflowY==='auto'&&e.scrollHeight>e.clientHeight+1).map(e=>e.className),
  h1:document.querySelector('h1').textContent,
  openSections:['.featured-pair','.quote-tape','.league-board','.exchange-section','.form-guide','.week-slate','.dated-desk','.ending'].every(s=>!!document.querySelector(s)&&document.querySelector(s).getBoundingClientRect().height>0),
  closedDetails:[...document.querySelectorAll('details:not([open])')].length,
  memberOnly:!!document.querySelector('.headline-value')&&document.querySelector('.market-desk').textContent.includes('1/10'),
  ready:document.documentElement.dataset.homepageReady
 }));
 results.push({...c,...layout,errors});
 if(c.width===390&&c.view==='member'&&!c.ai){
  await page.locator('[data-add="2133"][data-to="a"]').focus();await page.keyboard.press('Enter');
  const added=await page.locator('[aria-label="Package A"] .package-total').textContent();
  await page.locator('[data-move="2133"]').focus();await page.keyboard.press('Enter');
  const moved=await page.locator('[aria-label="Package B"] .package-total').textContent();
  await page.locator('[data-pin="league"]').focus();await page.keyboard.press('Enter');
  await page.locator('[data-reveal="league"]').focus();await page.keyboard.press('Enter');
  const reference=await page.evaluate(()=>({active:document.activeElement.id,top:document.activeElement.getBoundingClientRect().top}));
  await page.goBack();
  const back=await page.locator('[aria-label="Package B"] .package-total').textContent();
  await page.locator('#source-team').selectOption('all');
  await page.locator('#player-search').fill('Kyrie Irving');
  await page.locator('[data-add="1054"][data-to="b"]').focus();await page.keyboard.press('Enter');
  const partial=await page.locator('[aria-label="Package B"] .package-coverage').textContent();
  await page.locator('.destinations summary').focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');
  const escape=await page.evaluate(()=>({open:document.querySelector('.destinations').open,focus:document.activeElement.textContent}));
  results.push({interaction:'390 keyboard add/move/retain/reference/Back/unpriced/Escape',added,moved,reference,back,partial,escape});
 }
 await page.close();
}
await browser.close();await writeFile(new URL('./checks.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
