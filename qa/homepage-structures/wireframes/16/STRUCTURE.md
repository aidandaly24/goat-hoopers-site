# 16 — Player filmstrip / the bench

Status: stage-one grayscale architectural prototype, frozen for the independent structure gate. This is not a final visual design or production acceptance. Source is confined to this folder: `index.html`, `style.css`, `app.js`, and this note. Facts come exclusively from `../../data.js`; all assets are approved local files. No shared presentation, production, Git, live provider, installation or other author work was used.

## Design contract

**User question:** Who is this franchise, what does its current pairing mean, and what should I inspect next?

**Primary action:** Choose an actual featured player portrait to open that franchise’s attached bench dossier. Previous/next franchise buttons name their destinations; a direct ten-team native index is always available. Left/right keys on the selected portrait move through the same ten franchises.

**Relevant states:** Ten selected franchises; week versus roster dossier; member-only scouting and wire for team 1; a separate league reader with slate, directory/standings, dated dispatch, and tools chapters; public/member, ready/stale/missing AI; search results and empty results; native source, roster and archive disclosures.

**Default desktop geometry:** A continuous portrait panorama spans the page. The selected portrait expands to roughly 25rem, with overlapping, varied-width/height neighbors on the same bench plane. It is not a row of independent framed cards. The selected face stays at the start of the panorama and the cyclic neighbor order follows it. A wide attached dossier begins directly below the bench controls: franchise identity occupies its narrow left column; the active reading context uses the wider right column. No repeated dashboard tiles follow the portrait strip.

**Default phone geometry:** The panorama transforms into one useful selected portrait, compact named previous/next paths and a full-width direct franchise index. The attached dossier follows with franchise identity and the current week/roster/scouting context. The phone uses a compact GOAT / League reader / Routes header and a one-line **Synthetic concept** disclosure; all routes and full fixture provenance remain reachable. This is a task transformation rather than ten small portrait cards squeezed across the screen. At 390px the selected franchise heading starts about 504px down the page, with the dossier tabs and current-pairing context visible in the initial 844px viewport. Long dossier content scrolls normally.

**Forbidden patterns:** Equal player cards above a generic dashboard; drag-only selection; hover-only disclosures; invented data/lines/ranks; a max-probability replacement for the model’s returned choice; personal edition content in public rendering; current-week claims made from October prose.

## Navigation and state model

The bench and league reader are distinct full-page reading states. The reader retains the selected bench franchise and has an explicit Return to the bench control. Its desktop table of contents becomes a wrapping chapter navigation on phones. Direct hashes (`#bench/5/week`, `#bench/1/roster`, `#reader/directory`, etc.) restore substantive views; browser Back/Forward traverses the same state changes. Dossier tabs preserve portrait/franchise context. Changing franchise resets the dossier to its week view. Search/sort inputs are local and produce real filtered/reordered fixture content. Native disclosures avoid modal containment.

The filmstrip has one keyboard tab stop for the selected portrait, explicit left/right keyboard movement, ten clickable portraits, named previous/next controls, and the native direct index. The Routes disclosure closes with Escape and returns focus to its summary. Reader entry/return focuses the relevant content heading. Dossier tab activation restores focus to the replacement active tab. Essential data is never motion-gated.

`document.body.dataset.studyReady` is `16`. `window.goatStudy` exposes:

| State id | Actual view |
| --- | --- |
| `bench` | Team 1, current matchup and attached dossier |
| `neighbor` | Team 5 selected, with cyclic neighbor panorama |
| `roster` | Team 1 roster; member gets all 24 modeled values |
| `scouting` | Member-only form watch, completed-week recap and team wire |
| `slate` | Separate league reader, all five current matchups and AI rows |
| `directory` | Full searchable ten-team directory and standings |
| `dispatch` | Dated October editorial and archive reader |
| `tools` | Stocks/trade/intel/transactions/history/Arcade destinations |

Public rendering exposes seven capture states, omitting `scouting`. All other ten franchise selections use the same actual bench interaction, not additional capture-only renders. Search states, disclosure states and member/public/AI query modes are reachable through their controls and URLs.

## Content map and factual handling

| Visitor job / inventory | Concrete home in this architecture |
| --- | --- |
| Recognizable identity, Home and destinations | GOAT logo/Home; desktop News/Stocks links; persistent League reader; Routes disclosure includes Home, News `/intel`, Stocks `/stocks#player-board`, Teams, Transactions, AI Decides, History, Arcade, trade analyzer and weekly archive. Reader tools also exposes destinations and the approved free-throw preview linking to `/arcade/free-throw`. |
| All ten faces, players, teams and modeled values | Actual approved portraits are the bench entry. Their accessible names include team/player/value. The selected dossier’s Franchise notes disclosure gives the face’s modeled FAAB value and a real player profile link; team and roster profile links are distinct actions. Direct indexing reaches all ten. |
| Current own pairing / all current pairings | The bench week dossier uses `directory.currentMatchup`; member team 1 is explicitly Your franchise. It shows both teams/managers/records and scores. Reader slate gives all five pairs. 0.0 remains known; null is Pending; every pairing is explicitly incomplete. |
| Saved AI | All five rows in the slate and the selected pairing in the dossier. The returned away choice stays 35%, with the other team 65% and confidence 20% separately. Native disclosures carry generated time, season/week, model, prompt, null input/slate snapshots, input evidence, empty returned evidence and missing baseline. Stale labels saved results as stale; missing has no fabricated result. No generation runs. |
| Member identity and actions | Team 1 dossier: manager, standing, record, 24-player count; Franchise notes links `/team`, `/teams/1` and `/teams/1#team-roster`. Public mode uses only its public `data.personal` shape. |
| Member modeled value | Week/roster dossier: $1095.25 modeled total, 24/24 priced, 0 unpriced, in-season basis/time, value rank, top-three players/prices/change percentages; roster tab renders all 24 actual values and their position/NBA references, with value sorting. Recorded value history is explicitly unavailable. |
| Member scouting and wire | Scouting tab: EMA FP/G, observed GP and basis/message; all best and rough recorded point rows, completed Week 2 period, eligibility/coverage and explicit synthetic caveat; both supplied news items/outlets/times and supplied recent move/time. Default unknown availability text is not made into an injury judgment. |
| Full league directory and all player references | Reader directory: all 10 current teams/managers/records/opponents; all 228 unique roster references with position/NBA and `/player/:id` links in native team disclosures. Local search spans teams/managers/players/positions/NBA teams; sort supports team name, standing or PF. Search opens matching team rosters and provides count/empty state/Clear. |
| Standings / prior season | Directory has all 10 ranks, W–L, PF divided by 100. Team notes/directory disclose 2025 record/finish. NeuralNets keeps the previous-manager/QBs Gremlins attribution. Power is explicitly unavailable. |
| Dated edition and three spotlights | Reader dispatch uses coherent `data.archive[0]` (Oct 5–11 draft, unpublished). Its upcoming game is team 1 vs 5, separate from November Week 3. All three spotlights retain exact stats/opinion, period, selection reasons and checked source/date. |
| Dated happenings, sources and archive | Dispatch retains all W41 happenings and all source links/dates. Both dated archive entries link to actual `/weekly/:id` routes. W40’s historical 2025 final is a separate native disclosure with 5/7, 326.0–251.5, final state, dated recap qualification and its sources. |
| Provenance and comparison | Compact top Synthetic concept disclosure contains full synthetic/future-fixture explanation. Footer has public/member comparison and stale/missing AI query links, producer limitations and static-study boundaries. |

The preserved `home.edition.game.teamIds` conflict (1/2 versus its 1/5 prose) is not combined or corrected. Current matches come from the directory. Dated game/editorial comes from coherent `data.archive`, with exact dates and draft/unpublished status. The November 12 fixture date is explicitly not represented as today’s live source.

## Applied reference map

- **Hallmark custom direction / macrostructures / redesign / responsive:** The visitor job governs the whole architecture: choose a real face, then read its attached context. The league-wide reader is another reading model, rather than an unchanged dashboard underneath a novelty hero. The grayscale gate evaluates composition/navigation/reveal before art.
- **Elaya redesign-existing-projects:** Breaking equal-card symmetry and using inline expansion changed the selected portrait’s width and the attached dossier. Context, focus and browser history are retained when moving between reading modes. The landing-page sales funnel and floating navigation were not applied.
- **pbakaus/adapt:** Phone uses one selected portrait and named adjacent-franchise routes. It does not shrink ten desktop panels or remove the full directory/league tools.
- **Rauno interaction / MoMA indexed collection:** Faces are direct entry points, with a useful ten-team native index and explicit keyboard paths. No drag or hover is required.
- **Addy accessibility / frontend-ui-engineering:** Native controls, rendered state names, visible focus, actual populated fixture content, empty search state and browser verification changed the implementation. Both narrow reflow and text enlargement were tested rather than inferred from CSS.
- **Emil / pbakaus / accessible-animation:** Routine team and keyboard changes are immediate. There are no entrance reveals, score tweens, RAF loops, timers, observers or motion libraries.
- **GOAT local visual-hierarchy/navigation/motion references:** Names, scores, source distinctions and real destinations take priority over framing. The selected scope’s explicit QA architecture permission is applied without editing production design rules.

## Motion thesis and still equivalent

Stage one deliberately uses immediate selection. In a later gated visual build, a single short, interruptible pointer-triggered expansion could connect the selected portrait to its attached dossier and show the change in reading width. This would not tween numbers or defer essential text. Frequent keyboard actions remain immediate. Live reduced-motion preference keeps exactly the same portrait, dossier, controls and chapter views with zero transition. No motion work is claimed as complete beyond this still working prototype.

## Bounded verification

Executed with installed Playwright and `/usr/bin/chromium` against root’s `127.0.0.1:4207` server:

- `node --check app.js` passed.
- All 8 member capture states activated at 1440, 390 and 320 CSS pixels, with no page overflow. Repeated at 200% root text size; all states passed. Repeated with all main native disclosures open; no page overflow. Expanded top provenance and Routes menu also passed at each width/text size.
- Actual ten local portrait requests loaded with nonzero image dimensions. No JavaScript page errors in checked member/public, ready/stale/missing states.
- Directory renders 10 franchises, 228 unique player ids and 10 standings rows. Search `Curry` returns one actual franchise; Clear restores the directory. Rank sort starts with Reaves Dropper.
- Member roster renders 24 actual priced references; `Embiid` search returns one. Member/public comparison check found no member value, My team link or scouting capture state in public rendering.
- Current first pairing preserves 0.0 / Pending; saved choice is Ware the Hoes At? 35%, Reaves Dropper 65%, confidence 20%. Stale and missing query states have explicit corresponding text. League reader contains all 5 matchups and AI rows.
- Direct index to team 10 works; ArrowRight wraps to team 1 and retains selected-portrait focus. Next, reader return, browser Back/Forward, Routes Escape/focus restoration, and live reduced-motion state change were exercised.
- Desktop and phone rendered images were visually inspected as bounded layout checks. Root owns the final comparative captures.

No live/auth/provider tests, production destination navigation, screen-reader pass, physical-device pass or exhaustive contrast audit were performed. Inline prose/source links use normal text-link targets; dedicated phone controls, provenance disclosure and roster/player rows use 44px or larger targets.

## Deliberate limits / abridged inventory

- Full art, color, typography choice, transition polish and exhaustive asset treatment await the independent structure gate.
- All required information families have a populated reachable place. W40’s repeated player-spotlight/happening bodies are not duplicated inside the local historical-final disclosure; its dated archive destination remains available. The newer W41’s complete spotlight/happening/source inventory is rendered locally.
- Null avatar/ESPN ids, null league-superlative stats, unused snapshot internals and raw duplicate identity objects are not printed as a dump. Null history/power/AI-input/baseline states are represented honestly. There is no chart or power-rank substitute.
- The directory/roster search and sort operate on the supplied local fixture. They are not live loaders. The imported fixture carries both public and member data by brief; this static comparison is not an authentication boundary.
- Hashes restore substantive reader/bench state; transient disclosure openness and search text do not survive a full reload. Real destination links leave this static study, so production route behavior is outside this check.
