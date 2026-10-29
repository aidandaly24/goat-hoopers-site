# Rival halves — structure retained

The full-art study starts from corrected `structural-revisions/08/`. Its state machine, data imports, facts, links, native disclosures, history and focus handling are retained. `study.js` is byte-identical to that corrected source. See [ART.md](./ART.md) for paint/type changes, actual current checks and limits.

User question: “How does my side compare with this week's opponent, and where do I read the league?” Primary action: compare the named pair, choose Players & value or Form & wire, inspect a real roster/profile, then return to the same comparison.

Desktop: each half owns identity, current score, record/rank, anchor value, saved probability and actions. The neutral central seam names aligned evidence. Player/value and form/wire states keep the selected pair and halves. League reader replaces this arrangement with a full-width collection/table; weekly edition is a dated article with its own archive index.

Phone: named two-team score context stays together. Side buttons choose whose detail is read, and the Read select chooses the subject. At 390px the score context stays visible while reading an expanded roster. At 320px or narrow effective width from enlarged text, names reflow above two-sided scores and a shared week/status line. At the narrowest effective width, controls use full-width rows and context leaves sticky positioning. This is a deliberate comparison reader, not both entire team dashboards stacked.

## State hooks and information map

Ready: `body.dataset.studyReady = '08'`. `window.goatStudy.states` exposes eight states; `activate(id)` selects a real state synchronously.

| ID | Retained content |
| --- | --- |
| `comparison` | Default own/public pair; all five pairing choices; both names/managers/current records/ranks/scores; known 0.0 versus Pending; not-final status; anchors and modeled FAAB; saved returned choice/probabilities/independent confidence; provenance and team/roster/trade actions. |
| `rosters` | Same pair/context. Member total/coverage/basis/time/value rank, top three and all 24 prices; complete rosters with positions/NBA. Opponent full valuation remains explicitly unavailable. |
| `scouting` | Member form watch, completed-week best/rough points/GP/period/coverage, two news items and personal move. No opponent personal projection inferred. |
| `league` | Ten teams/managers/records/opponents, ten faces/quotes and real profiles, search/sort, all 228 unique player references, previous-season record attribution. |
| `standings` | All ten ranks/W/L/PF (`pointsFor / 100`), member mark and honest missing Power/aggregate context. |
| `picks` | Five saved rows; first away returned choice 35%, other probability 65%, independent confidence 20%; timestamp/model/prompt/season/week/league, evidence and absent snapshot/baseline details. |
| `edition` | Both coherent dated archive records/routes, exact three spotlights/stats/opinion/period/selection/source dates, happenings/sources and historical 326.0–251.5 final. |
| `tools` | Three recent league moves, Stocks, trade analyzer, AI Decides, News, Teams, Transactions, Arcade, actual free-throw, History and weekly archive destinations; history/Power unavailable states. |

Local hashes support direct entry and browser Back. Pair, side, query/sort and archive selection stay in memory while switching views. View navigation/Back focuses the current heading; subject selection retains select focus, side selection retains button focus, and Menu/provenance Escape returns trigger focus. Expanded Menu/provenance are in normal flow. Hidden phone halves leave the tab order.

Home, News `/intel`, Stocks `/stocks#player-board`, History, Arcade, Teams, Transactions, AI Decides, trade analyzer, archive, `/team` and `/teams/1#team-roster` remain reachable under their existing conditions. No unsupported stock player query.

## Integrity and bounds

- Local `../../data.js` only; no runtime external data, scripts, images or fonts. Compact Synthetic concept disclosure keeps full frozen/synthetic provenance.
- Public fixture branch renders no personal valuation/form/news/wire/actions; this is not an authentication boundary.
- `?ai=stale` labels old saved results and withholds current bars. `?ai=missing` retains five identities and explicit unavailable results. Known zero remains separate from unknown.
- Inconsistent `home.edition.game` IDs/prose are not combined. Current directory pairings supply Week 3; coherent `data.archive` entries supply dated 1/5 upcoming and 5/7 historical narrative. Fixture is unchanged.
- No fabricated team-value line, Power ranking, opponent private subtotal or unverified performance. NeuralNets' old record retains previous-manager attribution.
- Stage-one bounds retained: absent aggregate fields are summarized rather than individually printing six null field names; internal DTO flags have no display where they serve no reading task. All required content families remain concrete and reachable.
- No scene motion. Pointer button feedback and selected-side paint are immediate; keyboard/reduced-motion use the same instant states. No autoplay, numeric tween, observer reveal or scroll lock.
