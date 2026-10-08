// Run with Node 22; Playwright is supplied separately, without adding app deps.
// TRADE_TEST_PLAYWRIGHT=/path/to/playwright/index.mjs node .../__tests__/browser.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

assert.equal(process.versions.node.split(".")[0], "22", "Use the CI Node 22 runtime");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const playwright = process.env.TRADE_TEST_PLAYWRIGHT;
assert.ok(playwright, "Set TRADE_TEST_PLAYWRIGHT to a separately installed playwright/index.mjs");
const { chromium } = await import(pathToFileURL(path.resolve(playwright)).href);
const fixture = await mkdtemp(path.join(tmpdir(), "goat-trade-61-"));
const evidence = path.resolve(process.env.TRADE_TEST_EVIDENCE ?? path.join(fixture, "evidence"));
await mkdir(evidence, { recursive: true });
const env = {
  PATH: process.env.PATH,
  TMPDIR: process.env.TMPDIR ?? tmpdir(),
  LANG: "en_US.UTF-8",
  TZ: "UTC",
  NEXT_TELEMETRY_DISABLED: "1",
  TRADE_FIXTURE_LOAD_LOG: path.join(evidence, "fixture-loads.log"),
};
// Whitelisted child env + a newly created fixture: no DB URLs or dotenv files.
assert.ok(!Object.keys(env).some((key) => /DATABASE|POSTGRES|NEON|IMPORT_URL/.test(key)));
const surface = "src/surfaces/trade-analyzer";
const copiedFiles = ["TradeAnalyzer.tsx", "TradeAnalyzer.module.css", "tradeUrl.ts", "__tests__/fixtures.ts"];
const hashes = {};
for (const file of copiedFiles) {
  const target = path.join(fixture, surface, file);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(repo, surface, file), target);
  const source = await readFile(path.join(repo, surface, file));
  assert.deepEqual(await readFile(target), source, "Fixture must compile byte-identical real source");
  hashes[file] = createHash("sha256").update(source).digest("hex");
}
await cp(path.join(repo, "src/domain"), path.join(fixture, "src/domain"), { recursive: true });
await cp(path.join(repo, "src/ui/tokens.css"), path.join(fixture, "src/tokens.css"));
await symlink(path.join(repo, "node_modules"), path.join(fixture, "node_modules"));
async function file(name, text) {
  const target = path.join(fixture, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, text);
}
await file("package.json", JSON.stringify({ private: true, dependencies: { next: "16.3.8", react: "19.2.8", "react-dom": "19.2.8" } }));
await file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom", "esnext"], strict: true, skipLibCheck: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", jsx: "react-jsx", paths: { "@/*": ["./src/*"] } }, include: ["**/*.ts", "**/*.tsx"] }));
await file("src/app/layout.tsx", `import '../tokens.css';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ margin: 0 }}><main>{children}</main><div style={{ height: 1000 }} /></body></html>;
}`);
await file("src/app/trade-analyzer/page.tsx", `import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { appendFileSync } from 'node:fs';
import { TradeAnalyzer } from '@/surfaces/trade-analyzer/TradeAnalyzer';
import { stocks } from '@/surfaces/trade-analyzer/__tests__/fixtures';
export default async function Page() {
  await connection();
  appendFileSync(process.env.TRADE_FIXTURE_LOAD_LOG!, 'market-fixture-read\\n');
  return <><nav>
    <Link prefetch={false} scroll={false} href="/trade-analyzer?keep=link&a=101&b=202">Shared Alpha</Link>{' '}
    <Link prefetch={false} scroll={false} href="/trade-analyzer?keep=slow&a=303&b=404">Shared Gamma</Link>
  </nav><Suspense fallback={<p>Loading fixture</p>}><TradeAnalyzer stocks={stocks} /></Suspense></>;
}`);
await file("src/app/player/[id]/page.tsx", `export function generateStaticParams() { return ['101','202','303','404'].map(id => ({ id })); }
export default function Player() { return <p>Synthetic player</p>; }`);
const next = path.join(repo, "node_modules/next/dist/bin/next");
let server;
let browser;
const logs = [];
function child(args) {
  const proc = spawn(process.execPath, [next, ...args], { cwd: fixture, env, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [proc.stdout, proc.stderr]) stream.on("data", (data) => { logs.push(data.toString()); process.stdout.write(data); });
  return proc;
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, message) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) { if (await check()) return; await delay(25); }
  assert.fail(message);
}
const summary = { node: process.version, fixture, sourceHashes: hashes, databaseUrls: "absent", checks: [] };
try {
  const build = child(["build", "--webpack"]);
  const [code] = await once(build, "exit");
  assert.equal(code, 0, "Production fixture build failed");
  server = child(["start", "--hostname", "127.0.0.1", "--port", "0"]);
  await until(() => logs.join("").match(/http:\/\/127\.0\.0\.1:(\d+)/), "Production server did not start");
  const origin = logs.join("").match(/http:\/\/127\.0\.0\.1:(\d+)/)[0];
  browser = await chromium.launch(process.env.TRADE_TEST_CHROME ? { executablePath: process.env.TRADE_TEST_CHROME } : {});
  summary.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const requests = [];
  const errors = [];
  let delayRsc = false;
  await context.route("**/*", async (route) => {
    assert.equal(new URL(route.request().url()).origin, origin, "Only synthetic loopback requests are allowed");
    if (delayRsc && route.request().headers().rsc === "1") await delay(600);
    await route.continue();
  });
  await context.addInitScript(() => {
    window.__copies = [];
    window.__rawReplace = window.history.replaceState.bind(window.history);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text) => { window.__copies.push(text); } } });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push({ url: request.url(), rsc: request.headers().rsc === "1", type: request.resourceType() }));
  async function picks(a, b) {
    await until(async () => JSON.stringify(await page.getByRole("region", { name: "TEAM A" }).getByRole("link").allTextContents()) === JSON.stringify(a)
      && JSON.stringify(await page.getByRole("region", { name: "TEAM B" }).getByRole("link").allTextContents()) === JSON.stringify(b), `Expected picks ${a} / ${b}`);
  }
  const loadCount = async () => (await readFile(env.TRADE_FIXTURE_LOAD_LOG, "utf8").catch(() => "")).trim().split("\n").filter(Boolean).length;
  const tradeRequests = (from) => requests.slice(from).filter((r) => new URL(r.url).pathname === "/trade-analyzer");
  async function add(side, name) {
    await page.getByRole("textbox", { name: `Search players for TEAM ${side}` }).fill(name);
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }
  async function copied(a, b) {
    await page.getByRole("button", { name: /> (COPY LINK|COPIED!)/ }).click();
    await until(async () => (await page.evaluate(() => window.__copies.length)) > 0, "Clipboard did not receive a link");
    const url = new URL(await page.evaluate(() => window.__copies.at(-1)));
    assert.equal(url.searchParams.get("a"), a);
    assert.equal(url.searchParams.get("b"), b);
    return url;
  }

  // Warm existing player-link prefetches before measuring trade URL writes.
  await page.goto(`${origin}/trade-analyzer?a=101,303&b=202,404&keep=one&keep=two#trade`);
  await picks(["Alpha Guard", "Gamma Center"], ["Beta Wing", "Delta Forward"]);
  await page.waitForLoadState("networkidle");
  const historyLength = await page.evaluate(() => history.length);
  const editsStart = requests.length;
  const loadsBefore = await loadCount();
  delayRsc = true;
  await page.getByRole("button", { name: "Remove Gamma Center from TEAM A" }).click();
  await copied("101", "202,404");
  await page.getByRole("button", { name: "Remove Delta Forward from TEAM B" }).click();
  let url = await copied("101", "202");
  await picks(["Alpha Guard"], ["Beta Wing"]);
  assert.deepEqual(url.searchParams.getAll("keep"), ["one", "two"]);
  assert.equal(url.hash, "#trade");
  await add("A", "Gamma Center");
  await copied("101,303", "202");
  await add("B", "Delta Forward");
  await copied("101,303", "202,404");
  await picks(["Alpha Guard", "Gamma Center"], ["Beta Wing", "Delta Forward"]);
  // Two mutations in one task must compose against the latest native URL.
  await page.evaluate(() => {
    document.querySelector('[aria-label="Remove Alpha Guard from TEAM A"]').click();
    document.querySelector('[aria-label="Remove Beta Wing from TEAM B"]').click();
  });
  await picks(["Gamma Center"], ["Delta Forward"]);
  await copied("303", "404");
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => history.length), historyLength);
  assert.equal(tradeRequests(editsStart).length, 0, "Pick edits must not request the server trade page");
  assert.equal(requests.slice(editsStart).filter((r) => r.rsc).length, 0, "Warmed pick edits must not request RSC");
  assert.equal(await loadCount(), loadsBefore, "Pick edits must not rerun the fixture market loader");
  summary.checks.push({ name: "rapid edits and immediate copy with delayed RSC", tradeRequests: 0, extraMarketReads: 0, rscRequests: requests.slice(editsStart).filter((r) => r.rsc).length, extraHistoryEntries: 0 });

  // Copy must serialize displayed picks even when the address is deliberately stale.
  await page.evaluate(() => window.__rawReplace(history.state, "", "?keep=stale&a=101&b=202#trade"));
  url = await copied("303", "404");
  assert.equal(url.searchParams.get("keep"), "stale");
  summary.checks.push({ name: "copy serializes displayed picks over stale location", passed: true });

  const traversalStart = requests.length;
  await page.evaluate(() => history.pushState(null, "", "?keep=first&a=101&b=202"));
  await picks(["Alpha Guard"], ["Beta Wing"]);
  await page.evaluate(() => history.pushState(null, "", "?keep=second&a=303&b=404"));
  await picks(["Gamma Center"], ["Delta Forward"]);
  await page.getByRole("button", { name: "Remove Gamma Center from TEAM A" }).click();
  await picks([], ["Delta Forward"]);
  await page.goBack();
  await picks(["Alpha Guard"], ["Beta Wing"]);
  await page.goForward();
  await picks([], ["Delta Forward"]);
  await page.goBack();
  await picks(["Alpha Guard"], ["Beta Wing"]);
  assert.equal(tradeRequests(traversalStart).length, 0);
  summary.checks.push({ name: "same-route native push and Back/Forward restore edited entries", tradeRequests: 0 });

  const incomingStart = requests.length;
  const incomingLoads = await loadCount();
  await page.getByRole("link", { name: "Shared Gamma", exact: true }).click();
  await picks(["Gamma Center"], ["Delta Forward"]);
  assert.equal(new URL(page.url()).searchParams.get("keep"), "slow");
  await copied("303", "404");
  await page.waitForLoadState("networkidle");
  assert.equal(tradeRequests(incomingStart).filter((r) => r.rsc).length, 1);
  assert.equal(await loadCount() - incomingLoads, 1);
  await page.goBack();
  await picks(["Alpha Guard"], ["Beta Wing"]);
  await page.goForward();
  await picks(["Gamma Center"], ["Delta Forward"]);
  summary.checks.push({ name: "delayed real Next Link navigation and Back/Forward", incomingRscRequests: 1, incomingMarketReads: 1 });

  delayRsc = false;
  await page.evaluate(() => history.pushState(null, "", "?keep=%ZZ&a=,101,%20101%20,unknown,%E0%A4%A&b=101,202,202&b=404#trade"));
  await picks(["Alpha Guard"], ["Beta Wing"]);
  await until(() => new URL(page.url()).searchParams.get("a") === "101" && new URL(page.url()).searchParams.getAll("b").join() === "202", "Malformed URL was not canonicalized");
  url = await copied("101", "202");
  assert.equal(url.searchParams.get("keep"), "%ZZ");
  summary.checks.push({ name: "malformed query filtering, deduplication and canonicalization", passed: true });
  await page.getByRole("textbox", { name: "Search players for TEAM B" }).fill("Alpha Guard");
  assert.equal(await page.getByRole("region", { name: "TEAM B" }).getByRole("button", { name: /Alpha Guard/ }).count(), 0);
  await page.getByRole("textbox", { name: "Search players for TEAM B" }).fill("");
  await page.getByRole("button", { name: "Remove Alpha Guard from TEAM A" }).focus();
  await page.keyboard.press("Enter");
  await picks([], ["Beta Wing"]);
  await page.evaluate(() => window.scrollTo(0, 250));
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.evaluate(() => document.querySelector('[aria-label="Remove Beta Wing from TEAM B"]').click());
  await picks([], []);
  assert.equal(await page.evaluate(() => scrollY), scrollBefore);
  summary.checks.push({ name: "cross-side exclusion, keyboard removal and scroll preservation", passed: true });

  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error("Synthetic clipboard refusal"); };
    document.execCommand = () => true;
  });
  await page.getByRole("button", { name: /> (COPY LINK|COPIED!)/ }).click();
  await until(async () => (await page.getByRole("button", { name: "> COPIED!", exact: true }).count()) === 1, "Clipboard fallback did not succeed");
  await page.evaluate(() => { document.execCommand = () => false; });
  await page.getByRole("button", { name: "> COPIED!", exact: true }).click();
  await until(async () => (await page.getByRole("button", { name: "> COPY FAILED — COPY URL MANUALLY", exact: true }).count()) === 1, "Clipboard failure feedback missing");
  await until(async () => (await page.getByRole("button", { name: "> COPY LINK", exact: true }).count()) === 1, "Copy feedback did not reset");
  assert.equal(await page.locator("textarea").count(), 0);
  summary.checks.push({ name: "clipboard API, fallback, failure and reset feedback", passed: true });
  await page.screenshot({ path: path.join(evidence, "desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await add("A", "Alpha Guard");
  await add("B", "Beta Wing");
  await picks(["Alpha Guard"], ["Beta Wing"]);
  assert.equal(await page.getByText("> FAIR DEAL", { exact: true }).count(), 1);
  await page.screenshot({ path: path.join(evidence, "mobile.png"), fullPage: true });
  summary.checks.push({ name: "mobile picks and unchanged fair-deal semantics", passed: true });
  assert.deepEqual(errors, [], "Browser raised errors");
  summary.consoleErrors = errors;
  summary.requests = requests;
  summary.status = "passed";
} catch (error) {
  summary.status = "failed";
  summary.error = error.stack;
  throw error;
} finally {
  await browser?.close();
  if (server && server.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
  await writeFile(path.join(evidence, "server.log"), logs.join(""));
  await writeFile(path.join(evidence, "results.json"), JSON.stringify(summary, null, 2));
  console.log(`Evidence: ${evidence}`);
}
