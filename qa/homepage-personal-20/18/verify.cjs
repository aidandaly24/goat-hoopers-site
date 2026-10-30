const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/18/';
const out = path.join(__dirname,'checks');
const results = { method:'Chromium /usr/bin/chromium via installed Playwright; localhost only', layouts:[], journeys:[], errors:[], blockedRequests:[], contrast:[] };
const expectText = async (page,selector,text) => assert.ok((await page.locator(selector).innerText()).includes(text),`${selector} should include ${text}`);

(async()=>{
  const browser = await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  page.on('pageerror',e=>results.errors.push(e.message));
  await page.route('**/*',route=>{
    if(new URL(route.request().url()).hostname==='127.0.0.1') return route.continue();
    results.blockedRequests.push(route.request().url());
    return route.abort();
  });
  async function open(persona,extra='') {
    await page.goto(base+'?persona='+persona+extra);
    await page.waitForSelector('html[data-personal-study-ready="18"]');
    assert.equal(await page.locator('html').getAttribute('data-persona'),persona);
  }
  async function homeReturned(focusId) {
    await page.locator('[data-testid="home"]').waitFor();
    await page.waitForFunction(id=>document.activeElement?.id===id,focusId);
    assert.equal(await page.evaluate(()=>Math.round(window.scrollY)),await page.evaluate(()=>Math.round(history.state.scrollY)));
  }
  for(const width of [1440,1120]) {
    await page.setViewportSize({width,height:1000});
    for(const persona of ['reaves','neural','guest']) {
      await open(persona);
      assert.equal(await page.locator('.clubs li').count(),10);
      assert.equal(await page.locator('.pairings li').count(),persona==='guest'?5:4);
      assert.equal(await page.locator('.evidence-list li').count(),persona==='reaves'?5:persona==='neural'?3:0);
      const layout = await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length,workbench:Math.round(document.querySelector('.workbench').getBoundingClientRect().height),h1:document.querySelector('h1').textContent}));
      assert.equal(layout.scrollWidth,width);assert.equal(layout.brokenImages,0);
      results.layouts.push({persona,width,textScale:'100%',...layout});
      await page.addStyleTag({content:'html{font-size:200%}'});
      const enlarged=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
      assert.equal(enlarged.scrollWidth,width);
      assert.equal(await page.locator('.metric-value').evaluateAll(items=>items.every(item=>item.scrollWidth<=item.clientWidth+1&&getComputedStyle(item).whiteSpace==='nowrap')),true);
      results.layouts.push({persona,width,textScale:'200% CSS root font enlargement',...enlarged});
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await open('reaves');
  await page.locator('#finder-input').fill('Lillard');
  await page.locator('[data-testid="finder-submit"]').click();
  await expectText(page,'#search-results','1 match');
  await page.locator('#result-1444').click();
  await expectText(page,'#detail-title','Damian Lillard');
  await expectText(page,'.detail-summary','42.5 points');
  await expectText(page,'.detail-summary','$74.00');
  await page.locator('#back-home').click();
  await homeReturned('result-1444');
  assert.equal(await page.locator('#finder-input').inputValue(),'Lillard');
  await page.locator('#finder-reset').click();
  assert.equal(await page.locator('#finder-input').inputValue(),'');
  await page.locator('[data-testid="finder-submit"]').click();
  await expectText(page,'#search-results','Enter part of a name');
  await page.locator('#finder-input').fill('no-such-player');await page.locator('[data-testid="finder-submit"]').click();
  await expectText(page,'#search-results','0 matches');
  await page.locator('#finder-input').fill('sengun');await page.locator('[data-testid="finder-submit"]').click();
  await expectText(page,'#search-results','Alperen Şengün');
  await page.locator('#finder-reset').click();
  await page.locator('#primary-inspect').click();
  await expectText(page,'#detail-title','Joel Embiid');
  await page.goBack();await homeReturned('primary-inspect');
  await page.locator('#matchup-inspect').click();
  for(const text of ['184.5 points','171 points'])await expectText(page,'.detail-summary',text);
  for(const text of ['56%','44%','Confidence: 35%','not calibrated odds'])await expectText(page,'.model',text);
  await page.locator('#back-home').click();await homeReturned('matchup-inspect');
  await page.locator('#quotes-inspect').click();
  assert.equal(await page.locator('.quote-list li').count(),24);
  await page.locator('#quote-coverage').selectOption('unpriced');
  await expectText(page,'#quote-count','0 of 24');
  await page.locator('#back-home').click();await homeReturned('quotes-inspect');
  results.journeys.push('Reaves: search Lillard → player facts → explicit Back/restored result focus/query/scroll; empty/no-match/reset and accent-insensitive Sengun search; default player → browser Back/restored focus; matchup saved estimate; 24 quotes/zero unpriced → Back.');

  await open('neural');
  await expectText(page,'[data-testid="current-game"]','Your score unavailable');
  await expectText(page,'[data-testid="current-game"]','0 recorded points');
  await page.locator('#finder-input').fill('AJ');await page.locator('[data-testid="finder-submit"]').click();
  await page.locator('#result-4866').click();
  await expectText(page,'#detail-title','AJ Dybantsa');
  await expectText(page,'.detail-summary','Unavailable');
  await expectText(page,'.detail-summary','Unpriced');
  await expectText(page,'.detail-summary','not zero points');
  await page.locator('#back-home').click();await homeReturned('result-4866');
  await page.locator('#matchup-inspect').click();
  await expectText(page,'.detail-summary','Score unavailable');
  await expectText(page,'.detail-summary','0 points');
  assert.equal(await page.locator('.model').count(),0);
  await page.locator('#back-home').click();await homeReturned('matchup-inspect');
  await page.locator('#quotes-inspect').click();
  assert.equal(await page.locator('.quote-list li').count(),22);
  await expectText(page,'.detail-summary','subtotal');await expectText(page,'.detail-summary','16 of 22');
  await page.locator('#quote-coverage').selectOption('unpriced');
  assert.equal(await page.locator('.quote-list li').count(),6);
  assert.equal(await page.locator('.quote-list .quote-value').allTextContents().then(v=>v.every(x=>x==='Unpriced')),true);
  await page.locator('#quote-search').fill('Peterson');
  await expectText(page,'#quote-count','1 of 22');
  await page.locator('#back-home').click();await homeReturned('quotes-inspect');
  results.journeys.push('Neural: score unknown/opponent recorded zero; AJ Dybantsa search → unavailable evidence/unpriced quote → Back; m4 inspection preserves null/zero/no model; 22 quotes → six unpriced → name filter → Back.');

  await open('guest');
  await expectText(page,'.workbench','Featured public club');
  assert.equal(await page.locator('.evidence-list').count(),0);
  assert.equal(await page.locator('#quotes-inspect').count(),0);
  await page.locator('#finder-input').fill('Neural');await page.locator('[data-testid="finder-submit"]').click();
  await page.locator('#result-8').click();
  await expectText(page,'#detail-title','NeuralNets');
  await expectText(page,'.detail-summary','Under the previous manager as QBs Gremlins.');
  await page.locator('#back-home').click();await homeReturned('result-8');
  await page.locator('#pair-m4').click();
  await expectText(page,'.detail-summary','Score unavailable');
  await expectText(page,'.detail-summary','0 points');
  assert.equal(await page.locator('.model').count(),0);
  await page.locator('#back-home').click();await homeReturned('pair-m4');
  await page.locator('#primary-inspect').click();await expectText(page,'#detail-title','Reaves Dropper');
  await page.locator('#back-home').click();await homeReturned('primary-inspect');
  await page.locator('#demo-persona').selectOption('neural');
  await expectText(page,'h1','NeuralNets');
  assert.equal(await page.locator('html').getAttribute('data-persona'),'neural');
  results.journeys.push('Guest: populated public club home; search Neural → public qualified historical facts → Back; m4 public inspection/no private estimate → Back; default club inspection → Back; labelled demo persona change.');

  await open('guest','&view=player&id=1511');
  await expectText(page,'#detail-title','This detail is unavailable.');
  await open('reaves','&view=player&id=1444');await expectText(page,'#detail-title','Damian Lillard');
  await page.locator('#back-home').click();await page.locator('[data-testid="home"]').waitFor();
  await open('neural','&view=quotes');
  await page.setViewportSize({width:1120,height:1000});
  await page.addStyleTag({content:'html{font-size:200%}'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),1120);
  results.journeys.push('Direct routes: valid player and direct Back; guest private-player route fails closed with recovery; enlarged Neural quote inspector has no page overflow.');

  await page.setViewportSize({width:1440,height:1000});
  await open('reaves');
  const normal=await page.locator('.workbench').boundingBox();
  await open('reaves','&stage=structure');
  const structure=await page.locator('.workbench').boundingBox();
  assert.equal(normal.width,structure.width);assert.equal(normal.height,structure.height);
  assert.equal(await page.locator('html').getAttribute('data-stage'),'structure');
  await page.emulateMedia({reducedMotion:'reduce'});
  await open('reaves');
  assert.equal(await page.locator('.evidence-list li').count(),5);
  await page.keyboard.press('Tab');
  const keyboard=await page.evaluate(()=>({focused:document.activeElement?.className,outline:getComputedStyle(document.activeElement).outlineStyle}));
  assert.equal(keyboard.focused,'skip');assert.equal(keyboard.outline,'solid');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'content');
  await page.locator('#sources summary').click();
  await expectText(page,'#sources','not real league events');
  const destinations=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../fixture.json'),'utf8')).destinations;
  for(const destination of destinations.filter(d=>d.href!=='/')) assert.ok(await page.locator('a[href="https://goathoopers.com'+destination.href+'"]').count(),destination.href+' discoverable');
  results.journeys.push('Structure mode preserves workbench geometry; reduced-motion retains content; keyboard skip link/focus; source disclosure opens; all supplied production destinations discovered.');

  function contrast(hexA,hexB) {
    const luminance=hex=>{const rgb=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
    const a=luminance(hexA),b=luminance(hexB);return Math.round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)*100)/100;
  }
  for(const [role,fg,bg] of [['body','#202235','#fffdf7'],['muted','#555866','#fffdf7'],['blue body','#e2e5ff','#2c36b7'],['workbench data','#ffffff','#2c36b7'],['button','#262337','#ffb28a'],['game muted','#555866','#e9ebff'],['league muted','#555866','#f0ecf8'],['focus outer','#a93217','#fffdf7'],['focus game','#a93217','#e9ebff'],['focus workbench','#ffcf79','#2c36b7']]) {
    const ratio=contrast(fg,bg);assert.ok(ratio>=(role.startsWith('focus')?3:4.5));results.contrast.push({role,fg,bg,ratio});
  }
  assert.deepEqual(results.errors,[]);assert.deepEqual(results.blockedRequests,[]);
  results.status='passed';
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
  await browser.close();
  console.log(JSON.stringify(results,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
