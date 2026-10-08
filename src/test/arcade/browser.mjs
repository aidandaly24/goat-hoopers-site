// Run the already-built real app in a private, no-credentials loopback fixture.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

assert.equal(process.versions.node.split(".")[0], "22", "Use Node 22");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const playwright = process.env.ARCADE_TEST_PLAYWRIGHT;
assert.ok(playwright, "Supply a separately installed playwright/index.mjs");
assert.equal((await readdir(repo)).some(name => /^\.env($|\.)/.test(name) && name !== ".env.example"), false, "Fixture checkout must contain no dotenv credentials");
const { chromium } = await import(pathToFileURL(path.resolve(playwright)).href);
const evidence = path.resolve(process.env.ARCADE_TEST_EVIDENCE ?? path.join(repo, "arcade-test-evidence"));
await mkdir(evidence, { recursive: true });
const env = {
  PATH: process.env.PATH, TMPDIR: process.env.TMPDIR ?? "/tmp", LANG: "en_US.UTF-8", TZ: "UTC",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_OPTIONS: `--import=${path.join(repo, "src/test/arcade/block-external.mjs")}`,
};
const logs = [];
const summary = { node: process.version, serverExternalFetch: "blocked", credentials: "absent", checks: [], pageErrors: [], nonGETRequests: [], externalBrowserRequests: [] };
const record = (check, detail) => { summary.checks.push({ check, detail }); console.log(check + ": " + JSON.stringify(detail)); };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn(process.execPath, [path.join(repo, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "0"], { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] });
for (const stream of [server.stdout, server.stderr]) stream.on("data", data => logs.push(data.toString()));
let browser, fallback;
const stage = page => page.getByRole("group", { name: "Court controls" });
const score = async page => (await page.getByLabel("Makes and shots").innerText()).replace(/\s/g, "");
const ready = page => page.locator('[data-shot-state="ready"]').waitFor({ timeout: 15000 });
async function hit(locator, selector) {
  assert.equal(await locator.evaluate((element, selector) => {
    const box = element.getBoundingClientRect();
    return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest(selector) === element;
  }, selector), true, "Overlay must not intercept " + selector);
}
async function context(owner, mobile = false) {
  const result = await owner.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 832 }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  await result.route("**/*", route => {
    const request = route.request();
    if (request.method() !== "GET") { summary.nonGETRequests.push(request.method() + " " + request.url()); return route.abort(); }
    if (new URL(request.url()).hostname !== "127.0.0.1") { summary.externalBrowserRequests.push(request.url()); return route.abort(); }
    return route.continue();
  });
  const page = await result.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", error => summary.pageErrors.push(error.message));
  return { context: result, page };
}
async function returnAndHelp(page, touch = false) {
  await titleVisible(page);
  const back = page.getByRole("link", { name: "Back to the arcade" });
  const help = page.getByRole("button", { name: "Controls and help" });
  await hit(back, "a"); await hit(help, "button");
  if (touch) await help.locator("svg").tap(); else await help.locator("svg").click();
  await page.getByRole("region", { name: "Practice controls" }).waitFor();
  assert.match(await page.getByRole("region", { name: "Practice controls" }).innerText(), /lift your finger to shoot/);
  assert.equal(await score(page), "0/0");
  if (touch) await page.getByRole("button", { name: "Close help" }).locator("svg").tap();
  else await page.getByRole("button", { name: "Close help" }).locator("svg").click();
  if (touch) await back.locator("svg").tap(); else await back.locator("svg").click();
  await page.waitForURL(url => url.pathname === "/arcade");
  await page.getByRole("link", { name: "Play Free Throw Shootout" }).waitFor();
}
async function titleVisible(page) {
  const bounds = await page.getByRole("heading", { level: 1 }).evaluate(element => {
    const title = element.getBoundingClientRect();
    const header = document.querySelector("[data-site-chrome]").getBoundingClientRect();
    return { titleTop: title.top, headerBottom: header.bottom,
      headerTop: getComputedStyle(document.querySelector("[data-site-chrome]")).top,
      bodyChildren: [...document.body.children].map(child => child.tagName),
      scrollY: window.scrollY };
  });
  assert.ok(bounds.titleTop >= bounds.headerBottom, "Shared sticky header must not cover the Arcade/court title: " + JSON.stringify(bounds));
}
try {
  for (let i = 0; i < 80 && !logs.join("").match(/http:\/\/127\.0\.0\.1:(\d+)/); i++) await delay(100);
  const origin = logs.join("").match(/http:\/\/127\.0\.0\.1:(\d+)/)?.[0];
  assert.ok(origin, "Loopback production server must start");
  browser = await chromium.launch({ headless: true, ...(process.env.ARCADE_TEST_CHROME ? { executablePath: process.env.ARCADE_TEST_CHROME } : {}), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  summary.browser = browser.version();
  for (const mobile of [false, true]) {
    const fixture = await context(browser, mobile), page = fixture.page;
    await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
    const navLink = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Arcade", exact: true });
    await navLink.filter({ visible: true }).click();
    await page.waitForURL(url => url.pathname === "/arcade");
    await page.getByRole("heading", { name: "The Arcade", exact: true }).waitFor();
    await titleVisible(page);
    const main = page.getByRole("main");
    const content = await main.innerText();
    assert.equal(await main.getByRole("link").count(), 1);
    for (const text of ["82-0 Predictions", "Not yet live", "Claim your team", "FAAB"]) assert.equal(content.includes(text), false);
    assert.equal(await main.evaluate(element => getComputedStyle(element).backgroundColor), "rgb(244, 242, 237)");
    assert.equal(await main.getByRole("img").evaluate(img => img.complete && img.naturalWidth === 1248), true);
    const play = page.getByRole("link", { name: "Play Free Throw Shootout" });
    assert.ok((await play.boundingBox()).height >= 44);
    await page.screenshot({ path: path.join(evidence, mobile ? "arcade-mobile.png" : "arcade-desktop.png"), fullPage: true });
    if (mobile) {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.ok((await play.boundingBox()).height >= 44);
      }
    }
    await play.click(); await ready(page); assert.equal(await score(page), "0/0");
    record((mobile ? "Mobile" : "Desktop") + " Home → Arcade → Play", "Real GLBs ready; one honest card; preview and >=44px Play; no gate/placeholder/overflow");
    if (mobile) {
      const cdp = await fixture.context.newCDPSession(page);
      const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: ["touchEnd", "touchCancel"].includes(type) ? [] : [{ x, y }] });
      const box = await stage(page).boundingBox(), x = box.x + box.width * 0.5, y = box.y + box.height * 0.6;
      await touch("touchStart", x, y); await touch("touchMove", x + 30, y - 60);
      const power = Number((await page.getByLabel("Shot power", { exact: true }).innerText()).replace("%", ""));
      assert.ok(power < 50); assert.match(await page.getByLabel("Aim direction").innerText(), /RIGHT/);
      await touch("touchEnd"); await ready(page); assert.match(await score(page), /\/1$/);
      record("Native phone drag/release", { upwardDragPower: power, attempts: 1, mechanic: "Selected-power drag, not upward flick velocity" });
      await page.getByRole("button", { name: "Reset session", exact: true }).tap(); await ready(page);
      const button = await page.getByRole("button", { name: "Hold to charge, release to shoot" }).boundingBox();
      await touch("touchStart", button.x + button.width / 2, button.y + button.height / 2); await delay(790); await touch("touchEnd");
      await ready(page); assert.match(await score(page), /\/1$/);
      await page.getByRole("button", { name: "Reset session", exact: true }).tap(); await ready(page);
      await touch("touchStart", x, y); await touch("touchMove", x + 35, y + 25); await touch("touchCancel"); await delay(100);
      assert.equal(await score(page), "0/0"); assert.match(await page.getByLabel("Aim direction").innerText(), /CENTER/);
      await page.getByRole("button", { name: "Controls and help" }).tap();
      const paragraph = page.getByRole("region", { name: "Practice controls" }).locator("p").first();
      const p = await paragraph.boundingBox();
      await touch("touchStart", p.x + 20, p.y + 15); await touch("touchMove", p.x + 55, p.y + 30); await touch("touchEnd");
      assert.equal(await score(page), "0/0"); assert.equal(await stage(page).getAttribute("data-shot-state"), "ready");
      assert.equal(await stage(page).getAttribute("data-charging"), "false");
      await page.getByRole("button", { name: "Close help" }).tap();
      record("Phone button, cancellation and help text", "Hold/release fires once; touchcancel restores aim; help text never starts a court shot");
      await page.screenshot({ path: path.join(evidence, "game-mobile.png") });
    }
    await returnAndHelp(page, mobile);
    record((mobile ? "Mobile" : "Desktop") + " ready Back/help", "Nested SVG targets operable; no shot; returns to Arcade");
    // Hold asset requests to exercise a real loading overlay before any court exists.
    let release; const gate = new Promise(resolve => { release = resolve; });
    await page.route("**/*.glb", async route => { await gate; await route.abort().catch(() => {}); });
    try {
      await page.goto(origin + "/arcade/free-throw", { waitUntil: "domcontentloaded" });
      await page.locator('[data-shot-state="loading"]').waitFor();
      await returnAndHelp(page, mobile);
      record((mobile ? "Mobile" : "Desktop") + " loading Back/help", "Controls above opaque loading layer; navigation works before GLBs resolve");
    } finally { release(); await page.unroute("**/*.glb"); }
    await page.route("**/GOAT_HOOPERS_Basketball.glb", route => route.fulfill({ status: 404, body: "Local forced asset failure" }));
    await page.goto(origin + "/arcade/free-throw", { waitUntil: "domcontentloaded" });
    await page.getByText("3D court unavailable", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Hold to charge, release to shoot" }).isDisabled(), true);
    await returnAndHelp(page, mobile);
    record((mobile ? "Mobile" : "Desktop") + " asset-error Back/help", "Unavailable state is escapable and explains controls; no attempt");
    await fixture.context.close();
  }
  fallback = await chromium.launch({ headless: true, ...(process.env.ARCADE_TEST_CHROME ? { executablePath: process.env.ARCADE_TEST_CHROME } : {}), args: ["--disable-webgl"] });
  const fixture = await context(fallback, true), page = fixture.page;
  await page.goto(origin + "/arcade/free-throw", { waitUntil: "domcontentloaded" });
  await page.getByText("3D court unavailable", { exact: true }).waitFor();
  await titleVisible(page);
  await page.screenshot({ path: path.join(evidence, "webgl-unavailable.png") });
  await returnAndHelp(page, true);
  record("WebGL-disabled phone Back/help", "Title/help/Back remain visible and operable; no shot; Arcade reached");
  await fixture.context.close();
  assert.deepEqual(summary.pageErrors, []); assert.deepEqual(summary.nonGETRequests, []); assert.deepEqual(summary.externalBrowserRequests, []);
  record("Safety and browser runtime", "No page errors, writes, DB credentials or external requests");
} finally {
  await fallback?.close(); await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    await Promise.race([stopped, delay(5000)]);
    if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await stopped; }
  }
  await writeFile(path.join(evidence, "server.log"), logs.join(""));
  await writeFile(path.join(evidence, "results.json"), JSON.stringify(summary, null, 2) + "\n");
}
