# 19 — Franchise index

Stage-one grayscale architectural prototype; frozen for the independent twenty-structure gate. Full art is not implemented or claimed. Only this assigned folder was edited. Common facts are imported explicitly from `../../data.js`; no shared presentation code or runtime service is used.

## Surface contract

**User question:** “Where is this franchise or player, and what do I need to know before I act?”

**Primary action:** locate by team initial, standing rank or a roster-name query, then open that franchise's in-flow dossier. A member's bookmark opens their actual `personal.summary.team.id` (fixture team 1), rather than a generic dashboard.

**Relevant states:** full alphabetic field; filtered field; rank/roster-size order; opened overview; complete roster with name/position order; member form and team wire; Week 3 slate; standings; dated edition; archive; tools; ready/stale/missing saved AI; member/public.

**Forbidden patterns:** equal-card gallery, sidebar workspace, conventional hero, repeated bordered dashboard panels, modal full-page team inspector, colored presentation, fabricated history or lineup power.

## Geometry and navigation

At 1440px the main surface is an open, typographic directory. Large hanging team names stagger across the width; rank and initial are precise locators. Approved leading-player cutouts vary in height and sit at the outer edge with real player links, position and modeled value. Team/manager/current record, roster count and current opponent remain next to each name. The directory controls are the opening tool rather than content underneath a promotional hero.

Opening a name inserts a full-width gray dossier immediately after that franchise. It pushes later names down in the same document flow. The foldout's heading retains team identity; Overview, Roster and, for the member's own team, Form & team wire change its contents. Close/Escape returns focus to the originating name. The public profile and roster destinations are separate links from the disclosure action.

At 390px and 320px the field becomes a single narrow locator column with the cutout anchored beside the lower identity details. The alphabet wraps as touch controls, rather than squeezing tiny targets into a horizontal strip. The directory keeps a live search and native order selector. A fixed four-way locator dock provides Teams / Find player / Notebook / My team. Find player returns to and focuses the search. My team opens the actual member dossier; public mode substitutes About league. The desktop's destination disclosure is removed from phone chrome; every destination remains reachable through Notebook → League tools, through the context-specific dossier or edition links, or the GOAT Home mark. This is a directory/locator task adapted for a phone, rather than a reduced desktop header.

The compact **Synthetic concept · 19** disclosure remains in the header. Its expanded provenance is bounded to the viewport, Escape closes it and restores summary focus. The long fixture explanation is not the first-screen lead.

The notebook is a distinct reading mode with Week 3 + AI / Standings / Dated stories / Archive / League tools tabs and a Return to index action. It retains the franchise-field vocabulary but uses rows and open editorial spreads suited to the actual information. GOAT menu on desktop exposes the complete route list, including the public/member comparison.

## Reachable content map

| Required family | Concrete place and fixture coverage |
| --- | --- |
| Identity / Home / route access | Approved GOAT mark; desktop GOAT menu; notebook League tools; contextual links. News `/intel`, Stocks `/stocks#player-board`, History `/history`, Arcade `/arcade`, AI `/ai-decides`, Teams `/teams`, Transactions `/transactions`, trade analyzer `/trade-analyzer`, weekly `/weekly`, actual game `/arcade/free-throw`, member `/team` and `/teams/1#team-roster`, public/member concept comparison. No unsupported player-specific Stocks query. |
| This week's pair | Compact index orientation and full dossier/Week 3 slate. Both team names, managers, current records and supplied scores. Known 0.0 remains distinct from null Pending; every current pair says Incomplete. Member orientation uses their own supplied pairing; public uses directory pair 1/2. |
| All saved AI rows | Notebook Week 3 + AI shows all five. The first returned choice remains Ware the Hoes At? at 35%, while Reaves Dropper is 65%; independent confidence is 20%. Every row discloses returned choice, both named probabilities, saved timestamp, model, prompt, input/weekly snapshot null state, evidence, preview qualifier and confidence. `?ai=stale` labels stale; `?ai=missing` shows unavailable and no fabricated bars/pick. |
| Member identity / value | My franchise → Overview. Team, standing, roster count, current pair, My team and roster actions; $1,095.25 modeled FAAB total, 24/24 priced, 0 unpriced, in-season basis and computation timestamp; all three supplied top values and changes; native disclosure for all 24 values, with Unpriced handling. History/power say unavailable. |
| Member form and wire | Own dossier → Form & team wire. Three supplied EMA watches with 8 observed games, basis, availability-unknown note, and schedule limitation. Completed Week 2 disclosure holds all three best and three rough rows, exact points/3 GP, source period, five-player coverage/exclusions and synthetic caveat. Both news items, outlet/date and recent move are present. Public rendering does not expose this member form/value edition. |
| Faces / directory / roster search | Ten franchises and ten supplied player anchors, each with name, position, modeled value and actual player link. Full ten-team directory has manager/record/opponent/count and public profile links. Every roster can be opened; browser walk found 228 references / 228 unique IDs, each retaining name, position and NBA abbreviation. Query searches teams, managers, roster names, positions and NBA abbreviations; player matches provide a direct roster action. A–Z/rank/roster-size and roster name/position orders work. |
| Standings / previous season | Notebook Standings: all ten rank, W–L and PF rows, with PF divided by 100 (first 320.5). Each dossier has its dated 2025 record and finish disclosure. NeuralNets' summary says previous manager; the disclosure preserves “Under the previous manager as QBs Gremlins.” |
| Editorial / happenings / sources | Notebook Dated stories uses coherent `data.archive[0]`: Oct 5–11 unpublished draft, upcoming team 1/5 game, selection reason and no invented scores; all three spotlights retain exact supplied stats, opinions, source periods, selection explanations and checked dates. All three happenings and five source links are reachable. |
| Archive | Notebook Archive has both exact date ranges, draft statuses and stable `/weekly/2026-W41` / `/weekly/2026-W40` destinations. Either opens inside the notebook. The second preserves the 2025 final, teams 5/7 and 326.0–251.5, with its historical source and publication qualification. |
| Moves / exploration / provenance | League tools holds all three supplied current league move summaries, type/week/date and supplied add/drop counts, plus Stocks/trade/Arcade/News/AI actions. Footer and header expandable provenance retain offline/synthetic/dates/history/power limits. |

The preserved `home.edition.game.teamIds` 1/2 conflicts with that draft's team 1/5 headline. It is not mixed into a result. Current pairings come only from directory/personal currentMatchup. The dated narrative comes from the coherent archive records; the common fixture is unchanged.

## Study API

`document.body.dataset.studyReady = '19'` is set after synchronous render. `window.goatStudy.states` exposes eight representative IDs:

- `index`: deterministic default alphabetic field.
- `own-dossier`: member own overview, or public franchise 1 overview.
- `roster-search`: Lillard search, with a real matching roster action.
- `slate`: all five current pairs and saved AI rows.
- `standings`: all ten standing rows.
- `edition`: deterministic first dated edition and all three stories.
- `archive`: both dated editions.
- `team-form`: own member form/wire; public mode maps to League tools.

Remaining views are reachable without a hook: dossier Roster and roster order selector; per-team overview; complete-value and source disclosures; archive entry 2; notebook League tools; desktop GOAT menu; query/letter/team-order combinations. The API selects actual UI and does not fake screenshots.

## References that changed the architecture

- Hallmark custom direction and macrostructure: the specific idea governs the complete experience. A franchise directory, its locators and the in-flow dossier remain the work surface, rather than a themed opening above dashboard sections.
- Elaya redesign: break equal-card symmetry, question automatic sidebars, and use inline expansion with meaningful return/focus. This produced the pushed-apart field and explicit origin-preserving Close.
- MoMA indexed collection reference in the supplied craft note: the index itself is useful navigation; initial and rank order locate actual content rather than decorating a collection.
- `pbakaus/adapt`: phone controls serve the finding task. This produced the four-way locator dock, focusable player search and wrapped touch initials instead of the desktop many-link menu.
- Rauno/Emil and `apple-design`: preserve the source/destination relationship. The dossier appears where the name was selected and returns focus there. Frequent search, sort and keyboard actions are immediate.
- Project visual hierarchy/navigation guidance: explicit identity/value rows, separate profile/disclosure actions, native details, visible control focus, honest null/known-zero/current/draft states and bounded data imports.

## Motion job and still fallback

Stage one uses immediate changes; no autonomous motion, timers, RAF, observers, hidden entrance content or dependencies. Reduced motion keeps all functions unchanged. For a later full-art implementation, the one purposeful candidate is a short user-triggered insertion transition at the selected franchise, explaining how later names move aside. It must be interruptible, omitted for keyboard/frequent search/sort and `prefers-reduced-motion`, and preserve the same origin, reading order, Close and content. No blanket entrance reveals are proposed.

## Actual verification and limits

Used the installed Playwright module with `/usr/bin/chromium` against the root-owned `http://127.0.0.1:4207` server. `node --check app.js` passes. Browser runs reported zero page errors. Tested 1440 desktop and 390/320 phone, and all eight representative states at 320px normal and 200% root text: document width stayed exactly 320px. Expanded header provenance also stayed inside 320px at normal and 200% text. Tested real rank sorting, Lillard input → roster, 24 own values, all ten roster disclosures (228/228 unique refs), all five AI rows, ten standings, three editorial stories, both archive editions, member form/wire, bookmark, Close focus return, provenance Escape focus return, public/member, stale/missing AI and reduced-motion dossier opening. Temporary review screenshots were outside the deliverable folder; the parent owns captures.

This bounded prototype has no Next/production routing or auth implementation; route anchors point to actual destinations but no external pages/providers were called. Public/member is a fixture switch, not an auth boundary. No screen reader, physical phone, live account, full cross-browser pass or final visual acceptance is claimed. Body reading data is 16px minimum; inline editorial source links use normal inline-link target behavior while controls and phone locator actions have 44px targets.

Precisely abridged inventory: the six optional `home.hub.stats` aggregate objects are not presented; `pointsAgainst` and zero ties are not printed in the standing table; directory `featuredPlayerIds` are not separately badged because all referenced players remain in full rosters. Null avatar/opener/latestMove/recentMove, ESPN IDs, internal league/move IDs and null AI baseline are not expanded as user-facing metadata. The supplied `valuation.rank` is withheld because this local directory does not carry all-compared-team pricing coverage; no value rank is asserted from own-team completeness alone. A full implementation must resolve that producer evidence and retain the supplied rank appropriately. This is a stage-one inventory, not a claim that every optional source field is a visible product feature.
