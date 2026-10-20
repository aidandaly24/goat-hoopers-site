// Production Next boundary + browser flow. Actual page/surfaces/API, minimal layout,
// no credentials, DB, upstream data or deployment. Browser as-of values are synthetic.
import assert from "node:assert/strict";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, "../..");
const temporary = await mkdtemp(path.join(os.tmpdir(), "goat-ranked-opening-"));
const output = process.env.RANKED_OPENING_EVIDENCE ?? "/tmp/goat-ranked-opening-evidence";
const require = createRequire(import.meta.url), { chromium } = require("playwright");
const next = path.join(repo, "node_modules/next/dist/bin/next");
const env = { PATH: process.env.PATH, TMPDIR: os.tmpdir(), LANG: "en_US.UTF-8", TZ: "UTC", NEXT_TELEMETRY_DISABLED: "1",
  NODE_OPTIONS: `--import=${path.join(repo, "src/test/arcade/block-external.mjs")}` };
const report = { head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  dirty: !!execFileSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" }).trim(),
  method: "Isolated production Next app with actual page/surfaces/API, minimal credential-free layout; browser as-of interception only. No hosting/full-shell/auth/DB proof.",
  checks: [], errors: [], external: [], writes: [] };
const logs = [];
let server, browser;
await mkdir(output, { recursive: true });
try {
  for (const directory of ["app/arcade/leaderboard", "app/arcade/free-throw", "app/api/arcade/free-throw/clock"]) await mkdir(path.join(temporary, directory), { recursive: true });
  const copies = [
    [path.join(here, "layout.tsx"), "app/layout.tsx"],
    [path.join(here, "practice.tsx"), "app/arcade/free-throw/page.tsx"],
    [path.join(repo, "src/app/arcade/page.tsx"), "app/arcade/page.tsx"],
    [path.join(repo, "src/app/arcade/leaderboard/page.tsx"), "app/arcade/leaderboard/page.tsx"],
    [path.join(repo, "src/app/arcade/leaderboard/page.module.css"), "app/arcade/leaderboard/page.module.css"],
    [path.join(repo, "src/app/api/arcade/free-throw/clock/route.ts"), "app/api/arcade/free-throw/clock/route.ts"],
  ];
  for (const [source, target] of copies) await copyFile(source, path.join(temporary, target));
  await symlink(path.join(repo, "node_modules"), path.join(temporary, "node_modules"));
  await symlink(path.join(repo, "public"), path.join(temporary, "public"));
  await writeFile(path.join(temporary, "package.json"), JSON.stringify({ name: "goat-held-opening-qa", private: true }));
  await writeFile(path.join(temporary, "next.config.mjs"), `export default { experimental: { externalDir: true }, webpack(config) { config.resolve.alias['@'] = ${JSON.stringify(path.join(repo, "src"))}; return config; } };\n`);
  await writeFile(path.join(temporary, "tsconfig.json"), JSON.stringify({ compilerOptions: {
    target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], strict: true, skipLibCheck: true, noEmit: true,
    esModuleInterop: true, module: "esnext", moduleResolution: "bundler", jsx: "react-jsx", resolveJsonModule: true,
    isolatedModules: true, baseUrl: ".", paths: { "@/*": [path.join(repo, "src/*")] },
  }, include: ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }));
  const built = spawnSync(process.execPath, [next, "build", temporary, "--webpack"], { cwd: temporary, env, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  assert.equal(built.status, 0, built.stdout + built.stderr);
  server = spawn(process.execPath, [next, "start", temporary, "--hostname", "127.0.0.1", "--port", "0"], { cwd: temporary, env, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [server.stdout, server.stderr]) stream.on("data", chunk => logs.push(chunk.toString()));
  let origin;
  for (let attempt = 0; attempt < 100; attempt++) {
    origin = logs.join("").match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (origin) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(origin, logs.join(""));
  for (const flight of [false, true]) {
    const response = await fetch(`${origin}/arcade/leaderboard`, { headers: flight ? { RSC: "1" } : {} });
    const body = await response.text();
    assert.equal(response.status, 200); assert.ok(!/Attempted to call|Application error:|"digest":/.test(body));
    if (flight) {
      assert.match(response.headers.get("content-type") ?? "", /text\/x-component/);
      assert.ok(body.includes("WeeklyChallengeCountdown")); assert.ok(body.includes('"status":"closed"'));
    } else {
      assert.ok(body.includes("Scheduled ranked opening")); assert.ok(body.includes("2026-10-20T19:00:00.000Z"));
    }
    report.checks.push(`${flight ? "RSC" : "HTML"}: actual leaderboard page renders through production Next boundary`);
  }
  const liveResponse = await fetch(`${origin}/api/arcade/free-throw/clock`), live = await liveResponse.json();
  assert.equal(liveResponse.status, 200); assert.match(liveResponse.headers.get("cache-control"), /no-store/);
  assert.equal(live.observation.phase, "held"); assert.equal(live.observation.period, null);
  report.checks.push("Actual clock GET returns sampled server time, held phase and no-store with credentials absent");
  const opening = live.observation.opening.startsAtMs;
  browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    await context.route("**/*", route => {
      const request = route.request();
      if (new URL(request.url()).origin !== origin) { report.external.push(request.url()); return route.abort(); }
      if (request.method() !== "GET") { report.writes.push(request.url()); return route.abort(); }
      return route.continue();
    });
    let mode = "future", fail = false, reads = 0;
    const start = Date.now();
    await context.route("**/api/arcade/free-throw/clock", async route => {
      reads++;
      if (fail) return route.abort();
      const response = await route.fetch(), body = await response.json();
      assert.equal(body.observation.phase, "held");
      // Browser timing fixture only; the actual handler is separately verified above and offline.
      body.observation.asOfMs = mode === "future" ? opening - 3600000 + Date.now() - start : opening + 86400000 + Date.now() - start;
      return route.fulfill({ response, json: body });
    });
    const page = await context.newPage();
    page.on("pageerror", error => report.errors.push(error.message));
    await page.goto(`${origin}/arcade`);
    await page.getByRole("link", { name: "Weekly leaderboard", exact: true }).click();
    await page.locator('[data-server-clock="running"]').waitFor();
    assert.equal(await page.getByRole("main").count(), 1);
    for (const scope of ["Everyone", "League"]) assert.equal(await page.getByRole("button", { name: scope, exact: true }).isDisabled(), true);
    const beforeSkew = reads;
    await page.evaluate(() => { const original = Date.now; window.restoreClock = () => { Date.now = original; }; Date.now = () => original() + 3600000; });
    await page.waitForTimeout(1300); assert.equal(reads, beforeSkew + 1);
    await page.evaluate(() => window.restoreClock());
    mode = "after"; await page.reload();
    await page.getByText("Scheduled opening reached · ranked remains held", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: /Start ranked|Resume round/ }).count(), 0);
    const beforeHidden = reads;
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(150); assert.equal(reads, beforeHidden);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.locator('[data-server-clock="ended"]').waitFor(); assert.equal(reads, beforeHidden + 1);
    if (width === 320) await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; document.documentElement.dataset.theme = "dark"; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(output, `leaderboard-${width}.png`), fullPage: true });
    report.checks.push(`${width}px: Arcade entry, held future/zero, disabled scopes, skew, hidden pause/coalesced GET, reduced motion and reflow`);
    await page.getByRole("link", { name: "Play Free Throw practice", exact: true }).click();
    await page.locator('[data-shot-state="ready"]').waitFor({ timeout: 20000 });
    assert.match(page.url(), /\/arcade\/free-throw$/);
    const practiceReads = reads; await page.waitForTimeout(100); assert.equal(reads, practiceReads);
    await page.goBack(); await page.locator('[data-server-clock="ended"]').waitFor();
    report.checks.push(`${width}px: actual Next navigation reaches existing Practice Court, then Back restores held board`);
    fail = true; await page.reload();
    await page.getByText("Server clock unavailable · ranked remains held", { exact: true }).waitFor();
    const failedReads = reads; await page.waitForTimeout(1100); assert.equal(reads, failedReads);
    fail = false; await page.getByRole("button", { name: "Refresh clock status", exact: true }).click();
    await page.locator('[data-server-clock="ended"]').waitFor(); assert.equal(reads, failedReads + 1);
    report.checks.push(`${width}px: network failure retains closed board; explicit recovery performs one GET, no automatic retries`);
    await context.close();
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []); assert.deepEqual(report.writes, []);
  assert.ok(!logs.join("").includes("Attempted to call"), logs.join(""));
  console.log(JSON.stringify(report.checks, null, 2));
} finally {
  await browser?.close();
  if (server && server.exitCode === null) { server.kill("SIGTERM"); await new Promise(resolve => server.once("exit", resolve)); }
  await rm(temporary, { recursive: true, force: true });
  await writeFile(path.join(output, "verification.json"), JSON.stringify(report, null, 2) + "\n");
}
