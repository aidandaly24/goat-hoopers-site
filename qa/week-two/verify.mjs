// Offline production-component fixture: no auth/data loaders, API calls or external requests.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.WEEK_TWO_PLAYWRIGHT ?? "playwright");
const repo = fileURLToPath(new URL("../../", import.meta.url));
const evidence = path.resolve(process.env.WEEK_TWO_EVIDENCE ?? path.join(tmpdir(), "goat-week-two-evidence"));
await mkdir(evidence, { recursive: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const sourcePaths = ["src/domain/arcade/roster-draft.ts", "src/surfaces/arcade/week-two/WeekTwoDraft.tsx", "src/surfaces/arcade/week-two/WeekTwoDraft.module.css", "src/surfaces/arcade/week-two/lineup-poster.ts", "src/ui/week-two-draft-tokens.css", "qa/week-two/main.tsx", "qa/week-two/fixture.ts", "qa/week-two/verify.mjs"];
const hashes = async () => Object.fromEntries(await Promise.all(sourcePaths.map(async file => [file, createHash("sha256").update(await readFile(path.join(repo, file))).digest("hex")])));
const summary = { sourceHashes: await hashes(), revision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  sourceDirty: Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" }).trim()),
  method: "Chromium emulation; real surface/header via offline Vite fixture, not Next routing or production",
  checks: [], pageErrors: [], externalRequests: [], nonGETRequests: [], apiRequests: [] };
const record = (check, detail) => { summary.checks.push({ check, detail }); console.log(check, JSON.stringify(detail)); };
const server = process.env.WEEK_TWO_BASE_URL ? null : await createServer({
  configFile: path.join(repo, "qa/week-two/vite.config.mts"), server: { port: 0, strictPort: false },
});
await server?.listen();
const base = process.env.WEEK_TWO_BASE_URL ?? server.resolvedUrls.local[0];
assert.equal(new URL(base).hostname, "127.0.0.1", "Fixture must stay on numeric loopback");
const browser = await chromium.launch({ executablePath: process.env.WEEK_TWO_CHROME ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
let framesDir, capturing = false, captureTask;
try {
  const context = async (mobile, width = mobile ? 390 : 1440, height = mobile ? 844 : 1000) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1,
      ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
    await ctx.route("**/*", route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== "GET") { summary.nonGETRequests.push(request.url()); return route.abort(); }
      if (url.hostname !== "127.0.0.1") { summary.externalRequests.push(request.url()); return route.abort(); }
      if (url.pathname.startsWith("/api/")) { summary.apiRequests.push(request.url()); return route.abort(); }
      return route.continue();
    });
    const page = await ctx.newPage();
    page.on("pageerror", error => summary.pageErrors.push(error.message));
    await page.goto(new URL("/arcade/week-2-preview", base).href);
    await page.evaluate(() => document.fonts.ready);
    // Fixed demo draw for revision-comparable visual evidence; the app uses Math.random.
    await page.evaluate(() => { Math.random = () => .999; });
    return { ctx, page };
  };
  const phase = (page, expected) => page.locator(`[data-draft-phase="${expected}"]`).waitFor();
  const overflow = async (page, label) => {
    const sizes = await page.evaluate(() => ({ view: innerWidth, document: document.documentElement.scrollWidth }));
    assert.ok(sizes.document <= sizes.view + 1, `${label}: ${JSON.stringify(sizes)}`);
  };
  const shot = async (page, file) => { await delay(550); await page.screenshot({ path: path.join(evidence, file), fullPage: true }); };
  const tap = (page, name, mobile) => mobile ? page.getByRole("button", { name, exact: true }).tap() : page.getByRole("button", { name, exact: true }).click();
  const choose = async (page, mobile, index = 0) => {
    const button = page.getByRole("group", { name: /Choose one/ }).getByRole("button").nth(index);
    mobile ? await button.tap() : await button.click();
  };
  const reveal = async (page, mobile) => {
    await tap(page, "Reveal NBA team", mobile);
    if (!await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      await phase(page, "drawing");
      await tap(page, "Skip animation", mobile);
    }
    await phase(page, "revealed");
    await page.getByRole("group", { name: /Choose one/ }).waitFor();
  };
  const finish = async (page, mobile) => {
    for (let i = 1; i < 5; i++) {
      await tap(page, "Next team", mobile); await reveal(page, mobile);
      if (mobile) await delay(350);
      await choose(page, mobile);
      if (mobile) await delay(300);
      await tap(page, "Lock in pick", mobile);
      if (mobile) await delay(300);
    }
    await phase(page, "complete");
  };

  for (const mobile of [true, false]) {
    const { ctx, page } = await context(mobile);
    const prefix = mobile ? "mobile" : "desktop";
    if (mobile) {
      framesDir = await mkdtemp(path.join(tmpdir(), "goat-week-two-recording-"));
      const frames = []; capturing = true;
      captureTask = (async () => {
        while (capturing) {
          const file = path.join(framesDir, `frame-${String(frames.length).padStart(5, "0")}.png`);
          const at = Date.now();
          await page.screenshot({ path: file, scale: "css" });
          frames.push({ file, at }); await delay(70);
        }
        return frames;
      })();
    }
    await overflow(page, `${prefix} teaser`); await shot(page, `${prefix}-teaser.png`);
    if (mobile) await delay(1000);
    await tap(page, "Enter the demo", mobile); await phase(page, "sealed");
    await shot(page, `${prefix}-sealed.png`);
    if (mobile) await delay(500);
    await tap(page, "Reveal NBA team", mobile); await phase(page, "drawing");
    await page.waitForTimeout(200);
    assert.ok(await page.getByRole("button", { name: "Skip animation" }).isVisible());
    const drawAnnouncements = await page.getByRole("status").last().innerText();
    assert.match(drawAnnouncements, /Drawing your NBA team/);
    await shot(page, `${prefix}-drawing.png`);
    await tap(page, "Skip animation", mobile); await phase(page, "revealed");
    await page.getByRole("group", { name: /Choose one/ }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Lock in pick", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("group", { name: /Choose one/ }).getByRole("button").count(), 19);
    await page.getByRole("searchbox", { name: "Search this roster" }).fill("Final Roster Player");
    assert.equal(await page.getByRole("group", { name: /Choose one/ }).getByRole("button").count(), 1);
    await choose(page, mobile);
    await page.getByRole("searchbox", { name: "Search this roster" }).fill("");
    await choose(page, mobile); await choose(page, mobile, 1);
    assert.equal(await page.locator('button[aria-pressed="true"]').count(), 1);
    await choose(page, mobile);
    await overflow(page, `${prefix} selection`); await shot(page, `${prefix}-pick.png`);
    if (mobile) await delay(500);
    await tap(page, "Lock in pick", mobile); await phase(page, "locked");
    assert.match(await page.getByRole("status").last().innerText(), /1 of 5/);
    await shot(page, `${prefix}-locked.png`);
    if (mobile) await delay(500);
    await finish(page, mobile);
    assert.equal(await page.getByRole("region", { name: "Your completed demo lineup" }).locator("li").count(), 5);
    assert.equal(new Set(await page.locator("li[data-draft-team]").evaluateAll(rows => rows.map(row => row.dataset.draftTeam))).size, 5);
    await overflow(page, `${prefix} result`); await shot(page, `${prefix}-lineup.png`);
    const downloadWait = page.waitForEvent("download");
    await tap(page, "Save lineup poster", mobile);
    const download = await downloadWait;
    const posterPath = path.join(evidence, `${prefix}-lineup-poster.png`);
    await download.saveAs(posterPath);
    const png = await readFile(posterPath);
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1350);
    const requests = await page.evaluate(() => window.draftFixture);
    assert.equal(requests.teamsCalls, 1);
    assert.equal(requests.rosterCalls.length, 5);
    assert.equal(new Set(requests.rosterCalls).size, 5);
    record(`${prefix} roster boundaries`, "30-team directory once, one roster per drawn team, all 19 players including the last row selectable/searchable");
    record(`${prefix} complete flow`, "Sealed → reveal → change selection → lock → five distinct teams → local 1080×1350 PNG download");

    if (mobile) {
      capturing = false; const frames = await captureTask; captureTask = null;
      const concat = frames.map((frame, index) => `file '${frame.file}'\nduration ${((frames[index + 1]?.at ?? frame.at + 150) - frame.at) / 1000}`).join("\n");
      const list = path.join(framesDir, "frames.txt"); await writeFile(list, concat + `\nfile '${frames.at(-1).file}'\n`);
      const video = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list,
        "-vf", "fps=12,scale=390:844", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(evidence, "mobile-draft-interaction.mp4")], { timeout: 60000 });
      assert.equal(video.status, 0, video.stderr?.toString());
      record("Phone recording", { frames: frames.length, seconds: ((frames.at(-1).at - frames[0].at) / 1000).toFixed(1), method: "Actual browser screenshot frames; FFmpeg MP4" });
      await rm(framesDir, { recursive: true }); framesDir = null;
    }
    await tap(page, "Draft another five", mobile); await phase(page, "sealed");
    assert.match(await page.getByRole("region", { name: "Your demo lineup progress" }).innerText(), /0\s*\/\s*5/);
    record(`${prefix} restart`, "Fresh sealed draw, zero retained picks");
    await ctx.close();
  }

  const { ctx, page } = await context(true, 320, 740);
  for (const fontSize of [16, 32]) {
    await page.reload(); await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; Math.random = () => .999; }, fontSize);
    await overflow(page, `320px teaser / ${fontSize}px text`);
    await page.getByRole("button", { name: "Enter the demo" }).focus(); await page.keyboard.press("Enter");
    await phase(page, "sealed"); await overflow(page, `320px sealed / ${fontSize}px text`);
    await page.getByRole("button", { name: "Reveal NBA team" }).focus(); await page.keyboard.press("Space");
    await page.getByRole("button", { name: "Skip animation" }).focus(); await page.keyboard.press("Enter");
    await page.getByRole("group", { name: /Choose one/ }).waitFor();
    await choose(page, false); await overflow(page, `320px pick / ${fontSize}px text`);
    await tap(page, "Lock in pick", false); await phase(page, "locked"); await overflow(page, `320px locked / ${fontSize}px text`);
    await finish(page, false); await overflow(page, `320px lineup / ${fontSize}px text`);
    if (fontSize === 32) await shot(page, "mobile-320-text-200-percent.png");
    record(`320px / ${fontSize / 16 * 100}% text`, "All draft states reflow without document overflow; native Enter/Space controls work");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await tap(page, "Draft another five", false); await reveal(page, false); await choose(page, false);
  assert.equal(await page.locator(".gh-week-two-draft").evaluate(root => root.getAnimations({ subtree: true }).length), 0);
  await tap(page, "Lock in pick", false); await phase(page, "locked");
  assert.equal(await page.locator(".gh-week-two-draft").evaluate(root => root.getAnimations({ subtree: true }).length), 0);
  record("Live reduced motion", "Reveal/selection/lock remain operable; CSS animations and transitions absent");
  await page.evaluate(() => { document.documentElement.style.fontSize = "16px"; document.documentElement.dataset.theme = "dark"; });
  await page.setViewportSize({ width: 390, height: 844 }); await overflow(page, "dark phone"); await shot(page, "mobile-dark-locked.png");
  await ctx.close();

  const failure = await context(true);
  await failure.page.route("**/courtside/portraits/**", route => route.abort());
  await failure.page.reload(); await failure.page.evaluate(() => { Math.random = () => .999; });
  await tap(failure.page, "Enter the demo", false); await reveal(failure.page, false); await choose(failure.page, false);
  await phase(failure.page, "revealed");
  assert.equal(await failure.page.getByRole("button", { name: "Lock in pick" }).isEnabled(), true);
  await shot(failure.page, "mobile-portrait-fallback.png"); await failure.ctx.close();
  record("Missing portrait fallback", "Local typographic initials; selection and lock remain available");
  const motion = await context(false);
  await tap(motion.page, "Enter the demo", false); await phase(motion.page, "sealed");
  await tap(motion.page, "Reveal NBA team", false); await phase(motion.page, "drawing");
  await phase(motion.page, "revealed");
  await choose(motion.page, false); await tap(motion.page, "Lock in pick", false);
  await tap(motion.page, "Next team", false); await tap(motion.page, "Reveal NBA team", false);
  await phase(motion.page, "drawing"); await motion.page.emulateMedia({ reducedMotion: "reduce" });
  await motion.page.locator('[data-draft-phase="revealed"]').waitFor({ timeout: 1000 });
  assert.equal(await motion.page.locator(".gh-week-two-draft").evaluate(root => root.getAnimations({ subtree: true }).length), 0);
  record("Team draw lifecycle", "Normal draw finishes automatically; changing reduced motion during the next draw reveals immediately and leaves no animation");
  await motion.ctx.close();

  const outage = await context(true);
  await outage.page.evaluate(() => { window.draftFixture.failTeams = 1; });
  await tap(outage.page, "Enter the demo", false);
  await outage.page.getByRole("button", { name: "Retry opening draft" }).waitFor();
  await tap(outage.page, "Retry opening draft", false); await phase(outage.page, "sealed");
  await outage.page.evaluate(() => { window.draftFixture.failRoster = 1; });
  await tap(outage.page, "Reveal NBA team", false);
  await tap(outage.page, "Skip animation", false); await phase(outage.page, "revealed");
  await outage.page.getByRole("button", { name: "Retry roster" }).waitFor();
  const beforeRetry = await outage.page.evaluate(() => window.draftFixture.rosterCalls.slice());
  await tap(outage.page, "Retry roster", false);
  await outage.page.getByRole("group", { name: /Choose one/ }).waitFor();
  const afterRetry = await outage.page.evaluate(() => window.draftFixture.rosterCalls.slice());
  assert.equal(afterRetry.length, beforeRetry.length + 1);
  assert.equal(afterRetry.at(-1), beforeRetry.at(-1));
  await shot(outage.page, "mobile-roster-retry.png");
  record("Source outages", "Directory retry starts without a prior draw; roster retry keeps the exact drawn team and never consumes a pick");
  await outage.ctx.close();
    for (const key of ["pageErrors", "externalRequests", "nonGETRequests", "apiRequests"]) assert.deepEqual(summary[key], [], key);
  record("Network boundary", "Zero external browser requests, API calls, non-GET requests or page errors");
} finally {
  capturing = false;
  await captureTask?.catch(() => {});
  if (framesDir) await rm(framesDir, { recursive: true });
  summary.sourceUnchanged = JSON.stringify(summary.sourceHashes) === JSON.stringify(await hashes());
  assert.equal(summary.sourceUnchanged, true, "Component sources changed during verification");
  await writeFile(path.join(evidence, "verification.json"), JSON.stringify(summary, null, 2) + "\n");
  await browser.close(); await server?.close();
}
