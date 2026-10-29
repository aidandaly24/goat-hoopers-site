# 18 — Guided scroll story

Stage one: bounded grayscale architectural prototype. Source frozen for the independent twenty-structure gate; no full visual implementation or final acceptance claimed.

## Surface contract

- **User question:** What is known about this week, what is the model merely saying, and what evidence should I inspect next?
- **Primary action:** Read a chapter or jump directly to the evidence needed for a team, player, saved pick or dated edition.
- **States:** `week`, `model`, `team`, `scouting`, `league`, `archive`. `window.goatStudy.states` names each; `activate(id)` changes the actual stage and scrolls to the actual chapter. `body[data-study-ready="18"]` marks readiness.
- **Narrow layout:** A compact persistent score/data readout, one native chapter selector, and the full evidence document. The top masthead has GOAT identity, Stocks and Explore; there is no inherited row of route links. Explore opens a normal-flow destination list. The one **Synthetic concept** control stays on the stage and expands the full provenance in normal flow, with Return/Escape restoring the originating scroll position and focus.
- **Forbidden patterns:** Repeated card grid; dashboard below a novelty introduction; hidden essential narrative; forced scrolling; drag-only navigation; predicted values presented as results; invented History or Power; replacement of the model’s actual choice with the larger probability.

## Geometry and state model

Desktop uses an approximately 52/48 continuous split. A dark still stage stays alongside a light scrolling evidence measure. It is an active data surface throughout: the opening incomplete scoreboard becomes the returned model choice and probability split, the member’s modeled subtotal or public league anchors, a selected editorial player and source-period stats, the league index, and finally a distinct historical/upcoming archive scoreboard. Chapter number/current state and direct chapter links belong to this stage.

The evidence has no reveal effects. All six chapters exist in the document from readiness onward. A bounded observer and one queued position read per scrolling frame update the stage; neither changes scroll position. Explicit chapter jumps are instant. Pair, editorial-player, team and archive buttons change the real stage while retaining the reader’s position in the evidence. Their selected states use `aria-pressed`.

At 390/320 the stage becomes a short text readout rather than a shrunken desktop composition. The native selector replaces the six-link stage index. Managers, source notes and full data remain in the immediate evidence. At 200% root text on phones, the stage deliberately enters normal document flow: enlarged content does not cover the reading area. The same facts and native jumps remain available. At enlarged desktop sizes the bounded stage can scroll internally if needed; all corresponding evidence stays in normal page flow.

This is a structural change because the reader’s continuous position determines the data stage, and all information remains part of the parallel evidence journey. There is no generic home dashboard underneath it.

## Content map and factual boundaries

| Place | Concrete content |
| --- | --- |
| Stage 01 / current chapter | Current Week 3 from `personal.matchup` for members or directory current matchup for public; both teams, managers, records and scores; 0.0 remains known, null stays Pending, explicitly incomplete. |
| Stage 02 / model chapter | All five saved AI rows; actual away choices at 35%, other team 65%, independent 20% confidence. Every row exposes saved timestamp, slate/pair status, model, prompt, null input/slate snapshots, baseline, league/season/week/roster IDs and evidence. Any pair can take the stage. `?ai=stale` labels the slate and stage stale. `?ai=missing` shows no saved choice, bars or inferred result. |
| Stage 03 / member chapter | Reaves Dropper identity, manager, current record/standing, 24-player count, `/team` and `/teams/1#team-roster`; modeled FAAB subtotal, complete coverage, basis/time, supplied modeled-value rank, top three and all 24 priced roster rows; unavailable history; all three form-watch rows, all three best and rough rows with FP/GP, completed Week 2 period/coverage; two team wire stories and one recent move. |
| Stage 03 / public chapter | All ten faces with player/team/profile links, position and supplied modeled FAAB value. No member summary, valuation, watch guide, private-team links or team wire is rendered. Members reach the same ten faces inside the league index. The URL comparison is explicitly a design fixture, not an auth boundary. |
| Stage 04 / scouting chapter | All three exact supplied takes: Jokić, Embiid, Dybantsa; full opinion, three stats each, qualified period, editorial selection reason, current team, source link/check date. Any player can take the stage. All three dated happenings and all five edition source links are reachable. |
| Stage 05 / league chapter | All ten standing ranks/W/L/PF (source hundredths / 100), team/manager, roster count and current opponent. Useful local team/player/position/NBA search; standing/name/roster-count sort; zero-result Clear. Ten expandable team rosters contain all 228 unique supplied player references with position, NBA team and real player/profile links. Each team carries its face, supplied model value and qualified previous-season record; NeuralNets retains the previous-manager/QBs Gremlins attribution. All three league moves; honest Power unavailable. |
| Stage 06 / archive chapter | Both dated draft/unpublished editions with exact dates/bounds, game context, selection, state, scores and sources; the historical W40 happening is retained in source disclosure. `/weekly/2026-W41` and `/weekly/2026-W40` are real destination links. Each edition can take the stage. The final has 326.0–251.5; the upcoming 1/5 watch remains Pending. History remains unavailable. Stocks, trade analyzer, Arcade and existing free-throw game are concrete actions. |
| Masthead / Explore / footer | Home, `/intel` News, `/stocks#player-board`, History, Arcade, AI Decides, Teams, Transactions, trade analyzer, weekly archive, free-throw practice; member team/roster routes only for the member edition; public/member comparison and expandable fixture provenance. |

The known preserved conflict is not merged into a result: `home.edition.game.teamIds` is 1/2 while its dated prose describes 1/5. Dated editorial/game narrative here comes from coherent `data.archive`; current Week 3 comes from directory/personal current matchup. The common data is unchanged. November 12 is the fixture check date, not actual today.

Stage-one abridgements are presentation only: desktop league stage shows five standing rows, with all ten in the parallel index; public stage shows four anchors, with all ten in the chapter. Internal IDs are retained through routes/attributes/provenance rather than printed everywhere. The all-null aggregate league-leader slots, zero standings games-back/ties, full season playoff metadata, and null directory opener/latest-move/recent-move fields are not separately printed. No claims are invented for them. The full implementation must retain and review every supplied field/reference; this bounded stage does not claim that full-stage inventory gate.

## Craft and motion

Hallmark’s custom-direction/macrostructure principle changed the entire page into a paired story/stage, rather than introducing a custom hero above familiar sections. The Pudding source-study principle ties a changing explanatory visual to persistent readable evidence. Elaya’s redesign principle removed equal-card symmetry: roster disclosures and the local index belong inside the reading journey. `adapt` changed phone navigation to one native chapter selector and compressed the stage to actual readout content. `accessibility` and `apple-design` informed direct controls and provenance return to its originating chapter. `animation-on-scroll` informed bounded stage updates without reveal or scroll control.

Stage one uses instant still changes, no animation, timers or autonomous loops. Proposed full-stage motion job: one short, interruptible dissolve connecting a user’s chapter change to its replacement data stage. Frequent pair/team selection and keyboard input remain immediate; reduced motion retains the same still stage and the same complete narrative with no dissolve. No score/value tweening, portrait entrances, scroll hijacking or new motion library.

## Verification and limits

Local static-fixture browser evidence, Chromium `/usr/bin/chromium` via the installed Playwright module, 2026-10-29:

- 72 state activations: six chapters × member/public × 1440/390/320 CSS px × 16/32px root font. Expected stage selected throughout; no document horizontal overflow. 32px is an explicit 200% root-text test, not a browser-zoom or physical-device claim.
- Source/runtime inventory: 228 roster references / 228 unique player IDs; all 24 member value rows; public DOM has no member value list. All five model pairs render.
- Exercised pairing 5, Dybantsa, upcoming archive, local Embiid search, no-match/Clear, and roster-count sort (27-player team first). The stage changes to actual selected fixture content.
- Exercised native keyboard chapter selection; Explore open/Escape/focus return; provenance expansion/Return with exact originating scroll and focus restoration.
- Exercised ready, stale and missing AI pages, plus live reduced-motion preference. No JavaScript errors or remote runtime requests in the browser checks.
- Inspected default desktop and 390px screenshots locally. Root owns the review captures; no bulk capture tooling was added.

Remaining limits: no screen-reader or physical-device pass; no Next route/history integration or downstream game/trade/Stocks testing; no complete measured contrast audit; no independent structure review/full-art gate yet. System-font grayscale source only. Production build is not relevant to these isolated HTML/CSS/JS files and was not run. No Git, production, shared data or other author files changed.

## Deliverables

`index.html`, `story.css`, `story.js`, `STRUCTURE.md` only, inside `qa/homepage-structures/wireframes/18/`.

Preview: `http://127.0.0.1:4207/qa/homepage-structures/wireframes/18/index.html?view=member` (or `?view=public`).
