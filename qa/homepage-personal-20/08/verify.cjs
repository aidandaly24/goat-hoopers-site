const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = __dirname;
const evidence = path.join(root, 'evidence');
const fixture = JSON.parse(fs.readFileSync(path.join(root, '../fixture.json'), 'utf8'));
const base = 'http://127.0.0.1:4207/qa/homepage-personal-20/08/';
fs.mkdirSync(evidence, { recursive: true });
const report = { study: '08', method: 'Chromium via existing Playwright; local fixture only', url: base, cases: [], extra: [], limitations: ['No physical-device or screen-reader pass', '200% text means the root font size is doubled; it is not browser zoom', 'Current-site exits verified by href and visible labelling; not followed'] };
const journeys = {
  schema: 'goat-homepage-journeys-v1', study: '08', baseUrl: base,
  readySelector: 'html[data-personal-study-ready="08"]', personaSelector: '#demo-persona',
  localInspector: '#local-inspector', inspectorHeading: '#detail-heading', close: '#detail-close',
  personas: {
    reaves: { query: '?persona=reaves', firstThree: [
      { action: 'Read an owned player record', selector: '#primary-1', expected: { heading: 'Damian Lillard', contains: ['42.5 points', '74 modeled FAAB', 'Synthetic completed Week 2'] }, close: '#detail-close', returnFocus: '#primary-1' },
      { action: 'Find and inspect another owned player', selector: '#primary-2', expectedFocus: '#player-search', input: { selector: '#player-search', value: 'Austin Reaves' }, result: '#search-player-2316', expected: { heading: 'Austin Reaves', contains: ['No supplied observation', '35 modeled FAAB'] }, closeKey: 'Escape', returnFocus: '#search-player-2316', clear: '#clear-search' },
      { action: 'Inspect the actual opponent', selector: '#primary-3', expected: { heading: 'Reaves Dropper versus Ware the Hoes At?', contains: ['184.5', '171', 'Saved estimate: Reaves 56%'] }, close: '#detail-close', returnFocus: '#primary-3' }
    ] },
    neural: { query: '?persona=neural', firstThree: [
      { action: 'Read an owned player record', selector: '#primary-1', expected: { heading: 'Giannis Antetokounmpo', contains: ['45 points', '135.5 modeled FAAB', 'Synthetic completed Week 2'] }, close: '#detail-close', returnFocus: '#primary-1' },
      { action: 'Find and inspect another owned player', selector: '#primary-2', expectedFocus: '#player-search', input: { selector: '#player-search', value: 'LaMelo Ball' }, result: '#search-player-2179', expected: { heading: 'LaMelo Ball', contains: ['No supplied observation', '77.75 modeled FAAB'] }, closeKey: 'Escape', returnFocus: '#search-player-2179', clear: '#clear-search' },
      { action: 'Inspect the actual opponent', selector: '#primary-3', expected: { heading: 'papichooter versus NeuralNets', contains: ['Score unavailable', 'No saved model estimate supplied', 'no leader or tie'] }, close: '#detail-close', returnFocus: '#primary-3' }
    ] },
    guest: { query: '?persona=guest', firstThree: [
      { action: 'Inspect public team context', selector: '#primary-1', expected: { heading: 'Reaves Dropper', contains: ['current synthetic position', 'Current 2026 record'] }, close: '#detail-close', returnFocus: '#primary-1' },
      { action: 'Inspect a public pairing', selector: '#primary-2', expected: { heading: 'Reaves Dropper versus Ware the Hoes At?', contains: ['184.5', '171', 'not a completed result'] }, close: '#detail-close', returnFocus: '#primary-2' },
      { action: 'Read qualified franchise history', selector: '#primary-3', expected: { heading: 'NeuralNets', contains: ['previous manager as QBs Gremlins', 'historical reference is separate'] }, closeKey: 'Escape', returnFocus: '#primary-3' }
    ] }
  },
  additional: [
    { action: 'Open position group', selector: '#group-button-guards', expected: { attribute: 'aria-expanded', value: 'true', visible: '#expanded-guards' }, close: '#group-button-guards' },
    { action: 'Inspect unpriced NeuralNets player', persona: 'neural', input: { selector: '#player-search', value: 'AJ Dybantsa' }, result: '#search-player-4866', expected: { heading: 'AJ Dybantsa', contains: ['Unpriced', 'No supplied observation'] }, close: '#detail-close', returnFocus: '#search-player-4866' },
    { action: 'Browser Back / Forward around local record', selector: '#primary-1', backExpected: { absent: '#local-inspector', focus: '#primary-1' }, forwardExpected: { visible: '#local-inspector', focus: '#detail-heading' } },
    { action: 'No-match search', input: { selector: '#player-search', value: 'zzzz-no-owned-player' }, expected: { status: 'No owned players match.', resultCount: 0 }, clear: '#clear-search' },
    { action: 'Read synthetic source limits', selector: '.demo-link', expected: { open: '#sources', contains: ['No live API', 'previous manager'] } }
  ]
};

async function waitReady(page) { await page.waitForSelector(report.readySelector || journeys.readySelector); }
async function waitClosed(page, selector) {
  await page.waitForSelector('#local-inspector', { state: 'detached' });
  await page.waitForFunction(s => document.activeElement?.matches(s), selector);
}
async function firstThree(page, persona) {
  const tested = [];
  for (const journey of journeys.personas[persona].firstThree) {
    await page.locator(journey.selector).click();
    if (journey.expectedFocus) {
      assert.equal(await page.locator(journey.expectedFocus).evaluate(e => e === document.activeElement), true);
      await page.locator(journey.input.selector).fill(journey.input.value);
      await page.locator(journey.result).click();
    }
    await page.waitForSelector('#local-inspector');
    assert.equal(await page.locator('#detail-heading').innerText(), journey.expected.heading);
    const content = await page.locator('#local-inspector').innerText();
    for (const text of journey.expected.contains) assert.ok(content.includes(text), `${persona}: missing ${text}`);
    assert.equal(await page.locator('#detail-heading').evaluate(e => e === document.activeElement), true);
    if (journey.closeKey) await page.keyboard.press(journey.closeKey);
    else await page.locator(journey.close).click();
    await waitClosed(page, journey.returnFocus);
    if (journey.clear) await page.locator(journey.clear).click();
    tested.push({ selector: journey.selector, heading: journey.expected.heading, returnedFocus: journey.returnFocus, passed: true });
  }
  return tested;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  for (const persona of ['reaves', 'neural', 'guest']) {
    for (const variant of [{name:'1440',width:1440,textScale:1},{name:'1120',width:1120,textScale:1},{name:'1440-text-200',width:1440,textScale:2}]) {
      const page = await browser.newPage({ viewport: { width: variant.width, height: 900 } });
      const result = { persona, viewport: { width: variant.width, height: 900 }, textScale: variant.textScale, name: `${persona}-${variant.name}`, errors: [], failedRequests: [] };
      page.on('pageerror', error => result.errors.push(error.message));
      page.on('requestfailed', request => result.failedRequests.push(request.url()));
      try {
        await page.goto(base + '?persona=' + persona);
        await waitReady(page);
        if (variant.textScale === 2) await page.evaluate(() => document.documentElement.style.fontSize = '200%');
        await page.screenshot({ path: path.join(evidence, result.name + '.png'), fullPage: variant.name === '1440' });
        const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, rootFont: getComputedStyle(document.documentElement).fontSize, images: [...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})), bars: [...document.querySelectorAll('.bar-fill')].map(b=>({value: b.innerText, ratio: b.getBoundingClientRect().width / (b.parentElement.getBoundingClientRect().width-1)})), chartBottom: document.querySelector('.chart-list').getBoundingClientRect().bottom }));
        result.geometry = geometry;
        assert.ok(geometry.scrollWidth <= geometry.width + 1, `${result.name}: horizontal overflow ${geometry.scrollWidth}`);
        assert.ok(geometry.images.every(i=>i.loaded), 'An approved image failed to load');
        assert.deepEqual(result.errors, []);
        const expected = persona === 'guest' ? fixture.standings.map(t=>t.pointsFor) : fixture.personas[persona].players.filter(p=>p.completedWeekPoints!=null).sort((a,b)=>b.completedWeekPoints-a.completedWeekPoints).map(p=>p.completedWeekPoints);
        assert.equal(geometry.bars.length, expected.length);
        geometry.bars.forEach((bar,i)=>assert.ok(Math.abs(bar.ratio - expected[i]/(persona==='guest'?700:50)) < .003, `${result.name}: misleading bar scale`));
        result.firstThree = await firstThree(page, persona);
        if (persona !== 'guest') {
          await page.locator('#player-search').fill('zzzz-no-owned-player');
          assert.equal(await page.locator('#search-results > li').count(), 0);
          assert.ok((await page.locator('#search-status').innerText()).includes('No owned players match.'));
          await page.locator('#clear-search').click();
          assert.equal(await page.locator('#position-groups').isVisible(), true);
          await page.locator('#group-button-guards').click();
          assert.equal(await page.locator('#group-button-guards').getAttribute('aria-expanded'), 'true');
          assert.equal(await page.locator('#expanded-guards').isVisible(), true);
          await page.locator('#expanded-guards button').first().click();
          const groupReturn = await page.evaluate(() => history.state.returnId);
          await page.locator('#detail-close').click();
          await waitClosed(page, '#' + groupReturn);
          await page.locator('#group-button-guards').click();
          assert.equal(await page.locator('#expanded-guards').isVisible(), false);
          if (persona === 'neural') {
            await page.locator('#player-search').fill('AJ Dybantsa');
            await page.locator('#search-player-4866').click();
            const text=await page.locator('#local-inspector').innerText();
            assert.ok(text.includes('Unpriced') && text.includes('No supplied observation'));
            assert.ok(!text.includes('0 modeled FAAB'));
            await page.locator('#detail-close').click();
            await waitClosed(page, '#search-player-4866');
            await page.locator('#clear-search').click();
          }
        } else {
          assert.equal(await page.locator('#player-search').count(), 0);
          assert.ok(!(await page.locator('main').innerText()).includes('Joel Embiid'));
          assert.equal(await page.locator('.directory-entry').count(), 10);
        }
        await page.locator('#primary-1').click();
        await page.goBack();
        await waitClosed(page, '#primary-1');
        await page.goForward();
        await page.waitForSelector('#local-inspector');
        assert.equal(await page.locator('#detail-heading').evaluate(e => e === document.activeElement), true);
        await page.goBack();
        await waitClosed(page, '#primary-1');
        await page.locator('.demo-link').click();
        assert.equal(await page.locator('#sources').evaluate(e=>e.open), true);
        result.exits = await page.locator('a[href^="https://goathoopers.com"]').evaluateAll(a=>a.map(e=>({href:e.href,label:e.getAttribute('aria-label')})));
        assert.ok(result.exits.every(e=>e.label && e.label.includes('current GOAT site')));
        result.passed = true;
      } catch (error) { result.passed = false; result.failure = error.message; await page.screenshot({path:path.join(evidence,result.name+'-failure.png'),fullPage:true}); }
      report.cases.push(result);
      await page.close();
    }
  }
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(base+'?persona=reaves');await waitReady(page);
  await page.locator('#group-button-guards').click();
  await page.locator('#expanded-guards button').first().click();
  await page.locator('#group-button-guards').click();
  await page.keyboard.press('Escape');
  await waitClosed(page,'#group-button-guards');
  report.extra.push({check:'Closing a record after its group is collapsed restores visible group control',passed:true});
  await page.goto(base+'?persona=reaves');await waitReady(page);
  const normal=await page.locator('.chart-list').boundingBox();
  await page.goto(base+'?persona=reaves&stage=structure');await waitReady(page);
  const structure=await page.locator('.chart-list').boundingBox();
  assert.deepEqual(normal,structure);
  report.extra.push({check:'Structure stage preserves chart geometry',normal,structure,passed:true});
  await page.screenshot({path:path.join(evidence,'reaves-structure.png'),fullPage:false});
  await page.goto(base+'?persona=neural#player-4866');await waitReady(page);
  assert.equal(await page.locator('#detail-heading').innerText(),'AJ Dybantsa');
  await page.locator('#detail-close').click();await waitClosed(page,'#primary-1');
  report.extra.push({check:'Direct local-record URL and Close restoration',passed:true});
  await page.goto(base+'?persona=reaves&stage=structure');await waitReady(page);
  await page.locator('#demo-persona').selectOption('guest');await waitReady(page);
  assert.ok(page.url().includes('stage=structure')&&page.url().includes('persona=guest'));
  assert.equal(await page.locator('html').getAttribute('data-persona'),'guest');
  report.extra.push({check:'Demo persona selection preserves structure stage',passed:true});
  await page.goto(base+'?persona=reaves');await waitReady(page);
  const colors=await page.evaluate(()=>['body','.chart-foot','.bar-value','.primary','#player-search'].map(selector=>{const e=document.querySelector(selector),style=getComputedStyle(e);let background=e;while(background&&getComputedStyle(background).backgroundColor==='rgba(0, 0, 0, 0)')background=background.parentElement;return{selector,foreground:style.color,background:getComputedStyle(background).backgroundColor,border:style.borderColor}}));
  function luminance(rgb){const v=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]}
  function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  report.contrast=colors.map(p=>({...p,textRatio:Number(contrast(p.foreground,p.background).toFixed(2)),...(p.selector==='#player-search'?{boundaryRatio:Number(contrast(p.border,p.background).toFixed(2))}:{})}));
  assert.ok(report.contrast.every(p=>p.textRatio>=4.5));
  assert.ok(report.contrast.find(p=>p.selector==='#player-search').boundaryRatio>=3);
  report.extra.push({check:'Measured rendered solid reading/data/action/input pairs meet planned text and input-boundary contrast',passed:true});
  await browser.close();
  report.passed=report.cases.every(c=>c.passed)&&report.extra.every(c=>c.passed);
  journeys.verification={method:report.method,report:'evidence/browser-results.json',passed:report.passed,cases:report.cases.map(c=>({name:c.name,passed:c.passed}))};
  fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(root,'journeys.json'),JSON.stringify(journeys,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,cases:report.cases.map(c=>({name:c.name,passed:c.passed,failure:c.failure})),extra:report.extra},null,2));
  if(!report.passed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
