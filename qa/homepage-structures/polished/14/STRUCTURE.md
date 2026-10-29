# Parallel Dispatch — content and interaction contract

Carried forward from corrected structural study 14. Current art decisions, actual primary references, motion and final verification are in [ART.md](./ART.md). This file retains the complete content map and interaction inventory. The frozen original and structural revision remain unchanged.

## Design contract

- **User question:** What matters to my team, and how does it connect to what is happening around the league?
- **Primary action:** Follow a relevant fact into a neighboring reading channel, then return to the original reading position. My team remains the first member destination.
- **Relevant states:** member/public; four reading positions; cross-link destination and return; full directory/search/sort; full member valuation; two archive editions; ready/stale/missing saved AI.
- **Narrow layout:** explicit four-channel chooser, one channel visible, separate remembered reading positions. It does not combine the four threads into a universal card stack.
- **Forbidden patterns:** central inspector replacing the channels; hero above repeated dashboard panels; boxed feed cards; fabricated scores, histories, rankings or predictions; personal-summary content in public rendering.

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
| Identity and destinations | Masthead and More navigation; approved local GOAT logo, complete requested route set, public/member comparison, `/team`, `/teams/1#team-roster`, `/stocks#player-board`, `/arcade/free-throw` |
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
| Provenance | Compact Synthetic concept with full offline/date provenance expanded; local family labels; model receipts and editorial sources; member/public and Culture footer fixture warning |

### Known dated-editorial conflict

`home.edition.game` is not consumed. Its team IDs 1/2 conflict with its dated headline/prose naming 1/5. Culture deliberately uses the coherent `data.archive` W41 game (1/5, upcoming) and W40 game (5/7, historical final). Current Week 3 always comes from personal/directory currentMatchup. No synthetic fixture was corrected or overwritten, and the drafts are not presented as current published news.

### Precisely abridged or unconnected

All required families, all five AI rows, ten teams, 228 references, ten faces, 24 personal values, six completed-week selections, three form rows, three spotlights and both archive entries are reachable. The stage-one omissions are secondary trace metadata and null fields: transaction/internal IDs, raw archive ISO start/end strings (human date range is visible), null baseline/latestMove/opener fields, and individually named null hub-leader fields (collectively explained as unavailable). No full per-player deep histories/game logs are in the fixture or fabricated. Input snapshot is honestly unavailable, and history/Power have no connected producer. The common raw fixture remains unchanged for later complete field retention.

