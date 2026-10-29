# 06 — Chronological league feed

Stage-one grayscale source, ready for independent structural review. This is not a final visual implementation or a claim of final acceptance.

## Surface contract

**User question:** What has happened, what can I trust about this week, and where does my team fit in the league's timeline?

**Primary action:** Follow a scope and source period, then inspect a dated observation. The current member entry also exposes My team and the full roster directly.

**Relevant states:** Member/public; everything/league/personal/market; supplied source periods; current pairing selection; local directory search, sort and empty result; native detail expansion; ready/stale/missing saved AI. Current scores remain incomplete, with known 0.0 distinct from Pending.

**Forbidden patterns:** Repeated bordered cards; a novelty hero followed by a conventional dashboard; treating October editorial as November activity; implied invented event timestamps; inferred AI winners; a fabricated price-history line or power ranking; public personal-edition content.

## Geometry and navigation

Desktop uses a single continuous time spine approximately 38% across the reading width. Date marks sit on the spine. Unequal-width event entries alternate on either side; their opposing annotations explain period, source or interpretation. The initial entry puts the member identity to the left of the date and the current Week 3 pairing to the right. Subsequent value, form, activity, saved AI, completed-period evidence and dated issues inhabit the chronology rather than a common section grid. Event boundaries are whitespace, dates and the spine, not enclosing rectangles.

At 390px the spine moves to the left. The opposing annotation becomes the contextual introduction for its event; the main event follows beside the spine. At 320px, and when enlarged text produces equivalent space, the date is a compact horizontal marker above the event, saving the width formerly reserved for a date column. Main navigation reduces to GOAT, direct Stocks, and a native Menu disclosure. Filters remain direct native controls and wrap naturally.

The team/player register is an explicitly dated November 12 snapshot, reached from “Find a team / player” or a register entry. The spine moves to a narrow date gutter and the register uses the remaining width. This is an index attached to the observation date, not an invented roster-history timeline. Returning from its reader restores the previous log scope, period and scroll context. No nested scrolling workspace, modal, drag operation or hover-dependent content is used. Event disclosures remain native, including keyboard activation.

## Capture API

`document.body.dataset.studyReady = '06'` is set after synchronous rendering. `window.goatStudy.activate(id)` resets the register query, selects real UI state and scrolls to the top. Eight member states are exposed:

| ID | Working state |
| --- | --- |
| `default` | Complete chronological log |
| `league` | League events only |
| `personal` | Member observations across dates |
| `week2` | Completed source Week 2 evidence |
| `market` | Modeled roster-value / register observations |
| `ai` | Saved slate at its own source date |
| `archive` | Dated September / October issues and happenings |
| `directory` | Ten-team searchable roster register |

Public exposes six states, omitting personal and Week 2. Additional control combinations are intentionally not distinct capture IDs: source-date/scope intersections, a different current pairing, roster and source disclosures, sorted/matching/empty directory, and expanded standings. `?ai=stale` and `?ai=missing` are native fixture variants, not simulated screenshots.

## Content and evidence map

| Information family | Concrete location |
| --- | --- |
| GOAT identity; Home, News, Stocks, History, Arcade | Header; phone Menu preserves all destinations and direct Stocks |
| AI Decides, Teams, Transactions, trade analyzer, weekly archive, Free Throw | Header tools/Menu and contextual actions/footer |
| Member `/team`, `/teams/1#team-roster`; public/member comparison | First entry and introduction comparison link |
| Current pair, both managers and records, week, 0.0/Pending scores | November 12 first entry; selector reaches all five current pairings |
| Five saved AI rows; actual choice, both probabilities and confidence | November 10 entry; each native provenance disclosure contains saved timestamp, league/season/week, roster IDs, model, prompt, null input snapshot and evidence |
| Member identity, count, standing | First entry's opposing annotation |
| Modeled total, coverage, time, basis, top three, all 24 player values | November 12 market event; full roster-value disclosure; top-three annotation across the spine |
| Recorded history / Lineup Power gaps | Market and register entries state unavailable; no line or rank is synthesized |
| Scouting form | November 12 observed-at-check form event; three supplied EMA FPPG values, eight observed games, availability and schedule caveats |
| Completed-week best/rough, GP, period, coverage | November 2–9 event, end exclusive; five unique players; shared Joel Embiid selection appears once with both tags |
| News and recent moves | November 12 sample activity and member wire; supplied summaries only, no invented add/drop legs |
| Ten leading franchise faces with modeled value and profile links | Register's ten native roster disclosures; face/player/team identity remains source-specific |
| Ten-team directory, managers, current records/opponents, all 228 unique references | Register; roster disclosures retain player ID, name, position and NBA team; team/player profile links are distinct from disclosure controls |
| Local lookup and sort | Register search covers team, manager, player, position and NBA team; sort offers standing, team name, roster size and player name |
| All ten standings, rank/W/L/PF | November 12 register preview and full register disclosure; PF explicitly divides supplied hundredths by 100 |
| Prior-season attribution | Each roster disclosure, including NeuralNets' previous manager/QBs Gremlins note |
| Dated game/editorial and three exact spotlights | Archived issue 2026-W41 in October; exact stats, NBA/college periods, opinion, selection reason, source URL/date in reachable disclosures |
| Happenings/sources; both archive entries/date/routes | October 6/7 entries plus two full dated-issue entries; native source/happening disclosures and `/weekly/2026-W41`, `/weekly/2026-W40` links |
| Provenance | Persistent synthetic label, expandable warning, per-event dates and footer benchmark/check time |

All preserved content families have reachable representative content. Complete inventories implemented in this stage: 228 unique roster references, ten directory teams/faces/standings, five AI returns, 24 member roster values, three editorial spotlights and both archive issues. Deep destination pages and unavailable producer data are not reimplemented in this isolated wireframe.

## Source treatment

The only runtime module import is `{inventory, data, mode, aiState, esc, money}` from `../../data.js`. `inventory.json` was inspected with bounded Python queries before authoring. No provider is called. Current records, scores, prices, form, news, moves and model returns are explicitly synthetic. November 12 is the fixture's check date, not the actual date. Form is labeled as observed at that check; the source does not provide a separate form-generation timestamp.

The archived `2026-W41` game is used for dated editorial because its pair `[1,5]` agrees with its preserved title and prose. The `home.edition.game` pair `[1,2]` conflicts with that text and is not silently reused as a current or historical pairing. The current Week 3 pair comes from directory/member matchup fields. The first saved away choice remains roster 2 at 35%, despite the other probability being 65%; independent confidence remains 20%. Missing slate has neither rows nor inferred probability commentary. Null saved input snapshots are labeled not supplied.

## Craft principles that changed the architecture

- Hallmark custom direction/macrostructures: the content-specific idea governs the whole reading and lookup experience. A source's date determines its place, rather than putting a timeline introduction above dashboard sections.
- Elaya redesign: unequal widths, open typography and inline source expansion replace equal card symmetry. The register expands in its original as-of context and returns to the dated log.
- `pbakaus/adapt`: phones change the date-and-annotation relationship, retain searchable content and expose a compact date marker at very narrow/enlarged widths. Desktop is not merely shrunk.
- Rauno interaction and Emil/apple-design continuity: a register reader has a clear origin and return path; source links and disclosure actions remain separate and direct.
- Addy accessibility: native labels/buttons/links/details, a skip link, visible focus, complete keyboard paths, and separate reflow checks. The menu closes on Escape and returns focus to its summary.
- Better colors: this gate uses true equal-channel grayscale. State is carried by words, date and pressed semantics, never color.

## Motion thesis and fallback

Stage one uses immediate state changes and native disclosures. No scroll observer, autonomous timer, RAF, entrance reveal or animated number is present. For a later approved visual build, the one candidate motion is a short, interruptible expansion from the dated register entry into the wider register reader, making the same source date the visual anchor. Frequent filters, keyboard actions and price inspection should remain immediate. Reduced motion would show the same final reader and return context without movement. This motion is a proposal, not shipped behavior.

## Actual verification and limits

Chromium via installed Playwright, against root's local server on 4207:

- Module syntax check passed; browser produced no page errors.
- All eight member and six public API states checked at 1440, 390 and 320px with 16px and 32px root text. Final pass found no page-width overflow in 84 combinations. Fully expanded directory, market, AI, archive and Week 2 disclosures also had no overflow at 320px with 200% root text.
- Register verified ten team rows, ten portraits and 228 links representing 228 unique player URLs. Embiid search returned one team/one player. No-match state rendered; team A–Z sort produced actual ordering. Player-name sort was added and checked separately.
- Expanded member values counted 24; saved slate counted five rows with returned roster 2/35%, other roster 1/65%, confidence 20%; completed evidence counted five unique rows and one shared Embiid row.
- Public rendering checked: zero personal value/form/completed events, zero `/team` links, hidden personal filter. Missing AI: zero saved rows and explicit unavailable. Stale AI: five retained rows with a stale label.
- Menu open/Escape/focus return, keyboard Enter roster expansion, register return and current pairing selection were exercised. Reduced-motion preference retained register functionality. Loaded portraits had no failed image decode in the checked state.

Root owns bulk screenshots and independent structural comparison. Two initial local debugging screenshots were inspected and then removed; they are not final review evidence. No production build/typecheck is applicable to this standalone HTML/CSS/module study. No live auth, provider data, external destination routing, physical device, full screen-reader pass or complete accessibility conformance is claimed. Source data and absent producers limit the prototype; this fixture is not an authorization boundary. Full visual work is intentionally pending the independent structure gate.
