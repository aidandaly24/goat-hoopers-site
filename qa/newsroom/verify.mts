/**
 * Bounded DB-free verification for the real-news Newsroom (#122).
 * Run from the repo root:
 *
 *   npx tsx --import ./qa/newsroom/hooks.register.mts qa/newsroom/verify.mts
 *
 * Renders the PRODUCTION Newsroom (via react-dom/server) against the
 * synthetic fixture editions in ./fixtures.ts and asserts the acceptance
 * checklist structurally: both outlets, external-link attributes,
 * player-chip return links, section chips + counts, unavailable states
 * for failed identity inputs, empty/cold states, deterministic UTC
 * timestamp titles, hydration stability, and keyboard-safe markup
 * (native buttons/links only).
 *
 * Method limits: no browser is available in this environment, so there
 * are no screenshots, no live keystroke capture, and no true viewport
 * rendering. "Desktop/390/320" is covered by asserting the responsive
 * contract statically: mobile-first base styles plus the documented
 * 64rem two-column enhancement in NewsFeed.module.css (read from disk).
 * Section selection via ?section= and the retired ?story= notice are
 * client-side (useSyncExternalStore); their pure URL contract is
 * unit-tested in src/surfaces/news/__tests__/newsUrls.test.ts and
 * smoke-checked here. Fixtures are wholly synthetic.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { Newsroom } from "@/surfaces/news/Newsroom";
import { fixtureEdition } from "./fixtures.js";
import {
  hasLegacyStoryParams,
  parseSectionParam,
  sectionHref,
  clearLegacyParamsHref,
} from "@/surfaces/news/newsUrls.js";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function render(state: string | null): string {
  return renderToStaticMarkup(createElement(Newsroom, { edition: fixtureEdition(state) }));
}

console.log("== full edition ==");
{
  const html = render(null);
  check("ESPN masthead renders", html.includes("ESPN"));
  check("CBS Sports masthead renders", html.includes("CBS Sports"));
  check(
    "headlines are external links",
    html.includes('target="_blank"') && html.includes('rel="noopener noreferrer"')
  );
  check(
    "external href is the real article URL",
    html.includes('href="https://example.com/synthetic/espn-1"')
  );
  check(
    "player chips link back to /player/[id]",
    html.includes('href="/player/fixture-alpha"')
  );
  check("four section chips render", (html.match(/aria-pressed=/g) ?? []).length === 4);
  check("Latest is pressed by default", html.includes('aria-pressed="true"'));
  check("count line present", /4<\/span>\s*articles/.test(html));
  check(
    "timestamps use deterministic UTC titles",
    (() => {
      const titles = [...html.matchAll(/<time[^>]*title="([^"]*)"/g)].map((m) => m[1]);
      return (
        titles.length > 0 &&
        titles.every((t) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/.test(t))
      );
    })()
  );
  check(
    "no toLocaleString output in markup",
    !html.includes("toLocaleString")
  );
  check(
    "summary text present, no raw tags",
    html.includes("Synthetic summary") && !html.includes("&lt;p&gt;")
  );
}

console.log("== draft-unknown edition ==");
{
  const html = render("draft-unknown");
  check(
    "Rookie Wire chip marked unavailable",
    html.includes('aria-label="Rookie Wire (unavailable)"')
  );
  check(
    "League Players chip still available",
    html.includes('aria-label="League Players"') &&
      !html.includes('aria-label="League Players (unavailable)"')
  );
}

console.log("== rosters-unknown edition ==");
{
  const html = render("rosters-unknown");
  check(
    "League Players chip marked unavailable",
    html.includes('aria-label="League Players (unavailable)"')
  );
  check(
    "Free Agency chip marked unavailable",
    html.includes('aria-label="Free Agency (unavailable)"')
  );
  check(
    "Latest chip available",
    !html.includes('aria-label="Latest (unavailable)"')
  );
}

console.log("== empty (cold-outage) edition ==");
{
  const html = render("empty");
  check("honest quiet copy", html.includes("The newsroom is quiet."));
  check("feeds-down copy", html.includes("outlet feeds may be down"));
}

console.log("== long-headline fixture ==");
{
  const html = render("long");
  check("renders without crashing", html.includes("AnExtraordinarilyLongUnbrokenSyntheticHeadline"));
}

console.log("== hydration stability ==");
{
  const a = render(null);
  const b = render(null);
  check("server render is deterministic", a === b);
  check(
    "relative timestamps render empty pre-effect (no server/client minute-boundary split)",
    !/>\d+m ago</.test(a) && !/>\d+h ago</.test(a)
  );
}

console.log("== keyboard-safe markup ==");
{
  const html = render(null);
  const buttons = [...html.matchAll(/<button\b([^>]*)>/g)].map((m) => m[1]);
  check("interactive controls exist", buttons.length >= 4);
  check(
    "every button has an explicit type",
    buttons.every((attrs) => attrs.includes('type="button"'))
  );
  check(
    "chips expose pressed state",
    buttons.some((attrs) => attrs.includes('aria-pressed="true"'))
  );
  check(
    "no clickable divs (native buttons/links only)",
    !/<div[^>]*onclick/i.test(html)
  );
}

console.log("== responsive contract (static) ==");
{
  const css = readFileSync(
    new URL("../../src/surfaces/news/NewsFeed.module.css", import.meta.url),
    "utf8"
  );
  check(
    "mobile-first base + 64rem two-column enhancement",
    css.includes("@media (min-width: 64rem)") &&
      css.includes("grid-template-columns")
  );
  check("touch-sized chip targets (>=44px)", css.includes("min-height: 2.75rem"));
}

console.log("== URL contract (smoke) ==");
{
  check("section param reads", parseSectionParam("?section=rookies") === "rookies");
  check("bad section falls back", parseSectionParam("?section=nope") === "latest");
  check("legacy story detected", hasLegacyStoryParams("?story=abc&revision=2") === true);
  check(
    "legacy params clear to section feed",
    clearLegacyParamsHref("?section=league&story=abc") === "/news?section=league"
  );
  check("section href builds", sectionHref("free-agency") === "/news?section=free-agency");
}

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("\nall static checks passed");
