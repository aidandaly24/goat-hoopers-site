// @env node
import {readFile,writeFile,readdir} from 'node:fs/promises';
import sharp from 'sharp';
const root='qa/homepage-structures',phase=process.env.GOAT_STRUCT_PHASE||'wireframes';
const alloc=JSON.parse(await readFile(`${root}/allocation.json`)),available=[];
for(const entry of alloc){try{const cap=JSON.parse(await readFile(`${root}/evidence/${phase}/${entry.id}/captures.json`));available.push({...entry,...cap});}catch{}}
if(!available.length)throw Error('No captured studies');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const font='Arial';
async function sheet(device){const cols=device==='desktop'?4:5,cw=device==='desktop'?400:260,ch=device==='desktop'?350:620,w=cols*cw,h=Math.ceil(available.length/cols)*ch,parts=[];
 for(const [i,study]of available.entries()){const rec=study.records.find(r=>r.view==='member'&&r.device===device),x=(i%cols)*cw,y=Math.floor(i/cols)*ch,thumb=await sharp(rec.initial.path).resize({width:cw-20,height:ch-65,fit:'contain',background:'#fff'}).jpeg({quality:85}).toBuffer();parts.push({input:thumb,left:x+10,top:y+50});const svg=Buffer.from(`<svg width="${cw}" height="45"><rect width="100%" height="100%" fill="#fff"/><text x="10" y="30" font-family="${font}" font-size="19" fill="#111">${study.id} ${escape(study.name)}</text></svg>`);parts.push({input:svg,left:x,top:y});}
 let q=88,buf;for(;q>20;q-=3){buf=await sharp({create:{width:w,height:h,channels:3,background:'#ddd'}}).composite(parts).jpeg({quality:q,mozjpeg:true}).toBuffer();if(buf.length<890000)break;}const path=`${root}/evidence/${phase}/contact-${device}.jpg`;await writeFile(path,buf);return{path,bytes:buf.length,width:w,height:h,method:'Labeled opening-viewport index only; complete state images in gallery/index'};}
const contacts=await Promise.all(['desktop','phone'].map(sheet));
const gallery={phase,stage:phase==='wireframes'?'grayscale structural checkpoint; not final content/art acceptance':'full implementation studies',count:available.length,contacts,studies:available.map(s=>({...s,url:`${phase}/${s.id}/index.html`}))};await writeFile(`${root}/gallery.json`,JSON.stringify(gallery,null,2)+'\n');
const lines=['# Actual structural images','','Grayscale checkpoint. Native viewport images show real navigation geometry; full images show the entire active document. Focused/spatial/paged models use separate states: a single overview cannot prove their complete content. This is not final full-design delivery.','',`Captured studies: ${available.length}/20.`, ''];
for(const study of available){lines.push(`## ${study.id} ${study.name}`,'',`[Working wireframe](${phase}/${study.id}/index.html) · [Structure and content map](${phase}/${study.id}/STRUCTURE.md)`,'','| State | Member desktop | Member phone | Public desktop | Public phone |','| --- | --- | --- | --- | --- |');const states=[...new Set(study.records.map(r=>r.state.id))];for(const state of states){const cells=[];for(const [view,device]of[['member','desktop'],['member','phone'],['public','desktop'],['public','phone']]){const rec=study.records.find(r=>r.state.id===state&&r.view===view&&r.device===device);cells.push(rec?`[Complete](${rec.full.path.replace(root+'/','')}) · [viewport](${rec.initial.path.replace(root+'/','')})`:'State not in this edition');}lines.push(`| ${state} | ${cells.join(' | ')} |`);}lines.push('');}
await writeFile(`${root}/IMAGE-INDEX.md`,lines.join('\n')+'\n');
console.log(JSON.stringify({captured:available.length,states:available.reduce((a,s)=>a+s.records.length,0),contacts}));
