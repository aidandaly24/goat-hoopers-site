import { chromium } from "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:4181";
const output = "qa/account-settings-visual/evidence";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const evidence = { kind: "Checked-out production page functions/components with synthetic injected sources and real shared shell/fonts; native fixture navigation, not hosted Next/live auth or original-photo comparison.", cases: [], interactions: [], pageErrors: [], externalRequests: [], unexpectedPosts: [] };
const signupOnly = process.argv.includes("--signup-only");
const interactionsOnly = process.argv.includes("--interactions-only") || signupOnly;
if (interactionsOnly) {
  const previous = JSON.parse(await readFile(`${output}/browser.json`, "utf8"));
  evidence.cases = previous.cases;
  if (signupOnly) evidence.interactions = previous.interactions;
  evidence.matrixReuseReason = "All 68 states passed on unchanged application sources before a QA interaction selector ambiguity; only interaction flows resumed after scoping selectors to main.";
}
const cases = [];
for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) for (const route of ["/account", "/team"]) cases.push({ route, width, theme, state: "linked" });
for (const width of [320, 1440]) {
  for (const state of ["unlinked", "enrollment", "signed-out", "disabled", "error", "loading"]) cases.push({ route: "/account", width, state, theme: "light" });
  for (const state of ["partial", "outage", "empty", "missing-team", "signed-out", "enrollment"]) cases.push({ route: "/team", width, state, theme: "light" });
  for (const mode of ["signup", "login", "setup", "forgot", "team-recovery", "reset", "password", "claim", "link"]) cases.push({ route: "/fixture/form", mode, width, state: "linked", theme: "light" });
}
for (const route of ["/account", "/team"]) for (const width of [320, 1440]) cases.push({ route, width, theme: "light", state: "linked", long: true });
for (const route of ["/account", "/team", "/account/password", "/account?state=unlinked"]) cases.push({ route, width: 1280, theme: "light", state: "linked", text200: true });
for (const route of ["/account/password", "/account/login?state=signed-out"]) cases.push({ route, width: 390, state: "linked", theme: "dark" });
await mkdir(output, { recursive: true });
async function openCase(spec) {
  const context = await browser.newContext({ viewport: { width: spec.width, height: 960 }, colorScheme: spec.theme, reducedMotion: "reduce" });
  context.setDefaultTimeout(10000); context.setDefaultNavigationTimeout(10000);
  const page = await context.newPage();
  page.on("pageerror", error => evidence.pageErrors.push(String(error)));
  await page.route("**/*", route => {
    const request = route.request();
    if (!request.url().startsWith(base)) { evidence.externalRequests.push(request.url()); return route.abort(); }
    if (request.method() === "POST") { evidence.unexpectedPosts.push(new URL(request.url()).pathname); return route.fulfill({ status: 503, body: "{}", contentType: "application/json" }); }
    return route.continue();
  });
  const url = new URL(spec.route, base);
  if (!url.searchParams.has("state")) url.searchParams.set("state", spec.state);
  url.searchParams.set("theme", spec.theme);
  if (spec.mode) url.searchParams.set("mode", spec.mode);
  if (spec.long) url.searchParams.set("long", "1");
  await page.goto(url.href); await page.waitForSelector('html[data-fixture-ready="true"]');
  await page.locator("main").waitFor();
  if (spec.text200) await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}
try {
  for (const spec of interactionsOnly ? [] : cases) {
    const { context, page } = await openCase(spec);
    const measured = await page.evaluate(() => {
      const main = document.querySelector("main"), viewport = innerWidth;
      const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"); canvas.width = canvas.height = 1;
      const rgb = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) => i === 3 ? v / 255 : v); };
      const background = node => { const layers = []; for (let n = node; n; n = n.parentElement) layers.push(rgb(getComputedStyle(n).backgroundColor)); return layers.reverse().reduce((base, top) => top.slice(0, 3).map((v, i) => v * top[3] + base[i] * (1 - top[3])), [255, 255, 255]); };
      const luminance = color => color.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const links = [...main.querySelectorAll("a")].filter(a => a.getBoundingClientRect().width > 0).map(a => {
        const box = a.getBoundingClientRect(), style = getComputedStyle(a), foreground = luminance(rgb(style.color)), bg = luminance(background(a));
        return { text: a.textContent.trim(), href: a.getAttribute("href"), x: box.x, right: box.right, width: box.width, height: box.height, color: style.color, underline: style.textDecorationLine.includes("underline"), contrast: (Math.max(foreground, bg) + .05) / (Math.min(foreground, bg) + .05) };
      });
      const settings = main.querySelector('a[href="/account"]');
      const card = settings?.closest("main > div > div");
      const title = main.querySelector("h1");
      return { viewport, documentWidth: document.documentElement.scrollWidth, mainWidth: main.scrollWidth, h1s: main.querySelectorAll("h1").length, redirect: main.querySelector("[data-fixture-redirect]")?.getAttribute("data-fixture-redirect") ?? null, links, formCount: main.querySelectorAll("form").length, rosterLinks: main.querySelectorAll('a[href^="/player/"]').length, settingsInsideIdentity: settings ? Boolean(card?.contains(title)) : null };
    });
    const failures = [];
    if (measured.documentWidth > spec.width + 1) failures.push("document overflow");
    for (const link of measured.links) {
      if (link.x < -1 || link.right > spec.width + 1) failures.push(`link outside viewport: ${link.text}`);
      if (link.height < 43.5) failures.push(`short target: ${link.text}`);
      if (link.underline || ["rgb(0, 0, 238)", "rgb(85, 26, 139)"].includes(link.color)) failures.push(`default-looking anchor: ${link.text}`);
      if (link.contrast < 4.5) failures.push(`low action contrast: ${link.text}`);
    }
    if (!measured.redirect && spec.state !== "loading" && measured.h1s !== 1) failures.push("primary heading count");
    if (spec.route === "/account" && spec.state === "linked" && measured.formCount) failures.push("linked settings unexpectedly has form");
    if (spec.route === "/team" && !measured.redirect) {
      if (spec.state !== "enrollment" && !measured.settingsInsideIdentity) failures.push("settings outside identity card");
      if (!["empty"].includes(spec.state) && measured.rosterLinks !== 24) failures.push("roster incomplete");
    }
    if ([390, 1440].includes(spec.width) && spec.state === "linked" && !spec.mode && !spec.long && !spec.text200 && ["/account", "/team"].includes(spec.route)) await page.screenshot({ path: `${output}/after-${spec.route.slice(1)}-${spec.width}-${spec.theme}.png` });
    if (spec.long && spec.width === 320 || spec.text200 && spec.route === "/account") await page.screenshot({ path: `${output}/${spec.text200 ? "text200" : "long"}-${spec.route.slice(1)}-${spec.width}.png`, fullPage: spec.route !== "/team" });
    evidence.cases.push({ ...spec, measured, failures });
    await context.close();
    if (evidence.cases.length % 10 === 0) console.log(`Measured ${evidence.cases.length}/${cases.length} account/team states.`);
  }
  // Actual native links and keyboard/hover affordances in the checked-out UI.
  for (const theme of signupOnly ? [] : ["light", "dark"]) {
    const { context, page } = await openCase({ route: "/account", state: "linked", width: 390, theme });
    await page.locator("main").focus(); await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => ({ text: document.activeElement.textContent.trim(), width: getComputedStyle(document.activeElement).outlineWidth, style: getComputedStyle(document.activeElement).outlineStyle }));
    assert.equal(focused.style, "solid"); assert.ok(parseFloat(focused.width) >= 2);
    const action = page.locator('main a[href="/account/password"]');
    const before = await action.evaluate(a => getComputedStyle(a).backgroundColor);
    await action.hover(); await page.waitForTimeout(220);
    const after = await action.evaluate(a => getComputedStyle(a).backgroundColor);
    assert.notEqual(before, after);
    await page.locator('main a[href="/team"]').click(); await page.waitForSelector('main h1');
    await page.locator('main a[href="/account"]').click(); await page.waitForSelector('[data-account-settings="linked"]');
    await page.goBack(); await page.locator('main a[href="/account"]').waitFor();
    await page.goForward(); await page.waitForSelector('[data-account-settings="linked"]');
    evidence.interactions.push({ theme, keyboard: focused, hoverChanged: true, accountTeamSettingsAndHistory: true });
    await context.close();
  }
  // Local synthetic responses only: preserve pending/error states and security payload.
  for (const kind of signupOnly ? ["signup-done"] : ["claim", "password", "signup-done"]) {
    const { context, page } = await openCase({ route: kind === "claim" ? "/account?state=unlinked" : kind === "password" ? "/account/password" : "/fixture/form?mode=signup", state: "linked", width: 390, theme: "light" });
    const posts = [];
    await page.route(`${base}/api/**`, async route => { const body = route.request().postDataJSON(); posts.push({ path: new URL(route.request().url()).pathname, fields: Object.keys(body), revokeOtherSessions: body.revokeOtherSessions }); await new Promise(r => setTimeout(r, 250)); return route.fulfill({ status: kind === "signup-done" ? 200 : 503, contentType: "application/json", body: "{}" }); });
    if (kind === "claim") await page.getByLabel("Team code", { exact: true }).fill("111111");
    else if (kind === "password") { await page.getByLabel("Current password", { exact: true }).fill("synthetic-password"); await page.getByLabel("New password", { exact: true }).fill("synthetic-new-password"); }
    else { await page.locator('main input[name="username"]').fill("fixture_manager"); await page.getByLabel("Email", { exact: true }).fill("fixture@example.test"); await page.getByLabel("Password", { exact: true }).fill("synthetic-password"); }
    await page.locator('main form button[type="submit"]').click();
    await page.locator('main form[aria-busy="true"]').waitFor();
    if (kind === "signup-done") { await page.getByRole("status").waitFor(); const doneLink = page.getByRole("status").getByRole("link"); assert.ok((await doneLink.boundingBox()).height >= 44); }
    else { await page.getByRole("alert").waitFor(); assert.equal(await page.locator('main form button[type="submit"]').isDisabled(), false); }
    if (kind === "password") assert.equal(posts[0].revokeOtherSessions, true);
    evidence.interactions.push({ kind, pendingObserved: true, errorOrDoneObserved: true, posts });
    await page.screenshot({ path: `${output}/${kind}-390.png`, fullPage: true });
    await context.close();
  }
  assert.deepEqual(evidence.pageErrors, []); assert.deepEqual(evidence.externalRequests, []); assert.deepEqual(evidence.unexpectedPosts, []);
  assert.equal(evidence.cases.filter(c => c.failures.length).length, 0, JSON.stringify(evidence.cases.filter(c => c.failures.length).map(c => ({ route: c.route, width: c.width, state: c.state, failures: c.failures }))));
} finally {
  await writeFile(`${output}/browser.json`, JSON.stringify(evidence, null, 2)); await browser.close();
}
console.log(`PASS: ${evidence.cases.length} rendered states and ${evidence.interactions.length} interaction flows.`);
