# Command index — bounded craft revision

Frozen for root's full-state evidence and Muse review. This revision lives only in `structural-revisions/11/`; the first source and inspection images in `wireframes/11/` remain frozen. This is a grayscale architecture study, not final artwork or acceptance.

## Contract retained

User question: “Where is the answer or next action for my league?” The primary action is still a large local query field followed by mixed team, player and task results. Empty search already prints the current incomplete pairing, known 0.0/Pending, member modeled total and coverage, directory inventory and actual first saved AI choice. Selecting a result expands an answer in that result's document position. No chat, sidebar, pane grid or new backend has been introduced.

## Concrete craft changes

- Removed decorative result ordinals and their reserved column, the “11 / Command index” study badge, repeated “Task / local answer” and “Player / local context” tags, and the closing slogan. The result's actual name and fact explain what it is.
- Replaced the long default disclaimer with a compact, visible **Synthetic concept** native disclosure. Its expanded paragraph retains the synthetic current-data scope, Nov 12 fixture date versus today, dated October/editorial distinction, local-only search and non-auth fixture comparison. Repeated synthetic labels in ordinary answer chrome were removed; actual source evidence/messages remain intact.
- Removed negative tracking from headings, brand, query, result names and modeled values. Body, heading and data type now use explicit local font roles with natural letter spacing.
- Removed header/result/footer rules and row separators from rosters, standings, faces, predictions, directory and editorial. Whitespace, alignment, source periods and native disclosures provide grouping. The query underline and native control boundaries remain functional; probability bars still encode supplied values.
- Kept real match counts, result pagination, current/incomplete/pending states, coverage, computed/source periods, draft state and source disclosures. Cleanup does not substitute vague badges for data.

## Local semantic roles

`style.css` defines and uses `--font-body`, `--font-heading` and `--font-data`. Numeric consumers keep tabular figures through the data role. The system font family is local; no runtime font request occurs.

Color roles are `--color-canvas`, `--color-text`, `--color-secondary`, `--color-focus`, `--color-control`, `--color-control-surface`, `--color-probability` and `--color-probability-track`. Every authored color declaration consumes these roles; all are neutral grayscale. They belong only to this revision and do not modify production tokens or impose a shared template.

## Desktop and phone navigation

At 1440, the same single open index aligns names, useful facts and Open/Close. Expanded answers indent modestly beneath their origin. The query remains the largest input, without another panel around it.

At 390/320, GOAT is the Home link and **Stocks / Search / Tools** form a compact masthead. Home, News and all other destinations are also present in Tools; no destination is lost. Search focuses the existing field and brings it into view. Each open answer has **Change search**, which preserves the current query/filter/sort, and **Back to results**, which restores the originating result and focus. The two first default entries fit the inspected 390×844 viewport.

Result facts move beneath their names; the answer uses the full phone canvas. Matchup sides become sequential records; roster identity/position/NBA and values remain legible; standings retain rank/W/L/PF. Filters and native Order remain explicit rather than hiding behind a search icon. No sticky panel or internal scroll container is used.

Browser Back/Forward is now an actual local navigation path: a submitted query/filter/sort and an opened answer produce history states. Back closes the reader into its prior results, retaining the query and focused result; Forward reopens it. Directory query, sort, open roster disclosures and scroll/focus state are included. Shareable local `q`, `type`, `order` and `open` parameters preserve the existing `view`/`ai` parameters. Typing itself stays immediate and does not generate one history entry per keystroke. No history handling intercepts real destination links.

## Facts and destinations retained

The import remains `{inventory,data,mode,aiState,esc,money}` from `../../data.js`. Common data and first-source files were not changed. The detailed family map in the frozen [first structure note](../../wireframes/11/STRUCTURE.md) still applies:

| Family | Reachable revision answer |
| --- | --- |
| Current week | First action; both teams/managers/current records, Week 3, scores, Incomplete and all-five pairing disclosure |
| Member team | Your roster, priced; identity/standing/count/actions, modeled FAAB basis/time/coverage, top three and all 24 prices, unavailable history |
| Scouting | Check your player form; supplied watch/best/rough rows, points/GP, distinct basis and exact completed-week coverage/source period |
| League directory | Find a team or player; all 10 managers/teams/records/opponents and 228 unique player references with position/NBA/profile; query and sort |
| Saved AI | All five actual returned choices/probabilities, separate confidence, status/time/model/prompt/input/evidence. The first away choice remains 35%, other 65%, confidence 20%. Stale/missing are explicit. |
| Faces and standings | All 10 supplied franchise faces/values/profile links; all 10 rank/W/L/PF values using pointsFor / 100; Power honestly unavailable |
| Dated editorial/archive | Coherent `data.archive` entries: Oct 5–11 upcoming 1/5 and Sep 28–Oct 4 historical final 5/7; all three spotlights/stats/opinions/selection/source periods and checked dates; both permalink routes and happenings |
| News/moves | Supplied member team headlines plus deduplicated league moves and their exact dates/weeks/types/details; public excludes the personal wire |
| Navigation | Home, `/intel`, `/stocks#player-board`, `/history`, `/arcade`, `/ai-decides`, `/teams`, `/transactions`, `/trade-analyzer`, `/weekly`, `/arcade/free-throw`, and member `/team` plus `/teams/1#team-roster`; public/member comparison |

The conflicting `home.edition.game.teamIds` is still unused for dated narrative. Current Week 3 is taken from the directory/personal pairing; dated stories exclusively use the coherent archive. Previous-manager attribution for NeuralNets/QBs Gremlins stays visible. Unquoted player references do not receive invented prices; unavailable history/Power do not receive invented charts/ranks.

## Hooks and motion

The ready marker remains `body[data-study-ready="11"]`. `window.goatStudy` exposes the same eight state IDs: `default`, `week`, `roster`, `search`, `directory`, `predictions`, `edition`, `league`. Each selects real content and scrolls to the reader for capture. Other commands remain discoverable in the default action index. Root owns full-state captures.

This bounded pass remains instant: no timers, animation, scroll reveals or decorative loops. Live reduced-motion changes retain every view/control. A future approved expansion transition would only explain the selected result's added context; keyboard and frequent query/filter actions stay immediate. The current instant reader is the still equivalent.

## Applied references

This retains the already-read project design skill and supplied craft notes. Elayadesign's symmetry/sidebar diagnosis informed removal of unnecessary enclosure; Hallmark's architecture fingerprint keeps query/results as the full experience rather than a novelty intro; MoMA's indexed-collection principle keeps direct names ahead of incidental context. `pbakaus/adapt` informs the phone Search/Change search/return flow. Rauno/Emil continuity informs result-origin expansion plus real Back/Forward restoration. Addy's accessibility guidance informs native controls, visible focus, target checks and separately tested enlargement/reflow. No source scripts were installed or executed.

## Actual bounded verification

Installed local Chromium through Playwright, static server on port 4207. `checks.json` records the results and final source hashes. `node --check app.js` passes.

- All eight states fit 1440, 390 and 320 CSS pixels; all eight fit 320 with root text at 200%. No browser page errors.
- Real empty → submitted `Reaves` search → Austin Reaves answer → Change search → browser Back → Forward → Back to results → empty. Query and trigger focus restore. The no-match state returns to the useful index.
- Player filter reports 228; Name A–Z starts with Aaron Gordon; Show more produces 50 real results. Directory has 10 teams and 228 roster references; `Jokic` finds Jokić; directory query/sort/roster disclosure survive Back from another answer.
- All 24 member values, $1095.25 modeled total, 24/0 coverage, known-zero/Pending/Incomplete distinction, all five AI choices/provenance and the 35/65/20 fields checked.
- Three dated spotlights and coherent 1/5 archive narrative checked. Full required destination href set retained. Public omits private task/action entries; stale has five labeled rows and missing has zero in both public/member fixtures.
- Escape restores the originating result's focus. Live reduced-motion changes retain the reader. Default 320px visible controls meet 44×44 target dimensions. Source has no result ordinals.
- Original `index.html`, `style.css`, `app.js` and `STRUCTURE.md` hashes still match the first frozen `checks.json`. Original images were not edited.

Two bounded inspection images (`desktop-check.png`, `phone-check.png`) belong to this revision. They do not replace root's full-state evidence or Muse review. Real Next.js routes/auth/live providers, physical-device and screen-reader behavior, complete contrast/target audit and final independent acceptance remain unverified. No final artwork or full visual polish was attempted.
