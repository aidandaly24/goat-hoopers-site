import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url), { chromium } = require("playwright");
const origin = "http://127.0.0.1:4196", evidence = { groups: [], pageErrors: [], productionActions: false };
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "4196"], {
  cwd: process.cwd(), stdio: "ignore", env: { ...process.env, DATABASE_URL: "", POSTGRES_URL: "", OPENAI_API_KEY: "", COMMISSIONER_KEY: "", CRON_SECRET: "",
    FRIENDS_AUTH_ENABLED: "", FRIENDS_AUTH_ENROLLMENT: "", GOAT_RANKED_FREE_THROW_ENABLED: "", GOAT_RANKED_FREE_THROW_RULES: "",
    GOAT_RANKED_CHOICE_GAMES_ENABLED: "", GOAT_ARCADE_RECONCILE_ENABLED: "", GOAT_ARCADE_CALENDAR: "", GOAT_AI_DECIDES_ENABLED: "",
    NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: `--import ${process.cwd()}/qa/ranked-choice/offline-app.mjs` } });
let browser;
try {
  let ready = false; const until = Date.now() + 30000;
  while (Date.now() < until) {
    try { if ((await fetch(`${origin}/api/arcade/ranked/runs?gameId=priced-in&runId=00000000-0000-4000-8000-000000000001`)).status === 503) { ready = true; break; } } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, "built server ready on fixed loopback port");
  for (const path of ["runs", "choices"]) {
    const r = await fetch(`${origin}/api/arcade/ranked/${path}?gameId=priced-in`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    assert.equal(r.status, 503); assert.equal((await r.json()).status, "disabled");
  }
  evidence.groups.push("real built Next routes default-off with no credentials");
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  for (const [gameId, kind, width, expected] of [["week-2-preview", "weekly", 320, "50–32"], ["priced-in", "weekly", 390, "750 points"], ["week-2-preview", "archive", 390, "50–32"], ["priced-in", "all-time", 1440, "750 points"]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage(); let writes = 0;
    page.on("pageerror", error => evidence.pageErrors.push(error.message));
    page.on("request", request => { if (request.method() === "POST") writes++; });
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname !== "/api/arcade/competition") return route.continue();
      const metric = gameId === "priced-in" ? { kind: "price-points", correct: 5, rounds: 5 } : { kind: "modeled-record", wins: 50, losses: 32 };
      return route.fulfill({ json: { status: "ready", board: { gameId, kind, label: "Synthetic renderer fixture only", phase: kind === "archive" ? "final" : "open", asOfMs: Date.now(),
        periodId: "synthetic-choice-final", scoreVersion: "a".repeat(64), entries: [{ rank: 1, username: "synthetic_player", teamId: null, score: gameId === "priced-in" ? 750 : 50,
          achievedAtMs: 1000, isCurrentUser: false, metric }] } } });
    });
    await page.goto(`${origin}${kind === "archive" ? "/arcade/history/synthetic-choice-final" : kind === "all-time" ? `/arcade/${gameId}/leaderboard` : "/arcade/leaderboard"}`);
    await page.getByText(expected, { exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: "Play ranked free throws" }).count(), 0);
    assert((await page.getByRole("link", { name: "Game all-time" }).getAttribute("href")).includes(gameId));
    await page.getByRole("button", { name: "League", exact: true }).click();
    await page.getByText(expected, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    assert.equal(writes, 0);
    evidence.groups.push(`${gameId} ${kind} ${width}px: metric, scope, links, reflow, zero writes`);
    await context.close();
  }
  assert.deepEqual(evidence.pageErrors, []);
  await writeFile("/tmp/goat-choice-browser.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence));
} finally {
  await browser?.close();
  if (server.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
}
