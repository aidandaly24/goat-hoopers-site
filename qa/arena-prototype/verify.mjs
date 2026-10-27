import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
const origin = process.env.ARENA_ORIGIN ?? "http://127.0.0.1:4196";
const out = process.env.ARENA_EVIDENCE ?? "/tmp/goat-arena-evidence";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const checks = [], errors = [], blocked = [], pages = [];
const check = (name, detail) => { checks.push({ name, detail }); console.log("PASS", name); };
async function page({ width = 1440, member = false, theme = "light", reducedMotion = "no-preference", extra = "", saveData = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, deviceScaleFactor: 1, reducedMotion });
  await context.addInitScript(({ theme, saveData }) => {
    localStorage.setItem("goat-hoopers.theme", theme);
    if (saveData) Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
  }, { theme, saveData });
  const tab = await context.newPage();
  const requests = [];
  tab.on("pageerror", error => errors.push(error.message));
  await tab.route("**/*", route => {
    const url = route.request().url(); requests.push(url);
    if (new URL(url).origin === origin) return route.continue();
    blocked.push(url); return route.abort();
  });
  await tab.goto(`${origin}/?view=${member ? "member" : "public"}${extra}`, { waitUntil: "networkidle" });
  await tab.locator("[data-courtside-home]").waitFor();
  await tab.evaluate(() => document.fonts.ready);
  if (reducedMotion === "no-preference" && !saveData && !extra.includes("scene=still")) {
    await tab.waitForFunction(() => window.goatArenaMetrics?.active);
    await tab.waitForFunction(() => document.querySelector("[data-arena-ready=true]"));
  }
  pages.push(context);
  return { tab, requests };
}
async function overflow(tab) { return tab.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })); }
const content = tab => tab.locator("[data-courtside-home]").evaluate(element => ({
  text: element.textContent.replace(/\s+/g, " ").trim(),
  links: [...element.querySelectorAll("a")].map(anchor => [anchor.textContent.trim(), anchor.getAttribute("href")]),
  teams: element.querySelectorAll("[data-team-id]").length,
  players: [...new Set([...element.querySelectorAll("[data-team-id] a[href^='/player/']")].map(anchor => anchor.getAttribute("href")))],
}));

try {
  for (const member of [false, true]) {
    const { tab } = await page({ member });
    const actual = await content(tab);
    const { tab: baseline } = await page({ member, extra: "&style=baseline&scene=still" });
    assert.deepEqual(actual, await content(baseline));
    await baseline.context().close();
    assert.equal(actual.teams, 10); assert.equal(actual.players.length, 228);
    check(`${member ? "member" : "public"}: exact component content/link/228-player preservation`, { teams: actual.teams, players: actual.players.length });
    assert.equal(await tab.locator(".arena-world canvas").count(), 1);
    const before = await tab.evaluate(() => ({ ...window.goatArenaMetrics }));
    await tab.waitForTimeout(400);
    const after = await tab.evaluate(() => ({ ...window.goatArenaMetrics }));
    assert.equal(after.frames, before.frames); assert(after.drawCalls <= 80); assert(after.triangles <= 25000);
    await tab.evaluate(() => scrollTo(0, 2200)); await tab.waitForTimeout(250);
    assert.equal(await tab.evaluate(() => window.goatArenaMetrics.frames), after.frames);
    check(`${member ? "member" : "public"}: one context, no idle/scroll rendering`, after);
    await tab.evaluate(() => scrollTo(0, 0));
    await tab.screenshot({ path: `${out}/${member ? "member" : "public"}-desktop-full.png`, fullPage: true });
    await tab.screenshot({ path: `${out}/${member ? "member" : "public"}-desktop-top.png` });
    await tab.locator("#teams").scrollIntoViewIfNeeded();
    await tab.screenshot({ path: `${out}/${member ? "member" : "public"}-directory.png` });
    await tab.context().close();
  }

  const { tab: desktop } = await page({ member: true, theme: "dark" });
  await desktop.screenshot({ path: `${out}/member-dark-full.png`, fullPage: true });
  // Native team disclosures remain keyboard-operated; all roster links survive.
  const summary = desktop.locator("[data-team-id]").first().locator("summary").first();
  await summary.focus(); await desktop.keyboard.press("Enter");
  assert.equal(await desktop.locator("[data-team-id]").first().evaluate(element => element.open), true);
  const search = desktop.locator("#teams input[type=search]");
  await search.fill("Anthony Edwards"); assert.equal(await desktop.locator("[data-team-id]").count(), 1);
  await search.fill(""); assert.equal(await desktop.locator("[data-team-id]").count(), 10);
  await desktop.locator("#teams select").selectOption("team");
  assert.equal(await desktop.locator("[data-team-id]").first().getAttribute("data-team-id"), "6");
  check("directory: keyboard disclosure, roster search and team sort", "All ten teams restored after filtering");
  await desktop.getByRole("button", { name: "Points for: sort descending", exact: true }).click();
  assert.equal(await desktop.getByRole("columnheader").filter({ has: desktop.getByRole("button", { name: "Points for: sort ascending", exact: true }) }).getAttribute("aria-sort"), "descending");
  check("standings: sort remains functional and announced", "aria-sort=descending");
  await desktop.context().close();

  for (const width of [390, 320]) for (const member of [false, true]) {
    const { tab } = await page({ width, member, theme: "dark" });
    const size = await overflow(tab); assert(size.document <= size.viewport);
    const controls = await tab.locator(".review-controls button").evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
    assert(controls.every(button => button.width >= 44 && button.height >= 44));
    const rowSummary = tab.locator("[data-team-id]").first().locator("summary").first();
    await rowSummary.focus(); await tab.keyboard.press("Enter");
    assert((await overflow(tab)).document <= width);
    check(`${width}px ${member ? "member" : "public"}: reflow, 44px review controls, expanded roster`, size);
    await tab.evaluate(() => scrollTo(0, 0));
    await tab.screenshot({ path: `${out}/${member ? "member" : "public"}-${width}-full.png`, fullPage: true });
    await tab.context().close();
  }

  const { tab: enlarged } = await page({ width: 390, member: true });
  await enlarged.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  assert((await overflow(enlarged)).document <= 390);
  check("200% text at 390px: no document overflow", await overflow(enlarged));
  await enlarged.context().close();

  for (const setting of [{ reducedMotion: "reduce" }, { saveData: true }, { extra: "&scene=still" }]) {
    const { tab, requests } = await page(setting);
    assert.equal(await tab.locator(".arena-world canvas").count(), 0);
    assert(!requests.some(url => /\/scene\.ts|\.glb(?:\?|$)/.test(url)));
    assert.equal((await content(tab)).players.length, 228);
    check(`static fallback without scene/model request: ${JSON.stringify(setting)}`, "228 player links retained");
    await tab.context().close();
  }
  const { tab: lifecycle } = await page();
  await lifecycle.emulateMedia({ reducedMotion: "reduce" });
  await lifecycle.waitForFunction(() => document.querySelectorAll(".arena-world canvas").length === 0);
  assert.equal(await lifecycle.evaluate(() => window.goatArenaMetrics.active), false);
  await lifecycle.emulateMedia({ reducedMotion: "no-preference" });
  await lifecycle.waitForFunction(() => window.goatArenaMetrics.active);
  assert.equal(await lifecycle.locator(".arena-world canvas").count(), 1);
  check("live reduced-motion change disposes and restores one renderer", "No lost content");

  await lifecycle.evaluate(() => {
    const canvas = document.querySelector(".arena-world canvas");
    canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext();
  });
  await lifecycle.waitForFunction(() => document.querySelectorAll(".arena-world canvas").length === 0);
  assert.equal((await content(lifecycle)).players.length, 228);
  assert.match(await lifecycle.locator(".review-status").innerText(), /Static arena retained/);
  check("actual WebGL context loss: disposal and readable static fallback", "228 player links and all sections retained");
  await lifecycle.context().close();

  const { tab: missing } = await page({ member: true, extra: "&edition=missing" });
  assert.equal(await missing.getByRole("heading", { name: "The next weekly story is on its way." }).count(), 1);
  assert.equal((await content(missing)).teams, 10);
  assert.equal(await missing.locator("[data-roster-value]").count(), 1);
  check("missing editorial: member valuation, directory and league content retained", "No blank page");

  assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
  check("no browser errors or external network requests", "Only local origin allowed throughout");
  const receipt = { revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    source: "Isolated Vite fixture; Chromium software WebGL, synthetic performance data, dated approved identities", checks,
    limitations: ["Polyfork downloads blocked by execution proxy HTTP 403; no Polyfork prop received/visually inspected", "No live auth/data, Next routing, physical phone, screen reader or hardware-GPU performance claim", "Standalone fixture bundle is not a production RSC payload measurement"] };
  await writeFile(`${out}/checks.json`, JSON.stringify(receipt, null, 2) + "\n");
  console.log(`PASS ${checks.length} checks; evidence ${out}`);
} finally { await Promise.all(pages.map(context => context.close())); await browser.close(); }
