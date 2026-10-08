// Private local browser QA. Start the fixture first; provide existing Playwright/Chrome paths.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { chromium } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const origin = 'http://127.0.0.1:8796';
const evidence = path.resolve('qa/paper-slate/evidence');
await mkdir(evidence, { recursive: true });
const receipt = { browser: '', checks: [], pageErrors: [], externalRequests: [], nonGETRequests: [], consoleErrors: [], screenshots: [] };
const record = (check, detail) => { receipt.checks.push({ check, detail }); console.log(check + ': ' + JSON.stringify(detail)); };
const browser = await chromium.launch({ executablePath: process.argv[3], headless: true, args: ['--disable-webgl'] });
receipt.browser = browser.version();
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => {
      const request = route.request();
      if (request.method() !== 'GET') { receipt.nonGETRequests.push(request.url()); return route.abort(); }
      if (new URL(request.url()).origin !== origin) { receipt.externalRequests.push(request.url()); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('console', msg => { if(msg.type()==='error') receipt.consoleErrors.push({ route:page.url(), text:msg.text() }); });
    page.on('pageerror', e => receipt.pageErrors.push(e.stack ?? e.message));
    const visit = async route => {
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      await page.getByRole('heading').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, bg: getComputedStyle(document.body).backgroundColor }));
      assert.ok(geometry.width <= width + 1, `${route}: page overflow ${JSON.stringify(geometry)}`);
      assert.equal(geometry.bg, 'rgb(245, 244, 239)');
      record(`${width} ${route} geometry/canvas`, geometry);
    };
    const capture = async name => {
      const file = `${width}-${name}.png`;
      await page.screenshot({ path: path.join(evidence, file), fullPage: false });
      receipt.screenshots.push(file);
    };
    await visit('/'); await capture('home');
    const colors = await page.evaluate(() => {
      const keys = ['bg','bg-raised','bg-hover','text','text-dim','accent','on-accent','control','win','loss','live','champion','silver','bronze','ink-on-color','pos-pg','pos-sg','pos-sf','pos-pf','pos-c', ...Array.from({length:10},(_,i)=>`team-${i+1}`)];
      const sample = document.createElement('span'); document.body.append(sample);
      const result = Object.fromEntries(keys.map(key => { sample.style.color=`var(--gh-${key})`; return [key, getComputedStyle(sample).color.match(/[\d.]+/g).slice(0,3).map(Number)]; }));
      sample.remove(); return result;
    });
    const lum = rgb => rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
    const ratio = (a,b) => (Math.max(lum(a),lum(b))+0.05)/(Math.min(lum(a),lum(b))+0.05);
    const ratios = {};
    for (const ink of ['text','text-dim','accent','win','loss','live','champion','silver','bronze']) for (const bg of ['bg','bg-raised','bg-hover']) { const value = ratio(colors[ink],colors[bg]); assert.ok(value>=4.5, `${ink}/${bg}: ${value}`); ratios[`${ink}/${bg}`]=+value.toFixed(2); }
    assert.ok(ratio(colors['on-accent'],colors.accent)>=4.5);
    for (const bg of ['bg','bg-raised','bg-hover']) assert.ok(ratio(colors.control,colors[bg])>=3);
    for (const fill of ['pos-pg','pos-sg','pos-sf','pos-pf','pos-c',...Array.from({length:10},(_,i)=>`team-${i+1}`)]) assert.ok(ratio(colors['ink-on-color'],colors[fill])>=4.5, fill);
    record(`${width} resolved semantic contrast`, ratios);
    const sort = page.getByRole('combobox', { name: 'Order', exact: true });
    await sort.selectOption('team'); await sort.focus();
    const focus = await sort.evaluate(el=>({outline:getComputedStyle(el).outlineStyle,color:getComputedStyle(el).outlineColor,border:getComputedStyle(el).borderColor}));
    assert.equal(focus.outline, 'solid');
    record(`${width} directory sort/focus`, focus);
    await capture('home-directory');

    await visit('/stocks'); await capture('stocks');
    const search = page.getByRole('searchbox');
    await search.fill('Synthetic Beta');
    assert.equal(await page.getByRole('button', {name:/^Price history for Synthetic/}).count(),1);
    await search.fill('');
    await page.getByRole('button', {name:'Price history for Synthetic Alpha',exact:true}).click();
    await page.getByRole('heading',{name:'Price history',exact:true}).waitFor();
    await capture('stock-inspector');
    await page.getByRole('button',{name:'Close player detail'}).click();
    assert.equal(await page.getByRole('button',{name:'Price history for Synthetic Alpha',exact:true}).evaluate(el=>el===document.activeElement),true);
    record(`${width} stock search/detail/close focus`, 'pass; injected detail transport');
    await visit('/stocks?state=error');
    await page.getByRole('button',{name:'Price history for Synthetic Alpha',exact:true}).click();
    await page.getByRole('button',{name:'Retry detail'}).waitFor(); await capture('stock-error');
    await visit('/stocks?state=empty'); await capture('stock-empty');
    await visit('/teams'); await capture('teams');
    assert.equal(await page.getByRole('link',{name:/^View /}).count(),10);
    await visit('/teams?state=empty'); assert.match(await page.locator('main').innerText(),/Couldn't load/);
    await visit('/arcade'); await capture('arcade');
    assert.equal(await page.getByRole('link',{name:'Play Free Throw Shootout',exact:true}).count(),1);
    await visit('/arcade/free-throw-shootout');
    await page.getByText('3D court unavailable', {exact:true}).waitFor(); await capture('game-fallback');
    await page.getByRole('button',{name:'Controls and help'}).click();
    await page.getByRole('region',{name:'Practice controls'}).waitFor();
    await page.getByRole('button',{name:'Close help'}).click();
    await page.getByRole('link',{name:'Back to the arcade'}).click(); await page.waitForURL(origin+'/arcade');
    record(`${width} real Arcade path/fallback/help/back`, 'pass; WebGL disabled, no gameplay assertion');
    await visit('/trade-analyzer');
    const picker = page.getByRole('textbox',{name:/Search players for/}).first();
    await picker.fill('Alpha'); await page.getByRole('button',{name:/Synthetic Alpha/}).click();
    await page.getByRole('textbox',{name:/Search players for/}).nth(1).fill('Beta');
    await page.getByRole('button',{name:/Synthetic Beta/}).click();
    await capture('trade');
    assert.match(await page.locator('main').innerText(),/\$32.00/);
    await page.getByRole('button',{name:/Remove Synthetic Alpha/}).click();
    record(`${width} trade picker/remove`, 'pass; domain calculations unchanged');
    await visit('/history'); await capture('history');
    await visit('/unavailable'); await capture('unavailable');
    await visit('/missing'); await capture('missing');
    await visit('/?state=empty'); await capture('home-no-edition');
    await context.close();
  }
  assert.deepEqual(receipt.pageErrors,[]); assert.deepEqual(receipt.externalRequests,[]); assert.deepEqual(receipt.nonGETRequests,[]);
} finally { await writeFile(path.join(evidence,'receipt.json'), JSON.stringify(receipt,null,2)+'\n'); await browser.close(); }
console.log('PASS: '+receipt.checks.length+' checks; '+receipt.screenshots.length+' captures');
