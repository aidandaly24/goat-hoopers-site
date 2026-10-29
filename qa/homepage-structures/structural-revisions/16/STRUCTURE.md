# 16 structural revision — editable league composition

Frozen grayscale architectural revision for a new independent gate. The original `wireframes/16/` remains preserved. This folder contains only `index.html`, `canvas.css`, `canvas.js` and this note. There is no production, shared presentation, Muse, Git, dependency or provider change.

## Before / after

The rejected original used one selected franchise on a portrait strip, a replacement tabbed dossier, and a separate league rail/reader. Reviewer B identified the selector/reader similarity in 09–16 and 12–16. Reviewer C required multiple substantive franchise contexts to remain usable together, with shared facts inside that working context.

This revision is a composition surface. A matchup, a franchise with its roster, a modeled quote, scouting evidence, team wire, a dated edition and league references are independent retained items. Adding an item does not choose a replacement document. Pinning changes its priority and desktop reading width without hiding other items. Two franchise rosters can be open at once while their current score/model and member valuation remain present. The useful interaction is arranging and retaining evidence, not selecting the subject for a universal reader. There are no dossier tabs, chapter replacement, map, orbit, shelf or separate notebook.

The optional league reference item contains conventional roster/standings functions because the factual contract requires them. It is independently kept on the same canvas, can coexist with any number of franchise or game items, and is not the primary navigation architecture.

## Design contract

**User question:** Which league evidence should I keep together, and in what order should I use it?

**Primary action:** Add useful material to the composition; pin it or move it earlier/later using native buttons. The coherent member default keeps the current 1/2 matchup with saved model evidence, two separate franchise portraits/rosters, member valuation, form and wire. Public default keeps the same matchup and both public franchise contexts.

**Desktop geometry:** A fluid twelve-column composition uses different measures for different material: six columns for the score/model relationship, three each for the two franchise/portrait contexts, six each for value/form, four for wire/tools and eight for a dated edition. These are unboxed content elements, not equal cards. Pinned items move to the beginning and span the full desktop width. A pinned franchise distributes identity and independently disclosed roster across that wider space. Original evidence remains below it.

**Phone geometry:** The actual DOM order becomes an editable priority sequence. Every item carries its team, current/completed/editorial period and source status. Pinning a franchise makes it first while the score and other franchise remain in the sequence. In arrangement mode, every item has Move earlier, Move later, Pin/Unpin and Remove controls; no drag gesture or desktop-only coordinates are needed. The arrangement help is visible only while editing. Restore default is an editing action. The compact header contains GOAT Home, League routes and an accessible Synthetic concept provenance disclosure.

**States:** Ordinary/arranging; added, pinned, reordered, removed and empty compositions; independent open roster/model/source disclosures; team/player search and sort; member/public; ready/stale/missing saved AI. Actions never mint data. Dedicated controls and roster links have 44px minimum targets. Inline prose/source links remain normal text links.

**Forbidden:** Movable ornamental cards, selector→single reader, replacement franchise tabs, decorative numbering/tags, equal-card framing, fabricated rank/history, max-probability substitution for a returned choice, anonymous/drag-only controls, member material in public rendering, or account/database layout writes.

## Working state and input boundaries

The source material list is an add interface, not a content reader. After adding, the item is brought into view and all other material remains. If material is already kept, contextual buttons say Locate and bring the existing item into view. Close/Escape returns focus to Add league material. The route disclosure also closes with Escape and restores focus.

Move earlier/later changes the actual item order. It operates within the pinned or ordinary priority group; disabled buttons expose boundaries. Pin promotes an item to the beginning; Unpin returns it to the ordinary group. Remove affects only that item. Restore default returns the coherent starting composition. The empty state offers Add/Restore. Editing preserves independently open rosters/model notes in the current session and restores control focus after DOM updates.

Local storage is confined to `goat16-composition-v1-member` or `...-public`. Its schema is `{schema:1, layout:[{id,pinned}]}`: allowlisted string material ids and boolean pin values, with duplicate ids removed. Unknown/incompatible ids are discarded; malformed JSON, schema or an entirely invalid nonempty saved list falls back to the coherent default. No names, scores, prices, credentials, account identifiers or fixture objects are written. If storage is unavailable, the current page still works. Public and member have separate keys and material registries; public has no member quote/form/wire item. A reload restores item order/pins, not transient searches or disclosure openness.

Arrangement is local editing rather than route navigation. There is no fabricated browser-history entry for each move. Add/Close returns context; inverse move, Unpin, Remove/Add and Restore provide reversible layout operations.

## Capture API

`document.body.dataset.studyReady = '16'`. `window.goatStudy` supplies eight real presets reachable through the same controls:

| State | Actual composition |
| --- | --- |
| `default` | Matchup 1/2, both independent franchises; member value/form/wire |
| `arrange` | Default with arrangement controls and team 1 roster open |
| `pinned` | Team 2 pinned first, its roster open, prior default items retained |
| `three-teams` | Adds teams 5 and 8 plus the 5/6 matchup; team 5 pinned; default retained |
| `picks` | All five actual current matchups/AI rows, original franchises/member evidence retained |
| `league` | League reference pinned with standings open; default composition retained |
| `editorial` | Both dated editions added, W41 pinned and its spotlight disclosure open; current context retained |
| `tools` | Real game/tools material pinned; default retained |

Both member/public expose these eight states. Public defaults/presets simply omit member-only materials. API activation applies a deterministic composition without writing a saved arrangement or pretending it is saved. Other reachable combinations are arbitrary add/pin/order/disclosure combinations of 22 member or 19 public material types.

## Content map

| Supplied information | Concrete location |
| --- | --- |
| GOAT identity, Home, all primary destinations | Header logo/Home and League routes: News `/intel`, Stocks `/stocks#player-board`, History, Arcade, AI Decides, Teams, Transactions, trade analyzer and weekly archive. Tool item retains these and the approved free-throw preview linking to `/arcade/free-throw`. Footer provides member/public and stale/missing comparisons. |
| Current pair and all five saved AI rows | Independent game items. The default is the member’s current pairing. Both teams/managers/records/scores are present. 0.0 is known; null is Pending; current scores are incomplete. Each game’s model disclosure retains generated date, season/week, model, prompt, null snapshots/baseline, input and returned evidence. Returned away choice remains 35%, alternate 65%, confidence 20% separately. Stale/missing is explicit. |
| All ten faces and franchise contexts | Ten addable franchise items use actual approved local portraits, player/team names, modeled face values, current record/standing/opponent, full roster disclosure and real player/team/roster profile links. Several may remain concurrently open. Member team 1 also links `/team` and `/teams/1#team-roster`. |
| Member modeled value | Value item retains $1095.25 total, 24/24 priced, 0 unpriced, basis/time, top three prices/change percentages and all 24 roster values. Supplied modeled-value rank **2 of 10** is preserved; it is not hidden because cross-roster recomputation inputs are absent. Search/name or high-value sort operates on actual rows. Recorded history is explicitly unavailable. |
| Member scouting | Form item retains EMA FP/G with observed GP/basis/message; all best/rough completed-week rows, points/GP, exact Week 2 period, eligibility/coverage and synthetic caveat. Unknown availability defaults are not made into injury claims. |
| Member news/moves | Wire item retains both supplied news headlines/outlets/times and the actual supplied recent move/date/type with no invented add/drop names. Tool item also retains league fixture transactions. |
| Full league directory, player references and standings | Independently addable league reference has all 10 team/manager/record/opponent entries, all 228 unique player references with position/NBA/profile links, local team/player/position/NBA search, actual name/rank/PF sorting, count/empty/Clear, and all ten rank/W–L/PF rows (`pointsFor/100`). Adding a franchise from this field retains both the field and existing canvas. All ten franchise items independently contain the same reachable roster references. |
| Prior-season attribution | Each franchise/reference preserves 2025 record/finish; NeuralNets retains the previous-manager/QBs Gremlins qualification before its roster disclosure. |
| Dated editorial and archive | Two independent edition items, each with exact draft/unpublished date bounds, game, all supplied spotlights/stats/opinions/periods/selection/source dates, happenings and all source links. Both actual `/weekly/:id` links remain. W41 is upcoming 1/5; W40 is the historical 2025 final 5/7, 326.0–251.5. Editions can remain beside current Week 3. |
| Honest producer gaps and provenance | Value explicitly states unavailable recorded history; league/tools state unavailable Lineup Power. No lines or ranking producer is invented. Compact Synthetic concept label expands full future-fixture provenance; footer names local-only scope. |

The contradictory preserved `home.edition.game.teamIds` 1/2 is not combined with its 1/5 prose or corrected. Current game items use directory current matchups. Dated edition items use coherent `data.archive` 1/5 and historical 5/7 entries. November 12 is explicitly a synthetic fixture date, not today’s actual live source.

## Applied references

- **Independent B/C critiques:** Changed the evidence state model, not the selector artwork. Multiple franchise and shared current/editorial contexts remain concurrently usable. A distinct league rail/reader was removed.
- **Hallmark custom direction/macrostructure/redesign/responsive:** The complete experience follows the visitor job of composing related evidence. State retention, varied reading widths and phone priority order govern the architecture before art.
- **Elaya redesign / supplied quality direction:** Broke equal-card symmetry and replaced a generic detail shelf with independent in-place material. Removed decorative item numbering, redundant tags, negative tracking, opacity stacks and repeated object/roster borders. Useful grouping and visible edit controls remain.
- **pbakaus/adapt:** Desktop reading measures transform into the same editable phone sequence, preserving functions rather than coordinates.
- **Rauno / Addy accessibility and frontend engineering:** Native add/move/pin buttons, explicit disabled boundaries, context-preserving focus, independent disclosures, actual fixture fields and browser tests determine behavior. No drag-only dependency.
- **Emil / pbakaus animate / accessible-animation:** Frequent layout edits are immediate, interruptible and usable with reduced motion. No reveal gate, timers, score tween, scroll observer, RAF loop or motion dependency.
- **GOAT local references / traceable source guidance:** Explicit local import of `inventory,data,mode,aiState,esc,money`; allowlisted layout input boundaries; no pricing recomputation, new provider shape or production ownership change.

## Motion job / still equivalent

Stage one intentionally has no authored transition. A later gated build could use one brief FLIP-style pointer-triggered reorder to explain an item’s previous and new position. It must not delay editing or change text/numeric data; repeated keyboard changes stay immediate. Reduced motion preserves identical order, pin state, open evidence, focus and controls with zero transition. No full art/motion acceptance is claimed.

## Actual bounded checks

Installed Playwright and `/usr/bin/chromium`, served by root at port 4207:

- `node --check canvas.js` passed.
- All eight states in **member and public** at 1440, 390 and 320 CSS pixels, normal and 200% root text, with all main disclosures open: no page overflow. Add-material source, provenance and route disclosure reflow were also checked; no JavaScript page errors or external runtime requests.
- Actual pointer controls: open team 1 roster → pin team 2 → move team 1 earlier → add team 5. Existing matchup/items and the open team 1 roster remained. Reload restored the changed order and pin. Remove dropped only team 5; Restore returned the six-member-item default. Removing a lower item returns focus to a visible remaining item control.
- Keyboard Enter pinned team 2. Material Escape closed the add list and returned focus to its trigger. Reduced-motion preference change retained the pinned composition.
- Actual add controls retained all ten franchise items at once; their union contained 228 unique roster references and all ten portraits loaded with nonzero dimensions.
- League reference: 10 entries/228 unique players/10 standings rows; `Curry` finds one actual franchise; Clear restores all; rank sort starts with Reaves Dropper. Value search `Embiid` returns one actual priced row. The supplied 2-of-10 value rank is visible.
- Five saved current game items render together. Default score preserves 0.0 versus Pending. Returned 35% choice/65% alternate/20% confidence, stale state and missing state were checked.
- All eight public presets contain no member value/form/wire item or `/team` action. Invalid saved layout input falls back to the coherent default; tested malformed typed entry plus null.
- W41 renders its three actual spotlights; W40 has zero supplied spotlights and states that without an empty disclosure. Desktop default, phone default and phone pinned/editing images were visually inspected. Root owns comparative capture infrastructure and acceptance.

No physical-device, screen-reader, exhaustive contrast, production destination, live authentication/provider or final-art test was performed. Inline prose/source links retain text-link target behavior. No build is needed for these standalone local HTML/CSS/module files; production was not touched.

## Limits

This is a structural revision awaiting independent pairwise review. Full art/palette/typography/motion remain deferred. All required fact families have populated reachable places; no supplied roster, spotlight, happening or source family is intentionally abridged. Raw null avatar/ESPN ids and duplicate fixture objects are not printed as dumps. Transient search/disclosure state is session-local, while only layout ids/order/pins persist across reload. The imported fixture is an offline comparison, not an authentication boundary. Real destination links leave this static QA surface and their production behavior is outside these checks.
