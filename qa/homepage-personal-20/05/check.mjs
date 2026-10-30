import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = process.env.GOAT05_BASE ?? 'http://127.0.0.1:4207/qa/homepage-personal-20/05/';
const own = new URL('.', import.meta.url);
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const evidence = { checkedAt:new Date().toISOString(), method:'Installed Playwright, headless Chromium, local static server. Reduced motion. Real link activation and browser Back. Enlarged text sets root font-size to 200%, not physical-device or browser-zoom evidence.', base, results:[], supplemental:[], sourceHashes:{} };
const assert = (condition,message)=>{ if(!condition)throw Error(message); };
const ready = page=>page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='05');
const geometry = page=>page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,height:document.body.scrollHeight,oversized:[...document.querySelectorAll('main *,header *,footer *')].filter(element=>{const r=element.getBoundingClientRect();return r.width>0&&(r.left<-.5||r.right>innerWidth+.5)}).map(element=>({tag:element.tagName,id:element.id,class:element.className,text:element.textContent.trim().slice(0,60)})).slice(0,10)}));
const homeState = async page=>{await ready(page);await page.waitForSelector('main[data-view="home"]');};
async function activate(page, selector, view, expected) {
  await page.locator(selector).focus();
  await page.keyboard.press('Enter');
  await ready(page);
  await page.waitForSelector(`main[data-view="${view}"]`);
  assert(await page.locator('#page-heading').evaluate(el=>el===document.activeElement),`${selector}: destination heading did not receive focus`);
  if(expected)assert((await page.locator('main').innerText()).includes(expected),`${selector}: expected ${expected}`);
  const target=await page.locator('main').getAttribute('data-view');
  const targetGeometry=await geometry(page);assert(targetGeometry.width<=targetGeometry.viewport,`${selector}: destination horizontal overflow`);
  await page.goBack();await homeState(page);
  await page.waitForFunction(id=>document.activeElement?.id===id,selector.slice(1));
  return {selector,destination:target,expected,activation:'Keyboard Enter',back:'Home restored with source-link focus',destinationWidth:targetGeometry.width};
}

try {
  for(const persona of ['reaves','neural','guest'])for(const width of [1440,1120]){
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[],external=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{const url=new URL(request.url());if(url.protocol.startsWith('http')&&url.origin!==new URL(base).origin)external.push(request.url());});
    const result={persona,width,actions:[],errors,externalRequests:external};
    try{
      await page.goto(`${base}?persona=${persona}`);await homeState(page);
      assert(await page.locator('html').getAttribute('data-persona')===persona,'wrong demo persona');
      const counts=await page.locator('.player-reading').count();
      assert(counts===(persona==='reaves'?5:persona==='neural'?3:0),'wrong visible player readings');
      result.homeGeometry=await geometry(page);assert(result.homeGeometry.width<=width,'home horizontal overflow');
      assert(result.homeGeometry.oversized.length===0,'home element overflow');
      if(persona==='guest'){
        result.actions.push(await activate(page,'#action-team','team','Reaves Dropper'));
        result.actions.push(await activate(page,'#action-standings','standings','All ten, in the mix.'));
        result.actions.push(await activate(page,'#action-matchup','matchup','Reaves Dropper vs Ware the Hoes At?'));
        assert(await page.locator('main').innerText().then(text=>!text.includes('Your team')),'guest claimed a private team');
      }else{
        result.actions.push(await activate(page,'#action-player','player',persona==='reaves'?'42.5 points':'45 points'));
        result.actions.push(await activate(page,'#action-matchup','matchup',persona==='reaves'?'56%':'NeuralNets has no returned score'));
        result.actions.push(await activate(page,'#action-standings','standings','All ten, in the mix.'));
      }
      const exits=await page.locator('footer a[href^="https://goathoopers.com"]').evaluateAll(nodes=>nodes.map(node=>new URL(node.href).pathname));
      for(const route of ['/','/news','/stocks','/history','/arcade','/teams','/transactions','/draft','/intel','/table','/ai-decides','/trade-analyzer','/weekly','/team','/login'])assert(exits.includes(route),`missing footer route ${route}`);
      result.footerRoutes=exits.length;
      await page.locator('#sources summary').focus();await page.keyboard.press('Enter');
      assert(await page.locator('#sources').getAttribute('open')!==null,'source disclosure did not open by keyboard');
      assert(await page.locator('#sources .source-content').isVisible(),'source content is hidden');
      await page.locator('#sources summary').press('Enter');
      await page.addStyleTag({content:':root{font-size:200% !important}'});
      await page.evaluate(()=>window.scrollTo(0,0));
      result.enlargedGeometry=await geometry(page);
      assert(result.enlargedGeometry.width<=width,'200% text horizontal overflow');
      assert(result.enlargedGeometry.oversized.length===0,'200% text element overflow');
      result.pass=errors.length===0&&external.length===0;
      assert(result.pass,'browser errors or external network request');
    }catch(error){result.pass=false;result.failure=String(error);}
    evidence.results.push(result);await page.close();
  }
  const page=await browser.newPage({viewport:{width:1120,height:1000},reducedMotion:'reduce'});
  await page.goto(`${base}?persona=neural&view=team&id=8`);await ready(page);
  const text=await page.locator('main').innerText();
  assert(text.includes('1,622.00')&&text.includes('16/22'),'partial quote coverage missing');
  assert((await page.locator('#roster-table tbody tr').count())===22,'wrong Neural roster size');
  assert((await page.locator('#roster-table td').filter({hasText:/^Unpriced$/}).count())===6,'wrong unpriced count');
  assert(text.includes('Under the previous manager as QBs Gremlins.'),'historical owner qualification missing');
  await page.locator('#roster-table a').filter({hasText:'AJ Dybantsa'}).click();await ready(page);
  assert(await page.locator('#player-quote').innerText()==='Unpriced','unpriced player changed to zero');
  assert(await page.locator('#player-points').innerText()==='Evidence unavailable','unknown evidence changed to zero');
  evidence.supplemental.push({check:'Neural local roster → AJ Dybantsa',pass:true,roster:22,unpriced:6,quote:'Unpriced',points:'Evidence unavailable',history:'Previous manager named'});
  await page.goto(`${base}?persona=reaves&view=team&id=1`);await ready(page);
  const reavesText=await page.locator('main').innerText();
  assert(reavesText.includes('1,095.25')&&reavesText.includes('24/24'),'Reaves quote coverage wrong');
  await page.locator('.source-box summary').click();
  assert((await page.locator('.source-box').innerText()).includes('No league value rank is asserted.'),'rank-unavailable explanation missing');
  evidence.supplemental.push({check:'Reaves value coverage and rank explanation',pass:true,quoted:'24/24',modeledFaab:'1,095.25',rank:'Unavailable, never inferred'});
  await page.goto(`${base}?persona=reaves`);await ready(page);
  await page.locator('#persona').selectOption('neural');await ready(page);
  assert(await page.locator('html').getAttribute('data-persona')==='neural','selector did not update persona');
  assert(await page.locator('.player-reading').count()===3,'selector retained former player list');
  evidence.supplemental.push({check:'Native persona select changes query/content/dataset',pass:true});
  await page.goto(`${base}?persona=reaves`);await ready(page);const normal=await geometry(page);
  await page.goto(`${base}?persona=reaves&stage=structure`);await ready(page);const structure=await geometry(page);
  assert(normal.height===structure.height&&normal.width===structure.width,'structure stage changed page geometry');
  assert(await page.locator('.brand img').evaluate(el=>getComputedStyle(el).visibility)==='hidden','structure stage did not neutralize image');
  evidence.supplemental.push({check:'Structure stage preserves geometry and neutralizes media',pass:true,height:normal.height,width:normal.width});
  await page.close();
}catch(error){evidence.supplemental.push({pass:false,failure:String(error)});}finally{
  await browser.close();
  for(const filename of ['index.html','style.css','app.js'])evidence.sourceHashes[filename]=createHash('sha256').update(await readFile(new URL(filename,own))).digest('hex');
  evidence.fixtureSha256=createHash('sha256').update(await readFile(new URL('../fixture.js',own))).digest('hex');
  evidence.pass=evidence.results.length===6&&evidence.results.every(result=>result.pass)&&evidence.supplemental.every(result=>result.pass);
  await writeFile(new URL('browser-evidence.json',own),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence,null,2));
  if(!evidence.pass)process.exitCode=1;
}
