# 02 — Court positions

Stage one: source-ready grayscale structural prototype. This is not final visual approval or production code. All work is confined to this folder; no old mock, other author's structure, shared renderer, production file, live provider, installation or Git operation was used.

## Surface contract

**User question:** “Where do I go on our court to understand this week, inspect my team or find someone in the league?”

**Primary action:** Choose a labelled court position and read its adjacent field notes. Each position already carries a useful fact: the current pairing and incomplete score, member modeled value, leading team, dated editorial edition, searchable roster inventory or recent-move count.

**Default desktop geometry:** A full-height, full-bleed flat 2D court occupies roughly three fifths of the page, with a field-note foldout on its right. Court lines are original SVG. The selected centre circle contains the current pairing, including known 0.0 and Pending. All six positions stay on the court while the reader changes. The court stays in view while longer field notes scroll with the document. Closing the foldout expands the court; selecting a position opens it again. There is no hero followed by repeated dashboard boxes.

**Default phone geometry:** A complete vertical court shows two wings, the centre matchup, two baselines and a sideline. Position labels, facts and buttons remain visible; the readable notes follow inline. Selecting a position brings that notes heading into view and focuses it; “Back to court” returns to the selected position. Grid placement gives content enough height instead of compressing the desktop coordinates. At enlarged root text, the narrow court uses one wider lane with alternating alignments so long names remain readable rather than colliding.

**Navigation and states:** Six real buttons control one nonmodal adjacent reader. Native disclosures expose evidence, complete values, rosters and archives. Search and sort operate entirely on the supplied fixture. Direct destination links remain in primary navigation, All routes, contextual actions and footer. Home/Stocks/All routes stay visible on narrow screens; News and Arcade remain available under All routes. Escape closes the reader and returns focus. There is no modal, drag, hover-only path or scroll hijacking.

## Capture API

`document.body.dataset.studyReady = '02'` is set after first rendering.

`window.goatStudy.states` and `activate(id)` expose:

| State | Court position | Reachable content |
| --- | --- | --- |
| `matchup` (default) | Centre circle | Own member pair / public featured pair, current week, both managers, records and incomplete scores; all five saved AI rows and provenance |
| `roster` | Left wing | Member identity/actions, modeled total, top three and all 24 values, watch/form, completed-week recap, news and moves; all ten league faces. Public: league faces/values, Stocks and unavailable data only |
| `standings` | Right wing | All ten ranked teams, manager, W–L and correctly scaled PF; playoff facts; honest Power unavailable |
| `edition` | Left baseline | Dated draft game/editorial, three full spotlights and exact stats/periods/opinion, selection/source disclosures, happenings and both dated archive entries/routes |
| `league` | Right baseline | All ten team summaries, managers/current records/current opponents, all 228 unique player references with position/NBA/profile route; team/manager/player search and team sort |
| `wire` | Sideline | All three synthetic league moves, dated happenings/sources, Stocks/trade/AI/Arcade/Free Throw actions and provenance boundaries |

On desktop the hook keeps captures at the top. On phone, nondefault states bring the inline reader to its beginning; the default state keeps the whole court visible. Close/reopen is an additional interaction, not a separate content state. Search/filter/disclosure states remain available through native controls rather than extra capture IDs.

## Information and truthfulness

- Data uses the required explicit imports from `../../data.js`; no requests beyond local page/assets. The visible fixture line distinguishes Nov 12 synthetic metrics from actual today. Sources preserve original editorial dates.
- The first returned AI choice is Ware the Hoes At? at 35%, with Reaves Dropper at 65%; independent confidence is 20%. Every saved row displays returned choice, both probabilities, confidence, model/prompt, generation time, scope, input evidence and explicitly unavailable null snapshots/baseline. `?ai=stale` is labelled stale; `?ai=missing` keeps all five pairings with unavailable output and no probability bars.
- Member value is the supplied modeled FAAB total with priced/unpriced coverage, pricing basis and computation time. All 24 roster values remain reachable. Price change is explicitly separated from form. Recorded team-value history and Lineup Power have no invented chart/ranking.
- Form watch retains EMA FP/G, eight observed games and unknown availability. Completed Week 2 recap retains the exact Nov 2–9 source period, FP and GP; five unique eligible players are shown once. Embiid retains both Best and Rough tags in one row; source list counts and coverage remain explicit.
- Public rendering never reads the member summary or renders its team management action, personal value total, guide, news or moves. The local fixture remains a design mode switch, not an authentication boundary.
- All ten faces retain player/team links and modeled value. Every team roster exposes every supplied player reference. The directory's prior-season record is dated; NeuralNets visibly attributes 2025 to the previous manager as QBs Gremlins.
- Dated draft Week 1 editorial is separate from synthetic current Week 3. The two archive entries retain draft/date/status, game context and source dates. The prior final remains a historical recap with its supplied score.
- Stocks uses `/stocks#player-board`, never an invented player query. All requested destinations are real route links; this static fixture does not implement the destination apps.

## Why this changes the architecture

The court is the information map throughout the experience. Matchup, values, standings, editorial, directory and moves occupy distinct, labelled basketball positions and keep useful data visible there. A selected position changes one contextual foldout rather than appending another section or routing through a dashboard stack. Phone preserves the court and transforms its placement; the detail reader becomes inline. The common fixture supplies facts only; this folder authors its own markup, CSS and state handling.

The supplied craft study affected concrete decisions:

- Hallmark custom direction/macrostructures: the court governs the full navigation and reveal model, not only an opening illustration. There is no copied section sequence or equal-card grid.
- Elaya redesign: inline expansion and an unboxed foldout keep the selected origin understandable. Native disclosures handle secondary inventories without losing content.
- Adapt and Hallmark responsive: the narrow version changes the coordinate layout into a content-sized vertical court while preserving the same tasks, rather than shrinking desktop text.
- Apple spatial continuity and Rauno direct interaction: the selected court position stays visible, selection is immediate, and Back/Escape returns to that origin.
- Accessibility/frontend engineering: real buttons, visible focus, labels, native disclosure controls, actual long fixture names and browser reflow checks drove the geometry. Essential court facts and list body text use rem-based 16px body sizing; provenance captions remain smaller. Inline source/profile text links use the inline-text exception rather than claiming every text link has a 44px box.
- Emil/pbakaus motion: stage one uses no animation. The later motion thesis, if this structure passes independent review, is one short, interruptible horizontal foldout transition that explains the reader opening from the selected court position. Frequent keyboard changes remain instant and reduced motion uses the same still state. No animated numbers, autoplay, observer reveal or decorative loops are planned.

## Actual checks

Verified with installed Playwright and Chromium against the parent-served local port 4207:

- All six states at 1440, 390 and 320 CSS pixels: no document horizontal overflow; all rendered without page errors.
- All six states at 1440, 390 and 320 with 200% root text: no document horizontal overflow. The court switches to content-sized placement; the very narrow enlarged court uses one lane.
- Directory: 10 team disclosures / 228 player rows; Embiid search produces one team and one player; roster-count sort leads with Ware the Hoes At? (27 players).
- Member: complete 24-value disclosure, ten faces, three watch rows plus five unique recap rows.
- Ready AI: five rows, ten meters; first returned choice 35%, independent confidence 20%. Stale notice present. Missing state: five rows and zero meters.
- Public: ten faces, zero personal value rows, zero `/team` links, no “Your roster value” text.
- User selection focuses the reader heading. Escape closes and restores the standings trigger in the exercised path.
- Author inspected own desktop/phone renders for court/reader geometry, then removed temporary check images. Root owns final bulk captures and independent comparison.

## Limits / still abridged

The prototype is source-ready for independent structural review, not accepted final art. Root's cross-study capture, physical-device and screen-reader testing are pending. Route destinations are preserved links and were not exercised against the production app. No formal contrast certification is claimed, though authored colors are neutral grayscale and portrait images are filtered grayscale.

All requested information families have representative actual content and complete core lists. Deep producer internals, null hub aggregate statistics and unused fixture metadata are not separate UI views. The current edition carries the three supplied spotlights; the matching archive entry links to its dated route instead of duplicating those same spotlights within its archive disclosure. Local search sorts teams (standing, name, roster count); players remain in supplied source order within their reachable rosters. No final imagery, animation or production integration has been attempted.
