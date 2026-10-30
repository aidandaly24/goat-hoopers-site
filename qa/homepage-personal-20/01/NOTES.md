# Concept 01 — Current author notes

## Scope and product revision

The current deliverable is the dark sports revision of the same independently authored concept 01. The first neutral utility/table composition failed the early product gate. The implementation was reworked across architecture, typography, proportions and visual content rather than recolored. The earlier baseline is preserved in Git history at `fd9df451`.

Only `qa/homepage-personal-20/01/` was written. No peer source, pilot or rejected prototype implementation was inspected. The shared fixture is data only. Production files, other owners, external publication and live services remain untouched.

The first three actions are matchup, players/roster, and competition. These determine the actual page: arena-backed current pairing; team pulse; approved roster portraits and completed-week points; the other four pairings; a focused three-team race; original game preview and GOAT destinations; useful footer. Full 22/24-player roster and ten-team standings live in meaningful local inspection views rather than forming the homepage spine. Primary content is visible in normal page flow, with no internal page reader, carousel or hidden tab dependency.

## Materials and references actually read

Read the assigned `01.md`, `AUTHOR-BRIEF.md`, `PRODUCT-INVENTORY.md`, fixture schema/data, root `AGENTS.md`, relevant `ARCHITECTURE.md` homepage/data/access/ownership contracts, `src/app/page.tsx`, `CourtsideHome.tsx`, `personalized-home.ts`, `home-viewer.ts` and `siteDestinations.ts`. Re-read the original author brief for this revision. Demo persona selection stays separate from actual server-resolved membership.

- [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt): read the full substantive text through Verify Adaptations and its inline responsive reference. Selected desktop/context, content-driven breakpoints and hover independence principles. Concrete effects: simultaneous useful sections; visible native actions; text-sensitive flex/grid tracks and natural reflow at narrower desktop widths. Its mobile/print advice did not prescribe this desktop-only study. No installation or scripts.
- [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design): read the complete textual article, including Metaphors, Spatial Consistency, Frequency & Novelty, Scroll Landmarks, Implicit Input and Fitts’s Law. Embedded video/interactive behavior was not tested. Concrete effects: immediate frequent inspection with no entrance animation, actions next to their subjects, preserved Back/search/scroll/focus context and clear page landmarks. No gesture or kinetic effects were copied.

## Visual and type decisions

The approved original GOAT arena is the setting behind actual team/opponent scores, not a decorative headline. The right-hand player is explicitly labelled as a roster member and opens player context; it does not suggest a confirmed lineup. Player portraits continue the identity through the body. The actual game preview is shown at its full aspect ratio, followed by a clearly external arcade action. The exact supplied white logo is retained in header/footer.

Local licensed Oswald supplies mixed-case display/team hierarchy, roughly 39–61px in the normal desktop layouts, with 20–26px player and team subheads. Arial/Helvetica supplies 14px primary descriptions/controls, 13–14px reading lists and 11–12px supporting metadata. IBM Plex Mono supplies 38–44px hero scores and consistent numeric scan lines elsewhere. Long names wrap without truncation; explanations keep a bounded measure. Display type never takes over the longer reading text. Font bytes are reused from the authorized local catalog with SIL OFL 1.1 notices left in place; no font/asset download occurred.

The charcoal background, warm light type and restrained green accent support sports identity throughout. Readable focus outlines and native controls remain visible. Reduced-motion users receive identical content without animation.

## Persona and source behavior

Reaves receives its scored matchup, saved 56/44 model context with separate confidence 0.35, roster portraits, five counted-player observations and the early-table slice. NeuralNets receives a different opponent, Pending versus recorded 0.00, three counted observations, different portrait selection, a lower-table slice and a quiet partial roster subtotal. Guest receives public team/player discovery, the complete five-pairing picture across hero/slate, league leaders and real-site sign-in, with no claimed private roster.

Quotes remain synthetic FAAB estimates. Reaves’ complete 24/24 own-roster pricing does not establish a league value rank. NeuralNets’ 16/22 subtotal is partial; unpriced is never zero. Missing player evidence does not become zero or current availability. No team-value history or Lineup Power is invented. The 2025 final retains its historical period, and NeuralNets’ 2025 franchise record retains the previous-manager/QBs Gremlins qualifier.

All 15 existing destinations remain discoverable in the semantic footer. External links have diagonal arrows and explicit current-site context. Local inspection makes no production behavior claim. The visible Synthetic demo label opens the source/limits explanation. `data-persona` is explicit; `data-personal-study-ready="01"` is set after fonts and images settle. `?stage=structure` neutralizes palette/images while preserving full content and geometry.

## Actual bounded verification

`node --check qa/homepage-personal-20/01/app.js` passed. The authored `verify.cjs` probe passed using system Chromium 154.0.8037.57 through Playwright. Exact final results are in `verification.json`.

- All three personas loaded at 1440 × 1000 and 1120 × 1000 CSS pixels with zero page/HTTP errors, document overflow or visible text ranges outside the viewport. Each contains four other pairings, a three-team league slice, no homepage tables and all 15 footer destinations.
- True text enlargement was tested for every persona at 1120px: snapshot each HTMLElement’s computed font size, then apply twice that original size, excluding screen-reader-only text. Root rem size was unchanged. All three retained document width 1120px and zero visible text ranges outside the viewport. This is desktop text emulation, not physical-device or browser-zoom evidence.
- Keyboard Enter opened matchup context; 56/44 and separate 0.35 confidence were visible. Escape restored trigger focus.
- Full Reaves roster has 24 rows. Search, quote inspection, Back with filtered search and row focus, no-result message, clear and Close-to-trigger passed. Team → roster → player → Back → Back restored the team’s roster-action focus.
- Full local standings has ten rows; the NeuralNets public profile retains the previous-manager qualifier. Persona switching correctly loads its 22-player roster, partial subtotal, unpriced AJ Dybantsa and missing saved AI.
- Structure mode preserved the same measured geometry for hero, pulse, players, slate, race and beyond sections. Reduced-motion preference retained content.

Visually inspected temporary full-page screenshots of the dark Reaves and NeuralNets pages, enlarged Reaves/guest first folds, and final Reaves at 1440 plus guest at 1120 after the type/image adjustments. These local checks are not delivery captures; root owns final captures. Physical devices, Safari/Firefox, actual GOAT destination behavior and live authentication/APIs were not tested. A production build is unrelated to this static QA-only scope.

The revised source is ready and frozen for root capture. No remaining blockers. Only concrete review findings will trigger further edits.
