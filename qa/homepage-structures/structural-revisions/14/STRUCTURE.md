# 14 — Parallel channels / bounded structural revision

Stage one only. This revision is isolated in `structural-revisions/14/`; original `wireframes/14/` source and images remain immutable. Grayscale structure is frozen for root full/pane captures, Muse review and the independent geometry gate. No final artwork or full visual acceptance is claimed.

## Design contract

- **User question:** What matters to my team, and how does it connect to what is happening around the league?
- **Primary action:** Follow a relevant fact into a neighboring reading channel, then return to the original reading position. My team remains the first member destination.
- **Relevant states:** member/public; four reading positions; cross-link destination and return; full directory/search/sort; full member valuation; two archive editions; ready/stale/missing saved AI.
- **Narrow layout:** explicit four-channel chooser, one channel visible, separate remembered reading positions. It does not combine the four threads into a universal card stack.
- **Forbidden patterns:** central inspector replacing the channels; hero above repeated dashboard panels; boxed feed cards; fabricated scores, histories, rankings or predictions; personal-summary content in public rendering.

## Root failure reproduced and fixed

The original was reproduced at exactly **390 × 844 with `html { font-size: 200% !important }`**: document/channel-index width was **474px**. The two auto-minimum grid tracks inherited the minimum content widths of the number/name/position flex rows. The original's special 320px rule happened to switch those buttons to block layout; that earlier check did not cover the 390px failure.

This revision fixes the intrinsic layout rather than concealing it: all channel/index grid tracks use `minmax(0, …)`, grid/flex children can shrink, channel names wrap, name/value rows use a zero-minimum name column, and image/text rows use a bounded 48px image track plus `minmax(0,1fr)`. Inputs/selects have explicit available widths. Reading content inherits `overflow-wrap:anywhere`. No body/page overflow clipping, scale transform or width cap hides excess content. Reader `overflow:auto` is real independent scrolling; tests compare each reader's scrollWidth with clientWidth. The only clipping is the standard screen-reader-only heading/table-caption treatment.

## Geometry and local semantic tokens

At 1440 × 1000 the four simultaneous streams remain approximately 332 / 414 / 321 / 239 CSS px. Whitespace and three useful vertical separators identify independent readers; repeated subsection, AI-row, roster-entry and footer divider rules are removed. Each reader is a named keyboard-focusable region with its own position. Desktop has four stream headings directly below the compact masthead/provenance, without a duplicate channel-chooser row or decorative numbering.

Phone uses one visible **Your team / League / Scouting / Culture** chooser (public: Overview), arranged in two true flexible columns. Selecting a channel restores its position; desktop → phone → desktop restores all four offsets. The duplicate selected-channel heading is retained for assistive technology, while the visible selected name stays in the chooser. Accessible labels/tooltips expose saved-place percentages without adding a status row or resizing the chooser during reading. The selected name is underlined; no card/pill/tag component is used.

The phone masthead is one row: a bounded local GOAT logo, direct Stocks and More. The compact **Synthetic concept** disclosure expands the full date/provenance. More expands actual route links in normal flow; neither is an overlay. Phone first action/content is visible earlier than in the frozen first source. Enlarged text may create vertical outer scrolling so enlarged controls and the reading region remain reachable. Phone standings remain a semantic table with stacked rank/team/W–L/PF cells rather than a cramped matrix.

All presentation is local. `--ink`, `--secondary`, `--paper`, `--on-ink`, `--separator`, `--control`, `--probability-rest` and `--portrait-ground` are grayscale roles. `--font-reading` is system Arial/Helvetica; `--font-editorial` is system Georgia/Times for the dated culture voice. `--channel-gap` gives the parallel readers their measure. No tight tracking, opacity layers, repeated bordered cards, decorative labels/numbers, new art or shared presentation template is used. Existing approved small portraits remain grayscale and bounded.

## Navigation and state

GOAT identity/Home, News, Stocks, History, Arcade, AI Decides, Teams, Transactions, trade analyzer, both dated archives, member `/team` and `/teams/1#team-roster`, the public/member comparison and existing free-throw game destinations remain. Desktop has the short primary route row; phone has Stocks direct and a More button. More is a real `aria-expanded` button controlling a normal-flow navigation list. Escape closes it and restores button focus. Synthetic concept is a native disclosure; Escape closes it and restores summary focus. Default hook closes both.

A `Related:` text button marks an in-study relationship rather than a route departure. Examples:

- Own/current pairing → its saved AI choice, including the returned opponent at 35%.
- AI pairing → the opponent's complete roster.
- Member value → separately labeled form watch.
- Embiid's dated editorial → current modeled member value.
- Any modeled-value anchor → its complete team roster, and directory team → the anchor.
- Dated Culture edition → its three sourced scouting takes or current-week slate.

Cross-links focus the real destination passage and show an origin/return control. Return restores the departure scroll offset and original control when still connected. Desktop keeps the other three channels present. Phone switches the named channel while retaining independent offsets. Native nonmodal disclosures hold complete rosters, values, model receipts and editorial sources. No new center pane or universal phone feed is introduced.

`document.body.dataset.studyReady = '14'` is set after fixture render. `window.goatStudy` exposes these synchronous representative states:

| ID | Actual view |
| --- | --- |
| `default` | Reset four channels and saved-place labels, latest archive draft, closed route/provenance/data disclosures and unfiltered directory |
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

Verified using installed headless Chromium and the local root server on 2026-10-29. No provider call, remote module, install, Git operation or original/shared/production/Muse write was performed.

| Edition | Viewport and text | Actual check |
| --- | --- | --- |
| Member + public | 1440 × 1000 normal | All seven hook states; expanded inventories; document and every visible pane fit |
| Member + public | 390 × 844 normal | Same checks; four-way phone chooser |
| Member + public | 320 × 844 normal | Same checks; true narrow reflow |
| Member + public | 390 × 844, `html { font-size:200% !important }` | Same checks; **document 390px** and every visible pane scrollWidth equals clientWidth |
| Member + public | 320 × 844, same exact important rule | Same checks; **document 320px**, no excess pane width |
| Member + public | 390 and 320 at exact 200%, More + provenance both open | Both normal-flow disclosures fit; every route link focusable; default hook closes both |

Behavior assertions passed for all five AI rows; ten teams; 228 roster references; all 24 personal values; ten faces; three dated takes; returned choice 35% with separate 20% confidence; Dybantsa player search/clear/name sort; independent desktop offsets; phone/responsive restoration; actual cross-link target focus; return control and departure offset restoration; More/provenance Escape and focus; and reduced-motion archive selection. Public DOM has no personal valuation, completed-week recap or team wire, with full public rosters/faces retained. All five stale/unavailable labels and missing probability bars were checked. The local public/member comparison and browser Back were exercised. Browser Back re-renders the correct edition; persistent offsets across a full route departure are not promised by this architectural fixture.

`node --check app.js` passed. Browser runs recorded zero page errors and zero remote requests. Desktop, normal phone and exact-200% phone screenshots were visually inspected. Temporary author images remain outside this deliverable directory; root owns canonical full/pane captures.

The content map above is retained from the first-source inventory and remains valid. Source families, qualifiers, search/sort, links, ready14 and all seven goatStudy states remain. The raw fixture is unchanged. No fabricated result, prediction, historical line or Power ranking was added.

Production Next routes, external article/source completion, real authentication/live data, actual devices and screen readers were not exercised. This static revision links to those applications without implementing them. Full art, final visual acceptance, canonical root captures and Muse/geometry review remain outside this bounded revision. No execution blocker remains.
