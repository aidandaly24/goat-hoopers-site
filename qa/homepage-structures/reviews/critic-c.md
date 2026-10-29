Independent structural review C — frozen grayscale first versions

Reviewed all 63 pairs in assignment-3.json: 27 D, 12 R, 24 N, 0 U. The counts describe this assignment only. They do not establish a statistical diversity score or a shortlist. Every N pair requires a structural rework before both members can advance together. The exact pair-by-pair reasons and required changes are in pairs-c.json.

I authored none of these studies. I read AGENTS.md, ARCHITECTURE.md, reviews/PROTOCOL.md and assignment-3.json. I judged the actual opening pixels before consulting implementation behavior and the inventory. I did not read another critic’s findings, the allocation, author explanations or STRUCTURE.md prose. Studies 17–20 were inspected only after the parent’s explicit source-freeze notices. All twenty source sets match first-source-freeze.json; the corresponding captures.json source hashes also match the files inspected. No original study, shared file, production code, Git state or external service was changed by this review. The only written deliverables are this report and pairs-c.json.

The dominant rejection is a repeated architecture: choose a category or entity, then read one conventional active matchup/roster/editorial document. A court, a clubhouse, a portrait strip, chapter spines, task labels or branch connectors do not by themselves change that architecture. I credited actual differences such as simultaneous comparison fields, multiple independently open answers, retained parallel reading positions, a temporal grid, or a semantic cross-team sheet. A vertically stacked phone layout is not automatically a duplicate when the comparison, time or row relationship and its controls survive.

Evidence was inspected at qa/homepage-structures/evidence/wireframes/<ID>/. In the table, each stem refers to both member-desktop-<stem> and member-phone-<stem>. “Native” means the exact -viewport.jpg file; “full” means the corresponding .jpg whole active document. Desktop is 1440×1000; phone is 390×844. Native frames were used to judge legibility and real viewport occupancy; tall full images were used to trace the complete active document. Neither a contact sheet nor a flattened CSS representation was used as the basis for acceptance.

| ID | Inspected image stems and complete reading evidence | Observed architecture |
| --- | --- | --- |
| 01 | 00-default and 02-roster, native + full | One continuous spread; major sections remain in flow; roster/search disclosures change that flow. |
| 02 | 00-matchup and 01-roster, native + full | Six court positions select one notes reader; court persists beside it on desktop and above it on phone. |
| 03 | 00-default and 01-team native; matching pane-0.jpg strips for both states/devices | One bounded horizontal chapter, bottom previous/next navigation and inner vertical reading. |
| 04 | 00-matchup native + full; 01-team full | Source rail, one replacement program and persistent score rail; phone source select plus game strip. |
| 05 | 00-default and 02-roster, native + full | One continuous typographic document; anchors, value disclosure and name filtering remain in flow. |
| 06 | 00-default and 03-week2, native + full | Source-dated chronology, genuinely filtered by scope and source period. |
| 07 | 00-room and 02-locker, native + full | Spatial landing menu disappears when a station opens; rail + one station reader replaces it. |
| 08 | 00-comparison and 01-rosters, native + full | Two teams organized around shared metric bands; phone preserves both score identities and changes the reading side. |
| 09 | 00-archive-40 and 04-team, native + full | Fixed route selector beside a replacement reader; phone route above reader. |
| 10 | 00-matchup native + full; 02-roster full | Task rail and one scrolling task document; phone task select. |
| 11 | 00-default native; 01-week native + full | Searchable mixed task/team/player index with multiple independent inline answers. |
| 12 | 00-default and 01-team, native + full | Persistent team/game orbit with a single changing detail shelf; radial overview survives phone. |
| 13 | 00-week native; 01-club native + full; 06-closed native | Exclusive full-chapter accordion among retained folded spines; all chapters can close. |
| 14 | 00-default and 04-culture native; interior strips specified below | Four independent reading channels on desktop; retained-position channel switching on phone. |
| 15 | 00-default and 02-edition, native + full | Week-by-lane calendar with explicit source gaps and agendas inserted at the selected lane; phone agenda/calendar transformation. |
| 16 | 00-bench native; 02-roster and 06-dispatch native + full | One selected franchise dossier on a portrait bench; shared league content leaves for a separate rail + reader. |
| 17 | 00-default and 02-roster, native + full | Semantic cross-team sheet; roster opens as a subrow; phone field selection preserves the row relationship. |
| 18 | 00-week and 02-team, native + full | Actual continuous document with scroll-synchronized sticky chapter stage; phone sticky summary/select. |
| 19 | 00-index native; 01-own-dossier and 05-edition native + full | Alphabetic franchise index, one inserted tabbed dossier, then a separate shared notebook. |
| 20 | 00-home native; 01-players and 02-form native + full | Question selectors replace a current-step document; origin and parent/breadcrumb summaries remain. |

For genuine interior reading, I read 03/panes.json and inspected member-desktop-00-default-pane-0.jpg, member-phone-00-default-pane-0.jpg, member-desktop-01-team-pane-0.jpg and member-phone-01-team-pane-0.jpg. These expose the full active chapter contents beyond the bounded screenshot. I read 14/panes.json and inspected member-desktop-00-default-pane-0.jpg through -pane-2.jpg, member-phone-00-default-pane-0.jpg, member-desktop-04-culture-pane-3.jpg and member-phone-04-culture-pane-0.jpg. Together those desktop strips cover all four channels, while phone strips show the selected-channel reading transformation. These are documented element-scroll reading strips, not a claim that all content occupies one viewport. The available panes manifests for 10, 13 and 15–20 contain zero strips. Other ordinary-flow documents were inspected through full active-document images.

All live pages were exercised at http://127.0.0.1:4207/qa/homepage-structures/wireframes/<ID>/index.html?view=member with reduced motion, at both review viewport sizes. The following are actual pointer/typing and keyboard actions, independently of the screenshot state API:

| ID | Working live states exercised on desktop and phone |
| --- | --- |
| 01 | Enter on “Unfold all 24 modeled roster values”; type Embiid in #directory-search. The matching team’s roster opens in the existing spread. |
| 02 | Click Your roster value; Enter on All 24 roster values; keyboard Back to court; Enter on The weekly edition. Focus reaches #notes-title, “The next chapter.” |
| 03 | Click My club on desktop / select team in #chapter-select on phone; Enter #next to Scoutbook and League index. Additionally clicked all ten directory team buttons and reached every roster. |
| 04 | Click My team / choose team in #source-picker; keyboard-select the second game from the score rail on desktop. Phone Home/Enter in #source-picker returns the Week 3 program. The actual program changes and receives focus. |
| 05 | Enter on Unfold all 24 player values; type Embiid in #name-search. The disclosure and team-name field work within the long document. |
| 06 | Click My team scope; choose completed Week 2; Enter Reset log restores the eleven-entry chronology. These filters change the actual entry set. |
| 07 | Click locker; Enter Press room in station navigation; Escape restores the room and the originating locker button. |
| 08 | Click Players & value; ArrowDown/Enter selects the next pairing. Desktop Enter selects Form & wire; phone Enter selects Opponent side. The pair and side actually change. |
| 09 | Click the team branch; Enter Read selected stop focuses/scrolls #reader-title; choose picks and Enter the reader button to reach “Five saved decisions.” |
| 10 | Click/select roster task; Enter Inspect all 24 roster values. Hash becomes #roster and the roster reader disclosure opens. |
| 11 | Click week then Enter roster; two inline answers remain open simultaneously. Type Embiid, submit with Enter, and Enter the player result; #trigger-player-1511 becomes the open answer trigger. |
| 12 | Click team 8 in the orbit: the selected connection becomes game 4. Enter the saved-picks control: the detail shelf changes while the orbit remains. |
| 13 | Click club spine, then Enter league spine; type Embiid. Week folds, the selected chapter changes and the directory filters in that chapter. |
| 14 | Click the current-pair crosslink targeting ai-0; wheel the league pane; Enter Culture then League. Scroll position stays 982→982 desktop and 974→974 phone. All four channels remain present desktop; only League is displayed phone. |
| 15 | Click current matchup event and read attached agenda; Escape closes it and restores event focus. Select the October edition period and Enter its event to open the dated editorial agenda. |
| 16 | Click franchise 5 / choose it in #team-index; Enter Next reaches franchise 6; Enter Roster changes the dossier tab; click the league-directory control to replace the bench with #reader/directory. |
| 17 | Click roster subrow; Enter Your brief; type Embiid to narrow the sheet. Additionally clicked each of the ten roster buttons and reached every roster. |
| 18 | Click/select Team chapter; typing Embiid reaches the league section and filters its directory. Desktop Enter on archive anchor, and phone End/Enter in #chapter-jump, reach the archive and update the sticky stage. |
| 19 | Click franchise 1; Enter Roster tab; Escape closes dossier; type Lillard to find a franchise and roster hit. Additionally clicked all ten franchises and their roster tabs. |
| 20 | Click Players; Enter Form; Enter Back. The parent path is shown, and Back restores the prior “Which players should I look at?” choice focus on both devices. |

Several failed initial harness selectors were corrected by inspecting the actual DOM and rerunning the real control. They were not reported as product failures. Final working checks above succeeded. I also inspected behavior code after the first pixel judgment in 07/stage.js, 08/study.js, 09/app.js, 11/app.js, 12/app.js, 14/app.js, 15/app.js, 16/app.js, 18/story.js, 19/app.js and 20/matchbook.js; 05/poster.js was consulted for the value-rank contradiction below. The live targets are the actual index.html files in wireframes/01 through wireframes/20.

The rejected pairs are:

02–04, 02–07, 02–10, 02–13, 02–16, 02–19; 03–20; 04–07, 04–10, 04–13, 04–16, 04–19; 07–10, 07–13, 07–16, 07–19; 09–20; 10–13, 10–16, 10–19; 12–20; 13–16, 13–19; 16–19.

The concrete rework requirements in the JSON can be executed as the following structural changes to at least one member of each rejected pair. These are review requirements, not edits to the preserved first sources:

- 02: Court locations need to carry and reveal independently usable matchup/roster evidence at their actual positions. A map of six links feeding a universal notes column is insufficient.
- 07: Keep working evidence in persistent room stations, including the phone model. The room cannot merely be a pre-menu that disappears into a rail + reader.
- 10: Retain selected matchup and roster evidence together while moving through task steps. Numbered static reading sections on replacement pages do not create a task architecture.
- 13: Permit multiple substantive spreads to remain unfolded and related. Replacing exclusive reader selection with another exclusive spine selector does not resolve the rejection.
- 16: Retain more than one franchise dossier and the relevant comparison context on the bench. Move shared league facts into that contextual structure instead of funneling them to a separate universal reader.
- 19: Make the franchise field support retained comparison fields and attached evidence across several franchises. Alphabetic name/portrait navigation into one dossier plus a generic notebook repeats the same architecture.
- 20: Retain substantive evidence from chosen branches as inspectable connected or cumulative nodes. Breadcrumbs and short parent summaries around one replacement reading document do not make the evidence itself a branching structure.

For 02–04, rework 02’s actual evidence model. For 04–10, rework 10’s retained task workspace. For pairs involving 07, 13, 16, 19 or 20, the relevant change above is specified in the corresponding JSON reason. Completing a cosmetic or control-position change does not satisfy these requirements. Reworks need new versions and a fresh audit of the changed pair relationships.

I credited the following concrete differences without choosing favorites: 08’s linked two-sided comparison survives as two score identities plus a side switch on phone; 11 actually keeps multiple query answers open; 14 preserves independent reading positions and crosslinks; 15 inserts an agenda into a temporal lane grid and transforms to a period agenda on phone; 17 preserves semantic cross-team fields and subrows rather than making every item a generic dashboard card. The R verdicts name a shared family and a tested substantive difference; they do not claim those studies are wholly unrelated.

After the pixel pass I consulted inventory.json, data.js and rendered state inventory. A browser union across all advertised member states, with existing details expanded for inventory inspection, found the 0.0/Pending distinction, $1095.25 current value, all three dated spotlight headlines, recorded-value-history gap and Lineup Power gap in all twenty studies. It found all 228 expected player references directly in seventeen. The initial union missed dynamic roster selections in 03, 17 and 19; I resolved that by actual pointer traversal through all ten roster selections in each, recovering all 228 references. This supports reachable roster inventory; it does not certify every sentence, destination or every individual stat in every state. It did not uncover a missing player roster that could justify an unusual overview omitting that content.

Specific content and usability findings remain independent of the N judgments:

- 03, confirmed live phone containment defect: select League index, click Standings, then select Edition. At innerWidth 390, the member document scrollWidth becomes 1187; public becomes 407. captures.json records the same problem in standings/edition/archive/tools states. Off-screen chapter/table content leaks into root document bounds. Confine hidden/transformed chapters and their table headers so later chapters do not produce horizontal document scrolling. I exercised this same sequence in both member and public live views.
- 10, visible native desktop and phone legibility defect: the matchup score column splits “Pending” across lines (“Pendi”/“ng” desktop and similar phone breaks). Keep the unknown-score status readable as a single status rather than imposing a too-narrow score measure. This does not establish an architectural difference.
- 05, supplied information contradicted: 02-roster says “League value rank unavailable: full pricing coverage for all ten compared rosters is not supplied.” inventory.member.personal.summary.valuation.rank explicitly supplies rank 2 of 10, tied false. 05/poster.js line 51 hardcodes the unavailable statement. Preserve the supplied rank with its modeled-value label, or explicitly explain a reviewed decision to withhold it; the current statement silently discards a supplied fact. This is a content correction distinct from pair diversity.
- 01/05/18 full phone documents are extremely long. Their anchors/jump controls and tested disclosures keep content reachable, but their length is a practical reading cost. Long flow alone neither establishes diversity nor warrants replacing necessary information with a generic drawer.

Limits: this is a grayscale structural gate using the frozen local synthetic fixture, primarily the member editions. Native desktop/phone member states and real interactions were inspected for every study; the public view additionally received the targeted 03 containment reproduction. I did not visually audit every public screenshot, each of the hundreds of captured variants, all stale/missing-AI permutations, a screen reader, physical touch hardware, production routes, authentication, live data, final color/art/motion or browser zoom extremes. DOM inventory inspection and a state API are supporting reachability evidence, not substitutes for the pointer/keyboard actions above. The 63 assigned structural decisions are complete; these limits are not blanket functional/content acceptance or release authorization. The identified N pairs remain blocked for structural advancement together.
