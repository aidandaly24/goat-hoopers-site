# Study 10 — Focused desk

Stage one only: independent grayscale working structure. No final art or production integration is claimed. Files: `index.html`, `style.css`, `app.js`, this note. All authored changes are confined to `wireframes/10/`.

## Surface contract

**User question:** What should I inspect before acting on this week's matchup or my roster?

**Primary action:** Inspect the saved model response beside the current matchup; then read the opponent's full roster. The member edition also offers a complete modeled-value and form audit. No transaction or lineup mutation is simulated.

**Desktop geometry:** A persistent 200px task rail and one large, white working document. Five verb-led tasks replace that document. Ordinary record rows and prose carry the information; there is no overview tile layer or repeated bordered card grid. A 304px contextual evidence inspector exists only after an explicit saved-pick inspection. The source document stays alongside it.

**Phone geometry:** One compact native task picker, GOAT Home identity and direct Stocks link precede the document. A small Back/Home/context line supplies orientation. The task document takes the available page width and height. A model inspection becomes its own full-height reader with a named “Back to matchup document” action; closing it restores the originating inspection control. The desktop rail is removed from layout and keyboard order. Tables become wrapped compact records, rather than a horizontally scrolling desktop canvas. At 320px, roster identity has its own line before position/NBA/value metadata.

**Relevant states:** Current matchup; saved response inspector; full personal roster audit; searchable directory; full team document; dated October draft; historical-final draft; real tool destinations. Stale/missing AI variants and public/member rendering are distinct.

**Forbidden patterns:** An overview dashboard, show/channel switching, metric widgets, hero followed by equal boxes, fabricated rankings/history, picking the larger model probability instead of the returned choice, and phone panels that merely squeeze the desktop layout.

## Navigation and state model

The rail offers working actions: Review matchup, Audit my roster (member only), Find team or player, Read dated edition, Open league tools. Each is a replacement document, not an overview section or a broadcast channel. Team details are a deeper document reached from lookup or the current opponent. Native roster disclosures permit inspection in place without losing the search context.

Task changes and model inspection use local URL history (`#directory`, `#team-8`, `#matchup/pick-0`, etc.). Browser Back/Forward restores the selected document; toolbar Back uses that same history. Task focus moves to the working document, inspection focus to its named heading. Escape or the reader's Back action closes the inspector and returns focus to its originating pick control. On a direct initial document, Back is disabled. Direct hashes select the corresponding local working state.

`window.goatStudy` exposes eight capture states:

| ID | Actual state |
| --- | --- |
| `matchup` | Current Week 3 personal pair, or public first pair; all five saved rows below |
| `pick-evidence` | First saved response inspector attached to matchup |
| `roster` | Personal modeled-value/form/news/move audit; public shows a member-task unavailable document |
| `directory` | All-ten lookup with search, sort, all reachable rosters and standings |
| `team-roster` | NeuralNets full public roster and previous-manager attribution |
| `edition` | Oct 5–11 draft with coherent archive pairing 1/5 and three spotlights |
| `archive` | Sep 28–Oct 4 historical-final draft, pairing 5/7 |
| `tools` | Existing routes, game preview/Play and recent league moves |

`document.body.dataset.studyReady = '10'` is set after rendering. Remaining team documents use `team-1` through `team-10`; these are reachable through lookup and local navigation. The eight API states represent the full document families rather than every disclosure.

## Content map

| Information family | Concrete location and treatment |
| --- | --- |
| Identity and find/action destinations | Approved grayscale GOAT mark in desktop rail; GOAT Home on phone. Home/News/Stocks/History/Arcade remain direct desktop links, Stocks direct on phone. Open league tools contains News `/intel`, Stocks `/stocks#player-board`, History, Arcade, AI Decides, Teams, Transactions, Trade Analyzer and Weekly archive. The member edition adds `/team` and `/teams/1#team-roster`. Both editions have a public/member comparison link. |
| Current week and personal pair | Default working document uses `personal.summary.matchup` for member, current directory pair for public. Both manager names, records, week, score and incomplete status are present. Known `0.0` and unknown `Pending` are different. |
| All five saved AI rows | Matchup document retains every returned choice and both probabilities. Choice 2 remains 35%, other 65%, confidence independently 20%. Each Inspect control opens timestamp/model/prompt/input snapshot/baseline/evidence. Null snapshots are explicitly unavailable. `?ai=stale` labels stale content; `?ai=missing` retains five unavailable rows and unavailable inspectors. No generation is called. |
| Personal identity and valuation | Audit my roster: team/manager/standing/record/count/actions; supplied modeled FAAB total/subtotal semantics; priced/unpriced coverage; calculation time and in-season basis; top three with values and explicitly unbounded supplied modeled change period; all 24 values in a native disclosure; recorded history unavailable. Public never renders the personal summary or audit navigation. Fixture selection is not an authentication boundary. |
| Personal form, completed period and wire | Roster audit: three form watches with EMA FP/G, observed GP and limitation; all best/rough rows with FP, GP, exact Week 2 source period, eligible/coverage language and synthetic caveat; all supplied team news and recent moves with source/time. Availability unknown is preserved. |
| Ten faces and directory | Lookup has all ten teams with grayscale approved anchor portraits, anchor player profile links, modeled FAAB value, team/manager/current record/opponent and champion label only on the appropriate team. Search covers team, manager and all player names locally. Sort actually changes standing/name/roster-size order. |
| All roster references | All 228 unique player references, position and NBA abbreviation render in native roster disclosures in lookup. Each player links to `/player/id`. Team documents also retain each franchise's complete roster and true profile links. NeuralNets' 2025 line explicitly names previous manager QBs Gremlins. |
| Standings and absent producer | Lookup includes all ten ranks/W/L/PF, with `pointsFor / 100`. Missing Power is explicit; no rank or line is invented. Empty league-leader/streak inputs are stated as not supplied. |
| Dated editorial and archive | Read dated edition uses only the coherent `data.archive` entries for game narrative. Oct 5–11 has all three supplied spotlights, exact stats/opinion/period/selection reason/source URL/check date. Dated happenings and all source references are reachable in the same document. Both archive dates, native routes, draft/unpublished status and time bounds are retained. The older entry preserves historical final scores and prior-manager story. |
| Tools, play and league moves | Tools document exposes actual destinations, local grayscale free-throw preview and `/arcade/free-throw` Play action; all three supplied recent league moves are present. No fake game catalogue or reward claims. Footer on every document states offline synthetic current data, fixture date and separate dated editorial provenance. |

## Applied supplied references

Read the repo's AGENTS, homepage ARCHITECTURE, relevant DESIGN sections and GOAT design skill with hierarchy/navigation/motion references; then the independent author brief and supplied `reference-notes/craft.md`. No foreign scripts, shared renderer, other author markup, old mocks or remote runtime dependencies were used.

- **Hallmark direction / macrostructures / redesign:** The visitor job governs the whole experience: inspect before acting. This changed the persistent navigation into working verbs and made each destination a complete document, rather than putting a novel entry view above a dashboard. Its architecture fingerprint informed geometry, navigation and reveal together.
- **Elaya redesign / landing-page:** Breaking equal-card symmetry led to one open document with aligned records, inline roster expansion and a strictly contextual inspector. State, focus and Back remain working behavior. Its marketing funnel and floating menu anatomy were not adopted.
- **pbakaus adapt:** Phone changes the task presentation. The picker replaces the rail; model evidence becomes a reader with a useful return path; rosters reflow as identities plus metadata rather than a tiny multi-column dashboard.
- **Rauno / Emil Apple design:** Source and destination stay intelligibly connected. Desktop inspection preserves the source matchup beside the evidence. Phone explicitly names the return destination and restores origin focus.
- **Addy accessibility / frontend engineering:** Native selects, search, labelled controls, keyboard focus and real-length roster data drove the bounded browser checks. Roster/search/inspector behavior is tested separately from appearance; no claim of screen-reader compliance follows from automation alone.
- **better-colors:** Grayscale removes palette as an explanation for structural variety; labels carry synthetic/stale/unavailable status.
- **pbakaus animate / Emil animation references / accessible-animation:** Frequent task and keyboard navigation is immediate. Essential information is always present. No autonomous animation, timers, observers, reveal effects or numeric interpolation were introduced.

## Motion thesis and still equivalent

Stage one deliberately uses immediate document replacement and inspection. In a later visual pass, the only candidate transition is a short source-connected opening of the occasional evidence inspector to explain where the response sits relative to the matchup. Routine task selection and keyboard navigation stay immediate. Closing must be interruptible and restore the same control; reduced motion uses the present instant change with identical content and focus. No animation library or full-stage reveal sequence is warranted.

## Checks performed on these local files

Bounded local static-fixture evidence using installed Playwright and `/usr/bin/chromium`, served by the coordinator at port 4207:

- `node --check app.js`: passed.
- All eight capture states rendered at 1440×1000, 390×844 and 320×740: no page overflow and no page-script errors.
- 1440px with root text set to 200%: tested main document families, no page overflow. All eight states additionally checked at 320px with 200% root text after correcting enlarged-text roster/portrait/table reflow: no overflow.
- Actual directory search “Embiid”: one matching team, matching roster expanded. Clear restores all ten; Team A–Z sort begins with Huff n’ Puff.
- Directory DOM inventory: 228 references, 228 unique IDs. Personal complete value disclosure: 24 rows.
- Model inspector confirms returned Ware the Hoes At? choice, 35% probability, independent 20% confidence. Escape closes it and returns focus to its originating pick control.
- Browser Back from tools to roster restores the roster document. Public/member stale and missing variants retain five slate rows; public has zero personal-audit controls.
- Phone task-picker changes, full-height inspection reader, Escape return focus and navigation after a live reduced-motion preference change: passed. Final post-edit matrix reran all eight member states at each of the three standard widths (24 states), with zero overflow failures or page-script errors; ready hook returned `10`.
- No HTTP error responses observed for exercised local pages/assets. Default desktop and phone were visually inspected in local screenshots. The coordinator owns comparative bulk captures.

## Known limits / bounded inventory

- This is an offline architectural prototype, not a Next route, real authentication, live provider evidence, full visual implementation or full final acceptance. Production route links are preserved; their destination applications were not traversed here.
- Standings render the required rank, W, L and scaled PF; the supplied zero ties and games-back fields are not repeated there. General team identities do not repeat points-against. The current metadata and full datasets remain in the common fixture for the next stage.
- Raw transaction IDs, empty move legs, raw model/edition JSON and domain-only season flags are not rendered as separate inspection objects. Move type/week/time/summary and supplied leg counts are shown. The source IDs remain unchanged in the fixture.
- The archive source game uses coherent archive pairings 1/5 and 5/7. The conflicting `home.edition.game.teamIds` (1/2 beside historical 1/5 prose) is never combined into an asserted result. Current Week 3 comes exclusively from current directory/personal pairing data. The common fixture was not edited.
- Recorded team-value History and Power have no connected producer. There is no fake series or ranking. Top-player modeled percentage changes have no supplied period, and that absence is printed.
- All required content families have reachable representative content; the first screen does not expand every family. The large datasets use disclosure/working documents intentionally.
- Focus/history/reflow checks are browser-fixture evidence only. No screen-reader, physical phone, actual iOS safe-area, external app route, or universal accessibility claim. No color/art polish, contrast certification, production build, Git operation, provider request, installation or Muse/shared edit was performed.

Frozen for coordinator capture and independent structure review.
