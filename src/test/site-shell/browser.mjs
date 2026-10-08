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
async function context(width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await ctx.route("**/*", route => {
    const request = route.request();
    if (request.method() !== "GET") { summary.blockedWrites.push(request.method()); return route.abort(); }
    if (new URL(request.url()).hostname !== "127.0.0.1") { summary.blockedExternal.push(new URL(request.url()).hostname); return route.abort(); }
    return route.continue();
  });
  const page = await ctx.newPage();
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
  if (g.navPosition === "fixed") assert.ok(g.bottomPadding >= g.nav.height - 1, "Enlarged mobile bar must reserve its actual height");
  assert.ok(g.targetMarginTop >= g.chrome.height, "Anchor/focus clearance follows actual chrome height");
  return g;
}
async function visibleFocus(locator) {
  await locator.focus();
  assert.equal(await locator.evaluate(e => {
    const r = e.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (e === hit || e.contains(hit)) && getComputedStyle(e).outlineStyle !== "none";
  }), true, "Focused control must be visible and unobstructed");
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
async function anchor(page) {
  const h1 = page.locator("#main-content h1").first();
  if (await h1.count()) {
    await h1.evaluate(e => e.scrollIntoView({ block: "start" }));
    const g = await geometry(page);
    assert.ok(g.heading.top >= g.chrome.bottom - 1, "ScrollIntoView title must remain visible");
  }
}
try {
  browser = await chromium.launch({ headless: true, ...(process.env.SHELL_TEST_CHROME ? { executablePath: process.env.SHELL_TEST_CHROME } : {}), args: ["--disable-webgl"] });
  summary.browser = browser.version();
  if (!process.argv.includes("--fixture-only")) {
    const origin = await start(false);
    const routes = ["/", "/stocks", "/news", "/history", "/history/champions", "/history/hall-of-fame", "/arcade", "/arcade/free-throw", "/arcade/missing", "/team", "/teams", "/teams/1", "/player/synthetic-missing", "/transactions", "/draft", "/intel", "/trade-analyzer", "/weekly", "/weekly/2026-W41", "/claim", "/login", "/admin/invites", "/shell-missing-route"];
    for (const [width, fontSize] of [[1440, 16], [741, 16], [390, 16], [320, 16], [720, 16], [390, 32], [320, 32]]) {
      const { ctx, page } = await context(width);
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
      await page.goto(origin + "/history/champions", { waitUntil: "domcontentloaded" });
      await page.evaluate(size => { document.documentElement.style.fontSize = size + "px"; }, fontSize);
      await settled(page);
      await page.evaluate(() => window.scrollTo(0, 220));
      const previousScroll = await page.evaluate(() => window.scrollY);
      await page.getByRole("navigation", { name: "Primary", exact: true }).filter({ visible: true }).getByRole("link", { name: "Stocks", exact: true }).click();
      await page.waitForURL(url => url.pathname === "/stocks");
      await verifyShell(page);
      await page.goBack();
      await page.waitForURL(url => url.pathname === "/history/champions");
      await verifyShell(page, { title: false });
      await page.waitForFunction(previous => Math.abs(window.scrollY - previous) <= 2, previousScroll, { timeout: 3000 }).catch(async error => {
        console.log("Back metrics", { width, fontSize, previousScroll, restoredScroll: await page.evaluate(() => window.scrollY) });
        throw error;
      });
      await anchor(page);
      record(`Production routes ${width}px, ${fontSize / 16 * 100}% text`, { routes: routes.length, keyboard: "skip/primary visible", anchors: "clear chrome", back: "restores location/state/scroll" });
      await ctx.close();
    }
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
    record(`Synthetic shell ${width}px`, "Ticker present/absent; anonymous/long signed-in name; 100%/200% text; Stocks/History; clipping/focus/anchors; >=44px targets");
    await ctx.close();
  }
  assert.deepEqual(summary.blockedWrites, []);
  assert.deepEqual(summary.pageErrors.slice(errorsBeforeFixture), [], "Synthetic shell has no runtime errors");
  // Full Next routes intentionally include fail-soft/error pages with upstream
  // requests blocked. The synthetic fixture must have no runtime errors.
  record("Browser safety", { blockedWrites: summary.blockedWrites.length, blockedExternal: [...new Set(summary.blockedExternal)], pageErrors: [...new Set(summary.pageErrors)] });
} finally {
  await browser?.close();
  for (const server of servers) server.kill("SIGTERM");
  for (let i = 0; i < 50 && servers.some(s => s.exitCode === null && s.signalCode === null); i++) await pause(100);
  for (const server of servers) if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");
  await writeFile(path.join(evidence, "results.json"), JSON.stringify(summary, null, 2) + "\n");
  await writeFile(path.join(evidence, "server.log"), logs.join(""));
}
