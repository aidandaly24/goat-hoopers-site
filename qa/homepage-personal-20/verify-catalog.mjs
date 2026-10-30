import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root='qa/homepage-personal-20', ids=process.argv.slice(2), checks=[];
if(!ids.length||ids.some(id=>!/^\d{2}$/.test(id)||+id<1||+id>20))throw Error('Pass concept IDs 01–20');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const id of ids){
  const source=JSON.parse(await readFile(`${root}/${id}/review/observations.json`,'utf8'));
  const manifest=JSON.parse(await readFile(`${root}/catalog/portable/${id}-manifest.json`,'utf8'));
  for(const entry of manifest.sources){
    const actual=createHash('sha256').update(await readFile(entry.path)).digest('hex');
    if(actual!==entry.sha256)throw Error('Source drift since compilation: '+entry.path);
  }
  for(const persona of ['reaves','neural','guest']){
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],dependencies=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url())&&r.resourceType()!=='document')dependencies.push(r.url())});
    try{
      await page.goto(`http://127.0.0.1:4207/${root}/catalog/portable/GOAT-personal-${id}.html?persona=${persona}`);
      await page.waitForSelector(`[data-personal-study-ready="${id}"]`);
      await page.evaluate(async()=>{await document.fonts.ready;for(const image of document.images)image.loading='eager';await Promise.all([...document.images].map(image=>image.decode()))});
      const observed=await page.evaluate(()=>({text:document.querySelector('main')?.innerText.trim(),licenses:JSON.parse(document.querySelector('[data-font-licenses]').textContent).map(x=>x.family),broken:[...document.images].filter(i=>!i.naturalWidth).length,persona:document.documentElement.dataset.persona,footer:document.querySelectorAll('footer,[role=contentinfo]').length,main:document.querySelectorAll('main').length,width:innerWidth,documentWidth:document.documentElement.scrollWidth}));
      const expected=source.observations.find(o=>o.persona===persona&&o.width===1440&&o.stage==='designed').observed.mainText;
      checks.push({id,persona,pass:!errors.length&&!dependencies.length&&!observed.broken&&observed.persona===persona&&observed.text===expected&&manifest.fontLicenses.every(name=>observed.licenses.includes(name))&&observed.footer===1&&observed.main===1&&observed.documentWidth===observed.width,errors,dependencies,brokenImages:observed.broken,fontLicenses:observed.licenses,mainTextMatchesSource:observed.text===expected,documentWidth:observed.documentWidth});
    }catch(error){checks.push({id,persona,pass:false,errors:[...errors,error.message],dependencies})}
    finally{await page.close()}
  }
}}finally{await browser.close()}
await mkdir(root+'/catalog',{recursive:true});
let previous=[];try{previous=JSON.parse(await readFile(root+'/catalog/portable-verification.json','utf8')).checks}catch{}
const merged=[...previous.filter(check=>!ids.includes(check.id)),...checks].sort((a,b)=>a.id.localeCompare(b.id)||a.persona.localeCompare(b.persona));
await writeFile(root+'/catalog/portable-verification.json',JSON.stringify({method:'Actual standalone HTTP browser boots, complete source main-text parity, decoded fonts/images, embedded OFL notices and zero dependent HTTP requests for all three personas. Source hashes checked against compilation. This verifies delivery integrity, not useful journeys or visual diversity; those are separate reviews.',limits:'Headless Linux Chromium. No file-URL, mobile, live-account/backend, assistive-technology or physical-device certification.',checks:merged},null,2)+'\n');
console.log(JSON.stringify({passed:checks.filter(check=>check.pass).length,total:checks.length,failures:checks.filter(check=>!check.pass)}));
