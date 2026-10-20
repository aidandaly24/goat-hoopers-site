// Complete app layout/routes/assets + real auth/store on loopback only.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

if (process.env.RUN_CLAIM_TEAM_LOCAL_TEST !== "1") throw new Error("Explicit fixed local PostgreSQL opt-in required");
const require = createRequire(import.meta.url), { chromium } = require("playwright");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."), origin = "http://localhost:4195";
const schema = `ranked_full_${randomUUID().replaceAll("-", "")}`;
const fixtureDirectory = await mkdtemp("/tmp/goat-competition-browser-"), fixturePath = path.join(fixtureDirectory, "finality.json");
const now = Date.now(), prior = now - 2 * 86400000;
const fixture = { id: "123456789", date: new Date(prior).toISOString().slice(0, 10).replaceAll("-", ""), final: false };
const calendar = [{ id: "browser-week-1", gameId: "free-throw", week: "2026-W01", label: "Synthetic Week 1 · Free throws", order: 1,
  opensAtMs: prior - 3600000, predecessorId: null, calendarSource: "https://example.test/fixture-only", calendarVersion: "browser-synthetic-only",
  fixtures: [{ id: fixture.id, date: fixture.date, startsAtMs: prior }] }];
calendar.push({ ...calendar[0], id: "browser-week-2", week: "2026-W02", label: "Synthetic Week 2 · Free throws", order: 2,
  predecessorId: calendar[0].id, opensAtMs: now - 3600000,
  fixtures: [{ id: "123456790", date: "20261030", startsAtMs: now + 86400000 }] });
const localDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const midnight = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", hour: "2-digit", minute: "2-digit" });
calendar[1].opensAtMs = [4, 5].map(hour => Date.parse(`${localDate}T0${hour}:00:00Z`)).find(at => midnight.format(at) === "00:00");
fixture.next = { id: "123456790", date: localDate.replaceAll("-", ""), final: false };
calendar[1].fixtures = [{ id: fixture.next.id, date: fixture.next.date, startsAtMs: calendar[1].opensAtMs }];
const commissionerKey = randomBytes(32).toString("hex");
const pool = new Pool({ host: "127.0.0.1", port: 55441, database: "claim_team_test", user: "postgres", ssl: false,
  max: 4, connectionTimeoutMillis: 1500, options: `-c search_path=${schema}` });
// Fixture values only; never copied into an application environment file.
const rules = { ruleSetId: "full-app-fixture-only", engine: "moving-court-makes-v2", shots: 3, durationMs: 60000,
  minShotIntervalMs: 1000, maxRunsPerWeek: 3, calendar: { timeZone: "America/New_York", startsOn: 1, hour: 0, minute: 0 } };
const deviceScaleFactor = Number(process.env.GOAT_QA_DEVICE_SCALE ?? 1);
if (![0.25, 0.5, 1, 2].includes(deviceScaleFactor)) throw new Error("Unsupported browser fixture pixel density");
const desktopMotion = process.env.GOAT_QA_DESKTOP_MOTION === "reduce" ? "reduce" : "no-preference";
const evidence = { mode: "Full unmodified application, production default-off then development ranked mode with actual PostgreSQL/auth",
  buildId: (await readFile(path.join(repo, ".next/BUILD_ID"), "utf8")).trim(), rulesAreSynthetic: true,
  rules, deviceScaleFactor, desktopMotion, checks: [], movementScenarios: [], pageErrors: [], limitations: "Only the finality publisher response is a synthetic local fixture; real mounted routes, auth, replay, database and UI run unchanged. External league/news services fail closed. Ranked login uses development localhost HTTP cookies. Software-rendered browser pixel density and desktop motion preference are recorded explicitly; this is functional proof, not normal-motion physical-device/FPS evidence. Production HTTPS secure cookies, email delivery, hosting finality fetch and deployment are not verified.", sourceHashes: {} };
for (const file of ["src/app/layout.tsx", "src/app/arcade/ranked-free-throw/page.tsx", "src/surfaces/arcade/RankedFreeThrow.tsx",
  "src/surfaces/arcade/free-throw/FreeThrowPractice.tsx", "src/surfaces/accounts/AccountForm.tsx", "src/data/ranked-free-throw/runtime.ts", "src/data/ranked-free-throw/store.ts",
  "src/domain/arcade/ranked-free-throw.ts", "src/domain/arcade/free-throw-physics.ts", "src/domain/arcade/free-throw-positions.ts"]) {
  evidence.sourceHashes[file] = createHash("sha256").update(await readFile(path.join(repo, file))).digest("hex");
}
let server, browser, lastPage, ownsSchema = false, logs = "";
async function stop() { if (server?.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); } }
async function start(mode, env) {
  logs = "";
  server = spawn(process.execPath, [path.join(repo, "node_modules/next/dist/bin/next"), mode,
    "--hostname", "127.0.0.1", "--port", "4195"], { cwd: repo,
    env: { PATH: process.env.PATH, TMPDIR: "/tmp", TZ: "UTC", LANG: "en_US.UTF-8", NODE_ENV: mode === "dev" ? "development" : "production",
      NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: `--import=${path.join(repo, "qa/ranked-free-throw/finality-fixture.mjs")}`, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", chunk => { logs += String(chunk); }); server.stderr.on("data", chunk => { logs += String(chunk); });
  const deadline = Date.now() + 30000;
  while (!logs.includes("Ready in") && server.exitCode === null && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
  assert.match(logs, /Ready in/);
}
function record(check) { evidence.checks.push(check); console.log(check); }
async function context(options) {
  const context = await browser.newContext({ deviceScaleFactor, ...options });
  await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage(); lastPage = page; page.setDefaultTimeout(30000);
  page.on("pageerror", error => evidence.pageErrors.push(String(error)));
  return { context, page };
}
async function ready(page) {
  await page.locator('[data-shot-state="ready"]').waitFor();
  await page.waitForFunction(() => !document.querySelector('[aria-label="Hold to charge, release to shoot"]')?.disabled);
}
try {
  assert.equal((await pool.query("SELECT current_database() AS name")).rows[0].name, "claim_team_test");
  await pool.query(`CREATE SCHEMA ${schema}`); ownsSchema = true;
  await pool.query(`CREATE TABLE site_users(id uuid PRIMARY KEY,team_id text NOT NULL UNIQUE,display_name text NOT NULL,password_hash text NOT NULL,created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE invite_codes(code text PRIMARY KEY,team_id text NOT NULL,used_by uuid,used_at timestamp,created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE sessions(token_hash text PRIMARY KEY,user_id uuid REFERENCES site_users(id),expires_at timestamp NOT NULL,created_at timestamp NOT NULL DEFAULT now());`);
  await pool.query((await readFile(path.join(repo, "db/friends-auth/0000_friends_auth.sql"), "utf8")).replaceAll('"public".', `"${schema}".`));
  await pool.query(await readFile(path.join(repo, "db/friends-auth/0001_account_usernames.sql"), "utf8"));
  await pool.query(await readFile(path.join(repo, "migrations/ranked-free-throw.sql"), "utf8"));
  const password = "synthetic-full-app-password-only";
  for (const name of ["desktop_hooper", "mobile_hooper"]) {
    const id = randomUUID();
    await pool.query("INSERT INTO auth_user(id,name,email,email_verified,created_at,updated_at) VALUES($1,$2,$3,true,now(),now())", [id, name, `${name}@example.test`]);
    await pool.query("INSERT INTO auth_account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES($1,$2,'credential',$2,$3,now(),now())", [randomUUID(), id, await hashPassword(password)]);
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", headless: true,
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  await start("start", { GOAT_RANKED_FREE_THROW_ENABLED: "0" });
  const closed = await context({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  let rankedRequests = 0; closed.page.on("request", request => { if (request.url().includes("/api/arcade/free-throw/")) rankedRequests++; });
  await closed.page.goto(`${origin}/arcade/ranked-free-throw`);
  await closed.page.getByText("Ranked play is closed until the competition schedule and storage are enabled.").waitFor();
  assert.equal(await closed.page.getByRole("button", { name: "Start ranked round", exact: true }).count(), 0);
  assert.equal(rankedRequests, 0);
  await closed.page.getByRole("link", { name: "Play local practice", exact: true }).click(); await ready(closed.page);
  assert.equal(await closed.page.getByRole("button", { name: "Reset session", exact: true }).isEnabled(), true);
  assert.equal(rankedRequests, 0);
  record("Production-built full app: closed ranked view, no ranked API traffic, working practice link/court");
  await closed.context.close(); await stop();
  const database = new URL("postgresql://postgres@127.0.0.1:55441/claim_team_test"); database.searchParams.set("options", `-c search_path=${schema}`);
  await writeFile(fixturePath, JSON.stringify(fixture));
  await start("dev", { DATABASE_URL: database.toString(), FRIENDS_AUTH_ENROLLMENT: "1", BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: randomBytes(48).toString("hex"), GOAT_RANKED_FREE_THROW_ENABLED: "1", GOAT_RANKED_FREE_THROW_RULES: JSON.stringify(rules),
    GOAT_ARCADE_CALENDAR: JSON.stringify(calendar), GOAT_ARCADE_RECONCILE_ENABLED: "1", COMMISSIONER_KEY: commissionerKey,
    GOAT_QA_FINALITY_FIXTURE: fixturePath });
  const reconcile = async () => {
    const response = await fetch(`${origin}/api/arcade/competition/reconcile`, { method: "POST", headers: { authorization: `Bearer ${commissionerKey}` } });
    assert.equal(response.status, 200); return response.json();
  };
  assert.deepEqual((await reconcile()).finalized, []);
  const savedRuns = [];
  for (const [name, options] of [["desktop_hooper", { viewport: { width: 1280, height: 900 }, reducedMotion: desktopMotion }],
    ["mobile_hooper", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" }]]) {
    const value = await context(options), { page } = value, submissions = [];
    page.on("request", request => { if (request.method() === "POST" && request.url().endsWith("/scores")) submissions.push(request.postDataJSON()); });
    await page.goto(`${origin}/arcade/ranked-free-throw`);
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await page.getByLabel("Email", { exact: true }).fill(`${name}@example.test`); await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in", exact: true }).click(); await page.waitForURL("**/account");
    const cookies = await value.context.cookies();
    assert.ok(cookies.some(cookie => cookie.name.includes("goat-auth") && cookie.httpOnly && cookie.sameSite === "Lax"));
    await page.goto(`${origin}/arcade/ranked-free-throw`);
    const admitted = page.waitForResponse(response => response.url().endsWith("/runs") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Start ranked round", exact: true }).click();
    const admission = await (await admitted).json(); assert.equal(admission.replayContext.engine, "moving-court-makes-v2");
    await ready(page);
    assert.equal(await page.getByRole("button", { name: "Reset session", exact: true }).isDisabled(), true);
    const court = page.getByRole("group", { name: "Court controls", exact: true });
    const powers = name === "desktop_hooper" ? [50, 50, 51] : [50, 79, 51];
    const expected = name === "desktop_hooper" ? [1, 0, 1] : [1, 1, 1], score = expected.reduce((sum, value) => sum + value, 0);
    const origins = [];
    for (let index = 0; index < powers.length; index++) {
      await ready(page);
      const origin = (await court.getAttribute("data-shot-origin")).split(",").map(Number); origins.push(origin);
      assert.deepEqual(origin, Object.values(admission.replayContext.positions[index]));
      await court.focus(); await page.keyboard.press("r");
      assert.equal(await court.getAttribute("data-shot-origin"), origin.join(",")); // R cannot reroll a ranked spot.
      for (let step = 50; step < powers[index]; step++) await page.keyboard.press("ArrowUp");
      console.log(`${name}: firing shot ${index + 1}`);
      await page.keyboard.press("Enter");
    }
    assert.notDeepEqual(origins[0], origins[1]); assert.notDeepEqual(origins[1], origins[2]);
    if (evidence.movementScenarios.length) assert.deepEqual(origins, evidence.movementScenarios[0].origins);
    await page.waitForFunction(() => !Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Save completed round")?.disabled);
    await page.getByRole("button", { name: "Save completed round", exact: true }).click();
    await page.getByRole("heading", { name: `Final score: ${score}`, exact: true }).waitFor();
    assert.deepEqual(await page.getByRole("list", { name: "Validated shots in order" }).locator("li").allTextContents(), expected.map(String));
    assert.equal(submissions.length, 1); assert.deepEqual(Object.keys(submissions[0]).sort(), ["runId", "shots"]);
    const row = (await pool.query("SELECT s.outcomes,s.score FROM ranked_free_throw_scores s JOIN ranked_free_throw_runs r ON r.id=s.run_id WHERE r.id=$1", [submissions[0].runId])).rows[0];
    assert.deepEqual(row, { outcomes: expected.join(""), score });
    assert.match(await page.locator("dl").filter({ has: page.getByText("Ending streak", { exact: true }) }).innerText(), name === "desktop_hooper" ? /Ending streak\s+1/ : /Ending streak\s+3/);
    await page.getByRole("button", { name: "League", exact: true }).click(); await page.getByText("No validated scores in this scope yet.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Everyone", exact: true }).click(); await page.getByRole("list", { name: "Weekly rankings", exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("run"), submissions[0].runId);
    await page.reload(); await page.getByRole("heading", { name: `Final score: ${score}`, exact: true }).waitFor(); assert.equal(submissions.length, 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    evidence.movementScenarios.push({ name, origins, powers, outcomes: expected, score, postCount: submissions.length });
    savedRuns.push({ cookies, runId: submissions[0].runId, score });
    record(`${name}: same moving positions → ${expected.join("")} / score ${score} → one input-only POST, real persistence, scope switch and private reload`);
    await value.context.close();
  }
  const view = await context({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await view.page.goto(`${origin}/arcade`);
  const weekly = view.page.getByRole("region", { name: "This week’s leaderboard", exact: true });
  await weekly.getByText("mobile_hooper", { exact: true }).waitFor();
  assert.ok((await weekly.boundingBox()).y < (await view.page.getByRole("region", { name: "Available games", exact: true }).boundingBox()).y);
  await weekly.getByRole("link", { name: "Game all-time", exact: true }).click();
  await view.page.getByRole("heading", { name: "Free Throw Shootout · all-time", exact: true }).waitFor();
  await view.page.getByText("mobile_hooper", { exact: true }).waitFor();
  record("Arcade top weekly board and separate game all-time page show the actual saved best scores");
  await writeFile(fixturePath, JSON.stringify({ ...fixture, final: true }));
  assert.deepEqual((await reconcile()).finalized, [calendar[0].id]);
  assert.deepEqual((await reconcile()).finalized, []);
  await view.page.goto(`${origin}/arcade`);
  await weekly.getByText(/Synthetic Week 2.*open/).waitFor();
  await weekly.getByText("No validated scores in this board yet.", { exact: true }).waitFor();
  await weekly.getByRole("link", { name: "Weekly history", exact: true }).click();
  await view.page.getByRole("link", { name: calendar[0].label, exact: true }).click();
  await view.page.getByText("mobile_hooper", { exact: true }).waitFor();
  assert.ok(view.page.url().endsWith(`/arcade/history/${calendar[0].id}`));
  for (const width of [320, 390, 1440]) {
    await view.page.setViewportSize({ width, height: 900 });
    assert.equal(await view.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await view.page.setViewportSize({ width: 390, height: 844 });
  if (process.env.QA_SCREENSHOT_PATH) await view.page.screenshot({ path: process.env.QA_SCREENSHOT_PATH, fullPage: true });
  record("Finality endpoint archives once, opens next due period, preserves prior scores and stable archive URL; 320/390/1440px reflow passes");
  await view.context.close();
  await writeFile(fixturePath, JSON.stringify({ ...fixture, final: true, next: { ...fixture.next, final: true } }));
  assert.deepEqual((await reconcile()).finalized, [calendar[1].id]);
  const recovered = await context({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await recovered.context.addCookies(savedRuns[0].cookies);
  let recoveryPosts = 0;
  recovered.page.on("request", request => { if (request.method() === "POST" && /\/(?:runs|scores)$/.test(request.url())) recoveryPosts++; });
  await recovered.page.goto(`${origin}/arcade/ranked-free-throw?run=${savedRuns[0].runId}`);
  await recovered.page.getByText("New rounds are closed. Your saved results remain available.", { exact: true }).waitFor();
  await recovered.page.getByRole("heading", { name: `Final score: ${savedRuns[0].score}`, exact: true }).waitFor();
  assert.equal(await recovered.page.getByRole("button", { name: "Start ranked round", exact: true }).count(), 0);
  await recovered.page.reload();
  await recovered.page.getByRole("heading", { name: `Final score: ${savedRuns[0].score}`, exact: true }).waitFor();
  assert.equal(recoveryPosts, 0);
  await recovered.context.clearCookies(); await recovered.context.addCookies(savedRuns[1].cookies);
  await recovered.page.reload();
  await recovered.page.getByText("No saved result was found for this account and round.", { exact: true }).waitFor();
  assert.equal(await recovered.page.getByRole("heading", { name: `Final score: ${savedRuns[0].score}`, exact: true }).count(), 0);
  assert.equal(Number((await pool.query("SELECT count(*) FROM ranked_free_throw_scores")).rows[0].count), 2);
  record("After both periods seal, the owner recovers a bookmarked result/reload with zero write requests; another verified account cannot read it");
  await recovered.context.close();
  assert.deepEqual(evidence.pageErrors, []);
  if (process.env.QA_REPORT_PATH) await writeFile(process.env.QA_REPORT_PATH, JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  if (lastPage && !lastPage.isClosed()) console.error("Browser failure state", await lastPage.evaluate(() => ({
    url: location.href, hidden: document.hidden, state: document.querySelector("[data-shot-state]")?.getAttribute("data-shot-state"),
    text: document.querySelector("main")?.innerText.slice(0, 2000), page: document.body.innerText.slice(-500),
  })).catch(() => null));
  console.error("Browser page errors", evidence.pageErrors); console.error(logs.slice(-12000)); throw error;
}
finally {
  await browser?.close(); await stop();
  if (ownsSchema) await pool.query(`DROP SCHEMA ${schema} CASCADE`);
  await pool.end(); await rm(fixtureDirectory, { recursive: true, force: true });
}
