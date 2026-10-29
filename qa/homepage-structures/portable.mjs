// @env node
// Compile reviewed local studies into independent self-contained files.
// This changes packaging and canonical outbound URLs, never page architecture.
import{readFile,writeFile,mkdir}from'node:fs/promises';import{resolve,dirname,extname,relative}from'node:path';import{createHash}from'node:crypto';import{spawnSync}from'node:child_process';import postcss from'postcss';
const root='qa/homepage-structures',phase=process.env.GOAT_STRUCT_PHASE||'wireframes',ids=process.argv.slice(2);if(!ids.length)throw Error('Pass frozen IDs');
const sha=b=>createHash('sha256').update(b).digest('hex'),cache=new Map(),mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.ttf':'font/ttf'};
let currentAssets=new Set();
async function embed(path,base){const decoded=decodeURIComponent(path),file=decoded.startsWith('/')?resolve('.'+decoded):resolve(base,decoded);if(!file.startsWith(resolve('public')+'/')&&!file.startsWith(resolve(root)+'/'))throw Error('Asset outside approved roots:'+file);if(!cache.has(file)){const b=await readFile(file);cache.set(file,{path:file,sha256:sha(b),bytes:b.length,url:`data:${mime[extname(file)]||'application/octet-stream'};base64,${b.toString('base64')}`})}currentAssets.add(file);return cache.get(file).url;}
async function assets(text,base){const matches=[...text.matchAll(/(?:\/public\/)[A-Za-z0-9_/.%-]+\.(?:png|jpg|jpeg|svg|webp|gif|woff2|ttf)/g)].map(m=>m[0]);for(const path of new Set(matches))text=text.split(path).join(await embed(path,base));return text;}
async function stylesheet(file,source,ancestry=[]){
 if(!file.startsWith(resolve(root)+'/')||ancestry.includes(file))throw Error('Invalid or cyclic local stylesheet:'+file);
 const raw=await readFile(file,'utf8');source.push({path:file,sha256:sha(raw)});const tree=postcss.parse(raw),imports=[];
 tree.walkAtRules('import',rule=>imports.push(rule));
 for(const rule of imports){
  const match=/^(?:url\(\s*)?["']([^"']+)["']\s*\)?$/.exec(rule.params);
  if(!match||/^(?:[a-z]+:|\/\/)/i.test(match[1]))throw Error('Unsupported stylesheet import:'+rule.params);
  const path=decodeURIComponent(match[1]),next=path.startsWith('/')?resolve('.'+path):resolve(dirname(file),path);
  rule.replaceWith(postcss.parse(await stylesheet(next,source,[...ancestry,file])).nodes);
 }
 let css=await assets(tree.toString(),dirname(file));
 for(const url of [...css.matchAll(/url\(["']?([^\)"']+)["']?\)/g)])if(!url[1].startsWith('data:')&&!url[1].startsWith('#'))css=css.replace(url[1],await embed(url[1],dirname(file)));
 return css;
}
function outbound(text){return text.replace(/(["'`])(\/(?:player|teams|team|stocks|intel|history|arcade|ai-decides|transactions|trade-analyzer|weekly)(?=[/\?#"'`]))/g,(_,q,path)=>q+'https://goathoopers.com'+path).replace(/href=(["'])\/\1/g,(_,q)=>'href='+q+'https://goathoopers.com/'+q);}
const outputDir=`${root}/portable/${phase}`;await mkdir(outputDir,{recursive:true});const results=[];
for(const id of ids){currentAssets=new Set();const folder=`${root}/${phase}/${id}`,source=[];let html=await readFile(`${folder}/index.html`,'utf8');source.push({path:`${folder}/index.html`,sha256:sha(html)});
 // Inlined font faces need no path-based preload; retaining it adds an external dependency.
 html=html.replace(/<link\b[^>]*>/g,tag=>/rel=["']preload["']/.test(tag)&&/as=["']font["']/.test(tag)?'':tag);
 for(const m of [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g)]){const path=m[0].match(/href=["']([^"']+)["']/)?.[1];if(!path)throw Error('Stylesheet path missing');const css=await stylesheet(resolve(folder,path),source);html=html.replace(m[0],()=>`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`);}
 const dataFile=`${root}/data.js`,dataSource=await readFile(dataFile,'utf8');source.push({path:dataFile,sha256:sha(dataSource)});let bootstrap=dataSource.replace(/export const /g,'const ');bootstrap=await assets(bootstrap,folder);
 for(const m of [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/g)]){const file=resolve(folder,m[1]);let js=await readFile(file,'utf8');source.push({path:file,sha256:sha(js)});let importCount=0;js=js.replace(/import\s*\{([^}]+)\}\s*from\s*["']\.\.\/\.\.\/data\.js["'];?/g,(_,names)=>{importCount++;return 'const {'+names.replace(/\b(\w+)\s+as\s+(\w+)\b/g,'$1:$2')+'}=__goatFactModule;'});if(importCount!==1||/^\s*import\s/m.test(js))throw Error(`Unhandled module import${id}`);js=await assets(js,folder);html=html.replace(m[0],()=>`<script type="module">${outbound('const __goatFactModule=(()=>{'+bootstrap+';return{inventory,data,mode,aiState,esc,money};})();\n'+js).replace(/<\/script/gi,'<\\/script')}</script>`);}
 html=outbound(await assets(html,folder));html=html.replace(/index\.html\?view=/g,`${id}.html?view=`);html=html.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');

 const fontCatalog=JSON.parse(await readFile(`${root}/assets/fonts/catalog.json`)),fontNotices=[];
 for(const file of currentAssets){if(!/\.(ttf|woff2)$/.test(file))continue;const known=fontCatalog.find(f=>resolve('.'+f.path)===file);if(!known)throw Error('Font provenance missing:'+file);const noticeFile=resolve(dirname(file),'OFL.txt'),notice=await readFile(noticeFile,'utf8');fontNotices.push({family:known.family,file:relative(process.cwd(),file),fontSha256:cache.get(file).sha256,source:known.source,licenseSource:known.licenseSource,license:known.license,notice,noticeSha256:sha(await readFile(noticeFile))});}
 const provenance=JSON.stringify({scope:'Isolated GOAT QA study with synthetic metrics; not production data/authentication or release approval.',fonts:fontNotices,approvedImages:[...currentAssets].filter(file=>!(/\.(ttf|woff2)$/.test(file))).map(file=>({file:relative(process.cwd(),file),sha256:cache.get(file).sha256}))}).replace(/</g,'\\u003c');
 html=html.replace('</body>',()=>`<script type="application/json" id="goat-asset-provenance">${provenance}</script></body>`);
 if(/<script[^>]+src=|<link[^>]+rel=["']stylesheet/.test(html))throw Error('Unresolved runtime source');for(const block of html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)){const syntax=spawnSync(process.execPath,['--input-type','module','--check'],{input:block[1],encoding:'utf8',maxBuffer:5*1024*1024});if(syntax.status!==0)throw Error('Portable module syntax invalid:'+id+' '+String(syntax.stderr).split('\n').filter(x=>x.includes('SyntaxError')).join(' '));}const b=Buffer.from(html);if(b.length>=10*1024*1024)throw Error('Portable exceeds10MiB:'+id);const path=`${outputDir}/${id}.html`;await writeFile(path,b);results.push({id,path,bytes:b.length,sha256:sha(b),source:source.map(x=>({...x,path:x.path.startsWith('/')?relative(process.cwd(),x.path):x.path})),assets:[...currentAssets].map(file=>cache.get(file)).map(({url,...x})=>({...x,path:relative(process.cwd(),x.path)})),packaging:'All approved image/font bytes, font notices/provenance and fact module inlined; canonical outbound goathoopers.com URLs; query public/member preserved. No new backend or production route.'});console.log(JSON.stringify({id,path,bytes:b.length}));}
const indexPath=`${outputDir}/index.json`;let prior=[];try{prior=JSON.parse(await readFile(indexPath))}catch{}const all=new Map(prior.map(x=>[x.id,x]));for(const r of results)all.set(r.id,r);await writeFile(indexPath,JSON.stringify([...all.values()].sort((a,b)=>a.id.localeCompare(b.id)),null,2)+'\n');
