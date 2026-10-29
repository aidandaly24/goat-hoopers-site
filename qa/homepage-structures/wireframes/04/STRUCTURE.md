# 04 — Broadcast switcher, grayscale stage one

**User question:** What is happening in my current game, and which source should I put on the main program next?

**Primary action:** Choose a game in the score rail; its actual fixture scores, team context and saved model result replace the main program. Choose another source for a different task. This is a control room for reading league information, not a claim of live video or live data.

## Geometry and state model

At 1440px the opening has a narrow 168px numbered source slate, a large flexible program window and a 282px score rail. One dark score field dominates the default program; scores and team names carry the hierarchy. The other programs use their own geometry: an unboxed valuation ledger, a scouting comparison, a dated editorial reader, a searchable roster index, a table, and a tool handoff list. There is no equal-card dashboard beneath a decorative broadcast opening.

The source slate and score rail stay available beside the active program. The document scrolls normally; the program has no artificial fixed-height scroller. All five score rows remain reachable. The rail's native disclosures hold provenance rather than hiding it behind hover.

Below 820px the source slate becomes a native labeled program selector above one program. A sticky compact score strip shows the selected game's known/Pending scores. Its button expands the five-game rail; choosing a game closes that rail and puts the comparison on program. It has a bounded scroll area only while expanded on phone. At 320px enlarged text can reflow the two-team comparison to one comparison flow, while retaining all fields. Phone retains switching rather than stacking every desktop source into a long dashboard.

`window.goatStudy.states` exposes eight member states (seven public): `matchup`, `team`, `scouting` (member only), `edition`, `league`, `standings`, `wire`, `tools`. `activate(id)` switches actual content; `matchup` resets to the member's own pair, and `league` resets to all rosters. `document.body.dataset.studyReady = '04'` marks readiness. The header/source controls remain native links, buttons, select and disclosures. A skip link and visible keyboard focus are present. No modal, drag, gesture or hover-only path is used.

Additional reachable substates: game buttons select each of five pairings; both edition-date buttons select full dated archive entries; League index has Teams & rosters / Standings / League faces buttons; team and model disclosures expose detail. These use the same program rather than additional hidden capture surfaces.

## Information map

- **Identity / destinations:** approved local GOAT logo, Home, News (`/intel`), Stocks (`/stocks#player-board`), History, Arcade. More contains AI Decides, Teams, Transactions, Trade analyzer and Weekly archive. Tools repeats useful actual handoffs including `/arcade/free-throw`. Member desk links `/team` and `/teams/1#team-roster`. Header comparison link switches public/member fixture mode and retains AI query state.
- **Current week:** default uses directory/personal current Week 3 pair, both teams/managers/current records and scores. Known 0.0 and null Pending are distinct. Every score rail row can become program. Incomplete status never declares a result. All five saved AI rows show the actual returned away choice at 35%, separate 20% confidence; each provenance disclosure carries both 35/65 probabilities, timestamp, model, prompt, null input snapshot, evidence and model-probability qualifier. Central selected program repeats the complete split. `?ai=stale` labels saved picks stale; `?ai=missing` shows unavailable without running anything.
- **Member team:** team identity, standing, record, 24-player count, actions; supplied modeled FAAB priced subtotal with 24/24 coverage, zero unpriced, pricing basis/time and supplied value rank; top three exact values and modeled change; all 24 named roster values and positions in disclosure; unavailable recorded history. Synthetic team news and exact supplied recent move remain in the team desk. Public `team` is League faces and never renders personal values, news, moves or scouting.
- **Scouting:** all three form watches with exact EMA values, observed-game counts and unknown availability notes; message distinguishing form from projection. Completed source Week 2 period and coverage stay explicit. Best and rough rows are deduplicated by player, retain both selection positions, exact points/GP and five eligible played players. DNP/unknown are excluded, and synthetic status remains visible.
- **League:** all ten faces have player profile, franchise profile, manager, position, modeled value and champion label where supplied. League index has all ten team summaries, managers/current record, current opponent, full 228 unique player references with position/NBA team and real profile links. Team/player/manager/position/NBA search works locally. Teams sort by current rank/name/roster size; roster players sort by supplied order/name/position. All ten standings retain rank/W–L/PF using `pointsFor / 100`. Prior records have their season; NeuralNets names the previous-manager QBs Gremlins attribution in its summary and full roster.
- **Editorial:** dated coherent `data.archive` records supply both editions, their game context/status/scores, all three supplied spotlights with exact stats, opinion, stat period, selection and checked source dates. Happenings and every edition source are reachable with date bounds and draft/no-publication status. Both archive routes and the weekly index are real links. `home.edition.game.teamIds` conflicts with its preserved title/prose; it is not used to infer a corrected game. Current Week 3 comes only from directory/personal; dated editorial comes from the coherent archive entries.
- **Wire / tools / missing producers:** all three supplied league transactions retain week/type/time, team links and explicit empty player legs. Both dated archive entries can be cued here. History and Power have clear unavailable copy; no series/ranking is invented. Footer keeps fixture, provenance and non-authentication caveats visible.

## Why this changes the architecture

Selection changes the complete reading surface, not a highlight on repeated cards. Persistent games act as selectable sources; the dominant program is mutually exclusive with other tasks. The same switcher controls valuation, editorial and directory inspection, so broadcast logic governs the whole experience. Phone changes the controls to a source selector plus expandable score rail and one reader. It does not shrink the three-column desktop layout or repeat all source panels in a stack.

Concrete craft principles applied from `reference-notes/craft.md`:

- Hallmark custom direction / macrostructures: one task-specific idea governs composition, reading and navigation throughout; this produced a source/program/score system rather than a themed hero followed by an old dashboard.
- Elaya redesign: break equal-card symmetry and retain local state/focus. A dominant program, variable unboxed readings and in-place native disclosures replace a grid. Team/player searches update local results while keeping input focus.
- `pbakaus/adapt`: adapt the task and controls. Phone uses a native source selector and controlled score expansion, with all underlying information retained.
- Rauno and Emil Apple design: preserve direct source-to-destination context. The chosen score row remains marked, program labels identify the selected source, and secondary actions return to a meaningful source.
- Addy accessibility / frontend engineering: real content, named controls, keyboard focus and separate 320px/200% checks; no hover-only mechanics or screenshot-as-proof claim.
- `pbakaus/animate`, Emil frequency/purpose gate and accessible-animation: frequent selection is immediate. This stage intentionally has no animation, autonomous work, timer, reveal or score tween.

**Later motion thesis, proposed only:** a brief user-initiated opacity handoff restricted to the program boundary could make an occasional source change legible while slate/score context remains still. Repeated/keyboard input and reduced motion stay instant. There is no approved full-art animation implementation in this stage.

## Actual bounded verification

- `node --check` passed for `app.js`.
- Local root-owned preview server returned HTTP 200 at the assigned URL.
- Installed Playwright/Chromium loaded member/public ready and stale/missing modes without page errors.
- All eight member states rendered at 1440, 390 and 320 CSS px; initial 320px/200% checks found intrinsic long-name overflow, which was corrected. All eight member states then measured `scrollWidth === innerWidth === 320` at 200% root text, including open member-value, first-roster and selected-model detail.
- Counts verified in actual rendered state: five score rows, ten team disclosures, 228 player references, 24 member value rows. Player search for Şengün returned his one real roster reference. All seven public states were checked for leakage of the private subtotal/member-news/scouting example patterns; none matched.
- One desktop and one phone diagnostic image were visually inspected during authoring; root owns the review capture set. These are not final-art acceptance evidence.

## Limits and stop point

Source-ready grayscale architecture only. No Git, production, shared, Muse, remote provider, install or external service changes. Local navigation to actual application routes is represented by correct links; this static Python preview does not prove those production route behaviors. No screen-reader/physical-device audit, full production build, final art, animation, measured contrast certification or independent structural acceptance is claimed. Null hub summary stats and unavailable producers are not turned into decorative metrics. No remaining required information family is intentionally omitted; deep production-only data and live authentication remain outside this fixture. Public/member URL switching is a comparison control, not an auth boundary.

Files: `index.html`, `style.css`, `app.js`, `STRUCTURE.md` only in this author folder.
