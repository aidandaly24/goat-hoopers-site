import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:4207/qa/homepage-structures/polished/20/index.html';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[],requests=new Set(),checks=[],contrast=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>requests.add(new URL(request.url()).origin));
async function open(query='view=member'){await page.goto(base+'?'+query);await page.waitForFunction(()=>document.body.dataset.studyReady==='20');}
async function activate(id){await page.evaluate(id=>window.goatStudy.activate(id),id);}
async function check(name,run){await run();checks.push(name);}
try{
  await open();
  const states=await page.evaluate(()=>window.goatStudy.states.map(s=>s.id));
  assert.equal(states.length,8);
  const reflow=[];
  for(const view of ['member','public'])for(const ai of ['ready','stale','missing']){
  await open(`view=${view}&ai=${ai}`);
  for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:900});
    for(const zoom of [100,200]){
      await page.evaluate(zoom=>document.documentElement.style.fontSize=zoom+'%',zoom);
      for(const id of states){
        await activate(id);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${zoom}/${id} reflow`);
        await page.locator('#matchbook details').evaluateAll(elements=>elements.forEach(element=>element.open=true));
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${zoom}/${id} expanded reflow`);
        reflow.push({view,ai,width,rootTextPercent:zoom,state:id,defaultAndExpanded:'pass'});
      }
    }
  }
  }
  checks.push('All 8 states × member/public × ready/stale/missing × 1440/390/320 × 100%/200% root text, default and fully disclosed; 288 cases with no page overflow');
  await open();
  await page.evaluate(()=>document.documentElement.style.fontSize='100%');
  await page.setViewportSize({width:390,height:844});
  await activate('home');
  const firstChoice=await page.locator('.choice').first().boundingBox();
  assert(firstChoice.y+firstChoice.height<844,'First phone choice fits in first screen');
  checks.push('390px phone: first natural-language choice fully within 844px opening viewport');
  await check('Entry keeps branching primary; decorative study codes, section tags and negative tracking are absent',async()=>{
    assert.equal(await page.locator('#matchbook input').count(),0);
    assert.equal(await page.locator('.study-label,.book-label,.branch-label,.branch-number').count(),0);
    assert.equal(await page.locator('h2').evaluate(el=>getComputedStyle(el).letterSpacing),'normal');
    assert.equal(await page.locator(':root').evaluate(el=>getComputedStyle(el).getPropertyValue('--font-body').trim()),'"DM Sans",system-ui,sans-serif');
  });
  await check('Five saved AI returns preserve choice, both probabilities, confidence and null snapshot evidence',async()=>{
    await activate('compare');assert.equal(await page.locator('.model-pair').count(),5);
    const first=page.locator('.model-pair').first();
    assert.match(await first.textContent(),/Returned choice: Ware the Hoes At\?/);
    assert.match(await first.textContent(),/confidence 20%/);
    assert.match(await first.locator('.probabilities').textContent(),/35%Ware the Hoes At\?.*65%Reaves Dropper/);
    assert.match(await first.locator('details').textContent(),/Input snapshot: Unavailable \(null\)/);
    assert.match(await first.textContent(),/0\.0 is known; Pending is unknown/);
  });
  await check('All ten teams and standings, 228 unique player references, local sort and prior-manager attribution',async()=>{
    await activate('league');assert.equal(await page.locator('.team-directory>li').count(),10);
    assert.equal(await page.locator('.standings tbody tr').count(),10);
    assert.equal(await page.locator('.team-directory .full-roster a').evaluateAll(a=>new Set(a.map(x=>x.getAttribute('href'))).size),228);
    assert.match(await page.locator('.standings tbody tr').first().textContent(),/320\.50/);
    assert.match(await page.locator('.team-directory').textContent(),/Under the previous manager as QBs Gremlins/);
    await page.selectOption('#team-sort','name');
    assert.equal((await page.locator('.directory-heading a').first().textContent()),'Huff n’ Puff');
  });
  await check('Directory search matches team, manager and accent-insensitive player names; empty recovery restores all 228 references',async()=>{
    await activate('league');
    await page.locator('#directory-search').fill('NeuralNets');
    assert.equal(await page.locator('.team-directory>li').count(),1);
    assert.equal(await page.locator('.directory-heading a').textContent(),'NeuralNets');
    await page.locator('#directory-search').fill('Aedan23');
    assert.equal(await page.locator('.directory-heading a').textContent(),'Ware the Hoes At?');
    await page.locator('#directory-search').fill('jokic');
    assert.match(await page.locator('.search-matches').textContent(),/Nikola Jokić.*C · DEN/);
    assert.equal(await page.locator('.search-matches a').getAttribute('href'),'/player/1658');
    assert.match(await page.locator('#team-count').textContent(),/1 of 10 teams/);
    await page.selectOption('#team-sort','name');
    assert.equal(await page.locator('#directory-search').inputValue(),'jokic');
    assert.equal(new URL(page.url()).searchParams.get('q'),'jokic');
    assert.equal(new URL(page.url()).searchParams.get('sort'),'name');
    await page.locator('#directory-search').fill('no-such-fixture-person');
    assert.equal(await page.locator('.team-directory>li').count(),0);
    assert.equal(await page.locator('#directory-empty').isVisible(),true);
    await page.locator('#clear-search').click();
    assert.equal(await page.locator('#directory-search').inputValue(),'');
    assert.equal(await page.locator('.team-directory>li').count(),10);
    assert.equal(await page.locator('.team-directory .full-roster a').evaluateAll(a=>new Set(a.map(x=>x.getAttribute('href'))).size),228);
    assert.equal(await page.locator('#team-sort').inputValue(),'name');
  });
  await check('Branch Back and browser Back retain query, sort, matching roster disclosure and return focus',async()=>{
    await page.locator('#directory-search').fill('jokic');
    await page.locator('[data-state-key="roster-5"]').evaluate(el=>el.open=true);
    await page.locator('.subchoice [data-node="compare"]').click();
    assert.match(await page.locator('.path-parent').textContent(),/1 of 10 teams match “jokic”/);
    await page.locator('#back-path').click();
    assert.equal(await page.locator('#directory-search').inputValue(),'jokic');
    assert.equal(await page.locator('#team-sort').inputValue(),'name');
    assert.equal(await page.locator('[data-state-key="roster-5"]').getAttribute('open'),'');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.node),'compare');
    await page.locator('.subchoice [data-node="read"]').click();await page.goBack();
    assert.equal(await page.locator('#directory-search').inputValue(),'jokic');
    assert.equal(await page.locator('#team-sort').inputValue(),'name');
    assert.equal(await page.locator('[data-state-key="roster-5"]').getAttribute('open'),'');
    await page.locator('#clear-search').click();
  });
  await check('Search controls and player matches reflow at 320px and 200% text; query URL restores on reload',async()=>{
    await page.setViewportSize({width:320,height:900});
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    await page.locator('#directory-search').fill('jokic');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.reload();await page.waitForFunction(()=>document.body.dataset.studyReady==='20');
    assert.equal(await page.locator('#directory-search').inputValue(),'jokic');
    assert.match(await page.locator('.search-matches').textContent(),/Nikola Jokić/);
    await page.locator('#clear-search').click();
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>document.documentElement.style.fontSize='100%');
  });
  await check('Member prices retain all 24 roster values, subtotal, coverage and unavailable history',async()=>{
    await activate('prices');assert.equal(await page.locator('.current-step .data-list>li').count(),24);
    assert.match(await page.locator('.current-step').textContent(),/\$1,095\.25|\$1095\.25/);
    assert.match(await page.locator('.current-step').textContent(),/24 priced \/ 24 roster players · 0 unpriced/);
    assert.match(await page.locator('.current-step').textContent(),/Recorded team-value history unavailable/);
  });
  await check('Two dated archive chapters and three exact-stat editorial spotlights',async()=>{
    await activate('read');assert.equal(await page.locator('.editorial').count(),2);assert.equal(await page.locator('.spotlight').count(),3);
    assert.match(await page.locator('.spotlight').first().textContent(),/27\.7 PPG.*12\.9 RPG.*10\.7 APG/s);
    assert.match(await page.locator('.editorial').last().textContent(),/326\.0 \/ 251\.5/);
    assert.match(await page.locator('.editorial').first().textContent(),/Josh Diddy’s Roster · Upcoming/);
    assert.equal(await page.locator('.editorial>.data-list>li').count(),4);
    const datedWire=await page.locator('.editorial>.data-list').allTextContents();
    for(const title of ['Lonzo hits the wire','Two moves from NeuralNets','Risacher released','A rebuild to follow'])assert(datedWire.join(' ').includes(title));
  });
  await check('Branches retain context, disclosure state and focus on Back; browser Back restores parent',async()=>{
    await activate('home');await page.locator('.choice[data-node="players"]').click();
    await page.locator('.current-step>details.evidence').evaluate(el=>el.open=true);
    await page.locator('.choice[data-node="form"]').click();
    assert.equal(await page.locator('body').getAttribute('data-study-state'),'form');
    assert.match(await page.locator('.breadcrumbs').textContent(),/This week.*My players.*Form/);
    await page.locator('#back-path').click();
    assert.equal(await page.locator('body').getAttribute('data-study-state'),'players');
    assert.equal(await page.locator('.current-step>details.evidence').getAttribute('open'),'');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.node),'form');
    await page.locator('.choice[data-node="form"]').click();await page.goBack();
    assert.equal(await page.locator('body').getAttribute('data-study-state'),'players');
  });
  await check('Keyboard-operated branch index, Escape return and complete direct destinations',async()=>{
    await page.locator('#open-index').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#open-index').getAttribute('aria-expanded'),'true');
    const urls=await page.locator('#destination-index a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
    for(const url of ['/','/intel','/stocks#player-board','/history','/arcade','/arcade/free-throw','/ai-decides','/teams','/transactions','/trade-analyzer','/weekly','/team','/teams/1#team-roster'])assert(urls.includes(url),url);
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'open-index');
    await page.locator('#open-index').click();await page.locator('#destination-index [data-node="league"]').click();
    assert.equal(await page.locator('body').getAttribute('data-study-state'),'league');
    assert.equal(await page.locator('#destination-index').isVisible(),false);
    await page.locator('#provenance summary').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#provenance').getAttribute('open'),'');await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.parentElement.id),'provenance');
  });
  for(const variant of ['stale','missing']){
    await open('view=member&ai='+variant);
    assert.match(await page.locator('.compact-context').textContent(),variant==='stale'?/Saved AI stale/:/Saved AI unavailable/);
    await activate('compare');const text=await page.locator('.current-step').textContent();
    assert.match(text,variant==='stale'?/Saved AI is stale/:/Saved AI unavailable/);
    assert.equal(await page.locator('.probabilities').count(),variant==='stale'?5:0);
  }
  checks.push('Stale AI remains visibly stale; missing AI exposes no made-up probabilities, confidence or choice');
  await open('view=public');
  for(const id of states){await activate(id);assert.equal(await page.locator('#matchbook a[href="/team"]').count(),0);assert.doesNotMatch(await page.locator('#matchbook').textContent(),/1095\.25|1,095\.25|45\.0 FP/);}
  checks.push('All public views exclude personal subtotal, personal form and My team action');
  await open();
  await check('Both OFL fonts load from the approved local bytes; body and pixel display roles stay distinct',async()=>{
    for(const [file,hash]of [['dmsans/DMSans[opsz,wght].ttf','8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d'],['pressstart2p/PressStart2P-Regular.ttf','034c77f1f05ec89421e4a63f0e3a4ca1ecf852cc6d2bf611f126f275728e017d']]){
      assert.equal(createHash('sha256').update(await readFile(new URL('../../assets/fonts/'+file,import.meta.url))).digest('hex'),hash);
    }
    assert.equal(await page.evaluate(()=>document.fonts.check('16px "DM Sans"')&&document.fonts.check('16px "Press Start 2P"')),true);
    assert.match(await page.locator('.identity').evaluate(el=>getComputedStyle(el).fontFamily),/Press Start 2P/);
    assert.match(await page.locator('.choice-text').first().evaluate(el=>getComputedStyle(el).fontFamily),/DM Sans/);
  });
  await check('Actual rendered text/control paint pairs retain at least 4.5:1 across all eight states',async()=>{
    for(const id of states){
      await activate(id);await page.locator('#matchbook details').evaluateAll(es=>es.forEach(e=>e.open=true));
      const result=await page.evaluate(()=>{
        const rgb=value=>value.match(/[\d.]+/g)?.map(Number)??[];
        const luminance=v=>v.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
        const background=element=>{for(let e=element;e;e=e.parentElement){const value=getComputedStyle(e).backgroundColor,c=rgb(value);if(c.length===3||c[3]===1)return value;}return getComputedStyle(document.documentElement).backgroundColor;};
        const pairs=new Map();
        const add=(element,text)=>{const style=getComputedStyle(element),fg=style.color,bg=background(element);const a=luminance(rgb(fg)),b=luminance(rgb(bg));const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);const key=fg+'/'+bg;pairs.set(key,{foreground:fg,background:bg,ratio,text:text.trim().slice(0,65)});};
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        let node;while(node=walker.nextNode()){if(!node.textContent.trim()||node.parentElement.closest('script,style'))continue;const range=document.createRange();range.selectNodeContents(node);const rect=range.getBoundingClientRect();if(rect.width&&rect.height)add(node.parentElement,node.textContent);}
        for(const e of document.querySelectorAll('input,select'))if(e.getClientRects().length)add(e,e.value);
        return [...pairs.values()].sort((a,b)=>a.ratio-b.ratio);
      });
      for(const pair of result)assert(pair.ratio>=4.5,`${id}: ${JSON.stringify(pair)}`);
      contrast.push({state:id,pairs:result,minimum:result[0].ratio});
    }
  });
  await check('All ten face images, three editorial portraits and the actual game preview decode locally',async()=>{
    for(const id of ['league','read','tools']){await activate(id);const images=await page.locator('#matchbook img').evaluateAll(async images=>{for(const image of images){image.loading='eager';await image.decode();}return images.map(image=>({src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight}));});assert(images.every(i=>i.width>0&&i.height>0));assert.equal(images.length,id==='league'?10:id==='read'?3:1);}
  });
  await check('Desktop and phone pointer connections animate 180ms; keyboard, Back and live reduced motion preserve equivalent state/focus',async()=>{
    for(const width of [1440,390]){
      await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await activate('home');
      await page.locator('.choice[data-node="players"]').click();
      assert.equal(await page.locator('body').getAttribute('data-branch-motion'),'enter');
      assert((await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().duration===180).length))>0);
      await page.locator('.choice[data-node="form"]').press('Enter');
      assert.equal(await page.locator('body').getAttribute('data-study-state'),'form');
      assert.equal(await page.locator('body').getAttribute('data-branch-motion'),'none');
      assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
      await page.locator('#back-path').click();
      assert.equal(await page.locator('body').getAttribute('data-branch-motion'),'return');
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.node),'form');
      await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.body.dataset.branchMotion==='none');
      assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
      await page.locator('.choice[data-node="form"]').click();
      assert.equal(await page.locator('body').getAttribute('data-study-state'),'form');
      assert.equal(await page.locator('body').getAttribute('data-branch-motion'),'none');
      await page.locator('#back-path').press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.dataset.node),'form');
    }
    await page.emulateMedia({reducedMotion:'no-preference'});
  });
  await check('Supplied desktop/phone motion-demo sequences execute all branch and return actions',async()=>{
    const demo=JSON.parse(await readFile(new URL('./motion-demo.json',import.meta.url),'utf8'));
    assert(demo.desktop.length+demo.phone.length<=12);
    for(const [layout,width]of [['desktop',1440],['phone',390]]){await page.setViewportSize({width,height:900});await activate('home');for(const step of demo[layout]){assert(step.waitMs<=600);if(step.action==='click')await page.locator(step.selector).click();else if(step.action==='press')await page.locator(step.selector).press(step.key);await page.waitForTimeout(step.waitMs);}assert.equal(await page.locator('body').getAttribute('data-study-state'),'home');}
  });
  await check('Phone standalone controls and roster actions meet 44px targets; keyboard focus renders a 3px outline',async()=>{
    for(const width of [390,320]){
      await page.setViewportSize({width,height:900});
      for(const id of states){await activate(id);await page.locator('#matchbook details').evaluateAll(es=>es.forEach(e=>e.open=true));const small=await page.locator('button,summary,input,select,.identity,.full-roster a,.origin-actions a').evaluateAll(es=>es.map(e=>({name:e.textContent?.trim().slice(0,40)||e.id,rect:e.getBoundingClientRect()})).filter(e=>e.rect.width&&e.rect.height&&(e.rect.height<43.5||e.rect.width<43.5)).map(e=>({name:e.name,width:e.rect.width,height:e.rect.height})));assert.deepEqual(small,[],`${width}/${id} targets`);}
    }
    await page.locator('#open-index').focus();const focus=await page.locator('#open-index').evaluate(el=>({width:getComputedStyle(el).outlineWidth,style:getComputedStyle(el).outlineStyle}));assert.deepEqual(focus,{width:'3px',style:'solid'});
  });
  assert.deepEqual(errors,[]);assert.deepEqual([...requests],['http://127.0.0.1:4207']);
  checks.push('No browser JavaScript errors; every runtime request stays on local root 4207');
  const report={study:'20',phase:'Arcade matchbook full art',status:'pass',method:'Chromium / Playwright local static fixture',checks,reflow,contrast,errors,requestOrigins:[...requests],limits:['No production route/auth/backend verification','No screen-reader or physical-device testing','Root full-state captures and independent full-art review remain outstanding']};
  await writeFile(new URL('./checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:'pass',checks,reflowCases:reflow.length,errors},null,2));
}finally{await browser.close();}
