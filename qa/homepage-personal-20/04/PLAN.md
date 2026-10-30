# Concept 04 — Compare your squad

Accepted architecture checkpoint, same author. This replaced both previous 04 plans. Root subsequently authorized implementation of this comparison-first concept. The plan below preserves the design decision; current implementation, actual verification and the source freeze are recorded in NOTES.md. No dependencies, shared files or production changes are involved.

## Alternatives and decision

I developed these two alternatives before selecting the architecture below:

1. **Position atlas.** A whole-width, spatial index of the member's supplied PG/SG/SF/PF/C players, with each position leading to its roster and player pages. Reaves and NeuralNets would have genuinely different densities and entries; guest would browse teams instead. I rejected this because position alone is a weak return-home priority, and a full atlas risks making membership inventory the entire experience. It would also suggest lineup geometry without the necessary lineup contract.
2. **Opponent dossier.** A single broad document about this week's opponent, with both teams' current league facts, matchup and links into the member's players. Guest would browse five public opponent pairings. I rejected this because the fixture supplies no full roster for either member's opponent. A compelling visual dossier would have more identity than useful scouting and would return to a matchup-led structure.

**Selected: a comparison-first manager site.** The primary homepage object is one functional, two-subject comparison with large labels and a shared field axis. A compact team/opponent context band sits above it. There is no clubhouse hero, editorial column, three simultaneous streams, rail, roster table or matchup → three-player-cards → competition sequence. Home does not try to show every available family of data.

The member's valuable job is **compare two actual roster players, inspect the underlying sample, then go to the team or matchup when needed**. This does not produce a lineup recommendation or fake trade. The difference between a quote and a completed-week point sample remains explicit. Guest compares two public teams and can browse the week's pairings or enter the real site.

## Page architecture and navigation

At 1440px, use a centred approximately 1280px working width with 64–80px outer gutters. Every major section spans that frame. There are no persistent side columns. At 1120px, the working width is approximately 1032px with 44px gutters. The main comparison preserves its two subjects while names wrap; enlarged text can stack subjects with their repeated field labels instead of shrinking them.

The header is an approximately 80px light masthead with the exact black GOAT logo. Member destinations are **Home**, **Players**, **Matchup**, **League**; guest destinations are **Home**, **Teams**, **Week 3**, **Arcade on GOAT**. Current location is explicit. A separate, approximately 40px utility line contains **Synthetic demo**, the labelled native demo-persona select, and **About this sample**. The select changes only `?persona=reaves|neural|guest`, defaults to Reaves, and updates `document.documentElement.dataset.persona`. It is not membership or authentication.

Member home reading order:

1. **Team context band**, approximately 95–125px: team name/manager, current record and supplied standing, then opponent and current score state in a short adjacent sentence. The member is oriented immediately, without allocating a hero to the pairing. **Open matchup** is available here.
2. **Compare your squad**, approximately 420–470px with natural growth: two labelled native player selectors and a shared comparison object. Default subjects and useful sample facts are already visible. Controls do not conceal the rest of home.
3. **Choose another comparison**, approximately 160–220px: a short set of named starting pairs derived from the supplied players, plus **Browse all players**. These are explicit local destinations, not new recommendations, awards or claims about starters.
4. **This week for your team**, approximately 210–280px: the fixture's two actual synthetic changes, each connected to a useful player/sample/roster destination. A short matchup continuation provides opponent context. No news is invented to extend this section.
5. **Continue on GOAT**, a concise navigation area for Stocks, Trade Analyzer and the existing playable Arcade, clearly labelled as exits. Then the complete semantic footer.

The whole home remains substantive in document flow. The comparison is one central working object, not a widget floating above a checklist of data modules. Full rosters and full league standings belong to deliberate local destinations. Home contains no competition section after a group of player cards.

## The comparison object and its visual world

The page uses warm copper (`#DF7048`) as its broad main canvas, deep blue ink (`#102F45`) for text and strong controls, and a warm chalk (`#FFF2D8`) comparison surface. A muted blue (`#CEE4EB`) identifies the right subject's field. The left subject retains copper/light-ink associations. These colors belong to the two comparison positions, never permanent player/team truth. A dark blue footer closes the site; it is not a sports-clubhouse hero. Exact contrast will be checked in build.

One broad comparison object holds two subjects, with a narrow centre gutter naming the shared fields. At desktop width, approximately 44% / 12% / 44% gives each side room for long names and readable values. The top of each subject has a native player select with a proper label, the full name below it, position, and an approximately 105–130px-high approved portrait where present. A subject without a portrait gets its readable name/position and a quiet initial mark; no face is invented. Both sides receive equal space whether or not a portrait exists.

Below the identities, three shared fields establish a genuine comparison: **Completed Week 2 sample points**, **Current modeled FAAB quote**, and **Position**. Field names are visible at the centre and repeated programmatically for each value. Relevant sample period and quote basis/time sit beneath those fields, not in a warning banner. A neutral **Difference: left minus right** may appear only when both values are supplied and compare the same quantity/period. It is never labelled a winner, projected gain, stronger lineup or recommendation. Where either value is absent, the difference is unavailable, with a short explanation next to it. Unknown never becomes zero.

The module is a semantic comparison, not a miniature spreadsheet: three large, well-spaced fields, two named identities, readable source text and direct player links. It has no rank grid, tiny column headings, progress gauges or rows for the full roster. The rest of the site has the same large reading scale.

Imagery is confined to subject identity and a small existing Arcade preview. There is no full-bleed court, collage, wallpaper portrait or invented illustration. This deliberately lets an interaction rather than a scene organize the page. The exact logo remains unchanged; only existing approved portraits are used. The guest's team comparison uses prominent team names, managers and records rather than falsely using a player as a team avatar.

## Typography and density

| Role | Planned treatment | Why |
| --- | --- | --- |
| Page task/title | Existing licensed Archivo Black, 34–40px/1.12, mixed case | The main task is unmistakable without a poster-sized statement. |
| Subject names | Space Grotesk, 27–32px/1.15, 600–700 | Names are central content. Giannis Antetokounmpo and Stephon Castle’s Back wrap naturally. |
| Reading/body | Space Grotesk, 18px/1.5, 400–500; roughly 52–60 characters per explanatory paragraph | Substantial reading size throughout, without the previous serif/system stack. |
| Navigation/select/button labels | Space Grotesk, 16–17px/1.35, 600; controls at least 44–48px high | Clear controls that belong to the comparison workflow. No condensed or display text in form controls. |
| Main comparison values | Space Grotesk, 28–34px/1.15, 600, tabular figures | Common baselines make values comparable. Numbers do not need a mono family or oversized broadcast score. |
| Other facts and sources | 17–18px ordinary facts; 15–16px source/coverage at 1.45 | Supporting limits remain readable. They do not become the user's primary job. |

Only Archivo Black and Space Grotesk are needed. No serif, system-font body, monospaced data layer, DM Sans or third score face. Retain existing local font files/OFL notices. The main comparison uses approximately 24–32px internal spacing, larger 40–56px section separations and real text growth. This is a medium-density tool website with broad open composition, rather than an admin directory or a stack of sports cards.

## Reaves Dropper

The context band names Reaves Dropper / aidandaly20, synthetic Week 3, 2–0 and supplied standing 1. The adjacent current pairing names Ware the Hoes At?, record 1–1, and actual synthetic scores **184.5 / 171**. It can show the current 13.5-point sample difference, never a final victory.

The default comparison is **Joel Embiid vs Damian Lillard**. This is useful because both have known completed-Week-2 sample points: 38 and 42.5, with modeled quotes 137.50 and 74 FAAB. Those are two different quantities, not a combined score or pricing justification. Joel has a supplied portrait; Damian retains an equally readable identity without one. **Inspect Joel** / **Inspect Damian** open local player pages, and **Read the five-player sample** opens all five supplied Week 2 rows with their period and 5-of-24 scope.

Other visible starting pairs include Anthony Edwards / Alperen Şengün for current quote inspection, clearly showing their unavailable Week 2 sample where relevant. A roster note links to the complete 24-player destination and quietly states current quote coverage 24/24 and modeled roster FAAB value 1,095.25. No league value rank or history chart is inferred. The dated fixture changes link to sample and roster views; they do not become fabricated editorial stories.

First three manager actions:

1. **Compare two players** using the selectors; inspect their actual sample/quote difference without receiving an invented recommendation.
2. **Read the five-player sample** or inspect a named player, then return to the same comparison and scroll position.
3. **Open matchup** for both team records/current score and the matched saved estimate. The saved 56% / 44%, returned choice, October 26 timestamp and separate confidence 0.35 appear with model/provenance labels on that destination, not as homepage decoration.

## NeuralNets

The context band names NeuralNets / manager NeuralNets, 0–2 and supplied standing 10. Its opponent is papichooter, 2–0. Papichooter's supplied score remains **0**; NeuralNets reads **Score unavailable**, and no leader is inferred. The page's main task remains working with its own players.

Its default comparison is **Giannis Antetokounmpo vs Kevin Durant**, with supplied sample points 45 / 33.5 and modeled quotes 135.50 / 130.25 FAAB. The meaningful comparison uses known sample evidence; six missing quotes do not become the opening story or an error queue. **Read the three-player sample** brings in Rudy Gobert's supplied 29.5. Other starting pairs include LaMelo Ball / Rudy Gobert for quote inspection; LaMelo's missing completed-week sample is acknowledged beside that field. No form judgment is fabricated.

The roster continuation links to all 22 supplied players, with **Modeled subtotal 1,622.00 FAAB · 16 of 22 quoted** as support. The six missing values remain Unpriced on their actual player pages. No rank, complete team total, value comparison with Reaves or history series appears. The matchup destination says there is no saved estimate, without an empty meter or fake generation button. A local papichooter profile supplies current record/rank/points-for; no opponent roster is invented. Any 2025 NeuralNets detail keeps the previous-manager/QBs Gremlins qualification beside it.

First three manager actions:

1. **Compare Giannis and Kevin**, or select another actual roster pair, using known comparable fields.
2. **Read the three-player sample** or inspect Rudy/Giannis/Kevin's actual local detail.
3. **Meet papichooter / Open matchup** to understand the current opponent and score state, then return without losing the selected comparison.

## Guest

Guest has the same comparison-first website but a different task and data boundary: **Compare two league teams**. There is no selected private team or player ownership claim. The opening public context states GOAT Hoopers, synthetic Week 3 and ten teams, with **Sign in on GOAT — leaves prototype** for actual account entry.

Default subjects are Reaves Dropper and Stephon Castle’s Back. Team selectors contain all ten fixture identities. Shared fields are supplied current **Record**, **Standing** and **Points for**: 2–0 / 2–0, 1 / 2, and 615.5 / 576 respectively. These fields remain separate, with no new combined rating. Team detail is local and keeps current versus previous-season context distinct. It does not pretend every roster is supplied.

**This week's pairings** follows in ordinary flow, listing all five actual pairs with current scores or missing-state text and **Open pairing** links. This is public competition context, not a table of owned players. Guest then has **Meet a team**, the actual account exit, useful GOAT destinations and the full footer. Only m1 has a supplied saved model estimate; it never propagates to other pairings.

Guest's first three actions are **Compare public teams**, **Open a Week 3 pairing**, and **Sign in on GOAT**. The first two are local; the third visibly leaves the prototype.

## Local destinations, history and focus

Own-directory views use explicit URLs such as `view=player&id=1511`, `view=samples`, `view=players`, `view=matchup`, `view=league` and `view=team&id=7`. Member comparisons retain validated `left` / `right` player IDs and guest comparisons retain public team IDs. The selected persona is preserved. Invalid subject IDs fall back to that persona's actual supplied defaults, never another team's private state.

Native selects update the local comparison only. The object retains its geometry where possible, and an unobtrusive polite announcement names the changed subjects. No network/storage/mutation occurs. A visible Swap control exchanges sides without implying either is better. Browser Back/Forward restores subjects, current view and departure position. A focusable destination heading receives focus for a user-activated local view; **Back to comparison** restores the originating link/control and position. Native links provide real destinations, direct URLs work, and no modal readers or nested scroll containers are required.

Player detail shows only supplied identity/position, optional portrait, quote or Unpriced, points or Unavailable, period/participation and sources. The sample page prints all five/three known rows with scope, not a full team score. The roster and league destinations may use lists or compact tables as secondary depth. Public rosters exist locally only for the two supplied teams; other team profiles explicitly lack a roster here and have a separate GOAT exit. Nothing simulates lineup changes, trade submission, login, refresh, subscriptions or notifications.

## Whole-website footer

The footer is a complete, readable sitemap with **Local views** (Home, Players/Teams, Matchup/Week 3, League, source explanation, Back to top) and three production groups:

- **League life on GOAT:** News, Teams, Transactions, The Table, History, Weekly archive.
- **Manager tools on GOAT:** Stocks, Intel, AI Decides, Trade Analyzer, Draft.
- **Play and account on GOAT:** Arcade, My Team, Sign in.

All fixture destinations remain discoverable. Each production link visibly says it leaves the prototype and uses the current GOAT origin/path. Local inspection and production profile links are distinct. Exact approved logo variants remain unchanged.

## Source applications and constraints

The assigned [Emil Kowalski Design Engineering reference](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) was opened and the complete raw SKILL.md read in original discovery (597 rendered lines). Its selectively useful principles here are immediate repeated-task response, stable controls and purposeful feedback: selector updates are immediate, no reveal animation delays comparison, and any pointer feedback is brief/property-specific. Keyboard and reduced-motion users receive the same static content. Decorative 3D, dragging and springs are not used.

The assigned [Addy Osmani Accessibility reference](https://www.ui-skills.com/skills/addyosmani/accessibility) was read through its full displayed skill body, Evidence-led audit workflow through Common issues (lines 21–409); linked subordinate patterns were not read. This architecture applies native labelled selects/links/buttons, descriptive field/value relationships, skip navigation, visible focus, readable unknown states and deliberate view/Back focus behavior. Source/automated evidence will not be described as screen-reader conformance. No reference was installed or executed, and neither supplies this visual world.

Local sources already inspected remain the assigned/common briefs, product inventory, complete shared fixture with null value ranks, five required home contracts, AGENTS, relevant ARCHITECTURE data/access/personalization contracts, relevant DESIGN truth/access/ownership guidance, project navigation/accessibility reference and licensed font catalog. The approved arena/Embiid portrait were visually inspected in earlier discovery; arena imagery is no longer part of this selected architecture. No peer/pilot/old prototype/rejected catalog source has been inspected.

Only 04/PLAN.md changes for this checkpoint. Future build requires root followup. It would use only own presentation files, the shared data-only fixture, approved assets/fonts, no dependencies or live calls. Synthetic labels/source explanation remain accessible. Missing values stay missing; partial totals stay partial; no value rank, history series, Lineup Power, current news, injury or recommendation is invented. Historical period and previous-manager qualifications persist.

Future bounded checks: both member and guest comparison defaults/changes/Swap; direct URLs and Back/Forward/focus restoration; first three actions per persona; sample/quote separation and null/zero/partial states; 1440/1120 long-name layout; enlarged text; reduced motion; complete footer/GOAT exits; structure mode with identical content/geometry. Root owns final captures. Discovery claims no implementation or browser/device/accessibility acceptance.
