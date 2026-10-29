import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';

const base='http://127.0.0.1:4207/qa/homepage-structures/homepage-corrections/06/';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const errors=[];
const remoteRequests=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4207/'))remoteRequests.push(request.url());});
const results={kind:'Local static synthetic fixture in Chromium',url:base,matrix:[],interaction:[],limits:['No physical device, screen reader, Safari/Firefox, live authorization or external destination integration pass.','Root font-size 32px is text enlargement, separate from the 320 CSS px reflow check.','Only local paths were opened. No production build applies to this static fixture.']};

async function load(view='member',ai='ready',width=1440,root=16){
  await page.setViewportSize({width,height:900});
  await page.goto(`${base}?view=${view}&ai=${ai}`);
  await page.waitForSelector('body[data-homepage-ready="06"]');
  await page.evaluate(async root=>{document.documentElement.style.fontSize=`${root}px`;await document.fonts.ready;},root);
}
async function geometry(){return page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,innerReaders:[...document.querySelectorAll('body *')].filter(e=>['scroll','auto'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).map(e=>e.id||e.className)}));}
try{
  for(const view of ['member','public'])for(const ai of ['ready','stale','missing'])for(const width of [1440,390,320])for(const root of [16,32]){
    await load(view,ai,width,root);
    const g=await geometry();
    assert(g.scrollWidth<=width,`${view}/${ai}/${width}/${root}: overflow ${g.scrollWidth}`);
    assert.equal(g.innerReaders.length,0);
    assert.equal(await page.locator('.franchise').count(),10);
    assert.equal(await page.locator('.ai-row').count(),ai==='missing'?0:5);
    assert.equal(await page.locator('.story').count(),3);
    assert.equal(await page.locator('.pairing-list>li').count(),5);
    assert.equal(await page.locator('.completed-list>li').count(),view==='member'?5:0);
    assert.equal(await page.locator('a[href="/team"]').count(),view==='member'?2:0);
    assert.match(await page.locator('#selected-matchup').innerText(),/0\.0[\s\S]*Pending/);
    assert.equal(await page.locator('a[href="/weekly/2026-W41"]').count(),1);
    assert.equal(await page.locator('a[href="/weekly/2026-W40"]').count(),1);
    results.matrix.push({view,ai,width,root,...g});
  }
  await load();
  assert.equal(await page.locator('.roster-list>li').count(),228);
  assert.equal(await page.locator('.value-list>li').count(),24);
  assert.equal(await page.locator('.completed-list a[href="/player/1511"]').count(),1);
  assert.match(await page.locator('.completed-list').innerText(),/Best \+ Rough/);
  assert.match(await page.locator('.ai-row').first().innerText(),/Returned choice: Ware the Hoes At\?[\s\S]*35%[\s\S]*65%[\s\S]*20%/);
  assert.match(await page.locator('.entry-draft .draft-game').innerText(),/Reaves Dropper \/ Josh Diddy’s Roster/);
  await page.locator('#pairing').focus();await page.locator('#pairing').selectOption('1');assert.equal(await page.evaluate(()=>document.activeElement.id),'pairing');
  assert.match(await page.locator('#selected-matchup').innerText(),/Stephon Castle’s Back/);
  results.interaction.push('All five current pairings are visible; pairing selection updates the lead and retains focus. Known 0.0 and null Pending remain distinct.');

  await page.locator('#register-jump').focus();const returnY=await page.evaluate(()=>scrollY);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'register');
  await page.locator('#directory-search').focus();await page.keyboard.type('Embiid');assert.equal(await page.locator('.franchise').count(),1);assert.equal(await page.locator('.roster-list>li').count(),1);assert.equal(await page.evaluate(()=>document.activeElement.id),'directory-search');
  await page.locator('#directory-search').fill('no-such-player');assert.equal(await page.locator('.franchise').count(),0);assert.match(await page.locator('#directory-results').innerText(),/No teams or players match/);
  await page.locator('#clear-search').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.franchise').count(),10);assert.equal(await page.evaluate(()=>document.activeElement.id),'directory-search');
  await page.locator('#directory-sort').selectOption('name');const names=await page.locator('.franchise-name h3>a').allTextContents();assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
  await page.locator('#directory-sort').selectOption('players');const firstPlayers=await page.locator('.franchise').first().locator('.roster-list a').allTextContents();assert.deepEqual(firstPlayers,[...firstPlayers].sort((a,b)=>a.localeCompare(b)));
  await page.locator('.roster-disclosure>summary').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.roster-disclosure').first().getAttribute('open'),'');
  await page.locator('#return-wire').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'register-jump');assert.equal(await page.evaluate(()=>scrollY),returnY);
  results.interaction.push('Keyboard jump goes to inline register; Embiid search finds one player; empty search is honest; Clear restores ten teams; team/player sorts change actual order; native roster opens with Enter; Return restores trigger focus and departure scroll.');

  await page.locator('.filter-disclosure>summary').focus();await page.keyboard.press('Enter');await page.locator('[data-scope="market"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.entry').count(),2);assert.equal(await page.locator('[data-scope="market"]').getAttribute('aria-pressed'),'true');
  await page.locator('#source-period').selectOption('october');assert.equal(await page.locator('.entry').count(),0);assert.match(await page.locator('#thread').innerText(),/No entries/);
  await page.locator('[data-reset]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.entry').count(),8);
  await page.locator('#source-period').selectOption('october');assert.equal(await page.locator('.entry').count(),2);assert.equal(await page.locator('#entry-current').count(),0);
  await page.locator('#reset-log').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.entry').count(),8);
  results.interaction.push('Keyboard scope and source-period filters expose pressed state, matching counts and an empty combination; Return to complete wire restores all eight member sections. October retains two dated editions and excludes current Week 3.');

  await page.locator('.tools>summary').focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');assert.equal(await page.locator('.tools').getAttribute('open'),null);assert.equal(await page.evaluate(()=>document.activeElement.tagName),'SUMMARY');
  await page.locator('#edition-switch').focus();await page.keyboard.press('Enter');await page.waitForSelector('body[data-homepage-ready]');assert.match(page.url(),/view=public/);assert.equal(await page.locator('a[href="/team"]').count(),0);await page.goBack();await page.waitForSelector('body[data-homepage-ready]');assert.equal(await page.locator('a[href="/team"]').count(),2);
  results.interaction.push('Menu opens with Enter and Escape restores its summary. Public edition uses the real local query URL and removes private My team actions; browser Back returns to the member URL.');

  await load('member','ready',320,32);
  await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
  const expanded=await geometry();assert(expanded.scrollWidth<=320);assert.equal(expanded.innerReaders.length,0);results.expanded320at200=expanded;
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#directory-search').fill('Embiid');assert.equal(await page.locator('.franchise').count(),1);
  results.interaction.push('All disclosures expanded together at 320 CSS px with 32px root text: no page overflow or internal reader. Live reduced-motion preference retains working search.');
  await load();
  const assets=await page.evaluate(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));return{images:document.images.length,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),fonts:[document.fonts.check('16px "Wire Reading"'),document.fonts.check('16px "Wire Dates"')]};});assert.equal(assets.broken.length,0);assert.deepEqual(assets.fonts,[true,true]);results.assets=assets;
  results.contrast=await page.evaluate(()=>{
    function luminance(color){const values=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return values[0]*.2126+values[1]*.7152+values[2]*.0722;}
    function check(label,selector,bgSelector){const element=document.querySelector(selector);const fg=getComputedStyle(element).color;const bg=getComputedStyle(document.querySelector(bgSelector)).backgroundColor;const a=luminance(fg),b=luminance(bg);return{label,fg,bg,ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2))};}
    return[check('Reading ink / canvas','body','body'),check('Secondary ink / canvas','.provenance','body'),check('Date ink / white rail','.stamp','.stamp'),check('Desk ink / white','.team-desk','.team-desk')];
  });
  for(const pair of results.contrast)assert(pair.ratio>=4.5,JSON.stringify(pair));
  assert.equal(errors.length,0);assert.equal(remoteRequests.length,0);results.pageErrors=errors;results.remoteRuntimeRequests=remoteRequests;results.passed=true;
  await writeFile(new URL('./verification.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({passed:true,matrix:results.matrix.length,interactions:results.interaction.length,assets,expanded320at200:expanded},null,2));
}finally{await browser.close();}
