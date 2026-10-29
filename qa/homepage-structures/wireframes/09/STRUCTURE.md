# Study 09 — Season journey

Stage one is frozen as a working grayscale architectural prototype. This is not full visual or product acceptance. Only this study's four files were authored; no production, shared data, Git, provider, package or other study was changed.

## Design contract

- **User question:** Where are we in the season, and which evidence or action should I follow from here?
- **Primary action:** Choose a route stop; read its adjacent content or follow a real destination.
- **States:** current Week 3 fixture; two dated archive drafts; all saved AI decisions; member team / public league faces; searchable league register; working tools and moves; unavailable continuation.
- **Narrow layout:** a vertical winding route of alternating, flowing navigation stops, followed by the selected reading surface. The explicit Stop index and Read selected stop action allow direct access without tracing the path. Selecting a route link focuses and scrolls to its reader on phones.
- **Forbidden patterns:** a scenic route above a repeated dashboard; cards inside circles; fabricated dates/results/price history/power rankings; drag-only access; hidden essential content; color-dependent selection.

## Geometry and navigation

At desktop 1440, the left half is a persistent branching route diagram. The dated archive spine joins the current junction; current-week jobs branch to saved picks, team, league and tools. The right half is a full, unboxed reading surface. Readers use prose, score lines, rosters, tables and native disclosures appropriate to each stop, rather than a common card grid. The diagram remains available while a long reader is explored.

At 390 and 320, the route becomes a flowing vertical winding path, with alternating stop positions and curved connecting segments. Stop height follows its text, including enlarged text. It is a navigation diagram: stop labels select separate substantive views, not a timeline feed of repeated content sections. The diagram precedes the reader in normal document flow. The explicit Read action above the diagram is the shortcut to the default current-week reader. No fixed chrome or internal reader scroll area is used. Primary navigation wraps; an open League tools disclosure participates in normal phone flow.

The reader changes on route-link activation or Stop index selection. Route links update the URL hash and move focus to the reader heading. Browser Back/Forward reselects the matching stop. The model/provenance and roster readers are native nonmodal disclosures. Escape closes League tools and restores its summary focus. Home and the brand retain the current public/member fixture mode. The comparison link deliberately changes mode.

This is more than a reskin: the route is the information architecture, the archive is part of its spine, branch selection changes the complete reading task, and the phone navigational geometry differs from desktop. The default view is not a hero followed by a dashboard.

## Content map

| Stop ID | Reachable content and actions |
| --- | --- |
| `current` — default | Week 3 own pairing for member, fixture pairing for public; both team names/profile links/managers/current records; known 0.0 versus Pending; incomplete status; receipt timestamp and synthetic caveat; direct branches to the other jobs. |
| `archive-40` | Coherent `data.archive` 2026-W40 sample draft; Sep 28–Oct 4 dates; verified 2025 final between teams 5/7, supplied scores and prose; selection reason; happening with previous-manager attribution; all supplied source references/dates; stable `/weekly/2026-W40` route. |
| `archive-41` | Coherent `data.archive` 2026-W41 sample draft; Oct 5–11 dates; upcoming opening-week teams 1/5; all three complete player spotlights with exact statistics, opinion, period, selection reason, source URL and check date; all happenings/sources; both archive stops; stable `/weekly/2026-W41` route. |
| `picks` | All five saved AI rows; team identities, managers, records and current incomplete scores; exact returned choice, both probabilities, separate confidence; saved time, model, prompt version, input/slate snapshot unavailable state, message and evidence; `/ai-decides`. `?ai=stale` explicitly labels stale outputs. `?ai=missing` removes outputs and explains unavailability. |
| `team` — member | Team/manager/current record/standing/24-player count; `/team`, `/teams/1#team-roster`; modeled FAAB total and basis, pricing time, 24/24 priced coverage, 0 unpriced, modeled value rank; top three including supplied modeled changes; complete 24-row valuation disclosure; unavailable recorded history; three form watches with sample sizes/basis; three best and three rough completed-week rows with points/GP/exact period/coverage and overlap/DNP caveat; both news items and the supplied own-team move. |
| `team` — public | Ten supplied franchise faces with player profile, team profile, position, modeled value, and supplied champion qualifier. No personal valuation, form, team wire or member actions are rendered. |
| `league` | All ten franchise anchors in a disclosure; useful local team/manager/player search and stable team sort (standing/name/roster size); complete ten-team directory with current record, manager, Week 3 opponent and incomplete scores; all 228 unique player references with position and NBA team in reachable roster disclosures; previous-season records/finishes with the NeuralNets previous-manager qualification; all ten standings rows with rank/W–L/PF divided by 100; honest Lineup Power unavailable state; real team/profile/roster routes. |
| `tools` | Real Stocks `/stocks#player-board`, trade analyzer, Arcade, implemented `/arcade/free-throw`, News `/intel`, Transactions routes; all three supplied synthetic league moves with date/week/type and honest empty-player-leg explanation. |
| `beyond` | Explicit absence of a next supplied edition or future outcome; recorded team-value history unavailable; Lineup Power unavailable; real History and weekly archive destinations; return to known evidence. |

GOAT identity, Home/News/Stocks/History/Arcade, League tools, Teams/Transactions/AI Decides/trade analyzer/weekly archive, member account action, public/member comparison, and footer provenance remain reachable in both geometries. The only imagery used is the approved local portrait map, filtered to grayscale. No external runtime resource is requested.

## Factual handling and bounded inventory

Current records, scores, prices, form, moves, news and model outputs remain visibly synthetic. The Nov 12 receipt is explicitly identified as fixture time, not today. A known score of zero renders `0.0`; null renders Pending. Scores never imply completion. The first AI row returns the away choice at **35%**, even though the other team has 65%; confidence remains a separate **20%**. Missing snapshots are labelled unavailable, not fabricated.

The preserved `home.edition.game` conflict is not rendered: its team IDs 1/2 contradict its narrative 1/5. The route instead reads the internally coherent `data.archive` entries: W41 upcoming 1/5 and W40 historical final 5/7, with date/draft/source qualifications intact. Common fixture data is unchanged.

Stage-one abridgements are limited to ancillary/raw fields rather than the required content families: null hub leader-stat placeholders are not shown; season playoff-count/start-week settings are not given a separate view; null directory opener/latest-move/recent-move placeholders do not generate rows; directory featured-player ID arrays are not separately highlighted; raw source IDs are represented through their profile links. The personal AI duplicate is represented by its corresponding complete saved-pick row. No deep player detail is invented. All supplied roster references, 24 member values, ten faces, ten standings, five AI rows, two editions and three W41 spotlights are reachable.

## Applied craft and motion

Read the repository Goat Hoopers design skill and its visual-hierarchy, navigation-accessibility and motion references, the homepage architecture/design sections, the study brief/assignment and supplied `reference-notes/craft.md`.

- **Hallmark custom direction / macrostructure:** the season-route idea governs the complete experience, including archive, tools, lookup and phone navigation. It changed the actual navigation and reading model, not just the opening treatment.
- **Elaya redesign:** breaking equal-card symmetry led to open adjacent readers, compact score lines, native inline expansions and distinct working lists. Content and source qualifiers survive the redesign.
- **pbakaus adapt:** phone changes the navigational geometry and uses flowing route stops; it does not shrink a desktop diagram or stack dashboard cards.
- **Rauno / Apple spatial continuity:** the selected node stays visibly marked, the reader shares its stop code, and direct return branches preserve orientation.
- **Addy accessibility / project navigation reference:** real links/buttons/selects, explicit stop index, visible native focus, 44px phone action targets, no drag/hover dependency, honest local-fixture evidence and separate reflow/text-enlargement checks.
- **Emil / pbakaus animate:** stage one is intentionally still, with immediate selection/focus. The later full-stage motion thesis is one brief, interruptible connector emphasis from the selected origin stop toward its reader to explain a branch change. Routine keyboard selection stays immediate; reduced motion retains the same active marker, stop code, reader and focus with no movement. No entrance blanket, autoplay or new dependency is proposed.

## Actual checks and limits

Local Chromium via installed Playwright, served from root's port 4207; no installation or provider access:

- Both member/public modes, all eight selected states, at 1440/390/320 CSS px and at 200% root text at 1440 and 320: **80 expanded-reader cases**, no page overflow and no browser page errors. All reader disclosures were opened for these checks. The final phone-only header/link adjustments were rechecked across all eight states at 320 with 100% and 200% root text; no overflow.
- Expanded League tools checked for overflow at all five size/text configurations, with Escape returning focus to its summary.
- Rendered inventory: ten directory teams, 228 player references, ten standings, 24 member valuation rows and five saved AI rows.
- Search `Embiid` returned one team/one player; alphabetical sort started with Huff n’ Puff. Map click changed the URL hash and reader; Back restored the current reader. Keyboard Enter on a route stop focused `reader-title`.
- Public `team` view had zero personal valuation nodes; activating Home retained `?view=public`. Stale/missing AI states showed explicit stale/unavailable copy. First ready row retained the away choice, 35% returned probability and separate 20% confidence.
- Live reduced-motion emulation retained route selection and all five AI rows. There are no authored animations, timers or requestAnimationFrame loops.
- Desktop and full-page 320/390 local renders were visually inspected. Root owns deliverable bulk captures; no capture infrastructure was added.

Limits: these are standalone local-fixture browser checks. No production Next build, live/authenticated service, external destination, physical device or screen-reader pass was performed. The fixture mode is not an authentication boundary. The complete phone overview is intentionally taller than one screen; Read selected stop bypasses it. Full art, final motion and independent geometry acceptance remain pending the structure gate.

## Capture API

`document.body.dataset.studyReady === '09'`.

`window.goatStudy.states` lists all eight stop IDs above. `window.goatStudy.activate(id)` immediately selects the actual reader and active map marker, then resets natural page scroll to the map origin; it returns a resolved Promise with the selected ID. Phone captures of substantive reader content can use a full-page capture or activate the visible Read selected stop button. This hook does not substitute screenshots or synthetic markup for a state.

Source files: `index.html`, `style.css`, `app.js`. This note is the fourth deliverable. Frozen after verification; full art awaits the geometry gate.
