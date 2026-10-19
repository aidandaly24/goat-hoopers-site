// Focused Stocks scrolling QA; real components, existing synthetic props only.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
assert.ok(process.env.SHELL_TEST_PLAYWRIGHT, 'Supply an existing Playwright installation');
const { chromium } = await import(pathToFileURL(process.env.SHELL_TEST_PLAYWRIGHT).href);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
import { mkdir, writeFile } from 'node:fs/promises';
let origin = process.env.STOCKS_SCROLL_ORIGIN;
let server;
let serverLog = '';
if (!origin) {
  server = spawn(process.execPath, [path.join(repo, 'node_modules/vite/bin/vite.js'), 'src/test/site-shell', '--config', 'src/test/site-shell/vite.config.mts'], { cwd: repo, env: { PATH: process.env.PATH, TMPDIR: '/tmp', LANG: 'en_US.UTF-8', TZ: 'UTC' }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { serverLog += chunk; });
  for (let i = 0; i < 100 && !origin; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    origin = serverLog.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  }
  if (!origin) { server.kill(); assert.fail(serverLog || 'Fixture did not start'); }
}
const evidence = process.env.STOCKS_SCROLL_EVIDENCE ?? '/tmp/goat-stocks-scroll-after';
await mkdir(evidence, {recursive:true});
const receipt = {head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim(),checks:[], errors:[], blocked:[], limitations:'Synthetic production-component fixture; Chromium mobile emulation, not physical iOS. Next routing checked separately.'};
const browser=await chromium.launch({headless:true,...(process.env.SHELL_TEST_CHROME?{executablePath:process.env.SHELL_TEST_CHROME}:{})});
const record=(name, detail)=>{receipt.checks.push({name, detail});console.log(name);};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function visibleFocus(page, locator) {
  assert.equal(await locator.evaluate(e=>document.activeElement===e),true);
  const box=await locator.boundingBox();
  const bounds=await page.evaluate(()=>({top:document.querySelector('[data-site-chrome]').getBoundingClientRect().bottom,bottom:innerHeight}));
  assert.ok(box.y>=bounds.top-1 && box.y+box.height<=bounds.bottom+1,`Focus hidden: ${JSON.stringify({box,bounds})}`);
}
try {
  for(const [width,height] of [[1440,900],[1024,900],[390,844],[320,568],[720,450]]) for(const signed of [false,true]){
    const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1025,isMobile:width<641,reducedMotion:signed?'no-preference':'reduce'});
    await ctx.route('**/*',route=>{
      const r=route.request();
      if(new URL(r.url()).hostname!=='127.0.0.1'||r.method()!=='GET'){receipt.blocked.push(r.method()+' '+new URL(r.url()).hostname);return route.abort();}
      return route.continue();
    });
    const page=await ctx.newPage();page.setDefaultTimeout(7000);page.on('pageerror',e=>receipt.errors.push(e.message));
    await page.goto(origin+'/stocks?populated&ticker=1'+(signed?'&user=1':''),{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Show 25 more players'}).click();
    const deep=page.getByRole('button',{name:'Price history for Synthetic player 30',exact:true});
    await deep.click();
    await page.getByRole('heading',{name:'Price history',exact:true}).waitFor();await pause(70);
    await visibleFocus(page,page.locator('#inspector-title'));
    await page.keyboard.press('Escape');await pause(70);await visibleFocus(page,deep);
    record(`${width} ${signed?'signed':'anonymous'} deep selection and Escape restore visible focus`);
    const first=page.getByRole('button',{name:'Price history for Synthetic player 1',exact:true});
    await first.click();await page.getByRole('heading',{name:'Price history',exact:true}).waitFor();await pause(70);
    const chart=page.locator('#stock-inspector svg[role="img"]').first();
    if(width===1440){
      const start=await page.evaluate(()=>scrollY);
      for(const [region,x] of [['left gutter',8],['right gutter',width-8],['board',600],['sidebar',1240],['column gap',1060],['chart',1240]]){
        await page.evaluate(y=>scrollTo(0,y),start);await pause(40);
        const before={scroll:await page.evaluate(()=>scrollY),top:(await chart.boundingBox()).y};
        const graph=await chart.boundingBox();
        await page.mouse.move(x,region==='chart'?Math.min(height-30,graph.y+graph.height*.55):height*.7);
        await page.mouse.wheel(0,180);await pause(120);
        const delta=await page.evaluate(y=>scrollY-y,before.scroll);
        const movement=before.top-(await chart.boundingBox()).y;
        assert.ok(delta>150,`Whole page did not scroll from ${region}: ${delta}`);
        assert.ok(Math.abs(movement-delta)<3,`Inspector resisted page scrolling from ${region}: ${JSON.stringify({delta,movement})}`);
        record(`${width} ${signed?'signed':'anonymous'} wheel ${region}`,{delta,movement});
      }
    }
    const range=page.getByRole('group',{name:'History range for Synthetic player 1',exact:true});
    await range.getByRole('button',{name:'30D',exact:true}).click();
    await range.getByRole('button',{name:'All',exact:true}).click();
    const slider=page.getByRole('slider',{name:'Inspect price history for Synthetic player 1',exact:true});
    await slider.focus();await page.keyboard.press('Home');assert.match(await slider.getAttribute('aria-valuetext'),/2025/);
    await page.keyboard.press('End');assert.match(await slider.getAttribute('aria-valuetext'),/2026/);
    await chart.scrollIntoViewIfNeeded();const g=await chart.boundingBox();
    await page.mouse.move(g.x+g.width*.16,g.y+g.height*.5);await page.mouse.down();
    await page.mouse.move(g.x+g.width*.9,g.y+g.height*.5,{steps:5});await page.mouse.up();
    assert.match(await slider.getAttribute('aria-valuetext'),/2026/);
    record(`${width} ${signed?'signed':'anonymous'} chart range, keyboard and pointer drag`);
    if(width===390||width===320){
      await chart.evaluate(e=>e.scrollIntoView({block:'center'}));await pause(60);
      const graph=await chart.boundingBox();const cdp=await ctx.newCDPSession(page);
      const x=graph.x+graph.width*.5, y=graph.y+graph.height*.7;
      const start=await page.evaluate(()=>scrollY);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*18}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(220);
      const delta=await page.evaluate(y=>scrollY-y,start);assert.ok(delta>80,`Chart touch scroll blocked: ${delta}`);
      record(`${width} ${signed?'signed':'anonymous'} vertical touch pan starts on chart`,{delta});
    }
    await page.getByRole('button',{name:'Close player detail',exact:true}).click();await pause(70);await visibleFocus(page,first);
    await page.getByRole('searchbox',{name:'Search players'}).fill('Synthetic player 30');
    assert.equal(await page.getByRole('button',{name:'Price history for Synthetic player 30',exact:true}).count(),1);
    await page.getByRole('searchbox',{name:'Search players'}).fill('');
    await page.getByRole('group',{name:'Position',exact:true}).getByRole('button',{name:'SG',exact:true}).click();
    await page.getByRole('heading',{name:'No players match',exact:true}).waitFor();
    await page.getByRole('button',{name:'Reset filters',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Price history for Synthetic player 1',exact:true}).count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    record(`${width} ${signed?'signed':'anonymous'} search/filter/reset, bounds and Close restore`);
    await page.screenshot({path:`${evidence}/${width}-${signed?'signed':'anonymous'}.png`});
    await ctx.close();
  }
  assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.blocked,[]);receipt.status='passed';
}catch(error){receipt.status='failed';receipt.failure=String(error);throw error;}
finally{await writeFile(evidence+'/results.json',JSON.stringify(receipt,null,2));await browser.close();server?.kill('SIGTERM');}
