# 11 — Command index

Stage one, grayscale structural prototype. Frozen after the checks below; this is not final visual acceptance. No production/shared files, providers, installs, Git actions or other authors' work were used or changed.

## Surface contract

**User question:** “Where is the answer or next action for my league?”

**Primary action:** type a player, team or task into the prominent local search field, then open its context in the result itself. The empty query is useful: current Week 3 pairing, known 0.0 versus Pending, member modeled FAAB total/coverage, directory count, the actual first saved choice, and concrete task paths are printed in the index.

**Relevant states:** useful empty query; mixed results; one or several inline answers; team/player context; directory filtering and sorting; ready/stale/missing saved AI; member versus public; dated editorial; unavailable history/Power. Source fixtures are imported explicitly from `../../data.js` using `{inventory,data,mode,aiState,esc,money}`. All search is local.

**Narrow layout:** the query and results remain the primary workflow. A result's desktop title/fact columns become a title followed by its useful fact, with the same Open/Close control. Answers unfold at that row, using full available phone width. Matchup sides become sequential readable records; roster identity and position/NBA sit together beside the price; standings wrap W/L/PF beneath the team. The comparison switch moves to the footer on phones, leaving GOAT/Home/Stocks/Index in one compact masthead. Every destination remains in the Index answer.

**Forbidden patterns:** chatbot conversation, provider request, task sidebar, pane grid, hero followed by repeated dashboard cards, floating task rail, invented model/ranking/history, anonymous values, motion that delays frequent search or obscures essential text.

## Geometry and navigation

Desktop 1440: open page with a compact masthead, a large underlined query field, result-type filters, and a single numbered typographic index. Titles and current facts align across the canvas. There is no persistent sidebar, split inspector or card wrapper. The small rule tracks an index entry; it is not a panel boundary.

Phone 390/320: the masthead compresses, search occupies its own full-width line, and explicit Clear/Find controls sit beneath the input. Filters wrap naturally, sort remains a native labeled select, and result facts sit under names. Expanded answers use the canvas rather than an offscreen overlay. No modal, internal scroll pane, drag or hover requirement exists.

Search checks every query word across names, facts and task keywords. Direct title matches rank before keyword/context matches, so `Reaves` leads with Reaves Dropper and Austin Reaves, then related tasks and roster context. Teams/Players/Tasks filters and Name A–Z work independently of the query. Results show 25 initially with a real Show more control; no inventory is discarded. Directory search separately finds team, manager, player, position or NBA abbreviation; its sort offers standing/name/roster count.

Opening a result leaves the query and surrounding results in their document positions. Opening another result preserves the already-open reader and its native roster disclosure. Close and Escape return focus to the originating result. Enter in search moves focus to the first result. Native details hold secondary inventory and sources. Back/Forward are browser behavior for real destination links; no app router/history emulation is claimed.

## Capture states

`body[data-study-ready="11"]` is set after initial render. `window.goatStudy.states` exposes the following eight IDs. `activate(id)` selects real content synchronously, returns a resolved Promise, and scrolls nondefault states to their actual result/answer so a viewport capture shows the chosen state.

| State | Actual view |
| --- | --- |
| `default` | Empty-query useful action index at page top |
| `week` | Current incomplete pairing, both managers/records/scores |
| `roster` | Member complete modeled-value answer; public team-1 context |
| `search` | Mixed `Reaves` results with Austin Reaves's context open |
| `directory` | Full ten-team directory with reachable full rosters |
| `predictions` | All five saved AI rows with provenance disclosures |
| `edition` | Coherent Oct 5–11 draft and all three sourced spotlights |
| `league` | All-ten standings and franchise-face answers open |

Other real views remain directly discoverable in the default index: `form`, `wire`, `faces`, `archive`, `history`, and `tools`. They use the same row-local expansion, not separate layout templates.

## Content map and factual handling

| Information family | Reachable place and retained fields |
| --- | --- |
| Identity and actions | GOAT Hoopers masthead; Home, News `/intel`, Stocks `/stocks#player-board`; Index/“Open a tool or destination” includes History, Arcade, AI Decides, Teams, Transactions, Trade analyzer, weekly archive, existing Free Throw, and member `/team` plus `/teams/1#team-roster`. Public/member comparison is a real query link. |
| Current week | First action: member's own pair, or public directory's first pair. Both team names, managers, current records, Week 3, known scores versus Pending, and Incomplete. Native disclosure retains all five current pairs. |
| Saved AI | “Read the five saved picks”: all five returned choices, both returned probabilities bound to names, independent confidence, generated time, model, prompt, input/slate snapshot availability, league/season/week/roster IDs, input and returned evidence. First actual choice is Ware the Hoes At? at 35%, other team 65%, confidence 20%; no probability argmax substitution. `?ai=stale` visibly retains stale rows; `?ai=missing` shows unavailable and zero rows. |
| Personal team | Member-only “Your roster, priced”: identity/manager/record, standing, roster count and team/roster actions, complete modeled FAAB total, priced/unpriced coverage, calculation time, in-season pricing basis, top three values/model movements, all 24 roster prices with positions/NBA teams, honest missing recorded history. Public rendering omits this task, personal form and personal news. |
| Form and evidence | Member-only “Check your player form”: all three watch rows, observed 8 GP, EMA FP/G basis, unknown availability notes, source limitation; all best/rough rows with fantasy points and GP, exact completed Week 2 date bounds, five eligible-player coverage, overlap/DNP/unknown exclusions and synthetic/official-week caveat. |
| League identity | “Find a team or player”: all ten team identities/managers/current records/current opponents and scores, previous-season record/finish with roster 8's QBs Gremlins previous-manager note, profile/roster links, all 228 unique roster references with player profile, position and NBA team. Direct player/team search also opens the same kind of local context. |
| Faces | “Meet the franchise faces”: all ten supplied face players, grayscale approved local portraits, position, team/profile/player links and modeled value. 2025 champion label stays attached to its source franchise. |
| Standings | “See where the league stands”: all ten rank/W/L/PF, explicitly `pointsFor / 100`. Power is honestly unavailable; no fake ordering is added. |
| Editorial | “Read the dated league edition”: `data.archive[0]`, Oct 5–11 draft, 1/5 upcoming matchup, exact context/selection reason, three complete spotlights with source stats/opinions, NBA versus college periods, dated roles and selection notes, checked source dates, source URLs, happenings, publication and bounds. Current roster owner is separately identified in each source disclosure. |
| Archive | “Browse the weekly archive”: both dated draft entries, stable `/weekly/2026-W41` and `/weekly/2026-W40` links, period/publication state, coherent 1/5 upcoming and 5/7 historical final 326.0–251.5. Full corresponding sources/happenings are retained. |
| News and moves | “Catch up on news and moves”: member's two supplied team headlines/outlet/date plus three unique league sample moves, team links, week/type/date, supplied empty add/drop details and personal relevance marker. Public has league moves only. Dated editorial happenings remain separately dated in the edition. |
| Honest absence/provenance | “Check recorded value history” and standings/roster answers print the supplied unavailable messages. Footer explicitly identifies synthetic current records/scores/prices/form/news/moves/AI, Nov 12 fixture date versus actual today, dated October draft distinction, local-only search and non-auth fixture comparison. |

Known fixture conflict: `home.edition.game.teamIds` (1/2) disagrees with its dated prose (1/5). That object is not composed into a result. Dated narrative exclusively uses the coherent `data.archive` entries; current Week 3 exclusively uses directory/personal matchup data. Common facts were not edited. The dated narrative's “season has not started” remains inside its explicitly dated October draft context.

## Applied supplied references

The local `.agents/skills/goat-hoopers-design/SKILL.md` and its visual-hierarchy, navigation-accessibility and motion references were read, along with homepage architecture/design sections. The QA exception permits this architecture without changing production tokens or its approved court composition.

The supplied `reference-notes/craft.md` changed the structure in concrete ways:

- Hallmark custom direction/macrostructure: the visitor job governs the whole composition. The query/result model carries rosters, editorial and saved AI through the same local reading mechanism; it is not a novelty top section above a dashboard.
- Elayadesign redesign: break equal-card symmetry and question a default left sidebar. Open type, row-local expansion and useful empty state replace both; context and explicit return controls stay with the originating result.
- MoMA indexed-collection principle: names and tasks are first-class entrances into one usable collection. Direct title matches outrank incidental roster context.
- `pbakaus/adapt`: preserve the task on phone rather than scale desktop columns down. Current facts move under the result name, answer width becomes the canvas, and detailed roster fields reflow around identity.
- Rauno / Emil Apple-design continuity: opening originates in the selected result and keeps adjacent choices in the same document. No detached inspector or modal consumes orientation.
- Addy accessibility: native labeled controls, actual buttons/links, visible focus, Escape/focus return, type/sort/result counts, no hidden interactive layout copies, and separately measured 320px/200% reflow.

## Motion job and still equivalent

Stage one is deliberately immediate: no animation, timer, observer, autonomous reveal, smooth-scroll or decorative loop. Essential content is present as soon as its native reader opens. Live reduced-motion changes retain the same answers and controls.

For a later approved visual build, the one candidate is a short, interruptible expansion at the selected result to explain where the new answer belongs. Frequent typing/filter/sort and keyboard navigation stay immediate. Reduced motion uses the current instant reader; no information or focus behavior depends on the transition. This follows the supplied pbakaus/Emil purpose-and-frequency gate, not a blanket entrance treatment.

## Verification and remaining limits

Actual local Chromium/Playwright checks are recorded in `checks.json`; source syntax checked with `node --check app.js`. All eight states fit 1440, 390 and 320 CSS pixels; all eight also fit 320px with root text at 200%. No page errors. Verified mixed direct-name ranking, ten teams/228 roster references, directory query/sort, 24 member values, all-five saved choices/provenance, 0.0/Pending/Incomplete distinction, preserved unrelated disclosure, Escape focus return, public personal-task omission, coherent draft/three spotlight stats, stale five-row and missing zero-row AI, and live reduced-motion parity. Two bounded inspection images are `desktop-check.png` (default) and `phone-check.png` (mixed result viewport); root owns comparison/bulk captures.

No information-family inventory is abridged; result pagination and native disclosures defer initial exposure. Deep player data not supplied in the fixture is not fabricated; non-face, non-member players correctly have no supplied quote. Current fixture league-stat leaders/streaks are null and are not presented as achievements. Real app destination definitions were inspected in source; this static server does not establish Next.js routing/auth or live source behavior. Screen-reader, physical-device, complete contrast audit and final independent geometry acceptance remain unperformed. No final art or exhaustive polish has been attempted.
