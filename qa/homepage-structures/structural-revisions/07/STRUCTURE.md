# 07 revision · The working clubhouse

The original `wireframes/07/` is unchanged. This folder is a separate grayscale structural revision for the early gate, not a full visual build or acceptance claim.

## Before → after

The first study hid its room after entry and used six station buttons to feed one generic reader. That failed the strict 02/07 architecture gate. This revision has **no entered reader, replacement workspace, station rail or hidden room**. The side-on room is the working document. Each physical station owns a different local mechanism, and multiple mechanisms can stay open together:

- The dark score wall contains the current pair and a fold-down, independently scrolling five-game AI slate. Selecting a game changes the actual scoreboard and its roster-comparison context.
- The locker bank is a two-column cabinet on desktop. Every franchise owns a separate native door and complete roster inside that door. Several doors can remain open. “Open this pair’s two lockers” opens the score wall's actual two teams, places them first, and exposes explicit jumps between those two rosters. This is an action across two working stations, not a topic selection.
- The foreground bench is a two-leaf notebook: the current modeled value receipt unrolls on one side while form and team wire open on the other. Opening a leaf does not close a locker, hide the score wall, or replace the archive.
- The archive shelf has two dated physical folder tabs and a local folder disclosure. Choosing an older date changes only that folder. Scores, locker doors and bench leaves retain their state.
- The games crate opens a real preview/Play path; the ledger crate unfolds the standings or league wire locally.

Closing a local surface folds that surface and returns focus to its own summary. Escape closes the focused open disclosure, or a remaining open room disclosure when focus is outside one. Back one room action restores the preceding disclosure/game/folder combination. Browser Back/Forward restore those same real room states. Native keyboard activation is retained. This is a nonmodal room; there is no focus trap.

## User contract and geometry

**Question:** “How do these matchups connect to the actual rosters, my team notes, and the dated league story?”

**Primary action:** work at the score wall, then open that pair’s two physical lockers. A member can keep their own value receipt and form notebook open at the bench while comparing rosters.

**Desktop 1440:** an angled back/side wall and floor remain behind all content. Score wall occupies the back left, locker cabinet the back right. The notebook and its bench legs cross the foreground, with archive shelf on the right. Tools and games sit on separate lower crates. Each local work roll has a bounded native scroll surface, so the open room remains navigable rather than stretching one selected topic into a substitute page. Those interiors contain complete actual fixture content, not screenshot facsimiles.

**Phone 390/320:** the room becomes a closer vertical route through actual objects. A compact sticky score context keeps the current week/score and links to **their score / their lockers** available while working elsewhere. Bringing a pair to the cabinet opens both doors; named roster-jump controls and an “Compare with [other team]” control inside each selected door move through that cabinet, retaining the selected score context. The notebook leaves become distinct local disclosures on the same bench, followed by the independent dated folder shelf. Navigation moves to existing room objects; it never changes a common reader body. Other open objects remain open when moving around the room.

At 200% root text size, bounded interiors and geometric rotations relax: station objects and their contents use natural heights, the cabinet becomes one column on phones, and all functions/content remain reachable without horizontal page overflow. This is an explicit text enlargement adaptation, not missing content.

The initial phone chrome is compact: GOAT identity, **Synthetic concept** with full provenance in a native disclosure, member/public comparison, Home/Stocks and a League links disclosure. Stale/missing AI, incomplete/Pending scores and dated draft qualifiers remain visible in their working context. The room route consists of named contextual jumps, not six topic selectors.

## Capture/API states

`body.dataset.studyReady = '07'`. `window.goatStudy.states` and `activate(id)` expose deterministic combinations:

| ID | Actual open work |
| --- | --- |
| `room` | Persistent room, each local surface folded |
| `week` | Five-game saved slate open on score wall |
| `locker` | Member's 24-value receipt open on bench; public mode opens standings instead |
| `league` | Both current-pair locker doors open and comparison context active |
| `scout` | Form notebook open on bench; public mode uses dated editorial notes |
| `press` | Older W40 folder open on archive shelf |
| `games` | Game crate lid open, actual preview and Play link visible |
| `workroom` | Score slate, member value receipt and current archive folder open together |

Additional substates are all native doors, provenance/source disclosures, team wire, league wire, standings, archive dates, five selected games, query/sort, and independent scroll positions. Working interiors carry `data-scroll-pane` names: saved-slate, team-lockers, roster-values, scouting/public-scout, team-wire, archive and standings. Scroll these actual interiors to inspect the complete content; a whole-page screenshot shows their bounded windows, not all interior rows at once. Root owns capture infrastructure.

## Information and action map

| Required family | Concrete location |
| --- | --- |
| Identity, Home, News, Stocks, History, Arcade, AI, Teams, Transactions, trade analyzer, weekly archive | Compact entry and League links disclosure; crates/footer retain contextual destinations. Stocks always directly available |
| Member/public comparison and `/team`, `/teams/1#team-roster` | Entry comparison link; member bench and score wall actions. Public markup has no member team action |
| Current Week 3 pair, team/manager/record/score, incomplete truth | Score wall. Known 0.0 stays 0.0; null stays Pending. Game selection changes actual board/pair |
| Five AI returns and evidence | Fold-down score slate: returned away choice 35%, home 65%, independent confidence 20%. Each result has saved time, period, model, prompt, null input snapshot, evidence, unavailable baseline and probability caveat. `?ai=stale` and `?ai=missing` have visible truthful states |
| Member identity, count, standing, modeled value/basis/coverage/time, top three/all 24 | Foreground bench: identity and summary above leaf; full receipt inside value leaf. Provided value rank retained; no FAAB balance invented |
| Member watch/best/rough, points/GP/source period/coverage, unknown availability | Separate bench form leaf. EMA and completed-week points have separate labels; shared Embiid row appears once with explicit membership note; exact coverage/period retained |
| Member news/moves | Team-wire leaf on bench, with supplied dates/outlets/types/week/add/drop counts |
| Ten faces, linked player/team names, modeled values | Each locker summary has the face; door interior supplies linked face identity, value and champion status |
| Ten teams/managers/current records/opponents; 228 unique references and position/NBA | Every physical locker door contains its complete roster and matchup. Search covers all team/manager/player names and opens matching player rosters. Sort by name/standing/size; explicit global sort releases the pair's pinned ordering |
| All ten standings rank/W/L/PF | Ledger crate. PF divides source pointsFor by 100. Phone managers remain available in locker summaries rather than squeezing a fifth table column |
| Prior-season attribution | Inside each door: 2025 W/L/finish and source owner note, including NeuralNets' prior-manager qualification |
| Dated edition game, three spotlights with exact stats/opinion/period/selection/source/check dates | W41 archive folder on shelf, each source/selection accessible locally. Public bench offers the dated notes without member data |
| Happenings/sources/both archive entries/date/routes | Local folder switch, native sources disclosure; `/weekly/2026-W41`, `/weekly/2026-W40`, `/weekly` retained |
| Stocks/trade/Arcade/play destinations | Tool crate plus real game crate preview, `/stocks#player-board`, `/trade-analyzer`, `/arcade`, `/arcade/free-throw` |
| History/Power unavailable and full fixture provenance | Ledger crate names both missing producers; Synthetic concept disclosure contains full warning/date/offline/auth caveat |

No required family is abridged. Technical/null metadata not named above remains in the unchanged common fixture and is not misrepresented as a connected producer. There is no made-up chart, Power ranking, injury conclusion, price history or real-time result.

The known `home.edition.game` conflict is handled as before: dated narratives use the coherent `data.archive` W41 upcoming 1/5 and W40 historical final 5/7 records. W40 displays 326.0–251.5 as the 2025 final. Current Week 3 uses directory matchups. The common fixture is untouched.

## Craft principles that changed the structure

Hallmark's custom-direction/macrostructure principle now governs **working reveals**, not merely the room cover. Elaya's inline expansion/depth guidance becomes independent locker doors, a fold-down slate and two notebook leaves instead of a reader with a themed border. Rauno directness and Apple spatial continuity connect the score pair to two actual nearby rosters and retain the physical source after opening. adapt changes the phone task into named pair-specific cabinet jumps while keeping score context, rather than substituting a topic strip. Accessibility guidance gives each mechanism native controls, explicit names, visible focus, local Close/Escape and real browser history.

There is **no authored animation in this structural revision**. All inputs respond immediately and reduced motion sees the same room. For a later full build, the purposeful motion would be one short physical fold/unfold of the chosen slate/door/leaf at its own origin, with its final content visible immediately and a still reduced-motion equivalent. That is deferred until this new architecture passes its independent gate. No WebGL/GLB/Muse code, library, timers, scroll hijack or downloaded scripts were used.

## Concrete verification and limits

Local installed Playwright + `/usr/bin/chromium`, root-owned `127.0.0.1:4207`:

- `node --check room.js` passed.
- All eight API combinations at 1440/390/320, each with 100%/200% root text: **48 member combinations**, plus the same **48 public combinations**. No horizontal page overflow; all six station sections retained positive rendered height in every member combination. Public mode had zero overflow in its 48 combinations.
- Pointer/keyboard room path: Enter unfolded AI slate; selecting game 2 changed score to teams 3/4 and 105.5/Pending. “Open this pair’s two lockers” opened the actual `door-3`/`door-4` and moved them to the cabinet front. Named second-roster jump focused `door-4` and scrolled the cabinet to it.
- Opened score slate, two doors, value leaf and archive together. Closing archive left score/values/doors open and returned focus to the archive summary. Escape folded another local disclosure and returned to its summary. Browser Back/Forward and room-action Back restored the tested value-open/archive-closed versus value-open/older-archive-open combinations, including the selected folder date, rather than replacing room markup.
- Content DOM checks: five AI rows, 24 member values, ten physical doors and 228 player references; no duplicate IDs. AJ Dybantsa search returned/opened one actual team roster. Global standing sort resets pair pinning and starts with rank 1.
- Public `workroom` contains no value leaf, member wire or `/team` action; public scouting uses dated editorial. Stale/missing AI text verified. No page JS errors or failed local asset responses during the final state/content walks. Scrolling the full value receipt reached Bruce Thornton / PG / $4.00 at the real scroll maximum. Reduced-motion emulation found zero active animations.
- Selected archive tabs now explicitly render `rgb(24,24,22)` on opaque `rgb(247,247,239)`; the former white-on-transparent defect is removed. Native visible focus remains.
- Desktop room/workroom and phone paired-locker geometry were visually inspected. This is bounded evidence, not an independent gate verdict.

Remaining limits: physical-device/screen-reader behavior, all rendered contrast pairs and product destination execution were not audited. Interior scroll positions are not part of the room-action undo snapshot; local search/sort are filters rather than undo steps. Deep product routes are supplied destinations, not applications implemented by this static fixture server. Full art, richer fold motion and exhaustive polish are intentionally absent. First-study files/captures, production, Muse, shared data and Git are untouched.
