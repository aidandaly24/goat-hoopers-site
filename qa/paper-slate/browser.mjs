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

// Actual CSS foreground/background pairs, composited through ancestor opacity.
// All tested states use the dark local stage/overlay, with WebGL disabled.
async function sceneContrast(page, width, state, targets) {
  const samples = await page.evaluate(targets => {
    const canvas=document.createElement('canvas'); canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d');
    const rgba=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
    const blend=(fg,bg,alpha=fg[3]/255)=>fg.slice(0,3).map((v,i)=>v*alpha+bg[i]*(1-alpha));
    const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    return targets.map(([label,selector])=>{
      const element=document.querySelector(selector);if(!element)throw new Error('Missing '+selector);
      const chain=[];for(let node=element;node;node=node.parentElement)chain.unshift(node);
      const paint=(index,backdrop)=>{
        const style=getComputedStyle(chain[index]); const bg=blend(rgba(style.backgroundColor),backdrop);
        const pair=index===chain.length-1?{ink:blend(rgba(style.color),bg),bg}:paint(index+1,bg);
        return {ink:blend([...pair.ink,255],backdrop,Number(style.opacity)),bg:blend([...pair.bg,255],backdrop,Number(style.opacity))};
      };
      const pair=paint(0,[255,255,255]);const a=luminance(pair.ink),b=luminance(pair.bg);
      return {label,text:element.textContent.trim().slice(0,100),color:getComputedStyle(element).color,background:getComputedStyle(element).backgroundColor,
        groupOpacity:chain.map(n=>getComputedStyle(n).opacity).filter(o=>o!=='1'),
        compositedInk:pair.ink.map(v=>+v.toFixed(2)),compositedBackground:pair.bg.map(v=>+v.toFixed(2)),ratio:+((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2)};
    });
  },targets);
  record(`${width} game ${state} actual element contrast`,samples);
  for(const sample of samples)assert.ok(sample.ratio>=4.5,`${state} ${sample.label}: ${sample.ratio}:1`);
}

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
    const checkGeometry = async route => {
      const geometry = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, bg: getComputedStyle(document.body).backgroundColor }));
      assert.ok(geometry.width <= width + 1, `${route}: page overflow ${JSON.stringify(geometry)}`);
      assert.equal(geometry.bg, 'rgb(245, 244, 239)');
      record(`${width} ${route} geometry/canvas`, geometry);
    };
    const visit = async route => {
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      await page.getByRole('heading').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await checkGeometry(route);
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
    // Hold only the local dynamic renderer module to observe real loading UI.
    let releaseScene;
    const sceneGate = new Promise(resolve => { releaseScene = resolve; });
    const scenePattern = '**/FreeThrowScene.ts*';
    const heldSceneRequests = [];
    const holdScene = route => { const pending = sceneGate.then(() => route.continue()); heldSceneRequests.push(pending); return pending; };
    await page.route(scenePattern, holdScene);
    try {
      await page.goto(origin + '/arcade/free-throw-shootout', { waitUntil:'domcontentloaded' });
      await page.getByText('Opening the court…', {exact:true}).waitFor();
      await sceneContrast(page, width, 'loading', [
        ['title','[aria-label="Court controls"] h1'],
        ['Streak','[aria-label="Practice score"] > div:nth-child(2) strong'],
        ['Best','[aria-label="Practice score"] > div:nth-child(3) strong'],
        ['loading','[aria-label="Court controls"] > div:last-of-type'],
        ['Prototype','[aria-label="Court controls"] > span:last-child > span'],
      ]);
      await capture('game-loading');
    } finally { releaseScene(); await Promise.all(heldSceneRequests); await page.unroute(scenePattern, holdScene); }
    await page.getByText('3D court unavailable', {exact:true}).waitFor();
    await checkGeometry('/arcade/free-throw-shootout');
    await sceneContrast(page, width, 'fallback', [
      ['title','[aria-label="Court controls"] h1'],
      ['fallback','[aria-label="Court controls"] > div:last-of-type > p:first-child'],
      ['fallback instruction','[aria-label="Court controls"] > div:last-of-type > p:nth-child(2)'],
      ['reload','[aria-label="Court controls"] > div:last-of-type > button'],
      ['Prototype','[aria-label="Court controls"] > span:last-child > span'],
    ]);
    await capture('game-fallback');
    await page.getByRole('button',{name:'Controls and help'}).click();
    await page.getByRole('region',{name:'Practice controls'}).waitFor();
    await sceneContrast(page, width, 'help', [
      ['help title','[aria-label="Practice controls"] h2'],
      ['help paragraph','[aria-label="Practice controls"] > p:first-of-type'],
      ['help key','[aria-label="Practice controls"] kbd'],
    ]);
    await capture('game-help');
    await page.getByRole('region',{name:'Practice controls'}).getByText('Fine controls', {exact:true}).click();
    await sceneContrast(page, width, 'fine labels', [
      ['Aim label','label[for="shot-aim"]'], ['Power label','label[for="shot-power"]'],
      ['Aim guide','[aria-label="Practice controls"] label:last-of-type'],
    ]);
    await capture('game-fine-controls');
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
