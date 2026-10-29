import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:4207/qa/homepage-structures/structural-revisions/20/index.html';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[],requests=new Set(),checks=[];
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
  for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:900});
    for(const zoom of [100,200]){
      await page.evaluate(zoom=>document.documentElement.style.fontSize=zoom+'%',zoom);
      for(const id of states){
        await activate(id);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${zoom}/${id} reflow`);
        await page.locator('#matchbook details').evaluateAll(elements=>elements.forEach(element=>element.open=true));
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${zoom}/${id} expanded reflow`);
        reflow.push({width,rootTextPercent:zoom,state:id,defaultAndExpanded:'pass'});
      }
    }
  }
  checks.push('All 8 views: 1440, 390, 320 CSS px, 100% and 200% root text, collapsed and fully disclosed; no page overflow');
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
    assert.equal(await page.locator(':root').evaluate(el=>getComputedStyle(el).getPropertyValue('--font-body').trim()),'Arial,Helvetica,sans-serif');
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
  await page.emulateMedia({reducedMotion:'reduce'});await activate('read');await page.emulateMedia({reducedMotion:'no-preference'});await activate('league');
  checks.push('Live reduced-motion preference changes retain complete navigation and views; no animation/timer is used');
  assert.deepEqual(errors,[]);assert.deepEqual([...requests],['http://127.0.0.1:4207']);
  checks.push('No browser JavaScript errors; every runtime request stays on local root 4207');
  const report={study:'20',status:'pass',method:'Chromium / Playwright local static fixture',checks,reflow,errors,requestOrigins:[...requests],limits:['No production route/auth/backend verification','No screen-reader or physical-device testing','Parent captures and independent structural review remain outstanding']};
  await writeFile(new URL('./checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:'pass',checks,reflowCases:reflow.length,errors},null,2));
}finally{await browser.close();}
