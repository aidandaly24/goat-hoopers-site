import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs";

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const results = [];
try {
  for (const theme of ["light", "dark"]) for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    await context.addInitScript(value => localStorage.setItem("goat-hoopers.theme", value), theme);
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4197/?view=member"); await page.waitForSelector("[data-matchup-spread]");
    await page.evaluate(() => document.fonts.ready);
    const pairs = await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const rgba = color => {
        ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].map((value, i) => i === 3 ? value / 255 : value);
      };
      const over = (fg, bg) => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
      const lum = color => color.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
        .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const measured = [];
      for (const element of document.querySelectorAll("[data-matchup-spread] *,[data-roster-value] p,[data-faces-strip] a > span,[data-team-desk] p")) {
        if (![...element.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()) || !element.getClientRects().length) continue;
        const chain = []; for (let node = element; node; node = node.parentElement) chain.push(node);
        let background = [255, 255, 255]; let unmeasuredBackground = false;
        for (const node of chain.reverse()) {
          const style = getComputedStyle(node);
          background = over(rgba(style.backgroundColor), background);
          if (style.backgroundImage !== "none") {
            // The existing TeamAvatar uses a linear gradient whose two stops
            // alias the same selected accent. Account for that opaque fill.
            const stops = style.backgroundImage.match(/rgba?\([^)]*\)/g)?.map(rgba);
            if (style.backgroundImage.startsWith("linear-gradient(") && stops?.length >= 2 && stops.every(stop => JSON.stringify(stop) === JSON.stringify(stops[0]))) {
              background = over(stops[0], background);
            } else unmeasuredBackground = true;
          }
        }
        const style = getComputedStyle(element), foreground = over(rgba(style.color), background);
        const ratio = (Math.max(lum(foreground), lum(background)) + .05) / (Math.min(lum(foreground), lum(background)) + .05);
        const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseFloat(style.fontWeight) >= 700);
        measured.push({ text: element.textContent.trim(), ink: style.color, background,
          ratio: Math.round(ratio * 100) / 100, required: large ? 3 : 4.5, unmeasuredBackground });
      }
      return measured;
    });
    const measured = pairs.filter(pair => !pair.unmeasuredBackground);
    const failures = measured.filter(pair => pair.ratio < pair.required);
    assert.deepEqual(failures, [], `${theme}/${width}: low-contrast text`);
    results.push({ theme, width, minimum: Math.min(...measured.map(pair => pair.ratio)), measured: measured.length, failures, pairs });
    await context.close();
  }
  await writeFile(process.env.GOAT_CONTRAST_OUTPUT ?? "qa/homepage-redesign/review/contrast.json", JSON.stringify({
    sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    method: "Computed rendered text ink over alpha-composited ancestor backgrounds; identical-stop avatar gradient resolved to its actual fill; changed visual/value/face/desk direct-text regions; image content/decoration not assessed", results,
  }, null, 2) + "\n");
  console.log(results.map(({ theme, width, minimum, measured }) => ({ theme, width, minimum, measured })));
} finally { await browser.close(); }
