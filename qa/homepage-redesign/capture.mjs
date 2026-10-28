import assert from "node:assert/strict";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs";
import { capturePage } from "./capture-page.mjs";

const folder = "qa/homepage-redesign/review";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const manifest = { sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  source: "Current main CourtsideHome production component + isolated QA presentation; all current metrics synthetic", captures: [] };
try {
  await mkdir(folder, { recursive: true });
  for (const view of ["public", "member"]) for (const [label, viewport] of [["desktop", { width: 1440, height: 1000 }], ["phone390", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.addInitScript(() => localStorage.setItem("goat-hoopers.theme", "light"));
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4197/?view=${view}`); await page.waitForSelector("[data-matchup-spread]");
    const output = `${folder}/${view}-${label}.jpg`;
    const evidence = await capturePage(page, output, { checkpoints: true });
    manifest.captures.push({ file: output, view, label, ...evidence });
    // Preserve the lossless full-height original. Normal viewport JPEGs are
    // the delivery counterparts; checkpoint PNGs remain reproducible locally.
    for (const part of ["top", "middle", "bottom"]) await unlink(`${folder}/${view}-${label}-${part}.png`);
    for (const [name, selector] of [["matchup", "[data-matchup-spread]"], ["roster", view === "member" ? "[data-roster-value]" : "[data-bar-set]"], ["picks", "[data-ai-decides]"], ["directory", "#teams"], ["standings", "[data-league-section]"]]) {
      await page.locator(selector).scrollIntoViewIfNeeded(); await page.waitForTimeout(100);
      const file = `${folder}/${view}-${label}-${name}.jpg`;
      await page.screenshot({ path: file, type: "jpeg", quality: 90, animations: "disabled", caret: "hide" });
      manifest.captures.push({ file, view, label, crop: name, viewport, documentY: await page.evaluate(() => scrollY), method: "native unretouched viewport" });
    }
    if (view === "member") {
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
      await page.locator("[data-matchup-spread]").scrollIntoViewIfNeeded(); await page.waitForTimeout(100);
      const file = `${folder}/member-${label}-dark.jpg`;
      await page.screenshot({ path: file, type: "jpeg", quality: 90, animations: "disabled", caret: "hide" });
      manifest.captures.push({ file, theme: "dark", view, label, viewport, method: "native unretouched viewport" });
    }
    await context.close();
  }
  assert.equal(manifest.captures.length, 26);
  await writeFile(`${folder}/capture-manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Captured four complete pages with verified section order/footer and 22 targeted native viewports.`);
} finally { await browser.close(); }
