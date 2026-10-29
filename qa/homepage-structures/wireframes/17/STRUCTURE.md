# Study 17 — League ledger

Stage-one grayscale architectural prototype. Frozen for the independent structure gate; this is not final visual acceptance or a production change.

## Design contract

**User question:** What is happening across the league, and which underlying roster or source explains this row?

**Primary action:** Find or sort a franchise, read across its aligned fields, then open its roster or evidence directly below the row. A member can open Your brief or move into My evidence. A public visitor gets the league sheet without the personal edition.

**Relevant states:** Whole league, full inline roster, filtered player search and empty search, five current matchups with source receipts, personal form/valuation/completed-week evidence, two dated editions with their narratives, and moves/tools. Saved AI supports ready, stale and missing URL states. Known 0.0 and unknown Pending remain different; current matchups stay incomplete. Recorded history and Lineup Power remain unavailable.

**Default desktop geometry:** A compact masthead and a horizontal category index lead to one working sheet spanning the page. The default semantic table has rank, franchise/manager, current W–L, PF, current opponent/score, league face/modeled FAAB, and roster/evidence actions. Ten teams remain in one continuous row system. No hero, card grid, dashboard sidebar, court scene or image-led front page. Expanded readers are actual table subrows attached to their originating row, using a quiet gray field and one vertical guide. Editorial paragraphs have a 76-character maximum reading measure; a source narrative is not forced into a narrow data column.

**Phone geometry:** At 56rem and below the desktop category index becomes a labelled native Sheet select. Each team becomes a labelled row record in the same continuous ledger. Roster/Your brief actions follow the identity before the selected fields, so a useful action appears in the first 390×844 screen. A sticky Fields select switches between Week 3, standings, league faces or all fields. It does not horizontally scroll the desktop table. The full inventory remains reachable; rows do not become detached cards. Tables inside readers also become labelled records. The site menu is a normal-flow native disclosure and Stocks stays direct. At 320px, larger text can wrap controls and the title into more lines.

**Forbidden patterns:** Hero plus repeated bordered modules; equal cards; fixed sidebar; truncated names/narratives; fictional current results; personal values in public rendering; inferring totals from a league face; converting null to zero; replacing the returned AI choice with the larger probability; decorative chart lines or power rankings; drag-, hover- or motion-only access.

## Navigation and state model

The category index changes the sheet itself: League sheet, Matchup sheet, My evidence (member only), Dated editions, Moves & tools. Search and sort operate on the active sheet. The league sheet supports team/manager/player search, standing order, name order, PF order and roster-size order. A player match opens that team's full roster. Other sheets support source/newest order and title/name order. A composed empty state has a reset action. Inline source readers can remain open beside other rows; Close row and Escape restore their originating trigger. There is no modal.

Global destinations: Home `/`, News `/intel`, Stocks `/stocks#player-board`, History `/history`, Arcade `/arcade`, AI Decides `/ai-decides`, Teams `/teams`, Transactions `/transactions`, Trade analyzer `/trade-analyzer`, Weekly archive `/weekly`, member `/team`, member full roster `/teams/1#team-roster`, both `/weekly/2026-W41` and `/weekly/2026-W40`, all `/teams/:id` and `/player/:id` profile links, and `/arcade/free-throw`. The footer switches `?view=member` / `?view=public` for comparison. These are destination anchors, not a production route implementation in this static QA server.

`window.goatStudy.states` and synchronous `activate(id)` expose:

| ID | Selected geometry/content |
| --- | --- |
| `default` | Closed, whole league sheet; member's team labelled |
| `league` | Same closed ten-row working sheet |
| `roster` | Team 1 full roster subrow; member values only in member rendering |
| `matchups` | All five pairs, first saved-model source subrow open |
| `evidence` | Member evidence register; watch and completed-week rows open |
| `editorial` | Both archive rows, first edition open with all three spotlights/sources |
| `moves` | Move and tool destination register |
| `search` | Local Embiid search with team 1 roster open |

Public rendering omits `evidence` from both the index and hook states. Additional evidence rows (valuation, wire, history/power), other team rosters, other AI receipts, the second archive reader, field choices and empty search are reached by their ordinary labelled controls. `document.body.dataset.studyReady` is `17` after initial rendering.

## Content and source map

All facts come from the required explicit import of `{inventory, data, mode, aiState, esc, money}` in `../../data.js`; shapes were checked using bounded queries of `../../inventory.json`. There are no live provider reads or secondary fact fixtures.

| Preserved family | Concrete place / supplied data |
| --- | --- |
| Current team/manager/record/opponent/score | League rows from `data.home.directory` and `home.hub.standings`; all five `currentMatchup` pairs in Matchup sheet. PF is `pointsFor / 100`. Member's team/pair is explicitly labelled. |
| Ten league faces | League face field, using all ten `data.faces` records, approved local portrait if present, player and team profile links, position and modeled FAAB value. Phone Fields → League faces / All fields. |
| Full directory/rosters | Ten team rows; all 228 unique `directory[].players` references in inline rosters, each with name/profile, position and NBA team. Local team/manager/player search and sorting. No reference inventory is abridged. |
| Prior-season attribution | Roster reader prints the supplied 2025 W–L, finish and owner note. NeuralNets' closed row warns that its 2025 record belongs to previous manager QBs Gremlins; its full reader prints the 1–20 record with that attribution. |
| Saved AI, all five | Matchup sheet joins the current pairs to `weekly.matchups`. Each row keeps returned choice, both returned probabilities, separate confidence, incomplete scores and a source action. Receipt includes timestamp, model, prompt version, league/season/week/team IDs, null snapshots, matchup/result evidence and baseline. First saved choice is team 2 at 35%, team 1 at 65%, confidence 20%. Stale is labelled and missing renders no probabilities or choice. |
| Member identity / valuation | Your brief beneath team 1 and My evidence → Your roster value, from `personal.summary`. Team/manager, standing, 24-player count, team actions, $1095.25 modeled total, 24/24 priced, zero unpriced, basis/time, supplied value rank, three supplied top players and changes. Complete 24-value roster is reachable. Public does not render these personal records. |
| Member scouting and completed week | My evidence → Players to watch contains all supplied watch rows, EMA basis, observed 8-game samples, supplied availability-unknown notes and no schedule adjustment. Best & rough contains every supplied list row, fantasy points, GP, exact Week 2 source bounds, five-player verified cohort and overlap/exclusion caveats. These are visibly synthetic completed-week examples, not official current Week 2 awards. |
| Member news/moves | My evidence → Your team wire preserves both supplied news references, outlet/time and the member move with type/week/time and honest absent player legs. |
| History / Power | My evidence → History & Lineup Power and Moves & tools show `inventory.missing` messages. No invented series, leader/ranking or inferred data. |
| Dated editorial and archive | Dated editions contains both complete `data.archive` entries, date bounds, draft/unpublished state, exact edition route, game status/pair/scores when supplied, context and selection reason. First reader contains all three spotlights with every stat, period, opinion, role, selection reason, source link/check date, happenings and source register. Second reader contains the 2025 final, historical scores/context and previous-manager happening. |
| League moves/tools/provenance | All three supplied `home.hub.transactions` in Moves & tools, with source time, type, week and absent-leg counts. Stocks, trade, free throw, history, intel and directory destination records. Compact Synthetic concept disclosure expands full provenance; footer preserves current-metric/FAAB/null qualifiers. |

### Preserved fixture conflict

The old `home.edition.game.teamIds` says 1/2 while its dated prose names 1/5. This study never uses that contradictory game object as an asserted pairing. Current Week 3 comes from the directory's `currentMatchup`; dated narrative comes only from coherent `data.archive` entries: 2026-W41 upcoming 1/5 and 2026-W40 historical final 5/7. The fixture is unchanged. Nov 12 is labelled as fixture time, not October 29 today.

## Applied source principles

Read the project AGENTS, homepage architecture/design portions, GOAT design skill and its visual hierarchy, navigation/accessibility and motion references, the assigned author brief, the shared brief and the supplied `reference-notes/craft.md`.

- **Hallmark custom direction / macrostructure:** the ledger idea governs the entire navigation, composition and reveal system, including personal evidence and long editorial. It is not a new landing section above an inherited dashboard.
- **Elaya redesign:** break equal-card symmetry and automatic sidebars. The originating row stays visible in the same document when its reader opens, with source and destination connected.
- **MoMA indexed-collection / Rauno direct interaction principles in the supplied notes:** use a useful index, real filtering and explicit readers rather than decorative discovery. Profiles are links; row expansion is a distinct button.
- **pbakaus adapt:** the phone changes the comparison task to labelled records and a field chooser instead of shrinking seven columns or simply stacking desktop cards.
- **Addy accessibility and Elaya deliberate labels/empty states:** native inputs, visible focus, 44px phone control/link targets, explicit field names, resettable empty search, and state labels that do not rely on color.
- **Emil / pbakaus animation purpose gate:** frequent sorting, filtering and field changes are immediate; nothing waits for an entrance reveal.

## Motion job and later full-build thesis

Stage one intentionally uses no authored animation, autonomous loop, timer, scroll observer or tween. A row opens in normal flow, so origin and result share document context; Close/Escape return focus. All content and operations work under live reduced-motion preference changes. For a later approved full build, the only candidate motion is a short interruptible expansion of the selected row's reader to explain its position in the ledger. Keyboard/reduced-motion paths must remain immediate and show the identical final reader. This is a proposal, not implemented motion or permission to bypass the structure gate.

## Verification and limits

Executed locally in installed headless Chromium via the installed Playwright module, against root's existing port 4207 server. No installs, build infrastructure, production edits, Git operations or external data calls.

- `node --check ledger.js`: passed.
- All eight member hook states: 1440, 390 and 320 CSS px, each at 100% and 200% root font size (48 rendered cases): no full-page horizontal overflow and no page errors. 200% root text is a reflow probe; it is not a claim of a physical-device or browser-zoom accessibility audit.
- All ten roster buttons opened: exactly 228 player links, 228 unique profile references.
- Default has all ten rows; Matchup sheet has five pairs. First AI row visibly returns Ware the Hoes At? at 35%, Reaves Dropper at 65%, with independent 20% confidence. Known 0.0/Pending and incomplete status are preserved.
- 23 interaction assertions passed: phone field selection/hiding, name and roster-size sorting, player search opening all 24 team-1 references, empty/reset, keyboard reaching Close, Escape close/focus restoration, phone menu open/Escape, stale/missing five-pair states, no missing-AI bars, public personal-data omission, public roster lacking member valuation, and reduced-motion editorial access.
- Default desktop, default 390 phone and open-editorial phone were visually inspected using temporary local screenshots. Phone first roster action is 44px tall and visible within 390×844 (top ~710px); root owns saved review captures.
- Styles contain only grayscale colors; portraits use `grayscale(1)`. System fonts; local approved logo/portraits only. No final illustration, visual theme or exhaustive polish.

Known limits: this is a static local fixture, not an authentication boundary or a live data adapter. Public omission is a presentation check. Production destinations are preserved as anchors but were not followed into a complete application flow. No physical phone, screen-reader, full browser-zoom or broad accessibility certification. Search across league team/manager/player references is complete; secondary sheet search covers its supplied source-row record rather than acting as global full-text search across closed evidence paragraphs. The global nav is a local study implementation, not a shared-shell proposal. No information inventory above is intentionally omitted; unconnected source families remain explicitly unavailable. Independent geometry review and any later visual treatment remain pending.

Files: `index.html`, `ledger.css`, `ledger.js`, this note. Work is confined to `wireframes/17/` and frozen after these checks.
