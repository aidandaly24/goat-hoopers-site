import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
assert.ok(process.argv[2] && process.argv[3], 'Pass installed Playwright entrypoint and Chrome executable.');
const { chromium } = await import(pathToFileURL(process.argv[2]));
const repo=process.cwd();
const output=repo+'/qa/teams/evidence';
const origin='http://127.0.0.1:8796';
const profile=await mkdtemp(tmpdir()+'/goat-hoopers-teams-native-zoom-');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','qa/teams/vite.config.mts','--configLoader','runner'],{cwd:repo,env:{PATH:process.execPath.slice(0,process.execPath.lastIndexOf('/'))+':/usr/bin:/bin',NODE_ENV:'development'},stdio:'ignore'});
let context;
const receipt={zoomMethod:'Chrome Page zoom setting in a fresh task-owned profile',checks:[],errors:[],requests:[]};
try {
 for(let i=0;i<40;i++){try{await fetch(origin);break;}catch{if(i===39)throw Error('Fixture server failed');await new Promise(r=>setTimeout(r,100));}}
 context=await chromium.launchPersistentContext(profile,{executablePath:process.argv[3],headless:true,viewport:null,args:['--window-size=1440,900','--disable-webgl']});
 const page=context.pages()[0];
 await context.route('**/*',route=>{const request=route.request();if(new URL(request.url()).origin===origin&&request.method()==='GET')return route.continue();receipt.requests.push(request.url());return route.abort();});
 page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('chrome://settings/appearance',{waitUntil:'domcontentloaded'});
 const zoom=page.getByRole('combobox',{name:/Page zoom/i});
 await zoom.waitFor({timeout:20000});
 const options=await zoom.locator('option').allTextContents();
 console.log('Visible Chrome zoom options:',JSON.stringify(options));
 await zoom.selectOption({label:'200%'});
 const selected=await zoom.locator('option:checked').textContent();assert.equal(selected.trim(),'200%');
 const cdp=await context.newCDPSession(page);
 const {windowId}=await cdp.send('Browser.getWindowForTarget');
 for(const requestedWidth of [1440,768,640,390,320]) {
  await cdp.send('Browser.setWindowBounds',{windowId,bounds:{width:requestedWidth,height:900}});
  await page.goto(origin+'/teams?variant=after&state=populated',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>({requestedCSSWidth:innerWidth,outerWidth,devicePixelRatio,scroll:document.documentElement.scrollWidth,rootFont:getComputedStyle(document.documentElement).fontSize,visualScale:visualViewport.scale,bodyZoom:getComputedStyle(document.body).zoom}));
  assert.equal(metrics.devicePixelRatio,2);assert.equal(metrics.rootFont,'16px');assert.equal(metrics.bodyZoom,'1');assert.equal(metrics.visualScale,1);
  assert.ok(metrics.scroll<=metrics.requestedCSSWidth);
  const rows=await page.locator('main li > a').evaluateAll(elements=>elements.map(el=>({href:el.getAttribute('href'),name:el.getAttribute('aria-label'),manager:el.children[1].children[1].textContent,identity:el.children[1].children[0].children[1].getBoundingClientRect().width,values:[...el.querySelectorAll('dd')].map(dd=>{const range=document.createRange();range.selectNodeContents(dd);return {text:dd.textContent,lines:range.getClientRects().length};})})));
  assert.equal(rows.length,10);for(const row of rows){assert.ok(row.identity>=32);for(const value of row.values)assert.equal(value.lines,1);}
  const afterShot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false});
  await writeFile(output+'/'+requestedWidth+'-native-200-after-viewport.png',Buffer.from(afterShot.data,'base64'));
  const first=page.locator('main li > a').first();
  await first.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('main li > a')).backgroundColor === 'rgb(235, 238, 240)', undefined, {timeout:2000});
  const hover=await first.evaluate(el=>({transform:getComputedStyle(el).transform,shadow:getComputedStyle(el).boxShadow,background:getComputedStyle(el).backgroundColor}));
  assert.equal(hover.transform,'none');assert.equal(hover.shadow,'none');assert.equal(hover.background,'rgb(235, 238, 240)');
  await page.goto(origin+'/teams?variant=before&state=populated',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  const before=await page.locator('main li > a').evaluateAll(elements=>elements.map(el=>({href:el.getAttribute('href'),name:el.getAttribute('aria-label'),manager:el.children[1].children[1].textContent,values:[...el.querySelectorAll('dd')].map(dd=>dd.textContent)})));
  assert.deepEqual(before,rows.map(row=>({href:row.href,name:row.name,manager:row.manager,values:row.values.map(v=>v.text)})));
  const beforeShot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false});
  await writeFile(output+'/'+requestedWidth+'-native-200-before-viewport.png',Buffer.from(beforeShot.data,'base64'));
  receipt.checks.push({requestedWidth,metrics,rows,hover});console.log(JSON.stringify({requestedWidth,metrics,identityWidth:rows[0].identity,hover}));
 }
 assert.deepEqual(receipt.requests,[]);assert.deepEqual(receipt.errors,[]);
}finally{await context?.close();server.kill('SIGTERM');await rm(profile,{recursive:true,force:true});await writeFile(output+'/native-zoom-receipt.json',JSON.stringify(receipt,null,2));}
