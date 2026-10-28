import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
const origin = process.env.ARENA_ORIGIN ?? "http://127.0.0.1:4196";
const out = process.env.HUB_EVIDENCE ?? "/tmp/goat-hub-review";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const results = [], errors = [], external = [];
try {
  for (const state of [
    { width: 1440, member: false, theme: "dark" }, { width: 1440, member: true, theme: "light" },
    { width: 390, member: false, theme: "dark" }, { width: 390, member: true, theme: "light" },
    { width: 320, member: true, theme: "dark" }, { width: 390, member: true, theme: "dark", text: 200 },
    { width: 390, member: true, theme: "light", still: true }, { width: 390, member: false, theme: "dark", reduce: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: state.width, height: state.width < 600 ? 844 : 1000 }, reducedMotion: state.reduce ? "reduce" : "no-preference" });
    await context.addInitScript(theme => localStorage.setItem("goat-hoopers.theme", theme), state.theme);
    const p = await context.newPage(); p.on("pageerror", e => errors.push(e.message));
    await p.route("**/*", route => { if (new URL(route.request().url()).origin === origin) return route.continue(); external.push(route.request().url()); return route.abort(); });
    await p.goto(`${origin}/arena.html?view=${state.member ? "member" : "public"}${state.still ? "&scene=still" : ""}`, { waitUntil: "networkidle" });
    if (!state.still && !state.reduce) await p.waitForFunction(() => window.goatHubMetrics?.props === 3);
    await p.evaluate(() => document.fonts.ready);
    if (state.text) await p.evaluate(() => document.documentElement.style.fontSize = "200%");
    const read = () => p.evaluate(() => ({
      stage: document.querySelector(".hub-stage").clientHeight,
      minimumStage: parseFloat(getComputedStyle(document.documentElement).fontSize) * 26,
      header: document.querySelector(".hub-header").getBoundingClientRect().height,
      panel: document.querySelector("#site-navigation-panel").getBoundingClientRect().height,
      rows: getComputedStyle(document.querySelector(".hub-shell")).gridTemplateRows,
      overflow: document.documentElement.scrollWidth > innerWidth,
      canvases: document.querySelectorAll(".hub-court canvas").length,
      pinsVisible: [...document.querySelectorAll(".hub-pin")].filter(e => e.getClientRects().length).length,
      directoryTargets: [...document.querySelectorAll(".hub-directory button")].map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })),
    }));
    const closed = await read();
    const trigger = p.getByRole("button", { name: state.width < 600 ? /^Menu/ : /^League tools/ });
    await trigger.focus(); await p.keyboard.press("Enter"); await p.locator("#site-navigation-panel").waitFor({ state: "visible" });
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const expanded = await read();
    assert(expanded.stage >= expanded.minimumStage - 1, "Expanded navigation collapsed the arena");
    assert(expanded.panel > 0 && expanded.panel < expanded.header, "Disclosure did not stay inside the header grid item");
    assert.equal(expanded.overflow, false);
    assert.equal(expanded.canvases, state.still || state.reduce ? 0 : 1);
    assert.equal(expanded.pinsVisible, expanded.stage < expanded.minimumStage / 26 * 32 ? 0 : 6);
    assert.equal(expanded.directoryTargets.length, 6);
    assert(expanded.directoryTargets.every(e => e.width >= 44 && e.height >= 44));
    const name = `menu-${state.width}-${state.member ? "member" : "public"}-${state.theme}${state.text ? "-200" : ""}${state.still ? "-still" : ""}${state.reduce ? "-reduced" : ""}`;
    await p.screenshot({ path: `${out}/${name}-expanded.jpg`, type: "jpeg", quality: 86, animations: "disabled" });
    await p.locator(".hub-stage").scrollIntoViewIfNeeded();
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const arenaImage = `${out}/${name}-arena.jpg`;
    await p.screenshot({ path: arenaImage, type: "jpeg", quality: 86, animations: "disabled" });
    const pixelText = execFileSync("tesseract", [arenaImage, "stdout", "--psm", "11"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).toLowerCase().replace(/[^a-z]/g, "");
    assert(pixelText.includes(state.member ? "yourhomecourt" : "tenteamsonehouse"), "Actual arena screenshot lost the foreground title");
    await p.keyboard.press("Escape"); await p.locator("#site-navigation-panel").waitFor({ state: "hidden" });
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert.equal(await trigger.evaluate(e => document.activeElement === e), true);
    assert.equal(await trigger.evaluate(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), true, "Restored menu focus is outside the viewport");
    const restored = await read(); assert(Math.abs(restored.stage - closed.stage) <= 1);
    await p.locator('[data-directory="standings"]').click(); await p.locator("[data-league-section]").waitFor({ state: "visible" });
    await p.keyboard.press("Escape"); await p.locator("#hub-reader").waitFor({ state: "hidden" });
    await trigger.click(); await p.locator("#site-navigation-panel").waitFor({ state: "visible" });
    await trigger.click(); await p.locator("#site-navigation-panel").waitFor({ state: "hidden" });
    assert((await read()).stage >= closed.minimumStage - 1);
    results.push({ state, closed, expanded, restored, screenshot: name, foregroundTitlePixelVerified: true });
    console.log("PASS menu state", JSON.stringify(state), `${closed.stage}→${expanded.stage}→${restored.stage}px; reader/focus/reopen intact`);
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  await writeFile(`${out}/menu-checks.json`, JSON.stringify({ revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), results, errors, external }, null, 2) + "\n");
} finally { await browser.close(); }
