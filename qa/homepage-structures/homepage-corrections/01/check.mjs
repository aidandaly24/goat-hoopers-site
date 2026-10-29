import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const dir = '/workspace/goat-homepage-structures/qa/homepage-structures/homepage-corrections/01';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results = [];
const errors = [];
const page = await browser.newPage();
page.on('pageerror',e=>errors.push(e.message));
const base='http://localhost:4207/qa/homepage-structures/homepage-corrections/01/index.html';
for(const view of ['member','public']) {
  for(const width of [1440,390,320]) {
    for(const scale of [100,200]) {
      await page.setViewportSize({width,height:900});
      await page.goto(`${base}?view=${view}`);
      await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='01');
      await page.evaluate(()=>document.fonts.ready);
      if(scale===200) await page.addStyleTag({content:'html {font-size:200% !important}'});
      const r = await page.evaluate(()=>({width:innerWidth,root:getComputedStyle(document.documentElement).fontSize,overflow:document.documentElement.scrollWidth>innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.body.scrollHeight,headings:[...document.querySelectorAll('main h2')].map(e=>e.textContent),internalReaders:[...document.querySelectorAll('main *')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY) && e.scrollHeight>e.clientHeight+1).map(e=>e.className),personal:!!document.querySelector('#your-page'),slate:document.querySelectorAll('[data-matchup]').length,clubs:document.querySelectorAll('.standings tbody tr').length,details:document.querySelectorAll('details').length}));
      results.push({view,width,scale,...r});
      if(scale===100 && (width===1440 || width===390) && view==='member') await page.screenshot({path:`${dir}/check-${width}.png`,fullPage:false});
    }
  }
}
for(const ai of ['stale','missing']) {
  await page.setViewportSize({width:390,height:900});
  await page.goto(`${base}?view=member&ai=${ai}`);
  await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='01');
  results.push({ai,...await page.evaluate(()=>({message:document.querySelector('.slate > .annotation').textContent,slate:document.querySelectorAll('[data-matchup]').length,modelDetails:document.querySelectorAll('[id^="pick-"]').length,overflow:document.documentElement.scrollWidth>innerWidth}))});
}
await page.goto(`${base}?view=member`);
await page.setViewportSize({width:390,height:900});
await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='01');
await page.locator('#pick-0 > summary').focus();
await page.keyboard.press('Enter');
const keyboard = await page.evaluate(()=>({opened:document.querySelector('#pick-0').open,focused:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineColor,pick:document.querySelector('#pick-0').textContent}));
await page.keyboard.press('Enter');
keyboard.closed = !(await page.locator('#pick-0').evaluate(e=>e.open));
await page.locator('.contents a[href="#clubs"]').focus();
await page.keyboard.press('Enter');
keyboard.anchor = await page.evaluate(()=>({hash:location.hash,targetTop:document.querySelector('#clubs').getBoundingClientRect().top}));
for(const width of [320,390]) {
  await page.setViewportSize({width,height:900});
  await page.addStyleTag({content:'html {font-size:200% !important}'});
  await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
  results.push({expanded:true,width,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,scrollWidth:document.documentElement.scrollWidth,readers:[...document.querySelectorAll('main *')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY) && e.scrollHeight>e.clientHeight+1).length}))});
}
await page.emulateMedia({reducedMotion:'reduce'});
results.push({reducedMotion:await page.evaluate(()=>({animations:document.getAnimations().length,essentialSections:[...document.querySelectorAll('main > section')].filter(e=>getComputedStyle(e).display==='none').length}))});
const report = {checkedAt:new Date().toISOString(),method:'Local static fixture, headless Chromium, root text enlargement via html font-size:200%; not browser zoom or physical-device evidence.',results,keyboard,errors};
await fs.writeFile(`${dir}/CHECKS.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({errors,overflow:results.filter(r=>r.overflow),readers:results.filter(r=>r.internalReaders?.length || r.readers),sizes:results.filter(r=>r.scale).map(r=>({view:r.view,width:r.width,scale:r.scale,height:r.height})),keyboard,states:results.filter(r=>r.ai)},null,2));
await browser.close();
