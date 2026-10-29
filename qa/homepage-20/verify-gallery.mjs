import assert from 'node:assert/strict';
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const file='/workspace/GOAT-20-homepage-studies.html';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],remote=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
try{
 await p.setContent(await readFile(file,'utf8'),{waitUntil:'load'});await p.locator('#page').evaluate(async i=>i.decode());
 assert.equal(await p.locator('#choices button').count(),20);
 const entriesInfo=await p.evaluate(()=>entries.map(e=>({id:e.id,phase:e.phase,views:Object.values(e.views).map(v=>({width:v.width,height:v.height,data:v.image.slice(0,23)}))})));
 assert.equal(entriesInfo.filter(e=>e.phase==='initial').length,20);assert.equal(entriesInfo.filter(e=>e.phase==='iteration').length,3);assert.equal(entriesInfo.filter(e=>e.phase==='benchmark').length,1);assert(entriesInfo.every(e=>e.views.length===4));
 await p.selectOption('#device','phone');await p.selectOption('#view','public');await p.locator('#choices button').last().click();await p.locator('#page').evaluate(async i=>i.decode());assert.match(await p.locator('#page').getAttribute('alt'),/complete public phone/);
 await p.selectOption('#phase','iteration');assert.equal(await p.locator('#choices button').count(),3);await p.selectOption('#phase','benchmark');assert.equal(await p.locator('#choices button').count(),1);
 // Regression for review6484967994: a valid but empty round must not retain old pixels or summary.
 await p.evaluate(()=>{const o=document.createElement('option');o.value='empty-test';o.text='Empty test';document.querySelector('#phase').append(o)});await p.selectOption('#phase','empty-test');assert.equal(await p.locator('#page').getAttribute('src'),null);assert(await p.locator('#page').isHidden());assert.equal(await p.locator('#dimensions').textContent(),'');assert.match(await p.locator('#description').textContent(),/Choose another round/);
 await p.selectOption('#phase','initial');assert(await p.locator('#page').isVisible());await p.selectOption('#scale','native');assert.match(await p.locator('#page').getAttribute('class'),/native/);
 await p.setViewportSize({width:390,height:844});await p.selectOption('#scale','fit');const width=await p.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.equal(width.s,width.w);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 const bytes=await readFile(file);const result={pass:true,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,entries:entriesInfo.length,initial:20,iterations:3,benchmark:1,images:entriesInfo.reduce((n,e)=>n+e.views.length,0),emptyStateRegression:'PASS: prior image src removed, image hidden, summary/dimensions cleared; normal view restores image',offlineRequests:remote.length,pageErrors:errors,phoneWidth:width,method:'Rendered existing readable self-contained HTML bytes using Playwright setContent; no network resource requests. Managed Chromium denied file:// navigation (ERR_BLOCKED_BY_ADMINISTRATOR), so file-launch behavior was not tested.',limits:'Screenshot gallery controls only; working mock checks are recorded separately. No file:// policy was disabled or retried.'};await writeFile('qa/homepage-20/evidence/portable-gallery-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await b.close()}
