# 20 — Names make the league

Independent desktop first submission. Only this directory is authored. No peer, pilot or old prototype implementation was inspected.

The league's ten franchise names are the page's structure, with a different scale and placement for each role: a current matchup in two unequal voices; Reaves and Ware as one opposing sentence; an Embiid roster annotation; the historical champion and runner-up in one sentence; four remaining franchises carrying their own records, ownership and contextual paths. This is an open field of readable names, not a uniform directory or a set of club cards. The composition continues to the final franchise.

User question: who makes up this league, and what is there to follow or do? Primary path: open a named team profile from its visible context. Secondary destinations include matchup previews, player profiles, stocks/news, the trade analyzer, draft, league moves, table, archive and arcade. All ten club identities and primary content are visible in normal document flow. No hover-only information, inner reader, filter, tab or hidden primary panel.

## Sources and guidance actually read

- `../AUTHOR-CONTRACT.md`, own `FACTS.json`, repository `AGENTS.md`, `ARCHITECTURE.md` (homepage/data/route/access contracts), `DESIGN.md` decision record and the project `.agents/skills/goat-hoopers-design/SKILL.md`, navigation/accessibility and visual-hierarchy references. Production layout/palette/primitives requirements yield to the explicit experimental author contract. No production file was changed.
- `qa/homepage-structures/reference-notes/craft.md` as the primary link index.
- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), opened directly Oct 30: one client-specific idea across the full page; content determines geometry; type can carry a page when it is the subject. Applied to the actual franchise names, not a general giant-headline scaffold. The prescribed section counts, scripts, catalog, font bans and fixed systems were not adopted.
- [Elaya redesign skill](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md), opened directly Oct 30: diagnose equal-card symmetry; use content-specific asymmetry, explicit focus, useful labels and real destinations. Applied to unboxed, unequal franchise treatments. Its fixed-value substitutions, generic sales funnel and blanket reveal directions were not adopted.
- Managed cloud runtime skill and networking reference; selected environment status and non-secret network policy checked. No external assets, scripts, dependencies, credentials or services were used.
- Existing `src/ui/siteDestinations.ts` and sitemap inspected only to verify real destination paths. They were not used as presentation references.

Assets: approved black GOAT wordmark and approved local portraits of LeBron James, Anthony Davis and Joel Embiid. Existing OFL Oswald, DM Sans and Lora from the supplied local catalog. No downloaded assets. No original illustration was needed: meaningful franchise names supply the visual material.

Current matchup and roster context is explicitly synthetic, as of Nov 12, 2026, future-dated relative to this Oct 30 review. Current points are not finals. Reaves' 0 stays 0; missing opponent points stay Pending; Reaves faces Ware. The 2025 records/final remain historical finals. The Embiid excerpt is clearly editorial opinion with 2025–26 NBA average units and source link; the roster connection is current fixture context, not 2025 ownership. NeuralNets' inherited 1–20 record identifies the previous manager and QBs Gremlins. Oct 5–11 moves are explicitly an unpublished draft, not current Week 3 news. No simulated account state, AI output, market metrics or execution.

Motion decision: none. Routine navigation and native source disclosure are immediate. Reduced-motion mode retains exactly the same page.

Structure mode: `?stage=structure` changes semantic color variables and image grayscale only. Content, assets, dimensions, placements and reading order are identical. Font-ready marker is `document.documentElement.dataset.browserStudyReady = '20'`.

## Verification

Frozen after a bounded Chromium pass using the existing system `/usr/bin/chromium` and installed Playwright. `check-desktop.cjs` and `checks.json` record the direct checks:

- 1440 × 1000: document width 1440, height 2759; no elements outside the viewport horizontally.
- 1120 × 1000: document width 1120, height 2677; no elements outside the viewport horizontally.
- 1120 with every computed HTML font size doubled: document width 1120, height 6848; no elements outside the viewport horizontally. Intrinsic line wrapping expands document height. No styles reduce enlarged font sizes or clip overflow.
- Designed and structure mode: full body text and every header/main element's x/y/width/height identical.
- Native source disclosure focused visibly (3px solid outline), brought into viewport and opened with Enter. Reduced-motion media preference applies without content changes.
- All five images loaded. No page errors or HTTP error responses occurred in the local rendering. One h1 and the ready marker present.
- Own opening, middle and enlarged-text viewport captures were visually inspected. They are direct spot checks, not full comparison captures. Full designed/grayscale captures remain coordinator-owned.

The first launch looked for a missing Playwright headless bundle; switched to the already installed system Chromium. No browser installation/download was made. No source changes were needed after the completed browser pass.

Desktop only. Mobile, live destination navigation, Back/Forward, physical-device and assistive-technology checks were not run. The source uses verified existing route definitions; that is not a claim of end-to-end live-route verification.
