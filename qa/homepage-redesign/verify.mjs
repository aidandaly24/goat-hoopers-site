import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "/opt/codex/cua_node/lib/node_modules/playwright/index.mjs";

const origin = "http://127.0.0.1:4197";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const results = [], errors = [], remote = [];
const inventory = page => page.locator("[data-courtside-home]").evaluate(element => {
  const root = element.cloneNode(true);
  if (root.querySelector("[data-qa-feature]")) root.querySelector("[data-qa-feature]").remove();
  else if (root.querySelector("#game-title") && root.querySelector("#clubhouse-court")) {
    // The opening is intentionally recomposed. Compare the unchanged lower
    // page independently, then assert retained opening facts/links below.
    const grid = root.querySelector("#clubhouse-court").parentElement.parentElement;
    root.querySelector("#game-title").parentElement.remove(); grid.remove();
  }
  return {
    text: root.textContent,
    links: [...root.querySelectorAll("a")].map(e => [e.textContent, e.getAttribute("href"), e.getAttribute("aria-label")]),
    controls: [...root.querySelectorAll("input,select,button,summary")].map(e => [e.tagName, e.getAttribute("type"), e.getAttribute("aria-label"), e.textContent]),
    ids: [...root.querySelectorAll("[id],[data-testid]")].map(e => [e.id, e.getAttribute("data-testid")]),
    headings: [...root.querySelectorAll("h1,h2,h3")].map(e => e.textContent),
  };
});
const settle = async page => { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(100); };
try {
  for (const view of ["public", "member"]) {
    for (const missing of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
      await context.addInitScript(() => localStorage.setItem("goat-hoopers.theme", "light"));
      const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
      page.on("request", req => { if (!req.url().startsWith(origin) && /^https?:/.test(req.url())) remote.push(req.url()); });
      const url = `${origin}/?view=${view}${missing ? "&edition=missing" : ""}`;
      await page.goto(`${url}&style=baseline`); await page.waitForSelector("[data-courtside-home]"); await settle(page);
      const before = await inventory(page);
      const originalHrefs = await page.locator("[data-courtside-home] a").evaluateAll(links => [...new Set(links.map(a => a.getAttribute("href")))]);
      await page.goto(url); await page.waitForSelector("[data-courtside-home]"); await settle(page);
      if (!missing) await page.waitForSelector("[data-matchup-spread]");
      assert.deepEqual(await inventory(page), before, "Unchanged lower-page content/wiring changed");
      const revisedHrefs = await page.locator("[data-courtside-home] a").evaluateAll(links => new Set(links.map(a => a.getAttribute("href"))).values().toArray());
      assert(originalHrefs.every(href => revisedHrefs.includes(href)), "A source destination was dropped");
      assert.equal(await page.locator("[data-team-id]").count(), 10);
      assert.equal(await page.locator("[data-ai-row]").count(), 5);
      assert.equal(await page.locator("[data-faces-strip] li").count(), 10);
      assert.equal(await page.locator("[data-team-id] a[href^='/player/']").evaluateAll(links => new Set(links.map(a => a.getAttribute("href"))).size), 228);
      // Preserve both the real numeric zero and the distinct unknown score.
      if (!missing) {
        assert.match(await page.locator("[data-matchup-spread]").innerText(), /0\.0/);
        assert.match(await page.locator("[data-matchup-spread]").innerText(), /Pending/);
        assert.equal(await page.locator("[data-qa-feature] h1").count(), 1);
        assert.equal(await page.locator("[data-qa-feature] a").filter({ hasText: /^Ware the Hoes At\?$/ }).count(), 1);
        assert.equal(await page.locator("[data-qa-feature] a").filter({ hasText: /^Reaves Dropper$/ }).count(), 1);
        const context = page.locator("[data-edition-story]");
        assert.match(await context.locator("summary").innerText(), /scores pending/);
        assert.match(await context.locator("summary").innerText(), /next edition pending/);
        await context.locator("summary").focus(); await page.keyboard.press("Enter");
        assert.match(await context.innerText(), /Muse has not published/);
        assert.match(await context.innerText(), /editorial calendar is separate/);
        await page.keyboard.press("Enter");
      }
      const search = page.getByRole("searchbox", { name: "Find a team, manager or roster player" });
      await search.fill("Embiid"); assert.equal(await page.locator("[data-team-id]").count(), 1);
      await page.getByRole("button", { name: "Clear", exact: true }).click(); await search.focus();
      assert.equal(await search.evaluate(e => e === document.activeElement), true);
      await page.locator("#teams select").selectOption("team");
      await page.getByRole("button", { name: /Reverse Team order/ }).click();
      await page.getByRole("button", { name: /Team, by Team: sort/ }).click();
      const roster = page.locator("[data-team-id]").first();
      await roster.locator("summary").focus(); await page.keyboard.press("Enter");
      assert.equal(await roster.getAttribute("open"), "");
      assert(await roster.locator("a[href^='/player/']").first().isVisible());
      await page.keyboard.press("Enter"); assert.equal(await roster.getAttribute("open"), null);
      const provenance = page.locator("[data-ai-row] details").first();
      await provenance.locator("summary").click(); assert.match(await provenance.innerText(), /confidence.*separate signal/);
      if (view === "member") {
        const value = page.locator("[data-hero-valuation]"); await value.locator("summary").click();
        assert.equal(await value.locator("li").count(), 24);
        assert.match(await page.locator("[data-trend-unavailable]").innerText(), /no line is drawn/);
      }
      const standings = page.getByRole("table", { name: "League standings" });
      await standings.getByRole("button", { name: /Points for: sort/ }).click();
      assert.equal(await standings.getByRole("row").count(), 11);
      results.push({ view, missing, unchangedLowerPageParity: true, sourceDestinationsRetained: originalHrefs.length, deduplicatedOpening: !missing, originalLinks: before.links.length, originalControls: before.controls.length,
        rosterReferences: 228, directorySearchSortKeyboard: true, fullRoster: true, provenance: true, standingsSort: true });
      await context.close();
    }
  }
  for (const view of ["public", "member"]) for (const theme of ["light", "dark"]) for (const size of ["desktop", "phone", "reflow320", "text200"]) {
    const viewport = size === "desktop" ? { width: 1440, height: 1000 } : { width: size === "reflow320" ? 320 : 390, height: 844 };
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.addInitScript(value => localStorage.setItem("goat-hoopers.theme", value), theme);
    const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${origin}/?view=${view}`); await page.waitForSelector("[data-matchup-spread]"); await settle(page);
    if (size === "text200") await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await settle(page);
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      headings: [...document.querySelectorAll("h1,h2")].filter(e => e.getClientRects().length).map(e => ({ text: e.textContent, y: e.getBoundingClientRect().top + scrollY })),
      clippedFaces: [...document.querySelectorAll("[data-faces-strip] li")].filter(e => { const r=e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).length,
      stage: document.querySelector("[data-matchup-spread]").getBoundingClientRect().toJSON(),
      personalDeskY: document.querySelector("[data-team-desk]")?.getBoundingClientRect().top + scrollY || null,
      rosterHeadingY: document.querySelector("[data-roster-value] h2")?.getBoundingClientRect().top + scrollY || null,
    }));
    assert.equal(layout.scrollWidth, layout.width, `${view}/${theme}/${size}: page overflow`);
    assert.equal(layout.clippedFaces, 0);
    assert(layout.stage.width > 0 && layout.stage.height > 0);
    if (view === "member" && size === "phone") {
      assert(layout.personalDeskY < 750, `Personal desk delayed to ${layout.personalDeskY}`);
      assert(layout.rosterHeadingY < 1200, `Roster delayed to ${layout.rosterHeadingY}`);
    }
    await page.getByRole("button", { name: theme === "light" ? "Switch to dark theme" : "Switch to light theme" }).click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), theme === "light" ? "dark" : "light");
    if (size !== "desktop") {
      const menu = page.getByRole("button", { name: /Menu/, exact: false });
      await menu.click(); assert.equal(await menu.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape"); assert.equal(await menu.getAttribute("aria-expanded"), "false");
      assert.equal(await menu.evaluate(e => e === document.activeElement), true);
      const focus = await menu.evaluate(e => ({ style: getComputedStyle(e).outlineStyle, width: getComputedStyle(e).outlineWidth }));
      assert.notEqual(focus.style, "none");
    }
    results.push({ view, theme, size, ...layout, themeToggle: true, compactMenuEscape: size !== "desktop", noHorizontalOverflow: true, allFacesVisible: true });
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(remote, [], "Offline fixture requested a remote resource");
  const receipt = { sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    method: "Actual Chromium production-component fixture with synthetic props; native QA anchors, not Next App Router", browser: browser.version(),
    text200Method: "html font-size:200%, independently of 320 CSS px reflow", results, errors, remoteRequests: remote,
    limits: "No live/auth/DB, Next routing, hosted preview, physical device or screen-reader pass. No Hallmark installer or automated Hallmark certification." };
  await mkdir("qa/homepage-redesign/review", { recursive: true });
  await writeFile(process.env.GOAT_REVIEW_OUTPUT ?? "qa/homepage-redesign/review/verification.json", JSON.stringify(receipt, null, 2) + "\n");
  console.log(`PASS ${results.length} scenarios: parity, controls, responsive themes, keyboard and offline boundary.`);
} finally { await browser.close(); }
