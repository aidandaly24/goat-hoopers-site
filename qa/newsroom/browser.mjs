// DB-free QA of production Newsroom components using the supported Mac Chrome route.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
const { chromium } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const origin = "http://127.0.0.1:8798";
const evidence = path.resolve("qa/newsroom/evidence");
await mkdir(evidence, { recursive: true });
const receipt = { browser: "", checks: [], screenshots: [], externalRequests: [], nonGETRequests: [], pageErrors: [], consoleErrors: [] };
const record = (check, detail = "pass") => { receipt.checks.push({ check, detail }); console.log(check + ": " + JSON.stringify(detail)); };
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--config", "qa/newsroom/vite.config.mts", "--configLoader", "runner"], {
  env: { PATH: path.dirname(process.execPath) + ":/usr/bin:/bin", NODE_ENV: "development" }, stdio: ["ignore", "pipe", "pipe"],
});
let serverLogs = "";
server.stdout.on("data", chunk => { serverLogs += chunk; });
server.stderr.on("data", chunk => { serverLogs += chunk; });
const browser = await chromium.launch({ executablePath: process.argv[3], headless: true, args: ["--disable-webgl"] });
receipt.browser = browser.version();
try {
  // Bounded start check; listener and browser are task-owned and always closed.
  for (let attempt = 0; attempt < 40; attempt++) {
    try { await fetch(origin); break; } catch { if (attempt === 39) throw new Error(serverLogs); await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: "reduce", hasTouch: width !== 1440 });
    await context.route("**/*", route => {
      const request = route.request();
      if (request.method() !== "GET") { receipt.nonGETRequests.push(request.url()); return route.abort(); }
      if (new URL(request.url()).origin !== origin) { receipt.externalRequests.push(request.url()); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", error => receipt.pageErrors.push(error.message));
    page.on("console", message => { if (message.type() === "error") receipt.consoleErrors.push(message.text()); });
    const visit = async query => {
      await page.goto(origin + "/news" + query, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "The Newsroom." }).waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    const capture = async (name, fullPage = false) => {
      const file = `${width}-${name}.png`;
      await page.screenshot({ path: path.join(evidence, file), fullPage });
      receipt.screenshots.push(file);
    };
    const geometry = async (label, scoped = false) => {
      const result = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth, dialog: document.querySelector("dialog")?.scrollWidth, dialogClient: document.querySelector("dialog")?.clientWidth }));
      if (!scoped) assert.ok(result.page <= width + 1, JSON.stringify(result));
      else {
        const newsroom = await page.locator("main").evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth }));
        assert.ok(newsroom.width <= width + 1 && newsroom.scroll <= newsroom.width + 1, JSON.stringify(newsroom));
        result.newsroom = newsroom;
      }
      if (await page.locator("dialog").evaluate(el => el.open)) assert.ok(result.dialog <= result.dialogClient + 1, JSON.stringify(result));
      record(`${width} ${label} geometry`, result);
    };
    await visit("");
    assert.equal(await page.locator("main [role=status]").first().innerText(), "5 stories · Latest");
    assert.equal(await page.locator("main ol li").count(), 4);
    await geometry("front page"); await capture("front-page"); await capture("front-page-full", true);
    const filters = page.getByRole("group", { name: "News sections" });
    for (let round = 0; round < 2; round++) {
      for (const [label, count] of [["Rookie Wire", 1], ["Rumor Mill", 1], ["Hot Takes", 1], ["Latest", 5]]) {
        const button = filters.getByRole("button", { name: label, exact: true });
        await button.focus(); await page.keyboard.press(round ? "Space" : "Enter");
        await page.waitForFunction(({ label, count }) => document.querySelector("main [role=status]")?.textContent === `${count} ${count === 1 ? "story" : "stories"} · ${label}`, { label, count });
        assert.equal(await button.getAttribute("aria-pressed"), "true");
        assert.equal(await button.evaluate(el => el === document.activeElement), true);
      }
    }
    record(`${width} repeated keyboard filters/state/focus`);
    await page.goBack(); await page.waitForURL(/section=takes/);
    assert.match(await page.locator("main article h2").innerText(), /QUESTIONS/);
    await page.goForward(); await page.waitForURL(origin + "/news");
    record(`${width} filter Back/Forward`);
    const opener = page.getByRole("link", { name: "Read story", exact: false });
    const espnHref = await opener.getAttribute("href");
    let athleticSearch;
    const initialHistory = await page.evaluate(() => history.length);
    if (width !== 1440) await opener.tap(); else { await opener.focus(); await page.keyboard.press("Enter"); }
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(await page.locator("#news-reader-title").evaluate(el => el === document.activeElement), true);
    assert.match(await dialog.innerText(), /parody/);
    assert.equal(await page.evaluate(() => history.length), initialHistory + 1);
    assert.equal(await dialog.locator('[role="group"] button').count(), 4);
    // Native modal prevents focus reaching background controls. Chrome may move
    // through browser chrome at the boundary (document.activeElement === body).
    for (const key of ["Tab", "Shift+Tab"]) for (let i = 0; i < 18; i++) {
      await page.keyboard.press(key);
      assert.equal(await page.evaluate(() => document.querySelector("dialog").contains(document.activeElement) || document.activeElement === document.body), true);
    }
    for (const name of ["The Athletic voice", "Bleacher Report voice", "Shams voice", "ESPN voice"]) {
      const voice = dialog.getByRole("button", { name, exact: true });
      await voice.focus(); await page.keyboard.press("Space");
      await page.waitForFunction(name => document.querySelector('dialog [role="status"]')?.textContent === `Reading ${name}.`, name);
      assert.equal(await voice.getAttribute("aria-pressed"), "true");
      assert.equal(await voice.evaluate(el => el === document.activeElement), true);
      assert.equal(await page.evaluate(() => history.length), initialHistory + 1);
      if (name === "The Athletic voice") athleticSearch = new URL(page.url()).search;
    }
    await geometry("reader"); await capture("reader");
    await dialog.getByRole("button", { name: "Close story" }).click();
    await page.waitForFunction(() => !document.querySelector("dialog").open);
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    record(`${width} open/voices/Close/containment/focus/history`);
    await opener.click(); await dialog.waitFor(); await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog").open);
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
    await opener.click(); await dialog.waitFor();
    await dialog.getByRole("button", { name: "Shams voice", exact: true }).click();
    await page.goBack(); await page.waitForFunction(() => !document.querySelector("dialog").open);
    await page.goForward(); await dialog.waitFor();
    assert.match(page.url(), /story=trade-0-123456-shams/);
    await dialog.getByRole("button", { name: "Close story" }).click();
    await page.waitForURL(origin + "/news");
    record(`${width} repeated Escape/Back/Forward exact voice/Close`);
    await visit(athleticSearch); await dialog.waitFor();
    assert.match(await dialog.locator("h2").innerText(), /by the numbers/);
    const deepHistory = await page.evaluate(() => history.length);
    await dialog.getByRole("button", { name: "Close story" }).click();
    await page.waitForFunction(() => !document.querySelector("dialog").open);
    assert.equal(await page.evaluate(() => history.length), deepHistory);
    assert.equal(new URL(page.url()).searchParams.has("story"), false);
    record(`${width} direct story close by replacement`);
    await visit("?story=not-in-feed&section=rumors"); await dialog.waitFor();
    assert.match(await dialog.innerText(), /Story unavailable/);
    await dialog.getByRole("button", { name: "Return to headlines" }).click();
    await page.waitForFunction(() => !document.querySelector("dialog").open);
    assert.equal(new URL(page.url()).searchParams.get("section"), "rumors");
    assert.equal(await page.locator("main [role=status]").first().evaluate(el => el === document.activeElement), true);
    record(`${width} missing ID/truthful return/fallback focus`);
    await visit("?story=trade-0-123456-espn"); await dialog.waitFor();
    assert.match(await dialog.innerText(), /Story unavailable/);
    record(`${width} legacy ID without snapshot guard fails closed`);
    const changedSearch = new URL(espnHref, origin).searchParams;
    changedSearch.set("state", "changed");
    await visit(`?${changedSearch}`); await dialog.waitFor();
    assert.match(await dialog.innerText(), /Story unavailable/);
    assert.equal(await dialog.getByRole("navigation", { name: "People and teams in this story" }).count(), 0);
    assert.equal(await page.locator("#news-reader-title").evaluate(el => el === document.activeElement), true);
    record(`${width} reused render ID in another feed fails closed`);
    await visit(new URL(espnHref, origin).search); await dialog.waitFor();
    const actors = dialog.getByRole("navigation", { name: "People and teams in this story" });
    assert.equal(await actors.getByRole("link", { name: "Synthetic Northside" }).getAttribute("href"), "/teams/1");
    await actors.getByRole("link", { name: "Synthetic Alpha" }).click();
    await page.getByRole("heading", { name: "Synthetic profile destination" }).waitFor();
    await page.goBack(); await dialog.waitFor();
    assert.match(page.url(), /story=trade-0-123456-espn/);
    record(`${width} actor destination/native Back retains exact story`);
    await visit("?state=sparse");
    assert.equal(await page.locator("main [role=status]").first().innerText(), "1 story · Latest");
    await capture("sparse");
    await filters.getByRole("button", { name: "Rumor Mill" }).click();
    await page.getByRole("heading", { name: "No reactions in this section yet." }).waitFor();
    await page.getByRole("button", { name: "Show Latest" }).click();
    assert.equal(new URL(page.url()).searchParams.get("state"), "sparse");
    record(`${width} sparse/empty section/recovery preserves unrelated query`);
    await visit("?state=empty"); await capture("empty");
    assert.equal(await page.getByRole("link", { name: "League moves" }).getAttribute("href"), "/transactions");
    assert.equal(await page.getByRole("link", { name: "Draft board" }).getAttribute("href"), "/draft");
    record(`${width} truthful empty feed/useful destinations`);
    await visit("?state=long"); await geometry("long headlines"); await capture("long-headlines");
    await opener.click(); await dialog.waitFor(); await geometry("long reader");
    const longVoice = dialog.getByRole("button", { name: "The Athletic voice", exact: true });
    await longVoice.click();
    await page.waitForFunction(() => document.querySelector('dialog [role="status"]')?.textContent === "Reading The Athletic voice.");
    const voiceBox = await longVoice.boundingBox();
    const readerBox = await dialog.boundingBox();
    assert.ok(voiceBox && readerBox && voiceBox.y >= readerBox.y && voiceBox.y + voiceBox.height <= readerBox.y + readerBox.height);
    assert.equal(await longVoice.evaluate(el => el === document.activeElement), true);
    record(`${width} long headline voice change retains visible focus`);
    await dialog.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const closeBox = await dialog.getByRole("button", { name: "Close story" }).boundingBox();
    assert.ok(closeBox && closeBox.y >= 0 && closeBox.y + closeBox.height <= 844 + (width === 1440 ? 56 : 0));
    record(`${width} long prose sticky Close remains visible`);
    await page.keyboard.press("Escape"); await page.waitForFunction(() => !document.querySelector("dialog").open);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await geometry("200% text (Newsroom scope; shared header may overflow)", true);
    await opener.click(); await dialog.waitFor(); await geometry("200% reader", true);
    await dialog.getByRole("button", { name: "Close story" }).click();
    await page.waitForFunction(() => !document.querySelector("dialog").open);
    await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    const targets = await filters.getByRole("button").evaluateAll(elements => elements.map(el => ({ text: el.textContent, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
    assert.ok(targets.every(t => t.width >= 44 && t.height >= 44));
    record(`${width} section touch targets`, targets);
    await context.close();
  }
  assert.deepEqual(receipt.externalRequests, []); assert.deepEqual(receipt.nonGETRequests, []);
  assert.deepEqual(receipt.pageErrors, []); assert.deepEqual(receipt.consoleErrors, []);
} finally {
  await writeFile(path.join(evidence, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  await browser.close(); server.kill("SIGTERM");
}
console.log(`PASS: ${receipt.checks.length} checks; ${receipt.screenshots.length} captures`);
