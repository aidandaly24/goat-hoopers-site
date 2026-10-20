// Capture real compositor frames of the shipped cue scheduler; no pose stepping.
// Usage: node record-cues.mjs /playwright/index.mjs /chromium /ffmpeg /evidence
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const out=path.resolve(process.argv[5]);await mkdir(path.join(out,'cue-frames'),{recursive:true});
const browser=await chromium.launch({executablePath:process.argv[3],headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const frames=[],cues=[],errors=[];const origin='http://127.0.0.1:8799';
try {
  const context=await browser.newContext({viewport:{width:320,height:360},deviceScaleFactor:1});
  await context.route('**/*',route=>route.request().method()==='GET'&&new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/?mode=scene');await page.waitForFunction(()=>window.artQA,undefined,{timeout:60000});
  await page.waitForSelector('canvas[data-environment="blender-outdoor"]',{timeout:30000});
  const cdp=await context.newCDPSession(page);
  cdp.on('Page.screencastFrame',({data,metadata,sessionId})=>{
    frames.push({data,timestamp:metadata.timestamp});void cdp.send('Page.screencastFrameAck',{sessionId}).catch(()=>{});
  });
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:320,maxHeight:360,everyNthFrame:1});
  await page.waitForTimeout(1500);
  for(const [outcome,streak,reduced] of [['miss',0,false],['made',1,false],['made',3,false],['made',3,true]]) {
    await page.evaluate(()=>window.artQA.reset());await page.waitForTimeout(1000);
    const started=await page.evaluate(({outcome,streak,reduced})=>{window.artQA.react(outcome,streak,reduced);return performance.now();},{outcome,streak,reduced});
    cues.push({outcome,streak,reduced,startedBrowserMs:started});await page.waitForTimeout(2000);
  }
  await cdp.send('Page.stopScreencast');assert.deepEqual(errors,[]);assert.ok(frames.length>5);
  const list=[];
  for(let index=0;index<frames.length;index++) {
    const name='frame-'+String(index).padStart(4,'0')+'.jpg';
    await writeFile(path.join(out,'cue-frames',name),Buffer.from(frames[index].data,'base64'));
    list.push("file '"+name+"'",'duration '+(index+1<frames.length?Math.max(.001,frames[index+1].timestamp-frames[index].timestamp):.1));
  }
  list.push("file 'frame-"+String(frames.length-1).padStart(4,'0')+".jpg'");
  const input=path.join(out,'cue-frames','frames.txt');await writeFile(input,list.join('\n')+'\n');
  const encoded=spawnSync(process.argv[4],['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',input,'-an','-r','30','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'crowd-cues.mp4')],{encoding:'utf8'});
  assert.equal(encoded.status,0,encoded.stderr);
  const hashes={};
  for(const file of ['src/three/FreeThrowScene.ts','src/three/FreeThrowEnvironment.ts','public/3d/free-throw/environment/outdoor.glb'])hashes[file]=createHash('sha256').update(await readFile(new URL('../../'+file,import.meta.url))).digest('hex');
  await writeFile(path.join(out,'cue-recording.json'),JSON.stringify({status:'passed',method:'Actual Chromium compositor frames with original timestamps; fixture-triggered results run the native 420ms scheduler. No manual pose stepping.',viewport:[320,360],dpr:1,hardware:'ANGLE SwiftShader software GPU; capture overhead affects displayed cadence, not a physical-device performance test',frames:frames.length,durationSeconds:frames.at(-1).timestamp-frames[0].timestamp,cues,sourceSha256:hashes},null,2));
}finally{await browser.close();}
