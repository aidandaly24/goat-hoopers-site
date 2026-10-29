import {readFile,writeFile,readdir} from 'node:fs/promises';
import sharp from 'sharp';
const root='qa/homepage-20',folder=`${root}/evidence`;
const names={
'01':['Courtside Newspaper','An editorial front page with heavy rules, a low original-court crop and an asymmetric league desk.'],
'02':["Coach’s Clipboard",'A numbered court navigation map and working-sheet hierarchy.'],
'03':['League Almanac','A reference-book composition with seasonal context and open league records.'],
'04':['Personal Team Dossier','An ownership-first team file with a compact league reference.'],
'05':['Broadcast Rundown','A sports broadcast running order translated into readable HTML.'],
'06':['People of the League','The people, managers and players supply the homepage identity.'],
'07':['Schedule Board','All five current pairings and their saved decisions share one working list.'],
'08':['Clubhouse Noticeboard','A league noticeboard with varied editorial groupings.'],
'09':['Stats Exchange','An economical working desk with aligned numbers and open comparison tables.'],
'10':['Court Atlas','The owned court anchors a navigable league atlas.'],
'11':['League Magazine','A magazine-led league opening and contrasting reference sections.'],
'12':['Pocket Game Programme','A compact game programme with a clear sequential reading order.'],
'13':['Weekly Letter','A letter-like editorial rhythm supported by league tables and actions.'],
'14':['Franchise Wall','A league register with strong team identities and reference rows.'],
'15':['Split Studio','A team rail and offset studio composition.'],
'16':['Two Editions','A public league cover and a distinct member working edition.'],
'17':['Athletic Type Broadsheet','Large athletic typography and an open broadsheet rhythm.'],
'18':['Night Practice + Paper','A bounded original-game preview leads into a readable paper working page.'],
'19':['Timeline Edition','A chronological league reading path with explicit period labels.'],
'20':['Quiet League Index','A restrained index that prioritizes destinations and useful reference.']};
const rationales={
'07':'Shorter phone preamble and personal desk; integrated five-pair board retained. Separate confidence stays visible. Directory spacing and labels tightened.',
'16':'Member identity/actions compacted; both public phone score states precede the court. Audience-specific compositions remain distinct.',
'18':'Explicit static practice-preview label, repaired enlarged-text reflow, tighter saved-decision rows and reduced repeated identity. Night-to-paper contrast retained.'};
async function group(prefix,dir){const files=(await readdir(folder)).filter(n=>new RegExp(`^${prefix}\\d\\d-captures\\.json$`).test(n)).sort();return Promise.all(files.map(async name=>{const r=JSON.parse(await readFile(`${folder}/${name}`));r.title=names[r.direction]?.[0]??r.title;r.summary=names[r.direction]?.[1]??'';r.folder=`${dir}/${r.direction}`;if(prefix==='iteration-')r.iterationRationale=rationales[r.direction];return r}))}
const directions=await group('','directions'),repairs=await group('repair-','repairs'),iterations=await group('iteration-','iterations');
await writeFile(`${folder}/gallery.json`,JSON.stringify({directions,repairs,iterations},null,2)+'\n');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const device of ['desktop','phone']){
 const tileWidth=device==='desktop'?400:220,tileHeight=device==='desktop'?360:540,columns=5,rows=Math.ceil(directions.length/columns),layers=[];
 for(const [i,d]of directions.entries()){
  const label=Buffer.from(`<svg width="${tileWidth}" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f5f4ef"/><text x="12" y="22" fill="#345b77" font-family="sans-serif" font-size="13">${d.direction} · independent first submission</text><text x="12" y="44" fill="#242d35" font-family="sans-serif" font-weight="bold" font-size="15">${escape(d.title.slice(0,device==='desktop'?42:23))}</text></svg>`);
  const x=(i%columns)*tileWidth,y=Math.floor(i/columns)*tileHeight;layers.push({input:label,left:x,top:y});
  const thumb=await sharp(`${folder}/${d.direction}-member-${device}-top.jpg`).resize({width:tileWidth-12,height:tileHeight-72,fit:'contain',background:'#ffffff'}).jpeg({quality:88}).toBuffer();layers.push({input:thumb,left:x+6,top:y+64});
 }
 await sharp({create:{width:tileWidth*columns,height:tileHeight*rows,channels:3,background:'#ffffff'}}).composite(layers).jpeg({quality:88,chromaSubsampling:'4:4:4',progressive:true}).toFile(`${folder}/contact-${device}.jpg`);
}
console.log(JSON.stringify({directions:directions.length,repairs:repairs.length,iterations:iterations.length,fullCaptures:[...directions,...repairs,...iterations].reduce((n,d)=>n+d.captures.length,0)}));
if(iterations.length===3){
 const ids=iterations.map(d=>d.direction),w=390,h=896,layers=[];
 for(const [column,id]of ids.entries())for(const [row,prefix]of ['', 'iteration-'].entries()){
  const label=Buffer.from(`<svg width="390" height="52" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ebeef0"/><text x="16" y="22" fill="#242d35" font-family="sans-serif" font-weight="bold" font-size="16">${id} · ${escape(names[id][0])}</text><text x="16" y="42" fill="#345b77" font-family="sans-serif" font-size="14">${row?'After critique · author iteration':'Before · frozen first submission'}</text></svg>`);
  layers.push({input:label,left:column*w,top:row*h});layers.push({input:await sharp(`${folder}/${prefix}${id}-member-phone-top.jpg`).toBuffer(),left:column*w,top:row*h+52});
 }
 await sharp({create:{width:w*3,height:h*2,channels:3,background:'#ffffff'}}).composite(layers).jpeg({quality:90,chromaSubsampling:'4:4:4',progressive:true}).toFile(`${folder}/comparison-phone.jpg`);
}
