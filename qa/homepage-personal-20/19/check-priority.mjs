import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base='http://127.0.0.1:4207/qa/homepage-personal-20/19/index.html?persona=neural';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const report={scope:'Neural opening priority, changed action/Back/focus and reflow only',engine:'Chromium via existing Playwright',layouts:[],tasks:[],errors:[]};
page.on('pageerror',error=>report.errors.push(error.message));
const ready=()=>page.waitForFunction(()=>document.documentElement.dataset.personalStudyReady==='19');
async function measure(){return page.evaluate(()=>({
  width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
  intro:document.querySelector('.our-intro').innerText,
  bodyFont:getComputedStyle(document.body).fontSize,
  primaryHref:document.querySelector('#task-primary').getAttribute('href'),
  primaryText:document.querySelector('#task-primary').innerText,
  primaryBottom:Math.round(document.querySelector('#task-primary').getBoundingClientRect().bottom),
  overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1);}).map(e=>e.id||e.className||e.tagName),
  rectangles:[...document.querySelectorAll('.stanza')].map(e=>{const r=e.getBoundingClientRect();return [e.className,Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)];})
}));}
try{
  for(const width of [1440,1120]){
    await page.setViewportSize({width,height:900});
    await page.goto(base);await ready();
    const m=await measure();
    assert.match(m.intro,/Giannis Antetokounmpo has 45 counted-game points in synthetic completed Week 2/);
    assert.doesNotMatch(m.intro,/missing|unpriced/i);
    assert.equal(m.primaryText,'Inspect Giannis’ Week 2 sample');
    assert.match(m.primaryHref,/view=player&id=1380/);
    assert.ok(m.primaryBottom<=900);
    assert.equal(m.scrollWidth,width);assert.equal(m.overflow.length,0);
    assert.equal(await page.locator('.our-intro #inspect-unpriced').count(),0);
    assert.equal(await page.locator('[data-testid="missing-quotes"] li').count(),6);
    assert.match(await page.locator('#inspect-unpriced').getAttribute('href'),/filter=unpriced/);
    report.layouts.push({mode:'normal',...m});
    await page.screenshot({path:new URL(`./priority-opening-${width}.png`,import.meta.url).pathname});
    if(width===1120){
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      const enlarged=await measure();
      assert.equal(enlarged.bodyFont,'32px');assert.equal(enlarged.scrollWidth,width);assert.equal(enlarged.overflow.length,0);assert.ok(enlarged.height>m.height);
      report.layouts.push({mode:'200% root text',...enlarged});
    }
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base);await ready();
  const final=await measure();
  await page.goto(base+'&stage=structure');await ready();
  const structure=await measure();
  assert.deepEqual(structure.rectangles,final.rectangles);assert.equal(structure.height,final.height);
  report.structure={persona:'neural',width:1440,geometryIdentical:true};

  await page.goto(base);await ready();
  await page.locator('#task-primary').focus();await page.keyboard.press('Enter');await ready();
  assert.equal(await page.locator('#view-heading').innerText(),'Giannis Antetokounmpo');
  assert.equal(await page.locator('[data-testid="player-evidence-points"]').innerText(),'45 pts');
  assert.match(await page.locator('main').innerText(),/Synthetic completed Week 2/);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'view-heading');
  await page.locator('#back-to-story').click();await page.waitForURL(url=>!url.searchParams.has('view'));await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'task-primary');
  await page.locator('#task-primary').click();await ready();
  await page.goBack();await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'task-primary');
  report.tasks.push({result:'PASS',selectors:['#task-primary','#view-heading','[data-testid="player-evidence-points"]','#back-to-story'],evidence:'Keyboard activation opens Giannis 45 pts in synthetic completed Week 2; local Back and browser Back both restore primary-action focus.'});

  await page.locator('#inspect-unpriced').click();await ready();
  assert.match(await page.locator('[data-testid="quote-count"]').innerText(),/6 of 22.*Unpriced only/);
  assert.equal(await page.locator('[data-testid="quote-table"] tbody tr').count(),6);
  await page.locator('#back-to-story').click();await page.waitForURL(url=>!url.searchParams.has('view'));await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'inspect-unpriced');
  report.tasks.push({result:'PASS',selectors:['#inspect-unpriced','[data-testid="quote-count"]','#back-to-story'],evidence:'Lower supporting quote action still opens six unpriced players; Back restores that supporting link and reading position.'});
  assert.equal(report.errors.length,0);
  report.status='PASS';
}catch(error){report.status='FAIL';report.failure=error.stack;throw error;}
finally{await writeFile(new URL('./priority-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({status:report.status,layoutChecks:report.layouts.length,structureChecks:1,changedTaskChecks:report.tasks.length,pageErrors:report.errors.length}));
