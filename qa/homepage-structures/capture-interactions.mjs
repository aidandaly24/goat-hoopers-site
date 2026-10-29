// Record real local pointer/keyboard paths. No authored layout or animation edits.
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='qa/homepage-structures',phase=process.env.GOAT_STRUCT_PHASE||'polished',ids=process.argv.slice(2);
if(!ids.length||ids.some(id=>!/^\d{2}$/.test(id)))throw Error('Pass frozen study IDs');
const sha=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const id of ids){
  const planPath=`${root}/${phase}/${id}/motion-demo.json`,bytes=await readFile(planPath),plan=JSON.parse(bytes);
  const plans=Array.isArray(plan.steps)?[plan.steps]:[plan.desktop,plan.phone];
  if(plans.some(steps=>!Array.isArray(steps)||steps.length>12))throw Error('Expected bounded actual interaction steps');
  for(const step of plans.flat())if(!['click','press','select','fill','scroll','wait'].includes(step.action)||typeof step.selector!=='string'&&step.action!=='wait')throw Error('Invalid step');
  const dir=`${root}/evidence/${phase}/${id}/interactions`;await mkdir(dir,{recursive:true});
  const records=[];
  for(const device of['desktop','phone'])for(const reducedMotion of['no-preference','reduce']){
    const width=device==='desktop'?1440:390,height=device==='desktop'?1000:844,steps=Array.isArray(plan.steps)?plan.steps:plan[device];
    const context=await browser.newContext({viewport:{width,height},reducedMotion,recordVideo:{dir,size:{width,height}}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:4207/${root}/${phase}/${id}/index.html?view=member`);
    await page.waitForSelector(`[data-study-ready='${id}']`);
    await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.allSettled([...document.images].map(i=>i.decode()))});
    const started=Date.now(),timeline=[];await page.waitForTimeout(600);
    for(const step of steps){
      const at=Date.now()-started,locator=step.selector?page.locator(step.selector).first():null;
      if(step.action==='click')await locator.click();
      if(step.action==='press'){await locator.focus();await locator.press(step.key)}
      if(step.action==='select')await locator.selectOption(step.value);
      if(step.action==='fill')await locator.fill(step.value);
      if(step.action==='scroll')await locator.evaluate((e,delta)=>e.scrollBy({top:delta,behavior:'instant'}),step.delta||300);
      await page.waitForTimeout(Math.min(600,Math.max(120,step.waitMs||500)));
      timeline.push({...step,atMs:at,afterMs:Date.now()-started,activeId:await page.evaluate(()=>document.activeElement?.id||null)});
    }
    await page.waitForTimeout(600);const video=page.video();await context.close();const raw=await video.path();
    const output=`${dir}/${device}-${reducedMotion}.mp4`;
    const encoded=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',raw,'-vf',device==='desktop'?'scale=1008:-2':'scale=390:-2','-c:v','libx264','-preset','medium','-crf','30','-pix_fmt','yuv420p','-movflags','+faststart',output],{encoding:'utf8'});
    if(encoded.status!==0)throw Error('Video encode failed: '+encoded.stderr);
    const artifact=await readFile(output);
    records.push({device,reducedMotion,viewport:{width,height},path:output,bytes:artifact.length,sha256:sha(artifact),raw,timeline,errors,method:'Actual Playwright browser recording, then size-only video encode. No screenshot animation, CSS flattening, autoplay injection or simulation of UI state.'});
    console.log(JSON.stringify({id,device,reducedMotion,bytes:artifact.length,errors}));
  }
  await writeFile(`${dir}/manifest.json`,JSON.stringify({id,phase,planPath,planSha256:sha(bytes),records,limit:'Headless Linux Chromium interaction evidence, not physical-phone smoothness, screen-reader or cross-browser certification. An instant change may intentionally remain instant in both recordings.'},null,2)+'\n');
}}finally{await browser.close()}
