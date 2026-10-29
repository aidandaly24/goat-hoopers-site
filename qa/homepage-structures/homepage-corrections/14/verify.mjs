import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:4207/qa/homepage-structures/homepage-corrections/14/index.html';
const results=[];const errors=[];
async function open(view,width,text=100,ai='ready'){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}?view=${view}&ai=${ai}`);
 await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='14');
 if(text===200)await page.addStyleTag({content:'html { font-size:200% !important; }'});
 return page;
}
for(const view of ['member','public'])for(const width of [1440,390,320])for(const text of [100,200]){
 const page=await open(view,width,text);
 const result=await page.evaluate(()=>({
  viewport:innerWidth,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
  channels:[...document.querySelectorAll('.channel')].map(el=>({id:el.dataset.channel,visible:getComputedStyle(el).display!=='none',overflow:getComputedStyle(el).overflowY,client:el.clientHeight,scroll:el.scrollHeight})),
  pairs:document.querySelectorAll('.ai-pair').length,teams:document.querySelectorAll('.club-line').length,stories:document.querySelectorAll('.story').length,archives:document.querySelectorAll('.archive-story').length,
  private:!!document.querySelector('#team-value'),
  fonts:[document.fonts.check('16px "Dispatch Sans"'),document.fonts.check('16px "Dispatch Archivo"')],
  missingImages:[...document.images].filter(im=>!im.complete||im.naturalWidth===0).map(im=>im.src),
  overflow:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1||el.getBoundingClientRect().left< -1).slice(0,6).map(el=>el.tagName+'.'+el.className)
 }));
 if(result.width!==width||result.overflow.length||result.channels.some(c=>!c.visible||['auto','scroll'].includes(c.overflow))||result.pairs!==5||result.teams!==10||result.stories!==3||result.archives!==2||result.private!==(view==='member'))throw new Error(JSON.stringify({view,width,text,result}));
 results.push({view,width,text,...result});
 if(view==='member'&&text===100&&width===1440)await page.screenshot({path:'/tmp/only14-desktop.png'});
 if(view==='member'&&text===100&&width===390)await page.screenshot({path:'/tmp/only14-phone.png'});
 await page.close();
}
for(const ai of ['stale','missing']){
 const page=await open('member',390,200,ai);
 const result=await page.evaluate(()=>({width:document.documentElement.scrollWidth,stale:[...document.querySelectorAll('.ai-pair .eyebrow')].filter(el=>el.textContent==='Stale saved pick').length,missing:[...document.querySelectorAll('.ai-pair .eyebrow')].filter(el=>el.textContent==='Saved pick unavailable').length,choices:document.querySelectorAll('.picked').length}));
 if(result.width!==390||result[ai]!==5||(ai==='missing'&&result.choices!==0))throw new Error(JSON.stringify({ai,result}));
 results.push({ai,...result});await page.close();
}
// A real keyboard relationship and return: focus source, Enter, Tab to return, Enter.
const page=await open('member',390);
const source=page.locator('#current-pair [data-cross]');
await source.focus();await source.scrollIntoViewIfNeeded();
const before=await page.evaluate(()=>({y:scrollY,text:document.activeElement.textContent}));
await page.keyboard.press('Enter');
const arrived=await page.evaluate(()=>({id:document.activeElement.id,y:scrollY,return:!!document.querySelector('.return-path'),animations:document.getAnimations().length}));
if(arrived.id!=='ai-0'||!arrived.return||arrived.animations!==0)throw new Error('Keyboard passage failed '+JSON.stringify(arrived));
await page.keyboard.press('Tab');
if(!(await page.locator('[data-return]').evaluate(el=>el===document.activeElement)))throw new Error('Return is not next keyboard control');
await page.keyboard.press('Enter');
const returned=await page.evaluate(()=>({y:scrollY,text:document.activeElement.textContent}));
if(Math.abs(returned.y-before.y)>1||returned.text!==before.text)throw new Error('Return failed '+JSON.stringify({before,returned}));
await page.locator('#route-toggle').focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');
const menu=await page.locator('#route-toggle').evaluate(el=>({closed:el.getAttribute('aria-expanded')==='false',focus:el===document.activeElement}));
if(!menu.closed||!menu.focus)throw new Error('Menu Escape failed');
// Open every secondary disclosure together at the narrow/enlarged extreme.
await page.setViewportSize({width:320,height:900});await page.addStyleTag({content:'html { font-size:200% !important; }'});
await page.evaluate(()=>document.querySelectorAll('details').forEach(el=>el.open=true));
const expanded=await page.evaluate(()=>({width:document.documentElement.scrollWidth,details:document.querySelectorAll('details[open]').length,values:document.querySelectorAll('.roster-values li').length}));
if(expanded.width!==320||expanded.values!==24)throw new Error('Expanded overflow '+JSON.stringify(expanded));
results.push({keyboard:{before,arrived,returned,menu},expanded});await page.close();
await fs.writeFile(new URL('./checks.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),base,results,errors},null,2));
await browser.close();if(errors.length)throw new Error(errors.join('\n'));
console.log(JSON.stringify({passed:results.length,errors},null,2));
