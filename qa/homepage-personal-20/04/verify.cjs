const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = __dirname;
const base = process.env.STUDY04_BASE || 'http://127.0.0.1:4207/qa/homepage-personal-20/04/';
const results = [];
const errors = [];
const externalRequests = [];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4207/')) externalRequests.push(request.url()); });
  async function check(name, fn) {
    try { await fn(); results.push({ name, pass: true }); }
    catch(error) { results.push({ name, pass: false, error: error.message }); }
  }
  async function home(persona, extra = '') {
    await page.goto(`${base}?persona=${persona}${extra}`);
    await page.waitForFunction(() => document.documentElement.dataset.personalStudyReady === '04');
  }
  async function noOverflow() {
    const sizes = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(sizes.document <= sizes.width && sizes.body <= sizes.width, JSON.stringify(sizes));
  }
  for (const persona of ['reaves', 'neural', 'guest']) {
    await home(persona);
    const left = persona === 'reaves' ? 'Joel Embiid' : persona === 'neural' ? 'Giannis Antetokounmpo' : 'Reaves Dropper';
    const right = persona === 'reaves' ? 'Damian Lillard' : persona === 'neural' ? 'Kevin Durant' : 'Stephon Castle’s Back';
    await check(`${persona}: visible default subjects and readable body`, async () => {
      assert.equal(await page.locator('#left-name').innerText(), left);
      assert.equal(await page.locator('#right-name').innerText(), right);
      assert.equal(await page.locator('html').getAttribute('data-persona'), persona);
      assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).fontSize), '18px');
      await noOverflow();
    });
    await check(`${persona}: change selector, swap, browser Back`, async () => {
      const choice = persona === 'reaves' ? '1830' : persona === 'neural' ? '1350' : '7';
      await page.locator('#left-select').selectOption(choice);
      assert.equal(await page.locator('#left-select').inputValue(), choice);
      const leftName = await page.locator('#left-name').innerText();
      await page.locator('#swap').click();
      assert.equal(await page.locator('#right-name').innerText(), leftName);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'swap');
      await page.goBack();
      await page.waitForTimeout(80);
      assert.equal(await page.locator('#left-name').innerText(), leftName);
    });
    await home(persona);
    await check(`${persona}: local subject inspection and focus/scroll return`, async () => {
      await page.locator('#inspect-left').focus();
      const y = await page.evaluate(() => scrollY);
      await page.locator('#inspect-left').click();
      assert.match(await page.locator('#view-title').innerText(), new RegExp(left.split(' ')[0]));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'view-title');
      await page.locator('#back-to-comparison').click();
      await page.waitForSelector('#comparison-title');
      await page.waitForTimeout(80);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'inspect-left');
      assert.ok(Math.abs((await page.evaluate(() => scrollY)) - y) < 2);
    });
    await home(persona);
    if (persona !== 'guest') {
      await check(`${persona}: completed-week sample action`, async () => {
        await page.locator('#read-samples').click();
        assert.equal(await page.locator('#sample-table tbody tr').count(), persona === 'reaves' ? 5 : 3);
        assert.match(await page.locator('main').innerText(), /October 19–25/);
        await page.locator('#back-to-comparison').click();
        await page.waitForSelector('#read-samples');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'read-samples');
      });
      await home(persona);
      await check(`${persona}: actual opponent/matchup action`, async () => {
        await page.locator('#open-matchup').click();
        if(persona === 'reaves') {
          assert.equal(await page.locator('[data-score-team="1"]').innerText(), '184.5');
          assert.equal(await page.locator('[data-score-team="2"]').innerText(), '171');
          assert.match(await page.locator('#saved-estimate').innerText(), /56%/);
          assert.match(await page.locator('#saved-estimate').innerText(), /Confidence: 0.35/);
        } else {
          assert.equal(await page.locator('[data-score-team="7"]').innerText(), '0');
          assert.equal(await page.locator('[data-score-team="8"]').innerText(), 'Score unavailable');
          assert.match(await page.locator('#saved-estimate').innerText(), /No saved estimate/);
        }
      });
    } else {
      await check('guest: all five pairings are normal-flow content', async () => {
        assert.equal(await page.locator('.pairing').count(), 5);
        assert.equal(await page.locator('#pair-m4').isVisible(), true);
        await page.locator('#pair-m4').click();
        assert.equal(await page.locator('[data-score-team="7"]').innerText(), '0');
        assert.equal(await page.locator('[data-score-team="8"]').innerText(), 'Score unavailable');
      });
      await home(persona);
      await check('guest: actual account exit is explicit, without simulating login', async () => {
        assert.equal(await page.locator('#guest-account').getAttribute('href'), 'https://goathoopers.com/login');
        assert.match(await page.locator('#guest-account').innerText(), /leaves prototype/);
        assert.equal(await page.locator('input[type="password"]').count(), 0);
        assert.equal(await page.locator('#roster-table').count(), 0);
      });
    }
    for (const width of [1440,1120]) {
      await page.setViewportSize({ width, height: 1000 });
      await home(persona);
      await check(`${persona}: ${width}px full-page intrinsic layout and source/exit access`, async () => {
        await noOverflow();
        assert.equal(await page.locator('footer a[href^="https://goathoopers.com"]').count(), 14);
        await page.locator('[data-source]').click();
        assert.equal(await page.locator('#sources').evaluate(el=>el.open), true);
        assert.match(await page.locator('#sources').innerText(), /not reported league events/);
      });
    }
    await home(persona);
    await page.evaluate(() => document.documentElement.style.fontSize='36px');
    await check(`${persona}: 1120px with 200% root text`, noOverflow);
    await page.setViewportSize({ width:1440,height:1000 });
  }
  await home('neural','&left=4866&right=1380');
  await check('neural: unpriced player never becomes zero or a complete quote', async () => {
    assert.equal(await page.locator('#left-quote').innerText(), 'Unpriced');
    assert.equal(await page.locator('#left-points').innerText(), 'Unavailable');
    assert.match(await page.locator('#differences').innerText(), /unavailable/);
    await page.locator('#inspect-left').click();
    assert.match(await page.locator('main').innerText(), /not priced at zero/);
  });
  await home('neural','&view=team&id=8');
  await check('neural: previous-manager qualification stays with historical record', async () => {
    await page.locator('.historical summary').click();
    assert.match(await page.locator('.historical').innerText(), /Under the previous manager as QBs Gremlins/);
  });
  await home('reaves','&view=player&id=1511');
  await check('direct local player URL works without prior navigation', async () => {
    assert.equal(await page.locator('#view-title').innerText(),'Joel Embiid');
    await page.locator('#back-to-comparison').click();
    assert.equal(await page.locator('#left-name').innerText(),'Joel Embiid');
  });
  await home('neural','&stage=structure');
  await page.emulateMedia({reducedMotion:'reduce'});
  await check('structure/reduced-motion preserve contents and controls', async () => {
    assert.equal(await page.locator('#left-name').innerText(),'Giannis Antetokounmpo');
    assert.equal(await page.locator('.subject img').first().evaluate(el=>getComputedStyle(el).visibility),'hidden');
    assert.equal(await page.locator('#left-select').isVisible(),true);
    await noOverflow();
  });
  await home('reaves');
  await check('keyboard skip reaches main; native selection retains control focus', async () => {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Skip to content');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
    await page.locator('#left-select').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'left-select');
    assert.notEqual(await page.locator('#left-select').inputValue(),'1511');
  });
  await home('reaves');
  await check('no script errors or external data requests', async () => {
    assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
  });
  const report={base,method:'Headless Chromium via installed Playwright, executable /usr/bin/chromium',timestamp:new Date().toISOString(),results,errors,externalRequests};
  fs.writeFileSync(path.join(root,'browser-evidence.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,failures:results.filter(r=>!r.pass)},null,2));
  await browser.close();
  if(results.some(r=>!r.pass)) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
