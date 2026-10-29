import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { capturePage } from './capture-page.mjs';

const ids=process.argv.slice(2),folder='qa/homepage-20/evidence';
const phase=process.env.GOAT_MOCK_PHASE==='iterations'?'iterations':'directions',prefix=phase==='iterations'?'iteration-':'';
if(!ids.length)throw new Error('Pass submitted author IDs, e.g.03');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 await mkdir(folder,{recursive:true});
 for(const id of ids){
  const html=await readFile(`qa/homepage-20/${phase}/${id}/index.html`,'utf8');
  const record={direction:id,title:html.match(/<title>(.*?)<\/title>/is)?.[1]??`Direction ${id}`,htmlSha256:createHash('sha256').update(html).digest('hex'),captures:[],failures:[]};
  for(const view of ['member','public'])for(const[device,viewport]of[['desktop',{width:1440,height:1000}],['phone',{width:390,height:844}]]){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();const errors=[],remote=[];
   page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith('http://127.0.0.1:4198/'))remote.push(request.url())});
   const file=`${folder}/${prefix}${id}-${view}-${device}.jpg`;
   try{
    await page.goto(`http://127.0.0.1:4198/qa/homepage-20/${phase}/${id}/index.html?view=${view}`);
    await page.waitForSelector(`[data-mock-ready="${id}"]`,{timeout:30000});await page.evaluate(()=>document.fonts.ready);
    const inventory=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,teams:document.querySelectorAll('[data-team-id]').length,faces:document.querySelectorAll('[data-face]').length,pairs:document.querySelectorAll('[data-ai-pair]').length,personal:document.querySelectorAll('[data-personal]').length,rosterRefs:new Set([...document.querySelectorAll('[data-team-id] a[href^="/player/"]')].map(a=>a.getAttribute('href'))).size}));
    if(inventory.scrollWidth>inventory.width)throw new Error(`Page overflow ${inventory.scrollWidth}/${inventory.width}`);
    if(errors.length)throw new Error(errors.join('; '));if(remote.length)throw new Error(`Remote requests:${remote.join(',')}`);
    const evidence=await capturePage(page,file,{checkpoints:true});
    // Preserve the full unretouched JPEG; only finalists need duplicate PNGs.
    for(const suffix of ['.png','-top.png','-middle.png','-bottom.png'])await unlink(file.replace('.jpg',suffix));
    record.captures.push({view,device,file,inventory,errors,remote,...evidence});
   }catch(error){record.failures.push({view,device,error:String(error),errors,remote});}
   await context.close();
  }
  const after=await readFile(`qa/homepage-20/${phase}/${id}/index.html`,'utf8');if(after!==html)record.failures.push({error:'Source changed during capture; do not treat this batch as final evidence.'});
  await writeFile(`${folder}/${prefix}${id}-captures.json`,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({id,success:record.captures.length,failures:record.failures}));
 }
}finally{await browser.close()}
