import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const base='http://localhost:4207/qa/homepage-structures/homepage-corrections/02/';
const cases=[];const errors=[];const requests=[];
const configs=[...[1440,390,320].flatMap(width=>[100,200].map(scale=>({width,scale,view:'member',ai:'ready'}))),{width:1440,scale:100,view:'public',ai:'ready'},{width:390,scale:100,view:'public',ai:'ready'},{width:390,scale:100,view:'member',ai:'stale'},{width:390,scale:100,view:'member',ai:'missing'}];
for(const config of configs){
 const page=await browser.newPage({viewport:{width:config.width,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4207/'))requests.push(r.url());});
 await page.goto(`${base}?view=${config.view}&ai=${config.ai}`);await page.waitForFunction(()=>document.body.dataset.homepageReady==='02');
 if(config.scale===200)await page.addStyleTag({content:':root{font-size:200%}'});
 const measured=await page.evaluate(()=>({height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,visibleNotes:[...document.querySelectorAll('.field-note')].filter(n=>n.getBoundingClientRect().height>0).length,stories:document.querySelectorAll('.story').length,clubs:document.querySelectorAll('.club-preview').length,teams:document.querySelectorAll('.team-index-row').length,aiRows:document.querySelectorAll('.ai-row').length,meters:document.querySelectorAll('meter').length,privateLinks:document.querySelectorAll('a[href="/team"]').length,scrollPanes:[...document.querySelectorAll('body *')].filter(n=>['auto','scroll'].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight).map(n=>n.className),fonts:[document.fonts.check('16px "Court Oswald"'),document.fonts.check('16px "Court Space Mono"')],animations:document.getAnimations().length}));
 const paths=[];
 for(const id of ['matchup','roster','standings','edition','league','wire']){
  await page.locator(`.zone-${id}`).focus();await page.keyboard.press('Enter');
  paths.push(await page.evaluate(()=>({focus:document.activeElement.id,top:document.activeElement.getBoundingClientRect().top,bottom:document.activeElement.getBoundingClientRect().bottom}))); 
 }
 const pathPass=paths.every((p,i)=>p.focus===['matchup-title','roster-title','standings-title','edition-title','league-title','wire-title'][i]&&p.top>=0&&p.bottom<=1000);
 const pass=!measured.overflow&&measured.visibleNotes===6&&measured.stories===3&&measured.clubs===3&&measured.teams===10&&measured.aiRows===5&&measured.meters===(config.ai==='missing'?0:10)&&(config.view!=='public'||!measured.privateLinks)&&!measured.scrollPanes.length&&measured.fonts.every(Boolean)&&!measured.animations&&pathPass;
 cases.push({...config,pass,...measured,pathPass});await page.close();
}
const page=await browser.newPage({viewport:{width:320,height:1000}});await page.goto(base);await page.waitForFunction(()=>document.body.dataset.homepageReady==='02');await page.addStyleTag({content:':root{font-size:200%}'});
await page.locator('details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
const expanded=await page.evaluate(()=>({disclosures:document.querySelectorAll('details[open]').length,overflow:document.documentElement.scrollWidth>innerWidth}));
await page.locator('details').first().locator('summary').focus();await page.keyboard.press('Escape');
const escape=await page.evaluate(()=>({closed:!document.querySelector('details').open,focused:document.activeElement.tagName==='SUMMARY'}));
await page.locator('#directory-search').focus();await page.keyboard.type('Embiid');const search=await page.locator('#directory-count').textContent();
await page.locator('#directory-search').fill('');await page.locator('#directory-sort').focus();await page.keyboard.press('End');await page.keyboard.press('Enter');const sorted=await page.locator('.team-index-row').first().getAttribute('data-team');
await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.zone-roster').focus();await page.keyboard.press('Enter');const reduced=await page.evaluate(()=>({animations:document.getAnimations().length,focus:document.activeElement.id}));
await page.setViewportSize({width:1440,height:1000});await page.goto(base);await page.waitForFunction(()=>document.body.dataset.homepageReady==='02');
const facts=await page.evaluate(()=>({firstChoice:document.querySelector('.ai-choice').textContent,firstProbabilities:[...document.querySelectorAll('.ai-row:first-child .probability b')].map(n=>n.textContent),confidence:document.querySelector('.ai-row:first-child .ai-result > .small').textContent,score:document.querySelector('.court-score').textContent,previousManager:[...document.querySelectorAll('.previous')].map(n=>n.textContent).find(t=>t.includes('QBs')),minimumCourtTarget:Math.min(...[...document.querySelectorAll('.zone')].flatMap(n=>[n.getBoundingClientRect().width,n.getBoundingClientRect().height]))}));
for(const img of await page.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
const images=await page.evaluate(()=>[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})));
await page.locator('#court').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/home02-desktop.png'});
await page.locator('#edition').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/home02-edition.png'});
await page.locator('#league').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/home02-league.png'});
await page.setViewportSize({width:390,height:1000});await page.locator('#court').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/home02-phone.png'});
const sourceHashes={};for(const name of ['index.html','app.js','style.css'])sourceHashes[name]=createHash('sha256').update(await readFile(new URL(name,import.meta.url))).digest('hex');
await browser.close();
const report={fixture:base,method:'Final density correction: targeted Chromium fixture checks;200% means root font size, not browser zoom.',cases:cases.length,passed:cases.filter(c=>c.pass).length,results:cases,keyboardPaths:{count:60,passed:cases.filter(c=>c.pathPass).length*6},expanded,escape,search,sorted,reduced,facts,images,errors,remoteRequests:requests,sourceHashes};
await writeFile(new URL('CHECKS.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:report.cases,passed:report.passed,keyboardPaths:report.keyboardPaths,expanded,escape,search,sorted,reduced,facts,errors,heights:cases.map(c=>({width:c.width,scale:c.scale,view:c.view,ai:c.ai,height:c.height}))},null,2));
if(report.passed!==10||expanded.overflow||!escape.closed||!escape.focused||sorted!=='2'||reduced.animations||errors.length||requests.length||images.some(i=>!i.loaded))process.exitCode=1;
