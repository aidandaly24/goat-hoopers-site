# 20 — Branching matchbook

Stage one: working grayscale architecture only. Full visual treatment is deliberately deferred until the independent structure gate. Authored within `wireframes/20/`; imports common local facts and no common presentation code.

## Design contract

**User question:** “Given this matchup, what should I look at next?”

**Primary action:** Choose a specific, natural-language branch from the current matchup: inspect players, compare teams, know the league, read its dated editorial, or explore a tool/game. Every branch also has a direct entry in the branch index; product destinations remain actual anchors.

**Relevant states:** synthetic current Week 3, known zero versus unknown score, incomplete matchups, saved AI ready/stale/missing, member versus public, player/form/price/wire evidence, full roster disclosures, sorted directory, dated draft editorial, unavailable recorded history and Lineup Power.

**Forbidden patterns:** chatbot, text prompt, fabricated recommendation, pretend AI generation, search/task rail, card dashboard, generic repeated-section landing page, decorative score animation or hidden essential text. This assignment explicitly excludes search; directory lookup uses an indexed team list, an actual sort control and complete native roster disclosures. No search implementation is claimed.

## Geometry and navigation

Desktop 1440 uses a horizontal decision tree. The current matchup is the origin on the left. A connector leads to an unboxed fork of large sentence choices on the right. Selecting a choice replaces that fork with its concrete evidence and next branches. The origin remains alongside the selected evidence; the visited path appears as breadcrumbs and parent nodes. This remains the architecture through roster/form/value, all-five-matchup evidence, directory, editorial and tools, rather than returning to a lower dashboard.

Phone 390/320 changes the tree into one continuous vertical spine with explicit origin and active-node markers. The origin becomes a short current fact: both names, a known `0.0`, `Pending`, incomplete status and fixture date. The first full natural-language choice is within the 390×844 opening viewport. Managers, current records and saved AI are kept in a native origin disclosure. Stale/missing AI status stays visible beside the compact fact. The header has only the mark, the unmistakable **Synthetic concept** disclosure and a model-specific **Branch index** control. It does not inherit a row of site links.

The branch index is a nonmodal, in-flow index containing direct branches and all product destinations. Escape closes it and returns focus to its trigger. The provenance disclosure also closes with Escape. There are no modal readers, custom focus traps or gesture requirements.

Selecting a branch appends its ID to the actual visited path. Back or a breadcrumb restores the earlier node, its disclosure state, scroll and branch trigger focus. Browser Back/Forward uses the same stored path. Direct entries build the canonical parent path. The hash is a real deep link such as `#form`, `#league` or `#read`. No state hides or deletes another destination.

## Hooks and route inventory

`document.body.dataset.studyReady = '20'`. `window.goatStudy.states` and `activate(id)` expose these representative, substantive states:

| State | Concrete view |
| --- | --- |
| `home` | Current matchup origin and five sentence branches |
| `players` | Team identity, standing/count, modeled subtotal/top three, next questions and complete roster |
| `form` | All three form rows, best/rough completed-week cohorts, periods and coverage |
| `prices` | All 24 member roster values, or the public ten-face value list; explicit missing history |
| `compare` | All five current pairings and all five saved AI returns/provenance |
| `league` | All ten standings, all ten faces/team identities and complete 228-reference roster directory |
| `read` | Both dated draft archive chapters, three full editorial spotlights and their wires/sources |
| `tools` | Market/trade/history/AI/Arcade actions and the three synthetic recent transactions |

The additional `teamwire` state is reached from `players` or the member branch index. It shows both personal news entries and the member's recent move. Public mode carries no personal edition, subtotal, form cohort or My team action. The URL comparison switch is clearly documented as a concept control, not authentication.

Actual anchors retained: `/`, `/intel`, `/stocks#player-board`, `/history`, `/arcade`, `/arcade/free-throw`, `/ai-decides`, `/teams`, every `/teams/{id}`, `/transactions`, `/trade-analyzer`, `/weekly`, both `/weekly/{editionId}` routes, every supplied `/player/{id}`, member `/team` and `/teams/1#team-roster`. No unsupported stock player query is used.

## Content and applied source map

All runtime facts come through the explicit local import `{inventory,data,mode,aiState,esc,money}` from `../../data.js`. No live provider, remote module/font/image, new credential, service, dependency or production mutation is used.

| Information family | Actual source and implemented location |
| --- | --- |
| League identity/season | `home.hub.season`; GOAT mark, origin, directory season/playoff qualifiers |
| Current matchup | Member `personal.summary.matchup`, public `home.directory[0].currentMatchup`; both teams/managers/records, scores and incomplete context at origin and compare |
| All current pairs | Deduplicated `home.directory[].currentMatchup`; every pair and both scores in `compare` |
| Saved AI | `data.weekly.matchups` and `generatedAt`; all five returned choices, ordered probabilities, independent 20% confidence and saved provenance. First returned choice remains team 2 at 35%, with team 1 at 65%; no maximization substitutes for the returned choice. Null snapshot/baseline and empty returned evidence are explicitly unavailable. `?ai=stale` and `?ai=missing` work |
| Member identity/actions | `personal.summary.team`, `standing`, `coverage`; `players` and direct member actions |
| Modeled asset value | `valuation`, `players`, `rosterValues`, `market`; subtotal, separate value rank, all 24 values, top three, price movement, basis, priced/unpriced coverage and timestamp in `players`/`prices` |
| Recorded history/Power | `inventory.missing.history` and `.power`; explicit unavailability, no line or invented rank |
| Player guide | Complete `personal.summary.playerGuide`: all form/best/rough rows, games, unknown availability, EMA basis, exact completed source period, cohort coverage and synthetic qualifier in `form` |
| Personal wire | Complete `personal.summary.news` and `.moves`; outlet/timestamp and no invented add/drop detail in `teamwire` |
| Faces | All ten `data.faces`; real player/team profile anchors, position and modeled FAAB in `league`, public `prices`; approved local portraits are grayscale |
| Directory | All ten `home.directory` entries; managers/current records/opponents, full current rosters with all 228 unique references and position/NBA fields, rank/name/roster-size sort. 2025 records disclosed with explicit previous-manager attribution for NeuralNets/QBs Gremlins |
| Standings | All ten `home.hub.standings`; actual rank/W/L, ties if supplied, and PF divided by 100 in `league` |
| Editorial | Coherent `data.archive`, not the preserved conflicting `home.edition.game`; both dates/statuses and source dates; title/context/selection reason, all three player spotlights with exact stats/opinions/periods/sources, happenings and archive anchors in `read` |
| League moves/tools/game | All three `home.hub.transactions` in `tools`, direct routes and approved local grayscale game preview |
| Fixture provenance | `inventory.warning`/`benchmark`, compact header label with complete accessible disclosure and source-note link |

**Known source conflict handled:** the preserved `home.edition.game.teamIds` names 1/2 while its October narrative names 1/5. It is not used as an asserted historical result. Current Week 3 comes from the current matchup data; October narrative uses `data.archive`'s coherent 1/5 upcoming pairing and 5/7 historical final. Draft date ranges and publication unavailability remain visible. No source was edited.

**Applied craft principles:** Hallmark's architecture fingerprint changed both composition and reveal/navigation: a branching tree governs every state. Elaya's direction to break equal-card symmetry and preserve inline expansion/back context led to the unboxed decision fork, native evidence disclosures and restored parent state. Rauno and the supplied Apple interaction reference informed visible source→destination connection through the persistent origin and parent trail. `pbakaus/adapt` changed the desktop two-axis graph into a phone spine and purpose-built branch index. Addy's accessibility guidance led to actual native controls, keyboard/Escape checks, visible focus and independent narrow/text-enlargement tests. Emil/pbakaus frequency-and-purpose guidance prevented a decorative entrance animation.

The local `goat-hoopers-design` skill and its visual-hierarchy, navigation-accessibility and motion references were read and applied within the task's explicitly authorized QA exception. Production theme, shell and ownership remain outside this folder.

## Motion job and fallback

Stage one has immediate state changes with no loops, observers, timers, RAF, transitions or dependencies. Navigation and browser history preserve orientation through connected geometry, retained context, focus and scroll. The later full-stage motion thesis is a single, short user-triggered connector extension from the chosen sentence to its child evidence; the data itself stays immediately readable. Frequent keyboard operations remain immediate. Reduced motion uses the current still graph with exactly the same destination, focus, evidence and path. This is a proposed later treatment, not an implemented animation claim.

## Verification and remaining limits

Run `node qa/homepage-structures/wireframes/20/verify.mjs` from the repository root with the root's local static server at 4207. Results are in `checks.json`. `node --check` also passed for `matchbook.js`.

Chromium/Playwright passed all eight representative views at 1440, 390 and 320 CSS px, at both 100% and 200% root text, with native disclosures both closed and fully expanded: 48 view/viewport/text cases, no page overflow. Runtime checks also verified all 228 unique player references, all 24 prices, ten standings, actual directory sorting, both archive chapters/three spotlights, first-return 35%/65%/20% AI semantics, stale/missing variants, public personal-data exclusion, index/provenance keyboard+Escape, retained disclosure/focus/path on Back, browser Back, local-only requests and no JavaScript errors. Live reduced-motion changes preserve the full still interaction.

No supplied roster or secondary family is abridged from the reachable views. Directory lookup intentionally omits search under this model's explicit assignment; sort and complete native roster disclosures are implemented. Native in-prose reference links retain inline typography; standalone actions, buttons, disclosure summaries, roster rows and the index use 44px targets. There is no claim of full accessibility compliance.

Limits: this is a static local fixture, not production route/auth/data verification. Product links are actual route definitions; successful navigation to a production app is not claimed on the static server. No physical-device or screen-reader pass was run. Root-owned bulk captures, independent architecture/content review and the full-stage visual/motion gate remain outstanding. No Git, production, Muse/shared source, other author, old mock, allocation or external provider changes were made.
