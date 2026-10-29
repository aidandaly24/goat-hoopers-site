# Study 15 — Week planner

Stage one grayscale architectural prototype, frozen for independent geometry/navigation review. This is not a final visual implementation or acceptance claim.

## Surface contract

**User question:** What belongs to this week, what came earlier, and what can I act on for my team?

**Primary action:** Select a supplied source period, then open a scheduled item in its attached agenda. The member's current pairing is visibly marked. Team/player lookup and tools remain direct workspace destinations.

**Default desktop geometry:** A source-week schedule matrix, with a row-label gutter, the two actual dated archive periods, an explicit intervening-source gap, the supplied member completed Week 2 period, and current Week 3. The first lane contains all-day dated editorial; the second holds dated evidence; five separate current matchup lanes follow. Choosing an item inserts its agenda immediately below its lane across the matrix, leaving the source and surrounding lanes present. There is no permanent dashboard sidebar and no dashboard section sequence below the calendar. The current column starts selected; another source period can be selected in the labelled date/week control.

**Default phone geometry:** Agenda-first. A labelled source-period select and Agenda / Calendar control precede the selected period's context strip. Agenda presents actionable items for that period; Calendar shows the selected source column as a lane schedule. A selected agenda is retained when switching views and appears attached to its original lane in Calendar. The toggle does not reset the selected period or item. At 320px, all destination controls and text wrap; full-page horizontal scrolling is unnecessary.

**Relevant states:** No selected item; current matchup agenda; dated October editorial agenda; historical final archive agenda; member completed-week agenda; searchable/sortable league book; member notebook; tools/unavailable sources; public comparison; stale AI; missing AI. Public has no member notebook or personal completed-week column.

**Forbidden patterns:** Invented current week date bounds, fabricated events, date-based due tasks, a recreated hero/card dashboard below a novel calendar header, invented historical series or power ranking, guessing the AI choice from its largest probability, treating missing scores as zero, and exposing the member notebook in public rendering.

## Date and factual handling

- Only supplied dates/weeks are mapped. Archive 2026-W40 occupies Sep 28–Oct 4; archive 2026-W41 occupies Oct 5–11. Both are explicitly unpublished draft samples.
- Member completed-week evidence supplies Nov 2 to Nov 9, 2026, end exclusive. Its column explicitly labels this source convention.
- Current Week 3 is labelled with the supplied Nov 12 source-check timestamp. Its start/end bounds are unavailable; no inferred Monday–Sunday span or individual game dates are manufactured.
- Saved AI has its actual Nov 10 generation timestamp in each provenance disclosure. That timestamp is not presented as the date a matchup starts.
- The visible gap is a source gap, not a claim that a game was cancelled. Calendar column widths are explicitly not elapsed-time scale.
- The preserved `home.edition.game.teamIds` conflicts with its narrative. This renderer uses the coherent `data.archive` records for dated editorial: W41 upcoming teams 1/5 and W40 historical final 5/7, 326.0–251.5. The common fixture remains untouched. Current Week 3 is derived independently from `home.directory[].currentMatchup`.
- Records, scores, form, news, moves, modeled FAAB values and AI are synthetic and visibly labelled. Dates are fixture dates, not today.
- Current known 0.0 remains separate from Pending. Every supplied current pairing is incomplete. Historical final language is confined to the archive's explicitly historical record.

## Navigation and state model

The top workspace switches among Week planner, League book, My team notebook (member), and Tools & references. Header links retain News, Stocks, AI Decides, Arcade, and an All destinations disclosure. The GOAT logo is a Home link preserving the public/member fixture choice. Teams, Transactions, trade analyzer, History, weekly archive and Free Throw have actual existing destinations.

Selecting an event uses ordinary buttons. The inserted agenda heading receives focus; Close agenda and Escape restore the originating visible event. The reader is nonmodal. No focus trap or overlay is used. The phone representation hidden with CSS is removed from the tab order; the two agenda representations have unique IDs. Native source/provenance and roster disclosures preserve context.

`window.goatStudy.states` provides eight member states: `default`, `matchup`, `edition`, `archive`, `completed`, `team`, `league`, `tools`. Public provides six, excluding `completed` and `team`. `activate(id)` synchronously selects actual content and resets the representative view to its top. Additional current pairings 2–5 use the same real agenda with their own records/AI; the dated wire uses its own agenda. Calendar/Agenda, period selection, roster disclosures and local search/sort are reachable through ordinary controls rather than additional capture IDs.

`document.body.dataset.studyReady = '15'` is set after the first render. Query modes: `?view=member`, `?view=public`, `?ai=stale`, `?ai=missing`.

## Content and applied source map

| Source | Reachable presentation |
| --- | --- |
| `inventory.assets.logo` | Recognizable local GOAT Home link; grayscale. |
| `data.home.directory[].currentMatchup` | Five separate schedule lanes; each attached agenda shows both team names, manager names, current records, scores, Week 3 and incomplete status. Member's pair marked. |
| `data.weekly.matchups[]` / generatedAt | All five actual returned choices, probabilities and independent confidence in the schedule / attached agendas. Timestamp, model, prompt, null input snapshot and supplied evidence remain in native disclosures. First away choice remains 35%, home is 65%, confidence 20%. Stale/missing modes suppress current probabilities. |
| `data.archive[]` | Both dated all-day editorial events and full attached readers. W41 reader includes all three spotlights with exact stats, opinion, period, source/check date, selection basis, all happenings/sources and archive route. W40 reader includes historical final/context and franchise-history happening/source. |
| `data.personal.summary` (member only) | My team notebook: identity, manager/current record/standing, roster count, `/team`, `/teams/1#team-roster`, modeled FAAB total/subtotal wording, pricing basis/time, priced/unpriced coverage, top three values/change, complete 24-player value disclosure, explicit unavailable recorded history. |
| `personal.playerGuide.watch` | Scouting watch rows with distinct EMA basis, values, 8 observed games, availability-unknown context and schedule-adjustment caveat. |
| `personal.playerGuide.best/rough/period/coverage` | Completed Week 2 agenda with every supplied best/rough row, points/GP, exact source period and five-player verified coverage. Lists can overlap; DNP/unknown are excluded. |
| `personal.news`, `home.hub.transactions` | Nov 12 source-check agenda: both supplied member news items with outlet and timestamp, all three league moves with week/type/timestamp. The member move is included in that same complete league list. Public receives only public league moves. |
| `data.faces[]` | All ten roster anchors integrated in their League book franchise rows; player/team links and modeled value. Approved portraits used only where locally available, filtered grayscale. |
| `home.directory[]` | All ten franchises, managers, current records/opponents; native roster disclosures preserve all 228 unique player references with position/NBA team and real `/player/:id` links. Visible local search matches team, manager and all roster player names. Sorting by rank, name or roster size is functional. |
| `home.hub.standings[]` | All ten League book ranks/W/L/PF; PF uses `pointsFor / 100`. The active member is marked without reranking. Prior-season record/finish is inside each roster disclosure; NeuralNets' summary says previous manager and the detail prints the QBs Gremlins attribution. |
| `inventory.missing.history/power` | Honest unavailable states in Tools & references; unavailable history also in the member notebook. No invented line or ranking. |
| Existing routes | Persistent header and Tools & references ledger preserve `/intel`, `/stocks#player-board`, `/ai-decides`, `/teams`, `/transactions`, `/trade-analyzer`, `/history`, `/weekly`, both `/weekly/:id` archives, `/arcade`, `/arcade/free-throw`; member actions above. No unsupported player query is appended to Stocks. |
| `inventory.warning/benchmark` | Visible synthetic fixture stamp and footer provenance / comparison mode. |

Stage-one abridgments are limited to nonessential DTO metadata and future integration: league IDs/roster IDs are not printed as primary content; tie/games-back statistics and points-against are not separate standings columns; null hub leader statistics are not turned into content. All required representative information families, all ten teams/faces, all 228 roster references, all 24 member values, all five saved AI rows, all three editorial spotlights and both archives are reachable. There is no connected auth or live route/data implementation in this QA artifact.

## Craft principles that changed this structure

- Hallmark custom-direction / macrostructure: visitor job determines the entire composition. This produced a source-week schedule, lane-attached readers and reference books as separate working views, rather than placing a calendar illustration over the old dashboard sequence.
- Hallmark responsive and pbakaus/adapt: adapt the task, not the pixels. Phone changes the main schedule to a selected-period agenda/calendar pair while retaining the date and item context.
- Elaya redesign: break equal-card symmetry, question a permanent sidebar, use contextual inline depth. The agenda belongs to its selected lane; the league content is a searchable open ledger and native roster foldouts.
- Elaya landing-page guidance: meaningful labels and composed empty states. Missing source cells explicitly explain absence rather than creating empty games, and missing/stale AI uses a specific readable state.
- Rauno direct interaction and Emil/apple-design continuity: native explicit controls, attached source/destination, Close/Escape returns to the source event. No drag/hover path is required.
- Addy frontend engineering / accessibility: real supplied long names, actual browser checks, visible focus, independent 320px and 200% text checks. This stage makes geometry and state behavior reviewable before full art.

The project `goat-hoopers-design` skill and its visual-hierarchy, navigation-accessibility and motion references were read alongside AGENTS, homepage architecture and DESIGN. Latest user authorization permits different QA architecture; no production composition/tokens were modified. The supplied `reference-notes/craft.md` was read; no external source fetch, installation, downloaded scripts or copied presentation code was used.

## Motion thesis and fallback

Stage one uses immediate state updates and ordinary page positioning, without autonomous animation, observers, timers or numeric tweening. The still state is the complete experience. For a later approved full build, one short, interruptible agenda unfold from its selected lane can clarify source/destination continuity. Routine keyboard selection/focus remains immediate; reduced motion removes the unfold while preserving the selected lane, reader and return path. No art/motion library is required or added at this stage.

## Bounded verification

Chromium via the preinstalled Playwright module; local parent-owned server on port 4207. No installs or live providers.

- `node --check app.js`: passed.
- All 8 member and 6 public representative states rendered at 1440, 390 and 320 CSS pixels with no full-page horizontal overflow.
- All those states also passed at 200% root text at each viewport; expanded League book rosters and expanded member values passed at 320/200%.
- Phone Calendar → select Oct 5–11 → Agenda retained `2026-W41`; opening the editorial reader retained the exact BYU college period. Selecting a matchup and toggling Calendar retained current Week 3 and the attached matchup agenda.
- Escape closed the reader and restored its origin; native labelled buttons/inputs and source disclosures exercised.
- League book DOM count: 228 roster rows; search `Lillard`: one matching team; name sorting began with Huff n' Puff. Member value disclosure: 24 rows.
- Stale and missing query modes displayed their specific status and no current 65% probability in the agenda. Ready first pairing preserved 0.0 vs Pending, away 35%, home 65%, confidence 20%.
- Public rendered no personal notebook control. No browser page errors in the exercised state set.
- Desktop default and phone current-calendar-with-attached-agenda screenshots were locally inspected. Parent owns final bulk captures and the independent geometry gate.

Remaining limits: no production navigation/auth/data validation; no actual-device or screen-reader pass; source links point to real destinations but remote pages were not opened; no final contrast/art or motion acceptance; the sparse source calendar is intentionally not a claim of a full season schedule. The independent structure gate is pending. No action was denied or blocked.
