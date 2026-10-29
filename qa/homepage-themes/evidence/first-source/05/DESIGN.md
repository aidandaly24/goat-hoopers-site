# 05 · Championship Chrome

An independently authored, isolated homepage direction for the current `qa/homepage-themes/BRIEF.md`. Only this direction's four source files were written. No earlier mock, other author's direction, shared CSS, component template, production token, data fixture, package, Git state, or service was changed.

## Surface contract

- **User question:** What matters for my team now, and where can I inspect the rest of the league?
- **Primary action:** My team, with View roster beside it. Public readers get Browse teams and Saved AI picks.
- **States:** Member/public; known 0.0 versus unknown Pending; incomplete matchup; ready/stale/missing saved AI; unmatched saved IDs/season/week rejected; synthetic current prices, news and form; dated draft editorial; explicit unavailable value history, league statistics and Lineup Power.
- **Narrow layout:** The scoreboard becomes two identity/score rows. Value anchors remain three compact portraits at 390px and become portrait rows at 320px. The notebook, AI, directory, standings and tools stack. Phone standings retain full team names above W/L/PF. Search, sorting, profile links, menu, every full roster and source disclosure remain available.
- **Forbidden patterns:** Fabricated results, rankings, probabilities, awards or historical value lines; figurine assets or WebGL; fake game controls; decorative buttons; repeated glass cards; remote runtime requests; production styling or publishing changes.

## Visual direction

The full page is an obsidian arena with cool silver and ice cyan. A wide, monochrome crop of the existing arena sits beneath the current pairing. Its crop excludes the photo's large background lettering. Thin reflective edges and quiet horizontal reference rules organize the page; there are no rounded card grids, frosted panels or animated scenery. The dark atmosphere continues through the notebook, editorial, saved slate, working directory and footer.

Orbitron is reserved for section titles, scores and prominent monetary values. Local Inter keeps names, controls, dense data and long provenance readable. Numeric fields use tabular figures. Root-relative font sizes give a measured 16px body at 100% and 32px at a genuine 200% root setting; metadata starts at 12px and ordinary secondary text at 14px.

Semantic colors are local to this folder:

| Role | Value |
| --- | --- |
| Floor | `#080c10` |
| Surface / raised | `#10171d` / `#18232c` |
| Primary ink / quiet ink | `#edf2f5` / `#adbcc7` |
| Chrome | `#c5d3dc` |
| Ice action / focus | `#8fe6ef` / `#a1f3ff` |
| Divider | `#3d505d` |
| Stale state | `#e4c797` |

The main hierarchy is current matchup → own modeled value → scouting basis → completed-week team context → dated editorial → all five saved AI results → complete league reference → tools → archive and sources. The ten modeled faces are integrated into team rows rather than duplicated in a separate portrait gallery. The member's full valuation and every team roster use native disclosures.

## Content and interaction

The supplied current pairing comes from the directory/member projection, not the dated editorial game. The known home score stays 0.0 and the away score stays Pending. The old edition's pairing, period, draft status and selection reason remain explicitly dated.

The member valuation shows its supplied total, pricing basis, computation timestamp, priced/unpriced coverage, rank, top three, and all 24 player values. Recorded value history is unavailable, with no fabricated chart. The scouting notebook separates observed EMA FPTS/game from modeled FAAB and the sourced college editorial watch. Completed-week best/rough lists retain FPTS, GP, the exact period and the five-player coverage limitation; overlapping supplied selections remain intact.

AI rows preserve the actual returned away-team choice at 35%, the other team's 65%, and independent 20% confidence. They do not infer the choice from the maximum probability. Each row exposes IDs, model/prompt version, generation date, snapshot availability, baseline and input/output evidence. Stale is visible outside the disclosure. Missing data retains all five current pairing contexts without saved-row hooks. Matching checks reject unrelated pair, season or week data.

Directory search matches team, manager or any roster player's name; a matching player opens that team's full roster. Team sorting supports standing, name, roster size and top modeled player value. Standings have an independent native sort. The menu opens with Enter, closes with Escape and restores trigger focus. It is a normal-flow nonmodal disclosure. All current destinations, archive links, player/team profiles, Stocks, Trade Analyzer and actual Free Throw practice navigation are retained.

## Provenance

Data import: `../../data.js`; input benchmark: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`. The visible fixture strip and complete source notes explain that current records, scores, modeled prices, form, news, moves and AI examples are synthetic. Dated editorial retains its supplied source and check dates.

Assets are existing local GOAT white horizontal logo, `public/courtside/arena.jpg`, the supplied player portraits and `public/arcade/free-throw-preview.jpg`. No image was invented, generated, downloaded or modified. Orbitron is served from the official local Google Fonts asset catalog with its SIL Open Font License 1.1; Inter reuses the existing local font asset. No external runtime requests were observed.

## Browser evidence and limits

Checks used installed headless Chromium through Playwright and the root's static server at port 4206. This is static fixture evidence, not production Next routing, authentication or game execution evidence.

- Eighteen member/public × ready/stale/missing AI × 1440/390/320 combinations rendered with no page overflow. Ready/stale expose five saved rows; missing exposes none. Public has no personal hooks.
- Final normal and actual 200% root-font checks at 1440, 390 and 320 in both views, with every native details element and the navigation open, had `scrollWidth === innerWidth`. Computed body font doubled from 16px to 32px. Enter/Escape opening, closing and focus restoration passed.
- DOM inventory: ten directory containers, ten modeled faces, 228 unique full-roster player links, ten standings rows, and all 24 member value entries. The supplied returned choice/probabilities/confidence are preserved.
- Player search found Damian Lillard's single team and opened its roster; manager search found NeuralNets; a nonexistent query produced the explicit empty state. Sorting put roster 2 first by roster size, roster 6 first alphabetically, and roster 9 first by top price. Standings name sort also put Huff n' Puff first.
- The full member page was scrolled to load and inspect its lower sections/footer. All images loaded, no JavaScript page errors occurred, and no external requests were recorded. Desktop and phone stage, directory/footer, and enlarged phone standings were visually inspected. Reduced motion retained all five saved rows; there is no autonomous animation.
- Contrast spot checks: quiet ink/floor 10.08:1; primary ink/raised 14.15:1; ice/raised 11.20:1; primary button ink against its darkest gradient endpoint 10.99:1; input boundary/background 5.31:1; focus/floor 15.68:1. Sampled composited court backgrounds behind quiet text produced 6.67–8.96:1. These samples do not claim an exhaustive accessibility audit.
- `node --check app.js` passed. The interaction module is approximately 9.4KB gzip. No app build was run because no production application code or configuration changed.

Not performed: physical-device testing, screen-reader testing, production Back/Forward restoration, actual destination/game execution, an injected unmatched-slate browser fixture, or independent visual similarity review. The matching guard is source-inspected; the supplied query states only provide ready, stale and missing. Root owns bulk comparison captures and selection.

## Exact source revision

SHA-256 over the byte concatenation **`index.html` then `styles.css` then `app.js`**:

`3b8e8fbc64ed840b2171b9dc88658d8157cd7185eaaf174fecea62aa5a267b8d`

This hash excludes this documentation file to avoid a self-reference. Source is ready for the root's comparison gate; no release action was performed.
