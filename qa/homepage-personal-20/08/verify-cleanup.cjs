const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/08/';
const root = __dirname;
const ready = 'html[data-personal-study-ready="08"]';
const report = {
  study: '08', scope: 'Targeted removal of decorative section prefixes and redundant guest lower standings',
  method: 'Existing local Chromium / Playwright', cases: [], memberStandingSmoke: [],
  limitations: ['No unchanged member interaction matrix rerun', '200% root text is not browser zoom', 'No production/device/screen-reader verification']
};
async function closed(page, selector) {
  await page.waitForSelector('#local-inspector', {state: 'detached'});
  await page.waitForFunction(s=>document.activeElement?.matches(s), selector);
}
(async()=>{
  const browser = await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const journeys = JSON.parse(fs.readFileSync(path.join(root,'journeys.json'),'utf8')).personas.guest.firstThree;
  for(const variant of [{name:'1440',width:1440,textScale:1},{name:'1120',width:1120,textScale:1},{name:'1440-text-200',width:1440,textScale:2}]){
    const page = await browser.newPage({viewport:{width:variant.width,height:900}});
    const result={name:`guest-cleanup-${variant.name}`,viewport:{width:variant.width,height:900},textScale:variant.textScale,errors:[]};
    page.on('pageerror',error=>result.errors.push(error.message));
    try{
      await page.goto(base+'?persona=guest');await page.waitForSelector(ready);
      if(variant.textScale===2)await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      result.render=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,rootFont:getComputedStyle(document.documentElement).fontSize,labels:[...document.querySelectorAll('.section-number,#point-study .eyebrow')].map(e=>e.textContent),chartRows:document.querySelectorAll('.chart-row').length,directory:document.querySelectorAll('.directory-entry').length,lowerStandings:document.querySelectorAll('#league .standings').length,pairings:document.querySelectorAll('#league .pairing-row').length,format:document.querySelector('.league-format').innerText,images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),localAnchorTargets:[...document.querySelectorAll('a[href^="#"]')].every(a=>document.querySelector(a.getAttribute('href')))}));
      assert.equal(result.render.width,result.render.viewport);
      assert.equal(result.render.chartRows,10);assert.equal(result.render.directory,10);
      assert.equal(result.render.lowerStandings,0);assert.equal(result.render.pairings,5);
      assert.ok(result.render.format.includes('6 playoff places')&&result.render.format.includes('Week 20'));
      assert.ok(result.render.labels.every(label=>!/^0[123]\s*\//.test(label)));
      assert.ok(result.render.images&&result.render.localAnchorTargets);assert.deepEqual(result.errors,[]);
      await page.screenshot({path:path.join(root,'evidence',result.name+'.png'),fullPage:true});
      if(variant.textScale===2){await page.locator('#league').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'evidence',result.name+'-league.png')});result.leagueCapture='Viewport capture at league section; avoids Chromium tall-element fixed-position screenshot artifact';}else await page.locator('#league').screenshot({path:path.join(root,'evidence',result.name+'-league.png')});
      result.primaryActions=[];
      for(const journey of journeys){
        await page.locator(journey.selector).click();await page.waitForSelector('#local-inspector');
        assert.equal(await page.locator('#detail-heading').innerText(),journey.expected.heading);
        const content=await page.locator('#local-inspector').innerText();
        for(const expected of journey.expected.contains)assert.ok(content.includes(expected));
        assert.equal(await page.locator('#detail-heading').evaluate(e=>e===document.activeElement),true);
        if(journey.closeKey)await page.keyboard.press(journey.closeKey);else await page.locator(journey.close).click();
        await closed(page,journey.returnFocus);
        result.primaryActions.push({selector:journey.selector,heading:journey.expected.heading,returnFocus:journey.returnFocus,passed:true});
      }
      await page.locator('#pair-inspect-m4').click();
      const missing=await page.locator('#local-inspector').innerText();
      assert.ok(missing.includes('Score unavailable')&&missing.includes('not zero'));
      await page.goBack();await closed(page,'#pair-inspect-m4');
      await page.goForward();await page.waitForSelector('#local-inspector');
      await page.locator('#detail-close').click();await closed(page,'#pair-inspect-m4');
      result.passed=true;
    }catch(error){result.passed=false;result.failure=error.message;}
    report.cases.push(result);await page.close();
  }
  const baseline=JSON.parse(fs.readFileSync(path.join(root,'evidence/browser-results.json'),'utf8')).extra.find(e=>e.check==='Structure stage preserves chart geometry').normal;
  for(const persona of ['reaves','neural']){
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    await page.goto(base+'?persona='+persona);await page.waitForSelector(ready);
    const labels=await page.locator('.section-number,#point-study .eyebrow').allTextContents();
    assert.ok(labels.every(label=>!/^0[123]\s*\//.test(label)));
    assert.equal(await page.locator('#league .standing').count(),10);
    assert.equal(await page.locator('#league .pairing-row').count(),5);
    assert.equal(await page.locator('#current-pairing-inspect').count(),1);
    const geometry=await page.locator('.chart-list').boundingBox();
    if(persona==='reaves')assert.deepEqual(geometry,baseline);
    report.memberStandingSmoke.push({persona,standings:10,pairings:5,labelsUnnumbered:true,...(persona==='reaves'?{openingChartGeometryUnchanged:true,geometry}:{}),passed:true});
    await page.close();
  }
  await browser.close();
  report.passed=report.cases.every(c=>c.passed)&&report.memberStandingSmoke.every(c=>c.passed);
  report.sourceSha256=Object.fromEntries(['index.html','app.js','style.css','verify-cleanup.cjs'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));
  fs.writeFileSync(path.join(root,'evidence/cleanup-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,cases:report.cases.map(c=>({name:c.name,passed:c.passed,failure:c.failure})),memberStandingSmoke:report.memberStandingSmoke},null,2));
  if(!report.passed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
