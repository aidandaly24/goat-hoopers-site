# Concept 04 — Clubhouse

Revised discovery plan. This replaces the earlier Team review plan; it is the same independent author, not an additional author. No presentation code has been written. Build is paused pending the early-three gate and a root build followup.

## Chosen website architecture

I privately developed three complete approaches: a competition-led league map, a player-led clubhouse, and a narrative weekly magazine. The clubhouse is the strongest fit: it makes the member's actual squad and opponent tangible, gives players useful local destinations, and has a natural public edition. The league map would let comparison mechanics dominate; the magazine would need more sourced stories than this fixture supplies. Neither is being built or presented as another concept.

The homepage answers **Who am I facing, which of my players can I inspect, and where does my team sit in this league?** It is an entry into a usable website. Home presents enough matchup, player and competition content to be useful by itself; a full roster and ten-team standings have their own local destinations. There is no roster/standings table spine on home, missing-quote repair queue, or dashboard of every available data family.

## The actual visual world

The website is a vivid, dark basketball clubhouse with human faces and large readable names. The opening canvas is deep midnight navy (`#071D36`), the player section is saturated court blue (`#1236B2`), and warm yellow (`#FFD94A`) belongs to primary actions and the competition section's broad background. Near-white (`#F8FBFF`) is the main dark-surface text. Dark navy text sits on yellow. Small coral (`#FF9C83`) labels distinguish period/context where useful; color alone never conveys score or availability. These are planned role values to verify during build, not measured contrast claims.

This world changes the page's structure:

- A 76–88px masthead has the exact white GOAT logo, four clear destinations and an account exit. A small separate utility line carries **Synthetic demo**, the demo-persona select and source explanation. It is not a ticker.
- At 1440px, approximately 64px outside gutters leave a 1312px working width. The opening is about 390–430px tall. Its left 54% combines the team name, record/standing, two approved player cutouts and **Explore squad**; its right 46% is a typographic matchup with readable team names, actual sample score states and **Open matchup**. Facts/actions sit on opaque surfaces, never across a face. The entire opening is useful content, not a slogan.
- Cutouts are approximately 230–270px high, naturally bottom-aligned with room for names. Joel Embiid and Anthony Edwards identify Reaves' supplied squad; Giannis Antetokounmpo and LaMelo Ball identify NeuralNets'. These are selected available portraits, not claims that they are captains, starters, best performers or the highest-valued pair. No faux badge, jersey or honor accompanies them. Alperen Şengün / AJ Dybantsa supply further portrait-linked squad entries below.
- The blue player section uses one substantial portrait-led object beside a short, spacious group of named player links. It is asymmetric rather than a grid of equal cards. Name, useful supplied fact, period and action are visible together.
- The yellow competition section is an open two-column composition: the team's place and nearby competitors on one side, two other Week 3 pairings on the other. **Explore all 10 teams** opens a local competition page; home does not become a ranking table.
- The final dark section is a real next-destination area: an existing free-throw image with an explicitly labelled GOAT exit, plus useful Stocks/Intel/history links. A semantic footer completes the website.

At 1120px the working gutters become about 40px. The opening remains two columns while names wrap and height grows; the player section can change to one lead portrait plus text links beneath. Enlarged text may stack those regions. Heights are not locked, text is not squeezed down, and there are no internal scroll readers.

The guest opening is deliberately different: the approved arena image occupies roughly 42% beside the Week 3 introduction and first public pairing. Its natural framing is retained; it is not a full-screen background. Other pairings begin immediately below in document flow. Guests see league people and competition without inheriting private stories or a claimed squad.

## Typography, proportion and density

The old Georgia/Tahoma/mono approach is replaced. Body, controls and ordinary data work together at a substantial reading size; display and score roles provide a separate voice.

| Role | Face and actual treatment | Purpose |
| --- | --- | --- |
| Team identity and section titles | Existing licensed Archivo Black; member name 42–48px/1.08, sections 30–34px/1.15; mixed case | A broad, physical basketball voice. Long names wrap; it does not become an all-caps wall. |
| Body and player facts | Existing licensed Space Grotesk, 18px/1.5, 400–500; 48–58-character measure | Open reading at the scale this image-led page needs. Concise paragraphs remain ordinary readable text. |
| Navigation and controls | Space Grotesk, 16–17px/1.3, 600; 44–48px minimum control height | Clear destinations and comfortable controls beside the imagery. |
| Primary current score | Existing licensed Oswald, 58–68px/1.1; tabular figures | A score reads as a score. Missing score is a readable phrase, never an equally large zero or decorative dash. |
| Other numerical facts | Space Grotesk, 18–20px with tabular figures; adjacent units and period | Records, modeled quotes and points remain readable without a terminal-like mono family. |
| Coverage/source support | Space Grotesk, 15–16px/1.45; sentence case and readable contrast | Quiet support means lower prominence, not tiny text. Source expansion stays near the fact. |

No DM Sans, serif reading layer or system-font table scaffold. Existing local font files and OFL notices are reused. No new downloads/dependencies. Density is medium: three to five meaningful facts and two or three useful actions in the opening, followed by substantive player and competition sections. No giant empty headlines, decorative metric strips or five consecutive same-sized cards.

## Reaves Dropper homepage

The opening names Reaves Dropper / aidandaly20, synthetic 2026 Week 3, 2–0 and supplied standing 1. Its players provide the visual identity. Opposite them, Ware the Hoes At? has its current 1–1 record and sample matchup scores **184.5 / 171**. A 13.5-point sample difference can be stated as current context, never a final victory. The primary action is **Open matchup**.

The player section is **Inside your squad**. Joel Embiid's portrait carries **38 points — synthetic completed Week 2** and modeled FAAB 137.50. Damian Lillard's 42.5 and Derrick White's 22 are readable linked comparisons; Tobias Harris and Myles Turner remain available through **Compare five player samples**. This is explicitly a supplied sample, not a best-player award, lineup recommendation or full team scoring total. Each player has a substantive local destination.

A short roster note says five player breakdowns are newly available in this synthetic scenario and links to their comparison. The quote note is subordinate: modeled roster FAAB value 1,095.25, covering 24/24 supplied players at the calculation time. No league value rank or history chart is inferred. The full roster is on **Explore squad**, not printed down home.

The competition section places Reaves with the next supplied team, Stephon Castle’s Back, using current ranks/records without invented movement or odds. Two other actual supplied pairings appear alongside, with names, sample scores and local inspection. The saved estimate is available in the opening's concise **Saved preview** disclosure and on the matchup page: 56% / 44%, returned choice Reaves, saved October 26, confidence 0.35 separately labelled. Experimental/model wording remains beside the preview label; it does not consume an entire home section.

First three manager actions:

1. **Open matchup** → local matchup page with both identities/records, current scores/difference and the supplied saved estimate/provenance.
2. **Compare five player samples** → local completed-Week-2 comparison with actual points, coverage and period, then named player destinations.
3. **Explore squad** → local 24-player roster with modeled quotes and player links; Stocks/Trade Analyzer exits are separate and explicit.

## NeuralNets homepage

The opening uses its own Giannis/LaMelo imagery, 0–2 record and supplied standing 10. It leads with **NeuralNets vs papichooter** and the opponent's 2–0 record. Papichooter's supplied score remains **0**. NeuralNets reads **Score unavailable**, with one adjacent sentence explaining that no leader can be determined. The useful subject is competition and squad, not an instruction to repair data.

Its lead player is Giannis Antetokounmpo with **45 points — synthetic completed Week 2**, alongside Kevin Durant's 33.5 and Rudy Gobert's 29.5. **Inspect Giannis** and **Compare three player samples** lead to substantive local views. LaMelo Ball is a separate squad entry with modeled quote 77.75 and honestly unavailable completed-week evidence. AJ Dybantsa remains an inspectable roster identity although both supplied quantities are unavailable. Neither gets a fabricated form judgment.

The next section is **Know your opponent**: papichooter's current record, rank and points-for beside NeuralNets' current league context and **Meet papichooter**. No opponent roster is invented. Competition places NeuralNets beside supplied ninth-place T Halibooty, then shows other Week 3 pairings. There is no implied comeback, improved trajectory or predicted finish.

The value sentence stays beside **Explore your 22-player squad**: **Modeled subtotal 1,622.00 FAAB · 16 of 22 quoted**. Coverage support mentions six unpriced players; they are not an opening error list or fake repair task. No value rank, complete comparative total or history is shown. The absent saved estimate is one sentence on the matchup destination, with no empty meter or generation button. Historical context keeps **Under the previous manager as QBs Gremlins** beside the 2025 record.

First three manager actions:

1. **Meet papichooter** → local public opponent profile with current record/rank/points-for and qualified historical facts; roster availability is explicit.
2. **Inspect Giannis** → local player page with known Week 2 sample, modeled quote, supplied identity and sources.
3. **Explore squad** → local 22-player roster in ordinary membership order, preserving priced/unpriced states and named player destinations.

## Guest homepage

The public edition is a league clubhouse, not a sample private account. Its opening pairs the approved arena with GOAT Hoopers, synthetic 2026 Week 3, ten teams and a visible first public matchup. **Sign in on GOAT — leaves prototype** explains where actual membership is resolved. The persona select remains visibly a demo control.

All five public matchups appear in document flow in an open two-column pairing layout, with substantial names and 24–32px scores. The unavailable score remains readable text; no result is transferred between matchups. **Open pairing** reaches local detail. Only m1 has a supplied saved estimate.

**Meet the league** follows with three supplied current contenders — Reaves Dropper, Stephon Castle’s Back and papichooter — their records and local profiles. This is public competition, not an invented editorial feature or championship celebration. **Explore all 10 teams** reaches the complete local directory/competition page. The lower page offers Arcade, Stocks and history before the full footer. There is no private change stream, roster value or owned-player claim.

First actions: **Open a Week 3 pairing**, **Meet a team**, **Sign in on GOAT**. The first two work locally; the third clearly exits to the actual account destination.

## Navigation and local depth

Member navigation: **Home**, **Matchup**, **Squad**, **League**. Guest: **Home**, **Week 3**, **Teams**, **Arcade on GOAT**. Home has its current-page state. A signed-in-looking control never represents authentication. The native utility select uses `?persona=reaves|neural|guest`, default Reaves, and sets `document.documentElement.dataset.persona`.

Local destinations are readable views in the own-directory HTML application, with explicit URL state such as `view=matchup`, `view=squad`, `view=player&id=1511`, `view=samples` and `view=league`. Back/Forward restores view and departure position. **Back to clubhouse** always works. Header/footer remain available and current location is named. These destinations add depth to already substantive home content; home does not become closed panels.

Player detail presents only supplied name/position, approved portrait, quote or Unpriced, points or Unavailable, period/participation and sources. It invents no game logs, injury status or trend. Matchup detail uses known identity/record/score and only its matched estimate. League detail has all ten supplied ranks/teams. Local full rosters exist only for the two supplied teams; other teams explicitly have no roster here and offer a separate GOAT profile exit. Secondary squad/competition pages can use a compact list/table where useful; that is not home's organizing spine.

The semantic footer groups every fixture destination:

- **League life:** News, Transactions, Teams, The Table, Weekly archive, History.
- **Manager tools:** Stocks, Intel, AI Decides, Trade Analyzer, Draft.
- **Play and account:** Arcade, My Team, Sign in.
- **This prototype:** local Home, source explanation, Back to top.

Production links visibly say **on GOAT / leaves prototype** and use existing corresponding paths. Local inspection and production profile exits are separate. No submit/save/lineup/login/notification behavior is simulated.

## References and evidence

Assigned sources were read during initial discovery, not installed. They inform interaction/access; neither supplies this art direction. No peer source, pilot source, old prototype or rejected catalog was inspected during either pass.

- [Emil Kowalski, Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md): assigned page opened and full raw SKILL.md read (597 rendered lines). This revision selectively applies the frequency/purpose animation framework and control feedback: repeated navigation/player tasks respond immediately and controls remain predictable. Pointer feedback, if animated, is brief/property-specific. Keyboard/reduced-motion users get the complete static site. The portrait composition is static, with no entrance sequence hiding work. Decorative springs, 3D and dragging are not applied.
- [Addy Osmani, Accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility): displayed skill body read in full, Evidence-led audit workflow through Common issues by impact (lines 21–409); linked subordinate patterns were not read. Effects are native links/buttons/select, skip navigation, visible focus, descriptive destinations, semantic headings/footer and text for missing states. Portraits do not replace names/facts. Targets, contrast, wrapping and enlarged-text growth constrain the vivid design. Local keyboard/history behavior must be exercised; source/automated checks alone are not conformance.

Local basis remains assigned/common brief and inventory; full fixture with corrected null value ranks; all five requested home contracts; AGENTS; relevant ARCHITECTURE data/personalization/access/surface contracts; relevant DESIGN truth/ownership/access guidance and project navigation/accessibility reference; licensed font catalog. During revision I also visually inspected the approved arena and Joel Embiid portrait. No new asset was generated, downloaded or changed.

## Truth, scope and future verification

Coverage supports the claim it qualifies. Reaves' current quote is complete but has no league value rank; NeuralNets remains partial. Missing score is not zero. Sample player points are not full team totals or a new ranking. Current quantities/changes/model outputs remain explicitly synthetic. Historical fields retain season/previous-manager qualification. No history series or Lineup Power producer exists, so neither is drawn. No fake injury/news/availability/story fills a visual gap.

Only `qa/homepage-personal-20/04/PLAN.md` changes now. A future authorized build uses own HTML/CSS/JS, the shared data-only import and approved assets/fonts. No dependencies or network/backend/storage/mutation calls. Readiness waits for fonts/content; `?stage=structure` preserves content/geometry while neutralizing color/imagery.

Future bounded checks: three persona homes and their first three paths; direct local URLs/Back/Forward; explicit GOAT exits; null/zero/partial quote behavior; 1440/1120 with long names; enlarged text/reduced motion; keyboard focus/structure mode. Root owns final captures. Discovery claims no build, browser acceptance, device or screen-reader test.
