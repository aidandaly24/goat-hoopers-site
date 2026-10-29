# 12 — Unfolding matchup orbit / structural revision freeze

This revision is confined to `structural-revisions/12/`. The frozen original in `wireframes/12/` is untouched. Grayscale structure only; fresh independent geometry review is still required.

User question: “What is the relationship between these teams and players, and can I keep the evidence for both sides open?” Primary action: unfold both ends of a real matchup connection, inspect each team locally, and optionally pin a third entity alongside.

## Before → after

Reviewer B rejected the original selector-to-shelf pattern: changing a face, pair or topic replaced one interchangeable side/after-map reader. Orbit imagery did not change that architecture.

This revision removes that reader. Selecting a connection opens **both team entities at once**, with scores and saved AI on the edge between them. Each team owns its own context, roster, and (for the member's team only) values, scouting and wire controls. Opening Team B's roster does not replace Team A's roster or values. Each chosen field is retained independently. Native nested disclosures in entity contexts also retain their open state across changes elsewhere.

An outer face pins a third team alongside the paired teams. The geometry changes from two entities flanking an edge to a three-node row beneath a shared connection. Existing node fields remain. An outer face subsequently replaces only the third context; removing it returns focus to that face. Focusing another real matchup explicitly replaces the paired teams.

A player's “Trace ownership” action attaches a current-owner tether to the shared connection. The player/position/NBA team and actual owner are derived from the supplied roster references. The relevant owner is retained or pinned, and other entity contexts stay open. It does not assert historical ownership or fabricate cross-player statistics.

Other families use their own topology: the league index exposes ten independently expandable owner entities; the AI axis is a five-edge ladder with both team endpoints; dated editorial attaches three spotlight records to their current-owner nodes around the dated game. These are not subjects rendered into a common reader.

## Desktop and phone geometry

Desktop 1440: the inactive team faces occupy two outer arcs of an interrupted ellipse. The selected team's wide node opens on the left, the opponent's wide node on the right, and their game/provenance is on the connecting bridge. Roster expansion grows its own node. A pinned third team moves the bridge above three simultaneously retained entity columns. This is a working relation surface, rather than an illustration above a dashboard.

Phone 390/320: a native **Orbit working mode** select replaces the desktop multi-link mode rail. A sticky **A / Connection / B / C** comparison control jumps among retained contexts; it does not switch them into one active reader. All selected nodes remain in the document with their own field and disclosure states. The orbit's outer targets become legible numbered portraits, with full accessible names. Full names, records, values and rosters are in each corresponding node and the ownership index. The selected bridge comes first, followed by its independently usable endpoints with alternating offsets. The empty ownership helper is omitted on phone; a real traced-player tether is fully shown. All functions remain reachable.

The compact “Synthetic concept” header disclosure holds the complete offline/current/date caveat. Essential incomplete, Pending, stale/missing and source-period qualifications remain visible in their actual contexts. Header content no longer includes the original long warning strip. Phone targets are at least 44px; body content is 16px at the normal root size.

The context rail's measured height controls focus scroll clearance, including enlarged text. Native controls and links support keyboard input. “Back to retained orbit” preserves the chosen contexts. “Fold only this node” or Escape from an expanded entity folds that entity to context and returns focus to its roster trigger, leaving the other entities intact. There are no dialogs, focus traps, drag-only or hover-only paths.

## Capture API and additional paths

`document.body.dataset.studyReady='12'` is set after the first real render. `window.goatStudy.activate(id)` selects actual content and geometry:

| State | Working result |
| --- | --- |
| `default` | Current member-own/public-first pair; two open contextual entities and their bridge |
| `rosters` | Both full linked rosters independently open (24 and 27 references for pair 1/2) |
| `triad` | Pair 1/2 plus NeuralNets (#8), with roster contexts on #1 and #8 |
| `values` | Member #1's values beside #2's retained full roster; member only |
| `scouting` | Member #1's form/completed-week evidence beside #2's full roster; member only |
| `index` | Ten-team owner index with local search/sort and all 228 references |
| `picks` | Five real paired edges, returned AI result and metadata on each edge |
| `editorial` | Dated W41 ownership story orbit; second date tab reaches W40 historical pair |

Public exposes six states; member exposes eight. Other real paths: team wire, top-three/all-24 value disclosure, current owner tethers, arbitrary third-team pinning, all five focused matchups, all-ten standings disclosure, source registers, second archive date, and direct external app destinations.

## Content map and truthfulness

Facts import explicitly from `{inventory,data,mode,aiState,esc,money}` in `../../data.js`. No private fixture, live request, provider generation, invented quote, ranking or line is added.

| Content | Reachable location |
| --- | --- |
| GOAT identity; Home and member/public comparison | Approved local black logo; header comparison; Home in footer destination disclosure |
| News, Stocks, History, Arcade, AI Decides, Teams, Transactions, trade analyzer, weekly archive | Desktop named axes and persistent footer destination disclosure on both sizes; exact `/stocks#player-board` route, no unsupported player query |
| `/team`, `/teams/1#team-roster` | Member-owned node links; omitted personal fields/controls in public rendering |
| Actual existing game | `/arcade/free-throw` in desktop play axis and footer Arcade destination; playable link in AI mode |
| Current pair/week/both team and manager identities/current records/scores | Paired entity headers plus shared connection; all five alternatives in the connection picker and AI ladder |
| Known zero versus Pending/incomplete | `0.0` is retained for first home score; null stays `Pending`; game is visibly incomplete |
| All five AI choices, probabilities, separate confidence | AI ladder and selected-edge saved-result disclosure. First returned choice is team 2 at 35%, opposite team 1 is 65%, independent confidence 20%; highest probability never overrides the returned choice |
| Timestamp/model/prompt/inputs/evidence | Native disclosure on each edge; null snapshots/baseline and empty result evidence explicitly unsupplied |
| Stale/missing AI | `?ai=stale` visible in selected-edge summary and ladder; `?ai=missing` has unavailable summaries/results with no invented distribution |
| Member identity/standing/roster count/actions | Member node header; correct actual fixture standing |
| Subtotal/basis/coverage/time/value rank/top 3/all 24 values | Member node's Values field; native all-value disclosure, historical change labels retained |
| Recorded history and Power | Explicit unavailable in Values/context/index; no fake chart or power ranking |
| Form versus completed-week best/rough | Member node's Scouting field: EMA FPPG, observed games, availability notes, completed recorded points/GP, period and small-cohort coverage |
| Member news/recent moves | Member node's Team wire field, with supplied outlet/time/type and no invented adds/drops |
| All ten face/team/player/modeled values/profile links | Active node context plus inactive outer faces on desktop; full selected context and ten-entity index on phone |
| All ten managers/current records/opponents and 228 unique player refs with position/NBA | Searchable index; own roster disclosures and full graph-local roster fields |
| Prior-season record/finish/manager attribution | Each node context and index disclosure; NeuralNets summary says previous manager and full text identifies QBs Gremlins |
| All ten standings rank/W/L/PF | Index standings disclosure; PF is `pointsFor / 100` |
| Dated game/editorial and both archive routes/dates | Dated ownership root, date tabs, `/weekly/2026-W41` and `/weekly/2026-W40` links |
| Three exact spotlight statistics/opinion/selection/source dates | Three separate owner-attached story entities, including NBA versus college periods and current-ownership distinction |
| Happenings and sources | Dated edition-specific happenings and native source register |
| League moves and full provenance | Footer's separate synthetic league-wire disclosure and provenance disclosure |

Known source conflict: the preserved `home.edition.game.teamIds` is 1/2 while its dated title/prose names 1/5. It is not combined into a result here. Dated reading uses the coherent `data.archive`: W41 upcoming 1/5, W40 historical final 5/7 with 326.0–251.5. Current Week 3 comes only from directory pairings. October draft material is not a current Week 2 award.

Inventory bounds: all required information families have concrete content and paths, including all 228 references, all 24 member values, all ten standings and all five AI outputs. Unused null hub-stat slots and redundant duplicate projections are not separately narrated. Deep player pages, production destination pages, real auth, historical value production and real-time refresh are outside the isolated prototype. The public/member query is a demonstration, not a security boundary.

## Craft application and motion

The earlier project design skill/references and supplied `reference-notes/craft.md` remain applied. Reviewer B's explicit requirement changes the composition itself:

- Hallmark custom direction/macrostructure: actual relationships determine layout and reveal; one interchangeable detail shelf is removed.
- Elaya redesign's useful overlap/inline expansion: each real owner node unfolds in place; unrelated contexts retain their state instead of being evicted.
- pbakaus/adapt: phone has retained-context comparison controls and a native model-specific mode selector, while each endpoint remains independently open.
- Rauno/direct manipulation and Apple-design spatial continuity principles: a face adds its own node; a player traces to its actual owner; closing returns focus to the origin.
- Addy accessibility: no 228 tiny dots; semantic roster rows, visible names, native disclosures, 44px controls and explicit keyboard/Back paths.
- Emil/pbakaus motion purpose gate: this stage has no autonomous movement, animation, timer or RAF. Nothing essential waits for an entrance effect.

Later motion thesis, after geometry approval: a brief, interruptible user-triggered transition may explain the two-endpoint → third-node layout change. Numbers and portraits remain still; routine keyboard actions and reduced motion use the immediate still layout with the same retained contexts. No motion library is needed.

## Actual checks and limits

Installed Playwright + `/usr/bin/chromium`, root's local port 4207 server:

- Eight member and six public states at 1440/390/320 CSS px and 100%/200% root font size: **84 state/size/mode combinations**, no document horizontal overflow, no JavaScript errors or failed local responses.
- Pointer opened both linked rosters: 24 and 27 rows remained simultaneously present. Pinning #8 retained both contexts and changed to three-node geometry.
- Opened member all-24 values, changed Team B's field, and confirmed the member disclosure remained open.
- Traced Damian Lillard: tether showed PG/POR → #1 Reaves Dropper; all three contexts remained.
- Index `Lillard` search returned one team/one reference; clearing restored 228 references; name sort began with Huff n’ Puff.
- Returning from index restored all three contexts. Removing #8 restored focus to `satellite-8`. Escape folded only #1 and restored `roster-trigger-1` focus.
- AI ladder has five edges; first returned-choice 35%/alternate 65%/confidence 20% contract and model/prompt/unsupplied snapshot metadata verified.
- Dated ownership has three spotlight entities; second archive date shows the supplied 326.0–251.5 historical final.
- Phone keyboard comparison jump focused `entity-2`; all three entity articles remained displayed. Enlarged-text focus clearance was checked against the sticky context rail.
- Member/public × stale/missing AI states rendered correctly; public has no personal Values/Scouting state or value control.
- Reduced-motion emulation showed zero active animations.

Temporary desktop/phone screenshots were used only for bounded self-inspection; root owns deliverable captures. No physical-device, screen-reader, production routing, live data or final artwork acceptance is claimed. Browser zoom is not substituted for the explicit root-text check. Static isolated files do not require a production Next build.

Frozen deliverables: `index.html`, `style.css`, `app.js`, `STRUCTURE.md`. No blocker remains for fresh capture and independent geometry review. No original/shared/production/Muse/Git files were edited. No external services, installs or subagents were used.
