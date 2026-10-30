# Concept 05 — Your week, with the evidence in reach

Discovery only. Independently authored on 2026-10-30. No presentation code has been written. Build waits for the root followup after the early three-site review.

## Product decision

Make GOAT a place to return to a specific team task, then stay to understand the league. The homepage is an open working page with persistent desktop navigation, a compact personal opening, readable player rows and a visible league section. It should feel like a basketball league with a useful website, rather than a poster or a collection of product metrics.

The initial viewport answers three questions: Which team am I looking at? What is the most useful thing to inspect now? What does the available evidence actually support? Useful supporting facts appear beside that task. Full roster rows, pairings and standings continue in ordinary page flow; the primary page is never an internal scrolling panel.

The obvious default rejected: an identical large matchup hero for every visitor, followed by three interchangeable metric cards and tabs hiding the real roster. NeuralNets' missing score makes that ordering especially poor. This concept changes both the lead task and roster ordering when the underlying situation changes.

## Three complete editions

### Reaves Dropper — inspect the game, then its evidence

The opening identifies Reaves Dropper, aidandaly20, current synthetic 2–0 record and first place. Week 3 is immediately visible: Reaves 184.5 against Ware the Hoes At? 171. The numerical difference may be stated as a current 13.5-point margin, with the synthetic in-progress state immediately adjacent; it is never a final result.

The primary action is **Inspect matchup**. Beside the pairing, two dated change rows explain that five completed-week player rows are available and all 24 modeled quotes are present. Their actions move directly to the relevant visible section. No relative live clock or new alert service is implied.

The next section is **Your roster evidence**. Its first rows are the five fixture players with completed Week 2 evidence, retaining fixture order. Every roster player remains visible in the same semantic table. Columns show player/position, current modeled FAAB quote, completed Week 2 points or **Evidence unavailable**, and an explicit **Inspect** control. No player with unknown participation is described as having a rough week. The evidence heading prints the sample: five of 24 players, synthetic completed Week 2, October 19–25 inclusive.

The roster heading's supporting value line is 1,095.25 modeled FAAB, 24/24 quoted, checked October 30 at 08:10 UTC. The fixture's supplied value rank can be labeled “Demo modeled value rank: 2”; it is secondary to the coverage and is never inferred by comparing the two demo personas. A compact note explains that modeled FAAB is a valuation unit, not account money. No trend chart appears because no series exists.

Saved model context sits with the matchup: Reaves 56%, opponent 44%, saved October 26, explicitly a synthetic estimate rather than calibrated odds. A readable source disclosure retains confidence 0.35 as a separate field. It never turns 56% into model confidence, claims current generation, or connects the probability to the current score as if it were recalculated.

### NeuralNets — inspect missing coverage first

The opening identifies NeuralNets, its current synthetic 0–2 record and tenth place. It leads with **Six player quotes are missing** and the six actual unpriced names: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. They are a compact readable list with individual inspection controls, not six giant cards.

The primary action is **Review unpriced players**, an ordinary anchor to the full roster's six unpriced rows. The table defaults to those six first, followed by the priced players in fixture order. Its heading explains this ordering. A visible native order select can choose Fixture order, Evidence available first, or Unpriced first; the result count and active ordering are visible, and changing order never removes data.

The adjacent matchup section shows papichooter **0** and NeuralNets **Score unavailable**. It explains that zero is recorded for papichooter and NeuralNets' score is absent. There is no leader, margin, score progress fill, winning color or forecast. **Inspect matchup evidence** opens the local source view. Saved model output is plainly unavailable; there is no empty probability chart or Generate button.

The roster value is a **1,622.00 modeled FAAB subtotal**, covering 16/22 players. The six missing quotes prevent a complete total or value rank. The three completed Week 2 evidence rows are still useful and remain visible in the full table, with their own 3/22 sample. Quote coverage and completed-week evidence coverage are independent, named quantities. Previous-season history, when opened, always says “2025, under the previous manager as QBs Gremlins”; current identity never inherits that record without the qualification.

### Guest — understand the league and enter the real account site

The guest's opening is **GOAT Hoopers, Week 3**. Five public pairing rows and a compact season explanation take the lead. The first two complete pairing rows, partial-score notice and entry to the standings should be visible near the opening without a membership claim. The public table below contains all ten teams, current records and points for, with explicit names and rank labels.

Guest has no “your team,” personal change feed, private roster summary or saved personal model block. **Inspect a matchup** is the primary local flow. **Sign in on GOAT** is a clear secondary link to the existing account site, visibly labeled as leaving the prototype. Team inspection uses public identity/current standing/qualified previous-season objects only; it does not invent rosters for the eight teams lacking roster data in this fixture.

## Website architecture

### Desktop frame and navigation

A roughly 200px dark ink navigation rail holds the exact white horizontal GOAT logo, “2026 season / Week 3,” and the current location **Home**. Below it, a short local section index uses real anchors: This week, Roster evidence (members), League matchups, Standings and Explore GOAT. These are page sections, clearly distinct from production destinations. The demo persona select is visibly labeled **Demo persona** and offers Reaves, NeuralNets and Guest. It updates `?persona=`, defaults to Reaves and sets `document.documentElement.dataset.persona`.

The main document has a restrained maximum width, ordinary vertical scrolling and generous space for long names. A small utility line carries **Synthetic demo**, the fixed October 30 08:30 UTC scenario time and **About these sources**. The heading is a normal team/page title at approximately 38px, not a full-screen headline. The palette uses near-white reading surfaces, dark blue-green navigation, quiet gray rules and a restrained warm accent for the current action. Unavailable states use text as well as visual treatment.

### Main sections in normal flow

1. **Personal/public opening:** compact identity plus the persona's primary task; a second column contains the supporting change or matchup context. Reaves leads with the game; NeuralNets leads with coverage; guest leads with all public pairings.
2. **Roster evidence** for members: complete 24- or 22-row table, inline coverage/value explanation, visible order control, and local player inspection. The roster is content, not a collapsed gate. For guest, the full public standings occupies this prominent position instead.
3. **League matchups:** all five current synthetic pairs with their state and readable scores. The member pairing is text-labeled “Your matchup,” without changing the fixture's league order. Guest already sees this section near the opening and it is not duplicated lower down.
4. **Standings:** all ten rows, with rank, team, manager, record and points for. Member and opponent markers are explicit words. Rows keep source order. No value rankings are inferred from standings, and no playoff odds are manufactured from the six-team playoff threshold.
5. **Explore GOAT:** a short, useful continuation into league tools, archive and play. A small existing free-throw preview may accompany Arcade; it should not become a second hero. Current News and Transactions are destination links, not fabricated feeds. A short historical line may link to the retained 2025 final with its year and actual fixture figures; it is not current news or a champion showcase.

### Semantic footer and destination coverage

The footer has its own heading/landmark and a visible explanation: **Current GOAT site — these links leave the prototype**. It groups real destinations into League (Teams, Transactions, Draft, Intel, The Table), Tools (Stocks, AI Decides, Trade Analyzer), Read and play (News, History, Weekly archive, Arcade), and Account (My Team, Sign in). Home is available in the rail, with an explicit current-site Home link in the footer. Every fixture destination stays discoverable, but only local sections occupy the main navigation.

Production exits use the existing `https://goathoopers.com` paths and an accessible label that also identifies the exit. Local player/team inspection is distinct from **Open player on GOAT** or **Open team on GOAT**. The footer repeats the short synthetic data qualification and links to the local source explanation; it does not make privacy, login or backend claims.

## Typography and density

The plan deliberately uses four roles, including two system families, rather than applying one fashionable sans face everywhere.

- **Reading:** Georgia, 17px/1.55, normal mixed case, regular weight, about 60–65 characters per line. Explanations, changes and source paragraphs use its familiar reading rhythm. Long-form source text does not use condensed display type.
- **Display:** the already licensed local Barlow Condensed Regular, about 38px/1.08 for the page title and 27–29px for major headings, regular weight with no synthetic bold. It provides a compact sports identity while keeping team names as text. A title can wrap; it never scales down to preserve one line.
- **Controls and identity rows:** Arial/Helvetica system sans, 14–15px for labeled controls and 16px/1.35 for player/team names. Controls use 600 or 700 weight where the system provides it. Table rows have roughly 44–48px minimum height and grow naturally for “Giannis Antetokounmpo,” “Stephon Castle’s Back,” or “Kristaps Porziņģis.” No forced truncation removes the name.
- **Data:** existing local IBM Plex Mono Regular, 14px/1.4 for values, dates, records and samples; tabular numerals and aligned decimal columns support scanning. Large scores use the same numeric family at roughly 42px. Labels and explanations remain proportional. Missing values use the words “Unavailable” or “Unpriced,” never a numeric zero.

Only Barlow Condensed and IBM Plex Mono need local font files; their existing OFL notices stay in place. No download, font installation or dependency is needed. At 1120px, the rail narrows modestly and the supporting opening column moves below the lead task if its content requires it. The page still shows the same sections and reading sizes. At enlarged text sizes, cells and headings wrap and the document grows; no font shrink or fixed-height clipping is permitted. This assignment is desktop-first, and no phone design/capture is being claimed.

## Primary local action flows

**Reaves:** Inspect matchup → native named dialog with both team identities, current synthetic scores, state, fixed source time and the saved model fields → Close/Escape returns focus to the trigger. From the roster, Inspect Damian Lillard → player dialog containing the actual quote, quoted coverage, completed Week 2 points/period/sample, participation status and source qualification. There are no invented game logs, per-game counts, factor explanations or injury statuses.

**NeuralNets:** Review unpriced players → anchored full roster table showing all six missing-quote rows first → Inspect AJ Dybantsa → dialog states “Unpriced” and “Completed-week evidence unavailable” separately, with the existing portrait only if useful. The 16/22 coverage and modeled subtotal remain visible in the document. The matchup inspector explains zero versus absent without drawing a lead.

**Guest:** Inspect a pairing → local matchup dialog from the public fixture; inspect a team name → local public team summary and a separately labeled real-site exit. Sign in remains ordinary navigation to the existing site and never opens a fake login form.

All inspectors will use native `dialog`, a visible Close button, sensible initial focus, Escape behavior and focus restoration. Selection is represented by an ordinary fragment/history entry so Back and Forward restore the local inspection state; a direct fragment gets a stable return target. Primary content is already readable outside the dialog. Links navigate; buttons operate inspectors; native selects expose ordering and persona labels. The prototype has no save, trade submission, notification, retry-fetch or generation action.

## References actually read and their concrete effects

Both assigned pages opened successfully through the web tool on 2026-10-30. These are source readings for principles, not invocations of their installation or scripting workflows. No index or peer prototype was used.

- [Hallmark — redesign.md](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md): read the full rendered document body, from **Redesign** through **After**, including **What a redesign keeps**, **Depth**, **Before**, **The plan** and **Build**. The useful principles were retaining real content, wiring and chosen brand while recomposing priority, and treating app screens as useful working arrangements. This led to a deliberate route inventory, the exact logo, explicit local-versus-production actions and a compact task opening. It did not supply a palette, typeface or component template. Its broader redesign procedure is outside this isolated QA scope.
- [UI Skills / pbakaus — adapt](https://www.ui-skills.com/skills/pbakaus/adapt): read **Assess Adaptation Challenge**, **Desktop Adaptation**, **Implement Adaptations**, **Verify Adaptations**, and the responsive reference's **Breakpoints: Content-Driven**, **Detect Input Method** and testing discussion. This led to persistent desktop navigation, simultaneous task/supporting facts, a restrained maximum width, visible table data, content-driven reflow at the two requested desktop widths, and controls that work without hover. Its phone-specific patterns are not this assignment's direction. A screenshot verifies geometry, not keyboard or gesture behavior; later check reports will keep that distinction.

## Contract and fixture discovery completed

Read the repository AGENTS, ARCHITECTURE homepage/personalization and data/surface contracts, relevant DESIGN product/accessibility guidance, AUTHOR-BRIEF and PRODUCT-INVENTORY. Read the actual `src/app/page.tsx`, `CourtsideHome.tsx`, `domain/personalized-home.ts`, `data/home-viewer.ts` and `ui/siteDestinations.ts`. Read the full shared JSON fixture, verified its JS data-only export and inspected the approved font catalog and asset filenames. No peer directory or prior prototype implementation was inspected.

Production resolves membership server-side with request-private data and gracefully retains public access. This demo's query selector is visibly synthetic and is never described as production membership. The fixture has no recorded value history, Lineup Power producer, transaction list or present news article set, so those cannot become invented widgets. The provided modeled subtotals were checked against the player quote sums: Reaves 24/24 = 1,095.25; NeuralNets 16/22 = 1,622.00. Evidence counts match five and three players respectively.

Build followup deliverables will be this directory's own HTML, CSS, JS and NOTES, importing only the shared data fixture. Structure stage will neutralize color/media without changing content or geometry. Readiness will be set only after fonts and content settle. Useful local verification will cover the three personas, requested desktop widths, keyboard inspection/close/Back, missing score/quote behavior and destination coverage. No application test/build is needed for this discovery-only Markdown change, and none is claimed.

Discovery is complete; implementation is pending the root build followup. There are no discovery blockers.
