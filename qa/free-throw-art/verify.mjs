// Runs the actual production-built component/renderer, not a render mock.
// Usage: node verify.mjs /installed/playwright/index.mjs /installed/chromium /evidence
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
const { chromium } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const evidence = path.resolve(process.argv[4]); await mkdir(evidence,{recursive:true});
const origin='http://127.0.0.1:8799', baseline='http://127.0.0.1:8800';
const report={ browser:'', hardware:'Headless Chromium ANGLE SwiftShader; phone viewport/touch/DPR/CPU/network emulation, not a physical phone GPU', profiles:[], checks:[], errors:[], externalRequests:[], writes:[] };
const browser=await chromium.launch({executablePath:process.argv[3],headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
report.browser=browser.version();
const record=(check,value)=>{report.checks.push({check,value});console.log(check,JSON.stringify(value));};
async function bounded(promise, label, ms=20000) {
  let timer;
  try { return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' exceeded '+ms+'ms')),ms);})]); }
  finally { clearTimeout(timer); }
}
async function contextFor(mobile=false,compact=false) {
  const context=await browser.newContext({viewport:compact?{width:320,height:360}:mobile?{width:390,height:844}:{width:1440,height:960},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  await context.route('**/*',route=>{
    const request=route.request();
    if(request.method()!=='GET'){report.writes.push(request.url());return route.abort();}
    if(![origin,baseline].includes(new URL(request.url()).origin)){report.externalRequests.push(request.url());return route.abort();}
    return route.continue();
  });
  return context;
}
async function observeShot(page) {
  // Keep transient React result/cue commits observable even when the software
  // GPU delays the next DevTools roundtrip beyond the existing retry timer.
  await page.evaluate(()=>{
    window.qaShotObserver?.disconnect();window.qaShotHistory=[];
    const stage=document.querySelector('[data-shot-state]');
    const record=()=>window.qaShotHistory.push({at:performance.now(),state:stage.dataset.shotState,motion:stage.querySelector('canvas')?.dataset.crowdMotion});
    window.qaShotObserver=new MutationObserver(record);
    window.qaShotObserver.observe(stage,{attributes:true,subtree:true,attributeFilter:['data-shot-state','data-crowd-motion']});record();
  });
}
try {
  for(const mobile of process.env.FREE_THROW_QA_CONTROLS_ONLY ? [] : [false,true]) for(const old of [true,false]) {
    const context=await contextFor(mobile);const page=await context.newPage();
    await page.bringToFront();
    page.on('pageerror',e=>report.errors.push(e.stack??e.message));
    const cdp=await context.newCDPSession(page);
    await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    await cdp.send('Performance.enable');
    if(mobile){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:4*1024*1024/8,uploadThroughput:1024*1024/8});}
    await page.goto((old?baseline:origin)+'/?mode=scene',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.artQA,undefined,{timeout:90000,polling:50});
    const courtReadyMs=await page.evaluate(()=>performance.now());
    if(!old)await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:30000});
    const readyMs=await bounded(page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));return performance.now();}),'First completed frame',30000);
    await page.waitForTimeout(300);
    await cdp.send('HeapProfiler.collectGarbage');
    const memory=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.filter(m=>['JSHeapUsedSize','JSHeapTotalSize','Nodes','Documents'].includes(m.name)).map(m=>[m.name,m.value]));
    const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,encoded:r.encodedBodySize,decoded:r.decodedBodySize,durationMs:r.duration})));
    const metrics=await bounded(page.evaluate(()=>window.artQA.bench(30)),'Render benchmark');
    const label=(old?'baseline':'blender')+'-'+(mobile?'phone-emulation':'desktop');
    report.profiles.push({label,courtReadyMs,readyMs,memory,resources,assetBytes:resources.filter(r=>r.path.startsWith('/3d/')).reduce((s,r)=>s+r.encoded,0),...metrics});
    record(label,{readyMs,memory,medianMs:metrics.medianMs,p95Ms:metrics.p95Ms,sample:metrics.sample,stats:metrics.stats});
    const pixels=await bounded(page.evaluate(()=>window.artQA.capture()),'Actual WebGL image capture');
    assert.ok(pixels.startsWith('data:image/png;base64,'));
    await writeFile(path.join(evidence,label+'.png'),Buffer.from(pixels.split(',')[1],'base64'));
    if(!old){
      assert.ok(metrics.stats.crowd);assert.ok(metrics.sample.calls<=60);assert.ok(metrics.sample.triangles<650000);
      const idle=await page.evaluate(()=>window.qaGpu.calls);await page.waitForTimeout(600);
      assert.equal(await page.evaluate(()=>window.qaGpu.calls),idle);record(label+' zero idle drawing',true);
      const origins=[];
      for(let index=0;index<9;index++){
        await page.evaluate(i=>window.artQA.spot(i),index);
        const stats=await page.evaluate(()=>window.artQA.stats());
        assert.ok(stats.crowd.visibleSpectators>30 && stats.crowd.visibleSpectators<=416);
        origins.push(stats);
      }
      record(label+' all nine existing shot origins',origins);
      await page.evaluate(()=>{window.artQA.spot(0);window.artQA.react('made',3);});
      await page.waitForTimeout(80);
      assert.equal(await page.locator('canvas').getAttribute('data-crowd-reaction'),'streak');
      await page.waitForTimeout(500);
      assert.equal(await page.locator('canvas').getAttribute('data-crowd-motion'),'idle');
      const settled=await page.evaluate(()=>window.qaGpu.calls);await page.waitForTimeout(500);
      assert.equal(await page.evaluate(()=>window.qaGpu.calls),settled);
      await page.evaluate(()=>{window.artQA.reset();window.artQA.react('miss',0,true);});
      assert.equal(await page.locator('canvas').getAttribute('data-crowd-motion'),'still');
      const reduced=await page.evaluate(()=>window.qaGpu.calls);await page.waitForTimeout(500);
      assert.equal(await page.evaluate(()=>window.qaGpu.calls),reduced);
      record(label+' bounded streak and reduced-motion miss',true);
      await page.evaluate(()=>{document.getElementById('root').style.transform='translateY(-200vh)';});
      await page.waitForFunction(()=>window.artQA.stats().inView===false);
      const offscreen=await page.evaluate(()=>{window.artQA.react('made',3);return window.qaGpu.calls;});
      await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.qaGpu.calls),offscreen);
      record(label+' offscreen reaction stops',true);
      await page.evaluate(()=>{document.getElementById('root').style.transform='';window.artQA.reset();window.artQA.dispose();});
      assert.equal(await page.locator('canvas').count(),0);
      const freed=await page.evaluate(()=>window.artQA.stats());
      record(label+' disposal counters',freed);
      assert.equal(freed.geometries,0);
      // three@0.186.1 retains its module-global 16x16 RG16F DFG_LUT (1 KiB).
      // It is not scene-owned. Releasing the context frees its GPU copy too.
      assert.ok(freed.textures<=1);
      await page.waitForFunction(()=>window.artQA.stats().contextLost===true);
      record(label+' complete scene disposal and context release',freed);
    }
    await context.close();
  }

  // Actual React controls, score owner, retry and keyboard/touch pathways.
  {
    // The small native viewport keeps the complete normal-motion pathway
    // testable on this software GPU. It is not a target-device FPS check.
    const context=await contextFor(false,true);const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.stack??e.message));
    await page.goto(origin+'/?mode=game');
    await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:60000});
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='ready');
    await page.getByRole('group',{name:'Court controls'}).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='flight',undefined,{timeout:15000,polling:50});
    assert.equal(await page.locator('canvas').getAttribute('data-crowd-reaction'),'none');
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='result',undefined,{timeout:90000,polling:50});
    assert.match(await page.getByLabel('Makes and shots').innerText(),/\/\s*1/);
    record('uninterrupted native normal-motion shot completes at 320x360 DPR1',await page.evaluate(()=>{
      const canvas=document.querySelector('canvas');return {drawingBuffer:[canvas.width,canvas.height],reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
    }));
    await context.close();
  }
  for(const mobile of [false,true]) {
    const context=await contextFor(mobile);const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.stack??e.message));
    await page.goto(origin+'/?mode=game');
    await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:60000});
    const stage=page.getByRole('group',{name:'Court controls'});
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='ready');
    await observeShot(page);
    await stage.focus();
    if(mobile)await page.getByRole('button',{name:'Hold to charge, release to shoot'}).tap();
    else await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='flight',undefined,{timeout:15000,polling:50});
    assert.equal(await page.locator('canvas').getAttribute('data-crowd-reaction'),'none');
    // Software GPU full-resolution animation is slow; test the real native
    // mid-flight accessibility transition, without altering physics or state.
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>window.qaShotHistory.some(entry=>entry.state==='result'),undefined,{timeout:30000,polling:50});
    assert.match(await page.getByLabel('Makes and shots').innerText(),/\/\s*1/);
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='ready',undefined,{timeout:30000,polling:50});
    await page.getByRole('button',{name:'Reset session',exact:true}).click();
    assert.match(await page.getByLabel('Makes and shots').innerText(),/^0\s*\/\s*0$/);
    record((mobile?'phone touch':'desktop keyboard')+' normal shot start, native mid-flight reduced-motion completion, retry/reset',await page.evaluate(()=>window.qaShotHistory));
    await page.emulateMedia({reducedMotion:'reduce'});await observeShot(page);await stage.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.qaShotHistory.some(entry=>entry.state==='result'),undefined,{timeout:30000,polling:50});
    assert.ok(await page.evaluate(()=>window.qaShotHistory.some(entry=>entry.motion==='still')));
    record((mobile?'phone':'desktop')+' reduced-motion shot retains result cue and controls',true);
    await context.close();
  }
  {
    const context=await contextFor();const page=await context.newPage();
    await page.route('**/outdoor.glb.gz',route=>route.abort());
    await page.goto(origin+'/?mode=game');
    await page.waitForSelector('canvas[data-environment="unavailable"]');
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='ready');
    await page.getByRole('group',{name:'Court controls'}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='result',undefined,{timeout:90000,polling:50});
    record('optional scenery failure retains the actual playable court',true);await context.close();
  }
  {
    const context=await contextFor();const page=await context.newPage();
    await page.goto(origin+'/?mode=scene');await page.waitForFunction(()=>window.artQA);
    await page.evaluate(()=>document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(()=>document.querySelector('#root').dataset.contextLost==='true');
    const before=await page.evaluate(()=>window.qaGpu.calls);await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>window.qaGpu.calls),before);record('actual WebGL context loss stops drawing',true);
    await context.close();
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.writes,[]);
  const asset=await readFile(new URL('../../public/3d/free-throw/environment/outdoor.glb',import.meta.url));
  report.assetSha256=createHash('sha256').update(asset).digest('hex');
  report.sourceSha256={};
  for(const file of ['src/three/FreeThrowScene.ts','src/three/FreeThrowEnvironment.ts','src/surfaces/arcade/free-throw/FreeThrowPractice.tsx','blender/export_free_throw_environment.py','public/3d/free-throw/environment/manifest.json','public/3d/free-throw/environment/sky.jpg']) {
    report.sourceSha256[file]=createHash('sha256').update(await readFile(new URL('../../'+file,import.meta.url))).digest('hex');
  }
  report.status='passed';
} catch(error) {report.status='failed';report.failure=error.stack??String(error);throw error;}
finally {await writeFile(path.join(evidence,'browser-verification.json'),JSON.stringify(report,null,2));await browser.close();}
