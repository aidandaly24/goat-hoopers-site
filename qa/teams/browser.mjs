import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

// Coordinator schedules this runner. No implicit installs, browser or provider fallback.
assert.ok(process.argv[2] && process.argv[3], "Pass installed Playwright entrypoint and Chrome executable.");
const { chromium } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const origin = "http://127.0.0.1:8796";
const evidence = path.resolve("qa/teams/evidence");
await mkdir(evidence, { recursive: true });
execFileSync(process.execPath, ["qa/teams/prepare.mjs"]);
const hash = async file => createHash("sha256").update(await readFile(file)).digest("hex");
const receipt = {
  head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  base: "32794327df2ec8cd3d2b30935c2df51b354f63ca", browser: "", checks: [], screenshots: [],
  sourceHashes: {}, externalRequests: [], nonGETRequests: [], pageErrors: [], consoleErrors: [],
};
for (const file of ["src/surfaces/teams/TeamDirectory.tsx", "src/surfaces/teams/TeamDirectory.module.css", "qa/teams/fixtures.ts"]) {
  receipt.sourceHashes[file] = await hash(file);
}
const record = (check, detail = "pass") => { receipt.checks.push({ check, detail }); console.log(check + ": " + JSON.stringify(detail)); };
const luminance = color => {
  const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (ink, background) => {
  const a = luminance(ink), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--config", "qa/teams/vite.config.mts", "--configLoader", "runner"], {
  env: { PATH: path.dirname(process.execPath) + ":/usr/bin:/bin", NODE_ENV: "development" }, stdio: ["ignore", "pipe", "pipe"],
});
let serverLogs = "";
server.stdout.on("data", chunk => { serverLogs += chunk; });
server.stderr.on("data", chunk => { serverLogs += chunk; });
let browser;
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { await fetch(origin); break; } catch { if (attempt === 39) throw new Error(serverLogs); await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  browser = await chromium.launch({ executablePath: process.argv[3], headless: true, args: ["--disable-webgl"] });
  receipt.browser = browser.version();
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, hasTouch: width !== 1440, reducedMotion: "reduce" });
    await context.route("**/*", route => {
      const request = route.request();
      if (request.method() !== "GET") { receipt.nonGETRequests.push(request.url()); return route.abort(); }
      if (new URL(request.url()).origin !== origin) { receipt.externalRequests.push(request.url()); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", error => receipt.pageErrors.push(error.message));
    page.on("console", message => { if (message.type() === "error") receipt.consoleErrors.push(message.text()); });
    const visit = async (variant, state, enlargement) => {
      await page.goto(`${origin}/teams?variant=${variant}&state=${state}`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Teams", exact: true }).waitFor();
      await page.evaluate(async enlargement => { document.documentElement.style.fontSize = enlargement ? "200%" : "100%"; await document.fonts.ready; }, enlargement);
    };
    const capture = async name => {
      const file = `${width}-${name}.png`;
      await page.screenshot({ path: path.join(evidence, file), fullPage: true });
      receipt.screenshots.push({ file, sha256: await hash(path.join(evidence, file)) });
    };
    const geometry = async label => {
      const result = await page.evaluate(() => {
        const main = document.querySelector("main");
        const links = [...main.querySelectorAll("li > a")];
        const canvas = getComputedStyle(document.body).backgroundColor;
        const rows = links.map(link => {
          const box = link.getBoundingClientRect();
          const cs = getComputedStyle(link);
          const children = [...link.querySelectorAll("span, dt, dd")].map(el => {
            const r = el.getBoundingClientRect(), style = getComputedStyle(el);
            return { text: el.textContent, left: r.left, right: r.right, height: r.height,
              client: el.clientWidth, scroll: el.scrollWidth, overflow: style.overflow, whiteSpace: style.whiteSpace,
              textOverflow: style.textOverflow, font: style.fontFamily, size: parseFloat(style.fontSize), color: style.color,
              decorative: el.closest('[aria-hidden="true"]') !== null };
          });
          return { height: box.height, left: box.left, right: box.right, transform: cs.transform, shadow: cs.boxShadow, children,
            statEdges: [...link.querySelectorAll("dd")].map(el => el.getBoundingClientRect().right),
            nestedControls: link.querySelectorAll("a, button, input, select, textarea, summary, [tabindex]").length };
        });
        return { viewport: innerWidth, scroll: document.documentElement.scrollWidth, canvas, rows,
          visibleRows: links.filter(el => el.getBoundingClientRect().bottom <= innerHeight).length };
      });
      assert.ok(result.scroll <= width + 1, JSON.stringify(result));
      assert.equal(result.rows.length, 10);
      for (const row of result.rows) {
        assert.ok(row.height >= 44 && row.left >= 0 && row.right <= width + 1);
        assert.equal(row.nestedControls, 0);
        assert.equal(row.transform, "none"); assert.equal(row.shadow, "none");
        for (const child of row.children) {
          assert.ok(child.left >= row.left - 1 && child.right <= row.right + 1, JSON.stringify(child));
          assert.ok(child.scroll <= child.client + 1, JSON.stringify(child));
          assert.notEqual(child.textOverflow, "ellipsis");
          assert.notEqual(child.whiteSpace, "nowrap");
          if (child.text) {
            assert.ok(child.height > 0);
            if (!child.decorative) assert.ok(contrast(child.color, result.canvas) >= 4.5, JSON.stringify(child));
          }
        }
        for (const [index, edge] of row.statEdges.entries()) assert.ok(Math.abs(edge - result.rows[0].statEdges[index]) <= 1);
      }
      record(`${width} ${label} geometry/content/alignment`, result);
    };
    for (const enlarged of [false, true]) {
      const label = enlarged ? "200-text" : "100-text";
      // Exact same fixture array in before/after; no invented visual-only substitutes.
      await visit("before", "populated", enlarged);
      const before = await page.locator("main li > a").evaluateAll(links => links.map(el => ({
        href: el.getAttribute("href"), name: el.getAttribute("aria-label"), manager: el.children[1].children[1].textContent,
        values: [...el.querySelectorAll("dd")].map(dd => dd.textContent),
      })));
      await capture(`before-${label}`);
      await visit("after", "populated", enlarged);
      const after = await page.locator("main li > a").evaluateAll(links => links.map(el => ({
        href: el.getAttribute("href"), name: el.getAttribute("aria-label"), manager: el.children[1].children[1].textContent,
        values: [...el.querySelectorAll("dd")].map(dd => dd.textContent),
      })));
      assert.deepEqual(after, before);
      record(`${width} ${label} before/after href/name/value parity`, after);
      await geometry(label); await capture(`after-${label}`);
      const first = page.locator("main li > a").first();
      await page.keyboard.press("Tab");
      assert.equal(await first.evaluate(el => el === document.activeElement), true);
      const focus = await first.evaluate(el => {
        const s = getComputedStyle(el);
        return { visible: el.matches(":focus-visible"), outline: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor,
          background: s.backgroundColor, canvas: getComputedStyle(document.body).backgroundColor,
          textColors: [...el.querySelectorAll("dt, dd")].map(child => getComputedStyle(child).color) };
      });
      assert.equal(focus.visible, true); assert.equal(focus.outline, "solid"); assert.equal(focus.width, "2px");
      assert.ok(contrast(focus.color, focus.background) >= 3);
      assert.ok(contrast(focus.color, focus.canvas) >= 3);
      for (const ink of focus.textColors) assert.ok(contrast(ink, focus.background) >= 4.5);
      record(`${width} ${label} rendered focus pair/contrast`, { ...focus, ratio: contrast(focus.color, focus.background) });
      await capture(`focus-${label}`);
      for (let index = 1; index < 10; index++) {
        await page.keyboard.press("Tab");
        assert.equal(await page.locator("main li > a").nth(index).evaluate(el => el === document.activeElement), true);
      }
      await first.focus(); await page.keyboard.press("Enter");
      await page.waitForURL(origin + "/teams/1");
      await page.getByRole("heading", { name: "Fixture profile 1" }).waitFor();
      await page.goBack(); await page.getByRole("heading", { name: "Teams", exact: true }).waitFor();
      record(`${width} ${label} keyboard order/focus/Enter/profile/Back (native anchor fixture)`, focus);
    }
    await visit("after", "long", true);
    await geometry("unbroken names and managers at 200% text"); await capture("long-200-text");
    await visit("after", "empty", true);
    assert.equal(await page.locator("main a").count(), 0);
    assert.match(await page.locator("main").innerText(), /Couldn't load the teams right now\. Try again in a bit\./);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    record(`${width} empty state at 200% text`); await capture("empty-200-text");
    if (width !== 1440) {
      await visit("after", "populated", false);
      await page.locator("main li > a").nth(4).tap();
      await page.waitForURL(origin + "/teams/5");
      record(`${width} touch profile navigation (Chromium emulation)`);
    }
    await context.close();
  }
  assert.deepEqual(receipt.externalRequests, []); assert.deepEqual(receipt.nonGETRequests, []);
  assert.deepEqual(receipt.pageErrors, []); assert.deepEqual(receipt.consoleErrors, []);
  record("no external/data requests, writes, page errors or console errors");
} finally {
  await writeFile(path.join(evidence, "receipt.json"), JSON.stringify(receipt, null, 2));
  await browser?.close();
  server.kill("SIGTERM");
}
