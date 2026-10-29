// @env node
// Capture real grayscale states without flattening their navigation/layout.
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='qa/homepage-structures', ids=process.argv.slice(2),phase=process.env.GOAT_STRUCT_PHASE||'wireframes';
if(!ids.length)throw Error('Pass source-ready IDs.');
sharp.cache(false);sharp.concurrency(1);
const hash=b=>createHash('sha256').update(b).digest('hex');
async function sourceHashes(id){const out=[];async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(item.isDirectory())await walk(`${dir}/${item.name}`);else if(/\.(html|css|js|svg|md)$/.test(item.name)){const path=`${dir}/${item.name}`,bytes=await readFile(path);out.push({path,sha256:hash(bytes),bytes:bytes.length})}}}await walk(`${root}/${phase}/${id}`);return out;}
async function jpeg(buf,path){let quality=90,result;for(;quality>=20;quality-=3){result=await sharp(buf).jpeg({quality,mozjpeg:true}).toBuffer();if(result.length<890000)break;}if(result.length>=900000)throw Error('JPEG exceeds900K');await writeFile(path,result);const meta=await sharp(result).metadata();return {path,bytes:result.length,sha256:hash(result),width:meta.width,height:meta.height,quality};}
async function complete(p,path){const v=p.viewportSize(),h=await p.evaluate(()=>document.documentElement.scrollHeight),scrollBefore=await p.evaluate(()=>scrollY);const native=await p.screenshot({animations:'disabled',caret:'hide'});const initial=await jpeg(native,path.replace('.jpg','-viewport.jpg'));
 let img,offsets=[];
 if(h<=7600){img=await p.screenshot({fullPage:true,animations:'disabled',caret:'hide'});offsets=[{x:0,y:0,height:h,method:'bounded native fullPage'}];}
 else {const parts=[],cdp=await p.context().newCDPSession(p);let y=0;while(y<h){const take=Math.min(1800,h-y),raw=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:0,y,width:v.width,height:take,scale:1}}),tile=Buffer.from(raw.data,'base64');const m=await sharp(tile).metadata();if(m.height!==take)throw Error('Tile height mismatch');parts.push({input:tile,left:0,top:y});offsets.push({x:0,y,height:take,method:'bounded CDP document clip; no CSS flattening'});y+=take;}await cdp.detach();img=await sharp({create:{width:v.width,height:h,channels:3,background:'#fff'}}).composite(parts).png().toBuffer();}
 const full=await jpeg(img,path);await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),scrollBefore);return {full,initial,offsets,documentHeight:h};}
async function readLayout(p){return p.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,bodyFont:getComputedStyle(document.body).fontSize,headings:[...document.querySelectorAll('h1,h2')].filter(e=>e.getClientRects().length).map(e=>e.textContent.trim()),panes:[...document.querySelectorAll('main *')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight).map(e=>({tag:e.tagName,id:e.id,height:e.clientHeight,scrollHeight:e.scrollHeight})),text:document.body.innerText.slice(0,2500)}))}
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const id of ids){await mkdir(`${root}/evidence/${phase}/${id}`,{recursive:true});const before=await sourceHashes(id),records=[],entryRecords=[];
for(const view of ['member','public'])for(const device of ['desktop','phone']){
 const context=await b.newContext({viewport:{width:device==='desktop'?1440:390,height:device==='desktop'?1000:844},reducedMotion:'reduce'});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:4207/${root}/${phase}/${id}/index.html?view=${view}`);await p.waitForSelector(`[data-study-ready='${id}']`,{timeout:30000});await p.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.allSettled([...document.images].map(i=>i.decode()));});
 entryRecords.push({view,device,state:{id:'boot',label:'Actual initial load'},...await complete(p,`${root}/evidence/${phase}/${id}/${view}-${device}-entry.jpg`),layout:await readLayout(p),errors:[...errors]});
 const states=await p.evaluate(()=>window.goatStudy?.states);if(!Array.isArray(states)||states.length<2)throw Error(`${id} needs substantive state API`);
 for(const [n,state]of states.entries()){
 await p.evaluate(async state=>{await window.goatStudy.activate(state);await document.fonts.ready;for(const image of document.images)image.loading='eager';await Promise.allSettled([...document.images].map(image=>image.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},state.id);await p.waitForTimeout(120);
 const file=`${root}/evidence/${phase}/${id}/${view}-${device}-${String(n).padStart(2,'0')}-${String(state.id).replace(/[^a-z0-9_-]/gi,'')}.jpg`;
 const layout=await readLayout(p);
 records.push({view,device,state,...await complete(p,file),layout,errors:[...errors]});
 }
 await context.close();
}
 const after=await sourceHashes(id);if(JSON.stringify(before)!==JSON.stringify(after))throw Error(`Source changed during${id} capture`);
 const result={id,phase,source:before,records,entryRecords,method:'Actual initial-load records plus browser state API; grayscale reduced-motion; all advertised states in public/member desktop1440 andphone390. Real viewport plus whole document. No position/CSS flattening. Scrollable interior content needs its own views and explicit pane checks; these images are structural evidence, not final complete-content acceptance.'};await writeFile(`${root}/evidence/${phase}/${id}/captures.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({id,states:records.length,errors:[...new Set(records.flatMap(r=>r.errors))],overflow:records.filter(r=>r.layout.scrollWidth>r.layout.innerWidth).map(r=>`${r.view}/${r.device}/${r.state.id}`)}));}}
finally{await b.close();}
