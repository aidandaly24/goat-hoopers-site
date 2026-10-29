# Head to head — bounded craft revision 08

Stage-one grayscale revision for geometry/craft review. Original `wireframes/08/` source and images are unchanged. This folder contains its own HTML, CSS and JS; it imports the same local fact module. No shared/production/Muse files, Git, external services, installs or subagents were used. Root owns complete captures and Muse review; this is not final acceptance.

## User question and primary action

“What does my side look like against this week's opponent, and how do I read the rest of the league?”

Read the named two-team comparison, choose Players & value or Form & wire, and open real team/roster routes. Members begin with their own supplied pairing. Public rendering uses only the public branch; the preview switch is not an auth boundary.

## Actual craft changes

- Replaced the inherited multi-link app header, numbered workspace bar and dark fixture banner with a single brand/workspace/Menu header. Desktop keeps three plain view links. Phone has brand and Menu; Menu reveals local view links and every site destination. Expanded Menu is **in normal document flow**, so it does not cover provenance or keyboard focus.
- A compact **Synthetic concept** disclosure carries complete fixture provenance: all synthetic current families, frozen Nov 12 date versus today, preserved dated identities/editorial, draft/source distinctions, modeled quote caveat, absent producers and preview/auth caveat. Footer links back to this disclosure instead of repeating the full warning.
- Phone deliberately separates **whose side** (two side controls) from **what to read** (labelled native select). The shared team/score context remains visible while reading the 390px roster. At smaller effective widths, full names reflow above two-sided scores and the week/status becomes one full-width line; enlarged text uses normal flow rather than a tall sticky obstruction.
- Removed decorative view numbering, zero-padded week/rank formatting, uppercase/tracked section styling and negative heading tracking. Real week/rank numbers remain. Type and semantic color/font tokens are local to this folder's `:root`.
- Removed duplicate anchor labels/quote caveats in both halves, the “One matchup. Two sides.” caption and repeated probability explanation. Each comparison now has one central subject label. Scores, records, ranks, returned AI choice, separate confidence and full source details remain.
- Kept useful boundaries: the two team halves, central seam, comparison row rules, actual probability tracks and readable roster/table lines. Removed dark fixture strip, filled side buttons, redundant outer frames and decorative footer treatment. No opacity effects, animation or new art.
- Ordinary view navigation and browser Back put focus on the current heading. Phone subject selection keeps its control focused; side selection keeps button focus. Menu and provenance support Escape with trigger focus return.

## Geometry and navigation

Desktop remains a true continuous split screen: each half owns identity, score, record/rank, anchor, saved probability and team actions. An eight-rem central seam names the aligned evidence. Players/value and form/wire retain this same pair and reading geometry; there is no dashboard below a novelty hero.

League-wide information replaces the split with a full-width reader. Its directory is an indexed collection with local search, sort and native complete-roster expansion. Standings, all saved picks and transactions/tools are reader destinations. Weekly edition is a separate dated article with two-entry archive navigation.

Phone 390px keeps two team identities and two scores together. Side buttons select the visible detail half; the Read select changes comparison subject. Hidden halves leave the tab order. At 320px or narrow effective widths from 200% root text, names use full-width lines while scores remain two-sided; week/status is explicit beneath them. At the narrowest effective width, side controls and the Read label/select use full-width rows. No drag, hover, modal, timer or autonomous motion is required.

Hashes support direct state entry and browser history. Pair, side, search/sort and archive selection stay in local memory when reading other views. Menu local navigation closes the Menu. “Read this matchup” on a team row and “Return to the head to head” connect the reader to the comparison.

## Capture API and content map

Unchanged ready hook: `document.body.dataset.studyReady = '08'`.

`window.goatStudy = { states, activate(id) }` exposes these eight real views; activation is synchronous.

| State ID | Information and actions |
| --- | --- |
| `comparison` | Default current pair with week, teams/managers, known 0.0 versus Pending, not-final status, both records/ranks, anchors/quotes, saved probabilities and returned choice, independent confidence, full pick provenance, team/roster/trade actions. Selector reaches all five current pairings. |
| `rosters` | Same pair/context. Member current modeled total, coverage/time/basis/rank, top three and complete 24-player price disclosure. Both complete roster references with position/NBA. Opponent subtotal honestly unavailable. |
| `scouting` | Same pair/context. Member EMA form watches, completed-week best/rough points/GP/period/participation/coverage, two news links and personal move. No opponent personal projection is invented. |
| `league` | Ten teams/managers/current records/opponents, ten anchor faces with modeled values and real player/team links. Search team/manager/player, sort by standing/name/roster count. Ten roster disclosures retain all 228 unique player references and previous-season attribution. |
| `standings` | All ten ranks/W/L/PF (`pointsFor / 100`), member marker, missing Power and aggregate context. |
| `picks` | All five actual saved rows. The first away returned choice remains 35%, with the other team at 65% and independent confidence 20%. Each disclosure retains model/prompt/time/season/week/league, absent snapshots/baseline and supplied input/returned evidence. |
| `edition` | Both dated archive entries/routes, coherent dated game, three supplied spotlights with exact stats/opinion/period/selection/source dates, happenings and sources. Historical archive switch shows 326.0–251.5. |
| `tools` | All three league moves with week/date/type/team references, plus Stocks, trade analyzer, AI Decides, News, Teams, Transactions, Arcade, actual free-throw, History and archive links. Recorded-history and Power unavailable text. |

Home, News `/intel`, Stocks `/stocks#player-board`, History, Arcade, AI Decides, Teams, Transactions, trade analyzer and archive remain reachable through Menu or reader links. Member `/team` and `/teams/1#team-roster` remain scoped to the actual personal team. No unsupported player query is added.

## Source and state integrity

Only `{ inventory, data, mode, aiState, esc, money }` from `../../data.js` supplies facts. The approved local logo and portraits are reused unchanged and grayscale. No remote runtime modules, fonts or images.

Known fixture conflict remains isolated: the inconsistent `home.edition.game` 1/2 IDs versus 1/5 prose is not rendered. Dated narrative uses coherent `data.archive[0]` (upcoming 1/5) and `data.archive[1]` (historical 5/7 final). Current Week 3 uses current directory pairings. No fixture mutation.

Known score zero is 0.0 and null is Pending, never zero/final. `?ai=stale` labels the slate stale and withholds current bars while retaining saved historical provenance. `?ai=missing` shows five pair identities and unavailable results without percentages. History and Power remain unavailable; no fabricated line or ranking. Prices are modeled FAAB quotes, not moves.

Public mode does not render personal valuation, form, news/wire or My team actions. Full model/evidence disclosures, price coverage/basis/time, source-period notes, all 24 values and all 228 roster references remain reachable. NeuralNets' 2025 record keeps the previous-manager qualification.

Stage-one inventory bounds remain: six absent aggregate fields are summarized as unavailable rather than individually listing null field names; raw internal DTO flags/IDs are not printed without a reading job. No opponent private summary is inferred from absent data.

## Applied craft guidance and motion

The original study read repository AGENTS, homepage ARCHITECTURE, DESIGN, the local GOAT skill and its hierarchy/navigation/motion references, plus BRIEF, author 08 and the supplied complete `reference-notes/craft.md`. This bounded revision follows the new parent-provided quality direction without external research or installing those references.

Hallmark's architecture fingerprint still governs the complete comparison; Elaya/Impeccable anti-symmetry and inline expansion keep the reader unboxed. `adapt` changes the phone task mechanism instead of shrinking the desktop. Apple/Rauno continuity preserves named source/destination context. Accessibility guidance now also keeps the expanded Menu in flow and verifies Back/focus and enlarged text. Emil/animate frequency restraint keeps repeated comparison input immediate.

No motion is implemented in this stage. A later occasional split-to-reader transition may collapse the seam over at most 180ms to explain the change in reading scope. Pair/side/keyboard actions remain instant, values never tween, and reduced motion uses the same still destination with labels and focus. Final motion/art remain gated on review.

## Actual targeted checks

Installed Chromium through Playwright; local parent server at `127.0.0.1:4207`.

- Syntax check passes; no browser page errors.
- Final eight-state rendering at 1440, 390 and 320 CSS px, at 100% and 200% root text: **48 combinations, no horizontal page overflow**, including expanded main disclosures. Expanded Menu and full concept provenance at 320/200% also have no page overflow; provenance is pointer-reachable while Menu is open because both are in flow.
- Actual visual inspections: revised desktop comparison, 390px phone comparison, 320px phone and enlarged 320px reflow. Temporary inspection images use `/tmp/goat08-revision-*`; root owns final captures.
- At 390px, only brand is an exposed header link while Menu is closed; the comparison Read select is visible. Opponent button via keyboard sets pressed state, retains focus, hides home detail and shows opponent detail.
- Selecting Players & value retains select focus; opponent roster has 27 rows. Member price disclosure has 24 rows. Scrolling to its last row leaves score context visible at 390px.
- Menu → League reader works by real interaction and focuses the reader heading. Directory has 10 teams, 10 faces and 228 roster rows. Embiid search finds and opens one team; A–Z starts with Huff n’ Puff. Browser Back returns to the chosen roster subject and side, with heading focus.
- Escape closes Menu/provenance and returns trigger focus. Footer opens and focuses full concept provenance. Reduced-motion mode retains side selection.
- Five saved-pick rows; first pair preserves 65% / returned-choice 35% / independent confidence 20%. Stale and missing modes each keep five rows and zero bars.
- Completed-week source period remains `2026-11-02 to 2026-11-09`; historical edition retains 326.0–251.5. Public roster/scouting checks show no personal $1095.25 total, My team or personal wire.
- Request inspection found zero external requests. SHA-256 checks confirm all four original `wireframes/08/` files are unchanged.

A scripted attempt initially tried clicking provenance through the previous overlay Menu. That exposed a focus/coverage problem; the revision was changed to normal-flow Menu expansion, then the same pointer path passed. No remaining blocker from that check.

Remaining bounds: no physical-device/screen-reader acceptance, no production routing/auth verification, no full browser scroll-restoration claim. External destination/source links are preserved rather than fetched. The isolated static change does not require a production build. Root's complete captures, Muse review and independent geometry acceptance remain pending.
