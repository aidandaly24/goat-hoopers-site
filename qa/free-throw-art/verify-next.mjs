// Run after `next build`: exercise the actual production route and site shell.
// No app credentials; existing fixture guard blocks server-side external fetches.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const repo=fileURLToPath(new URL('../../',import.meta.url));
const evidence=path.resolve(process.argv[4]);await mkdir(evidence,{recursive:true});
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const origin='http://127.0.0.1:8810';
const logs=[],report={route:'/arcade/free-throw',checks:[],errors:[],externalRequests:[],writes:[],credentials:'absent',serverExternalFetches:'blocked'};
const server=spawn(process.execPath,[path.join(repo,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','8810'],{
  cwd:repo,stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,LANG:'en_US.UTF-8',TZ:'UTC',NODE_ENV:'production',
    NEXT_TELEMETRY_DISABLED:'1',DATABASE_URL:'',PRICE_HISTORY_IMPORT_URL:'',
    NODE_OPTIONS:'--import='+path.join(repo,'src/test/arcade/block-external.mjs')},
});
for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>logs.push(chunk.toString()));
let browser;
try {
  for(let attempt=0;attempt<100&&!logs.join('').includes('Ready in');attempt++) {
    assert.equal(server.exitCode,null,logs.join(''));await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(logs.join('').includes('Ready in'),logs.join(''));
  browser=await chromium.launch({executablePath:process.argv[3],headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  for(const mobile of [false,true]) {
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},
      deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    await context.route('**/*',route=>{
      const request=route.request();
      if(request.method()!=='GET'){report.writes.push(request.url());return route.abort();}
      if(new URL(request.url()).origin!==origin){report.externalRequests.push(request.url());return route.abort();}
      return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.stack??error.message));
    const response=await page.goto(origin+report.route,{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:60000});
    await page.waitForFunction(()=>document.querySelector('[data-shot-state]')?.dataset.shotState==='ready');
    assert.match(await page.getByLabel('Makes and shots').innerText(),/^0\s*\/\s*0$/);
    const label=mobile?'phone':'desktop';
    await page.screenshot({path:path.join(evidence,'next-'+label+'.png'),timeout:30000});
    await page.evaluate(()=>{
      window.qaResultSeen=false;window.qaStillSeen=false;
      const stage=document.querySelector('[data-shot-state]');
      new MutationObserver(()=>{
        window.qaResultSeen ||= stage.dataset.shotState==='result';
        window.qaStillSeen ||= stage.querySelector('canvas')?.dataset.crowdMotion==='still';
      }).observe(stage,{attributes:true,subtree:true,attributeFilter:['data-shot-state','data-crowd-motion']});
    });
    await page.getByRole('group',{name:'Court controls'}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.qaResultSeen&&window.qaStillSeen,undefined,{timeout:30000,polling:50});
    assert.match(await page.getByLabel('Makes and shots').innerText(),/\/\s*1/);
    report.checks.push({profile:label,httpStatus:response.status(),environment:'blender-outdoor',actualControllerResult:true,reducedMotion:true});
    await context.close();
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.writes,[]);
  report.status='passed';
}catch(error){report.status='failed';report.failure=error.stack??String(error);throw error;}
finally{
  await browser?.close();
  server.kill('SIGTERM');
  if(server.exitCode===null)await new Promise(resolve=>server.once('exit',resolve));
  await writeFile(path.join(evidence,'next-route-verification.json'),JSON.stringify(report,null,2));
  await writeFile(path.join(evidence,'next-server.log'),logs.join(''));
  console.log(JSON.stringify(report,null,2));
}
