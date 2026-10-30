# 20 — A week in context

Discovery only. No presentation code has been written. Author owns only this directory and is awaiting the coordinator's build followup.

## Independent discovery question and answer

**Underexplored returning-member need: keep the time and scope of evidence intact while deciding what to inspect next.**

The actual product supports several useful but different readings of a team: a current matchup, completed-week player points, a current modeled roster quote, and an earlier saved estimate. `CourtsideHome` currently spreads these across the team desk, valuation, scouting notebook, form guide and AI sections inside an edition. A returning member has to reconstruct which period each fact describes. The fixture makes the distinction consequential: Reaves has five verified Week 2 player totals, a Week 3 score, all 24 current quotes and an October 26 saved estimate. NeuralNets has three verified Week 2 totals, an absent Week 3 score, six absent current quotes and no estimate.

The proposed homepage organizes the work by **this scoring week / the last completed week / today's roster quote**, with the period and applicability printed at the point of use. It gives named people and useful actions within those sections. It is a complete website with public league access and tools, rather than a visual explainer about data quality. The primary task is to open the evidence relevant to the member's next question without treating an old result, a model price and a current score as interchangeable.

This improves on an obvious metric summary because it connects each metric to its appropriate question and evidence. A roster-first table makes unavailable performance look like a sea of blanks and pushes the actual opponent away. A weekly editorial treatment asks the member to read through a story before doing their own work. This website lets the member start working in the first fold and read the club context afterward.

## Three independent architecture sketches

1. **Recent changes queue.** Two dated sample updates lead, then target sections, then a club directory and tool links. This is a coherent information architecture and makes changes actionable. Rejected as the main spine: the fixture has no last-visit state, and a chronological feed would give missing-data notices disproportionate editorial importance. The useful part survives as two modest dated links alongside the current-week section, labelled “Latest sample updates,” never “unread” or “since your visit.”
2. **Position-based roster workspace.** Point guard, wing and big groups pair current quote coverage with player evidence, followed by a matchup and league area. Rejected: position does not explain the fixture's participation or quote gaps, and the homepage would devote most of its space to 24 or 22 player entries before answering who the team faces. A local full-roster inspection still serves deliberate roster work.
3. **A week in context — selected.** A top-level current-week workspace, then a substantial completed-week review, then a separately dated quote inspection area. Club context and actual site destinations finish the page. Each area has its own useful reading mode: matchup comparison, named player evidence list and quote-coverage roster excerpt. The layout changes emphasis for each member rather than filling the same boxes with different names. This provides the strongest path from question to evidence while keeping the whole homepage open in normal flow.

## Site architecture

### Header and page identity

- Preserve the exact horizontal GOAT logo, with no redrawing or added typography inside the asset. Use the black approved variant on the chosen light canvas.
- A compact two-line masthead carries the logo, Home with `aria-current="page"`, League, Tools and the actual-site My Team or Sign in exit. League and Tools are ordinary links to their visible down-page sections, not menus concealing the page's substantive content.
- A separate native select is explicitly labelled **Demo persona**: Reaves Dropper / NeuralNets / Guest. It changes the `persona` query and sets `document.documentElement.dataset.persona`; it makes no membership claim. Preserve `stage=structure` when switching.
- One visible “Synthetic demo” label links to an accessible source explanation. The fixed sample timestamp is “30 Oct 2026, 08:30 UTC,” with no ticking clock or live dot.
- Page introduction is a useful team heading, manager and current record/standing. Its height follows the text. It is not a promotional hero.

### Reaves member homepage

1. **This week, Week 3.** An open, asymmetric two-column workspace. The larger area names Reaves Dropper and Ware the Hoes At?, both managers and current season records, then prints **184.5 / 171 current sample points** and the derived 13.5-point lead with “In progress, synthetic sample.” A team inspection link is attached to each identity. The smaller area contains the two dated sample updates and the single filled primary action, **Inspect completed-week evidence**, pointing to the next visible section. The saved model is a secondary, visibly dated text passage under the pairing: 56% / 44%, generated 26 Oct, confidence 0.35 as a separate field. It is not redrawn as a live win gauge or described as calibrated odds.
2. **What counted in completed Week 2.** The exact fixture period is visible: 19–25 Oct, synthetic completed Week 2. An ordered list displays all five verified players, with their actual totals: Damian Lillard 42.5, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5 and Derrick White 22. Player names and values are working inspection links, not portrait headlines. A quiet adjacent scope passage states **5 of 24 roster players have supplied evidence**; the other 19 are not classified as poor performers. The list order is descending supplied points with that basis named, not a league award. Each row can expand a readable local fact sheet; the meaningful totals and period remain visible before expansion.
3. **Roster quotes, checked 08:10 UTC.** Current modeled FAAB 1,095.25 with 24 / 24 priced. A short three-player excerpt shows Joel Embiid 137.50, Anthony Edwards 124.50 and Alperen Şengün 108.25, explicitly selected by highest current modeled quote. Quote links open the exact local quote facts. “Inspect all 24 quotes” opens the full local roster view. Copy explains that modeled FAAB is a price unit, not a cash balance; no league value rank or historical change is supplied. Recorded history has one quiet unavailable sentence rather than an empty chart-sized frame.
4. **The rest of Week 3.** All five current pairings remain visible, including the personal one marked “Your team.” A compact two-column ordered club directory gives all ten current ranks, identities, W–L and points for. Its heading names the synthetic 2026 standings. It is a secondary public context area, not a second giant personal summary. Club names work locally.
5. **Keep exploring GOAT.** Two open content blocks lead to actual Stocks / Trade Analyzer and Arcade destinations. Arcade uses the existing free-throw preview at a modest size with a clearly labelled actual-site link; it does not simulate a playable game. A small “Previous season” passage links to actual History and identifies the 2025 final as historical, with Josh Diddy’s Roster 326 and papichooter 251.5. It is not a champion showcase.

### NeuralNets member homepage

The page uses the same website identity and period vocabulary but changes the work order and action emphasis.

1. **This week, Week 3.** NeuralNets, manager NeuralNets, 0–2 and current rank 10 appear immediately. The large opening area is a compact quote-coverage inspection: **16 of 22 priced**, **1,622.00 modeled FAAB subtotal**, with all six missing player names already visible: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. The filled action is **Inspect six missing quotes**, opening their local detail view. This action cannot refresh, repair or invent a quote.
2. The companion current-week area names the correct opponent, papichooter. papichooter has a recorded **0**; NeuralNets reads **Score unavailable**. There is no margin, tied score or inferred leader. No saved estimate is supplied, so a small sentence replaces the model passage and there are no empty probability bars. The two dated sample updates point directly to the quote and matchup sections.
3. **What counted in completed Week 2.** The visible evidence section is affirmative and useful: Giannis Antetokounmpo 45, Kevin Durant 33.5 and Rudy Gobert 29.5, with the exact period and **3 of 22 have supplied evidence**. This is independent of the current score gap. The opening coverage section already does the quote work, so this page does not repeat a full valuation section afterward; a priced excerpt and “Inspect all 22 quotes” follow the evidence list with their own current-quote date.
4. Public Week 3 pairings, club directory, tools, game preview and previous-season passage remain substantial. Any local team inspection that prints NeuralNets' 2025 1–20 / tenth-place history must place “Under the previous manager as QBs Gremlins” directly beside it. The homepage does not attribute that record to the current manager.

### Guest homepage

No “your team,” member quote totals, private player evidence, private updates or saved member estimate. The public homepage remains useful rather than becoming a sign-in gate.

1. “GOAT Hoopers, Week 3” introduces the 10-team synthetic league and explains the public sample in one sentence. A clearly labelled **Sign in on GOAT ↗** actual-site exit is the primary action.
2. **The Week 3 slate** displays all five named pairings and current sample scores in normal flow, with unavailable versus recorded zero preserved. Each team opens a local public fact sheet.
3. **Meet the league** contains the full ten-team current directory with managers, synthetic rank, W–L and points for. This is complete public club context, not a private roster browser.
4. The previous-season final is separately dated 2025. Stocks and actual playable Arcade discovery have the same substantial tool entries. News, Transactions, Draft, Intel and The Table have clear described actual-site exits; no fixture changes are recast as real news or transactions.

### Navigation and semantic footer

The footer is a deliberate three-part section: GOAT identity and demo source notice; “League on GOAT” destinations; “Tools and account on GOAT” destinations. It names exits in visible text, not only an icon or tooltip. All supplied destinations remain discoverable:

- Local Home; local public club inspection from the visible directory.
- League exits: Teams `/teams`, The Table `/table`, News `/news`, Transactions `/transactions`, Draft `/draft`, Intel `/intel`, History `/history`, Weekly archive `/weekly`.
- Tools exits: Stocks `/stocks`, AI Decides `/ai-decides`, Trade Analyzer `/trade-analyzer`, Arcade `/arcade`.
- Account exits: My Team `/team` and Sign in `/login`, labelled as actual-site destinations. Direct player exits use `/player/:id`; public team exits use `/teams/:id`.

Actual-site URLs are explicit `https://goathoopers.com/...` links. A nearby sentence states that these leave the prototype. There are no invented legal routes or newsletter forms. A Back to top link targets the real masthead; a source explanation lists synthetic quantities, authorized identity references, historical qualifications and unsupported features.

## Composition, typography and identity

The page is a website with an open canvas, substantial content and consistent navigation. No ticket, jersey, poster or device metaphor. A restrained clay accent gives GOAT actions a stable identity; light mineral neutrals hold all normal reading sections. Exact palette values remain a build decision requiring measured contrast, not a discovery-stage claim. Color does not encode a team's lead or data availability without explicit words.

At 1440 CSS px, use an approximately 82rem maximum frame with generous outer gutters. The opening workspace uses roughly 7:5 columns; subsequent sections use a narrow period label column and a wide content column. This creates a recognizable rhythm without turning every fact into a card. At 1120 the frame is fluid, the opening columns rebalance and names wrap intrinsically. The primary opening content and at least the beginning of the next useful section should be visible in an ordinary desktop fold. Do not use a fixed viewport hero or enforce a fixed content height.

| Role | Deliberate choice | Scale, density and reason |
| --- | --- | --- |
| Reading copy | Verdana, Geneva, sans-serif system stack | 16px / 25.6px, regular; 52–60ch maximum prose measure. Its generous lowercase and wide counters support the explanatory period and coverage passages. Long paragraphs never use a display or condensed face. |
| Controls, names and navigation | Existing local Space Grotesk variable | 15px / 20px at 500 or 600 for controls; 17px / 24px player and team links. Names stay mixed case with natural wrapping. The controls have their own clear texture while matching the numeric work. |
| Data | Space Grotesk, proportional type with `tabular-nums` and lining figures | 18px / 24px for roster/evidence values, 28–32px current matchup totals. Labels and units remain next to values. Tabular figures align lists without imposing a monospace aesthetic or spreading long names. `tnum` and `lnum` exist in the local font's GSUB features. |
| Short display headings | Existing local Archivo Black regular | H1 approximately 36px / 42px, section headings 24px / 30px. Use only short headings, never body paragraphs or long data. No synthetic heavy weight. |
| Scope and dates | Verdana | 14px / 21px, in a measured secondary text color; critical missing/partial labels remain normal body size. |

Examples that must fit naturally: “Giannis Antetokounmpo,” “Kristaps Porziņģis,” “Stephon Castle’s Back,” “Ware the Hoes At?” and “Under the previous manager as QBs Gremlins.” No name truncation and no font-size reduction to force a fit. Text enlargement grows each section. Archivo Black and Space Grotesk are existing licensed local assets; preserve adjacent OFL notices and do not download replacements. No DM Sans, Georgia, Lora or IBM Plex numeric default.

## Local action flows

1. **Reaves evidence:** primary action moves to the already-visible Week 2 list; select Damian Lillard to expand the local fact sheet directly after the row. It shows 42.5 synthetic completed-week points, the exact period, verified-demo participation and the source limitation that no game-by-game receipt or played-game count is supplied. The separate current quote can be followed to quote inspection. Expansion has a real button with `aria-expanded` and an associated region. A Close details button returns focus to the originating player button.
2. **Neural coverage:** the six missing players are visible on the homepage; the primary action opens a local full-page roster inspection focused on the missing-quote group. All six read “Unpriced.” A separate priced group contains the 16 supplied quotes, and the page retains the 16 / 22 subtotal explanation. Native Back and an explicit “Back to NeuralNets home” restore the originating position and focus. No loading/retry animation implies a source refresh.
3. **Team inspection:** team links use a local hash route or ordinary local navigation with a proper page heading. Show current identity, manager, current standings facts, the relevant pairing and separately labelled previous-season facts. The two member sample rosters can be inspected only while using their member persona. Other teams and guest get the supplied public identity facts and an honest “Roster detail is not supplied in this public demo.” No borrowed roster or pretend opponent analysis.
4. **Quote inspection:** a local view prints name, position, current modeled FAAB or Unpriced, quote check date and coverage context. The unavailable recorded history is a compact line. It does not invent factor breakdowns, a chart or a quote movement. An actual-site player/Stocks exit remains secondary and visibly labelled.
5. **Source explanation:** a native disclosure is keyboard operable, while the compact synthetic label is always visible. Core sections do not depend on this disclosure being opened. Every inspection page has a Back link; focus is never stranded. Unknown hashes receive a useful local “Return home” state.

No mutations, login submission, notifications, AI generation, live API calls, polling, price recalculation or storage. Browser-local inspection state is the only interactive work. No service is simulated as successful.

## Evidence and scope before build

Actual source inspection covered `src/app/page.tsx`, all of `CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, `src/ui/siteDestinations.ts`, the author brief, product inventory and full data-only JSON fixture. Architecture reading covered the homepage/personalization, data ownership, surface/UI/page contracts, responsive and account sections. Relevant DESIGN.md source guidance covered unknown values, dated evidence, real navigation and the personalized edition; its prescribed palette, type, section order and production primitives do not constrain this explicit independent QA experiment. No old prototype or peer implementation was inspected.

The primary reference read log and specific applications are in [NOTES.md](NOTES.md). Both assigned pages opened successfully; no alternative was necessary. No source scripts were installed or run.

Build followup should verify the three persona pages at 1440 and 1120, text enlargement, keyboard flows and Back/close focus, all destinations, actual rendered contrast, zero versus null, 24 / 24 versus 16 / 22, and guest privacy. `?stage=structure` must preserve full content and geometry with neutral colors/images; set `data-personal-study-ready` through `dataset.personalStudyReady = "20"` only after content/fonts settle. These are proposed checks, not performed browser or device evidence. Discovery required no application build or tests.
