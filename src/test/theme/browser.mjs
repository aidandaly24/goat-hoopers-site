// Shared-theme acceptance on the navigation harness's exact production Next build.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, writeFile, statfs } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const evidence = path.resolve(process.env.THEME_TEST_EVIDENCE);
const nav = JSON.parse(await readFile(process.env.THEME_TEST_NAV_RECEIPT, 'utf8'));
assert.equal(process.versions.node.split('.')[0], '22'); assert.equal(nav.status, 'passed');
for (const [name, hash] of Object.entries(nav.hashes)) assert.equal(createHash('sha256').update(await readFile(path.join(repo, name))).digest('hex'), hash, name);
assert.ok(nav.hashes['src/ui/ThemeToggle.tsx'] && nav.hashes['src/ui/ThemeBootstrap.tsx']);
const resume = process.env.THEME_TEST_RESUME_RECEIPT ? JSON.parse(await readFile(process.env.THEME_TEST_RESUME_RECEIPT, 'utf8')) : null;
if (resume) { assert.equal(resume.status, 'failed'); assert.equal(resume.checks.length, 40); assert.deepEqual(resume.hashes, nav.hashes); assert.deepEqual(resume.errors, []); assert.deepEqual(resume.consoleErrors, []); }
const { chromium } = await import(pathToFileURL(process.env.THEME_TEST_PLAYWRIGHT).href);
await mkdir(evidence, { recursive: true });
const summary = { status: 'running', fixture: nav.fixture, buildId: (await readFile(path.join(nav.fixture, '.next/BUILD_ID'), 'utf8')).trim(), hashes: nav.hashes, checks: resume?.checks ?? [], carriedChecks: resume ? 40 : 0, errors: [], consoleErrors: [], blockedExternal: [], blockedWrites: [], credentials: 'absent', limitations: 'Actual production root/header/footer/Stocks/Newsroom/Trade and Next routing with invented data/session/poller adapters. Other route bodies are labelled placeholders. Injected current Courtside alias CSS is a semantic probe, not homepage body acceptance. No live providers/auth, physical Safari or screen reader.' };
const record = (name, detail = true) => { summary.checks.push({ name, detail }); console.log(name); };
const logs = []; let server, browser, lastPage;
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(check, message) { const end = Date.now() + 10000; while (Date.now() < end) { if (await check()) return; await pause(25); } assert.fail(message); }
async function settled(page) { await page.waitForLoadState('networkidle'); await page.locator('[data-theme-toggle]:not(:disabled)').waitFor(); await page.waitForFunction(() => Math.abs(document.querySelector('[data-site-chrome]').getBoundingClientRect().height - parseFloat(document.documentElement.style.getPropertyValue('--gh-chrome-h'))) < 1); }
async function context(origin, width, scheme, { signed = false, saved, blocked = false, hydrationGate } = {}) {
 const ctx = await browser.newContext({ viewport: { width, height: width > 640 ? 900 : 844 }, colorScheme: scheme, reducedMotion: 'reduce' });
 await ctx.addCookies([{ name: 'qa-ticker', value: 'on', url: origin }, { name: 'qa-user', value: signed ? 'signed' : 'anon', url: origin }]);
 await ctx.addInitScript(({ saved, blocked }) => {
  if (saved !== undefined) localStorage.setItem('goat-hoopers.theme', saved);
  if (blocked) Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Fixture storage denied', 'SecurityError'); } });
  const push = history.pushState.bind(history); history.pushState = (...args) => { window.__themeDeparture = { y: scrollY, href: location.href }; return push(...args); };
 }, { saved, blocked });
 await ctx.route('**/*', route => {
  const r = route.request(); if (new URL(r.url()).origin !== origin) { summary.blockedExternal.push(r.url()); return route.abort(); }
  if (r.method() !== 'GET') { summary.blockedWrites.push(r.method()); return route.abort(); }
  if (hydrationGate && /\/_next\/static\/.*\.js(?:\?|$)/.test(r.url())) return hydrationGate.then(() => route.continue());
  return route.continue();
 });
 const page = await ctx.newPage(); page.setDefaultTimeout(10000); lastPage = page;
 page.on('pageerror', e => summary.errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') summary.consoleErrors.push(m.text()); });
 return { ctx, page };
}
async function state(page, expected) {
 assert.equal(await page.locator('html').getAttribute('data-theme'), expected);
 const b = page.locator('[data-theme-toggle]'); assert.equal(await b.count(), 1); assert.equal(await b.getAttribute('aria-label'), `Switch to ${expected === 'dark' ? 'light' : 'dark'} theme`); assert.equal(await b.getAttribute('aria-pressed'), null);
 const detail = await b.evaluate(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { x: r.x, y: r.y, width: r.width, height: r.height, transition: s.transitionDuration, outsideHiddenGroups: !e.closest('nav,form,[class*="account"]'), svg: e.querySelectorAll('svg').length }; });
 assert.ok(detail.width >= 44 && detail.height >= 44 && detail.x >= 0 && detail.x + detail.width <= page.viewportSize().width + 1); assert.equal(detail.svg, 1); assert.equal(detail.transition, '0s'); assert.equal(detail.outsideHiddenGroups, true);
 const logos = await page.locator('header img:visible, footer img:visible').evaluateAll(imgs => imgs.map(i => ({ src: i.getAttribute('src'), width: i.getBoundingClientRect().width, alt: i.getAttribute('alt') })));
 assert.equal(logos.length, 2); for (const logo of logos) { assert.ok(logo.width > 0 && logo.width <= page.viewportSize().width); assert.ok(logo.src.endsWith(`horizontal-${expected === 'dark' ? 'white' : 'black'}.svg`)); }
 const shell = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, parts: [...document.querySelectorAll('header,#site-navigation-panel,footer')].map(e => e.scrollWidth - e.clientWidth), heading: document.querySelector('#main-content h1').getBoundingClientRect().top, chrome: document.querySelector('[data-site-chrome]').getBoundingClientRect().bottom, scrollY }));
 assert.ok(shell.overflow <= 1 && shell.parts.every(n => n <= 1), JSON.stringify(shell)); if (shell.scrollY < 1) assert.ok(shell.heading >= shell.chrome - 1, 'Initial heading covered');
 return { button: detail, logos, shell };
}
async function contrast(page) {
 return page.evaluate(() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; const c = canvas.getContext('2d');
  const rgb = color => { c.clearRect(0,0,1,1); c.fillStyle = color; c.fillRect(0,0,1,1); return [...c.getImageData(0,0,1,1).data].slice(0,3); };
  const lum = color => rgb(color).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v+.055)/1.055)**2.4; }).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const ratio = (a,b) => { const x=lum(a), y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  const button = document.querySelector('[data-theme-toggle]'), s = getComputedStyle(button);
  const pairs = [{ label:'button glyph', ratio:ratio(s.color,s.backgroundColor), minimum:4.5 }, { label:'button boundary', ratio:ratio(s.borderTopColor,s.backgroundColor), minimum:3 }];
  const probe = document.createElement('span'); document.body.append(probe);
  for (const bg of ['--gh-bg','--gh-bg-raised','--gh-bg-hover']) for (const fg of ['--gh-text','--gh-text-dim','--gh-accent','--gh-win','--gh-loss','--gh-live','--gh-champion','--gh-silver','--gh-bronze']) { probe.style.color=`var(${fg})`; probe.style.background=`var(${bg})`; const p=getComputedStyle(probe); pairs.push({label:fg+' on '+bg, ratio:ratio(p.color,p.backgroundColor), minimum:4.5}); }
  probe.style.color='var(--gh-on-accent)'; probe.style.background='var(--gh-accent)'; let p=getComputedStyle(probe); pairs.push({label:'accent label',ratio:ratio(p.color,p.backgroundColor),minimum:4.5});
  probe.style.color='var(--gh-focus)'; probe.style.background='var(--gh-bg-raised)';p=getComputedStyle(probe); pairs.push({label:'focus on raised',ratio:ratio(p.color,p.backgroundColor),minimum:3}); probe.remove();
  return pairs;
 });
}
async function menu(page) { const b = page.getByRole('button', { name: page.viewportSize().width <= 640 ? /^Menu/ : /^League tools/ }); await b.click(); return b; }
try {
 const stat=await statfs(repo); summary.freeBefore=stat.bavail*stat.bsize; assert.ok(summary.freeBefore>128*1024**2);
 server = spawn(process.execPath, [path.join(repo,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','0'], { cwd:nav.fixture, env:{ PATH:process.env.PATH,TMPDIR:'/tmp',TZ:'UTC',LANG:'en_US.UTF-8',NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:`--import=${path.join(repo,'src/test/arcade/block-external.mjs')}` },stdio:['ignore','pipe','pipe'] });
 for (const stream of [server.stdout,server.stderr]) stream.on('data',x=>logs.push(x.toString()));
 await until(()=>logs.join('').match(/http:\/\/127\.0\.0\.1:(\d+)/),'Server startup'); const origin=logs.join('').match(/http:\/\/127\.0\.0\.1:(\d+)/)[0];
 browser=await chromium.launch({executablePath:process.env.THEME_TEST_CHROME}); summary.browser=browser.version();
 if (!resume) {
 for (const width of [1440,390,320]) for (const scheme of ['light','dark']) for (const signed of [false,true]) {
  const {ctx,page}=await context(origin,width,scheme,{signed}); await page.goto(origin+'/news'); await settled(page); const initial=await state(page,scheme);
  const pairs=await contrast(page); assert.ok(pairs.every(p=>p.ratio>=p.minimum),JSON.stringify(pairs));
  const b=page.locator('[data-theme-toggle]'); await b.hover(); const hoverPairs=await contrast(page); assert.ok(hoverPairs.every(p=>p.ratio>=p.minimum));
  await b.focus(); assert.ok(await b.evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));
  if(!signed) { await page.mouse.move(0,0); await page.locator('body').click({position:{x:1,y:1}}); await page.screenshot({path:path.join(evidence,`${width}-${scheme}.png`)}); }
  record(`${width} ${scheme} signed=${signed}: system default, one control/logo, geometry, contrast/focus`,{initial,pairs,hoverPairs});
  const other=scheme==='light'?'dark':'light'; await page.emulateMedia({colorScheme:other}); await until(async()=>await page.locator('html').getAttribute('data-theme')===other,'Live system update'); await state(page,other); assert.equal(await page.evaluate(()=>localStorage.getItem('goat-hoopers.theme')),null);
  await b.focus(); await page.keyboard.press('Enter'); await state(page,scheme); assert.ok(await b.evaluate(e=>e===document.activeElement)); assert.equal(await page.evaluate(()=>localStorage.getItem('goat-hoopers.theme')),scheme);
  await page.emulateMedia({colorScheme:scheme}); await page.emulateMedia({colorScheme:other}); await pause(60); await state(page,scheme); await page.reload(); await settled(page); await state(page,scheme);
  record(`${width} ${scheme} signed=${signed}: live OS until keyboard choice, persistence/reload, manual ignores OS`);
  if(!signed) {
   for(const route of ['/','/stocks','/news','/history/champions','/arcade','/teams/8','/transactions?keep=theme','/draft','/intel','/ai-decides','/trade-analyzer','/weekly/archive','/team','/claim','/login','/player/synthetic']) {
    await page.goto(origin+route);await settled(page);await state(page,scheme);const trigger=await menu(page);
    assert.equal(await page.locator('#site-navigation-panel a[href="/ai-decides"]').count(),1);if(route==='/ai-decides')assert.equal(await page.locator('#site-navigation-panel a[href="/ai-decides"]').getAttribute('aria-current'),'page');
    await page.keyboard.press('Escape');assert.ok(await trigger.evaluate(e=>e===document.activeElement));
   }
   record(`${width} ${scheme}: all 16 shared-shell direct routes/menu/AI current contract`);
   await page.goto(origin+'/stocks?keep=theme-back');await settled(page);await page.evaluate(()=>scrollTo(0,220));await menu(page);await page.locator('#site-navigation-panel a[href="/transactions"]').click();await page.waitForURL('**/transactions');await settled(page);const departure=await page.evaluate(()=>window.__themeDeparture);
   await page.locator('[data-theme-toggle]').click();await state(page,other);await page.goBack();await page.waitForURL('**/stocks?keep=theme-back');await settled(page);await pause(80);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-departure.y)<=2);await state(page,other);await page.goForward();await settled(page);await state(page,other);
   record(`${width} ${scheme}: theme survives Next Back/Forward with exact query/departure scroll`,departure);
  }
  await ctx.close();
 }
 for(const saved of ['light','dark','invalid']) {
  const expected=saved==='light'?'light':'dark';const {ctx,page}=await context(origin,390,'dark',{saved});await page.goto(origin+'/news');await settled(page);await state(page,expected);record(`saved ${saved}: validated manual/system policy`);await ctx.close();
 }
 const {ctx:denied,page:blockedPage}=await context(origin,320,'light',{blocked:true});await blockedPage.goto(origin+'/news');await settled(blockedPage);await state(blockedPage,'light');await blockedPage.locator('[data-theme-toggle]').click();await state(blockedPage,'dark');await blockedPage.emulateMedia({colorScheme:'dark'});await blockedPage.emulateMedia({colorScheme:'light'});await pause(60);await state(blockedPage,'dark');await blockedPage.reload();await settled(blockedPage);await state(blockedPage,'light');record('blocked storage: system default, manual session works/ignores OS, reload falls back');await denied.close();
 }
 for(const width of [390,320,720]) {
  const {ctx,page}=await context(origin,width,'dark',{signed:true});await page.goto(origin+'/news');await settled(page);if(width<640)await page.evaluate(()=>document.documentElement.style.fontSize='32px');await settled(page);await state(page,'dark');const trigger=await menu(page);assert.ok(await page.locator('#site-navigation-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.locator('#site-navigation-panel a[href="/ai-decides"]').focus();const r=await page.locator('#site-navigation-panel a[href="/ai-decides"]').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width+1);await page.keyboard.press('Escape');assert.ok(await trigger.evaluate(e=>e===document.activeElement));await page.locator('[data-theme-toggle]').focus();await page.setViewportSize({width:1440,height:900});await settled(page);assert.ok(await page.locator('[data-theme-toggle]').evaluate(e=>e===document.activeElement));await state(page,'dark');record(`${width}: 200% reflow/enlarged text and resize retain theme control/focus`);await ctx.close();
 }
 let release;const gate=new Promise(r=>release=r);const {ctx:pre,page:prePage}=await context(origin,390,'light',{saved:'dark',hydrationGate:gate});try {
  await prePage.goto(origin+'/news',{waitUntil:'domcontentloaded'});await prePage.locator('[data-theme-toggle]').waitFor();assert.equal(await prePage.locator('html').getAttribute('data-theme'),'dark');assert.equal(await prePage.locator('[data-theme-toggle]').isDisabled(),true);assert.ok((await prePage.locator('header img:visible').getAttribute('src')).endsWith('horizontal-white.svg'));record('saved dark prepaint applied while all hydration chunks are gated');
 } finally {release();}await settled(prePage);await state(prePage,'dark');await pre.close();
 const {ctx:aliases,page:aliasPage}=await context(origin,1440,'dark');await aliasPage.goto(origin+'/');await settled(aliasPage);const css=await readFile(path.join(repo,'src/ui/courtside-tokens.css'),'utf8');summary.courtsideProbeHash=createHash('sha256').update(css).digest('hex');await aliasPage.addStyleTag({content:css});await aliasPage.locator('#main-content main').evaluate(e=>e.setAttribute('data-courtside-home',''));
 const values=await aliasPage.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['--gh-bg','--gh-cs-wall','--gh-term-bg','--gh-wood-bg','--gh-neutral-canvas','--gh-text','--gh-cs-ink','--gh-term-text','--gh-parchment','--gh-neutral-ink'].map(n=>[n,s.getPropertyValue(n).trim()]));});assert.ok(Object.entries(values).filter(([n])=>/bg|wall|canvas/.test(n)).every(([,v])=>v==='#151d24'));assert.ok(Object.entries(values).filter(([n])=>/text|ink|parchment/.test(n)).every(([,v])=>v==='#f5f4ef'));record('Courtside/Trade/History/chart aliases resolve from html root; labelled body probe',values);await aliases.close();
 assert.deepEqual(summary.errors,[]);assert.deepEqual(summary.consoleErrors,[]);assert.deepEqual(summary.blockedExternal,[]);assert.deepEqual(summary.blockedWrites,[]);summary.status='passed';
} catch(e) {summary.status='failed';summary.error=e.stack;if(lastPage&&!lastPage.isClosed())await lastPage.screenshot({path:path.join(evidence,'failure.png')});throw e;}
finally {await browser?.close();if(server?.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}summary.processesClosed=true;await writeFile(path.join(evidence,'server.log'),logs.join(''));await writeFile(path.join(evidence,'results.json'),JSON.stringify(summary,null,2));}
