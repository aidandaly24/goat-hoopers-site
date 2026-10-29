# 12 — Orbital league / stage-one freeze

User question: “Who am I connected to this week, and what does the rest of this league look like?” Primary action: follow a real matchup connection or choose a team face, then inspect its attached shelf.

This is a grayscale architectural study, pending the independent geometry gate. It is not final artwork or production integration. Work is confined to this directory.

## Geometry and navigation

Desktop 1440: ten portrait landmarks sit around an elliptical league orbit. Each shows a real team name, its face player, and the supplied synthetic modeled value. Five SVG connections are derived from the actual directory pairings. The central lens always shows the selected current matchup; choosing a face also selects that team's actual connection. A tangential reading shelf shares the same open canvas to the right. It is attached by a curved rule rather than a repeated card wrapper. The orbit stays available beside longer roster, decision and editorial readings.

Four named tool-axis signposts belong to this navigation plane: Read (weekly/news), Decide (saved AI/arcade), League (rosters/standings), and Manage (stocks/trades). Their shelf content replaces the current reading; it does not append a second dashboard below a novelty map.

Phone 390/320: the diagram becomes a smaller ten-position portrait/number orbit. Every face remains a 44px button with a full accessible name; the center shows roster IDs and current scores. Full team/player names, managers, record, value and rosters move into the selected linear shelf directly below the orbit. Selecting a face or axis moves focus and scroll to that shelf. The directory offers the parallel full-name list and search path. Portrait positions remain stable. No gesture, drag or hover is required.

The readable central score distinguishes known `0.0` from null `Pending` and visibly says incomplete. The all-five current-connection list provides the same navigation as the SVG paths. The axis controls, native disclosures, mode comparison and actual destination links remain available on phone.

`window.goatStudy.states` exposes eight member states (seven public):

| Hook | Content |
| --- | --- |
| `default` | Selected current matchup, both managers/records/scores, saved-choice summary, all five pair links |
| `team` | Selected team shelf; hook selects NeuralNets and its 7/8 connection |
| `my-team` | Member-only complete price/scouting/news/move edition |
| `directory` | Search/sort ten teams and all 228 unique roster player references |
| `standings` | All ten current ranks, W/L and PF |
| `picks` | All five saved returned choices, distributions and provenance disclosures |
| `editorial` | Dated archive reading; two date tabs select both supplied editions |
| `tools` | Stocks, trade analyzer, free-throw/Arcade, History and recent league moves |

`activate(id)` changes real rendered content. Team selection, connection selection and archive-date selection are additional real control paths. The “This week” control returns to the currently selected current matchup. There are no dialogs or focus traps. External app destinations are ordinary links, while the local study uses buttons and does not simulate their pages.

This changes architecture rather than only theme: team identity is the primary spatial index; actual matchup topology selects context; a persistent diagram and single changing shelf replace repeated bordered sections. Different visitor jobs enter through a face, pair or named axis. Phone changes representation instead of shrinking every desktop label.

## Content and factual map

All content imports explicit `{inventory,data,mode,aiState,esc,money}` from `../../data.js`. No independent fixture, source correction, remote request or provider call is introduced.

| Preserved content family | Concrete reachable place |
| --- | --- |
| GOAT identity and Home | Approved local black logo, local Home action; actual Home link in footer |
| News, Stocks, History, Arcade, AI Decides, Teams, Transactions, trade analyzer, weekly archive | Axis shelves plus persistent footer links with the supplied actual destination paths |
| `/team`, `/teams/1#team-roster`, member/public comparison | Member team shelf, header mode links; personal shelf omitted from public state set and rendering |
| Actual free-throw game | Decide/Manage shelves and `/arcade/free-throw`, approved local grayscale preview |
| Current matchup, week, both identities/managers/records/scores, incomplete state | Central lens + default shelf + all-five connection list |
| All five saved AI choices/probabilities/independent confidence | Picks shelf; the first returned choice is team 2 at 35%, opposing team 1 at 65%, confidence 20% |
| AI time/model/prompt/input/evidence | Per-pair native provenance disclosure. Null snapshots/baseline and empty result evidence are explicitly unsupplied. `?ai=stale` is labelled stale; `?ai=missing` displays no invented rows or percentages |
| Member identity, count, standing, actions | My team shelf |
| Modeled subtotal, basis, priced/unpriced coverage, timestamp, rank, top three, all 24 values | My team shelf; all values in a native disclosure |
| Unavailable recorded value history and Power | Explicit unavailable copy in member/standings/tools views; no line or ranking is fabricated |
| Form watch and completed-week best/rough | My team shelf: supplied EMA FPPG versus recorded weekly points, games, notes, period and small-cohort coverage all retained |
| Member news and moves | My team shelf; sample outlet/date and move date/type/empty supplied legs retained |
| All ten faces, players, modeled value and real profile links | Desktop orbit plus each selected team shelf; full-name directory and face shelf on phone |
| Ten-team directory/current records/managers/opponents; all 228 refs with position/NBA | Directory shelf. Native roster disclosures, local search, team name/roster-size sorting. Team shelf also provides full selected roster |
| Prior-season record/finish/attribution | Team shelf disclosure; NeuralNets explicitly says previous manager in its summary and names QBs Gremlins inside |
| Ten standings rank/W/L/PF | Standings shelf; PF is `pointsFor / 100` |
| Dated game/editorial, exact three spotlight stats/opinion/selection/source dates | Read shelf, first archive tab; all source/period qualifiers and draft status retained |
| Happenings/source register, both archive dates/routes | Read shelf, both tabs; native source register and direct `/weekly/2026-W41`, `/weekly/2026-W40` links |
| League recent moves/provenance | Manage shelf, persistent synthetic banner, footer |

Known fixture conflict: `home.edition.game.teamIds` is 1/2 while its historical title/prose names 1/5. This study does not display that conflicted object as a result. Dated reading uses the coherent `data.archive` entries: W41 upcoming 1/5, W40 historical final 5/7 (326.0–251.5). Current Week 3 is taken only from the directory/current matchup. Neither Oct sample is represented as a current official Week 2 award.

Stage-one inventory bounds: all required information families are implemented, including all 228 roster references, all 24 member values, all ten standings and all five AI rows. This is not a generic raw-DTO dump: unused null hub-stat slots, redundant duplicate projections and raw provider IDs other than relevant team/input IDs are not separately narrated. No full historical valuation producer, deep player loader, authentication, real-time data or external destination implementation exists in this isolated study. The mode query is demonstration state, not an auth boundary.

## Applied craft references and motion

Read the project design skill and its visual-hierarchy, navigation-accessibility and motion references, plus the supplied `reference-notes/craft.md`. Specific applications:

- Hallmark custom direction/macrostructures: the topology governs entry, navigation and continued reading, rather than adding a decorative map above conventional sections.
- Hallmark responsive and pbakaus/adapt: phone retains ten stable targets and full task coverage, with full names transferred into the selected shelf and searchable list.
- Elaya redesign: one unboxed contextual shelf breaks equal-card symmetry; team, game and reading views share location, with clear return to current context.
- MoMA indexed-collection principle from the source notes: search reaches specific players across all rosters, not just a face collection.
- Rauno/direct interaction and Addy accessibility: visible native controls and keyboard paths duplicate spatial links, with focus transferred to the real selected reading.
- Emil/pbakaus motion purpose gate: stage one is immediate and has no animation, timers, RAF, autonomous orbit movement or hidden-reveal text.

Later motion thesis, only after geometry approval: a short user-triggered connector/shelf continuity change could explain which face or connection opened the shelf. Portrait locations and numeric values stay still. Frequent keyboard changes remain immediate; reduced motion uses the exact current still-state change. No animation library is needed.

## Browser checks and limits

Tested locally with installed Playwright and `/usr/bin/chromium` against root's port 4207 server:

- All eight member hook states at 1440, 390 and 320 CSS px, at normal and 200% root font size: 48 state/size combinations, no document horizontal overflow after correction.
- No page JavaScript errors or failed local responses during the pass.
- Ten face controls; clicking NeuralNets selects its real 7/8 connection. A physical click on the second SVG connection selects 3/4.
- Directory search `Lillard` gives one team/one player; no-match message works; name sorting works; cleared inventory contains 228 roster references.
- Five AI rows retain the first away choice at 35%, other probability 65%, independent confidence 20%; metadata disclosure opens.
- All 24 member roster values expand; second archive tab shows the supplied 326.0–251.5 historical final.
- Phone keyboard Enter on team 3 opens Stephon Castle’s Back and moves focus to `#reader`.
- Public/member × stale/missing AI combinations render the expected status; public exposes no My team hook.
- Live reduced-motion emulation has zero active animations. There is no autonomous motion at normal preference either.

Visual inspection was bounded to temporary local desktop/phone screenshots for geometry; root owns the delivery captures. External destination pages, actual device behavior, screen-reader announcements, universal accessibility and final design acceptance are unverified. Browser zoom was not tested as a substitute for the explicit 200% root-text check. No production build is applicable to these isolated HTML/CSS/ES-module files. No Git, production, other author, shared presentation, installation or external service changes were made.

Frozen deliverables: `index.html`, `style.css`, `app.js`, `STRUCTURE.md`. No blocker remains for the independent geometry gate.
