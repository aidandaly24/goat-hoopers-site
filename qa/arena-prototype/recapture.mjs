import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { capturePage } from "./capture-page.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
const origin = process.env.ARENA_ORIGIN ?? "http://127.0.0.1:4196";
const output = process.env.ARENA_EVIDENCE ?? "/tmp/goat-arena-corrected";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const results = [];
try {
  for (const state of [
    { name: "public-desktop-full", width: 1440, height: 1000, member: false, theme: "light" },
    { name: "member-dark-full", width: 1440, height: 1000, member: true, theme: "dark" },
    { name: "public-390-full", width: 390, height: 844, member: false, theme: "dark" },
    { name: "member-390-full", width: 390, height: 844, member: true, theme: "dark" },
  ].filter(state => !process.env.CAPTURE_VIEW || state.name === process.env.CAPTURE_VIEW)) {
    const context = await browser.newContext({ viewport: { width: state.width, height: state.height }, deviceScaleFactor: 1 });
    const errors = [], external = [];
    await context.addInitScript(theme => localStorage.setItem("goat-hoopers.theme", theme), state.theme);
    const tab = await context.newPage(); tab.on("pageerror", error => errors.push(error.message));
    await tab.route("**/*", route => { if (new URL(route.request().url()).origin === origin) return route.continue(); external.push(route.request().url()); return route.abort(); });
    await tab.goto(`${origin}/?view=${state.member ? "member" : "public"}`, { waitUntil: "networkidle" });
    await tab.waitForFunction(() => document.querySelector("[data-arena-ready=true]"));
    await tab.waitForFunction(() => window.goatArenaMetrics?.props === 3);
    const capture = await capturePage(tab, `${output}/${state.name}.jpg`, { checkpoints: true });
    const ocr = execFileSync("tesseract", [`${output}/${state.name}.jpg`, "stdout", "--psm", "6"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    await writeFile(`${output}/${state.name}.ocr.txt`, ocr);
    const searchable = ocr.toLowerCase().replace(/\s+/g, " ");
    const terms = ["Players to watch", "Player spotlights", "A league of our own", "Faces of the league", "Around the league", "Know who", "Standings, leaders", "Every week", "Copyright"];
    let previous = -1;
    const pixelOrder = terms.map(term => {
      const position = searchable.indexOf(term.toLowerCase(), previous + 1);
      assert(position > previous, `${state.name}: actual JPEG OCR lacks ordered section '${term}'`);
      previous = position; return { text: term, ocrOffset: position };
    });
    assert.match(ocr, /Built for the league/i, `${state.name}: footer absent in actual JPEG pixels`);
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    results.push({ state, ...capture, pixelOrder, footerPixelTextVerified: true, errors, external });
    console.log("PASS", state.name, `${capture.width}x${capture.height}`, `${capture.bytes} bytes`, `${capture.tiles.length} tiles`, "top/middle/bottom pixel comparisons; ordered OCR + footer");
    await context.close();
  }
  const suffix = process.env.CAPTURE_VIEW ? `-${process.env.CAPTURE_VIEW}` : "";
  await writeFile(`${output}/capture-evidence${suffix}.json`, JSON.stringify({ revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), results }, null, 2) + "\n");
} finally { await browser.close(); }
