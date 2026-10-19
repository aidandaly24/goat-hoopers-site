import { chromium } from "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:4179";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const evidence = { kind: "production AccountForm + actual continuation handler + injected private sources over local HTTP; not live auth or a hosted Next route", cases: [], externalRequests: [], errors: [] };
try {
  for (const scenario of [
    { name: "new session default", width: 320, email: "member@example.test", next: "", destination: "/" },
    { name: "new session default", width: 1280, email: "member@example.test", next: "", destination: "/" },
    { name: "intentional team return", width: 390, email: "member@example.test", next: "/team", destination: "/team" },
    { name: "intentional password return", width: 1280, email: "member@example.test", next: "/account/password", destination: "/account/password" },
    { name: "unsafe return rejected", width: 390, email: "member@example.test", next: "https://attacker.example", destination: "/" },
    { name: "claim required then protected return", width: 390, email: "unclaimed@example.test", next: "/team", destination: "/account?next=%2Fteam" },
  ]) {
    const context = await browser.newContext({ viewport: { width: scenario.width, height: 900 } });
    context.setDefaultTimeout(10000);
    context.setDefaultNavigationTimeout(10000);
    const page = await context.newPage(); const documents = [], posts = [];
    page.on("pageerror", error => evidence.errors.push(String(error)));
    await page.route("**/*", route => {
      const request = route.request();
      if (!request.url().startsWith(base)) { evidence.externalRequests.push(request.url()); return route.abort(); }
      if (request.resourceType() === "document") documents.push(new URL(request.url()).pathname);
      if (request.method() === "POST") { const body = request.postDataJSON(); posts.push({ path: new URL(request.url()).pathname, fields: Object.keys(body), rememberMe: body.rememberMe }); }
      return route.continue();
    });
    await page.goto(`${base}/fixture/start`);
    await page.goto(`${base}/login${scenario.next ? `?next=${encodeURIComponent(scenario.next)}` : ""}`);
    await page.getByLabel("Email", { exact: true }).fill(scenario.email);
    await page.getByLabel("Password", { exact: true }).fill("fixture-password-only");
    // Duplicate events while the first response is pending cannot submit twice.
    await page.locator("form").evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
    await page.waitForURL(base + scenario.destination);
    assert.equal(posts.length, 1); assert.equal(posts[0].rememberMe, true);
    assert.equal(documents.includes("/account/continue"), true);
    if (scenario.email.startsWith("unclaimed")) {
      await page.getByLabel("Team code", { exact: true }).fill("111111");
      await page.getByRole("button", { name: "Claim team", exact: true }).click();
      await page.waitForURL(base + "/team");
      assert.equal(posts.at(-1).path, "/api/accounts/claim");
    } else {
      assert.equal(documents.includes("/account"), false);
      assert.equal(await page.locator("main").getAttribute("data-viewer"), "member");
      assert.equal(await page.locator("main").getAttribute("data-team"), "3");
      await page.goBack(); assert.equal(new URL(page.url()).pathname, "/fixture/start");
      await page.goForward(); await page.waitForURL(base + scenario.destination);
      await page.goto(`${base}/login${scenario.next ? `?next=${encodeURIComponent(scenario.next)}` : ""}`);
      await page.waitForURL(base + scenario.destination);
      assert.equal(posts.length, 1);
    }
    evidence.cases.push({ ...scenario, documents, posts, passed: true });
    await context.close();
  }
  const retryContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  retryContext.setDefaultTimeout(10000);
  retryContext.setDefaultNavigationTimeout(10000);
  const retryPage = await retryContext.newPage();
  let retryPosts = 0;
  retryPage.on("pageerror", error => evidence.errors.push(String(error)));
  await retryPage.route("**/*", route => {
    const request = route.request();
    if (!request.url().startsWith(base)) { evidence.externalRequests.push(request.url()); return route.abort(); }
    if (request.method() === "POST") retryPosts++;
    return route.continue();
  });
  await retryPage.goto(base + "/login");
  await retryPage.getByLabel("Email", { exact: true }).fill("failed@example.test");
  await retryPage.getByLabel("Password", { exact: true }).fill("fixture-password-only");
  await retryPage.getByRole("button", { name: "Log in", exact: true }).click();
  await retryPage.getByRole("alert").waitFor();
  assert.equal(retryPosts, 1);
  assert.equal(new URL(retryPage.url()).pathname, "/login");
  assert.equal(await retryPage.getByLabel("Email", { exact: true }).inputValue(), "failed@example.test");
  await retryPage.getByLabel("Email", { exact: true }).fill("member@example.test");
  await retryPage.getByLabel("Password", { exact: true }).press("Enter");
  await retryPage.waitForURL(base + "/");
  assert.equal(retryPosts, 2);
  evidence.cases.push({ name: "failed login preserves input and allows keyboard retry", width: 390, passed: true });
  await retryContext.close();
  assert.deepEqual(evidence.externalRequests, []); assert.deepEqual(evidence.errors, []);
} finally {
  await mkdir("qa/account-settings/evidence", { recursive: true });
  await writeFile("qa/account-settings/evidence/routing-browser.json", JSON.stringify(evidence, null, 2));
  await browser.close();
}
console.log(`Passed ${evidence.cases.length} local browser routing scenarios.`);
