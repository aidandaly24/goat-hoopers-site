# Direction 19 — Industrial Gym

This is an independently authored, isolated homepage study. Only this directory was edited. No previous theme or peer mock was viewed. No shared CSS, section renderer, component template or production token file is imported.

## Design contract

- **User question:** What needs my attention this week, and where can I inspect my roster or the league?
- **Primary action:** Member: My team, with View roster alongside it. Public: Find a team, with the current featured pairing visible.
- **States:** Member/public; incomplete scores with known 0.0 and unknown Pending; saved, stale, missing and unmatched AI; synthetic completed-week evidence; dated draft editorial; unconnected price history, Power and league statistics; search results and empty search.
- **Narrow layout:** The member identity and actions precede current scores and the bounded court. Technical columns become open rows. Full rosters retain player, position and NBA team. Standings become labeled rows. Navigation remains in document flow, with direct Stocks and a keyboard-operated Menu.
- **Forbidden patterns:** Fake alarms, fake live indicators, decorative controls, invented graphs or awards, generated AI, giant photographic hero backgrounds, missing prices interpreted as zero, and current-week claims inferred from dated editorial.

## Material and composition

Concrete `#c8c9c3` is the dominant canvas. Slab `#dedfd8` and pale `#edefe7` support selected reading areas. Graphite `#252a29` supplies the heavy rails, control boundaries and printed labels. Warning red `#9a241f` marks section numbers and the identity rail; acid yellow `#e4ed58` is reserved for the synthetic-fixture notice, team-value readout and action labels. All roles are local to this theme.

Local Barlow Condensed gives the franchise name, scores, section names and technical labels their narrow industrial character. Arial/Helvetica handles reading and data. Body type is 1rem; secondary text is .875rem; provenance is .75rem. Font sizes are root-relative, including the main heading, so 200% root enlargement doubles their computed sizes. Numeric values use tabular alignment.

The opening desk is offset: the franchise and open score rows occupy the larger left plane; a smaller framed court viewport and work note sit to the right. The still image uses a restrained crop and saturation treatment, with its caption on opaque graphite. Below it, an acid value plate sits beside compact player rows. The rest of the page continues the same material: open notebooks, edition columns, technical AI rows, a franchise register, league ledger, and functional tools. No scene is a page background.

## Content and interaction

The only imported module is `../../data.js`, using the prescribed exports. The member view includes all 24 player values, all three supplied value leaders, distinct form/price/editorial scouting bases, completed-week points and GP, coverage, news and moves. The player present in both best and rough lists appears once with explicit cohort-overlap attribution.

Current Week 3 comes from directory currentMatchup, not the dated edition. The October 5–11 draft sample retains its supplied text, statistics, source checks and selection reasons in clearly dated sections. Its original opening-week story remains in a disclosure and does not determine the current pairing.

All five saved AI rows preserve the returned choice, both probabilities, independent confidence, save time and model/prompt/input/evidence details. In the first row, the returned choice remains Ware the Hoes At? at 35%, alongside Reaves Dropper at 65% and independent 20% confidence. Stale labels appear before opening any details. Missing and unmatched saved data retain all five current pairings without probabilities or saved-row hooks. A null input snapshot is explicitly unavailable.

The register contains exactly ten data-team-id containers and 228 distinct roster player links, with position and NBA team. Search covers team, manager and full player names; a player-only match opens its roster. Clear search restores all entries. Team sort supports roster number, name, manager, roster size and points. Standings sort preserves source rank while changing display order. NeuralNets’ prior-season line is labeled Previous manager, and its full history retains QBs Gremlins attribution.

All ten modeled faces have distinct player-profile, team-profile and actual Stocks workspace links. The Stocks implementation does not support selecting a player from a query parameter, so Market links use the real `/stocks` route without inventing a deep-link behavior. Tools include `/trade-analyzer`, `/ai-decides`, `/arcade` and the actual `/arcade/free-throw` route. Both supplied weekly archive entries retain dates, titles and routes.

The navigation button opens with Enter; Escape closes and restores focus. Its children are hidden from tab order while closed. Native details keep roster, valuation, editorial and provenance content accessible. No modal, polling, motion loop, external request, new dependency or storage write exists.

## Verification evidence

Evidence is from this static component fixture in installed headless Chromium through Playwright at `http://127.0.0.1:4206/qa/homepage-themes/directions/19/index.html`. It is not a production Next route, actual-device check or screen-reader pass.

Final browser assertions passed:

| View | Width | Default | Every details element open | Root font size 200% with details open |
| --- | ---: | --- | --- | --- |
| Member | 1440 | No page overflow | No page overflow | No page overflow |
| Member | 390 | No page overflow | No page overflow | No page overflow |
| Member | 320 | No page overflow | No page overflow | No page overflow |
| Public | 1440 | No page overflow | No page overflow | No page overflow |
| Public | 390 | No page overflow | No page overflow | No page overflow |
| Public | 320 | No page overflow | No page overflow | No page overflow |

The root enlargement check set `document.documentElement.style.fontSize = '200%'` separately from viewport reflow. Computed body and h1 font sizes doubled at every tested width. All required inventory hooks passed: ten directory containers, 228 roster rows, ten faces, 24 member value rows, and five saved rows in ready/stale states. Public has zero data-personal hooks. Missing/unmatched states have zero saved-row hooks and five current pairings.

Keyboard Menu Enter, Escape, focus restoration, player search, manager search, empty search, reset, directory name/roster-size/points sorts, standings name sort, returned-choice/probability/confidence parity, stale/missing states and a browser-only unmatched-week injection passed. Reduced-motion rendering retains all 228 roster rows. Local Barlow Condensed loaded. No page exceptions, HTTP error responses or external runtime requests occurred in the final checks. `node --check app.js` passed.

Visual inspection covered the desktop opening, all downstream sections through the tools and footer, the expanded source footer, phone opening at 390/320, an opened phone roster and opened 320px AI provenance. The coordinator owns complete bulk screenshots and the independent pairwise comparison.

Opaque color-pair calculations: ink/concrete 9.34:1; secondary/concrete 4.62:1; red/concrete 4.76:1; graphite/acid 11.48:1; pale/graphite 12.55:1; secondary/slab 5.74:1. Light row rules are decorative; actual inputs and actions have graphite boundaries. Focus uses the contrast-checked red outline. No essential text sits on the court photograph.

## Limits

All current league facts, prices, form, news and AI in this artifact are synthetic, as the visible label and complete source disclosure explain. No live API or current official award is implied. All fixture source details remain available through the complete inventory JSON link. Recorded value history, Power and unavailable league statistics are text states; no substitute series or ranks were drawn.

Native application links were checked against repository route conventions; authentication, real application Back/Forward behavior, the actual game flow, device behavior and screen-reader announcements were not exercised by this static study. No application build is claimed. No production file, route, data producer, configuration, credential, Git state or deployment was modified. No remaining blocker to source review.
