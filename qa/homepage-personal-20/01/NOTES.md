# Concept 01 — Author notes

## Ownership and source boundary

Independently authored in `qa/homepage-personal-20/01/`. No peer implementation, prior prototype or rejected catalog was inspected. The shared fixture is imported as data only. Production files remain untouched. This is a QA-only static page, with no publication, external write or live data calls.

Read the assigned `01.md`, `AUTHOR-BRIEF.md`, `PRODUCT-INVENTORY.md`, complete fixture shape, root `AGENTS.md`, relevant `ARCHITECTURE.md` homepage/data/access/ownership contracts, `src/app/page.tsx`, `CourtsideHome.tsx`, `personalized-home.ts`, `home-viewer.ts` and `siteDestinations.ts`. The synthetic selector is intentionally separate from the real server-resolved membership contract.

## Public references actually read

- [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt): read the full substantive text through Verify Adaptations and its inline responsive reference. Selected principles: desktop can expose simultaneous information, reflow should follow content constraints, and functionality must not require hover. Concrete effect: rail and visible tables at desktop widths; narrower desktop reflows columns while retaining the full facts; every inspection has a visible native button. The mobile and print recommendations were not applied to this desktop-only study. No scripts were run or skill installed.
- [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design): read the complete textual article, including Metaphors, Spatial Consistency, Frequency & Novelty, Scroll Landmarks, Implicit Input and Fitts’s Law. Embedded interactive/video behavior was not tested. Concrete effect: frequently used details open instantly with no entrance animation; local row actions sit by their subject; Close/Escape returns focus without moving the page. Page landmarks and the persistent rail preserve navigation context. No kinetic/gesture styling was copied.

## Product and typography decisions

Reaves leads with its synthetic 184.50–171.00 matchup and completed Week 2 evidence. Neural leads with six explicitly unpriced players and an incomplete-score pairing; its higher partial subtotal receives no rank. Guest has public pairings and standings, with a real-site sign-in exit rather than a claimed private team.

Barlow Condensed is limited to 26–45px display/section hierarchy. Arial/Helvetica provides familiar mixed-case reading at 16px, 13–14px dense supporting copy, and controls. IBM Plex Mono supplies consistent numeric scan lines and 35–43px scores. Table/player names keep readable wrapping; line length for explanations stays around 45–68 characters. The local font catalog records SIL OFL 1.1 provenance; font bytes and license notices are reused in place, with no download. Native controls retain visible focus. Reduced-motion users receive identical content with no animation.

Local dialogs show supplied score, player evidence, quotes, source limits and public team context. Full roster data stays in document flow and supports local name/position search. Missing prices stay “Unpriced”; absent player evidence stays “No evidence”; the recorded Papichooter zero remains numeric. No quote trend or Lineup Power is invented.

`?stage=structure` neutralizes palette and images while preserving content and geometry. `data-persona` and `data-personal-study-ready="01"` expose settled state. All real-site links visibly include ↗ and open a separate tab; all existing destinations remain in the footer.

## Verification

Passed `node --check` and the authored `verify.cjs` browser probe using system Chromium through Playwright. The exact results are in `verification.json`.

- Reaves, NeuralNets and guest each loaded at 1440 × 1000 and 1120 × 1000 CSS pixels, with no page/HTTP errors and no horizontal document overflow. All 15 existing destinations are discoverable in the footer.
- Reaves shows 24 roster rows; NeuralNets shows 22 rows and six missing quotes; guest shows all five matchups and no private roster. The corrected shared fixture is used: complete Reaves own-roster pricing does not produce a league valuation rank.
- Keyboard Enter opened matchup detail; the 56/44 saved model estimate and separate 0.35 confidence were visible. Escape closed and restored trigger focus.
- Team → player → Back restored the team view and player focus. Closing returned to the original page team trigger. Name search, no-result state, clearing search, price inspection and demo-persona navigation passed.
- NeuralNets at 1120px with CSS root text enlarged to 200% (32px) retained content and had no horizontal document overflow. This is text-size emulation, not a physical-device or browser-zoom claim. Reaves was also visually checked at that text size.
- Structure mode retained the same 24 roster rows and marked its neutral palette state.

Visually inspected local temporary screenshots for Reaves at 1440, NeuralNets at 1440, guest at 1120, and enlarged Reaves text. Root owns final delivery captures. Physical devices, Safari/Firefox, real authentication/APIs and behavior after exiting to the current GOAT site were not tested. No live API, external auth or mutation calls were made.

Source is ready and frozen for root capture after these checks; only concrete review findings will trigger changes.
