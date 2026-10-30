# Concept 19 — Know the opponent, keep the league in view

Discovery only. No presentation code, dependencies, production changes, publication, or peer inspection. This plan is the handoff for a later build instruction.

## Product answer

A competitive manager needs a bounded opponent brief attached to their own evidence, inside a complete league website. The homepage should answer three connected questions: Who are we facing? What do we actually know about our own roster? Where does this contest sit among the ten clubs?

The fixture supports team-level comparison, but it does **not** provide Ware the Hoes At?’s or papichooter’s player roster, player evidence, or modeled quote total. That discovery rules out player-versus-player strength claims, opponent lineup graphics, positional advantages, schedule projections, and implied win calculations. The useful comparison is current pairing status plus each club’s supplied record, points for, standing, and clearly dated history. Our own completed-week samples and quote coverage sit close to that brief with explicit limits. A previous-week player sample never explains or adds into the Week 3 current score.

The page remains a homepage: visible sample changes, completed-week evidence, roster quote context, the other league contests, all ten club identities, history, tools, and a useful route directory. There is no full roster or standings table on the homepage and no compulsory matchup-selector workspace.

## Three architectures considered independently

| Architecture | Usable whole-site structure | Strength | Reason to select or reject |
| --- | --- | --- | --- |
| **A. Opponent brief inside a club website — selected** | Horizontal GOAT masthead, a narrow persistent section index, a two-team context spread with nearby evidence actions, open sample evidence and quotes, other courts, ten-club discovery, Clubhouse and footer. Local detail pages retain the same navigation. | The opponent remains the entry point while the document has several independent reasons to keep reading. A manager can inspect one fact and return to the exact section. | Best fit for the assigned question and the fixture’s uneven evidence. The source boundary can be visible beside the comparison rather than buried in a general disclaimer. |
| **B. Changes-first journal** | Compact global navigation; chronological team changes form the main reading column; a fixed opponent summary sits beside the journal; player receipts, resources, league roundup, and site directory follow. Guest gets a public weekly journal. | A returning member immediately sees what changed, with dates acting as navigable landmarks. | Rejected because this fixture has only two changes per member. Enlarging those into the organizing system would overstate a thin feed, and NeuralNets’ two gaps would dominate the whole page. Its opponent context would also compete with the reading column. |
| **C. League-round homepage** | A full-width five-pairing round leads; a ten-club index is the main central content; the member’s own evidence section follows; history, Stocks, Arcade, and tools remain visible. Guest uses the same league-first structure. | Strong public orientation; all clubs have equal initial presence and every pairing is immediately discoverable. | Rejected for members because it asks them to scan many unrelated names before reaching their own evidence. Making a selected pair expand into the main application would hide too much default content and drift toward a matchup visualization app. |

The obvious default rejected is a score hero followed by a full roster table and standings table, with a serif prose face, system controls, and monospaced numbers. That would mostly repeat existing data patterns and give unavailable opponent details the appearance of a complete scouting report. Here, a short evidence list, purposeful quote samples, and a record-grouped club index each answer a different question.

## Identity, navigation, and page geometry

The exact approved white GOAT horizontal logo lives in an ink-black masthead. The mark is unchanged. The website’s character continues through short Oswald section headings, direct club names, a stable section index, and a single basketball-orange action/focus accent on a white working page. Identity supplies orientation throughout the page; no ticket, jersey, poster, invented crest, or decorative dashboard metaphor replaces the website.

The global header contains Home as the current page, Teams as a local link to the club index, and clearly identified exits for News, Stocks, Arcade, and My Team or Sign in. A separate small control reads **Demo persona** and names Reaves Dropper, NeuralNets, and Guest. It changes `?persona=reaves|neural|guest`, defaults to Reaves, and sets `document.documentElement.dataset.persona`. It explicitly says it changes synthetic examples and does not sign anyone in.

On a member page, the left index has ordinary anchors: Opponent, Player evidence, Roster quotes, Other courts, Clubs, Clubhouse. The guest index is This week, The clubs, League history, Clubhouse. It is navigation in the same document, not a set of tabs. All primary content remains visible in normal page flow. The index can indicate the current section without moving keyboard focus or announcing every scroll change.

At 1440px, the masthead spans the page and the document uses a roughly 172px index plus a flexible main area capped near 1120px. The lead main area places the paired team context in approximately two thirds and the state-specific next actions in one third. At 1120px, the index becomes roughly 144px; the lead actions move below the comparison when the actual long names no longer fit comfortably. Evidence and quote sections use two columns only when their contents fit. No fixed-height reader, horizontal data scroller, shrunken type, or clipped name is needed. There is no mobile design or phone capture work in this phase.

## Member homepage, with materially different priorities

### 1. Opponent and immediate next action

The lead is a working section, not a promotional headline. It names the current Week 3 opponent, puts both club names and records beside one another, and shows the current score/status with its synthetic date. The comparison includes current league rank and points for under the explicit label “2026 season through two completed weeks.” Previous-season records are excluded from the lead to avoid mixing periods.

**Reaves:** Reaves Dropper, 2–0, first, 615.5 PF; Ware the Hoes At?, 1–1, fourth, 548.75 PF. Current sample score is 184.5–171, labelled “Synthetic Week 3 score, in progress.” A simple difference may say “Reaves ahead by 13.5 in this sample”; it never says won or predicts a finish. The next-action area leads with “Review five completed-week samples” and “Inspect opponent context.” Two compact dated changes explain the new player breakdown and full 24-of-24 quote coverage. These link to visible sections rather than hiding their content.

**NeuralNets:** NeuralNets, 0–2, tenth, 412.25 PF; papichooter, 2–0, third, 560.25 PF. Papichooter’s recorded **0** and NeuralNets’ **Score unavailable** are both visible. There is no leader, margin, tie, percentage bar, or automatic refresh promise. Its next-action area leads with “Inspect six unpriced players,” then “Read available player samples.” The two dated changes surface the quote and score gaps with specific local destinations. The score notice explains the boundary without swallowing the useful team comparison.

An “Opponent context” link opens a local dossier for Ware or papichooter. This contains the supplied identity, manager, current record/rank/PF, current pairing, and dated 2025 result. It explicitly says that this sample includes no opponent player roster or player-level evidence. The viewer’s evidence and quote coverage remain linked from that dossier; they are never presented as the opponent’s. These are ordinary readable detail pages rather than modal workspaces.

### 2. Player evidence in the open

The section title is “What your roster has shown,” qualified immediately as **Synthetic completed Week 2, 19–25 October**. It does not call those points live form, a forecast, or a complete team recap.

Reaves gets all five available rows in the normal document: Damian Lillard 42.5, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5, Derrick White 22. Names and counted points are readable without interaction. A sentence states that the sample covers five of 24 roster players; the remaining 19 lack completed-week evidence in the fixture. A compact Joel portrait may support recognition, without giving one player a viewport.

NeuralNets gets the three available rows: Giannis Antetokounmpo 45, Kevin Durant 33.5, Rudy Gobert 29.5, with three-of-22 coverage and 19 unavailable. The primary path from this section is inspecting what those samples contain; it does not suggest poor form for players with no sample. Giannis’s supplied portrait can anchor this different edition.

Each available name opens its local player detail, showing the exact sample period, supplied counted points, participation flag explained as synthetic verified evidence, position, current modeled quote if supplied, and the absence of game logs or deeper factors. Unavailable player evidence reads “Not included in this sample,” never zero or DNP. The homepage does not sum these sample rows into a team score.

### 3. Roster quotes as a resource with coverage

Reaves’ resource section says **1,095.25 modeled FAAB · 24 of 24 priced** and shows three current quote examples—Joel Embiid 137.50, Anthony Edwards 124.50, Alperen Şengün 108.25—with an “Inspect all 24 quotes” local action. It states that modeled FAAB is not money available to spend and that league value rank is unavailable because comparable totals for every roster are absent.

NeuralNets says **1,622.00 modeled FAAB subtotal · 16 of 22 priced** with “Incomplete coverage” adjacent to the number. It leads with all six missing names in a compact open list: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler, Darryn Peterson. The local “Inspect quote coverage” action opens the full 22-player list with the six unpriced rows grouped first. Three supplied quote examples—Rudy Gobert 140.75, Giannis Antetokounmpo 135.50, Kevin Durant 130.25—are secondary. The larger subtotal never becomes a claim that NeuralNets is more valuable than Reaves or the opponent.

Both editions have a short “No recorded value history is included” sentence, without an empty chart frame or decorative sparkline. No Lineup Power control is presented because the fixture has no producer snapshot.

### 4. A saved estimate, when one actually exists

For Reaves, a modest paragraph beside the evidence/resource area shows the saved model choice, Reaves 56% and Ware 44%, saved 26 October 2026 at 08:00 UTC. It is labelled **Synthetic saved model estimate; not calibrated odds**. Confidence 0.35 is a separate line with a distinct label; it is not another win probability. A native provenance disclosure explains the supplied fields and that this saved estimate predates the current score snapshot. No odds-like animation or inferred explanation is added.

For NeuralNets, the equivalent short space says that no saved estimate is supplied and links to the available evidence above. It does not reserve a large dead panel or offer fake generation. AI Decides remains reachable as a labelled exit in the footer.

### 5. Other courts and the ten clubs

“Elsewhere in Week 3” prints the other four pairings as readable fixture-backed contest lines, with both names, supplied score/status, and local team-context links. The current member pairing already appears above and gets a simple return link. There is no carousel or selection requirement. Guest receives all five here as its lead content.

The separate “Ten clubs” index includes every team and manager, ordinal rank, 2026 W–L, and points for. It groups the provided standings into **Unbeaten** (three), **One and one** (four), and **Seeking a first win** (three), maintaining standings order within each. These are three open lists with wrapping club names, not a full-width spreadsheet or ten repeated boxed cards. Both the viewer and opponent receive small text labels so the relationship remains visible in broad league browsing. Each name opens a public local team dossier. This directory is useful even if the visitor never inspects the lead matchup.

## Guest is a complete public edition

Guest has no “your” roster, private quote subtotal, private samples, or implied team assignment. The first fold contains the five synthetic Week 3 pairings with current statuses, the league name, season/week, and a clearly labelled “Sign in on GOAT site” exit. The incomplete papichooter–NeuralNets pair retains zero versus unavailable; nothing infers a leader.

Below it, the ten-club index is fully visible, followed by a compact public history section: the supplied **2025 final**, Josh Diddy’s Roster 326–251.5 papichooter. It links to local team context and the real History exit. Any NeuralNets previous-season record appears with “Under the previous manager as QBs Gremlins” in the same visible passage, including in a dossier summary. It is not attributed to today’s manager.

The public page then has the same useful Clubhouse and route directory. Public context, all clubs, history, and explicit account entry make it substantial without borrowing member data or filling gaps with editorial news.

## Clubhouse and semantic footer

The Clubhouse gives the broader site a visible place in the document. A bounded approved court photograph serves as a recognisable scroll landmark rather than an opening billboard. Beside it are practical descriptions and exits for Stocks, Intel, and the weekly archive. The supplied free-throw preview gets a small actual image with “Play free throw on GOAT site,” leading to the real Arcade destination. There are no invented games or simulated play controls in the prototype.

The semantic footer is a deliberate directory, headed “Continue on the current GOAT site.” Every external link visibly carries “GOAT site” or is inside that explicitly labelled group, with accessible names retaining the destination. It contains:

- League: Teams `/teams`, The Table `/table`, Transactions `/transactions`, Draft `/draft`.
- Analysis: Stocks `/stocks`, Intel `/intel`, AI Decides `/ai-decides`, Trade Analyzer `/trade-analyzer`.
- Club: News `/news`, History `/history`, Weekly archive `/weekly`, Arcade `/arcade`.
- Account: My Team `/team`, Sign in `/login`.
- Local Home and Back to top, plus the synthetic source explanation.

No fabricated current transaction/news feed appears: this fixture supplies changes in evidence and coverage, not actual roster transactions or sourced news articles.

## Typography as an operating system

No DM Sans, serif-prose/system-control/IBM-number trio, or all-role replacement default. Use two reviewed local fonts plus a specific installed system reading face. Font files remain referenced at their existing paths and OFL notices remain untouched.

| Role | Choice and scale | Reason and behavior |
| --- | --- | --- |
| Reading and explanations | `DejaVu Sans, Verdana, sans-serif`, 16px/1.6, weight 400; secondary substantive copy no smaller than 14px/1.5 | DejaVu Sans is confirmed present in the QA environment. Its broad humanist forms support qualifications and long mixed-case names without a magazine treatment. Keep prose measures around 55–65 characters. The named fallbacks are deliberate and should be checked during build. |
| Controls and navigation | Local **Space Grotesk**, 15–16px/1.3, weight 550–600 | Clear compact action labels; it differentiates operational language from the reading voice. Targets remain at least 44px high, including persona selection and dossier Back links. Labels wrap rather than use condensed abbreviations. |
| Scores, quotes, ranks, dates, and row numerics | Local **Space Grotesk**, tabular lining numerals, weight 500; 18px ordinary values, 30–36px current scores, 26–30px quote subtotal | Aligned figures do not require monospace. Decimal alignment belongs to relevant quote lists; essential units and coverage stay adjacent. Missing values use words in the reading face, not a dash that looks like a value. |
| Section and short team headings | Local **Oswald**, weight 500–600; 28–34px sections and 36–44px lead club names | A compact basketball-club voice with usable vertical rhythm. Sentence/mixed case is retained. It does not style paragraphs or every data label, and long team names can take two lines. |

During build, test “Stephon Castle’s Back,” “Ware the Hoes At?,” “Giannis Antetokounmpo,” “Kristaps Porziņģis,” and “Alperen Şengün” at 1120 and 1440px and with enlarged text. There is no letter-spacing trick or font-size reduction to force a single line. The approved GOAT SVG remains the only logo lettering.

## Local action model

The planned prototype uses ordinary URL-backed reading views in the same HTML application: Home; Team context; Player evidence; Quote inspection. A view query carries the selected fixture ID while retaining `persona`; sections use normal anchors. Browser Back and Forward restore the view and prior scroll position. Entering a detail view focuses its main heading, and its prominent “Back to your week” or “Back to league” returns to the initiating section/trigger. There is no modal focus trap or internal scrolling pane.

- Reaves’ primary sequence: review the visible five-player sample → inspect Damian Lillard’s sample → Back to the evidence section → inspect Ware’s public context → return to the opponent spread.
- NeuralNets’ primary sequence: inspect six missing quotes → read the complete 22-player quote list, with Unpriced rows explicit → inspect AJ Dybantsa’s supplied identity and absent quote/evidence → Back to quote coverage → review the three available completed-week samples.
- Guest’s primary sequence: inspect any one of five league pairings → follow a named club to public team context → Back to that pairing → use the ten-club index or labelled real sign-in exit.

Own-team quote inspection can offer a real labelled name search, result count, and “All / Priced / Unpriced” native select. Reaves defaults to all 24; NeuralNets defaults to six unpriced with a clear route to all 22. Unknown values sort/group explicitly; they are never zero. This deeper list is an appropriate local inspection destination, not the homepage’s organizing scaffold.

Guest/local public team views read only league/team/matchup/history fields. They do not read member-only persona summaries. Player inspection is limited to the selected member example’s supplied players; an unsupported ID returns a readable “Not included in this sample” state and useful Back links. No query value establishes real membership. No form suggests that a lineup, trade, login, notification, or roster change was saved.

“Synthetic demo” is visible beside the persona control on every view. A native “About these sources” disclosure explains the fixed 30 October 2026 08:30 UTC scenario, synthetic quantities, authorized project identities/assets, missing opponent player data, and absence of live connections. The page contains no live clock or refresh promise.

## Sources actually read and their structural effects

### Assigned primary references

1. [pbakaus, adapt](https://www.ui-skills.com/skills/pbakaus/adapt) — read the substantive skill and inline reference sections, lines 21–319: Assess Adaptation Challenge; Plan Adaptation Strategy; Desktop Adaptation; Implement Adaptations; Verify Adaptations; Responsive Design. Did not install it, run scripts, or read the unrelated index/footer links. Applied its context-led planning to desk use at 1440/1120px: keep the section index and several useful facts visible, reflow the lead actions when names need space, and keep content independent of hover. Content-driven reflow replaces shrinking. Desktop-only scope comes from this author brief; no phone checks are claimed.
2. [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design) — read all essay prose, lines 1–145, including Metaphors, Spatial Consistency, Frequency & Novelty, Scroll Landmarks, Fitts’s Law, and Scrolling. The embedded motion/gesture demos were not physically exercised. Spatial consistency changed detail navigation: a dossier has a stable originating section and a deliberate return path. Frequency & Novelty changed interaction timing: inspection and Back respond immediately without repeated entrance flourishes. Scroll Landmarks supports the persistent section index and restored reading position. Fitts’s Law supports nearby, explicit 44px actions instead of tiny linked scores. No custom gestures, kinetic scene, or novelty animation is necessary.

### Actual product and local data

- `src/app/page.tsx` — read the complete page: server-resolved member state, request-private personal projection, common surface, and member-only history inputs. Effect: the prototype persona control is explicitly synthetic; it cannot become an authorization pattern.
- `src/surfaces/season-hub/CourtsideHome.tsx` — read the complete current composition and no-edition path. Effect: broad league access and tools remain useful independently of editorial or member evidence. The QA architecture does not inherit the production court/desk/section order.
- `src/domain/personalized-home.ts` and `src/data/home-viewer.ts` — read completely. Effect: keep score, modeled value, current identity, saved estimate, and membership status separate; no guessed private team.
- `src/ui/siteDestinations.ts` and `PRODUCT-INVENTORY.md` — read completely. Effect: all fifteen fixture destinations remain deliberately discoverable, with local inspection and real-site exits clearly differentiated.
- `fixture.json` — read all 1,174 lines, including both complete member rosters, guest, five pairings, changes, history, assets, and limits. Read the fixture module’s export declaration; it is data only. A local arithmetic check confirmed 24/24 quotes totaling 1,095.25 and 16/22 quotes totaling 1,622.00, plus five and three available player samples. No live API was used. Effect: the different priorities and missing-data behavior above come directly from the data rather than two cosmetic editions.
- `AGENTS.md`; `ARCHITECTURE.md` homepage/personalization, recorded-value, contract, cache, account, roster-value, and player-guide sections; and relevant `DESIGN.md` identity, readable data, navigation, and control guidance. Effect: preserve data/access/ownership boundaries, explicit periods and provenance, named inspection actions, and source honesty. Production palette, font system, primitives, and fixed composition are explicitly not imposed on this isolated QA design by the author brief.
- `qa/homepage-structures/assets/fonts/catalog.json` — read existing approved families and license/provenance entries. `fc-list` confirmed DejaVu Sans is installed; it emitted a cache-directory warning but returned the font list. No font bytes, scripts, or dependencies were downloaded.
- Attempted to open the public `https://goathoopers.com/` through the web tool; it returned inaccessible/internal error. Actual product inspection therefore uses the authorized production source above, not a claimed live visual review. Both assigned primary references opened successfully, so no alternative reference was needed.

## Build handoff and limits

Only `qa/homepage-personal-20/19/PLAN.md` is created in this phase. No peers or prior prototype implementations were opened. No live API, auth, database, market, AI generation, storage, mutation, external messages, or publication was performed. No browser/device/visual acceptance is claimed.

On an explicit build followup, implement only this concept’s HTML/CSS/JS and NOTES in directory 19. Reuse the shared data module only, approved local font/assets only, and set `personalStudyReady` to `19` after settled content/fonts. `?stage=structure` will remove color/image emphasis while retaining the same content, geometry, and actions. Necessary checks are the three complete persona pages, main local detail/Back paths, long-name reflow at 1440/1120px, keyboard focus, enlarged text, and exact missing-value semantics. Root owns final captures and wider review.
