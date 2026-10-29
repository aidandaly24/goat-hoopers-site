# League ledger — bounded craft revision

Frozen for root's full-state evidence and independent Muse review. This is a grayscale structural revision, not final artwork or production acceptance. Only this `structural-revisions/17/` folder was written. Original `wireframes/17/` source and images remain unchanged. The implementation still explicitly imports `{inventory, data, mode, aiState, esc, money}` from `../../data.js`; no facts or fixtures were added or changed.

## What changed

- Removed the decorative study number, tracked uppercase folio and tightened title tracking. No decorative section IDs, fabricated badges or ornamental type remain in the rendered flow.
- Kept one useful result count instead of repeating counts in every category label. Removed the desktop record cell's duplicate year/rank; the real rank column remains, and phone standings retain a labelled rank.
- Combined the member marker with the manager line. Your pairing, champion, source periods, units and unavailable/stale labels remain where they convey facts.
- Replaced boxed row actions with simple underlined buttons. Removed the masthead, category, result-strip and reader-guide divider layers. Real table header/body rules and functional native input/select boundaries remain useful for row tracking and operation.
- Rebuilt this study's stylesheet around local semantic `:root` font, type-size, weight, color, reader, rule, control and focus tokens. No shared renderer/template, production style change, new typeface, image or artwork.
- Retained the phone Sheet/Fields model. The first useful roster action stays visible at 390×844 and 320×844, and fields continue to change the labelled record itself.
- Added explicit history snapshots for sheet, sort, field and row changes. Browser Back/Forward restores query, order, selected fields, open readers, focus and actual departure scroll. Profile and edition-comparison links stay ordinary links. Comparing member/public editions preserves `ai=stale` or `ai=missing`.
- Fixed a reader-close edge case: a roster automatically opened by player search can now be closed while that query remains active. A render no longer silently reopens it.

## Contract and geometry

**Question:** What is happening across the league, and what roster or source explains a row?

**Primary action:** Search or sort the sheet, read across the aligned columns, and open an inline roster/evidence reader. Profiles and existing tools remain distinct links.

Desktop uses one continuous full-width ledger: rank, franchise/manager, W–L, PF, current opponent/score, league face/modeled FAAB, and details. Category controls replace the active sheet rather than appending dashboard sections. Readers are true table subrows in a quiet gray surface with comfortable paragraph width, not independent cards. There is no hero, card grid or sidebar.

At 56rem and below, a native Sheet select chooses League, Matchups, My evidence, Dated editions or Moves & tools. Rows become labelled records. Identity and roster/brief actions come before the chosen fields. The sticky Fields chooser exposes Week 3, standings, faces or all fields. No horizontal-table squeeze or page scrolling is required. Source and roster tables also become labelled records. At enlarged sizes controls and title wrap naturally. The site menu is a normal-flow native disclosure; Stocks remains direct.

Frequent actions remain immediate. No authored animation, timer, autonomous loop, scroll observer or new library. The later motion candidate remains a short interruptible row expansion to explain reader position; keyboard and reduced-motion paths must be immediate with identical final content. This is a future proposal, not implemented animation or permission for a full build.

Forbidden patterns remain hero-plus-cards, sidebar dashboard, clipped names/paragraphs, fictional history/power, converting null into zero, changing a returned AI choice to the larger probability, personal rendering in public mode, and gesture/hover/motion-only controls.

## States and return behavior

The same `document.body.dataset.studyReady='17'` and `window.goatStudy={states,activate(id)}` are preserved. Activation resets to the Week 3 phone field choice for repeatable root captures.

| Hook ID | Representative view |
| --- | --- |
| `default` | Closed league sheet, all ten teams |
| `league` | Closed league sheet, same real row inventory |
| `roster` | Team 1 complete roster subrow; member values only in member mode |
| `matchups` | Five current pairs, first saved AI receipt open |
| `evidence` | Member evidence with form and completed-week readers open |
| `editorial` | Both archive records, first full dated edition open |
| `moves` | All supplied moves and real tool destinations |
| `search` | Embiid search and complete matching roster |

Public rendering omits the evidence state and personal actions/content. Native controls reach other readers, all field choices and empty search. Close and Escape return focus to the originating row trigger. History snapshots preserve the active controls and their values; an actual departure through a roster player's link followed by Back restores that specific link and the departure scroll.

## Preserved content / applied source map

| Family | Reachable place and retained fields |
| --- | --- |
| League and standings | League sheet: all 10 teams/managers, current W/L, true supplied rank, `pointsFor / 100`, opponent/manager/record, Week 3 score and incomplete status. Member row/pair marked; known 0.0 and null Pending stay separate. |
| Faces and directory | All 10 `data.faces` records with player/team profile links, position, modeled FAAB value and approved local grayscale portrait when present. All 228 unique roster references remain reachable with full name/profile, position and NBA team. Team/manager/player search, rank/name/PF/roster-size sort remain. Prior-season records and NeuralNets/QBs Gremlins attribution remain in the full roster; closed NeuralNets row retains the ownership warning. |
| Personal valuation | Your brief and My evidence: identity, manager, standing, 24-player count/actions, supplied $1095.25 modeled total, 24/24 coverage, 0 unpriced, basis/time, value rank, top three values/changes and all 24 exact roster values. Public omits the personal edition. |
| AI, all five | Matchup sheet and source subrows: returned choice, both returned probabilities, separate confidence, saved timestamp, model/prompt, league/season/week/team identity, null input/slate snapshots, evidence and baseline. First choice remains Ware the Hoes At? at 35%, other team 65%, independent confidence 20%. Stale stays labelled; missing remains unavailable with no fabricated probabilities. |
| Form/completed week/news | My evidence retains all watch rows and observed-game sample/basis/message; all best/rough list rows, points/GP, exact Week 2 source bounds, verified five-player coverage and exclusion/overlap caveats; both news references/outlets/times and the member move/type/week/time with absent player legs. These stay synthetic examples, not official current awards. |
| Dated editorial | Both coherent `data.archive` entries retain ID, date/bounds, draft/unpublished status, actual edition route, pair/state/scores where supplied, narrative/context/selection reason, every spotlight statistic/period/opinion/selection/source/check date, all four happenings across the two entries, and every source link/date. Readers use comfortable paragraph measure. |
| Moves, tools and unavailable sources | All three league move records retain summary/type/week/time/leg counts. Existing Stocks, trade analyzer, free throw, Arcade, AI Decides, News, Teams, Transactions, History and weekly archive destinations remain. Recorded team-value history and Lineup Power explicitly stay unavailable. Compact Synthetic concept disclosure expands the full fixture provenance; footer retains modeled FAAB and null/zero meaning. |

Current Week 3 comes exclusively from the directory's current matchups. The conflicting old `home.edition.game` 1/2 IDs are not combined with its 1/5 dated prose. Dated readers use `archive` 2026-W41 upcoming 1/5 and 2026-W40 historical final 5/7. Fixture source is unchanged. Nov 12 is labelled as fixture time, not today's date.

The supplied Hallmark custom-direction/macrostructure principle still governs the whole experience: ledger navigation, geometry and reveal remain one architecture. Elaya's removal of automatic sidebars/equal cards supports inline readers; pbakaus adapt supports the phone field task; Addy accessibility supports labelled native controls/focus/real Back checks; Emil/pbakaus frequency and purpose gates keep the working sheet immediate. This revision applies those notes through reduced ornament and explicit return state, not a new common visual template.

## Targeted verification

Installed Chromium/Playwright against root's existing port 4207 server. No installs, production builds, Git operations or external data/provider calls.

- `node --check ledger.js` passed.
- All eight member hook states rendered at 1440, 390 and 320 CSS px, each with 100% and 200% root font size: 48 cases, no full-page horizontal overflow or page errors.
- Twelve inventory/render assertions passed: 48-case overflow check; 228 references/228 unique; all 24 member values match fixture exactly; ten faces; five pairs; returned 35% pick/20% confidence; all five receipts; known zero/null/incomplete; all archive happenings; all spotlight opinion/period/selection text; both archive routes; no browser errors.
- Twenty-eight actual interaction/return assertions passed: face/all field selection and hiding, name/roster-size sorting, player search/full roster, phone Sheet navigation, Back restoring query/order/fields/open reader, Forward, Close during active search, trigger focus, Back reopening reader, actual player-link departure/Back retaining row/link focus/actual departure scroll, empty/reset, reader Escape, phone menu/Escape focus, stale/missing five-row statuses, missing AI without bars, public comparison retaining stale URL, public personal omission, public roster without personal values, reduced-motion narrative and no page errors.
- Default desktop 1440, phone 390 and phone 320 were visually inspected with temporary local screenshots. No saved shared evidence/image changes; root owns the full-state captures and Muse review.

These are bounded browser checks, not screen-reader, physical-device, full browser-zoom or live-auth certification. The profile return check really leaves the study at `/player/1444` and returns through browser history; the static QA server does not implement the production profile and responds with its local missing-route page. This verifies return context, not the production profile flow. Public fixture presentation is not an auth boundary. Secondary sheet search remains source-row search rather than global full-text search of every closed paragraph. Final art, comprehensive device/accessibility review, full-state root evidence and independent Muse acceptance remain pending.

Deliverables: `index.html`, `ledger.css`, `ledger.js`, this note. Original study and images remain unchanged; revision frozen after the targeted checks.
