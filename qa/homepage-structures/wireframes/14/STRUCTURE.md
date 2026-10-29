# 14 — Parallel channels

Stage one only. Grayscale structural study, frozen for the independent geometry gate. No final artwork or full visual acceptance is claimed.

## Design contract

- **User question:** What matters to my team, and how does it connect to what is happening around the league?
- **Primary action:** Follow a relevant fact into a neighboring reading channel, then return to the original reading position. My team remains the first member destination.
- **Relevant states:** member/public; four reading positions; cross-link destination and return; full directory/search/sort; full member valuation; two archive editions; ready/stale/missing saved AI.
- **Narrow layout:** explicit four-channel chooser, one channel visible, separate remembered reading positions. It does not combine the four threads into a universal card stack.
- **Forbidden patterns:** central inspector replacing the channels; hero above repeated dashboard panels; boxed feed cards; fabricated scores, histories, rankings or predictions; personal-summary content in public rendering.

## Geometry

At 1440 × 1000 the four simultaneous streams measure approximately 332 / 414 / 321 / 239 CSS px, with whitespace and single vertical separators. Each has a named, keyboard-focusable overflow region and its own reading position. All four streams contain actual information throughout their length. There is no outer card, repeated feed-card component or central focus pane.

League action receives the widest measure for pairings, standings and directory work. Your team is an open personal thread. Scouting carries longer basis/period qualifications and the dated takes. Culture uses the narrowest reading measure and a contrasting system serif for its dated narrative. Typography is entirely system fonts; approved identity and small roster portraits are local and grayscale.

At 390 and 320 CSS px the index becomes a visible 2 × 2 chooser. The chosen stream alone is displayed; switching restores its saved scroll offset. Each button shows Start or a reading percentage. Desktop → phone → desktop restores all four positions. At 200% root text the outer page may scroll vertically so enlarged chrome and the reader remain reachable; no horizontal page or reader overflow was found. Phone standings become stacked semantic table rows with explicit W–L/PF labels, preserving every field.

## Navigation and state

The header keeps GOAT identity, Home/News/Stocks/History/Arcade on desktop, with Stocks direct on phone and a native All destinations disclosure. Its links include AI Decides, Teams, Transactions, trade analyzer, weekly archive and the existing free-throw game. Home preserves the current public/member and AI fixture parameters.

An `Across /` text button is an in-study relationship, distinct from a route link. Examples:

- Current own pairing → the actual saved pick, including its returned opponent choice at 35%.
- AI pairing → the opponent's complete roster in League action.
- Modeled member value → the separately labeled form watch.
- Embiid's dated editorial → current modeled member value.
- Any roster anchor → its complete team roster, and directory team → the modeled-value anchor.
- Dated culture story → the three sourced scouting takes or current-week slate.

Following a relationship focuses its real destination passage and shows a return control in that stream. Return restores the departure scroll offset and originating control when it still exists. It never replaces the other desktop streams. Phone follows the same passage through channel selection. Menu Escape closes the destination disclosure and restores its summary focus. Data inventories use native nonmodal disclosures.

`document.body.dataset.studyReady = '14'` is set after fixture render. `window.goatStudy` exposes these synchronous representative states:

| ID | Actual view |
| --- | --- |
| `default` | Reset four channels to their initial positions, latest archive draft, closed data disclosures and unfiltered directory |
| `league` | Saved five-pair slate |
| `directory` | Search/sort and all ten team entries |
| `scouting` | Member form watch; public source/period introduction |
| `culture` | Dated October culture thread |
| `archive` | W40 historical final, 326.0 / 251.5 |
| `value` | Open full 24-player member valuation; public current pairing |

Remaining local views are native roster/value/model/source disclosures, team/player search, three team-order choices, channel positions, the two archive buttons and contextual return paths. They are reachable without additional hook IDs. `?view=public`, `?view=member`, `?ai=stale` and `?ai=missing` are real fixture variants.

## Content map

All facts are imported explicitly from `../../data.js`; fields were inspected with bounded JSON queries of `inventory.json`. No new fixture data shape, live fetch, model generation or provider call was added.

| Information family | Concrete place and representative content |
| --- | --- |
| Identity and destinations | Masthead and All destinations; approved local GOAT logo, complete requested route set, public/member comparison, `/team`, `/teams/1#team-roster`, `/stocks#player-board`, `/arcade/free-throw` |
| Current pairing | Your team / public At a glance; current Week 3 team/manager/record/current score. Reaves Dropper 0.0 versus Ware the Hoes At? Pending, explicitly incomplete |
| Saved AI | League action; all five supplied pairings, returned choice, both named probabilities, independent confidence, generated timestamp, model, prompt, input snapshot availability, evidence, period and status in receipts. Choice 2 stays 35%, other 65%, confidence 20% |
| Personal identity and actions | Member thread only; Reaves Dropper, aidandaly20, 24 rostered, standing 1/10, current 1–0, My team and full roster routes |
| Modeled valuation | Member thread; $1095.25 complete modeled FAAB total, in-season basis, 24/24 priced, zero unpriced, computation/check time. Top three with supplied Up 4.2% changes, native full 24-value disclosure. Partial source values would remain labeled subtotal/unpriced, not zero |
| Recorded value history | Member thread prints the actual unavailable fixture message. No chart or invented line |
| Form | Member Scouting only; Lillard 38, Harris 37, Embiid 36 EMA fantasy points/game, eight observed games each, explicit metric/basis/season/current week, availability unknown and schedule adjustment unavailable |
| Completed-week evidence | Member Scouting; all three best and all three rough rows, points/3 GP, exact 2026 Week 2 source period, five-player verified participation coverage and overlap/exclusion caveats. Clearly synthetic completed-week examples |
| Team news and moves | Member thread; both synthetic team-wire headlines/outlets/timestamps and the member's supplied move. League action contains all three supplied league moves, week/type/time/team links and absent-leg qualification |
| Full directory | League action; all ten teams, managers, current records, opponents, roster counts, team routes. Every native roster disclosure contains its complete supplied player references with name/profile/position/NBA team: 228 unique IDs total |
| Search and sorting | Clubhouse index searches team, manager, player name, position and NBA team. Visible result count, clear action, no-match state. Team ordering by standing, name or roster size with rank tie-break |
| Standings | League action; all ten ranks/W–L/PF, PF converted from source cents-like points using `pointsFor / 100`. No invented leaders |
| Prior-season attribution | Directory roster detail shows supplied 2025 W/L/finish; NeuralNets' 1–20 explicitly retains “Under the previous manager as QBs Gremlins.” Champion annotation derives from the supplied previous finish/face flag |
| Ten faces | Scouting's ten roster anchors: supplied player/profile/position/modeled FAAB value, team/profile and champion annotation, local grayscale portraits or labeled initials |
| Three player spotlights | Scouting; exact supplied Jokić / Embiid / Dybantsa stats, opinions, historical NBA/college periods, selection reasons, source links and Oct 8 check dates. Dated editorial remains distinct from current form and modeled values |
| Dated edition and happenings | Culture; W41 Oct 5–11 draft with upcoming 1/5 pairing, full coherent game prose/reason, all three happenings and all five sources. W40 Sep 28–Oct 4 draft with historical final 5/7, exact scores, full prose/reason, franchise-history happening and source |
| Weekly archive | Both actual edition buttons with dates/draft status and `/weekly/2026-W41`, `/weekly/2026-W40`, `/weekly` links |
| Power | Scouting; actual unavailable producer message, explicitly no ranking |
| Tools and play | Header plus contextual Stocks/trade actions and Culture's direct existing free-throw/Arcade destinations |
| Provenance | Persistent synthetic-current/offline/date label; local family labels; model receipts and editorial sources; member/public and Culture footer fixture warning |

### Known dated-editorial conflict

`home.edition.game` is not consumed. Its team IDs 1/2 conflict with its dated headline/prose naming 1/5. Culture deliberately uses the coherent `data.archive` W41 game (1/5, upcoming) and W40 game (5/7, historical final). Current Week 3 always comes from personal/directory currentMatchup. No synthetic fixture was corrected or overwritten, and the drafts are not presented as current published news.

### Precisely abridged or unconnected

All required families, all five AI rows, ten teams, 228 references, ten faces, 24 personal values, six completed-week selections, three form rows, three spotlights and both archive entries are reachable. The stage-one omissions are secondary trace metadata and null fields: transaction/internal IDs, raw archive ISO start/end strings (human date range is visible), null baseline/latestMove/opener fields, and individually named null hub-leader fields (collectively explained as unavailable). No full per-player deep histories/game logs are in the fixture or fabricated. Input snapshot is honestly unavailable, and history/Power have no connected producer. The common raw fixture remains unchanged for later complete field retention.

## Applied supplied references

The local GOAT design skill plus its visual-hierarchy, navigation-accessibility and motion references were read. QA-specific permission in BRIEF supersedes production anatomy/tokens only inside this assigned folder; no production decision was changed. The supplied `reference-notes/craft.md` was read as root's verified source study, not treated as a common renderer or copied visual template.

- **Hallmark direction/macrostructures/redesign/responsive:** a custom idea must govern composition, navigation and reveal across the experience. That changed this from a novelty header into four complete independent readers, with the actual directory, archives and receipts continuing inside the channels.
- **Elaya redesign:** breaking equal-card symmetry and using inline expansion with preserved context changed the composition to unequal open streams and native in-place inventories. Its marketing funnel/floating-nav assumptions were not adopted.
- **pbakaus adapt:** adapt the task rather than shrink desktop pixels. Phone gets a named all-channel chooser and state restoration, rather than a narrow four-column view or concatenated dashboard stack.
- **Rauno / Emil Apple guidance in the notes:** make source/destination relations direct and learnable. Cross-links focus the target passage, name the origin, and provide an explicit return to the prior place.
- **Addy accessibility / frontend engineering:** labeled native controls, focusable reader regions, visible focus, phone targets, realistic populated content and separate reflow checks determined the control model and semantic phone standings.
- **Emil / pbakaus animate / accessible-animation:** movement must explain state and survive interruption/reduced motion. This architectural stage uses immediate changes and no autonomous movement.

## Motion job and still equivalent

Implemented stage one has no authored animation, timers, observers or requestAnimationFrame loops. Channel selection, focus and cross-link travel are immediate for pointer and keyboard; native scrolling remains under the reader's control. Live reduced-motion selection retains identical views and actions.

For a later full build, the one justified path is the occasional cross-channel relationship: a brief, interruptible destination-passage emphasis could connect source and destination without moving or replacing the parallel streams. Budget approximately 120–160ms, no blanket entrances, price tweening or scroll hijack. Keyboard, repeated use and reduced motion use the same immediate target/focus/origin receipt. This is a documented proposal pending the geometry gate, not a claimed implemented motion demonstration.

## Verification and limits

Verified in installed headless Chromium through local server `127.0.0.1:4207` on 2026-10-29:

- `node --check app.js` passed.
- Browser assertions passed for all seven state hooks, five AI rows and first returned 35% choice / 20% confidence, all inventory counts above, team/player search, clear and name sort.
- Independent desktop stream positions passed. Phone switching restored offsets; a final targeted check confirmed all four positions survive desktop → phone → desktop.
- Contextual cross-link focus and return-to-origin passed. All destinations Escape and summary-focus restoration passed.
- Member/public tests confirmed no personal valuation, completed-week recap or team wire in public DOM; public directory and all ten faces remain.
- All five stale labels appeared under `?ai=stale`. All five unavailable labels appeared under `?ai=missing`, with zero probability bars.
- No horizontal document or reader overflow at 390 × 844, 320 × 780, 320 × 780 with 200% root text, and 1440 × 1000 with 200% root text, across all four channels. Enlarged phone text permits vertical outer scrolling.
- Reduced-motion archive selection passed; no page errors or remote network requests occurred. Only local fixture/module/approved asset URLs were requested.
- Desktop and phone screenshots were visually inspected. Root owns the canonical capture set; temporary author screenshots were kept outside the deliverable folder.

Production Next routing, external article/source destinations, real authentication, live data and actual device/screen-reader behavior were not exercised. Route hrefs preserve the specified actual destinations; this static study does not implement those applications. No Git, production, Muse, other-author or shared-presentation edits; no installation, external research, publishing or subagents. No implementation blocker remains. Independent geometry review and later full visual work are outstanding by design.
