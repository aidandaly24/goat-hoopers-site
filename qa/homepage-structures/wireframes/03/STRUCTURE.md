# Study 03 — Horizontal chapters

Stage one only: source-ready grayscale structural prototype. Independent structure review and root-owned captures are still required before any full visual implementation. This is not production work or final acceptance.

## Surface contract

- **User question:** “What is happening in my league, and which part do I want to read or use next?” For a member, the opening pair is their own pairing.
- **Primary action:** choose a whole chapter, then act on the relevant matchup, roster, story or league tool. My team remains a direct member action.
- **States:** current fixture pair/slate; member club valuation; member scouting notebook; searchable league directory; standings; ten faces; dated edition; two archive selections; destination tools. Saved, stale and missing AI query states are supported.
- **Narrow layout:** the publication keeps full-width, side-by-side destinations. The desktop chapter links become a native chapter picker with Previous/Next buttons. A short Tools button goes to the actual tools chapter. Touch swiping moves the native horizontal viewport. Each chapter has its own vertical reading overflow; the content is not one continuous vertical home dashboard.
- **Forbidden patterns:** repeated bounded dashboard cards, an architectural novelty above a generic long dashboard, invented current scores/results/history/Power, drag-only navigation, automatic motion, remote runtime dependencies or production edits.

## Geometry and navigation

At 1440px the persistent masthead and chapter rail frame one full-width destination. The main element is a native horizontal scroller with scroll snapping; its children each occupy 100% of the viewport. Offscreen chapters are inert so they do not enter keyboard traversal. Reading position is retained separately in each chapter. Direct chapter controls and a URL fragment such as `#chapter-league` expose navigation without a gesture. When the reader itself has focus, Left/Right and Home/End change chapter immediately.

The seven member chapters deliberately have different internal compositions:

1. **This week:** a large two-team score reader faces the complete five-pair saved slate. Selecting a pairing changes the left reader in place and retains the independent AI provenance disclosure for each row.
2. **My club:** a broad typographic value spread and three player anchors sit beside a complete 24-player value ledger. Recorded history has a composed unavailable state rather than a decorative chart.
3. **Scoutbook:** an open three-part notebook separates in-season form, completed-week best/rough totals, and the member's wire. The completed-week source period and small-cohort coverage remain visible.
4. **League index:** a working searchable/sortable team index opens a roster reader. Standings and Faces are contextual alternative index views, rather than appended dashboard sections.
5. **The edition:** dated editorial prose and happenings form an asymmetric spread, followed by three actual sourced opinions with their exact NBA/college statistical periods.
6. **Archive:** a chronology selector opens the selected historical sheet; both date bounds, draft states, actual pairs, results where supplied, references and routes stay together.
7. **Play & tools:** an unboxed destination register faces the existing Free Throw entry and provenance. It is a reachable chapter with actual destinations.

Public mode has five chapters: This week, League index, The edition, Archive, Play & tools. The member club/scout chapters and personal `/team` actions are not rendered in public mode. The local fixture itself is not an authentication boundary.

At 390/320px, the week becomes a score-reader page followed by its slate within the same chapter; the club keeps player anchors and a foldable ledger; the notebook becomes a readable set of distinct source groups; the directory opens the roster below its compact index; standings become a numbered register with W/L/PF labels; the edition and archive keep their publication anatomy. Only the active chapter is read vertically. At enlarged text, grid columns give way based on available width and long factual names wrap. Chapter controls remain available without requiring a swipe.

## Content map and truthfulness

| Information family | Reachable place |
| --- | --- |
| Identity; Home, News, Stocks, History, Arcade | Logo/global links on desktop; logo and Tools destination on phone. News uses `/intel`; Stocks uses `/stocks#player-board`. |
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
| Provenance and public/member comparison | Persistent synthetic fixture label, per-chapter footers, Tools provenance and masthead comparison link. |

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

## Applied craft and motion job

- Hallmark's custom direction and macrostructure principle made chapter movement govern the **entire** information architecture. The family changes remain in full destinations; there is no novelty cover followed by a conventional dashboard.
- Elaya's redesign guidance to break equal-card symmetry led to the open score spread, ledger, notebook, indexed roster reader and archive sheet. Its state-preservation principle led to stable reader context, explicit direct navigation and retained chapter scroll.
- `pbakaus/adapt` changed the phone task model: whole-chapter selection/swipe is retained while dense tables become labelled records and the roster reader moves below its index. It does not merely shrink desktop columns.
- `addyosmani/accessibility` and Rauno's direct-input principle led to native controls, real focus outlines, 44px phone control/link floors, inert offscreen chapters, named state announcements, a picker, and keyboard equivalents for both chapters and league tabs.
- `antfu/antfu` informed explicit local fixture imports with no provider/module magic.
- `pbakaus/animate`, Emil's frequency/purpose gate and `iart-ai/accessible-animation` informed the stage-one immediate chapter controls and live reduced-motion equivalent. Touch movement is native, user driven, and tied to the literal side-by-side pages. No timer, autonomous reveal or numeric tween is used.

For a later full-art stage, the useful motion thesis is one short, interruptible horizontal transition when an occasional pointer chapter choice changes destination; it would explain adjacent pages, retain the fixed chapter location marker and stop before reading begins. Keyboard navigation and reduced motion remain immediate. This is proposed, not implemented animation evidence. Stage one already provides the still equivalent and native direct touch path.

## Actual verification and limits

Local Chromium at the root-owned `127.0.0.1:4207` server, using installed Playwright/Chromium only:

- `node --check study.js` passed.
- 48 state/reflow checks: all eight capture IDs at 1440×1000, 390×844 and 320×740, each at 100% and 200% root font size. No body or active-chapter horizontal overflow. The smallest active reader remained 284px high in this test matrix.
- No browser page errors or failed local image/module responses during the final pass.
- Clicked all ten team selectors: 24, 27, 22, 22, 22, 23, 23, 22, 21, 22 roster rows respectively (228 total unique source references).
- Player search `Dybantsa` returned one team and the actual `AJ Dybantsa · PF · WAS` reference. A nonmatching search returned an explicit empty state. Search/sort controls are wired to local source rows.
- Ten Faces entries rendered. League-tab arrow navigation worked. Phone picker and Tools button changed the actual chapter. A CDP touch swipe moved the native reader from This week to My club.
- Reader ArrowRight moved to My club. The selected pairing reader and its evidence disclosure showed actual source values, both probabilities and independent confidence.
- Public stale fixture rendered no personal chapters or `/team` links; all five saved choices remained explicitly stale with no probability meters. Public missing fixture retained five unavailable AI rows and no probability meters.
- Live reduced-motion emulation retained actual chapter navigation.

Root owns the bulk state captures and independent structural comparison. No screenshot gallery or capture infrastructure was created here. No production build is claimed because this is an isolated static QA study with no application changes. External destination routes were checked as authored hrefs, not visited or end-to-end tested. Physical iOS/Android, screen-reader traversal and final visual acceptance remain unverified. No Git, production, shared-file, Muse, provider, install or other-author edits/calls were made.

Files: `index.html`, `study.css`, `study.js`, `STRUCTURE.md` in `wireframes/03/` only.
