# Court Blueprint — direction 10

This isolated QA theme answers “What matters in my league this week, and where can I inspect it?” The member’s primary action is **My team**, beside **View roster**. The public desk starts with **Find a team**. The court’s six lettered points and matching text key navigate to useful sections of this same page.

## Visual hypothesis

The whole homepage is a working cobalt drawing, with a plan, key, detail sheets and a source register. The original SVG basketball court is a navigation schematic, explicitly marked “not to scale”; its construction lines carry no invented dimensions. Deep cobalt `#092c87`, deeper desk/header `#062363`, raised blue `#103993`, white `#f7fcff` and cyan `#91f1ff` remain consistent through rosters, saved picks, standings, tools and the footer. Subtle square construction lines continue behind the page. There are no cream panels, rounded dashboard cards, charts, rankings invented from absent data or photographic hero crops.

Local **Space Mono** carries the drafting character, names, controls and aligned numbers. Editorial opinion paragraphs use a plain sans-serif reading face. Type uses root-relative units: body 1rem, secondary 0.875rem, provenance 0.75rem. The unchanged selected GOAT white logo identifies the header. The actual supplied Free Throw preview is the one game image; local approved portraits support real player identities.

## Composition and interactions

At 1440px the court plan and personal/public desk share a continuous bordered sheet. The current matchup spans its base, with known `0.0` and unknown `Pending` visibly distinct. Subsequent sections have a left reference gutter, an open content field, fine rules and numbered/lettered headings. Dated editorial uses three compact columns. The ten-team directory integrates all ten modeled league faces into working rows rather than a separate gallery. Full rosters and full member valuations use native details.

At 390px and 320px the drawing, desk and matchup stack. The left references become section headers; names and data wrap. The court retains the same section links and a readable text key. Native Navigation expands in document flow on phones and closes with Escape, restoring focus to its summary. The direct Stocks link remains visible. Directory search matches teams, managers and all player names; player searches open the matching roster. Team and standings sorts actually reorder their respective rows. Clear search restores all ten teams.

The lettered SVG links have transparent hit rectangles measuring approximately **44.88 × 44.88 CSS px at 320px** and 56.73px at 390px. Native actions and disclosure controls have a 2.75rem minimum target. Inline prose/profile links retain ordinary text-link behavior. Focus uses a visible cyan outline. There is no animation, autoplay, modal, generated-on-render AI or external runtime request. Reduced motion retains all information.

## Data and states

- All current records, scores, prices, form, news, moves and AI stay visibly labelled synthetic; complete source notes and the fixture inventory remain accessible.
- The current pair comes from the current directory matchup. October 5–11 draft editorial, its original story context and NBA/college stat periods remain separately dated; they are not current official Week 2 awards.
- Members retain identity, manager, standing, roster count, modeled FAAB total/basis, computation and roster-check timestamps, priced/unpriced coverage, value rank, top three values and all 24 player values. Recorded team-value history is explicitly unavailable.
- The notebook separates observed EMA fantasy form from modeled prices and dated editorial opinion. Completed Week 2 best/rough lists preserve points, GP, source period, five-player coverage and overlap qualifications. Team wire and recent moves remain separate synthetic records.
- All five saved AI rows preserve the actual returned away-team choice, 35% away / 65% home distribution, independent 20% confidence, timestamp, model, prompt version and supplied evidence. Missing input snapshots and result evidence say unavailable. Stale output is labelled before opening details. Missing or unmatched saved output keeps all five current matchup references and prints Unavailable without zero probabilities.
- All ten current directory rows retain managers, records, opponents and all **228 unique player profile links**, including position and NBA team. Unknown NBA teams retain an explicit unavailable label. Prior-season records include NeuralNets’ previous-manager attribution.
- All ten standings rows retain rank, W, L and PF divided by 100. League statistics and Lineup Power remain unavailable. Stocks, trade analyzer, transactions, Arcade, actual Free Throw route, both dated weekly archives and source explanations remain accessible.

## Checks and limits

Installed Chromium with Playwright inspected this static HTTP preview on port 4206. See `CHECKS.json` for the recorded results.

Both public and member views passed at **1440, 390 and 320 CSS px**. A separate actual text enlargement changed the root from **16px to 32px**, with the body likewise doubling from 16px to 32px. All disclosures were open, including Navigation, the member valuation, five AI provenance rows, all ten full rosters, editorial selections and source notes: 22 open details in member mode, 21 in public mode. All twelve combinations had document width equal to the viewport and no offscreen elements. Full-page initial desktop/phone renders and viewport crops of the opening and the expanded 320px doubled-text roster were visually inspected.

Verified counts: 10 directory containers, 10 modeled faces, 5 ready/stale saved AI hooks, 24 member values, 228 unique roster player links and 10 standings rows. Compared every player ID, supplied name, position and NBA team with the fixture. Public view has zero personal areas. Search, Clear, directory sort, standings sort, keyboard Enter/Escape and navigation focus restoration were exercised. Ready, stale, missing and an in-browser unmatched-week response were checked. The game preview decoded at its actual 1248px source width. Browser page errors and external runtime requests: zero.

Contrast calculations for the actual opaque roles: white/cobalt 11.80:1, secondary/cobalt 8.48:1, secondary/raised 7.20:1, cyan/raised 8.00:1, deep/cyan primary actions 11.36:1 and control boundary/deep 6.73:1. The brightest grid intersections remain blue; a conservatively brighter `#193f96` intersection gives secondary text 6.66:1. Decorative fine rules do not convey control states.

This is static fixture evidence, not authenticated production Next.js routing, live data, actual-device or spoken-screen-reader acceptance. Production destination routes were preserved but their remote workspaces/game flows were not exercised by this static preview. No dependency install, network API call, shared style, production source, Git operation or deployment was performed. No remaining implementation blocker is known.
