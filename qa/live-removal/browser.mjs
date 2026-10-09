import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { access, mkdir, readFile, statfs, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const origin = "http://127.0.0.1:8869";
const widths = process.argv[4] === "320" ? [320] : [1440, 390, 320];
assert.ok(!process.argv[4] || process.argv[4] === "320", "Optional viewport selection must be 320");
const evidence = path.join(root, "node_modules/.cache/live-removal-evidence");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const receipt = {
  head: git("rev-parse", "HEAD"), tree: git("rev-parse", "HEAD^{tree}"),
  liveBase: "92fb446c0e94f2b664bd2f3e5be3e574c2e3641d",
  browser: "", node: process.version, widths, startedAt: new Date().toISOString(),
  status: "running", checks: [], requests: [], rejectedRequests: [],
  externalRequests: [], nonGETRequests: [], apiRequests: [],
  pageErrors: [], consoleErrors: [], screenshots: [], inheritedGridOverflow: [],
};
const record = (check, detail) => { receipt.checks.push({ check, detail }); console.log(check); };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let server, browser, serverLog = "";
await mkdir(evidence, { recursive: true });
assert.equal(process.versions.node.split(".")[0], "22");
assert.equal(git("merge-base", "HEAD", receipt.liveBase), receipt.liveBase, "Release descends from the exact live baseline");
assert.equal(git("rev-list", "--merges", `${receipt.liveBase}..HEAD`), "", "Release does not merge later feature history");
assert.equal(git("status", "--porcelain", "--untracked-files=no"), "", "Run the committed candidate");
receipt.baselineSourceProof = JSON.parse(execFileSync(process.execPath, ["qa/live-removal/prepare-baseline.mjs"], { cwd: root, encoding: "utf8" }));
const assets = JSON.parse(await readFile(path.join(root, "src/test/fixtures/rejected-hoopers-assets.json"), "utf8"));
for (const { path: file, sha256 } of assets.preserved) {
  assert.equal(createHash("sha256").update(await readFile(path.join(root, file))).digest("hex"), sha256, file);
}
for (const { path: file } of assets.removed) {
  await assert.rejects(access(path.join(root, file)), { code: "ENOENT" });
}
const free = await statfs(evidence);
assert.ok(free.bavail * free.bsize > 128 * 1024 * 1024, "Keep 128 MiB free-space floor");
await access(process.argv[2]); await access(process.argv[3]);
const { chromium } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const deadline = setTimeout(() => {
  server?.kill("SIGTERM"); process.exitCode = 1;
  void browser?.close();
}, 180_000);
try {
  server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--config", "qa/live-removal/vite.config.mts", "--configLoader", "runner"], {
    cwd: root, env: { PATH: process.env.PATH, NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [server.stdout, server.stderr]) stream.on("data", data => { serverLog += data; });
  for (let tries = 0; !serverLog.includes(origin) && tries < 100; tries++) {
    assert.equal(server.exitCode, null, `Fixture server exited: ${serverLog}`);
    await delay(100);
  }
  assert.ok(serverLog.includes(origin), `Fixture startup: ${serverLog}`);
  browser = await chromium.launch({ executablePath: process.argv[3], headless: true, args: ["--disable-webgl", "--disable-background-networking"] });
  receipt.browser = browser.version();
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, hasTouch: width < 500, reducedMotion: width < 500 ? "reduce" : "no-preference" });
    await context.route("**/*", route => {
      const request = route.request(), url = new URL(request.url());
      receipt.requests.push({ url: request.url(), method: request.method() });
      if (/hooper-|\.glb(?:$|\?)/i.test(url.pathname)) { receipt.rejectedRequests.push(request.url()); return route.abort(); }
      if (request.method() !== "GET") { receipt.nonGETRequests.push(request.url()); return route.abort(); }
      if (url.origin !== origin) { receipt.externalRequests.push(request.url()); return route.abort(); }
      if (url.pathname.startsWith("/api/")) { receipt.apiRequests.push(request.url()); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", error => receipt.pageErrors.push({ width, url: page.url(), text: error.stack ?? error.message }));
    page.on("console", message => { if (message.type() === "error") receipt.consoleErrors.push({ width, url: page.url(), text: message.text() }); });
    let baselineCompared = false;
    const geometry = async name => {
      const actual = await page.evaluate(() => {
        const grid = document.querySelector('main div[class*="_grid_"]');
        const outsideGrid = [...document.querySelectorAll("main *")].filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.right > innerWidth + 1 && !(grid?.contains(element));
        }).map(element => ({ tag: element.tagName, text: element.textContent.trim().slice(0,80) }));
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, canvas: document.querySelectorAll("canvas").length, bg: getComputedStyle(document.body).backgroundColor, outsideGrid };
      });
      if (actual.scrollWidth > width + 1) {
        assert.ok(width === 320 && baselineCompared && /^team \d+$/.test(name), `${name} unexpected overflow: ${JSON.stringify(actual)}`);
        assert.deepEqual(actual.outsideGrid, [], "New identity/outside-grid overflow remains a failure");
        receipt.inheritedGridOverflow.push({ name, ...actual, issue: 128 });
        record(`${width} ${name}: inherited unchanged-grid overflow tracked in #128`, actual);
      } else record(`${width} ${name}: Paper canvas, no overflow or viewer`, actual);
      assert.equal(actual.canvas, 0); assert.equal(actual.bg, "rgb(245, 244, 239)");
    };
    const visit = async route => {
      await page.goto(origin + route, { waitUntil: "networkidle" });
      await page.locator("main").waitFor(); await page.evaluate(() => document.fonts.ready);
    };
    const capture = async name => {
      const file = `${width}-${name}.png`;
      await page.screenshot({ path: path.join(evidence, file), fullPage: false });
      receipt.screenshots.push(file);
    };
    if (width === 320) {
      const sample = async () => page.evaluate(() => {
        const grid = document.querySelector('main div[class*="_grid_"]');
        if (!grid) throw new Error("Missing team grid");
        const rect = grid.getBoundingClientRect();
        return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          grid: { left: rect.left, right: rect.right, width: rect.width, scrollWidth: grid.scrollWidth, columns: getComputedStyle(grid).gridTemplateColumns },
          links: [...grid.querySelectorAll("a")].map(element => ({ href: element.getAttribute("href"), text: element.textContent.trim() })),
          canvas: document.querySelectorAll("canvas").length };
      });
      await visit("/baseline/teams/2"); const baseline = await sample();
      await visit("/teams/2"); const candidate = await sample();
      assert.deepEqual(candidate, baseline, "Removal must preserve exact live team2 roster/grid geometry and links");
      assert.equal(candidate.canvas, 0);
      receipt.baselineComparison = { baseline, candidate, equal: true, issue: 128 };
      baselineCompared = true;
      record("320 team2 exact live comparison with rejected model disabled", { baseline: baseline.scrollWidth, candidate: candidate.scrollWidth, links: candidate.links.length, equal: true });
    }
    await visit("/"); await geometry("homepage");
    const expected = await page.evaluate(() => window.removalExpected);
    assert.equal(expected.teams.length, 10); assert.equal(expected.rosterCount, 228);
    const arena = page.locator('img[src="/courtside/arena.jpg"]').first();
    assert.ok(await arena.evaluate(image => image.complete && image.naturalWidth > 0));
    assert.equal(await page.locator('img[src*="banner-roster-"]').count(), 2);
    assert.ok(await page.locator('img[src*="banner-roster-"]').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
    assert.ok(await page.locator('img[src="/courtside/GOAT-HOOPERS-horizontal-black.svg"]').first().evaluate(image => image.complete && image.naturalWidth > 0));
    await capture("home");
    record(`${width} approved arena, two embroidered pennants and logo load`, "existing local files; zero model requests");

    const notes = page.getByRole("button", { name: /^Matchup notes/ });
    const dialog = page.getByRole("dialog", { name: "Why this matchup?" });
    await notes.click(); await dialog.waitFor();
    assert.equal(await dialog.locator('a[href^="/teams/"]').count(), 2);
    await page.getByRole("button", { name: "Close matchup notes" }).click();
    assert.equal(await notes.evaluate(element => element === document.activeElement), true);
    await notes.click(); await page.keyboard.press("Escape");
    assert.equal(await dialog.count(), 0);
    assert.equal(await notes.evaluate(element => element === document.activeElement), true);
    record(`${width} native matchup notes: links, Close, Escape and focus restoration`, "passed");

    const directory = page.locator("#teams");
    const rows = directory.locator("details[data-team-id]");
    assert.equal(await rows.count(), 10);
    for (const team of expected.teams) {
      const row = directory.locator(`details[data-team-id="${team.id}"]`);
      assert.match(await row.innerText(), new RegExp(team.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.equal(await row.locator(`a[href="/teams/${team.id}"]`).count(), 1);
      assert.equal(await row.locator("ul li").count(), team.players.length);
      for (const player of team.players) assert.equal(await row.locator(`ul a[href="/player/${player.id}"]`).count(), 1);
    }
    const first = directory.locator(`details[data-team-id="${expected.teams[0].id}"]`);
    await first.locator("summary").click();
    const sort = directory.getByRole("combobox", { name: "Order", exact: true });
    await sort.selectOption("team");
    assert.equal(await first.evaluate(element => element.open), true);
    const order = await rows.evaluateAll(elements => elements.map(element => element.dataset.teamId));
    await directory.getByRole("button", { name: /^Reverse/ }).click();
    assert.deepEqual(await rows.evaluateAll(elements => elements.map(element => element.dataset.teamId)), [...order].reverse());
    const search = directory.getByRole("searchbox");
    const player = expected.teams[0].players.at(-1);
    await search.fill(player.name);
    assert.equal(await rows.count(), 1);
    assert.equal(await rows.first().getAttribute("data-team-id"), expected.teams[0].id);
    await directory.getByRole("button", { name: "Clear", exact: true }).click();
    assert.equal(await rows.count(), 10); assert.equal(await search.evaluate(element => element === document.activeElement), true);
    await search.fill("no matching removal fixture person"); assert.equal(await rows.count(), 0);
    await directory.getByRole("button", { name: "Clear", exact: true }).click();
    assert.equal(await rows.count(), 10);
    record(`${width} directory: all identities/228 roster links, search/Clear, sort/reverse, expansion retention`, "passed");

    const live = page.locator("summary").filter({ hasText: "Live standings, stats & recent moves" });
    if (!(await live.evaluate(element => element.parentElement.open))) await live.click();
    const points = page.getByRole("button", { name: /^Points for:/ });
    await points.click(); assert.equal(await page.locator('[role="columnheader"][aria-sort="descending"]').count(), 1);
    await points.click(); assert.equal(await page.locator('[role="columnheader"][aria-sort="ascending"]').count(), 1);
    assert.equal(await page.locator('a[role="row"][href^="/teams/"]').count(), 10);
    await geometry("expanded homepage controls");
    record(`${width} standings disclosure, repeated sort and all team destinations`, "passed");

    if (!(await first.evaluate(element => element.open))) await first.locator("summary").click();
    await first.getByRole("link", { name: /Full team profile/ }).click();
    await page.waitForURL(`${origin}/teams/${expected.teams[0].id}`);
    await page.getByRole("heading", { name: expected.teams[0].name, exact: true }).waitFor();
    await page.goBack({ waitUntil: "networkidle" }); assert.equal(new URL(page.url()).pathname, "/");
    assert.equal(await page.locator("details[data-team-id]").count(), 10);
    record(`${width} actual native profile link and browser Back`, "fixture anchor navigation; no Next-route claim");

    for (const team of expected.teams) {
      await visit(`/teams/${team.id}`);
      await page.getByRole("heading", { name: team.name, exact: true }).waitFor();
      assert.ok((await page.locator("main").innerText()).includes(`managed by ${team.manager}`));
      for (const player of team.players) {
        const link = page.locator(`main a[href="/player/${player.id}"]`);
        assert.ok(await link.count()); assert.ok((await link.first().textContent()).includes(player.name));
      }
      for (const label of ["W", "L", "PF", "PA"]) assert.equal(await page.locator("main dt").filter({ hasText: new RegExp(`^${label}$`) }).count(), 1);
      assert.ok(await page.locator('main a[href^="/teams/"]').count());
      assert.equal(await page.locator('main button[aria-label*="figurine"], main dialog, main canvas').count(), 0);
      await geometry(`team ${team.id}`);
      if (team.id === "1") await capture("team-1");
    }
    record(`${width} all ten team identities, managers, records, full rosters and opponent links`, "passed");
    await visit("/teams/1?state=empty");
    await page.getByText("Roster unavailable right now.", { exact: true }).waitFor();
    await geometry("team empty state");
    assert.equal(await page.getByRole("heading", { name: expected.teams[0].name, exact: true }).count(), 1);
    record(`${width} empty roster retains team identity and useful existing states`, "passed");
    await context.close();
  }
  for (const key of ["rejectedRequests", "externalRequests", "nonGETRequests", "apiRequests", "pageErrors", "consoleErrors"]) assert.deepEqual(receipt[key], [], key);
  record("Network/errors", "zero rejected-model/GLB, external, API or non-GET requests; zero page/console errors");
  receipt.status = "passed";
} catch (error) {
  receipt.status = "failed"; receipt.error = error.stack ?? error.message;
  throw error;
} finally {
  clearTimeout(deadline); await browser?.close();
  server?.kill("SIGTERM");
  if (server && server.exitCode === null) await Promise.race([new Promise(resolve => server.once("exit", resolve)), delay(1500)]);
  if (server?.exitCode === null) server.kill("SIGKILL");
  receipt.finishedAt = new Date().toISOString();
  await writeFile(path.join(evidence, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  await writeFile(path.join(evidence, "server.log"), serverLog);
  console.log(JSON.stringify({ status: receipt.status, head: receipt.head, tree: receipt.tree, checks: receipt.checks.length, evidence }));
}
