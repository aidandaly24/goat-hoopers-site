# 09 — Playground League

An independently authored, isolated static QA direction. The latest theme brief authorizes sky blue, peach, grass and magenta, Bungee display type and original court linework here. Production Paper + Slate tokens, components, routes and configuration were not changed. No other theme or older mock was inspected.

## Design contract

- **User question:** What is happening in my matchup, and where do I go for my next roster or league decision?
- **Primary action:** Member: View roster, beside the actual current matchup. Public: Explore the teams. The illustrated court is also a useful HTML anchor map to scouting, league faces, standings and tools.
- **States:** Member and public compositions; ready, visibly stale and missing AI; unusable/unmatched saved input falls back to unavailable; known 0.0 distinct from Pending; incomplete matchup distinct from final; dated draft sample editorial separate from current fixture information; missing edition fallback; unavailable recorded value history, Power and league stats; directory search results and empty results.
- **Narrow layout:** Matchup, original court map, member/public desk, notebook, saved AI, dated edition, league faces, full directory, standings, tools, archive and footer. Two-column league faces remain compact. Directory controls and full rosters stack. Phone standings retain a semantic HTML table with compact rows and visible Rank/W/L/PF labels. No fixed chrome or internal scrolling panel.
- **Forbidden patterns:** New figurines, external illustrations or runtime requests, fake controls, fabricated scores or awards, inferred AI winner, fake value-history chart or Power ranking, anonymous current-season attribution for previous managers, hidden roster loss, production imports or shared styles.

## Visual decisions

The sky canvas is `#a8d9f4`; peach `#ffbf9e` holds the matchup and member values; grass `#abd687` belongs to the curved court map and league-face band; magenta `#a52669` identifies the saved AI experiment. Deep blue ink `#192f3e` unifies the illustration, text, controls and restrained offset shadows. Light sky, peach and grass tints provide opaque reading surfaces. Broad asymmetric curves continue through the whole page, rather than stopping at the hero.

Bungee is loaded locally for short display headings and prominent numbers. Local DM Sans supplies rounded, readable body text. Both come from the approved font catalog under SIL OFL 1.1. Body type starts at 1rem; secondary type is roughly .9rem; metadata is .8rem or .75rem. All typography uses root-relative units. Existing approved GOAT SVG marks, player portraits and the actual free-throw preview remain unchanged. Portraits and the game image load lazily.

The original inline SVG depicts a tilted peach-and-sky playground court, a grass island, court markings, a ball and a dashed route. It contains no facts or controls. The map's four actual anchor links and all essential information are HTML. The illustration is static and decorative to assistive technology.

The wide composition pairs the current score desk with the organic map. The peach sideline connects personal identity and modeled value in one broad surface. Observed form and the team wire form a different reading rhythm. A broad magenta AI band, an open dated editorial spread, a grass face strip, blue directory rows and peach standings make the entire page part of the theme.

## Information and behavior

- All ten directory containers, ten modeled faces, 228 unique roster player destinations and all 24 member roster values are retained. Every directory player includes position and NBA team. Search covers team, manager and every roster name. Sort changes current standing, team name or roster count; standings sort changes rank, points or name. Search hides existing team containers without removing their roster markup.
- Current pairing comes from `currentMatchup` / the member summary, with both managers, records, scores, week and incomplete state. The dated edition's conflicting game IDs and original story are available as source context and never derive the current pairing.
- The member desk retains modeled FAAB total, calculation basis, top three values, rank, priced/unpriced coverage, computation and input times, complete roster value disclosure and unavailable history. Member observed form, completed-week best/rough lists, periods/GP/coverage, team news and moves are retained. Public view contains no `data-personal` sections and keeps league context.
- Five ready/stale saved rows preserve the returned away choice at 35%, home 65%, independent confidence 20%, saved time and source metadata. Model/prompt/input/evidence disclosures preserve unavailable snapshots. Missing output leaves the five current pairings visible without saved-row hooks or fabricated probabilities.
- Dated player opinions, actual supplied stats, periods, selection reasons, source dates, happenings, both archive destinations and the prior-manager QBs Gremlins attribution remain accessible. The footer links the complete common inventory JSON and offers an in-page source disclosure.
- Header Menu opens with Enter, closes with Escape and restores trigger focus. Hidden links leave keyboard navigation. Native details handle rosters, values and source evidence. Skip access, visible focus, real navigation destinations and 44px action/disclosure targets are present. Ordinary inline editorial/profile text links use the inline-link exception.

## Verification — local Chromium static fixture, 29 October 2026

Checked the final `index.html`, `playground.css` and `playground.js` through `http://127.0.0.1:4206/qa/homepage-themes/directions/09/index.html` with installed Chromium/Playwright. No installs or external services were used.

- **Member and public at 1440, 390 and 320 CSS px:** document widths exactly 1440/390/320. All disclosures open: the same widths. Actual `document.documentElement.style.fontSize='200%'` gives 32px root and 32px body, with every disclosure open: the same widths at all six view/width combinations. No page-level overflow. Narrow enlarged-value and standings wrapping issues found during implementation were corrected before the final check.
- **Hooks and content:** 10 `data-team-id`, 10 `data-face`, 5 ready/stale `data-ai-pair`; 24 items in the member `data-roster-values`; 228 unique full-roster player routes. Public has zero personal sections and no personal value list. Missing AI has zero saved hooks and five current pairing articles.
- **AI states:** ready, stale and missing rendered for both views; stale warning visible above rows; missing probability/confidence explicitly unavailable. First returned pick verified as Ware the Hoes At?, with 35% versus Reaves Dropper 65%, confidence 20% and saved timestamp intact.
- **Controls:** keyboard Enter/Escape and focus restoration passed. Searching Kasparas Jakučionis yields the 27-player roster 2; GriffinHealy yields roster 6; a nonexistent term yields zero results; Clear restores ten teams and focuses the input. Roster sort starts with team 2; name sort starts with Huff n’ Puff. Standings name sort starts with Huff n’ Puff.
- **Assets and runtime:** both local fonts loaded. All 16 image elements returned nonzero natural widths after full-page scrolling, including both logo variants and the actual game preview. No JavaScript errors, failed asset responses or external runtime requests observed. Reduced motion retains all data and has no animation to suppress.
- **Visual inspection:** own 1440 desktop opening, full 1440/390 page compositions, phone opening and court map, lower standings/archive/footer areas. Full-page captures initially precede below-fold lazy images; scrolling confirms real portraits and game preview. Root owns bulk final captures.
- **Contrast calculations for rendered opaque pairs:** ink against all six light surfaces 8.37:1–11.80:1; secondary text 4.88:1–6.88:1; control-line color 3.09:1–4.36:1; light labels on magenta 6.47:1 and on dark ink 13.14:1. Dark focus on light surfaces is at least 10.05:1. AI/footer inverse actions use a white focus outline and switch to dark text on a light hover fill; hover and focus computed styles were checked.

## Limits

This verifies an offline static fixture, not live league data, authentication, Next routing, deployment, actual game input, browser Back/Forward behavior, a physical device or a screen-reader session. Destination hrefs match existing application routes, but the root static server does not establish their production behavior. The source fixture intentionally contains synthetic current data, null producer/history inputs and dated sample editorial. No source data was changed or inferred to remove those limits. No production build is needed for these isolated HTML/CSS/JS files. No Git, PR, install, production or shared-file operations were performed.
