# Author 07 — Latest supplied changes

Discovery complete. This is an independent complete homepage proposal, not presentation code. Only this author directory is owned. Await the root build followup before implementing.

## Product answer

A returning manager needs a short route from a change to the evidence affected by it. The homepage should begin with a dated change list, put the current matchup alongside it as reference, and continue into the roster and league in ordinary document flow. Every change has a useful destination already visible farther down the same page. The page does not begin with a game hero or a large promotional sentence.

The fixture contains no last-visit timestamp, previous score, previous quote, previous standing, news articles or transactions. The honest title is **Latest supplied changes**, with a supplied-as-of time, rather than a claim to have calculated everything since this visitor's last visit. The source explanation says that the prototype does not track visits. No price delta, rank movement, lineup conclusion or league event is inferred. The league portion supplies current context, explicitly distinguished from the dated changes.

The rejected default is a large matchup followed by unrelated roster/value/standings boxes. Here, the two actual change entries determine the first actions and the ordering of the next section. Data coverage is part of the content hierarchy.

## The complete member home

1. **Site navigation and identity.** Exact GOAT horizontal logo, Home as current location, compact local links to Latest, Roster and League, and clearly identified exits to Stocks, News and Arcade on the existing GOAT site. A left navigation column remains visible on desktop without turning into a full-height application canvas. The document itself scrolls. A focus-only skip link reaches main content.
2. **Small page context line.** Team name, manager, 2026 Week 3, current record and supplied standing. A visible “Synthetic demo” label sits beside the labelled demo persona select. The select offers Reaves, NeuralNets and Guest; query state is `?persona=reaves|neural|guest`, with Reaves default. No account or membership claim is implied.
3. **Latest supplied changes.** A prominent but compact mixed-case heading, a UTC as-of label, and two unboxed, ruled change rows. Each row has time, specific headline, explanation and a concrete anchor/action. The beginning of the relevant evidence is included with the entry: Reaves gets a small supplied-points preview; NeuralNets gets the six missing names. This is useful content before any click.
4. **Current matchup reference.** Alongside the change list at wide desktop widths, a quieter section shows the correct opponent, both current records, supplied score/state and local “Inspect matchup” disclosure. Reaves has its saved estimate directly underneath, visibly dated and labelled synthetic. NeuralNets instead gets the missing-score explanation and unavailable-model state. No winner or progress gauge is inferred where a score is absent.
5. **Roster evidence and quote coverage.** A complete, readable roster table in normal flow: player, position, supplied completed-Week-2 points/evidence state, modeled FAAB quote and Inspect. The heading gives both evidence coverage and quote coverage. All 24 Reaves or 22 NeuralNets names remain visible by default. Long names wrap. No internal scroll reader, pagination, mandatory tab or closed “full roster” container conceals the primary data. A labelled name search narrows the table only when the visitor requests it and reports the matching count; clearing restores every row.
6. **League reference.** All five current pairings beside the ten-row current standings table, with the member and their opponent marked with text as well as visual weight. The league table is supplied synthetic rank/W/L/PF, never a valuation ranking. Team-name actions reveal a local public team summary. All scores keep their explicit unknown/recorded-zero distinction. A simple directory of team/manager identity can be combined with the standings name cell rather than duplicated as ten cards.
7. **More from GOAT.** A concise set of purposeful exits: player market / trade analysis, league intelligence / draft / transactions, News / weekly archive / History, and Arcade with the existing small free-throw preview. These are website destinations, not invented working tools or fake content modules. No fabricated article feed or transaction feed fills the missing fixture fields.
8. **Semantic footer.** Logo/name, demo provenance entry, as-of time, return-to-top link, and grouped destination navigation. League: Teams, Transactions, Draft, Intel, The Table. Analysis: Stocks, AI Decides, Trade Analyzer. Club: News, History, Weekly archive, Arcade. Account: My Team, Sign in. Home is reachable through the current-location navigation/logo. Existing-site exits carry a visible external marker and an adjacent explanation that they leave this prototype; sign-in is expressly on the existing site.

## Meaningfully different states

### Reaves Dropper

The opening is an evidence review: “A completed-week player breakdown is ready” at 08:20 UTC, followed by complete quotes at 08:10. Show the five supplied evidence players (Damian Lillard 42.5, Tobias Harris 31, Joel Embiid 38, Myles Turner 24.5 and Derrick White 22) as a concise preview, explicitly for Synthetic completed Week 2, 19–25 October. Do not call them the best five or sum them into the current matchup.

The first action is **Inspect Week 2 evidence**, which reaches that roster section and focuses its heading. The second is **Inspect all 24 quotes**. The quote context states 1,095.25 modeled FAAB, 24/24 priced, checked at 08:10; no league value rank exists. Current matchup is Reaves Dropper 184.5 / Ware the Hoes At? 171, synthetic in progress. The saved 26 October model estimate shows both 56% and 44%, the returned choice and separate confidence 0.35. Its label says it is not calibrated odds. No generation control is shown. Current standing is #1 at 2–0; no change from a previous standing is claimed.

### NeuralNets

The opening is a coverage review: “Six player quotes are missing” at 08:25 UTC, followed by “Your matchup score has not been returned” at 08:15. The six unpriced names are visible immediately: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. The first action is **Inspect missing quotes**, reaching the roster with those rows first while preserving all remaining rows. This is an ordering change, not a hidden default filter. Missing quotes display “Unpriced,” never 0.

The roster introduction leads with **16 of 22 priced**. The 1,622.00 figure is labelled **Partial modeled FAAB subtotal**, with its coverage beside it and no comparison against Reaves' complete figure. Three players have supplied completed-Week-2 points: Rudy Gobert 29.5, Giannis Antetokounmpo 45 and Kevin Durant 33.5. The other nineteen are “Evidence unavailable,” not DNP or zero. The second action reaches the current matchup explanation: papichooter has a recorded 0; NeuralNets is “Score unavailable.” Do not print 0–0, a tie, deficit, win probability or leader. The saved model is unavailable; no placeholder percentage appears. The page remains substantial with its roster, pairings, standings and tools. The 2025 team summary always qualifies its 1–20 record as under the previous manager, QBs Gremlins, even in the short disclosure summary.

### Guest

The guest has a complete public league home rather than empty member modules. Its title is **The league this week**. All five supplied Week 3 pairings lead, with the full current standings alongside and a clearly labelled existing-site sign-in action. Below are team/manager summaries, useful market/intelligence/archive/Arcade exits and the same full footer. There is no “your” team, roster, personal quote, saved personal estimate or private change list. The guest uses only public league fixture fields; it does not derive membership from a selected team. Local team and matchup inspection still work. The selected demo persona remains explicit.

## Primary local flows

- **Change to evidence:** activate the specific change's anchor, update the hash, move focus to the target heading, and reveal the relevant rows already in the page. A “Back to latest changes” link returns to the change list. Native browser Back restores the anchor route. No forced smooth scroll.
- **Inspect a player:** each table row has an explicit named button; it opens a readable in-flow detail row tied with `aria-expanded` and `aria-controls`. It shows only supplied identity, position, evidence period/state/points and quote/coverage/check time. It does not invent game logs, scoring components, injury status or quote factors. Close returns focus to the initiating button. Several expansions may remain open for comparison.
- **Inspect a matchup:** native disclosure within the score reference/pairing row shows team names/records, source time, explicit score availability and the supplied model only for the correct Reaves pairing. All primary scores remain visible when closed. Native keyboard behavior is retained.
- **Inspect a team:** an in-flow disclosure reveals manager, current supplied record/PF and separately labelled 2025 record/finish; it preserves the previous-manager qualification for NeuralNets. A visibly identified external link offers the real `/teams/:id` page. Only the member's fixture roster is represented as their roster; no missing opponent roster is fabricated.
- **Source explanation:** an accessible native details element explains synthetic current data, retained identity/history provenance, timestamp scope, unknowns, absent series and the demo persona. No live calls, local/session storage, fake refresh, notification, lineup save, trade submit, auth or AI generation.

## Typography and desktop composition

The website should read like a useful league reference with a clear reading rhythm. Use the exact logo for identity; no oversized decorative GOAT wordmark, ticket/jersey metaphor or scene substitutes for navigation.

- **Reading:** existing local Lora variable, 17px / 1.55, weight 400 for change explanations and source prose, 55–68 characters maximum measure. Mixed-case section headings use Lora 26–30px / 1.2 at 600. The page heading is around 34px, not a poster headline. This serif reading voice gives explanations a different texture from the controls and tabular material.
- **Controls and data labels/names:** `Verdana, Geneva, sans-serif`, 14px / 1.4 for navigation, labels and controls; 15px / 1.45 for table names. Use 400 and 700 deliberately, with no fake intermediate weight dependence. Long names such as Giannis Antetokounmpo and Stephon Castle’s Back get intrinsically growing rows and at least about 16rem name space when the table is wide. Do not squeeze or truncate names to preserve row height.
- **Numeric data:** existing local IBM Plex Mono Regular, 14px / 1.45, tabular figures; 22–26px for score values only. Right-align numeric columns and retain decimal precision from the fixture with sensible display formatting. Counts, quotes and scores have their own labels. Dates use a compact readable control face unless aligned in a numeric column.
- **Density:** 48–56px minimum ordinary data row with growth for wrapping; 12–16px between paragraphs, 28–40px between major sections. Thin rules organize continuous content; repeated boxed panels do not define the page.
- **Width:** approximately 12rem navigation column and a bounded main reading region at 1440px. The opening uses a roughly two-thirds change area and one-third matchup reference. At 1120px the navigation narrows and the reference moves below the change entries when its content needs room; the roster and league remain in document flow. The league pairings/table can stack at that content-driven threshold. Text enlargement grows the page and reflows the layout; it never invokes a smaller font or fixed-height reader.
- **Appearance and motion:** warm light neutral ground, dark brown-black text, a restrained deep red link/current-location accent, and textual coverage states rather than red/green status dependence. Use the unchanged black logo; an approved small portrait can identify a player inside an expansion. The page does not need a large court image. No animation is necessary for common controls. Reduced-motion users receive the same immediate behavior and all content.

Lora and IBM Plex Mono are already in `qa/homepage-structures/assets/fonts/catalog.json`, each with an existing SIL OFL 1.1 record and source hashes. Reuse those bytes; preserve their notices; no downloads, packages or extra assets are planned. System Verdana/Geneva fallbacks are intentional rather than a new font acquisition.

## Actual discovery sources and concrete effects

Read the assigned `briefs/07.md`, complete `AUTHOR-BRIEF.md` and `PRODUCT-INVENTORY.md`, the data fixture's root/public fields and both complete member objects plus guest, and the existing font catalog. Read the actual `src/app/page.tsx`, complete `CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts` and `src/ui/siteDestinations.ts`. These establish that production membership is server-resolved and request-private, public access survives missing optional data, quotes require coverage, saved AI must match context and the destination set is broader than one header can comfortably hold. This plan uses a clearly marked fixture selector, keeps guest context useful and distributes navigation deliberately.

Read repo `AGENTS.md`, the architecture overview/directory map and the focused “Courtside homepage and weekly archive,” “Personalized team front page,” contracts, responsive and caching sections of `ARCHITECTURE.md`; read `DESIGN.md` through the current homepage composition and approval/provenance guidance. Data ownership, honest missing states, exact approved assets and production isolation apply. As the author brief explicitly says, production palette/type/section sequence/primitives do not constrain this QA proposal. No production files or source loaders will be changed.

### Assigned primary reference: adapt

Opened [pbakaus — adapt](https://www.ui-skills.com/skills/pbakaus/adapt). Read the extracted full skill text, including Assess Adaptation Challenge, Desktop Adaptation, Implement/Verify Adaptations, content-driven breakpoints and input-method guidance; no installation command was run. The relevant lesson is to adapt the work to its context. Its desktop advice changed the plan toward simultaneous change/context reading, a visible navigation column and full roster rows upfront. Its wrapping/input guidance changes 1120px behavior to reflow the reference rather than shrink text, and keeps disclosures usable by keyboard and touch. No mobile build or device test is claimed or planned in this desktop-only phase.

### Assigned primary reference: Invisible Details of Interaction Design

Opened [Rauno Freiberg — Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design). Read the complete extracted article; embedded gesture videos/demos were not exercised. The applied sections are Spatial Consistency, Frequency & Novelty, Scroll Landmarks and Fitts's Law. They led to details expanding next to their triggering row, a labelled return anchor that preserves the visitor's place, full-sized named inspection controls and immediate common interactions without entrance animation. Touch-gesture physics and decorative morphing are not requirements for this homepage. These are behavior decisions, not copied visual motifs.

Both assigned references opened successfully. No index, old prototype, peer source or unrelated dashboard reference was used as design evidence.

## Build handoff and acceptance checks

If root authorizes build, create only this directory's HTML/CSS/JS and NOTES.md, importing only the shared data fixture. Set `data-persona` correctly and set `data-personal-study-ready="07"` after content/fonts settle. `?stage=structure` will neutralize color and imagery while retaining the same geometry and full content.

Check Reaves, NeuralNets and Guest at 1440 and 1120 CSS px; exercise persona query, source disclosure, change anchors/Back, roster search/clear, player close/focus, team/matchup details and external-link labels. Check text enlargement, intrinsic names, visible keyboard focus and no horizontal page overflow. Confirm 0 versus unavailable, 24/24 versus 16/22, no value rank/series, previous-manager history and the dated model label. Root owns final captures. These are planned checks, not evidence of implementation or browser verification.

Discovery deliverable: this PLAN.md only. No implementation, dependencies, network data calls, release actions or production mutations were performed.
