import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const output = process.env.CONTROLS_EVIDENCE ?? "/tmp/goat-controls-review";
mkdirSync(output, { recursive: true });
const base = "http://127.0.0.1:4199";
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const report = { commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  method: "Actual components in isolated Vite fixture; frozen/synthetic data, no account or live data. Chromium emulation.", checks: [], errors: [], writes: [], externalRequests: [] };
const changed = execFileSync("git", ["diff", "--name-only", "origin/main"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
report.sourceHashes = Object.fromEntries(changed.map(file => [file, createHash("sha256").update(readFileSync(file)).digest("hex")]));
const browser = await chromium.launch({ executablePath: process.env.CONTROLS_CHROME ?? "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
try {
  for (const settings of [
    { name: "desktop-light", viewport: { width: 1440, height: 1000 }, theme: "light" },
    { name: "phone-light", viewport: { width: 390, height: 844 }, theme: "light" },
    { name: "phone-dark", viewport: { width: 390, height: 844 }, theme: "dark" },
  ]) {
    const phone = settings.name.startsWith("phone");
    const context = await browser.newContext({ viewport: settings.viewport, reducedMotion: "reduce", isMobile: phone, hasTouch: phone });
    await context.route("**/*", route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== "GET") { report.writes.push(url.pathname); return route.abort(); }
      if (url.hostname !== "127.0.0.1") { report.externalRequests.push(url.hostname); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", error => report.errors.push(error.message));
    for (const [name, path] of [["arcade", "/arcade"], ["draft", "/arcade/week-2-preview"], ["home", "/"], ["history", "/history"], ["news", "/news"], ["stocks", "/stocks"], ["signup", "/signup"]]) {
      await page.goto(`${base}${path}`);
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, settings.theme);
      await page.getByRole("heading").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${name} overflow at ${settings.name}`);
      const forbidden = await page.locator("a,button").evaluateAll(nodes => nodes.map(node => node.textContent).filter(text => /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u2190-\u21ff\uFE0F]/u.test(text)));
      assert(forbidden.length === 0, `${name} authored marker remains: ${forbidden}`);
      await page.screenshot({ path: `${output}/${name}-${settings.name}.png`, fullPage: true });
      report.checks.push({ page: name, viewport: settings.viewport, theme: settings.theme, overflow: false, authoredMarkers: 0 });
      if (name === "arcade") {
        const play = page.getByRole("link", { name: "Play Free Throw Shootout", exact: true });
        const preview = page.getByRole("link", { name: "Preview 82–0", exact: true });
        for (const control of [play, preview, ...await page.getByRole("navigation", { name: "Jump into a game" }).getByRole("link").all()]) {
          const box = await control.boundingBox(); assert(box.height >= 44, "Small launch/navigation target");
        }
        if (!phone) {
          const normal = await preview.evaluate(node => getComputedStyle(node).backgroundColor);
          await preview.hover();
          const hover = await preview.evaluate(node => getComputedStyle(node).backgroundColor);
          assert(hover !== normal, "Primary hover state did not change");
          const box = await preview.boundingBox();
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          assert(await preview.evaluate(node => getComputedStyle(node).boxShadow) !== "none", "Missing pressed feedback");
          await page.mouse.move(0, 0); await page.mouse.up();
        }
        await preview.focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        assert(await preview.evaluate(node => document.activeElement === node), "Keyboard navigation missed launch control");
        const focus = await preview.evaluate(node => ({ outline: getComputedStyle(node).outlineStyle, width: getComputedStyle(node).outlineWidth }));
        assert(focus.outline !== "none" && parseFloat(focus.width) >= 2, "Missing visible keyboard focus");
        await page.screenshot({ path: `${output}/arcade-focus-${settings.name}.png` });
        await page.keyboard.press("Enter"); await page.waitForURL("**/arcade/week-2-preview");
        await page.getByRole("button", { name: "Enter the demo", exact: true }).waitFor();
        await page.goBack(); await page.waitForURL("**/arcade");
        await page.getByText("How to play", { exact: true }).first().click();
        await page.getByText("Keyboard: A/D or arrows to aim.", { exact: false }).waitFor();
      }
      if (name === "home") {
        const notes = page.getByRole("button", { name: /Featured matchup notes/ });
        if (await notes.count()) {
          await notes.click(); const close = page.getByRole("button", { name: "Close matchup notes", exact: true });
          await close.waitFor(); assert(await close.locator("svg").count() === 1, "Close icon missing");
          await close.click(); assert(await notes.evaluate(node => document.activeElement === node), "Dialog focus did not restore");
        }
        const sort = page.getByRole("button", { name: /Team, by Team:/ });
        if (await sort.count()) { await sort.click(); assert(await sort.getAttribute("aria-pressed") === "true", "Sort stopped working"); assert(await sort.locator("svg").count() === 1, "Sort icon missing"); }
      }
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 320, height: 740 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await context.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" && route.request().method() === "GET" ? route.continue() : route.abort());
  for (const path of ["/arcade", "/arcade/week-2-preview", "/signup"]) {
    await page.goto(`${base}${path}`); await page.getByRole("heading").first().waitFor();
    await page.addStyleTag({ content: "html{font-size:200%}" });
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `320px / 200% overflow ${path}`);
    report.checks.push({ path, viewport: { width: 320, height: 740 }, textScale: "200%", overflow: false });
  }
  await context.close();
  assert(report.errors.length === 0, `Page errors: ${report.errors.join("; ")}`);
  assert(report.writes.length === 0, "Unexpected write request");
  report.sourceUnchanged = changed.every(file => createHash("sha256").update(readFileSync(file)).digest("hex") === report.sourceHashes[file]);
  assert(report.sourceUnchanged, "Source changed during review");
  writeFileSync(`${output}/verification.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, pageErrors: report.errors, writeRequests: report.writes, sourceUnchanged: report.sourceUnchanged, report: `${output}/verification.json` }));
} finally { await browser.close(); }
