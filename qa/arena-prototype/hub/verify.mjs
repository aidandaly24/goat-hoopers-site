import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
const origin = process.env.ARENA_ORIGIN ?? "http://127.0.0.1:4196";
const out = process.env.HUB_EVIDENCE ?? "/tmp/goat-hub-review";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const checks = [], errors = [], external = [], writes = [], contexts = [];
const check = (name, detail = true) => { checks.push({ name, detail }); console.log("PASS", name); };
async function create({ width = 1440, member = false, reducedMotion = "no-preference", saveData = false, extra = "", theme = "dark" } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, deviceScaleFactor: 1, reducedMotion });
  contexts.push(context);
  await context.addInitScript(({ saveData, theme }) => {
    localStorage.setItem("goat-hoopers.theme", theme);
    const connection = new EventTarget(); connection.saveData = saveData;
    Object.defineProperty(navigator, "connection", { configurable: true, value: connection });
  }, { saveData, theme });
  const p = await context.newPage(), requests = [];
  p.on("pageerror", error => errors.push(error.message));
  await p.route("**/*", route => {
    const req = route.request(), url = req.url(); requests.push(url);
    if (req.method() !== "GET") writes.push([req.method(), url]);
    if (new URL(url).origin !== origin) { external.push(url); return route.abort(); }
    return route.continue();
  });
  await p.goto(`${origin}/arena.html?view=${member ? "member" : "public"}${extra}`, { waitUntil: "networkidle" });
  if (reducedMotion !== "reduce" && !saveData && !extra.includes("scene=still")) {
    await p.waitForFunction(() => window.goatHubMetrics?.props === 3);
    await p.waitForTimeout(220);
  }
  return { p, requests };
}
const noOverflow = async p => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
const settle = p => p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const shot = async (p, name) => {
  await p.evaluate(async () => { await document.fonts.ready; await Promise.allSettled([...document.images].filter(e => e.getClientRects().length).map(e => e.decode())); });
  await settle(p);
  return p.screenshot({ path: `${out}/${name}.jpg`, type: "jpeg", quality: 86, animations: "disabled", caret: "hide" });
};
const open = async (p, id) => { await p.locator(`[data-directory=${id}]`).click(); await p.locator("#hub-reader").waitFor({ state: "visible" }); await p.locator(".hub-content").waitFor(); await p.waitForTimeout(240); await settle(p); };
const close = async p => { await p.getByRole("button", { name: "Close reader and return to arena" }).click(); await p.locator("#hub-reader").waitFor({ state: "hidden" }); await p.waitForTimeout(220); await settle(p); };
const inventory = p => p.locator("[data-courtside-home]").evaluate(e => ({ text: e.textContent.replace(/\s+/g, " ").trim(), links: [...e.querySelectorAll("a")].map(a => [a.textContent.trim(), a.getAttribute("href")]) }));
try {
  const { p } = await create();
  assert.equal(await p.locator(".hub-court canvas").count(), 1);
  assert.equal(await p.locator("#hub-reader").isVisible(), false);
  assert.equal(await p.locator(".hub-pin").count(), 6); await noOverflow(p);
  assert((await p.locator('[data-site-chrome] a[href^="/arena.html"]').count()) >= 2);
  await shot(p, "public-desktop-overview");
  const before = await p.evaluate(() => ({ ...window.goatHubMetrics })); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => window.goatHubMetrics.frames), before.frames);
  assert(before.triangles < 25000 && before.drawCalls < 100 && before.contexts === 1);
  check("arena entry: six physical destinations, one renderer, no idle frames", before);

  const trigger = p.locator('[data-destination="matchup"]'); await trigger.focus(); await p.keyboard.press("Enter");
  await p.locator("[data-ai-decides]").waitFor({ state: "visible" });
  assert.equal(await p.locator("#reader-title").evaluate(e => document.activeElement === e), true);
  for (let i = 0; i < 22; i++) { await p.keyboard.press("Tab"); assert.equal(await p.evaluate(() => document.querySelector("#hub-reader").contains(document.activeElement)), true); }
  await p.keyboard.press("Escape"); await p.locator("#hub-reader").waitFor({ state: "hidden" });
  assert.equal(await trigger.evaluate(e => document.activeElement === e), true);
  check("keyboard: activate, contained modal traversal, Escape and original focus return");
  await p.waitForTimeout(240);

  const pin = await trigger.boundingBox(); await p.mouse.click(pin.x + pin.width / 2, pin.y + pin.height + 48);
  await p.locator("#hub-reader").waitFor({ state: "visible" });
  assert.match(await p.locator("#reader-title").innerText(), /This week/); await close(p);
  check("actual 3D jumbotron picking opens the same HTML destination");

  await open(p, "standings"); await p.locator("[data-league-section]").waitFor({ state: "visible" });
  await p.getByRole("button", { name: "Points for: sort descending", exact: true }).click();
  assert.equal(await p.getByRole("columnheader").filter({ has: p.getByRole("button", { name: "Points for: sort ascending", exact: true }) }).getAttribute("aria-sort"), "descending");
  await p.getByLabel("Choose arena destination").selectOption("league"); await p.locator("#teams").waitFor({ state: "visible" });
  await p.goBack(); assert.match(await p.locator("#reader-title").innerText(), /The table/);
  await p.goForward(); assert.match(await p.locator("#reader-title").innerText(), /Our league/);
  const search = p.locator("#teams input[type=search]"); await search.fill("Anthony Edwards");
  assert.equal(await p.locator("[data-team-id]:visible").count(), 1); await search.fill("");
  await p.locator("#teams select").selectOption("team");
  assert.equal(await p.locator("[data-team-id]").first().getAttribute("data-team-id"), "6");
  const summary = p.locator("[data-team-id]").first().locator("summary").first(); await summary.focus(); await p.keyboard.press("Enter");
  assert.equal(await p.locator("[data-team-id]").first().evaluate(e => e.open), true);
  await close(p); assert.equal(new URL(p.url()).hash, "");
  check("HTML tables/directory work; browser Back/Forward changes reader; Close returns overview");

  const anchor = await p.locator('[data-destination="team"]').getAttribute("style"); await p.getByRole("button", { name: "Turn arena left" }).click(); await p.waitForTimeout(260); await settle(p);
  assert.notEqual(await p.locator('[data-destination="team"]').getAttribute("style"), anchor);
  const afterTurn = await p.evaluate(() => window.goatHubMetrics.frames); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => window.goatHubMetrics.frames), afterTurn);
  await p.getByRole("button", { name: "Turn arena right" }).click(); await p.waitForTimeout(260);
  check("manual camera updates projected labels then stops rendering");
  await p.context().close();

  for (const member of [false, true]) {
    const { p: tab } = await create({ member });
    await tab.getByRole("button", { name: "Complete league edition", exact: false }).click();
    await tab.locator("[data-courtside-home]").waitFor();
    const actual = await inventory(tab);
    const baseline = await tab.context().newPage(); await baseline.goto(`${origin}/?view=${member ? "member" : "public"}&style=baseline&scene=still`, { waitUntil: "networkidle" });
    assert.deepEqual(actual, await inventory(baseline)); await baseline.close();
    assert.equal(await tab.locator("[data-team-id]").count(), 10);
    assert.equal(await tab.locator("[data-team-id] a[href^='/player/']").evaluateAll(a => new Set(a.map(e => e.getAttribute("href"))).size), 228);
    await close(tab);
    if (member) {
      await shot(tab, "member-desktop-overview");
      await open(tab, "team"); await tab.locator("[data-roster-value]").waitFor({ state: "visible" });
      assert.equal(await tab.locator("[data-form-wire]").isVisible(), true);
      await shot(tab, "member-desktop-team"); await close(tab);
    } else { await open(tab, "matchup"); await shot(tab, "public-desktop-matchup"); await close(tab); }
    for (const id of ["players", "league", "standings", "arcade"]) { await open(tab, id); assert((await tab.locator(".hub-reader-body").innerText()).trim().length > 100); await close(tab); }
    await tab.context().close();
    check(`${member ? "member" : "public"}: exact full-edition text/link inventory, 10 teams/228 players and working destinations`);
  }

  for (const width of [390, 320]) for (const member of [false, true]) {
    const { p: tab } = await create({ width, member }); await noOverflow(tab);
    const controls = await tab.locator(".hub-pin, .hub-directory button, .hub-review button").evaluateAll(items => items.map(e => ({ w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height })));
    assert(controls.every(e => e.w >= 44 && e.h >= 44));
    if (width === 390) await shot(tab, `${member ? "member" : "public"}-phone-overview`);
    await open(tab, member ? "team" : "matchup"); await noOverflow(tab);
    if (width === 390) await shot(tab, `${member ? "member" : "public"}-phone-reader`);
    await tab.locator(".hub-reader-body").evaluate(e => e.scrollTo(0, e.scrollHeight));
    assert.equal(await tab.getByRole("button", { name: "Close reader and return to arena" }).isVisible(), true);
    await close(tab); await tab.context().close();
    check(`${width}px ${member ? "member" : "public"}: 44px targets, reader reflow, long-detail scroll and visible close`);
  }
  const { p: big } = await create({ width: 390, member: true, extra: "&scene=still" });
  await big.evaluate(() => document.documentElement.style.fontSize = "200%"); await noOverflow(big); await open(big, "standings"); await noOverflow(big);
  assert.equal(await big.locator(".hub-reader-tools").evaluate(e => e.scrollWidth > e.clientWidth), false);
  await shot(big, "phone-200-percent-reader"); await big.context().close(); check("200% text: page and reader controls reflow");

  for (const setting of [{ reducedMotion: "reduce" }, { saveData: true }, { extra: "&scene=still" }]) {
    const { p: tab, requests } = await create(setting); assert.equal(await tab.locator(".hub-court canvas").count(), 0);
    assert.equal(requests.some(url => url.includes("/hub/scene.ts") || url.includes(".glb")), false);
    await open(tab, "standings"); assert.equal(await tab.locator("[data-league-section]").isVisible(), true); await close(tab);
    await tab.context().close(); check(`still fallback retains destinations without scene/models: ${JSON.stringify(setting)}`);
  }
  const { p: live } = await create();
  await live.emulateMedia({ reducedMotion: "reduce" }); await live.waitForFunction(() => !document.querySelector(".hub-court canvas"));
  await live.emulateMedia({ reducedMotion: "no-preference" }); await live.waitForFunction(() => window.goatHubMetrics?.props === 3 && document.querySelector(".hub-court canvas"));
  await live.evaluate(() => document.querySelector(".hub-court canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  await live.waitForFunction(() => document.querySelector(".hub-shell").dataset.mode === "still");
  await open(live, "league"); assert.equal(await live.locator("#teams").isVisible(), true); await close(live); await live.context().close();
  check("live reduced preference disposal/reopen and actual WebGL loss preserve navigation");
  const { p: direct } = await create({ extra: "&scene=still#place=standings" });
  await direct.locator("[data-league-section]").waitFor({ state: "visible" });
  await direct.getByLabel("Choose arena destination").selectOption("players"); await close(direct);
  assert.equal(new URL(direct.url()).hash, ""); assert.equal(await direct.locator('[data-directory="standings"]').evaluate(e => document.activeElement === e), true);
  await direct.context().close(); check("direct reader URL: initial focus, nested place and Close restore arena/destination focus");
  assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(writes, []);
  check("no browser errors, external requests or writes");
  await writeFile(`${out}/checks.json`, JSON.stringify({ revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), method: "offline Vite component fixture; software Chromium; sample current data", checks, errors, external, writes }, null, 2) + "\n");
  console.log(`PASS ${checks.length} checks; evidence ${out}`);
} finally { for (const context of contexts) await context.close().catch(() => {}); await browser.close(); }
