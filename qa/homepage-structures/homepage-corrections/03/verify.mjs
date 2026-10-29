import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = 'http://localhost:4207/qa/homepage-structures/homepage-corrections/03/';
const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', headless:true, args:['--no-sandbox'] });
const report = { url:base, date:new Date().toISOString(), scenarios:[], expanded:[], interactions:[], errors:[], hashes:{} };
const openPage = async (width,view='member',ai='ready',hash='') => {
  const page = await browser.newPage({viewport:{width,height:844}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(`${base}?view=${view}&ai=${ai}${hash}`);
  await page.waitForFunction(()=>document.documentElement.dataset.homepageReady==='03');
  return page;
};
const measure = async page => page.evaluate(() => ({
  viewport:innerWidth,
  width:document.documentElement.scrollWidth,
  height:document.documentElement.scrollHeight,
  readers:[...document.querySelectorAll('main *')].filter(e=>{
    const s=getComputedStyle(e);
    return ['auto','scroll'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight+1;
  }).map(e=>e.className),
  inert:document.querySelectorAll('[inert]').length,
  sections:[...document.querySelectorAll('main>section')].map(e=>({id:e.id,visible:getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0})),
  pairs:document.querySelectorAll('.pair-row').length,
  standings:document.querySelectorAll('.standing-table tbody tr').length,
  franchises:document.querySelectorAll('.franchise').length,
  stories:document.querySelectorAll('.player-story').length,
  probabilities:document.querySelectorAll('.probabilities').length,
  club:!!document.querySelector('#club'),
  scout:!!document.querySelector('#scout'),
  knownZero:document.querySelector('.feature-match').textContent.includes('0.0'),
  pending:document.querySelector('.feature-match').textContent.includes('Pending'),
}));
const assertLayout = r => {
  assert.ok(r.width<=r.viewport+1,`Overflow ${JSON.stringify(r)}`);
  assert.deepEqual(r.readers,[]);
  assert.equal(r.inert,0);
  assert.ok(r.sections.every(s=>s.visible));
};

try {
  for(const view of ['member','public']) for(const ai of ['ready','stale','missing']) for(const width of [1440,390,320]) for(const text of [100,200]) {
    const page=await openPage(width,view,ai);
    await page.evaluate(text=>document.documentElement.style.fontSize=`${text}%`,text);
    const r={view,ai,text,...await measure(page)};
    assertLayout(r);
    assert.equal(r.pairs,5); assert.equal(r.standings,10); assert.equal(r.franchises,10); assert.equal(r.stories,3);
    assert.equal(r.club,view==='member'); assert.equal(r.scout,view==='member');
    assert.equal(r.probabilities,ai==='missing'?0:5); assert.ok(r.knownZero&&r.pending);
    if(ai==='stale') assert.equal(await page.locator('.saved-choice').filter({hasText:'Stale saved choice'}).count(),5);
    report.scenarios.push(r);
    if(ai==='ready') {
      await page.evaluate(()=>document.querySelectorAll('main details').forEach(d=>d.open=true));
      const expanded={view,width,text,...await measure(page)};
      assertLayout(expanded);
      assert.equal(await page.locator('.roster-list li').count(),228);
      if(view==='member')assert.equal(await page.locator('.value-row').count(),24);
      report.expanded.push(expanded);
    }
    await page.close();
  }

  for(const width of [1440,390,320]) for(const view of ['member','public']) {
    const page=await openPage(width,view);
    const link=page.locator('.contents a[href="#league"]');
    await link.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(()=>location.hash==='#league');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'league');
    assert.ok(Math.abs(await page.locator('#league').evaluate(e=>e.getBoundingClientRect().top)-32)<2);
    await page.keyboard.press('Tab');
    const focus=await page.evaluate(()=>({visible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outlineWidth,top:document.activeElement.getBoundingClientRect().top}));
    assert.ok(focus.visible&&focus.outline==='3px'&&focus.top>=0);
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>location.hash==='#contents');
    await page.goBack();
    await page.waitForFunction(()=>location.hash==='#league');
    await page.waitForTimeout(80);
    assert.ok(Math.abs(await page.locator('#league').evaluate(e=>e.getBoundingClientRect().top)-32)<2);
    const search=page.locator('#roster-search');
    await search.fill('AJ Dybantsa');
    assert.equal(await page.locator('.franchise:visible').count(),1);
    await search.fill('no-such-fixture-player');
    assert.ok(await page.locator('#roster-empty').isVisible());
    await search.fill('');
    assert.equal(await page.locator('.franchise:visible').count(),10);
    const roster=page.locator('.roster-details summary').first();
    await roster.focus(); await page.keyboard.press('Enter');
    assert.ok(await roster.evaluate(e=>e.parentElement.open));
    await page.keyboard.press('Escape');
    assert.ok(await roster.evaluate(e=>!e.parentElement.open&&document.activeElement===e));
    const provenance=page.locator('#concept-provenance summary');
    await provenance.focus(); await page.keyboard.press('Enter');
    assert.ok(await provenance.evaluate(e=>e.parentElement.open));
    await page.keyboard.press('Escape');
    assert.ok(await provenance.evaluate(e=>!e.parentElement.open&&document.activeElement===e));
    report.interactions.push({width,view,keyboardAnchor:true,back:true,focus,search:true,roster:true,provenanceEscape:true});
    await page.close();
  }
  for(const view of ['member','public']) {
    const page=await openPage(390,view,'ready','#archive');
    await page.waitForTimeout(80);
    assert.ok(Math.abs(await page.locator('#archive').evaluate(e=>e.getBoundingClientRect().top)-32)<2);
    report.interactions.push({view,directArchive:true});
    await page.close();
  }
  const evidence=await openPage(1440);
  await evidence.locator('.evidence summary').first().click();
  const saved=await evidence.locator('.evidence').first().innerText();
  assert.ok(saved.includes('35%')&&saved.includes('65%')&&saved.includes('20%')&&saved.includes('Not supplied (null)'));
  assert.ok(saved.includes('fixture-model')&&saved.includes('fixture-prompt'));
  assert.equal(await evidence.locator('.final-score').innerText().then(t=>t.includes('326.0')&&t.includes('251.5')),true);
  await evidence.locator('.roster-details').nth(7).evaluate(d=>d.open=true);
  assert.ok(await evidence.locator('.roster-details').nth(7).innerText().then(t=>t.includes('previous manager as QBs Gremlins')));
  const fonts=await evidence.evaluate(()=>({display:document.fonts.check('16px "Programme Display"'),reading:document.fonts.check('16px "Programme Reading"')}));
  assert.ok(fonts.display&&fonts.reading);
  report.interactions.push({savedChoiceEvidence:true,historicalFinal:true,previousManager:true,fonts});
  await evidence.close();
  assert.deepEqual(report.errors,[]);
  for(const file of ['index.html','homepage.js','homepage.css','verify.mjs']) report.hashes[file]=createHash('sha256').update(await readFile(new URL(file,import.meta.url))).digest('hex');
  report.status='passed';
} finally {
  await browser.close();
  await writeFile(new URL('verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({status:report.status,scenarios:report.scenarios.length,expanded:report.expanded.length,interactionRecords:report.interactions.length,errors:report.errors}));
