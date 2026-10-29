// Normal-size actual viewport evidence of complete-page section transitions.
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='qa/homepage-structures',phase=process.env.GOAT_STRUCT_PHASE||'polished',ids=process.argv.slice(2);
if(!ids.length)throw Error('Pass frozen IDs');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const id of ids){const records=[],folder=`${root}/evidence/${phase}/${id}/reading-checkpoints`;await mkdir(folder,{recursive:true});
  for(const view of['member','public'])for(const device of['desktop','phone']){
    const context=await browser.newContext({viewport:{width:device==='desktop'?1440:390,height:device==='desktop'?1000:844},reducedMotion:'reduce'}),p=await context.newPage();
    await p.goto(`http://127.0.0.1:4207/${root}/${phase}/${id}/index.html?view=${view}`);await p.waitForSelector(`[data-study-ready='${id}']`);
    await p.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.allSettled([...document.images].map(i=>i.decode()))});
    const height=await p.evaluate(()=>document.documentElement.scrollHeight),end=Math.max(0,height-p.viewportSize().height);
    for(const[location,offset]of[['top',0],['middle',Math.floor(end/2)],['bottom',end]]){
      await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),offset);await p.waitForTimeout(80);
      const bytes=await sharp(await p.screenshot({animations:'disabled',caret:'hide'})).jpeg({quality:87,mozjpeg:true}).toBuffer(),path=`${folder}/${view}-${device}-${location}.jpg`;
      if(bytes.length>=900000)throw Error('Normal checkpoint exceeds900KB');await writeFile(path,bytes);
      records.push({view,device,location,requestedOffset:offset,documentHeight:height,path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),...await p.evaluate(()=>({actualOffset:scrollY,headings:[...document.querySelectorAll('h1,h2,h3')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&!e.closest('[inert]')}).map(e=>e.textContent.trim()),footer:document.querySelector('footer')?.innerText?.slice(0,800)||null}))});
    }
    await context.close();
  }
  await writeFile(`${folder}/index.json`,JSON.stringify({id,phase,method:'Actual browser document scroll top/middle/bottom at native viewport sizes, unchanged source/layout. Constrained documents can have equal offsets; their complete independent readers remain separate pane strips.',records},null,2)+'\n');console.log(JSON.stringify({id,checkpoints:records.length}));
}}finally{await browser.close()}
