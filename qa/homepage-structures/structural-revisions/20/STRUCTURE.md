# Branching matchbook — bounded structural revision

The independently adjudicated branching architecture is retained. This revision adds the missing directory search and simplifies its presentation. It is still a grayscale local structural prototype; full art and motion remain behind the structure/full-state review gate.

## Targeted changes

- Added **Find a team, manager or player** inside the league branch. It searches every supplied roster locally, ignores case/diacritics/apostrophe variants, shows the matching team, and exposes matching player links with position and NBA reference. It does not replace the sentence-based entry or add a homepage query box.
- Kept rank/name/roster-size sorting beside search. Filtering preserves the chosen sort. A live result count, explicit empty state and Clear search action recover the complete ten-team/228-reference directory.
- Query and sort are retained in `q`/`sort` URL parameters and history state. They survive branch Back, browser Back and reload. Native roster disclosure state and return focus also survive a branch visit. A regression exposed duplicate “compare” triggers; restoration now targets the exact trigger occurrence used to leave the branch, including when the other copy is inside a closed phone disclosure.
- Removed decorative study/section codes, numbered branch labels, repeated path instructions and duplicate directory records. Removed negative tracking and redundant header, row, chapter and disclosure dividers. Remaining lines connect the actual origin, decision branches and parent path; probability bars still encode actual returned probabilities.
- Added local semantic font/color roles in `style.css`: body/numeric font, surface, text/muted/disabled text, connector, control stroke/hover, image matte, probability roles and focus. There is no shared template or production token import. All assets remain local and grayscale, including the browser's native search-clear control.

## Surface contract and geometry

**User question:** “Given this matchup, what should I look at next?” **Primary action:** choose a natural-language branch. Search is a secondary action once the visitor reaches the league directory.

Desktop retains the horizontal origin-to-fork geometry and evidence alongside the current matchup. Phone retains a continuous vertical origin/path, compact matchup fact, native manager/record/saved-AI disclosure, and a small Branch index. The header still has an unmistakable **Synthetic concept** disclosure with complete provenance. Meaningful Back/breadcrumb navigation, actual product links, unknown-score and stale/missing qualifiers remain.

Substantive states remain `home`, `players`, `form`, `prices`, `compare`, `league`, `read`, `tools`. `teamwire` is an additional reachable member state. `document.body.dataset.studyReady='20'` and the existing eight-state `window.goatStudy` API are unchanged. Every destination remains directly available from the index. Public mode still excludes the personal edition.

Search states can be captured directly without adding a ninth study state:

- `index.html?view=member#league` — complete directory.
- `index.html?view=member&q=jokic&sort=name#league` — accent-insensitive player match with parent team context.
- `index.html?view=member&q=Aedan23#league` — manager match.
- `index.html?view=member&q=no-such-fixture-person#league` — honest empty state and recovery.

## Content/source retention

Facts still come solely from the explicit `{inventory,data,mode,aiState,esc,money}` import from `../../data.js`.

| Family | Concrete retained place |
| --- | --- |
| Current matchup | Origin and `compare`: both teams/managers/records, actual known `0.0`, unknown `Pending`, Week 3 and incomplete status; Nov 12 synthetic fixture caveat |
| Saved AI | `compare`: all five returned choices, ordered probabilities, independent confidence, saved timestamp/model/prompt/input/evidence. First choice stays team 2 at 35%, with team 1 at 65% and confidence 20%. Stale/missing URL variants stay explicit |
| Member team/value | `players` and `prices`: identity, standing, roster count/actions, top three, subtotal/basis/time/coverage, all 24 values and explicit unavailable recorded history |
| Form/completed week | `form`: complete watch/best/rough rows, sample size, availability unknown, exact completed source period and cohort coverage |
| Team news/moves | `teamwire`: both sample news rows and the sample personal move; `tools`: all three supplied league moves |
| League identities | `league`: all ten faces, values, team/manager/current-record/opponent references, complete 228-unique-reference rosters with position/NBA; local search and sort; ten standings with PF ÷ 100; dated prior-manager attribution retained |
| Editorial/archive | `read`: both dated draft chapters, three exact-stat spotlights with opinions/periods/selection/source dates, all four dated happenings (Lonzo, NeuralNets' two moves, Risacher, prior-manager rebuild), both archive routes and full source disclosures |
| Tools/game/destinations | Actual Home, News, Stocks, History, Arcade/Free Throw, AI Decides, Teams, Transactions, trade analyzer, weekly archive, player/team profiles and member team/roster anchors |
| Missing producers | Recorded team-value history and Lineup Power remain honestly unavailable. No fabricated line, power ranking, score or generated AI is added |

The preserved `home.edition.game.teamIds` conflict is still avoided: current Week 3 uses current matchup data; dated October narrative uses coherent `data.archive` entries for 1/5 upcoming and 5/7 historical final. Draft status, dates, historical score and unavailable publication timestamps remain. No source fixture was corrected or rewritten.

## Applied craft principles

The existing Hallmark architecture fingerprint remains composition/navigation/reveal, not a palette change. Elaya's reduction of equal-card symmetry and inline state/context preservation informed the simplification without flattening the graph. Rauno/source-to-destination continuity remains the persistent origin and parent trail. `pbakaus/adapt` continues to govern the phone spine and compact index. Addy's native-label/focus guidance now also applies to the directory form, live results, empty recovery and exact return trigger. Frequency/purpose motion guidance keeps query updates and keyboard navigation immediate.

No animations, timers, observers, RAF or dependencies were added. The proposed later motion job remains a single short user-triggered connector extension. Reduced motion retains the current still path and every action.

## Verification

Run `node qa/homepage-structures/structural-revisions/20/verify.mjs` from the repo root with the root-owned static server at 4207. `checks.json` records the actual results. `node --check` also passed for the revised module.

Chromium/Playwright passed all eight representative states at 1440/390/320 CSS px and 100%/200% root text, with default and fully expanded native disclosures: 48 state/viewport/text cases, no page overflow. The first phone branch remains fully within 390×844.

Targeted search checks passed team name, manager name, accent-insensitive `jokic`, actual player/profile/position/NBA result, sort retention, no-match recovery, all 228 references after clearing, query URL reload, branch Back/browser Back, roster disclosure restoration and exact trigger focus. Filtered controls/results also reflow at 320px with 200% text. The inherited inventory checks still pass all 24 values, ten standings, five actual AI returns, two archive chapters/three spotlights and all four happenings; public exclusion, stale/missing AI, keyboard index/provenance Escape, live reduced-motion changes, local-only runtime requests and zero JavaScript errors also pass.

The original source files were preserved byte for byte. Their SHA-256 hashes were unchanged before/after this revision:

| Original file under `wireframes/20/` | SHA-256 |
| --- | --- |
| `index.html` | `8b22e15f39fdad56ea13e126a21f43df9d967df49b2b744140f0482188468f48` |
| `style.css` | `7484e0b9cf49dc6f324fe71aeb724cb26806abb69d7546e18abdf80feabc2ace` |
| `matchbook.js` | `dc71ddba55ca507177de78ec43c0ee7aae11d274381fa59e869e3c4f4cd466bd` |

No original images, other author files, shared/production/Muse files, Git state, external provider or package installation was changed. Only this revision folder contains deliverable writes.

## Remaining limits

This is a static local concept, not production routing/auth/backend proof. No screen-reader or physical-device test was run. Native in-prose reference links retain inline typography; standalone actions, search controls, buttons, summaries and roster links use 44px targets. No universal accessibility claim is made. Root-owned full-state captures, Muse review and the full visual gate remain outstanding; there is no implementation blocker.
