# 07 · Clubhouse theatre — stage-one freeze

## Design contract

**User question:** “What is happening for my team and the league, and where do I go to work on it?”

**Primary action:** enter the score wall for the current matchup, then move to the relevant physical station. A member can open their locker and follow My team; a public visitor gets a league ledger in that same place.

**Relevant states:** room, current score wall, member locker/public ledger, searchable team lockers, scouting bench, dated press room/archive, games corner. Saved AI ready/stale/missing are supported query states. Member and public presentation are separate.

**Narrow layout:** a closer side-on room. The score wall spans the first wall bay; two locker doors sit together; an open notebook crosses the foreground bench; press door and games corner complete the room. This is a scene with a direct six-item station route list, rather than shrinking the desktop scene or stacking the entered reader's desktop columns. Inside a station, the room becomes a compact six-stop route rail above the readable workspace. At 200% root text size, scenery yields to natural-height station objects (one column on narrow phones) so no station text is clipped.

**Forbidden patterns:** flat court map, WebGL/Muse scene, generic hero plus repeated dashboard cards, drag/hover-only entry, texture-baked information, fake recorded history/Power ranks, probability-majority rewriting of the model's returned choice.

## Geometry and state model

At desktop 1440, the room is a side-on CSS/SVG stage with an angled side wall, receding back wall, floor seams, rear score board and lockers, tall press door, foreground open notebook and bench legs. Depth and object shapes distinguish jobs. All information and controls are HTML. There is no image of a dashboard. The room’s score board already displays the current pair and score status; the locker and notebook contain useful actual fixture metrics.

Entering a station replaces the room with a nonmodal reading plane alongside a small slanted room route rail. Reader geometry follows the task: score board beside saved AI outputs, locker identity and wire beside the long valuation receipt, indexed roster directory, two-page scouting notebook, newspaper/archive spread, game preview beside tool destinations. The architecture continues through the populated views.

Buttons enter/change stations. Links go to actual product destinations. Each entered view has a named focusable heading, Close station and a context-labelled Back button. Close/Escape returns to the room and restores the original station trigger. Back returns to the previous station or room. Hash history supports browser Back/Forward and direct station URLs. These are nonmodal views; no modal focus trap is needed. Inactive workspace markup is hidden or replaced and leaves the tab sequence.

`window.goatStudy.states` exposes seven representative states, and `activate(id)` selects each. `document.body.dataset.studyReady` is `07`. Hook IDs are `room`, `week`, `locker`, `league`, `scout`, `press`, `games`. The older archive entry is an additional substate selected with its named archive button in `press`. Directory search/sort and native roster/provenance disclosures are additional substates within their parent view.

## Content map

| Job / inventory | Reachable place |
| --- | --- |
| GOAT identity, Home, News, Stocks, History, Arcade | Persistent masthead; lower station links also retain working destinations |
| AI Decides, Teams, Transactions, trade analyzer, weekly archive | Masthead More disclosure; contextual station/footer links |
| Member/public comparison | Masthead comparison link preserves the AI fixture query |
| Current Week 3 pair, both teams/managers/records/scores | Room score wall preview; full `week` scoreboard. Known 0.0 and null Pending remain different; Incomplete is explicit |
| Five saved AI rows | `week`: returned away choice 35%, home 65%, independent confidence 20%; timestamp, season/week, model, prompt, null input snapshot, evidence, missing baseline and probability caveat in each disclosure |
| AI stale / missing | `?ai=stale` prints stale saved slate; `?ai=missing` prints unavailable with no bars or invented output |
| Member identity, 24-player count, standing, My team and roster route | `locker`; `/team`, `/teams/1#team-roster` |
| Modeled FAAB total/basis, coverage, computation time, rank, top three, all 24 individual values | `locker`; full value receipt is rendered, not abridged. History is explicitly unavailable |
| Member form watch / completed best and rough | `scout`; exact EMA FP/G and observed GP, completed Week 2 FP/GP, period, five-player eligible coverage, overlap and unknown availability. Shared Joel Embiid selection has one row and a labelled membership note |
| Member news / recent moves | `locker`: all supplied rows, outlet/date/type/week and supplied add/drop counts |
| All ten faces, team/player profiles and modeled values | `league`, one face embedded in each team entry, grayscale local approved portraits |
| Ten-team directory, managers, records, opponents, all 228 unique player references | `league`; native full roster disclosures carry each player name/profile, position and NBA team. Team/manager/player search can open a matching roster; sort by name, standing or roster size |
| Standings rank, W/L, PF | `league` standings disclosure; public `locker` ledger. PF divides source pointsFor by 100. Manager is in the team directory at narrow widths |
| Prior-season records and attribution | Team roster disclosure prints 2025 record/finish and supplied owner note, including NeuralNets' previous-manager qualification |
| Transactions | `league` includes all three league fixture moves; actual Transactions destination remains linked |
| Dated edition game, all three spotlights | `press`: exact opinion/stats/period, profile/team links; selection reason and source/check date disclosures. Public `scout` also makes the three editorial notes directly available |
| Happenings/sources, both archive entries/date/routes | `press`; archive switch changes the actual article. `/weekly/2026-W41`, `/weekly/2026-W40`, `/weekly` retained |
| Arcade/free throw, Stocks, trade tool | `games`, with approved grayscale game preview and actual `/arcade/free-throw`, `/arcade`, `/stocks#player-board`, `/trade-analyzer` destinations |
| Power/history truth and provenance | Public ledger / directory disclosure and locker/game reader. Footer and fixture line identify the synthetic, dated, offline source |

## Factual handling

Only the common `../../data.js` exports are imported. No API/provider request, arbitrary player query, generated fact, auth assumption or production edit is introduced. The persistent fixture line and footer label current synthetic metrics; station metadata retains source periods.

The `home.edition.game` 1/2 versus 1/5 conflict is avoided by rendering dated narratives only from coherent `data.archive` entries: W41's upcoming 1/5 opening-week story and W40's 2025 final 5/7 with 326.0–251.5. Current Week 3 comes from `personal.summary.matchup` for members or the directory for public. The preserved common historical fixture is untouched.

Public views never render the personal team subtotal, news, form guide or member actions. The public `locker` is the ten-team ledger and public `scout` uses dated editorial spotlights. This remains a fixture comparison, not an authentication boundary.

## Applied source principles and motion

- Hallmark custom direction/macrostructure/redesign: the clubhouse idea governs navigation and every working view; it is more than a themed opening picture. Station purpose determines shape and reader composition.
- Elaya redesign: distinct object proportions, open reading planes and useful depth replace equal-card symmetry. Origin, destination and a named return path remain connected.
- adapt: phone becomes a closer view through the room, with touch controls and a compact route rail; enlarged text deliberately relaxes scenery constraints.
- Apple/Emil spatial continuity and Rauno directness: each readable station has a physical origin and a clear room return. Keyboard actions respond immediately.
- Impeccable/pbakaus animate and Emil frequency/purpose guidance: one optional 180ms pointer-triggered horizontal/opacity transition on the entered reading plane indicates a move into a station. No entrance sequence, autonomous loop, numeric tween, observer reveal, scroll hijack or timer.
- Accessibility/accessible-animation: native controls, explicit station names, heading focus, Escape/focus return and real links. Live reduced-motion preference disables the sole reader animation through CSS. A still transition retains exactly the same content and navigation.

For a later full build, the motion thesis is a single short travel from the selected physical station to its reading plane and a reverse return. The bounded current prototype only implements the reading-plane entry; richer origin travel needs the independent geometry gate and a still equivalent.

## Actual checks and remaining limits

Checked using installed Playwright with Chromium `/usr/bin/chromium`, local root-owned server `127.0.0.1:4207`:

- `node --check stage.js` passed.
- All seven states at 1440, 390 and 320 CSS px, at 100% and 200% root font size: **42 combinations**, no page-width overflow and no clipped station objects.
- DOM/content checks: five AI rows; first returned choice Ware the Hoes At? at 35%, Reaves Dropper 65%, confidence 20%; 24 roster values; 10 directory entries and 228 unique roster references.
- Search Embiid returned one team and opened its matching roster. Standing sort placed Reaves Dropper first. Older archive switch rendered 2025 final 326.0–251.5.
- Enter focused the station heading. Escape returned focus to `origin-week`. Internal Back and browser Back/Forward changed the actual state. Live reduced-motion emulation returned animation name `none`.
- Public ledger rendered ten standings and no member subtotal. Stale and missing AI variants rendered the correct named states. Zero page JS errors and zero failed asset responses during the final content/reflow walk.
- Visually inspected desktop room, phone room and entered score-wall screenshots for object geometry and readable station mapping. Root owns the independent capture/gate; no shared capture infrastructure was added.

This is a grayscale architectural prototype, not final acceptance or production integration. Full inventories are present in their stated places, but exact screen-reader announcements, physical-device safe areas, a measured all-state contrast audit and external/product destination execution are unverified. Product links use supplied routes; the static fixture server does not implement those applications. No final art, final origin-travel motion or exhaustive styling was attempted. Files are source-ready for the independent geometry gate and frozen after these checks.
