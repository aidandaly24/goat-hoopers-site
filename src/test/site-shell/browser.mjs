// Shared-shell QA only: private loopback, synthetic data, no credentials/writes.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
assert.equal(process.versions.node.split(".")[0], "22");
assert.equal((await readdir(repo)).some(name => /^\.env($|\.)/.test(name) && name !== ".env.example"), false);
assert.ok(process.env.SHELL_TEST_PLAYWRIGHT, "Supply separately installed Playwright");
const { chromium } = await import(pathToFileURL(process.env.SHELL_TEST_PLAYWRIGHT).href);
const evidence = path.resolve(process.env.SHELL_TEST_EVIDENCE ?? path.join(repo, "shell-evidence"));
await mkdir(evidence, { recursive: true });
const summary = { checks: [], pageErrors: [], blockedExternal: [], blockedWrites: [], credentials: "absent" };
const servers = [];
const logs = [];
const pageSafeAreas = new WeakMap();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const record = (check, detail) => { summary.checks.push({ check, detail }); console.log(check + ": " + JSON.stringify(detail)); };
async function start(fixture) {
  const args = fixture
    ? [path.join(repo, "node_modules/vite/bin/vite.js"), "src/test/site-shell", "--config", "src/test/site-shell/vite.config.mts"]
    : [path.join(repo, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "0"];
  const output = [];
  const server = spawn(process.execPath, args, { cwd: repo, env: {
    PATH: process.env.PATH, TMPDIR: "/tmp", LANG: "en_US.UTF-8", TZ: "UTC", NEXT_TELEMETRY_DISABLED: "1",
    ...(fixture ? {} : { NODE_OPTIONS: `--import=${path.join(repo, "src/test/arcade/block-external.mjs")}` }),
  }, stdio: ["ignore", "pipe", "pipe"] });
  servers.push(server);
  for (const stream of [server.stdout, server.stderr]) stream.on("data", x => { output.push(x.toString()); logs.push(x.toString()); });
  for (let i = 0; i < 100 && !output.join("").match(/http:\/\/127\.0\.0\.1:(\d+)/); i++) await pause(100);
  const origin = output.join("").match(/http:\/\/127\.0\.0\.1:(\d+)/)?.[0];
  assert.ok(origin, output.join(""));
  return origin;
}
let browser;
async function context(width, height = 900, owner = browser, safeArea = 0) {
  const ctx = await owner.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  await ctx.route("**/*", route => {
    const request = route.request();
    if (request.method() !== "GET") { summary.blockedWrites.push(request.method()); return route.abort(); }
    if (new URL(request.url()).hostname !== "127.0.0.1") { summary.blockedExternal.push(new URL(request.url()).hostname); return route.abort(); }
    return route.continue();
  });
  const page = await ctx.newPage();
  if (safeArea) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: safeArea } });
  }
  pageSafeAreas.set(page, safeArea);
  page.setDefaultTimeout(10000);
  page.on("pageerror", error => summary.pageErrors.push(error.message));
  return { ctx, page };
}
async function settled(page) {
  await page.locator("[data-site-chrome]").waitFor();
  await page.waitForFunction(() => {
    const chrome = document.querySelector("[data-site-chrome]");
    return Math.abs(parseFloat(document.documentElement.style.getPropertyValue("--gh-chrome-h")) - chrome.getBoundingClientRect().height) < 1;
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function geometry(page, heading = true) {
  return page.evaluate(heading => {
    const box = e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }; };
    const chrome = document.querySelector("[data-site-chrome]");
    const nav = [...document.querySelectorAll('nav[aria-label="Primary"]')].find(e => getComputedStyle(e).display !== "none");
    const links = [...nav.querySelectorAll("a")];
    const target = document.querySelector("#main-content h1");
    return { chrome: box(chrome), heading: heading && target ? box(target) : null, viewport: innerWidth,
      nav: box(nav), links: links.map(e => ({ href: e.getAttribute("href"), current: e.getAttribute("aria-current"), ...box(e) })),
      controls: [...chrome.querySelectorAll("a, button")].filter(e => e.getBoundingClientRect().width > 1).map(e => ({ text: e.textContent, ...box(e) })),
      targetMarginTop: target ? parseFloat(getComputedStyle(target).scrollMarginTop) : parseFloat(getComputedStyle(document.getElementById("main-content")).scrollMarginTop),
      bottomPadding: parseFloat(getComputedStyle(document.body).paddingBottom),
      navPosition: getComputedStyle(nav).position,
      navSafeArea: parseFloat(getComputedStyle(nav).paddingBottom),
      rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      labels: [...nav.querySelectorAll("a > span:last-child")].map(e => ({ text: e.textContent, fontSize: parseFloat(getComputedStyle(e).fontSize), ...box(e) })),
    };
  }, heading);
}
const destinations = ["/", "/news", "/stocks", "/history", "/arcade", "/team"];
async function verifyShell(page, { signed = false, title = true } = {}) {
  await settled(page);
  const g = await geometry(page, title);
  assert.equal(g.chrome.top, 0, "No empty ticker gap");
  for (const r of [...g.controls, g.nav]) {
    assert.ok(r.left >= -1 && r.right <= g.viewport + 1, "Shell must not overflow: " + JSON.stringify(r));
  }
  for (const link of g.links) {
    assert.ok(link.width >= 44 && link.height >= 44, "Primary touch target: " + JSON.stringify(link));
  }
  assert.deepEqual(g.links.map(e => e.href), signed && g.navPosition !== "fixed" ? destinations.slice(0, -1) : destinations);
  const pathname = new URL(page.url()).pathname;
  const active = destinations.find(href => pathname === href || (href !== "/" && pathname.startsWith(href + "/")));
  const expected = signed && active === "/team" && g.navPosition !== "fixed" ? [] : active ? [active] : [];
  assert.deepEqual(g.links.filter(e => e.current === "page").map(e => e.href), expected);
  if (g.heading) assert.ok(g.heading.top >= g.chrome.bottom - 1, "Initial/anchored title must clear chrome: " + JSON.stringify(g));
  if (g.navPosition === "fixed") {
    assert.ok(g.bottomPadding >= g.nav.height - 1, "Enlarged mobile bar must reserve its actual height");
    assert.ok(g.navSafeArea >= (pageSafeAreas.get(page) ?? 0), "Actual CSS env safe area is reserved");
    if (g.rootFontSize === 16) for (const label of g.labels) assert.ok(label.height <= label.fontSize * 1.8, "Normal-size primary labels fit one line: " + label.text);
  }
  assert.ok(g.targetMarginTop >= g.chrome.height, "Anchor/focus clearance follows actual chrome height");
  return g;
}
async function visibleFocus(locator) {
  // Establish real keyboard modality after pointer selection, then check the
  // intended focus-visible state rather than requiring a mouse-only outline.
  await locator.page().keyboard.press("Tab");
  await locator.focus();
  const focus = await locator.evaluate(e => {
    const r = e.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const outline = getComputedStyle(e).outlineStyle;
    return { visible: !!hit && (e === hit || e.contains(hit)) && outline !== "none", outline,
      label: e.getAttribute("aria-label") ?? e.textContent, hit: hit?.tagName, hitClass: hit?.className,
      top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  });
  assert.equal(focus.visible, true, "Keyboard-focused control must be visible and unobstructed: " + JSON.stringify(focus));
}

async function keyboard(page, shot) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content", exact: true });
  assert.equal(await skip.evaluate(e => e === document.activeElement), true, "Skip content is the first keyboard stop");
  assert.equal(await skip.evaluate(e => getComputedStyle(e).clipPath), "none");
  await visibleFocus(skip);
  if (shot) await page.screenshot({ path: path.join(evidence, shot) });
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
  for (const localSkip of await page.locator('#main-content a').filter({ hasText: /^Skip / }).all()) await visibleFocus(localSkip);
  const nav = page.getByRole("navigation", { name: "Primary", exact: true }).filter({ visible: true });
  for (const link of await nav.getByRole("link").all()) await visibleFocus(link);
  await page.evaluate(() => document.activeElement?.blur());
}
async function gameChecks(origin, fixture) {
  const gameErrorsBefore = summary.pageErrors.length;
    const gameBrowser = await chromium.launch({ headless: true, ...(process.env.SHELL_TEST_CHROME ? { executablePath: process.env.SHELL_TEST_CHROME } : {}), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    try {
      const gameProfiles = [[741, 832, 16, 0], [720, 450, 16, 0], [390, 844, 16, 34], [320, 568, 16, 34], [741, 900, 32, 0], [390, 900, 32, 34], [320, 900, 32, 34]];
      for (const [width, height, fontSize, safeArea] of process.argv.includes("--game-narrow-only") ? gameProfiles.slice(-1) : gameProfiles) {
        const { ctx, page } = await context(width, height, gameBrowser, safeArea);
        await page.goto(origin + "/arcade/free-throw" + (fixture ? "?ticker=1" : ""), { waitUntil: "domcontentloaded" });
        await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
        await page.locator('[data-shot-state="ready"]').waitFor({ timeout: 20000 });
        await settled(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        const stage = page.getByRole("group", { name: "Court controls", exact: true });
        const bounds = await stage.boundingBox();
        const shell = await geometry(page);
        const bottom = shell.navPosition === "fixed" ? shell.nav.top : height;
        await page.screenshot({ path: path.join(evidence, `court-${width}-${height}-${fontSize}.png`), fullPage: false });
        assert.ok(bounds.y >= shell.chrome.bottom - 1 && bounds.y + bounds.height <= bottom + 1, "Actual court stage fits the usable viewport");
        const hud = [stage.getByRole("heading", { level: 1 }), page.getByRole("link", { name: "Back to the arcade" }),
          page.getByRole("button", { name: "Reset session", exact: true }), page.getByRole("button", { name: "Controls and help" }),
          page.getByLabel("Practice score"), page.getByLabel("Aim direction"), page.getByLabel("Shot power", { exact: true }),
          page.getByRole("meter", { name: "Shot power meter" }), page.getByRole("button", { name: "Hold to charge, release to shoot" })];
        for (const control of hud) {
          const r = await control.boundingBox();
          assert.ok(r.x >= -1 && r.x + r.width <= width + 1 && r.y >= shell.chrome.bottom - 1 && r.y + r.height <= bottom + 1, "Real HUD stays inside viewport: " + JSON.stringify(r));
        }
        const hudGroups = await stage.evaluate(e => ["topHud", "scoreHud", "bottomHud", "prototype"].map(name => {
          const node = [...e.children].find(child => [...child.classList].some(c => c.includes(name)));
          const r = node.getBoundingClientRect();
          return { name, x: r.x, y: r.y, right: r.right, bottom: r.bottom };
        }));
        for (let i = 0; i < hudGroups.length; i++) for (let j = i + 1; j < hudGroups.length; j++) {
          const a = hudGroups[i], b = hudGroups[j];
          assert.ok(Math.min(a.right, b.right) - Math.max(a.x, b.x) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) <= 1, "HUD groups must not overlap: " + JSON.stringify([a, b]));
        }
        for (const control of [page.getByRole("link", { name: "Back to the arcade" }), page.getByRole("button", { name: "Reset session", exact: true }), page.getByRole("button", { name: "Controls and help" }), page.getByRole("button", { name: "Hold to charge, release to shoot" })]) await visibleFocus(control);
        await page.evaluate(() => document.activeElement?.blur());
        await page.screenshot({ path: path.join(evidence, `court-${width}-${height}-${fontSize}.png`), fullPage: false });
        record(`Real court ${width}x${height}, ${fontSize / 16 * 100}% text`, { stage: bounds, usableBottom: bottom, safeArea, ready: true, hud: "within viewport" });
        await ctx.close();
      }
      assert.deepEqual(summary.pageErrors.slice(gameErrorsBefore), [], "Loaded real court component has no runtime errors");
    } finally { await gameBrowser.close(); }
}
async function fixedNavScroll(page, width, fontSize) {
  const fixed = await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Primary"]')].some(e => getComputedStyle(e).position === "fixed" && getComputedStyle(e).display !== "none"));
  if (!fixed) return;
  const maximum = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
  for (const [position, y] of [["top", 0], ["middle", maximum / 2], ["bottom", maximum]]) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await settled(page);
    const metrics = await page.evaluate(() => {
      const nav = [...document.querySelectorAll('nav[aria-label="Primary"]')].find(e => getComputedStyle(e).position === "fixed");
      const rect = nav.getBoundingClientRect();
      const footer = document.querySelector("body > footer, #root > footer");
      return { scrollY, viewportHeight: innerHeight, navTop: rect.top, navBottom: rect.bottom,
        footerBottom: footer?.getBoundingClientRect().bottom, padding: parseFloat(getComputedStyle(document.body).paddingBottom) };
    });
    assert.ok(Math.abs(metrics.navBottom - metrics.viewportHeight) <= 1, "Mobile nav stays at the viewport bottom");
    if (position === "bottom") assert.ok(metrics.footerBottom <= metrics.navTop + 1, "Last footer/content clears the fixed bar at maximum scroll");
    if (fontSize === 16 && [390, 320].includes(width)) await page.screenshot({ path: path.join(evidence, `history-viewport-${width}-${position}.png`), fullPage: false });
    record(`Fixed bar ${width}px, ${fontSize / 16 * 100}% text, ${position}`, metrics);
  }
  const lastFooterLink = page.locator("body > footer a, #root > footer a").last();
  await visibleFocus(lastFooterLink);
}
async function anchor(page) {
  const h1 = page.locator("#main-content h1").first();
  if (await h1.count()) {
    await h1.evaluate(e => e.scrollIntoView({ block: "start" }));
    const g = await geometry(page);
    assert.ok(g.heading.top >= g.chrome.bottom - 1, "ScrollIntoView title must remain visible");
  }
}
try {
  if (process.argv.includes("--history-only")) {
    browser = await chromium.launch({ headless: true, ...(process.env.SHELL_TEST_CHROME ? { executablePath: process.env.SHELL_TEST_CHROME } : {}), args: ["--disable-webgl"] });
    const origin = await start(true);
    for (const [width, height, fontSize] of [[390, 844, 16], [320, 568, 16], [390, 900, 32], [320, 900, 32]]) for (const ticker of [false, true]) {
      const { ctx, page } = await context(width, height, browser, 34);
      await page.goto(origin + "/history?history=1" + (ticker ? "&ticker=1" : ""), { waitUntil: "domcontentloaded" });
      await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
      await verifyShell(page);
      await keyboard(page);
      await anchor(page);
      await fixedNavScroll(page, width, fontSize);
      if (width === 390 && fontSize === 16 && ticker) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(evidence, "history-fullpage-diagnostic-390.png"), fullPage: true });
      }
      await ctx.close();
    }
    assert.deepEqual(summary.pageErrors, []);
    assert.deepEqual(summary.blockedWrites, []);
    record("Browser safety", { blockedWrites: 0, blockedExternal: [...new Set(summary.blockedExternal)], pageErrors: summary.pageErrors });
  } else if (process.argv.includes("--game-only") || process.argv.includes("--game-narrow-only")) {
    const origin = await start(true);
    await gameChecks(origin, true);
    assert.deepEqual(summary.blockedWrites, []);
    record("Browser safety", { blockedWrites: 0, blockedExternal: [...new Set(summary.blockedExternal)], pageErrors: summary.pageErrors });
  } else {
  browser = await chromium.launch({ headless: true, ...(process.env.SHELL_TEST_CHROME ? { executablePath: process.env.SHELL_TEST_CHROME } : {}), args: ["--disable-webgl"] });
  summary.browser = browser.version();
  if (!process.argv.includes("--fixture-only")) {
    const origin = await start(false);
    const routes = ["/", "/stocks", "/news", "/history", "/history/champions", "/history/hall-of-fame", "/arcade", "/arcade/free-throw", "/arcade/missing", "/team", "/teams", "/teams/1", "/player/synthetic-missing", "/transactions", "/draft", "/intel", "/trade-analyzer", "/weekly", "/weekly/2026-W41", "/claim", "/login", "/admin/invites", "/shell-missing-route"];
    for (const [width, fontSize, height, safeArea] of [[1440, 16, 900, 0], [741, 16, 900, 0], [390, 16, 844, 34], [320, 16, 568, 34], [720, 16, 450, 0], [390, 32, 900, 34], [320, 32, 900, 34]]) {
      const { ctx, page } = await context(width, height, browser, safeArea);
      for (const route of routes) {
        await page.goto(origin + route, { waitUntil: "domcontentloaded" });
        await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
        await verifyShell(page);
        await keyboard(page);
        await anchor(page);
        if (route === "/history" && fontSize === 16 && [1440, 390, 320, 720].includes(width)) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({ path: path.join(evidence, `history-production-${width}.png`) });
        }
      }
      await page.goto(origin + "/history", { waitUntil: "domcontentloaded" });
      await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
      await fixedNavScroll(page, width, fontSize);
      await page.goto(origin + "/history", { waitUntil: "domcontentloaded" });
      await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
      await settled(page);
      await page.evaluate(() => window.scrollTo(0, 220));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const previousScroll = await page.evaluate(() => window.scrollY);
      assert.ok(previousScroll >= 100, "Back check must use a meaningful nonzero scroll position");
      await page.getByRole("navigation", { name: "Primary", exact: true }).filter({ visible: true }).getByRole("link", { name: "Stocks", exact: true }).click();
      await page.waitForURL(url => url.pathname === "/stocks");
      await verifyShell(page);
      await page.goBack();
      await page.waitForURL(url => url.pathname === "/history");
      await verifyShell(page, { title: false });
      await page.waitForFunction(previous => Math.abs(window.scrollY - previous) <= 2, previousScroll, { timeout: 3000 }).catch(async error => {
        console.log("Back metrics", { width, fontSize, previousScroll, restoredScroll: await page.evaluate(() => window.scrollY) });
        throw error;
      });
      await anchor(page);
      record(`Production routes ${width}px, ${fontSize / 16 * 100}% text`, { routes: routes.length, height, safeArea, keyboard: "skip/primary visible", anchors: "clear chrome", back: "restores location/state/scroll" });
      await ctx.close();
    }
    await gameChecks(origin, false);
  }
  const errorsBeforeFixture = summary.pageErrors.length;
  const origin = await start(true);
  for (const width of [1440, 1024, 741, 390, 320]) {
    const { ctx, page } = await context(width);
    for (const fontSize of [16, 32]) for (const signed of [false, true]) for (const ticker of [false, true]) {
      for (const route of ["/stocks", "/history"]) {
        const query = new URLSearchParams({ ...(signed ? { user: "1" } : {}), ...(ticker ? { ticker: "1" } : {}) });
        await page.goto(origin + route + "?" + query, { waitUntil: "domcontentloaded" });
        await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
        const g = await verifyShell(page, { signed });
        if (width === 390 && fontSize === 32 && !signed && ticker && route === "/stocks") await page.screenshot({ path: path.join(evidence, "stocks-200-percent-text-390.png") });
        if (signed) assert.equal(await page.locator("[data-site-chrome]").getByRole("link").filter({ hasText: "Synthetic manager" }).count(), 1);
        const skip = page.getByRole("link", { name: "Skip to content", exact: true });
        assert.equal(await skip.evaluate(e => getComputedStyle(e).clipPath), "inset(50%)");
        if (fontSize === 16 && !signed && ticker && [1440, 390, 320].includes(width)) {
          await page.screenshot({ path: path.join(evidence, `${route.slice(1)}-fixture-${width}.png`) });
          await keyboard(page, route === "/stocks" && width === 390 ? "skip-focused-390.png" : undefined);
        }
        if (route === "/stocks") {
          const boardSkip = page.getByRole("link", { name: "Skip to player board", exact: true });
          assert.equal(await boardSkip.evaluate(e => getComputedStyle(e).clipPath), "inset(50%)");
          await visibleFocus(boardSkip);
          await page.keyboard.press("Enter");
          const board = await page.locator("#player-board").boundingBox();
          const chrome = await page.locator("[data-site-chrome]").boundingBox();
          assert.ok(board.y >= chrome.y + chrome.height - 1, "Player-board anchor clears sticky chrome");
          await page.keyboard.press("Tab");
          assert.equal(await page.evaluate(() => document.activeElement.closest("#player-board") !== null), true, "Skip resumes keyboard within player board");
        }
        await anchor(page);
        assert.ok(g.nav.width <= width + 1);
      }
    }
    for (const fontSize of [16, 32]) for (const ticker of [false, true]) {
      await page.goto(origin + "/stocks?populated=1" + (ticker ? "&ticker=1" : ""), { waitUntil: "domcontentloaded" });
      await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
      await verifyShell(page);
      await page.getByRole("button", { name: "Price history for Synthetic player 1", exact: true }).click();
      const inspector = page.locator("#stock-inspector");
      await inspector.getByRole("heading", { name: "Inside the price: Synthetic player 1", exact: true }).waitFor();
      await inspector.getByRole("heading", { name: "Production history", exact: true }).waitFor();
      await settled(page);
      const chrome = await page.locator("[data-site-chrome]").boundingBox();
      for (const control of [inspector.getByRole("heading", { name: "Inside the price: Synthetic player 1", exact: true }), page.getByRole("button", { name: "Close player detail", exact: true })]) {
        const r = await control.boundingBox();
        assert.ok(r.y >= chrome.y + chrome.height - 1, "Selected inspector heading and Close clear measured chrome");
      }
      await visibleFocus(page.getByRole("button", { name: "Close player detail", exact: true }));
      if (fontSize === 16 && ticker && [741, 390].includes(width)) await page.screenshot({ path: path.join(evidence, `stocks-selected-${width}.png`), fullPage: false });
      await page.getByRole("button", { name: "Close player detail", exact: true }).click();
      await page.goto(origin + "/?" + (ticker ? "ticker=1" : ""), { waitUntil: "domcontentloaded" });
      await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
      await verifyShell(page);
      const homeSkip = page.getByRole("link", { name: "Skip to this week’s players", exact: true });
      await visibleFocus(homeSkip);
      await page.keyboard.press("Enter");
      const watch = await page.locator("#watch").boundingBox(), homeChrome = await page.locator("[data-site-chrome]").boundingBox();
      assert.ok(watch.y >= homeChrome.y + homeChrome.height - 1, "Actual homepage skip destination clears measured chrome");
      for (const id of ["game-title", "watch", "watch-title", "wire-title", "teams-title", "directory-list"]) {
        const target = page.locator("#" + id);
        if (!(await target.count())) continue;
        await target.evaluate(e => e.scrollIntoView({ block: "start" }));
        const r = await target.boundingBox(), c = await page.locator("[data-site-chrome]").boundingBox();
        assert.ok(r.y >= c.y + c.height - 1, "Actual homepage ID target clears measured chrome: " + id);
      }
    }
    record(`Synthetic shell ${width}px`, "Ticker present/absent; anonymous/long signed-in name; 100%/200% text; Stocks/History; clipping/focus/anchors; >=44px targets");
    await ctx.close();
  }
  if (process.argv.includes("--fixture-only")) await gameChecks(origin, true);
  assert.deepEqual(summary.blockedWrites, []);
  assert.deepEqual(summary.pageErrors.slice(errorsBeforeFixture), [], "Synthetic shell has no runtime errors");
  // Full Next routes intentionally include fail-soft/error pages with upstream
  // requests blocked. The synthetic fixture must have no runtime errors.
  record("Browser safety", { blockedWrites: summary.blockedWrites.length, blockedExternal: [...new Set(summary.blockedExternal)], pageErrors: [...new Set(summary.pageErrors)] });
  }
} finally {
  await browser?.close();
  for (const server of servers) server.kill("SIGTERM");
  for (let i = 0; i < 50 && servers.some(s => s.exitCode === null && s.signalCode === null); i++) await pause(100);
  for (const server of servers) if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");
  await writeFile(path.join(evidence, "results.json"), JSON.stringify(summary, null, 2) + "\n");
  await writeFile(path.join(evidence, "server.log"), logs.join(""));
}
