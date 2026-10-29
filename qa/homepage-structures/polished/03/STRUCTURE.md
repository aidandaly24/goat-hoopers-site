# Sports programme — retained horizontal chapter structure

This polished implementation starts from frozen `structural-revisions/03/`. The original grayscale and corrected sources remain untouched. Current art decisions, primary references, motion path and test evidence are in `ART.md`; this file maps the retained structure and facts.

**User question:** what is happening in my league, and which part should I read or use next? **Primary action:** select a whole chapter, then inspect or act on its matchup, roster, editorial or tool. Members begin with their own pairing.

## Geometry and state model

The main element is a native horizontal viewport whose chapters each occupy 100% width. Every chapter has independent vertical reading overflow. The persistent programme masthead and bottom chapter controls frame the current destination. Offscreen chapters are inert; selecting a chapter preserves its scroll position. Direct chapter controls push a URL fragment for browser Back. Arrow keys and Home/End work when the reader has focus. Contextual League tabs also have keyboard arrow equivalents.

The seven member destinations retain different composition: a score reader beside the five-pair saved slate; a roster-value spread beside the complete value ledger; a form/completed-week/wire notebook; a searchable team index with roster reader and alternative standings/Faces; a dated editorial spread; a chronology with historical sheet; and a destination register with the real Free Throw entry. Public mode omits the member club and scouting chapters.

At 390/320px, the bottom native chapter picker and Previous/Next are the primary navigation. The phone keeps actual full-width chapter movement and native touch swiping. The league's table becomes a numbered, labelled record register; the roster opens below the team index. The editorial pages retain article/source structure, while the member value spread retains its player anchors and foldable ledger. The compact Synthetic concept disclosure replaces an inherited global menu. Focus remains visible and all phone links/controls retain their 44px minimum height.

The mobile standings table retains `position: relative`, containing its absolutely positioned visually hidden header after real chapter navigation. No new document overflow masking was added for the art phase. The programme palette and font declarations are local semantic study roles; they do not alter production tokens.

## Content map and truthfulness

| Information family | Reachable place |
| --- | --- |
| Identity; Home, News, Stocks, History, Arcade | Logo/global links on desktop; logo and bottom-picker Tools destination on phone. News uses `/intel`; Stocks uses `/stocks#player-board`. |
| Teams, Transactions, AI Decides, trade analyzer, weekly archive | Play & tools register, plus contextual chapter links. `/arcade/free-throw` is the actual existing game entry. |
| Member identity, manager, record, standing, roster count and actions | My club; `/team` and `/teams/1#team-roster` remain direct links. |
| Current Week 3 pair with both managers/records/scores/status | This week score reader; five explicit selectors. Known `0.0` and null `Pending` are distinct. Every pair remains incomplete. |
| Five saved AI rows and all returned details | This week. The returned away choice is 35%; the other team is 65%; confidence is independently 20%. Each disclosure prints returned choice, both probabilities, confidence, saved timestamp, model, prompt, absent input/slate snapshots and supplied evidence. |
| Stale/missing AI | `?ai=stale` visibly labels the old context and omits current probability meters. `?ai=missing` retains five matchup rows with unavailable AI and no invented percentages. Tools also links these fixtures. |
| Modeled FAAB value, basis, coverage/time, top three, all 24 roster values | Member My club. All 24 values are printed in the native disclosure; the history state is explicitly unavailable. Value rank is the supplied fixture value, not inferred. |
| Watch/form, completed best/rough, period, games and coverage | Member Scoutbook. All three watch rows and all supplied best/rough rows are retained; overlap, five eligible players, excluded DNP/no-game/unknown records and the precise completed source period are visible. |
| Member news and moves | Scoutbook wire with fixture source/time, no invented add/drop legs; real News/Transactions destinations. |
| Ten faces with player/team/value/profile | League index → Faces. Ten actual supplied player anchors, modeled values, managers and profile links; grayscale approved local portraits. |
| Ten teams; all 228 unique references with position/NBA | League index → Directory. All ten team selectors and every supplied roster are reachable. Team/player/manager/position/NBA search and points/name/roster-size sort work locally. Team profile and full roster links are distinct from selection. |
| Ten standings rows, rank/W/L/PF | League index → Standings. PF is `pointsFor / 100`. Power remains explicitly unavailable; no ranking is synthesized. |
| Previous-season record attribution | Selected roster → 2025 franchise disclosure. NeuralNets retains “Under the previous manager as QBs Gremlins.” |
| Dated game/editorial, three opinions/statistics/periods/sources | The edition, using coherent `data.archive[0]`; all selection reasons and checked source dates remain in native disclosures. |
| Happenings and edition sources | The edition and Archive source disclosures; links and dated text preserved. |
| Both archive entries, routes, dates and historic final | Archive selector. Capture state opens the 2025 final draft (`2026-W40`), preserving 326.0–251.5 and the supplied context. |
| Provenance and public/member comparison | Compact persistent Synthetic concept label with expandable provenance/comparison, per-chapter provenance buttons and Tools provenance. |

The imported `data.home.edition.game.teamIds` conflict with its preserved prose. This implementation does not correct or reinterpret that field. It uses the coherent `data.archive[0]` record for the dated editorial and uses directory/personal records exclusively for the current fixture pairing, as directed. No current Week 2 award is claimed.

**Abridgment:** no requested roster, value, AI-row, spotlight, happening, source or archive inventory is truncated. Null avatar/ESPN identifiers, duplicate projection IDs/objects, null AI baseline, points-against and games-back transport fields are not exhaustively printed as UI. All source objects remain intact in the imported fixture; later full implementation must continue to retain their domain semantics rather than replace them with inferred values. The raw inconsistent home-edition pair is intentionally not presented as a coherent editorial pair.

## Capture API

`document.body.dataset.studyReady === '03'` is set after synchronous fixture rendering. `window.goatStudy.states` exposes eight member capture IDs:

| ID | Actual state |
| --- | --- |
| `default` | This week, first member pairing and all five saved AI rows |
| `team` | My club, full value disclosure open |
| `scout` | Member notebook and wire |
| `league` | Unfiltered directory and first team's roster |
| `standings` | League index's standings view |
| `edition` | Dated opening-edition spread |
| `archive` | Older draft containing the 2025 final |
| `tools` | Destination register and Free Throw |

The public API omits member-only IDs. Other reachable states: League → Faces; any of ten team selectors; search results/empty results and sorting; either archive selector; any of five pair selectors; native source/value disclosures; public/member and AI query links. `activate()` chooses these real views and waits two frames. It does not substitute screenshots or synthetic renderings.

## Motion and current limits

Adjacent fine-pointer chapter buttons move the actual panes together for 200ms. Keyboard, chapter picker, history, capture API and reduced motion resolve immediately. Native touch swiping remains direct. See `ART.md` and `motion-demo.json` for the exact tested action path, interruption behavior and recording limits.

Root owns independent full-document and pane capture, clip recording, critique and Muse review. Physical device/Safari and screen-reader verification remain unperformed. Live external destination routes and authentication are not exercised by this local static fixture. No final user acceptance or production readiness is claimed.
