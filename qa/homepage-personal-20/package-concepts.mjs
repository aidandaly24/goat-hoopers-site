// Delivery-only compilation. Each author retains their own complete presentation source.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';
import {createHash} from 'node:crypto';

const root='qa/homepage-personal-20', repo=process.cwd();
const ids=process.argv.slice(2);
if(!ids.length || ids.some(id=>!/^\d{2}$/.test(id)||+id<1||+id>20)) throw Error('Pass concept IDs 01–20');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=JSON.parse(await readFile(root+'/fixture.json','utf8'));
const fontCatalog=JSON.parse(await readFile('qa/homepage-structures/assets/fonts/catalog.json','utf8'));
const mime={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.webp':'image/webp'};
await mkdir(root+'/catalog/portable',{recursive:true});

async function replaceAsync(text, pattern, replace){
  const matches=[...text.matchAll(pattern)], values=await Promise.all(matches.map(replace));
  for(let i=matches.length-1;i>=0;i--) text=text.slice(0,matches[i].index)+values[i]+text.slice(matches[i].index+matches[i][0].length);
  return text;
}

for(const id of ids){
  const dir=root+'/'+id, filename=`GOAT-personal-${id}.html`;
  const embedded=new Map(), sources=new Map(), licenses=new Map();
  async function readSource(path){const bytes=await readFile(path);const relative=resolve(path).slice(repo.length+1);sources.set(relative,{path:relative,bytes:bytes.length,sha256:sha(bytes)});return bytes.toString('utf8')}
  async function uri(path, from=repo){
    const decoded=decodeURIComponent(path);
    const local=decoded.startsWith('/')?resolve(repo,'.'+decoded):resolve(from,decoded);
    if(!local.startsWith(repo+'/public/')&&!local.startsWith(repo+'/qa/')) throw Error('Unexpected asset '+local);
    if(!embedded.has(local)){
      const bytes=await readFile(local), type=mime[extname(local)];
      if(!type)throw Error('Unknown asset type '+local);
      const font=fontCatalog.find(font=>resolve(repo,'.'+font.path)===local);
      if(font)licenses.set(font.family,{family:font.family,text:await readFile(local.replace(/[^/]+$/,'OFL.txt'),'utf8')});
      embedded.set(local,{path:local.slice(repo.length+1),bytes:bytes.length,sha256:sha(bytes),uri:`data:${type};base64,${bytes.toString('base64')}`});
    }
    return embedded.get(local).uri;
  }
  async function embedObject(value){
    if(typeof value==='string'&&value.startsWith('/public/'))return uri(value);
    if(Array.isArray(value))return Promise.all(value.map(embedObject));
    if(value&&typeof value==='object')for(const key of Object.keys(value))value[key]=await embedObject(value[key]);
    return value;
  }
  const htmlSource=await readSource(dir+'/index.html'), scripts=new Map();
  for(const match of htmlSource.matchAll(/<script\b[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/g))scripts.set(match[1],await readSource(resolve(dir,match[1])));
  const data=structuredClone(fixture);
  // The optional global portrait directory duplicates roster-owned references.
  // Retain it whenever any authored script refers to it; never infer dynamic keys.
  const retainedPortraitDirectory=[...scripts.values()].some(js=>/\bportraits\b/.test(js));
  if(!retainedPortraitDirectory)delete data.portraits;
  await embedObject(data);
  const literal=JSON.stringify(data).replaceAll('<','\\u003c');
  let html=htmlSource;
  html=await replaceAsync(html,/<link\b[^>]*href=["']([^"']+\.css)["'][^>]*>/g,async match=>{
    const path=resolve(dir,match[1]);let css=await readSource(path);
    for(const font of fontCatalog)if(css.includes(font.path))licenses.set(font.family,{family:font.family,text:await readFile(resolve(repo,'.'+font.path).replace(/[^/]+$/,'OFL.txt'),'utf8')});
    css=await replaceAsync(css,/url\(["']?([^"')]+)["']?\)/g,async m=>m[1].startsWith('data:')?m[0]:`url("${await uri(m[1],dirname(path))}")`);
    return `<style>${css}</style>`;
  });
  html=await replaceAsync(html,/<script\b[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/g,async match=>{
    let js=scripts.get(match[1]);
    js=js.replace(/import\s*\{\s*fixture(?:\s+as\s+(\w+))?\s*\}\s*from\s*['"]\.\.\/fixture\.js['"];?/,(_,alias)=>`const ${alias??'fixture'}=${literal};`);
    if(/^\s*import\s/m.test(js))throw Error('Additional authored import needs reviewed bundling: '+id);
    // Keep same-document query navigation inside this standalone file.
    js=js.replace(/(['"])index\.html\1/g,(_,quote)=>quote+filename+quote);
    js=await replaceAsync(js,/(['"])(\/public\/[^'"\s]+)\1/g,async m=>m[1]+await uri(m[2])+m[1]);
    return `<script type="module">${js.replaceAll('</script','<\\/script')}</script>`;
  });
  html=await replaceAsync(html,/(\b(?:src|href)=["'])(\/(?:public|qa)\/[^"']+\.(?:svg|png|jpg|jpeg|webp))(["'])/g,async m=>m[1]+await uri(m[2])+m[3]);
  html=html.replace(/(href=["'])index\.html([?"'])/g,(_,start,end)=>start+filename+end);
  html+=`\n<script type="application/json" data-font-licenses>${JSON.stringify([...licenses.values()]).replaceAll('<','\\u003c')}</script>\n`;
  const path=root+'/catalog/portable/'+filename;await writeFile(path,html);
  const manifest={id,author:'/root/personal'+id,source:dir+'/index.html',standalone:{path,bytes:Buffer.byteLength(html),sha256:sha(html)},fixtureSha256:sha(await readFile(root+'/fixture.json')),sources:[...sources.values()],embeddedAssets:[...embedded.values()].map(({uri,...rest})=>rest),fontLicenses:[...licenses.keys()],retainedPortraitDirectory,method:'Own author source compiled without a shared presentation renderer. Data-only fixture retained, except unused global portrait directory when absent from authored scripts; roster portraits remain. Images/fonts and OFL notices embedded. Standalone navigation and rendered parity still require browser verification.'};
  await writeFile(root+`/catalog/portable/${id}-manifest.json`,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({id,standalone:manifest.standalone,fonts:manifest.fontLicenses}));
}
