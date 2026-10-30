import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:4207/qa/homepage-personal-20/03/';
const allResults=[];
const expectedPaths=['/','/news','/stocks','/history','/arcade','/teams','/transactions','/draft','/intel','/table','/ai-decides','/trade-analyzer','/weekly','/team','/login'];
async function ready(page,view='home'){await page.waitForFunction(v=>document.documentElement.dataset.personalStudyReady==='03'&&document.documentElement.dataset.view===v,view);}
for(const persona of ['reaves','neural','guest'])for(const width of [1440,1120]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  const errors=[],failedRequests=[],remoteRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failedRequests.push(r.url()));
  page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4207/'))remoteRequests.push(r.url());});
  const checks={},metrics={},failures=[];
  const check=(name,value)=>{checks[name]=!!value;if(!value)failures.push(name);};
  const open=async(view='home',extra='')=>{await page.goto(`${base}?persona=${persona}${view==='home'?'':`&view=${view}`}${extra}`);await ready(page,view);};
  const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await open();
  metrics.home=await page.evaluate(()=>({persona:document.documentElement.dataset.persona,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,heading:document.querySelector('h1').textContent,rosterRows:document.querySelectorAll('[data-roster-name]').length,standingsRows:document.querySelectorAll('.standings-table tbody tr').length,ownedPortraits:document.querySelectorAll('.portrait-stage img,.support-portrait img').length,publicPairings:document.querySelectorAll('.pairings-list li').length}));
  check('homeHasNoHorizontalOverflow',!await overflow());
  check('homeDoesNotPrintFullRosterOrStandings',metrics.home.rosterRows===0&&metrics.home.standingsRows===0);
  check('allRequiredExternalDestinationsDiscoverable',await page.evaluate(paths=>{const found=new Set([...document.querySelectorAll('a[href^="https://goathoopers.com"]')].map(a=>new URL(a.href).pathname));return paths.every(p=>found.has(p));},expectedPaths));
  check('externalExitLabelsAndSVG',await page.locator('a[href^="https://goathoopers.com"]').evaluateAll(links=>links.every(a=>a.getAttribute('aria-label')?.includes('leaves prototype')&&a.querySelector('svg.exit-icon'))));
  check('allImagesLoaded',await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
  await page.locator('#source-trigger').click();check('sourceModalOpens',await page.locator('#sources').evaluate(e=>e.open));await page.keyboard.press('Escape');
  check('sourceEscapeReturnsFocus',await page.locator('#source-trigger').evaluate(e=>document.activeElement===e&&!document.querySelector('#sources').open));
  const homeHeight=metrics.home.height;
  if(persona!=='guest'){
    check('selectedOwnedPortraitsVisible',metrics.home.ownedPortraits===2);
    check('firstThreeActionsAreManagerTasks',await page.locator('.next-stops strong').allTextContents().then(t=>JSON.stringify(t)===JSON.stringify(['Open your matchup','Browse your roster','Follow the league'])));
    await page.locator('#lead-player').focus();await page.keyboard.press('Enter');await ready(page,'player');
    check('leadPlayerOpensByKeyboard',await page.locator('h1').textContent().then(t=>t===(persona==='reaves'?'Joel Embiid':'Giannis Antetokounmpo')));
    check('destinationHeadingReceivesFocus',await page.locator('h1').evaluate(e=>document.activeElement===e));
    await page.goBack();await ready(page);check('browserBackReturnsToFeatureLink',await page.locator('#lead-player').evaluate(e=>document.activeElement===e));
    await page.locator('#next-2').click();await ready(page,'roster');
    metrics.rosterRows=await page.locator('[data-roster-name]').count();check('completeRosterAvailableOnLocalDestination',metrics.rosterRows===(persona==='reaves'?24:22));
    await page.locator('#roster-search').fill(persona==='reaves'?'Derrick':'Giannis');check('rosterSearchFindsOnePlayer',await page.locator('[data-roster-name]:visible').count()===1);
    const target=persona==='reaves'?'1830':'1380';await page.locator(`#roster-player-${target}`).click();await ready(page,'player');
    await page.locator('[data-back]').click();await ready(page,'roster');
    check('detailBackRestoresRosterFilter',await page.locator('#roster-search').inputValue()===(persona==='reaves'?'Derrick':'Giannis')&&await page.locator('[data-roster-name]:visible').count()===1);
    check('detailBackRestoresPlayerLinkFocus',await page.locator(`#roster-player-${target}`).evaluate(e=>document.activeElement===e));
    await page.locator('#roster-search').fill('no-such-player');check('emptySearchHasReadableState',await page.locator('#empty-search').isVisible());await page.locator('#roster-search').fill('');
    if(persona==='neural'){
      await page.locator('#roster-player-4866').click();await ready(page,'player');check('missingPlayerValuesRemainUnknown',await page.locator('.profile-facts').textContent().then(t=>t.includes('Quote unavailable')&&t.includes('No counted sample')));await page.locator('[data-back]').click();await ready(page,'roster');
    }
    await page.locator('#nav-week').click();await ready(page,'matchup');
    check('correctPersonalMatchup',await page.locator('h1').textContent().then(t=>persona==='reaves'?t.includes('Reaves Dropper vs Ware the Hoes At?'):t.includes('papichooter vs NeuralNets')));
    check('matchupHasNoHorizontalOverflow',!await overflow());
    if(persona==='neural'){
      check('partialScoreDoesNotInferLeader',await page.locator('.comparison-board').textContent().then(t=>t.includes('No leader can be determined')&&t.includes('Score unavailable')&&t.includes('recorded zero')));
      check('noInventedModelPercentages',await page.locator('.model-probabilities').count()===0);
    }else{
      await page.locator('.model-details summary').click();check('savedModelShowsSeparateConfidence',await page.locator('.model-details').textContent().then(t=>t.includes('56%')&&t.includes('44%')&&t.includes('0.35')&&t.includes('not calibrated odds')));
    }
  }else{
    check('guestHasNoClaimedPrivateRoster',await page.locator('#nav-roster').isHidden()&&metrics.home.ownedPortraits===0&&await page.locator('#lead-player').count()===0);
    check('guestInitiallyShowsAllFivePairings',await page.locator('.guest-pairings .pairings-list li').count()===5);
    check('guestHistoricalFeatureHasPeriodQualification',await page.locator('.public-cover').textContent().then(t=>t.includes('2025 final')&&t.includes('retained 2025 final reference')&&t.includes('not a photo')));
    await page.locator('#guest-pair-m4').click();await ready(page,'matchup');check('guestCanReadPartialPairing',await page.locator('.comparison-board').textContent().then(t=>t.includes('No leader can be determined')));await page.goBack();await ready(page);check('guestBrowserBackReturnsPairingFocus',await page.locator('#guest-pair-m4').evaluate(e=>document.activeElement===e));
  }
  await page.locator('#nav-league').click();await ready(page,'league');check('fullStandingsHasTenTeams',await page.locator('.standings-table tbody tr').count()===10);
  await page.locator('#table-team-8').click();await ready(page,'team');check('teamHistoryPreservesPreviousManager',await page.locator('.team-history').textContent().then(t=>t.includes('previous manager as QBs Gremlins')));await page.locator('[data-back]').click();await ready(page,'league');check('teamBackReturnsToLeagueLinkFocus',await page.locator('#table-team-8').evaluate(e=>document.activeElement===e));
  await open();await page.evaluate(()=>document.documentElement.style.fontSize='150%');metrics.enlargedHome=await page.evaluate(()=>({rootSize:getComputedStyle(document.documentElement).fontSize,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,height:document.documentElement.scrollHeight}));check('enlargedHomeHasNoHorizontalOverflow',!await overflow());check('enlargedTextGrowsDocument',metrics.enlargedHome.height>homeHeight);await page.evaluate(()=>document.documentElement.style.fontSize='');
  for(const view of persona==='guest'?['league','matchup']:['roster','matchup','player']){
    const extra=view==='player'?`&player=${persona==='reaves'?'1511':'1380'}`:'';await open(view,extra);await page.evaluate(()=>document.documentElement.style.fontSize='150%');check(`enlarged${view}HasNoHorizontalOverflow`,!await overflow());await page.evaluate(()=>document.documentElement.style.fontSize='');
  }
  await page.goto(`${base}?persona=${persona}&stage=structure`);await ready(page);metrics.structure=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,stage:document.documentElement.dataset.stage}));check('structurePreservesHomeHeight',metrics.structure.height===homeHeight);check('structureHasNoHorizontalOverflow',!await overflow());check('noPageErrors',errors.length===0);check('noFailedRequests',failedRequests.length===0);check('noRemoteRequests',remoteRequests.length===0);
  allResults.push({persona,width,checks,metrics,failures,errors,failedRequests,remoteRequests});await page.close();
}
await browser.close();
const report={revision:'Editorial revision after parent visual/product gate; supersedes the pale notebook checks.',method:'System Chromium via localhost. Three personas at 1440/1120 CSS px, reduced motion; 150% root text enlargement; normal/structure geometry; local URL destinations and real Back/focus flows. Not production or live-service evidence.',results:allResults};
await writeFile(new URL('./browser-evidence.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(allResults.map(r=>({persona:r.persona,width:r.width,failures:r.failures,metrics:r.metrics})),null,2));
if(allResults.some(r=>r.failures.length))process.exitCode=1;
