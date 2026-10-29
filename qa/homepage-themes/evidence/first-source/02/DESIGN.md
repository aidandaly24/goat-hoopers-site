# 02 — RAW MONOCHROME

Source-ready independent homepage study. Scope is this folder only. This study follows the explicit twenty-theme QA exception to the production Paper + Slate palette; production tokens, routes, architecture and source data are unchanged.

The page is a black-and-white sports document: blunt Archivo Black week numbers and section titles, compact Space Mono labels and aligned values, heavy horizontal cuts, asymmetric numbered margins, rectangular controls, and open lists. It uses no rounded cards, gradients, shadows, ornamental charts or decorative interaction. Large alternating black and white sections organize the complete page rather than applying a dark hero above a generic dashboard. Real grayscale portraits support the actual names; the approved arena is a small documentary still. The unchanged selected black GOAT logo remains recognizable.

## Surface contract

- User question: What matters for my team and this league this week, and where can I inspect the underlying roster, price or saved decision?
- Primary action: My team for members; Find a team for public readers. Stocks remains directly reachable in the header.
- Relevant states: public/member; known 0.0 versus Pending scores; incomplete current matchup; dated draft editorial; completed-week synthetic form; ready/stale/missing/unmatched saved AI; complete/partial/unpriced valuation; unavailable history, league-stat producers and Power.
- Narrow layout: numbered margins become small section labels, asymmetric columns stack, names wrap, roster disclosures become one readable column, standings keep rank/name/W/L/PF, and native navigation expands in document flow. Every disclosure retains its full contents.
- Forbidden patterns: invented results or history, inferring an AI winner from the largest probability, calling the dated picks current awards, removing roster players, generated photos, fake game controls, microscopic body copy, fixed overlays covering content, and autonomous motion.

## Type, color and composition

The palette uses `#000000` and `#FFFFFF` only. All text/control/focus roles resolve to those opposite surfaces, giving 21:1 opaque contrast. The approved photos retain grayscale tonal detail; no text is placed over a photograph. Focus uses an offset 3px ring; the primary white button on black has a white focus ring outside its black-page boundary.

Archivo Black is the official locally hosted OFL font at `/qa/homepage-themes/assets/fonts/archivoblack/ArchivoBlack-Regular.ttf`. Space Mono is locally hosted from `/qa/homepage-themes/assets/fonts/spacemono/SpaceMono-Regular.ttf`, also OFL. Arial/Helvetica body text remains readable at 1rem. Metadata starts at .75rem; secondary headings/controls are .875rem or larger. All type sizes use rem, so changing the root from 100% to 200% doubles their computed size. There are no viewport-sized fonts.

The wide page leads with the actual current Week 3 fixture pairing, its known/pending scores and both managers/records. The personal desk sits in a narrower adjoining column. The rest of the page uses a large numbered left margin: scouting, member valuation and form, saved AI, dated editorial, all ten roster anchors, the directory, standings/transactions, working tools and both archive entries. Alternating full-width black and white sections make the page feel deliberately printed and cut rather than composed of repeated cards. Portraits are 44–80px supporting evidence, never full-page decoration.

The current pairing appears once as a complete score presentation. The saved-model section keeps all five pairings and explicitly prints the actual returned choice: the first row chooses Ware the Hoes At? at 35%, while Reaves Dropper has 65%, with separate 20% confidence. It retains generation time, ordered roster IDs, league/season/week, model/prompt, supplied evidence and honest unavailable input-snapshot timestamps in native details. A stale label is visible before any disclosure. Missing and unmatched output keeps the current pairings visible without invented probabilities.

The member value disclosure contains all 24 values and complete coverage, alongside the top three current modeled values, pricing basis and computation time. Five unique completed-week players preserve the overlapping best/rough selections once per player, with points, GP, exact period and eligibility coverage. All ten league faces, all 228 unique roster links, previous-manager attribution for NeuralNets, all ten standings rows, current synthetic moves, original dated spotlight stats/reasons/sources, and both archived files remain present.

Navigation uses links and native nonmodal details. Enter opens it; Escape closes and returns focus to its summary. Search matches team, manager or any roster player; Clear restores the directory and returns focus to search. The directory can sort by rank, name, roster size or PF. Standings can sort by rank, wins, losses, PF or name, with stable rank tiebreaks. All incoming identities/content use HTML escaping. Market-price links lead to the real `/stocks` market; they do not claim to restore a preselected inspector. Free-throw practice links to the actual game route.

## Verification tied to this source

`index.html` SHA-256:

```
e95c05048474d14043ccbbb8f608b648d31c9e93960c67f5bfe6be6829e2aadf
```

Evidence is **local static browser fixture**, using installed headless Chromium through Playwright against `http://127.0.0.1:4206/qa/homepage-themes/directions/02/index.html`. It is not a real Next route, authenticated session or live-data test. Machine results are in `CHECKS.json` with the same source hash.

Performed:

- Member and public at 1440, 390 and 320 CSS pixels; each at root 100% and 200%, with **every native disclosure open**, including navigation and footer. All twelve cases have document scroll width equal to viewport width and no measured internal element overflow. Computed body text is 16px and 32px respectively. This tests root text enlargement separately from narrow CSS reflow, not browser zoom.
- Correct default inventory: ten directory containers, 228 roster links with 228 unique URLs, ten modeled faces, five saved AI rows, 24 member values, ten standings rows, two archives; local display/mono fonts loaded.
- Keyboard Enter opens navigation; Escape from its content closes it and restores summary focus.
- Team search NeuralNets returns team 8; manager search aidandaly20 returns team 1; player search Niederhäuser returns team 2. No-results and Clear states work. All directory and standings sort options were exercised; wins/losses tie in this fixture, so stable rank order is expected.
- Stale AI keeps five saved-row hooks and shows a visible stale message. Missing AI has zero saved-row hooks and a visible Unavailable message. Both were checked at 320 CSS pixels and 200% root with disclosures open.
- An isolated browser response interception changed the imported fixture's weekly week to 99 without modifying shared files. All five current pairings remained and each saved output read Unavailable, with zero saved-row hooks. This exercises the unmatched guard.
- Reduced-motion emulation retains all 228 roster links. The page has no animation, observer, ticker or save-data-dependent content removal.
- No JavaScript page errors and no external runtime requests during the checks.
- Visual inspection covered the desktop hero, open directory, phone saved-AI rows and a complete desktop page through the open footer, with member value, AI provenance and NeuralNets roster disclosures open. `full-check.png` is the final-source full-page inspection capture; it is supporting fixture evidence, not a production acceptance claim.

Not performed: screen reader or physical-device review, browser zoom, real Next navigation/history restoration, authenticated data/API behavior, live stock inspection, or gameplay/reset/exit. Destination URLs were preserved in the static fixture; the complete production flows are outside this isolated source-only QA scope. Root owns the independent complete capture and pairwise theme comparison. No commit, PR, integration, deployment, install or external call was made.
