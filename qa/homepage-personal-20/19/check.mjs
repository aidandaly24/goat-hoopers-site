import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/19/index.html';
const browser = await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const results = {engine:'Chromium via Playwright; /usr/bin/chromium',layout:[],structure:[],tasks:[],errors:[]};
const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',error=>results.errors.push(error.message));
async function ready(){await page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='19');}
async function open(persona,width=1440,stage='final'){
  await page.setViewportSize({width,height:1000});
  await page.goto(`${base}?persona=${persona}${stage==='structure'?'&stage=structure':''}`);
  await ready();
}
async function measurements(){return page.evaluate(()=>({
  persona:document.documentElement.dataset.persona,
  width:innerWidth,
  scrollWidth:document.documentElement.scrollWidth,
  height:document.documentElement.scrollHeight,
  bodyFont:getComputedStyle(document.body).fontSize,
  overflow:[...document.querySelectorAll('body *')].filter(e=>{
    const r=e.getBoundingClientRect();
    return r.width>0&&(r.right>innerWidth+1||r.left< -1);
  }).map(e=>({element:e.tagName,id:e.id,cls:e.className})),
  brokenImages:[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src),
  primaryVisible:(()=>{const r=document.querySelector('#task-primary').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})(),
  evidenceStart:document.querySelector('.evidence-list li')?.getBoundingClientRect().y??null,
  header:true,
  footer:!!document.querySelector('footer nav'),
  storyBoxes:[...document.querySelectorAll('.stanza')].map(e=>{
    const r=e.getBoundingClientRect();return [e.className,Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)];
  })
}));}
try {
  for(const persona of ['reaves','neural','guest']){
    for(const width of [1440,1120]){
      await open(persona,width);
      const m=await measurements();
      assert.equal(m.persona,persona);
      assert.equal(m.scrollWidth,width);
      assert.equal(m.overflow.length,0,JSON.stringify(m.overflow));
      assert.equal(m.brokenImages.length,0);
      assert.equal(m.primaryVisible,true);
      assert.equal(m.footer,true);
      if(persona==='neural'){
        assert.equal(await page.locator('[data-testid="our-current-score"]').innerText(),'Score unavailable');
        assert.equal(await page.locator('[data-testid="opponent-current-score"]').innerText(),'0');
        assert.equal(await page.locator('[data-testid="missing-quotes"] li').count(),6);
        assert.equal(await page.locator('[data-testid="saved-estimate"]').count(),0);
      }
      if(persona==='guest'){
        assert.equal(await page.locator('[data-testid="member-stories"]').count(),0);
        assert.equal(await page.locator('[data-testid="evidence-list"]').count(),0);
        assert.equal(await page.locator('[data-testid="saved-estimate"]').count(),0);
      }
      results.layout.push({persona,width,mode:'normal',...m});
      if(width===1120){
        await page.evaluate(()=>document.documentElement.style.fontSize='200%');
        const enlarged=await measurements();
        assert.equal(enlarged.bodyFont,'32px');
        assert.equal(enlarged.scrollWidth,width);
        assert.equal(enlarged.overflow.length,0,JSON.stringify(enlarged.overflow));
        assert.ok(enlarged.height>m.height);
        results.layout.push({persona,width,mode:'200% root text',...enlarged});
      }
    }
    await open(persona,1440);
    const final=await measurements();
    await open(persona,1440,'structure');
    const structure=await measurements();
    assert.equal(structure.height,final.height);
    assert.deepEqual(structure.storyBoxes,final.storyBoxes);
    results.structure.push({persona,ready:'19',height:structure.height,geometryIdentical:true});
  }
  // Task 1: Reaves player evidence, ordinary browser Back, trigger focus.
  await open('reaves');
  await page.locator('#evidence-1444').click();await ready();
  assert.match(await page.locator('#view-heading').innerText(),/Damian Lillard/);
  assert.equal(await page.locator('[data-testid="player-evidence-points"]').innerText(),'42.5 pts');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'view-heading');
  await page.goBack();await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'evidence-1444');
  await page.locator('#inspect-opponent').click();await ready();
  assert.match(await page.locator('#view-heading').innerText(),/Ware the Hoes At/);
  assert.match(await page.locator('main').innerText(),/no player roster, player evidence, modeled quote total/);
  await page.locator('#back-to-story').click();await page.waitForURL(url=>!url.searchParams.has('view'));await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'inspect-opponent');
  results.tasks.push({task:1,result:'PASS',selectors:['#evidence-1444','#view-heading','[data-testid="player-evidence-points"]','#inspect-opponent','#back-to-story'],evidence:'Lillard 42.5 pts; browser Back restored evidence trigger; opponent public context stayed roster-free; local Back restored opponent trigger.'});

  // Task 2: NeuralNets six unknown prices, player detail, Back and real filters.
  await open('neural',1120);
  await page.locator('#task-primary').click();await ready();
  assert.match(await page.locator('#view-heading').innerText(),/Giannis Antetokounmpo/);
  assert.equal(await page.locator('[data-testid="player-evidence-points"]').innerText(),'45 pts');
  await page.locator('#back-to-story').click();await page.waitForURL(url=>!url.searchParams.has('view'));await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'task-primary');
  await page.locator('#inspect-unpriced').click();await ready();
  assert.equal(await page.locator('[data-testid="quote-table"] tbody tr').count(),6);
  assert.match(await page.locator('[data-testid="quote-count"]').innerText(),/6 of 22.*Unpriced only/);
  await page.locator('#quote-player-4866').click();await ready();
  assert.equal(await page.locator('[data-testid="player-quote"]').innerText(),'Unpriced');
  assert.equal(await page.locator('[data-testid="player-evidence-points"]').innerText(),'Not included in this sample');
  await page.locator('#back-to-story').click();await page.waitForURL(url=>url.searchParams.get('view')==='quotes');await ready();
  assert.equal(await page.locator('[data-testid="quote-table"] tbody tr').count(),6);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'quote-player-4866');
  await page.locator('#quote-filter').selectOption('all');
  assert.equal(await page.locator('[data-testid="quote-table"] tbody tr').count(),22);
  await page.locator('#quote-search').fill('Giannis');
  assert.equal(await page.locator('[data-testid="quote-table"] tbody tr').count(),1);
  assert.match(await page.locator('[data-testid="quote-table"]').innerText(),/135\.50/);
  await page.locator('#quote-search').fill('no such player');
  assert.match(await page.locator('#quote-results').innerText(),/No players match/);
  results.tasks.push({task:2,result:'PASS',selectors:['#task-primary','#inspect-unpriced','#quote-player-4866','#quote-filter','#quote-search','[data-testid="quote-count"]'],evidence:'Giannis 45 pts primary action and Back; supporting action showed six unpriced rows; AJ Dybantsa unpriced and evidence unavailable; Back restored six-row filter/focus; All showed 22; Giannis search showed 135.50; no-match state worked.'});

  // Task 3: Guest public context, qualifier, league navigation and sign-in exit.
  await open('guest');
  await page.locator('#inspect-opponent').click();await ready();
  assert.match(await page.locator('#view-heading').innerText(),/Ware the Hoes At/);
  assert.equal(await page.locator('#team-own-quotes').count(),0);
  await page.locator('#back-to-story').click();await page.waitForURL(url=>!url.searchParams.has('view'));await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'inspect-opponent');
  await page.locator('#league-team-8').click();await ready();
  assert.match(await page.locator('main').innerText(),/Under the previous manager as QBs Gremlins/);
  assert.equal(await page.locator('[data-testid="team-current-score"]').innerText(),'Score unavailable');
  assert.equal(await page.locator('#team-own-quotes').count(),0);
  assert.ok(await page.locator('a[href="https://goathoopers.com/login"]').count());
  results.tasks.push({task:3,result:'PASS',selectors:['#inspect-opponent','#back-to-story','#league-team-8','[data-testid="team-current-score"]','a[href="https://goathoopers.com/login"]'],evidence:'Guest public context contained no roster quote action; Back restored trigger; NeuralNets history retained previous-manager qualification; missing score stayed unavailable; real sign-in destination discoverable.'});

  // Native persona control and exact membership-free query semantics.
  await open('reaves');
  await page.locator('#persona').selectOption('neural');await ready();
  assert.equal(new URL(page.url()).searchParams.get('persona'),'neural');
  assert.equal(await page.locator('#our-name').innerText(),'NeuralNets');
  await open('reaves');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.className),'skip');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
  await page.locator('#task-primary').focus();
  await page.keyboard.press('Enter');await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'view-heading');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'back-to-story');
  const outline=await page.locator('#back-to-story').evaluate(e=>getComputedStyle(e).outlineWidth);
  assert.equal(outline,'3px');
  await page.keyboard.press('Enter');await page.waitForURL(url=>!url.searchParams.has('view'));await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'task-primary');
  results.keyboard={result:'PASS',evidence:'Tab revealed skip link; Enter focused main; Enter activated player inspection; Shift+Tab reached Back with a 3px focus outline; Enter restored the primary trigger.'};
  assert.equal(results.errors.length,0,results.errors.join('\n'));
  results.status='PASS';
} catch(error){results.status='FAIL';results.failure=error.stack;throw error;}
finally {await writeFile(new URL('./checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({status:results.status,layoutChecks:results.layout.length,structureChecks:results.structure.length,taskChecks:results.tasks.length,pageErrors:results.errors.length}));
