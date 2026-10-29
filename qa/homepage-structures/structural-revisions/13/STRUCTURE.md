# Folding atlas 13 — bounded phone and craft revision

Frozen grayscale structural revision, ready for root evidence and Muse review. Full art and final acceptance remain outside this stage. Only `qa/homepage-structures/structural-revisions/13/` was written. Original `wireframes/13/` source, notes and images are preserved; shared presentation/data, production, Muse, Git, providers and packages were untouched.

## Contract and retained architecture

**User question:** What is happening for my club now, and which part of the league should I open next?

**Primary action:** Unfold a named chapter from its actual full-width spine. The useful default is the Week 3 current pairing and five saved picks. Exactly one integrated spread opens in normal document flow immediately after its source spine; opening another collapses the prior spread.

The five unequal spines remain the architecture. Each spine has one functional chapter-order number, a title, a content description and Fold/Unfold state. An active spine becomes the origin of a large paper spread. The other real spines stay at their document origins. The sticky fore-edge names the actual preceding/following chapters; Fold book exposes the entire book's spines. It is not a detached reader or a new dashboard.

Desktop retains the broad left/right leaves, unequal folded heights and varied title origins. Phone retains full-width spines, the continuous bound left edge, deliberately unequal folded heights and a single readable unfolded chapter. A phone spread adapts scores, standings and roster references rather than squeezing desktop columns.

## Before / after

The original phone opened with separate logo/imprint, site routes, warning, comparison link, member identity, instruction, Previous spread and neighbouring-chapter layers. The current matchup was below that stack and a repeated spread title. This revision:

- Combines the header into two compact phone rows: logo with the visible **Synthetic concept** disclosure, then public/member comparison and Destinations.
- Moves the full current-fixture warning and exact checked timestamp into the native Synthetic concept disclosure. Dates, synthetic scope, draft editorial, source-period distinctions, missing producers and fixture/auth caveat remain available there. The label is always visible and remains an actual disclosure control.
- Retains all destinations in a native in-flow header disclosure and in the destinations chapter. Opening a chapter from that menu closes the menu and focuses the chapter origin.
- Removes the repeated Week 3 spread title/status paragraph. The selected spine already supplies the week; actual teams, managers, scores and incomplete state now follow it promptly. Exact fixture-check time remains in header provenance.
- Keeps fore-edge neighbouring-spine navigation and Fold book close to the first spine. Previous spread appears after a chapter traversal; an initially disabled control takes no space.
- Rebuilds the stylesheet with local semantic `--font-body`, `--font-heading` and `--color-*` roles. No external or shared style is used. Removes tight letter spacing, uppercase treatment, repeated content dividers, inset shadow layers and striped paper decoration. Only chapter boundaries, real controls and focus need structural lines.
- Shows chapter order once, on the real spines; removes repeated ordering numbers from the fore-edge and folio footer. Dates, scores, standing ranks and source numbers remain meaningful data.

Measured at 390×900 CSS px, 16px root text, same member fixture:

| Position | Original | Revision |
| --- | ---: | ---: |
| First chapter spine top | 498px | 139px |
| First team name top | 823px | 224px |
| First known score top | 920px | 255px |

Final revision opening geometry:

| Viewport width | Header height | First spine top | First team top | First score top |
| --- | ---: | ---: | ---: | ---: |
| 1440px | 79px | 124px | 233px | 344px |
| 390px | 94px | 139px | 224px | 255px |
| 320px | 94px | 139px | 242px | 339px |

With all chapters folded at 390px, actual spine heights are **136, 166, 127, 194 and 148px**. The selected default spine is compact; folded neighbours keep their unequal book shapes.

## Navigation and capture states

Native chapter buttons expose `aria-expanded` and `aria-controls`. Enter/Space toggles a spine; arrow keys move focus between spines; Home/End focus the first/last spine. Escape or Close spread folds the current spread and restores its origin focus. Previous spread traverses the local chapter trail. Browser Back/Forward restores chapter hashes. Deliberate chapter navigation aligns its spine beneath the sticky fore-edge; ordinary reading is native scroll.

Inline data/source disclosures are nonmodal. Header provenance and Destinations use native details; Escape within either closes only that disclosure and focuses its own summary, leaving the open chapter intact. Archive switching restores the selected archive button focus after replacing that local reader. Hidden spreads remove their contents from keyboard traversal. No drag, hover or gesture is required.

The existing hook contract is unchanged: `document.body.dataset.studyReady='13'`; `window.goatStudy={states,activate(id)}` opens actual content.

| State | Actual content |
| --- | --- |
| `week` | Current Week 3 pairing and all five saved AI rows |
| `club` | Member modeled quote, roster values, scouting/recap and team wire; public ten-anchor edition |
| `league` | Search/sort all ten teams and all roster references; standings and all faces |
| `stories` | Oct 5–11 draft, coherent upcoming game, three dated player stories and sources |
| `archive` | Sep 28–Oct 4 draft archive containing the separate 2025 final |
| `tools` | All destination routes, recent league moves and unavailable producers |
| `closed` | All five real unequal spines, no active spread |

Queries remain `?view=member`, `?view=public`, `?ai=stale`, `?ai=missing`. Chapter hashes and `#closed` work. Archive reader selection remains within the stories chapter and is not independently encoded in browser history.

## Preserved content map

Explicit `{inventory,data,mode,aiState,esc,money}` still comes from `../../data.js`; the original bounded inventory inspection informed the unchanged rendering. No fixture edits or provider requests. This revision changes presentation and header disclosure behavior, not facts.

| Inventory family | Reachable place / preserved distinctions |
| --- | --- |
| Identity and actions | Approved local GOAT mark; header Destinations and chapter 05 retain Home, `/intel`, `/stocks#player-board`, `/history`, `/arcade`, `/arcade/free-throw`, `/ai-decides`, `/teams`, `/transactions`, `/trade-analyzer`, `/weekly`. Member keeps `/team` and `/teams/1#team-roster`. Comparison link remains visible. |
| Current pairing | Chapter 01: member's own matchup / public first directory matchup, Week 3, both clubs/managers/current records, known 0.0, null Pending, incomplete state. Current checked timestamp is in header provenance. No final result is asserted. |
| Saved AI | All five rows in chapter 01: actual returned choice, chosen probability and independent 20% confidence. Each expands to both named probabilities, timestamp, season/week/roster IDs, model, prompt, input/weekly snapshots, evidence/baseline and sports-odds caveat. First returned away choice remains 35%, other club 65%. Stale is explicit; missing is unavailable and never generated. |
| Member quote | Chapter 02: identity, manager, standing, record, roster count, modeled FAAB subtotal, priced/unpriced/roster coverage, pricing basis/time and value rank. Top three retain portraits, positions, prices and supplied changes; native values disclosure retains **all 24 values** and positions. No private quote or scouting is constructed in public mode. Recorded history is unavailable. |
| Member scouting and wire | All three form watches with EMA FPPG, GP, basis and unknown availability; all three best and three rough completed-week rows with points/GP, exact Week 2 period, coverage, eligible cohort and synthetic recap caveat. Two team news stories retain routes/outlets/timestamps; member move retains week/type/time and explicit absent legs. |
| Faces | Public chapter 02 and chapter 03 disclosure retain all ten supplied player/team profiles, portraits, positions and modeled FAAB values. Champion context is supplied identity information. |
| Directory | Chapter 03: all ten managers/current records/opponents/roster counts. Every native roster has all supplied full-name, position and NBA references, with actual player/team/roster routes: **228 unique player references**. Search covers team/manager/player/position/NBA; matching players open their roster. Sort by current standing, club name or roster count is functional, with result count/Clear/zero-result state. |
| Standings | All ten rank/W/L/PF rows; PF remains `pointsFor/100`; playoff count/week retained. Dated previous-season record/finish/owner attribution stays inside each roster, separate from current summary and table. Power remains unavailable. |
| Editorial and archive | Chapter 04 preserves all three first-entry stats/opinions/periods/selection reasons/sources/checked dates, all happenings/routes/dates, edition sources and both exact archive routes/date labels/draft bounds. Older reader preserves historical 326.0–251.5 final and its separate 2025 source; no invented older spotlights. |
| Other league content | Chapter 05 retains all three current league moves and supplied absent-leg distinctions, tools, no-producer states and footer provenance. No fake history line or Power ranking. |

**Known editorial fixture conflict:** `home.edition.game.teamIds` is 1/2 while its dated prose names 1/5. As before, chapter 01 uses coherent current Week 3 data and chapter 04 uses coherent `data.archive` W41 upcoming 1/5 and W40 historical final 5/7. The conflicting object is preserved but not combined into an asserted result. October draft samples are not current Week 3 results or official current Week 2 awards.

No numeric inventory is abridged. Deep provider details and destination applications remain external to this local static prototype; their actual route links are retained.

## Applied craft judgment

This bounded revision retains the previously read Goat Hoopers hierarchy/navigation/motion skill and supplied `reference-notes/craft.md` principles. It does not install or execute external material.

- Hallmark custom direction/macrostructure: the book's in-flow origins and chapter replacement govern every content family, not a decorative introduction.
- Hallmark responsive and pbakaus adapt: compress chrome before compressing the task; preserve the book and actual content at phone widths and enlarged text.
- Elaya redesign: keep asymmetric continuous leaves and expansion context; remove divider repetition and competing framing without discarding data.
- Rauno / Emil apple-design: preserve source/destination continuity, neighbouring chapters and a direct return to the spine.
- Addy accessibility: native visible states, actual focus/back tests, labelled phone standings and all data through real controls.
- Emil/pbakaus/accessible-animation: this stage remains immediate and still. Zero animations/timers and the same functions under reduced motion. A later approved art-stage transition could briefly explain a pointer-triggered unfold at its source; keyboard/reduced-motion still remain immediate. No scroll-reveal or motion framework is added.

## Final targeted evidence

Installed Playwright with local Chromium, root's local 4207 server, 2026-10-29:

- **84 reflow combinations:** member/public × seven API states × 1440/390/320 CSS px × 16/32px root text. Active chapter disclosures expanded. No horizontal page overflow. The 32px root is a 200% text test, not a claim about browser zoom or physical devices.
- **36 additional header combinations:** each edition/width/root setting with provenance open, Destinations open, and both open. No overflow. The final full checked timestamp was present.
- **Real fold path:** fore-edge Next opens club at `spine-club`, hides prior week spread; Previous spread restores week. ArrowDown focuses club; Enter opens; Escape folds it and restores `spine-club`. Browser Back restored club; Forward restored the closed state. Archive switch retains selected button focus and displays the exact historical final.
- **Inventory/search:** 228 roster references, 24 member values, five saved AI rows. Embiid search returns one 24-player club and opens its roster; Clear restores all ten; name sort begins Huff n' Puff (team ID 6).
- **Disclosures:** Escape inside provenance or menu closes that header disclosure and returns to its summary. No chapter close occurs on those header Escapes.
- **State fidelity:** stale and missing AI query labels passed; public body lacks private subtotal, scouting and My team. Live reduced-motion emulation retained navigation with zero animations.
- **Final phone target heights:** visible links/buttons/inputs/selects/summaries across all seven states were at least 44px high at 390px.
- Final combined run: zero page errors and zero remote requests.

Local review snapshots are `check-1440.png`, `check-390.png`, `check-320.png`, `closed-phone-check.png` and the initial revised `phone-check.png`. Root's captures and Muse's review remain the independent evidence gate; these snapshots are supporting working checks.

Original source hashes still match the first-stage handoff:

```text
d22bcba97d6f160c0fb55df6f2048af3ec71572c8c345d8a62daadb1cdc22658  wireframes/13/index.html
fa5bf30a86e1c614e94c94a38a62ae864432778146b44a90ecbcae32781148fc  wireframes/13/style.css
80d622359a31ee831868b2841f2cd40911d33e356b9d7b88e6e770b058f10fe3  wireframes/13/atlas.js
```

Final checked revision source SHA-256:

```text
f50144c62ffe6abcc2f6f18dad5b494ea98068afcc56187ca3f2c38806e7ddbc  index.html
d21c9489fa2903ead6893b368daeaef27c1f72655ade124bb5f5b6f660ee0ca3  style.css
632a067bb20a7499e368220b351496f8152f26ee13b6667eb70e01e36cf1ac17  atlas.js
```

**Limits:** No physical-device, screen-reader/browser-diversity or full measured contrast audit. Production route applications/auth/live data are unverified. Static grayscale study only; no application build or release action was needed. The default spread can exceed one viewport, while the fore-edge keeps adjacent spine navigation available. No action was denied or left with an uncertain execution outcome; root evidence and Muse review are pending by the requested workflow.
