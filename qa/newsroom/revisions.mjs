// Frozen, DB-free revision/reader checks. Coordinate the shared Chrome slot first.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, statfs, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fixtureArticles } from "./fixtures.ts";

const { chromium } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
const origin = "http://127.0.0.1:8798";
const evidence = path.resolve(`qa/newsroom/evidence/revisions-${head.slice(0, 8)}`);
const MiB = 1048576;
const freeBytes = async () => { const d = await statfs(process.cwd()); return d.bavail * d.bsize; };
const initialAvailableBytes = await freeBytes();
assert.ok(initialAvailableBytes >= 320 * MiB, "Insufficient disk budget; nothing launched");
await mkdir(evidence, { recursive: true });
const receipt = { head, tree, browser: "", checks: [], screenshots: [], externalRequests: [], nonGETRequests: [], pageErrors: [], consoleErrors: [],
  initialAvailableBytes, minimumAvailableBytes: initialAvailableBytes, limit: "Native-anchor fixture; not real Next App Router or physical iOS" };
const record = check => { receipt.checks.push(check); console.log(`${check}: pass`); };
const base = fixtureArticles();
const legacy = a => `v1-${createHash("sha256").update(JSON.stringify([a.id, a.publication, a.kind, a.section, a.headline, a.body, a.publishedAt,
  a.players.map(p => [p.playerId, p.name]), a.teams.map(t => [t.teamId, t.name])])).digest("hex")}`;
const query = (href, state) => { const u = new URL(href, origin); if (state) u.searchParams.set("state", state); return u.search; };
const legacyQuery = (a, state) => query(`/news?${new URLSearchParams({ story: a.id, revision: legacy(a), section: a.section })}`, state);
let browser, pressureError;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--config", "qa/newsroom/vite.config.mts", "--configLoader", "runner"], {
  env: { PATH: path.dirname(process.execPath) + ":/usr/bin:/bin", NODE_ENV: "development" }, stdio: ["ignore", "pipe", "pipe"],
});
let serverLogs = "";
server.stdout.on("data", chunk => { serverLogs += chunk; });
server.stderr.on("data", chunk => { serverLogs += chunk; });
const capacity = async () => {
  const free = await freeBytes(); receipt.minimumAvailableBytes = Math.min(receipt.minimumAvailableBytes, free);
  assert.ok(free >= 192 * MiB, "Disk guard stopped above the 128MiB safety floor");
  if (pressureError) throw pressureError;
};
const guard = setInterval(() => { capacity().catch(error => {
  if (pressureError) return; pressureError = error;
  browser?.close().catch(() => {}); server.kill("SIGTERM");
}); }, 750);
try {
  await capacity();
  browser = await chromium.launch({ executablePath: process.argv[3], headless: true, args: ["--disable-webgl", "--disable-background-networking"] });
  receipt.browser = browser.version();
  for (let n = 0; n < 40; n++) {
    try { await fetch(origin); break; } catch { if (n === 39) throw new Error(serverLogs); await new Promise(r => setTimeout(r, 250)); }
  }
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: width !== 1440, reducedMotion: "reduce" });
    await context.route("**/*", route => {
      const r = route.request();
      if (r.method() !== "GET") { receipt.nonGETRequests.push(r.url()); return route.abort(); }
      if (new URL(r.url()).origin !== origin) { receipt.externalRequests.push(r.url()); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
    page.on("pageerror", e => receipt.pageErrors.push(e.message));
    page.on("console", m => { if (m.type() === "error") receipt.consoleErrors.push(m.text()); });
    const visit = async (search = "") => {
      await capacity(); await page.goto(origin + "/news" + search, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "The Newsroom." }).waitFor();
    };
    const dialog = page.getByRole("dialog"), title = page.locator("#news-reader-title");
    const opener = page.getByRole("link", { name: /^Read story/ });
    const filters = page.getByRole("group", { name: "News sections" });
    const closed = async () => {
      await page.waitForFunction(() => !document.querySelector("dialog").open);
      assert.equal(new URL(page.url()).searchParams.has("story"), false);
      assert.equal(new URL(page.url()).searchParams.has("revision"), false);
    };
    const focused = locator => locator.evaluate(el => el === document.activeElement);
    const bounds = async () => assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    const reads = async a => {
      await dialog.waitFor(); assert.equal(await title.innerText(), a.headline);
      for (const paragraph of a.body) assert.equal(await dialog.getByText(paragraph, { exact: true }).count(), 1);
      await bounds();
    };
    const unavailable = async (candidate = false) => {
      await dialog.waitFor(); assert.equal(await title.innerText(), "Story unavailable");
      assert.match(await dialog.innerText(), /version in this link can’t be verified/);
      assert.equal(await dialog.getByRole("navigation", { name: "People and teams in this story" }).count(), 0);
      assert.equal(await dialog.getByRole("link", { name: /^Read current story:/ }).count(), candidate ? 1 : 0);
      assert.equal(await focused(title), true);
      await bounds();
    };
    await visit();
    for (let round = 0; round < 2; round++) for (const [name, count] of [["Rookie Wire", 1], ["Rumor Mill", 1], ["Hot Takes", 1], ["Latest", 5]]) {
      const b = filters.getByRole("button", { name, exact: true }); await b.focus(); await page.keyboard.press(round ? "Space" : "Enter");
      await page.waitForFunction(({ name, count }) => document.querySelector("main [role=status]")?.textContent === `${count} ${count === 1 ? "story" : "stories"} · ${name}`, { name, count });
      assert.equal(await focused(b), true);
    }
    record(`${width} repeated filters and keyboard focus`);
    const defaultHref = await opener.getAttribute("href"), historySize = await page.evaluate(() => history.length);
    if (width === 1440) { await opener.focus(); await page.keyboard.press("Enter"); } else await opener.tap();
    await reads(base[0]); assert.equal(await focused(title), true);
    for (const [name, publication] of [["The Athletic", "athletic"], ["Bleacher Report", "bleacher"], ["Shams", "shams"], ["ESPN", "espn"]]) {
      const b = dialog.getByRole("button", { name: `${name} voice`, exact: true }); await b.focus(); await page.keyboard.press("Space");
      await page.waitForFunction(name => document.querySelector('dialog [role="status"]')?.textContent === `Reading ${name} voice.`, name);
      await reads(base.find(a => a.id === `trade-0-123456-${publication}`));
      const u = new URL(page.url()); assert.equal(u.searchParams.get("story"), `trade-0-123456-${publication}`);
      assert.match(u.searchParams.get("revision"), /^v2-[a-f0-9]{64}$/);
      assert.equal(await b.getAttribute("aria-pressed"), "true"); assert.equal(await focused(b), true);
      assert.equal(await page.evaluate(() => history.length), historySize + 1);
    }
    record(`${width} exact v2 voice URLs/prose/pressed state and replacement history`);
    await dialog.getByRole("button", { name: "Shams voice", exact: true }).click();
    const shamsURL = new URL(page.url()).search;
    await page.goBack(); await closed(); assert.equal(await focused(opener), true);
    await page.goForward(); await reads(base.find(a => a.publication === "shams"));
    assert.equal(new URL(page.url()).search, shamsURL);
    await dialog.getByRole("button", { name: "Close story" }).click(); await closed(); assert.equal(await focused(opener), true);
    await opener.click(); await dialog.waitFor(); await page.keyboard.press("Escape"); await closed(); assert.equal(await focused(opener), true);
    record(`${width} exact guarded Back/Forward/Close/Escape and restored opener focus`);
    await visit(query(defaultHref)); await reads(base[0]); assert.equal(await focused(title), true);
    const directHistory = await page.evaluate(() => history.length);
    await dialog.getByRole("button", { name: "Close story" }).click(); await closed();
    assert.equal(await page.evaluate(() => history.length), directHistory);
    assert.equal(await focused(page.locator("main [role=status]").first()), true);
    record(`${width} direct v2 URL and replacement Close/fallback focus`);
    for (const [name, id] of [["Rookie Wire", "rookie-1-espn"], ["Rumor Mill", "rumor-busy-1"], ["Hot Takes", "take-rookie-1"]]) {
      await visit(); await filters.getByRole("button", { name }).click();
      const href = await opener.getAttribute("href");
      await visit(query(href, "timestamp"));
      const a = fixtureArticles("timestamp").find(a => a.id === id);
      await reads(a); assert.equal(await focused(title), true);
      assert.equal(await dialog.locator("time").getAttribute("datetime"), new Date(a.publishedAt).toISOString());
      await page.keyboard.press("Escape"); await closed();
      assert.equal(new URL(page.url()).searchParams.get("state"), "timestamp");
      record(`${width} ${name} direct v2 survives 11-minute-only generation refresh`);
    }
    const rookie = base.find(a => a.id === "rookie-1-espn");
    await visit(legacyQuery(rookie)); await reads(rookie);
    record(`${width} exact unchanged legacy v1 remains readable`);
    await visit(legacyQuery(rookie, "timestamp")); await unavailable(true);
    const recovery = dialog.getByRole("link", { name: /^Read current story:/ });
    assert.match(await recovery.getAttribute("href"), /revision=v2-/);
    if (width === 390) { await page.screenshot({ path: path.join(evidence, "390-expired-version.png") }); receipt.screenshots.push("390-expired-version.png"); }
    const recoveryHistory = await page.evaluate(() => history.length);
    await recovery.focus(); await page.keyboard.press("Enter");
    await reads(fixtureArticles("timestamp").find(a => a.id === rookie.id));
    assert.equal(await focused(title), true); assert.equal(await dialog.evaluate(el => el.scrollTop), 0);
    assert.equal(await page.evaluate(() => history.length), recoveryHistory);
    if (width === 390) { await page.screenshot({ path: path.join(evidence, "390-current-story.png") }); receipt.screenshots.push("390-current-story.png"); }
    await dialog.getByRole("button", { name: "Close story" }).click(); await closed();
    assert.equal(new URL(page.url()).searchParams.get("section"), "rookies");
    assert.equal(await focused(page.locator("main [role=status]").first()), true);
    record(`${width} expired v1 is truthful / explicit current reading / heading and Close focus`);
    await visit(query(defaultHref, "changed")); await unavailable(true);
    assert.match(await dialog.innerText(), /may cover a different event/);
    await dialog.getByRole("link", { name: /^Read current story:/ }).click();
    await reads(fixtureArticles("changed")[0]); assert.equal(await focused(title), true);
    await page.keyboard.press("Escape"); await closed();
    record(`${width} reused ID meaningful replacement is never opened without explicit choice`);
    for (const search of [query(defaultHref, "duplicate"), "?story=missing&revision=v2-invalid"]) {
      await visit(search); await unavailable(false); await page.keyboard.press("Escape"); await closed();
    }
    await visit("?story=rookie-1-espn"); await unavailable(true); await page.keyboard.press("Escape"); await closed();
    record(`${width} duplicate/missing/missing-revision fail closed with safe recovery eligibility`);
    await capacity(); await context.close();
  }
  for (const key of ["externalRequests", "nonGETRequests", "pageErrors", "consoleErrors"]) assert.deepEqual(receipt[key], []);
} catch (error) { receipt.failure = error.message; throw error; }
finally {
  clearInterval(guard); await browser?.close(); server.kill("SIGTERM");
  if (server.exitCode === null && server.signalCode === null) await Promise.race([once(server, "exit"), new Promise(r => setTimeout(r, 3000))]);
  receipt.browserClosed = !browser || !browser.isConnected(); receipt.serverClosed = server.exitCode !== null || server.signalCode !== null;
  receipt.finalAvailableBytes = await freeBytes(); receipt.pressureError = pressureError?.message ?? null;
  await writeFile(path.join(evidence, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  assert.ok(receipt.browserClosed && receipt.serverClosed, "Fixture resources did not close");
}
console.log(`PASS: ${receipt.checks.length} checks; ${receipt.screenshots.length} screenshots; head ${head}`);
