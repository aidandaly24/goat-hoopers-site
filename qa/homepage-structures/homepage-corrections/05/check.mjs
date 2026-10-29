import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>requests.push(r.url()));
const base='http://localhost:4207/qa/homepage-structures/homepage-corrections/05/';
const checks=[];
for(const width of [1440,390,320])for(const view of ['member','public'])for(const ai of ['ready','stale','missing'])for(const text of [100,200]){
  await page.setViewportSize({width,height:900});await page.goto(`${base}?view=${view}&ai=${ai}`);await page.waitForFunction(()=>document.body.dataset.homepageReady==='05');
  await page.evaluate(size=>document.documentElement.style.fontSize=size+'%',text);
  const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,sections:document.querySelectorAll('.homepage>section').length,teams:document.querySelectorAll('.home-teams>li').length,pairs:document.querySelectorAll('.slate-pairs>li').length,stories:document.querySelectorAll('.lead-story,.supporting-stories article').length,readers:[...document.querySelectorAll('main,main *,.provenance>div')].filter(x=>{const s=getComputedStyle(x);return /auto|scroll/.test(s.overflowY)&&x.scrollHeight>x.clientHeight+1}).map(x=>x.className||x.id),personal:!!document.querySelector('.total-fact'),returned:!!document.querySelector('.returned'),overflow:[...document.querySelectorAll('body *')].filter(x=>x.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(x=>({tag:x.tagName,cl:x.className,right:Math.round(x.getBoundingClientRect().right)}))}));
  checks.push({width,view,ai,text,...state});
}
await page.setViewportSize({width:1440,height:1000});await page.goto(base);await page.waitForFunction(()=>document.body.dataset.homepageReady==='05');await page.screenshot({path:'/tmp/goat-05-desktop.png'});
await page.setViewportSize({width:390,height:844});await page.goto(base);await page.waitForFunction(()=>document.body.dataset.homepageReady==='05');await page.screenshot({path:'/tmp/goat-05-phone.png'});
const result={checks,errors,requests};await fs.writeFile(new URL('./checks.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({runs:checks.length,failures:checks.filter(x=>x.scrollWidth>x.width||x.readers.length),errors,requests},null,2));await browser.close();
