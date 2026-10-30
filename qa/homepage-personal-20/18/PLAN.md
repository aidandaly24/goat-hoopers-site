# Concept 18 — A useful weekly review

Discovery only. Author 18 owns this directory. No presentation code has been written. This plan is bound to product source revision `0d4564101af5a9267b152ccf08455e87a480ac33` and the shared `goat-personal-design-fixture-v1` scenario.

## Product answer

Calm should come from a clear order of questions and a steady reading rhythm. It should not come from removing information. The home page will be a substantive weekly review: establish the state of my matchup, bring the two meaningful changes into view, let me inspect the evidence behind them, then put my team back in its league context.

The primary action is **Review player evidence** for Reaves and **Inspect missing quotes** for NeuralNets. A guest's primary action is **Inspect a matchup**, alongside real account entry. These are different useful tasks, not different team names in an unchanged hero.

## Three architectures considered independently

1. **League field first.** A broad view of all ten teams, grouped by current record, followed by the five pairings, with the member's team and next review embedded in that field. This is excellent for discovering the competition and is the guest's strongest opening. It makes a returning member scan too much public context before reaching their new evidence or an important missing value.
2. **Task entrance.** Four substantial destinations—matchup, players, prices, league—each with a preview and an inspection action, followed by a unified activity feed. This gives several clear paths, but gives equal visual weight to unrelated jobs and repeats a box treatment. NeuralNets' missing score risks looking like merely another destination.
3. **Sectioned weekly review — chosen.** A compact global navigation rail, a short status opening with a meaningful next review, and open sections whose order responds to the person's available evidence. The lower page broadens into a public league field and practical routes. Every useful headline fact is already in document flow. Inspection pages carry exhaustive quote detail without turning the homepage into a roster spreadsheet.

The rejected obvious default is a headline above a full roster table, another standings table, and a row of tool cards. It exposes everything at the same level, while making the important differences between these two members harder to see. I also reject the familiar serif-prose/system-control/monospaced-number combination. This concept uses a contemporary sans for real reading and tabular data, with a narrower secondary face only where it improves section recognition.

## Whole website structure

### Global navigation and identity

A 208px rail at 1440px, reducing to approximately 176px at 1120px, sits beside a main reading column. It belongs to normal page flow and has no internal scrollbar. The exact supplied black horizontal GOAT logo appears at the top, linking to this prototype's home. Its proportions and artwork remain untouched. The logo's black mark, decisive section headings, and one restrained dark league zone provide identity throughout the page; there is no promotional court hero.

The rail contains **Home** with `aria-current="page"`, then an explicitly named **On this page** group: Your week / Evidence / Prices / League for members, or League field / Matchups / Club history / Explore for a guest. These are ordinary anchors. A small **Go to GOAT** group exposes Stocks, News and Arcade as clearly marked exits. Account entry is visibly separate. The demo persona select sits with a compact **Synthetic demo** label and a source explanation link, never in the account area. It says **Demo persona**, defaults to Reaves, and uses only the three allowed values.

At both requested desktop widths the main column is `minmax(0, 1fr)`, approximately 1120px or 868px wide, with a 40px or 28px rail gap and 32px or 24px outer padding. At enlarged text sizes the rail can move above the content; no content or control is made smaller to preserve columns. These are proposed dimensions, not verified rendering.

### Reaves: scored matchup, new evidence

1. **Your Week 3.** A modest mixed-case H1, Reaves Dropper and manager identity, 2–0 and supplied standing 1 of 10. The opening pairs a clear score presentation—Reaves 184.5, Ware the Hoes At? 171—with an adjacent open **What changed** list containing both supplied changes, their fixed demo times and direct review links. “Current demo score” describes the score. A 13.5-point difference may be shown as arithmetic from those two supplied values, not as a result. The first fold includes the evidence review action and the beginning of useful evidence.
2. **What the points show.** All five available completed-week evidence players appear in an open, compact typographic list: Damian Lillard 42.5, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5 and Derrick White 22. Each has position, points unit and its local inspection link. The section states **5 of 24 roster players have counted-game evidence in this sample**, with **Synthetic completed Week 2 · Oct 19–25, 2026**. These are evidence entries, not a claim that the remaining players scored zero or performed badly. A short supporting matchup note carries the saved synthetic 56%/44% model estimate and the separate 35% confidence, with its October 26 saved timestamp. It stays subordinate to counted evidence and clearly says it is not calibrated odds.
3. **Your roster's modeled quote.** A single value composition shows **$1,095.25 modeled FAAB**, 24 of 24 priced, calculation time and the fact that this is not a cash balance. Three useful anchor names and prices are Joel Embiid $137.50, Anthony Edwards $124.50 and Alperen Şengün $108.25. A readable sentence states that no comparable league value rank is supplied. **Inspect all 24 quotes** enters a local inspection page. There is no history graph: the source supplies no recorded series.
4. **The Week 3 field.** Public league context described below, with Reaves visibly labelled **Your team** and its opponent **Your opponent**. The source ordering is retained.
5. **Keep exploring.** Small editorial-scale entries lead to Stocks/Trade Analyzer, Intel/AI Decides, and the existing Arcade preview. Each says that it opens the current GOAT site. They explain a task in one sentence rather than claiming the prototype performs it.

### NeuralNets: unknown score, incomplete quotes

1. **Your Week 3.** NeuralNets, manager, 0–2 and supplied standing 10 of 10. The opening score area states **Your score has not been returned** beside **papichooter: 0 recorded points**. It never presents 0–0, a leader, a tie or a loss from this incomplete pairing. The two supplied changes appear openly. The main action is **Inspect six missing quotes**; the other is **Inspect matchup status**. The missing saved model result receives one useful sentence near the matchup, not an empty model panel or a Generate button.
2. **First, check the quote coverage.** The page gives the six unpriced names visible space: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. Each is explicitly **Unpriced**, never $0. A smaller **$1,622.00 modeled FAAB subtotal** is inseparable from **16 of 22 priced; incomplete**. This amount gets less display emphasis than Reaves' complete total and has no value rank or comparison claim. **Inspect 22 roster quotes** leads to the exhaustive local view with unpriced entries first.
3. **The evidence you can review.** Giannis Antetokounmpo 45, Kevin Durant 33.5 and Rudy Gobert 29.5 appear with the same completed-week period and **3 of 22** evidence coverage. This makes the page useful even when the score and prices are incomplete. Unknown evidence elsewhere is not a performance judgment. There is no inferred team-value trend.
4. **The Week 3 field**, then **Keep exploring**, provide the full public context and routes. Any historical NeuralNets record appears only with **2025 · under the previous manager as QBs Gremlins** adjacent to it. That record never supplies the current manager's narrative.

### Guest: a complete public home

The guest opens on **Week 3 in GOAT Hoopers**, the league's ten teams, and a brief invitation to inspect the field. **Sign in on GOAT** is a real labelled exit to `/login`; no private team, quote coverage, member change feed or saved personal model is claimed.

The substantial body starts with the full ten-team league field, then all five current synthetic pairings. A short **Last season** section names the sourced 2025 final—Josh Diddy's Roster 326, papichooter 251.5—and links to History on the existing site. It is visibly historical, not this week's news. An **Explore GOAT** section explains Stocks, league tools and Arcade using existing destinations and the approved local free-throw preview. No invented public articles or player highlights fill absent fixture data.

### Public league field and matchup content

Standing context is presented as three broad open record groups—**2–0**, **1–1**, **0–2**—rather than a full standings table. Every team appears once with its supplied ordinal rank, full wrapping name, manager and points-for value. The six-playoff-team rule is plain context, not playoff odds or an inferred qualification. Reaves and NeuralNets retain their actual source ranks. Team links open a local public profile containing only supplied identity/current record/points and clearly qualified previous-season facts.

All five matchups remain visible as a separate semantic list of pairs with their current demo score or explicit missing score. The member's own pairing is labelled, not moved to manufacture a new league order. A local inspection link gives the full pair context. The record grouping answers “Where do we sit?” and the pairing list answers “Who is facing whom?” without reproducing the same large team table twice.

### Footer and destination coverage

The footer is a useful directory and source boundary. It includes the GOAT identity, 2026 synthetic scenario as-of time, a short fan-made/unaffiliated statement, and **About the synthetic data**. Four labelled destination groups preserve the full inventory:

- **League:** Teams, The Table, Transactions, Draft.
- **Analysis:** Stocks, Intel, AI Decides, Trade Analyzer.
- **Club:** News, History, Weekly archive, Arcade.
- **Account on GOAT:** My Team, Sign in.

Home is supplied by the logo/current-location link. Every production destination has visible **GOAT site** text or belongs to a group explicitly labelled **Opens the current GOAT site**. Individual real team/player profile exits are labelled the same way inside local inspectors. Public `/teams/:id` remains separate from private `/team`. The footer never implies that local inspection has authenticated anyone.

## Typography and reading rhythm

**Space Grotesk** is the primary reading, control and numeric family. Its mildly distinctive shapes give the brand a voice during actual use, not only in a display heading. The existing licensed variable font supports `tnum` and `lnum`; I inspected its OpenType features and confirmed it contains the accented characters used by Alperen Şengün, Kristaps Porziņģis and the supplied long names. Default proportional digits are deliberately changed to tabular lining digits in score, money, record and rank contexts.

- Body: 16px/1.6, weight 400, around 62 characters maximum for explanatory paragraphs. Evidence names use 17px/1.35 at 500; Giannis Antetokounmpo and Stephon Castle’s Back wrap naturally.
- Controls/navigation: the same family at 15px/1.3, weight 600, with 44px minimum action height. Sentence case, no excessive tracking, no all-caps labels and no compressed long-name controls.
- Data: 17–18px/1.4, weight 500, tabular lining figures. The opening score can reach 46px and the complete quote 38px, with units and coverage immediately beside/below. Missing states stay in readable text, never an ambiguous dash.
- H1: Space Grotesk 32–36px/1.15 at 600. **Barlow Condensed** regular, 27–30px/1.15, gives the short mixed-case section headings a recognizable narrow rhythm. It does not render paragraphs, controls, player names or money. The exact supplied GOAT logo supplies the strongest display mark.
- Supporting source text: 14px/1.5 at 400, still readable, with ordinary dark text rather than low-opacity gray.

The page alternates a split opening, an open evidence list, a value composition and a broad league field. Whitespace, type and a few section rules establish hierarchy; there is no repeated card grid. Proposed visual roles are a light neutral reading surface, dark ink, a restrained copper action emphasis and one dark league section with light text. Actual contrast must be measured after building. `?stage=structure` will neutralize color and imagery while retaining identical content and geometry.

Both selected font files and their OFL notices already exist in the authorized local catalog. No font, image or script download is needed. The local portraits are used only where a fixture portrait exists; initials handle absent portraits. Team images are not fabricated because the shared data does not supply team avatars. The approved game preview is contextual, not a replacement for useful homepage content.

## Local action flows

1. **Changed item → evidence → player.** An opening review link targets the visible evidence section. A player link opens a local detail route such as `?persona=reaves&view=player&id=1444`, containing the same fixture identity, exact period, counted points, participation status, current quote and the supplied-data explanation. It has an ordinary **Back to your review** link. Navigation updates history; browser Back restores the previous page/scroll and returns focus to the activating link. No modal trap or scroll reader is needed.
2. **Coverage → exhaustive quote inspection.** `view=quotes` is a local page with all 24 or 22 quote entries, priced/unpriced counts, calculation time, total versus subtotal language, and the coverage explanation. Reaves defaults to largest modeled quote first; Neural defaults to unpriced first. A labelled native filter for All / Priced / Unpriced and a labelled name search help inspection, with result count and clear reset. Missing values remain separate from numeric sorting. Returning keeps the chosen persona and restores the trigger. The home remains substantial when this detail page is closed.
3. **Matchup → full pair context.** `view=matchup&id=m4` preserves zero versus unknown, both teams' public records and the fixed source timestamp. Reaves may additionally show its member-scoped saved estimate with separate confidence and provenance. Guest inspection uses public pairing facts only. It has no refresh, login simulation or predicted winner fabricated from missing inputs.
4. **League team → public profile.** The local profile has public facts supplied for that team, a second labelled exit to its real GOAT profile, and Back. It makes no roster promise for teams whose player lists are not supplied. The same local route is useful to members and guests.

Direct links to valid local inspectors render the appropriate content; invalid IDs produce a clear unavailable message and a working home link. The allowed demo persona values set `document.documentElement.dataset.persona`; unrecognized values fall back to Reaves. A persona change returns to that persona's home rather than retaining another member's inspector. There is no API, storage, auth, market calculation, AI generation or mutation call. No lineup save, trade submission, notification toggle or fake login is drawn.

## Sources actually read and their concrete effects

**Product sources, full file reads:** `src/app/page.tsx`, `CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, `src/ui/siteDestinations.ts`, the product inventory, and all scenario fields/player entries from `fixture.json`. I also inspected root `layout.tsx`, SiteHeader, MobileNav, SectionNav and SiteFooter to distinguish current navigation/account handling from design recommendations. The server-only membership contract is why the persona control is labelled test state. Partial-price and saved-model contracts are why Neural's missing values change the page priority and never become zeros or a league value rank.

**Repository guidance:** root AGENTS; ARCHITECTURE's data flow, homepage/personalization, bounded-surface, UI, cache and account sections; DESIGN's purpose, composition, controls/access, content, responsive/navigation, acceptance and personalized-edition sections; and the project design skill plus its navigation/accessibility reference. These informed semantic actions, explicit exits, focus/Back behavior, source labels and ownership boundaries. The experiment's explicit exception governs palette, fonts, section order and shared primitives. No shared navigation change is proposed and shared-shell ownership is outside this plan.

**[Rauno Freiberg, Contrasting Aesthetics](https://rauno.me/craft/contrasting-aesthetics), full article text read:** introduction, Inviting Curiosity, PP Foundry, Just Friends, Raw Materials, Spaces and Loïc Nottet. Embedded media were not played and linked example sites were not inspected. The useful principle is purposeful difference in emphasis and form. It changed the design from one repeated content container to four distinct section formations, and kept the narrow section face subordinate to a dependable reading face. The striking brand moment is confined to the exact logo and league zone; ordinary player/price tasks remain steady. The article's examples do not prescribe this concept's appearance.

**[iart-ai, Accessible Animation](https://www.ui-skills.com/skills/iart-ai/accessible-animation), complete embedded skill body read:** core tiering, CSS/JS preference gating, React discussion, WCAG mapping, verification guidance, quick reference and gotchas. I did not install it, run its scripts or use its libraries. Its practical effect is to avoid an animated rail, ticker, entrance sequence or sliding inspector: local detail uses ordinary navigation, with content visible immediately. Optional 120–150ms color/focus feedback can remain without displacement. Reduced motion and still presentation retain every task and source fact. This is a source application, not a claim that screenshots or animation verification have already run.

## Build boundary and later verification

Only `PLAN.md` is delivered in this phase. No peers or old prototypes were inspected; no production files, shared fixture, dependencies, services or publication settings were changed. A HEAD check confirmed the inventory's exact revision. Current evidence is source/data/font inspection; the existing port 4207 is a static file server, and no production or persona render has been claimed.

After an explicit build followup, build only local HTML/CSS/JS in this directory and record source applications in NOTES. Check the three complete states at 1440px and 1120px; test long names, text enlargement, no horizontal page overflow, normal/reduced-motion access, direct inspection links, keyboard/Back/focus restoration, data coverage labels and all production exits. Set `data-personal-study-ready="18"` only after fonts/content settle. These are pending checks, not passed results. Awaiting root's build followup; no discovery blocker remains.
