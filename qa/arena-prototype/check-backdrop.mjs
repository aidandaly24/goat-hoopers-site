import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
const origin = process.env.ARENA_ORIGIN ?? "http://127.0.0.1:4196";
const out = process.env.BACKDROP_EVIDENCE ?? "/tmp/goat-arena-backdrop";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const results = [];
try {
  for (const state of [
    { name: "public-desktop", width: 1440, height: 1000, member: false, theme: "light" },
    { name: "member-desktop", width: 1440, height: 1000, member: true, theme: "dark" },
    { name: "public-mobile", width: 390, height: 844, member: false, theme: "dark" },
    { name: "member-mobile", width: 390, height: 844, member: true, theme: "dark" },
    { name: "public-mobile-light", width: 390, height: 844, member: false, theme: "light" },
    { name: "member-mobile-light", width: 390, height: 844, member: true, theme: "light" },
  ]) {
    const context = await browser.newContext({ viewport: { width: state.width, height: state.height }, deviceScaleFactor: 1 });
    await context.addInitScript(theme => localStorage.setItem("goat-hoopers.theme", theme), state.theme);
    const tab = await context.newPage();
    await tab.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await tab.goto(`${origin}/?view=${state.member ? "member" : "public"}`, { waitUntil: "networkidle" });
    await tab.waitForFunction(() => window.goatArenaMetrics?.props === 3);
    await tab.evaluate(async () => { await document.fonts.ready; for (const image of document.images) image.loading = "eager"; await Promise.allSettled([...document.images].map(image => image.decode())); });
    const structure = await tab.evaluate(() => {
      const styles = element => { const s = getComputedStyle(element); return { color: s.backgroundColor, image: s.backgroundImage, repeat: s.backgroundRepeat }; };
      const context = document.createElement("canvas").getContext("2d");
      const rgba = color => { context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data]; };
      const root = getComputedStyle(document.querySelector("#root")), home = getComputedStyle(document.querySelector("[data-courtside-home]"));
      const ground = rgba(getComputedStyle(document.body).backgroundColor), veil = rgba(getComputedStyle(document.querySelector(".arena-haze")).backgroundColor);
      const opacity = +getComputedStyle(document.querySelector(".arena-world")).opacity, alpha = veil[3] / 255;
      const backgrounds = [0, 255].map(canvas => ground.slice(0, 3).map((channel, index) => (channel * (1 - opacity) + canvas * opacity) * (1 - alpha) + veil[index] * alpha));
      const luminance = rgb => rgb.map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      const contrast = (color, background) => { const a = luminance(color), b = luminance(background); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
      const textColors = Object.fromEntries(["--gh-text", "--gh-text-dim", "--gh-win", "--gh-loss", "--gh-control"].map(name => [name, rgba(root.getPropertyValue(name)).slice(0, 3)]));
      textColors["reading-accent"] = rgba(home.getPropertyValue("--gh-cs-tan")).slice(0, 3);
      const contrastBounds = Object.fromEntries(Object.entries(textColors).map(([name, color]) => [name, Math.min(...backgrounds.map(background => contrast(color, background)))]));
      const worlds = document.querySelectorAll(".arena-world");
      const boxes = [...document.querySelectorAll("[data-courtside-home] > section, [data-courtside-home] > div, [data-courtside-home] > section > div")].map(element => ({ tag: element.tagName, ...styles(element) }));
      return { body: styles(document.body), main: styles(document.querySelector("main")), footer: styles(document.querySelector("footer")),
        worldCount: worlds.length, canvasCount: document.querySelectorAll(".arena-world canvas").length,
        worldPosition: getComputedStyle(worlds[0]).position, worldOpacity: getComputedStyle(worlds[0]).opacity,
        veil: getComputedStyle(document.querySelector(".arena-haze")).backgroundColor, boxes,
        faceCount: document.querySelectorAll("[class*=face-card]").length,
        faceClipping: [...document.querySelectorAll("[class*=face-card]")].some(element => element.scrollWidth > element.clientWidth),
        duoColumns: getComputedStyle(document.querySelector("[class*=value-face-list]") ?? document.body).gridTemplateColumns,
        overflow: document.documentElement.scrollWidth > innerWidth,
        contrastBounds, backgroundRgbBounds: backgrounds, metrics: window.goatArenaMetrics };
    });
    assert.equal(structure.worldCount, 1); assert.equal(structure.canvasCount, 1); assert.equal(structure.worldPosition, "fixed");
    assert.equal(structure.main.image, "none"); assert.equal(structure.footer.image, "none");
    assert(structure.boxes.every(box => box.color === "rgba(0, 0, 0, 0)" && box.image === "none"), "A section resets the shared backdrop");
    assert.equal(structure.faceCount, 10); assert.equal(structure.faceClipping, false); assert.equal(structure.overflow, false);
    for (const [name, ratio] of Object.entries(structure.contrastBounds)) assert(ratio >= (name === "--gh-control" ? 3 : 4.5), `${name} contrast bound ${ratio} is too low`);
    if (state.width < 600 && !state.member) assert(!structure.duoColumns.includes(" "), "Phone matchup pair is not stacked");
    const offsets = await tab.evaluate(member => {
      const y = element => Math.max(0, Math.round(element.getBoundingClientRect().top + scrollY));
      return { top: 0, portraits: y(document.querySelector(member ? "[data-roster-portraits]" : "[data-bar-set]")),
        readingTransition: Math.max(0, y(document.querySelector("[data-scouting-notebook]")) - 220),
        faces: y([...document.querySelectorAll("h2")].find(element => element.textContent === "Faces of the league")),
        directoryTransition: Math.max(0, y(document.querySelector("#teams")) - 220),
        bottom: document.documentElement.scrollHeight - innerHeight };
    }, state.member);
    const crops = [];
    for (const [name, offset] of Object.entries(offsets)) {
      await tab.evaluate(y => scrollTo({ top: y, behavior: "instant" }), offset);
      await tab.waitForTimeout(100);
      const image = await tab.screenshot({ animations: "disabled", caret: "hide", scale: "css" });
      const pixels = await sharp(image).extract({ left: 5, top: Math.floor(state.height / 2), width: 3, height: 3 }).removeAlpha().raw().toBuffer();
      const rgb = [0, 1, 2].map(channel => Math.round([...pixels].filter((_, index) => index % 3 === channel).reduce((a, b) => a + b, 0) / 9));
      assert(Math.max(...rgb) - Math.min(...rgb) < 55, "Exposed backdrop left the grey/slate range");
      assert(rgb.every(value => value > 28 && value < 245), "Exposed backdrop became a blank black/white region");
      await sharp(image).jpeg({ quality: 88, progressive: true, chromaSubsampling: "4:4:4" }).toFile(`${out}/${state.name}-${name}.jpg`);
      crops.push({ name, requestedY: offset, scrollY: await tab.evaluate(() => scrollY), exposedBackdropRgb: rgb });
    }
    results.push({ state, structure, crops });
    console.log("PASS", state.name, "single shared layer; transparent sections; six real viewport crops; no clipped faces");
    await context.close();
  }
  await writeFile(`${out}/backdrop-evidence.json`, JSON.stringify({ revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), results }, null, 2) + "\n");
} finally { await browser.close(); }
