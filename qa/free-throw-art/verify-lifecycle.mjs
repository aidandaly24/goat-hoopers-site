// P1/P2 regressions against the actual React controller, native requests,
// IntersectionObserver, WebGL submissions and context loss. No game-state mock.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const out=path.resolve(process.argv[4]);await mkdir(out,{recursive:true});
const origin='http://127.0.0.1:8799';
const manifest=await readFile(new URL('../../public/3d/free-throw/environment/manifest.json',import.meta.url),'utf8');
const report={checks:[],errors:[],writes:[],externalRequests:[],abortedRequests:[]};
const browser=await chromium.launch({executablePath:process.argv[3],headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const record=(check,evidence)=>{report.checks.push({check,evidence});console.log(check,JSON.stringify(evidence));};
async function fixture(reducedMotion='no-preference') {
  const context=await browser.newContext({viewport:{width:320,height:360},deviceScaleFactor:1,reducedMotion});
  await context.route('**/*',route=>{
    const r=route.request();
    if(r.method()!=='GET'){report.writes.push(r.url());return route.abort();}
    if(new URL(r.url()).origin!==origin){report.externalRequests.push(r.url());return route.abort();}
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.stack??e.message));
  page.on('requestfailed',r=>report.abortedRequests.push({url:r.url(),error:r.failure()?.errorText}));
  return {context,page};
}
async function ready(page) {
  await page.goto(origin+'/?mode=game',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='ready',undefined,{timeout:15000,polling:50});
}
async function unmount(page) {
  const count=await page.evaluate(()=>window.qaContexts.size);assert.ok(count>0);
  await page.evaluate(()=>window.artGameQA.unmount());
  await page.waitForFunction(()=>document.querySelectorAll('canvas').length===0&&[...window.qaContexts].every(gl=>gl.isContextLost()),undefined,{timeout:3000,polling:50});
  const calls=await page.evaluate(()=>window.qaGpu.calls);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.qaGpu.calls),calls);
  return {contextsCreated:count,liveContexts:await page.evaluate(()=>[...window.qaContexts].filter(gl=>!gl.isContextLost()).length)};
}
try {
  {
    const {context,page}=await fixture('reduce');let held=false;const required=[];
    await page.route('**/environment/manifest.json',()=>{held=true;});
    page.on('response',r=>{if(/\/GOAT_HOOPERS_(Court|Hoop|Basketball)\.glb$/.test(r.url()))required.push({url:r.url(),status:r.status()});});
    await ready(page);assert.ok(held);assert.equal(required.length,3);assert.ok(required.every(r=>r.status===200));
    assert.equal(await page.locator('canvas').getAttribute('data-environment'),'loading');
    // Exercise the real score owner while the optional request remains held.
    await page.getByRole('group',{name:'Court controls'}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='result',undefined,{timeout:10000,polling:50});
    assert.match(await page.getByLabel('Makes and shots').innerText(),/\/\s*1/);
    record('never-resolving optional manifest does not block play or immediate unmount',{required,...await unmount(page),manifestResponseReleased:false});
    await context.close();
  }
  {
    const {context,page}=await fixture();let held=false;
    await page.route('**/GOAT_HOOPERS_Court.glb',()=>{held=true;});
    await page.goto(origin+'/?mode=game',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.qaContexts?.size===1,undefined,{timeout:10000});
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='loading');
    assert.ok(held);
    record('unmount during required-asset creation releases context before settlement',{...await unmount(page),courtResponseReleased:false});
    await context.close();
  }
  {
    const {context,page}=await fixture();let held=false;
    await page.route('**/environment/manifest.json',()=>{held=true;});
    await ready(page);assert.ok(held);
    await page.waitForSelector('canvas[data-environment="unavailable"]',{timeout:25000});
    assert.equal(await page.locator('[data-shot-state]').getAttribute('data-shot-state'),'ready');
    record('native scenery deadline aborts a held request while the court stays ready',{...await unmount(page),manifestResponseReleased:false});
    await context.close();
  }
  {
    const {context,page}=await fixture('reduce');let raw=0,gzip=0;
    await page.addInitScript(()=>{window.DecompressionStream=undefined;});
    page.on('response',r=>{if(r.url().endsWith('/environment/outdoor.glb')&&r.status()===200)raw++;if(r.url().endsWith('/environment/outdoor.glb.gz'))gzip++;});
    await ready(page);await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:30000});
    assert.equal(raw,1);assert.equal(gzip,0);
    record('standard GLB fallback still loads after making transport cancellable',{raw,gzip,...await unmount(page)});
    await context.close();
  }
  {
    const {context,page}=await fixture();let held;
    await page.route('**/environment/manifest.json',route=>{held=route;});
    await ready(page);assert.ok(held);
    await page.evaluate(()=>{document.getElementById('root').style.transform='translateY(-200vh)';});
    await page.waitForFunction(()=>window.qaVisibility.inView===false);
    const before=await page.evaluate(()=>window.qaGpu.calls);
    await held.fulfill({contentType:'application/json',body:manifest});
    await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:15000});
    await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.qaGpu.calls),before);
    await page.evaluate(()=>{document.getElementById('root').style.transform='';});
    await page.waitForFunction(()=>window.qaVisibility.inView===true&&window.qaGpu.calls>0);
    const after=await page.evaluate(()=>window.qaGpu.calls);assert.ok(after>before);
    record('late scenery mounts without offscreen GPU work and redraws on return',{before,after,...await unmount(page)});
    await context.close();
  }
  {
    const {context,page}=await fixture();await ready(page);
    await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:30000});
    await page.evaluate(()=>{
      window.qaShotPhases=[];const stage=document.querySelector('[data-shot-state]');
      new MutationObserver(()=>window.qaShotPhases.push(stage.dataset.shotState)).observe(stage,{attributes:true,attributeFilter:['data-shot-state']});
    });
    await page.getByRole('group',{name:'Court controls'}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='flight',undefined,{timeout:10000,polling:50});
    await page.evaluate(()=>{document.getElementById('root').style.transform='translateY(-200vh)';});
    await page.waitForFunction(()=>window.qaVisibility.inView===false);
    const before=await page.evaluate(()=>window.qaGpu.calls);await page.waitForTimeout(700);
    const after700ms=await page.evaluate(()=>window.qaGpu.calls);assert.equal(after700ms,before);
    await page.waitForFunction(()=>window.qaShotPhases.includes('result')&&document.querySelector('[data-shot-state]')?.dataset.shotState==='ready',undefined,{timeout:10000,polling:50});
    assert.equal(await page.evaluate(()=>window.qaGpu.calls),before);
    assert.match(await page.getByLabel('Makes and shots').innerText(),/\/\s*1/);
    await page.getByRole('button',{name:'Reset session',exact:true}).evaluate(button=>button.click());
    assert.match(await page.getByLabel('Makes and shots').innerText(),/^0\s*\/\s*0$/);
    assert.equal(await page.evaluate(()=>window.qaGpu.calls),before);
    await page.evaluate(()=>{document.getElementById('root').style.transform='';});
    await page.waitForFunction(()=>window.qaVisibility.inView===true);
    const onReturn=await page.evaluate(()=>window.qaGpu.calls);assert.ok(onReturn>before);
    assert.equal(await page.locator('canvas').getAttribute('data-crowd-reaction'),'none');
    record('native offscreen shot simulates, scores, retries and resets with zero GPU draws',{before,after700ms,onReturn,phases:await page.evaluate(()=>window.qaShotPhases),...await unmount(page)});
    await context.close();
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.writes,[]);assert.deepEqual(report.externalRequests,[]);
  report.sourceSha256={};
  for(const file of ['src/three/FreeThrowScene.ts','src/three/FreeThrowEnvironment.ts','src/surfaces/arcade/free-throw/FreeThrowPractice.tsx'])report.sourceSha256[file]=createHash('sha256').update(await readFile(new URL('../../'+file,import.meta.url))).digest('hex');
  report.status='passed';
}catch(error){report.status='failed';report.failure=error.stack??String(error);throw error;}
finally{await browser.close();await writeFile(path.join(out,'lifecycle-regressions.json'),JSON.stringify(report,null,2));}
