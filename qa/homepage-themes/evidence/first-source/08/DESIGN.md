# 08 — Swiss Sport

This is an independently authored QA homepage, confined to this directory. The latest theme-experiment instruction permits this white, ink and vermilion treatment instead of the production Paper + Slate palette. No production token, component, route, data loader or configuration is changed.

## Surface contract

- **User question:** What matters for my team this week, and where can I inspect the rest of the league?
- **Primary action:** My team for members; Find a team for public readers. Stocks remains directly reachable in the header at every width.
- **Relevant states:** Member/public; current incomplete matchup with a genuine 0.0 and a separate Pending score; complete/partial modeled pricing; missing recorded value history; ready/stale/missing/unmatched saved AI; unavailable league measures and Power; dated draft editorial; empty directory search.
- **Narrow layout:** Section indexes join their labels above the content. The member identity follows the week heading. Matchup scores stay aligned to their team names. Columns become an ordered reading flow, and full rosters become one-column lists. Navigation uses a native disclosure with Enter, Escape and focus restoration.
- **Forbidden patterns:** Cream paper, a giant masthead, repeated boxed cards, ornamental gauges, invented history or rankings, inferred AI winners, zero-filled missing values, fabricated game controls, hidden roster fields and generated imagery.

## Visual construction

DM Sans carries every type role, with a local variable font and tabular numerals. Bright white `#ffffff` occupies most of the page. Ink `#151818` carries content and section rules; vermilion `#ce2d1d` marks section numbers, the week number, states and the primary action. Secondary text is `#555c5c`. The small amount of `#f3f5f5` only grounds portraits and menu depth.

The wide page is an asymmetric index and content grid, with the useful information aligned to a common starting point. The lead matchup takes most of its row; a small monochrome court crop sits to the right. Roster value, scouting, editorial and the working lists use different column proportions on the same grid. Plain rules guide reading; sections do not become cards. The logo stays the supplied recognizable black variant. Local portraits retain their original identity.

The largest type levels are the week and modeled roster total at 3.5rem. Section headings are 2rem, body text 1rem, data and explanatory copy .875rem, and provenance .75rem. All type is root-relative. Narrow layouts use 3rem for the week/value and 1.75rem for section headings. Body text doubles when the root is enlarged to 200%.

## Information and behavior

The feature resolves the current matchup from the directory, selecting the member’s own team in member view. Current scores, managers, records and Week 3 are separate from the Oct 5–11 draft edition. Known 0.0 and Pending remain distinct.

The member edition preserves the modeled total, coverage, computation time, rank, supplied top three, all 24 player values, observed-form watch, completed-week high/low lists, periods, GP, cohort coverage, team wire and recent move. The public edition contains league context without member-only content. The third dated spotlight lives in the scouting notebook, with its full statistics, opinion, source and selection reason; the other two remain in the dated edition.

All ten league anchors have team, player and Stocks links. Stocks links use the real `/stocks` route; this page does not invent an unsupported player-selection query parameter. The directory retains all 228 unique linked players with position and NBA team. Team, manager and player search filters the real rows; matching player rosters open automatically. Sorting supports current standing, name, roster size and prior finish. Prior-season attribution for NeuralNets explicitly names the previous manager and QBs Gremlins. Standings retain ten rows and divide source PF by 100. Both archive entries retain their dates, titles and routes.

All five saved AI rows match the current league, season, week and ordered team IDs. The returned choice remains the away team even when its probability is 35%; the home team’s 65% is shown independently. Confidence remains 20%. Saved timestamp, model, prompt version, IDs, input snapshot availability and evidence are accessible in native details. Stale status is visible before opening anything. Missing or unmatched rows show Unavailable, with no inferred percentages. The page never generates or fetches AI.

Complete fixture details remain reachable through the footer’s explanation and the original inventory JSON. Null league measures, Power and recorded value history are explicitly unavailable. No chart or trend series is drawn.

## Verification

Evidence is from this standalone static fixture in installed headless Chromium through Playwright at `http://127.0.0.1:4206/qa/homepage-themes/directions/08/index.html`. It is not a production Next route or an authenticated backend test.

- The final matrix covered 24 member/public × width × AI/text-size states and 48 closed/open disclosure cases at 1440, 390 and 320 CSS pixels, including the opened navigation. The complete document, directory rosters, source disclosures and footer were inspected. Horizontal document overflow was zero at every checked width.
- Root text enlargement was set with `document.documentElement.style.fontSize = '200%'`, independently of viewport reflow. Member and public layouts at 1440, 390 and 320 were checked with all disclosures opened, with zero horizontal overflow. A cramped phone directory record label and an enlarged-text header overflow were corrected before final verification.
- All audit inventory counts pass: 10 directory containers, 228 roster links representing 228 unique player routes, 10 faces, 24 member roster values, 10 standings rows, and 5 saved AI pair hooks in ready/stale states. Public rendering contains no personal areas. Missing AI contains zero saved-row hooks and preserves all five current pairings.
- Native menu Enter opens, Tab reaches its first link, Escape closes and returns focus to the summary. Search for Bruce Thornton returns team 1 and opens its roster; manager search for GriffinHealy returns team 6; a nonexistent term produces the explicit empty state. Roster-size sort starts with team 2, previous-finish sort starts with team 5, and ascending PF starts with team 10 at 271.0.
- Both member/public ready, stale and missing AI variants were exercised. The first ready pick remains Ware the Hoes At? at 35%, alongside Reaves Dropper at 65%, with independent 20% confidence. Injected unmatched team IDs remove only that saved result (four saved hooks, five current rows); an injected unmatched league removes all saved hooks while preserving five current rows. Both cases show Unavailable instead of percentages. No browser exceptions, failed local asset requests or external runtime requests were observed.
- Visual inspection covered the opening, roster valuation with all values expanded, scouting/anchors, dated edition, saved AI, directory with an expanded full roster, standings, tools/archive and opened source footer. Local inspection captures are temporary `/tmp/08-swiss-*.png` files; the root author owns the review capture set.
- Contrast calculation uses the actual opaque CSS pairs: ink/white 17.86:1; secondary/white 6.84:1; vermilion/white 5.23:1; white/hover action 7.23:1; control boundary/white 4.33:1; secondary/portrait ground 6.25:1. Focus is a 3px vermilion outline. Standalone controls and navigation actions have a 44px minimum height at normal root size. Inline prose citations and linked data references use inline-link target exceptions.
- `node --check page.js` passes. This static-only change does not require the production build or application suite.

No screen-reader session, physical-device check, production navigation/Back-Forward restoration, authenticated route or playable-game session is claimed. The links preserve those destinations; the static server is not the application runtime. No autonomous motion or canvas is used; reduced motion and save-data retain all information.

## Runtime source identity

These SHA-256 values bind the recorded runtime evidence to the delivered implementation. The source-ready response also records a digest of all four deliverable files, including this document.

| File | SHA-256 |
| --- | --- |
| `index.html` | `127deb0f2a7a5a7df079488a0756f6bc53061d2202d9d182b69a4e4857ce7032` |
| `style.css` | `7a621f0028c49cfb9077835bd95231d138e9214c564f97b198fa3ca8a22b064b` |
| `page.js` | `edd5a4d8554c6ec31b0812afee473f23ed3807dc3972683defdfb05a020bc8f1` |
