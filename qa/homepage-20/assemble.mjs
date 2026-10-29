import {readFile,writeFile,readdir} from 'node:fs/promises';
import sharp from 'sharp';
const root='qa/homepage-20',folder=`${root}/evidence`;
const files=(await readdir(folder)).filter(name=>/^\d\d-captures\.json$/.test(name)).sort();
const directions=[];
for(const name of files){const r=JSON.parse(await readFile(`${folder}/${name}`));const design=await readFile(`${root}/directions/${r.direction}/DESIGN.md`,'utf8').catch(()=> '');r.title=design.match(/^#\s+(.+)$/m)?.[1]??r.title;r.summary=design.split('\n').filter(line=>line.trim()&&!line.startsWith('#')).slice(0,2).join(' ').slice(0,260);directions.push(r)}
await writeFile(`${folder}/gallery.json`,JSON.stringify({directions,iterations:[]},null,2)+'\n');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const device of ['desktop','phone']){
 const tileWidth=device==='desktop'?400:220,tileHeight=device==='desktop'?360:540,columns=5,rows=Math.ceil(directions.length/columns),layers=[];
 for(const [i,direction]of directions.entries()){
  const label=Buffer.from(`<svg width="${tileWidth}" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f5f4ef"/><text x="12" y="22" fill="#345b77" font-family="sans-serif" font-size="13">${escape(direction.direction)} · independent first submission</text><text x="12" y="44" fill="#242d35" font-family="sans-serif" font-weight="bold" font-size="15">${escape(direction.title.slice(0,device==='desktop'?42:23))}</text></svg>`);
  const x=(i%columns)*tileWidth,y=Math.floor(i/columns)*tileHeight;layers.push({input:label,left:x,top:y});
  const file=`${folder}/${direction.direction}-member-${device}-top.jpg`;
  try{const thumb=await sharp(file).resize({width:tileWidth-12,height:tileHeight-72,fit:'contain',background:'#ffffff'}).jpeg({quality:88}).toBuffer();layers.push({input:thumb,left:x+6,top:y+64})}catch{}
 }
 if(rows)await sharp({create:{width:tileWidth*columns,height:tileHeight*rows,channels:3,background:'#ffffff'}}).composite(layers).jpeg({quality:88,chromaSubsampling:'4:4:4',progressive:true}).toFile(`${folder}/contact-${device}.jpg`);
}
console.log(`Gallery: ${directions.length} initial directions, ${directions.reduce((n,d)=>n+d.captures.length,0)} full captured states.`);
