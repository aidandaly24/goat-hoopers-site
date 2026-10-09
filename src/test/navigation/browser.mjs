// Focused production-Next navigation QA. Only private synthetic loopback data.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, readFile, readdir, statfs, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
assert.equal(process.versions.node.split(".")[0], "22");
assert.ok(process.env.NAV_TEST_PLAYWRIGHT, "Supply separately installed Playwright");
assert.equal((await readdir(repo)).some(n => /^\.env($|\.)/.test(n) && n !== ".env.example"), false);
const { chromium } = await import(pathToFileURL(process.env.NAV_TEST_PLAYWRIGHT).href);
const evidence = path.resolve(process.env.NAV_TEST_EVIDENCE ?? path.join(repo, "navigation-evidence"));
await mkdir(evidence, { recursive: true });
const fixture = process.env.NAV_TEST_REUSE ? path.resolve(process.env.NAV_TEST_REUSE) : await mkdtemp(path.join(evidence, "next-fixture-"));
assert.ok(fixture.startsWith(evidence + "/next-fixture-"));
const reusedReceipt = process.env.NAV_TEST_REUSE ? JSON.parse(await readFile(path.join(evidence, "results.json"), "utf8")) : null;
if (reusedReceipt) { assert.equal(reusedReceipt.fixture, fixture); assert.ok(reusedReceipt.checks.some(c => c.name === "production Next fixture build")); for (const [name, hash] of Object.entries(reusedReceipt.hashes)) assert.equal(createHash("sha256").update(await readFile(path.join(repo, name))).digest("hex"), hash, "Reused build source mismatch: " + name); }
const env = { PATH: process.env.PATH, TMPDIR: "/tmp", LANG: "en_US.UTF-8", TZ: "UTC", NEXT_TELEMETRY_DISABLED: "1" };
const summary = { status: "running", fixture, node: process.version, credentials: "absent", limitations: "Synthetic market/session and ticker-poller adapters; production shell, Stocks/Trade components, Next routing and Google fonts. Not live data/auth or physical Safari.", hashes: {}, checks: [], errors: [], blockedExternal: [], blockedWrites: [] };
const record = (name, detail = true) => { summary.checks.push({ name, detail }); console.log(name); };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, message) { const end = Date.now() + 10000; while (Date.now() < end) { if (await check()) return; await pause(25); } assert.fail(message); }
const free = async () => { const s = await statfs(repo); return s.bavail * s.bsize; };
summary.freeBefore = await free();
assert.ok(summary.freeBefore > 512 * 1024 ** 2, "512 MiB preflight floor");
async function file(name, source) { const target = path.join(fixture, name); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, source); }
async function copy(name) {
  const target = path.join(fixture, name); await mkdir(path.dirname(target), { recursive: true }); await cp(path.join(repo, name), target);
  const source = await readFile(path.join(repo, name)); assert.deepEqual(await readFile(target), source);
  summary.hashes[name] = createHash("sha256").update(source).digest("hex");
}
for (const dir of ["src/domain", "src/surfaces/stock-market", "src/surfaces/trade-analyzer"]) {
  await cp(path.join(repo, dir), path.join(fixture, dir), { recursive: true, filter: n => !/(?:__tests__|\.test\.|\.md$)/.test(n) });
}
for (const name of ["SiteHeader", "SiteFooter", "SiteChrome", "SectionNav", "Badge", "Card", "PlayerRow", "PlayerHeadshot"]) {
  await copy(`src/ui/${name}.tsx`);
  if (name !== "SectionNav") await copy(`src/ui/${name}.module.css`);
}
for (const name of ["currentRoute.ts", "siteDestinations.ts", "teamColors.ts", "tokens.css"]) await copy(`src/ui/${name}`);
for (const name of ["src/data/espn.ts", "src/app/layout.tsx", "src/app/globals.css", "src/app/stocks/page.tsx", "src/app/trade-analyzer/page.tsx", "src/test/site-shell/stocks.ts", "src/surfaces/trade-analyzer/TradeAnalyzer.tsx", "src/surfaces/trade-analyzer/TradeAnalyzer.module.css", "src/surfaces/stock-market/StockMarket.tsx"]) await copy(name);
if (!reusedReceipt) { await symlink(path.join(repo, "node_modules"), path.join(fixture, "node_modules")); await symlink(path.join(repo, "public"), path.join(fixture, "public")); }
await file("package.json", JSON.stringify({ private: true }));
await file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], strict: true, skipLibCheck: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", jsx: "react-jsx", paths: { "@/*": ["./src/*"] } }, include: ["**/*.ts", "**/*.tsx"] }));
await file("src/app/actions.ts", `"use server"; import { cookies } from 'next/headers';
export async function getCurrentUser() { return (await cookies()).get('qa-user')?.value === 'signed' ? { displayName: 'Synthetic Alexandria Verylongmanagername', teamId: '1' } : null; }
export async function logout() { throw new Error('Fixture refuses account writes'); }`);
await file("src/data/league.ts", `import { syntheticStocks } from '@/test/site-shell/stocks'; import type { NewsArticle, Season, StockMarket } from '@/domain';
export async function getSeasonMeta(): Promise<Season | null> { return null; }
export async function getLeagueNews(): Promise<NewsArticle[]> { return []; }
export async function getStockMarketData(): Promise<StockMarket> { return { stocks: syntheticStocks, trending: [], falling: [], panic: [], updatedAt: 1791547200000, pricingBasis: 'preseason', hasHistory: false }; }`);
await file("src/data/espn-client.ts", `import type { LiveGame } from "@/domain"; export function useLiveGames(): LiveGame[] | null { return null; }`);
await file("src/data/stock-detail-client.ts", `export { fetchStockDetail } from '@/test/site-shell/stocks';`);
const layout = await readFile(path.join(fixture, "src/app/layout.tsx"), "utf8");
await file("src/app/layout.tsx", `import { cookies } from 'next/headers';\n` + layout.replace("async function Ticker() {", "async function Ticker() {\n  if ((await cookies()).get('qa-ticker')?.value === 'off') return null;"));
summary.layoutAdapter = "Only qa-ticker=off guard added in fixture; source hash above identifies original layout.";
await file("src/app/[...segments]/page.tsx", `export default function Page() { return <main style={{ padding: '2rem', minHeight: '110rem' }}><h1>Synthetic destination</h1><p>Navigation fixture only.</p></main>; }`);
await file("src/app/page.tsx", `export default function Page() { return <main style={{ padding: '2rem', minHeight: '110rem' }}><h1>Synthetic home</h1></main>; }`);
const next = path.join(repo, "node_modules/next/dist/bin/next");
const logs = [];
let server, browser, lastPage;
let fixturePhase = true;
function child(args, cwd = fixture, blocked = false) {
  const proc = spawn(process.execPath, [next, ...args], { cwd, env: { ...env, ...(blocked ? { NODE_OPTIONS: `--import=${path.join(repo, "src/test/arcade/block-external.mjs")}` } : {}) }, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [proc.stdout, proc.stderr]) stream.on("data", x => { logs.push(x.toString()); process.stdout.write(x); });
  return proc;
}
async function stopServer() { if (server?.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); } }
async function start(cwd = fixture, blocked = false) {
  const from = logs.length; server = child(["start", "--hostname", "127.0.0.1", "--port", "0"], cwd, blocked);
  await until(() => logs.slice(from).join("").match(/http:\/\/127\.0\.0\.1:(\d+)/), "Server did not start");
  return logs.slice(from).join("").match(/http:\/\/127\.0\.0\.1:(\d+)/)[0];
}
async function settled(page) {
  await page.waitForLoadState("networkidle");
  if (fixturePhase) await page.locator("#main-content h1").waitFor({ state: "visible" });
  await page.waitForFunction(() => { const c = document.querySelector('[data-site-chrome]'); return c && Math.abs(c.getBoundingClientRect().height - parseFloat(document.documentElement.style.getPropertyValue('--gh-chrome-h'))) < 1; });
}
async function geometry(page) {
  return page.evaluate(() => {
    const box = e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }; };
    const visible = e => e.getClientRects().length > 0;
    const chrome = document.querySelector('[data-site-chrome]'); const header = document.querySelector('header'); const panel = document.querySelector('#site-navigation-panel');
    const primary = [...header.querySelectorAll('nav[aria-label="Primary"]')].find(visible);
    const controls = [...header.querySelectorAll('a,button'), ...panel.querySelectorAll('a,button')].filter(visible);
    return { compact: matchMedia('(max-width:40rem)').matches, chrome: box(chrome), heading: document.querySelector('#main-content h1') ? box(document.querySelector('#main-content h1')) : null, overflow: document.documentElement.scrollWidth - innerWidth, rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize), sharedOverflow: [header, panel, document.querySelector("footer")].map(e => ({ name: e.tagName, overflow: e.scrollWidth - e.clientWidth })), headingTextRight: (() => { const h = document.querySelector("#main-content h1"); if (!h) return null; const r = document.createRange(); r.selectNodeContents(h); return r.getBoundingClientRect().right; })(),
      controls: controls.map(e => ({ text: e.textContent, href: e.getAttribute('href'), current: e.getAttribute('aria-current'), ...box(e) })), primary: [...primary.querySelectorAll('a')].map(e => e.getAttribute('href')),
      panel: { ...box(panel), hidden: !visible(panel), position: getComputedStyle(panel).position, insideChrome: chrome.contains(panel) }, bottomPadding: getComputedStyle(document.body).paddingBottom,
      focus: document.activeElement?.textContent?.slice(0, 90), focusId: document.activeElement?.id, scrollY };
  });
}
const primary = ["/", "/news", "/stocks", "/history", "/arcade"];
const league = ["/teams", "/transactions", "/draft", "/intel", "/trade-analyzer", "/weekly"];
async function shell(page, signed = false, route = "/stocks", open = false) {
  await settled(page); const g = await geometry(page);
  if (g.overflow > 1) { assert.equal(g.rootFont, 32, "Unexpected page overflow " + JSON.stringify(g)); assert.ok(fixturePhase, "Real app page overflow"); summary.knownBodyOverflow ??= []; summary.knownBodyOverflow.push({ route, rootFont: g.rootFont, viewport: (await page.viewportSize()).width, overflow: g.overflow, headingTextRight: g.headingTextRight }); }
  for (const node of g.sharedOverflow) assert.ok(node.overflow <= 1, "Shared shell overflow " + JSON.stringify(node));
  assert.deepEqual(g.primary, g.compact ? ["/stocks"] : [...primary, ...(!signed ? ["/team"] : [])]);
  assert.equal(g.bottomPadding, "0px");
  for (const c of g.controls) { assert.ok(c.left >= -1 && c.right <= (await page.viewportSize()).width + 1, "Control overflow " + JSON.stringify(c)); assert.ok(c.height >= 43.9 && c.width >= 43.9, "44px target " + JSON.stringify(c)); }
  assert.equal(g.controls.filter(c => c.href === "/stocks").length, 1);
  const current = g.controls.filter(c => c.current === "page").map(c => c.href);
  const active = [...primary, ...league, "/team", "/claim", "/login"].find(h => route === h || h !== "/" && route.startsWith(h + "/"));
  const expected = g.compact && !open && active !== "/stocks" ? [] : !g.compact && league.includes(active) && !open ? [] : active ? [active] : [];
  assert.deepEqual(current, expected);
  if (open) { assert.ok(["static", "relative"].includes(g.panel.position)); assert.equal(g.panel.insideChrome, false); assert.equal(g.panel.hidden, false); }
  return g;
}
async function openMenu(page) { const g = await geometry(page); const button = page.getByRole('button', { name: g.compact ? /^Menu/ : /^League tools/ }); await button.click(); await until(async () => (await geometry(page)).panel.hidden === false, "Menu did not open"); await pause(70); return button; }
const profiles = [{ name: "desktop", width: 1440, height: 900 }, { name: "tablet", width: 741, height: 900 }, { name: "phone390", width: 390, height: 844 }, { name: "phone320", width: 320, height: 568 }, { name: "zoom200-reflow", width: 720, height: 450 }, { name: "text200-390", width: 390, height: 900, font: 32 }, { name: "text200-320", width: 320, height: 900, font: 32 }];
async function make(origin, profile, signed, ticker) {
  const ctx = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, reducedMotion: "reduce" });
  await ctx.addCookies([{ name: "qa-user", value: signed ? "signed" : "anon", url: origin }, { name: "qa-ticker", value: ticker ? "on" : "off", url: origin }]);
  await ctx.addInitScript(() => { const push = history.pushState.bind(history); history.pushState = (...args) => { window.__navCommitDeparture = scrollY; window.__navDepartureUrl = location.href; return push(...args); }; });
  if (profile.font) await ctx.addInitScript(size => { const apply = () => { if (document.documentElement) document.documentElement.style.fontSize = `${size}px`; }; addEventListener('DOMContentLoaded', apply); apply(); }, profile.font);
  await ctx.route("**/*", route => { const req = route.request(); if (new URL(req.url()).origin !== origin) { summary.blockedExternal.push(req.url()); return route.abort(); } if (req.method() !== "GET") { summary.blockedWrites.push(req.method()); return route.abort(); } return route.continue(); });
  const page = await ctx.newPage(); lastPage = page; page.setDefaultTimeout(10000); page.on('pageerror', e => summary.errors.push(e.message)); return { ctx, page };
}
try {
  if (!reusedReceipt) { const build = child(["build", "--webpack"]); const [code] = await once(build, "exit"); assert.equal(code, 0, "Production fixture build failed"); } else { summary.reusedBuild = true; }
  record("production Next fixture build"); summary.freeAfterBuild = await free(); assert.ok(summary.freeAfterBuild > 128 * 1024 ** 2);
  assert.ok(summary.freeBefore - summary.freeAfterBuild < 500 * 1024 ** 2, "500 MiB fixture build budget");
  const origin = await start(fixture, true);
  browser = await chromium.launch({ executablePath: process.env.NAV_TEST_CHROME }); summary.browser = browser.version();
  const selectedProfiles = process.env.NAV_TEST_PROFILES ? profiles.filter(p => process.env.NAV_TEST_PROFILES.split(",").includes(p.name)) : profiles; summary.profiles = selectedProfiles; assert.ok(selectedProfiles.length);
  for (const profile of selectedProfiles) for (const ticker of [false, true]) for (const signed of [false, true]) {
    const { ctx, page } = await make(origin, profile, signed, ticker);
    await page.goto(origin + "/stocks"); const initial = await shell(page, signed);
    assert.ok(initial.heading.top >= initial.chrome.bottom - 1, "Initial Stocks heading covered");
    assert.ok(initial.panel.hidden);
    await page.locator('header a[href="/stocks"]:visible').click(); assert.equal(await page.evaluate(() => document.activeElement.getAttribute("href")), "/stocks", "Current link should keep its focus on every layout");
    const button = await openMenu(page); const expanded = await shell(page, signed, "/stocks", true);
    assert.equal(expanded.chrome.height, initial.chrome.height, "Disclosure changed sticky height");
    assert.deepEqual(await page.locator('#site-navigation-panel nav[aria-label="League tools"] a').evaluateAll(a => a.map(e => e.getAttribute('href'))), league);
    if (expanded.compact) assert.deepEqual(await page.locator('#site-navigation-panel nav[aria-label="More destinations"] a').evaluateAll(a => a.map(e => e.getAttribute('href'))), primary.filter(h => h !== '/stocks'));
    assert.equal(expanded.controls.filter(c => c.href === '/team').length, 1);
    if (expanded.compact && profile.font) assert.ok(await page.locator('#site-navigation-panel nav a').evaluateAll(links => links.every(link => { const s = getComputedStyle(link); const canvas = document.createElement('canvas'); const context = canvas.getContext('2d'); context.font = s.font; const longest = Math.max(...link.textContent.trim().split(/\s+/).map(word => context.measureText(word).width)); return longest <= link.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) + 1; })), 'Enlarged menu words should fit without fragmentation');
    if (ticker && !signed && ['desktop', 'phone390', 'phone320'].includes(profile.name)) await page.screenshot({ path: path.join(evidence, `${profile.name}-menu.png`) });
    if (expanded.compact && profile.font && signed) {
      await page.screenshot({ path: path.join(evidence, `${profile.name}-signed-menu-${ticker ? 'ticker' : 'plain'}.png`) });
      const logout = page.locator('#site-navigation-panel').getByRole('button', { name: 'Log out' }); await logout.focus(); const accountBox = await logout.boundingBox(); assert.ok(accountBox.y >= expanded.chrome.bottom - 1 && accountBox.y + accountBox.height <= profile.height + 1, 'Final signed account keyboard reachability');
      if (ticker) await page.screenshot({ path: path.join(evidence, `${profile.name}-signed-account.png`) });
    }
    await page.keyboard.press('Escape'); assert.equal(await button.getAttribute('aria-expanded'), 'false'); assert.ok(await button.evaluate(e => e === document.activeElement));
    if (!signed) {
      await page.evaluate(() => scrollTo(0, 220)); await pause(50); await openMenu(page);
      const tradeLink = page.locator('#site-navigation-panel a[href="/trade-analyzer"]');
      await tradeLink.scrollIntoViewIfNeeded();
      await tradeLink.evaluate(link => link.addEventListener('click', () => { window.__navDeparture = scrollY; }, { once: true, capture: true }));
      await tradeLink.click(); await page.waitForURL('**/trade-analyzer'); await shell(page, signed, '/trade-analyzer');
      const departure = await page.evaluate(() => ({ pointer: window.__navDeparture, commit: window.__navCommitDeparture, from: window.__navDepartureUrl })); assert.equal(typeof departure.pointer, 'number'); assert.equal(typeof departure.commit, 'number');
      assert.ok((await geometry(page)).heading.top >= (await geometry(page)).chrome.bottom - 1, "Trade heading covered");
      const returnLink = page.getByRole('link', { name: '← Back to Stocks', exact: true }); assert.equal(await returnLink.count(), 1); const returnBox = await returnLink.boundingBox(); assert.ok(returnBox.x >= 0 && returnBox.x + returnBox.width <= profile.width + 1 && returnBox.height >= 44, 'Return-link bounds/target');
      await page.getByRole('link', { name: '← Back to Stocks', exact: true }).click(); await page.waitForURL('**/stocks'); await shell(page, signed);
      await page.goBack(); await page.waitForURL('**/trade-analyzer'); await settled(page);
      await page.goBack(); await page.waitForURL('**/stocks'); await settled(page);
      await pause(100); const restored = await page.evaluate(() => scrollY);
      assert.ok(Math.abs(restored - departure.commit) <= 2, 'Back scroll expected actual history departure ' + JSON.stringify({ departure, restored }));
      record(`${profile.name} ticker=${ticker}: Back actual departure`, { departure, restored });
      await page.goForward(); await page.waitForURL('**/trade-analyzer'); await settled(page);
      await page.goto(origin + '/trade-analyzer?a=shell-synthetic-0&b=shell-synthetic-1&keep=navigation'); await settled(page);
      assert.deepEqual(await page.getByRole('region', { name: 'TEAM A' }).getByRole('link').allTextContents(), ['Synthetic player 1']);
      assert.deepEqual(await page.getByRole('region', { name: 'TEAM B' }).getByRole('link').allTextContents(), ['Synthetic player 2']);
      await page.getByRole('link', { name: '← Back to Stocks', exact: true }).click(); await page.waitForURL('**/stocks');
      await page.goBack(); await page.waitForURL('**/trade-analyzer?**'); await settled(page); assert.equal(new URL(page.url()).searchParams.get('keep'), 'navigation');
      if (ticker && ['desktop','phone390','phone320','text200-320'].includes(profile.name)) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: path.join(evidence, `${profile.name}-trade-return.png`) }); }
    }
    record(`${profile.name} ticker=${ticker} signed=${signed}: inventory, targets, current, menu, Escape${!signed ? ', actual Next round trip/Back/Forward/shared URL' : ''}`, { initial, expanded }); await ctx.close();
  }
  const { ctx, page } = await make(origin, profiles[2], false, true);
  for (const route of ['/', '/news', '/history/champions', '/arcade', '/teams/1', '/transactions', '/draft', '/intel', '/trade-analyzer', '/weekly/archive', '/team', '/claim', '/login']) {
    await page.goto(origin + route); await openMenu(page); await shell(page, false, route, true); record('current route ' + route);
  }
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(origin + '/'); await settled(page);
  await page.getByRole('link', { name: 'Home', exact: true }).first().click(); assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Home');
  const desktopTrigger = await openMenu(page);
  for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => document.activeElement.getClientRects().length > 0)); }
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Weekly archive'); await page.keyboard.press('Escape'); assert.ok(await desktopTrigger.evaluate(e => document.activeElement === e)); record('desktop keyboard header/account and all league links; current Home focus');
  await page.screenshot({ path: path.join(evidence, 'desktop-home-current.png'), clip: { x: 0, y: 0, width: 1440, height: 220 } });
  await page.locator('#main-content main').evaluate(e => e.setAttribute('data-courtside-home', '')); await settled(page); await page.screenshot({ path: path.join(evidence, 'desktop-home-current-courtside.png'), clip: { x: 0, y: 0, width: 1440, height: 220 } }); record('Home current state, including production courtside CSS condition on labeled synthetic body');
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(origin + '/stocks'); await settled(page);
  await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content'); await page.keyboard.press('Enter'); await pause(70);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content'); assert.ok((await page.locator('#main-content').boundingBox()).y >= (await geometry(page)).chrome.bottom - 1); record('global skip focus offset');
  await page.goto(origin + '/stocks'); await settled(page);
  await page.locator('header a[href="/stocks"]:visible').click(); assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '/stocks'); record('ordinary current link retains its own focus');
  let trigger = await openMenu(page);
  const panelLinks = await page.locator('#site-navigation-panel a').count();
  for (let i = 0; i < panelLinks; i++) { await page.keyboard.press('Tab'); const visible = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.height > 0 && r.top >= document.querySelector('[data-site-chrome]').getBoundingClientRect().bottom - 1 && r.bottom <= innerHeight + 1; }); assert.ok(visible, 'Open-menu keyboard target hidden by sticky chrome'); }
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Log in'); await page.keyboard.press('Escape'); assert.ok(await trigger.evaluate(e => e === document.activeElement)); await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.closest('#site-navigation-panel') !== null), false); record('all menu destinations/account keyboard, Escape and closed tab order');
  await openMenu(page); await page.evaluate(() => { document.querySelector('#site-navigation-panel a').addEventListener('click', e => e.preventDefault(), { once: true }); }); await page.locator('#site-navigation-panel a').first().click({ modifiers: ['Meta'] }); assert.equal(await trigger.getAttribute('aria-expanded'), 'true'); record('modified click preserves current disclosure');
  await page.evaluate(() => { const d = document.createElement('dialog'); d.innerHTML = '<button>Fixture modal</button>'; document.body.append(d); d.showModal(); }); await page.keyboard.press('Escape'); assert.equal(await trigger.getAttribute('aria-expanded'), 'true'); assert.equal(await page.locator('dialog').evaluate(d => d.open), false); record('native modal Escape priority');
  await page.keyboard.press('Escape'); await trigger.focus(); await page.setViewportSize({ width: 1440, height: 900 }); await settled(page); assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '/stocks');
  trigger = await openMenu(page); await page.locator('#site-navigation-panel a').first().focus(); await page.setViewportSize({ width: 390, height: 844 }); await settled(page); assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '/stocks'); assert.ok((await geometry(page)).panel.hidden); record('breakpoint restores visible focus from header and panel');
  await page.goto(origin + '/stocks'); await page.getByRole('link', { name: 'Skip to player board' }).focus(); await page.keyboard.press('Enter'); await pause(60); assert.equal(new URL(page.url()).hash, '#player-board'); assert.ok((await page.locator('#player-board').boundingBox()).y >= (await geometry(page)).chrome.bottom - 1); await page.keyboard.press('Tab'); assert.ok(await page.getByRole('searchbox', { name: 'Search players' }).evaluate(e => document.activeElement === e)); record('existing player-board fragment offset and subsequent keyboard focus');
  await ctx.close(); await stopServer();
  assert.deepEqual(summary.errors, [], 'Synthetic fixture browser errors');
  summary.fixtureErrors = [];
  if (process.argv.includes('--real-app')) {
    fixturePhase = false; const real = await start(repo, true);
    for (const profile of [profiles[0], profiles[2], profiles[3]]) {
      const { ctx: realContext, page: realPage } = await make(real, profile, false, false);
      for (const route of ['/stocks','/trade-analyzer']) { await realPage.goto(real + route); await shell(realPage, false, route); await openMenu(realPage); await shell(realPage, false, route, true); record('real app blocked-data recovery ' + profile.name + route); }
      await realContext.close();
    }
    await stopServer();
  }
  assert.deepEqual(summary.blockedWrites, []); assert.deepEqual(summary.blockedExternal, []);
  summary.status = 'passed';
} catch (error) { summary.status = 'failed'; summary.error = error.stack; if (lastPage && !lastPage.isClosed()) { summary.failureUrl = lastPage.url(); summary.failureText = (await lastPage.locator('body').innerText()).slice(0, 1600); await lastPage.screenshot({ path: path.join(evidence, 'failure.png') }); } throw error; }
finally { await browser?.close(); await stopServer(); summary.freeAfter = await free(); await writeFile(path.join(evidence, 'server.log'), logs.join('')); await writeFile(path.join(evidence, 'results.json'), JSON.stringify(summary, null, 2)); }
