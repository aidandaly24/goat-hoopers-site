# 01 — Homepage correction

Frozen local-only, 2026-10-29. The existing polished/01 source and captures remain preserved. This correction owns only `homepage-corrections/01/**`; no production/shared data, Git operation, service, external asset, dependency installation or remote write was used.

The user question is “What is happening in our league, and what should I read or do next?” The primary member action is My team; the public action is Meet the league, with Stocks directly available in both editions. The original open almanac remains: white/ink/vermilion, local Lora reading/display and DM Sans operations, continuous editorial spread and marginal context. The correction composes a complete front page instead of leading with a long model experiment and a full roster index. All core stories, all five scores, all ten standings, the member quote/form content, dated wire, archive story, play preview, tools and footer exist in normal document flow on load. `CONTENTS.json` maps the actual visible content.

On phones the same material uses compact labeled rows and a single reading flow. The open contents remain visible, and no essential content depends on a tab, menu, drawer, modal, search or internal scroller. Native disclosures add provenance to existing visible choices and stories. Full rosters remain destination links; 228 player names are not printed to fill the homepage. No common template/helper or other concept source was consulted or changed.

Relevant states remain explicit: member/public, saved/stale/missing AI, a known 0.0 versus Pending, an unpublished dated October opening draft versus current synthetic November Week 3, a historical 2025 final, previous manager record, incomplete/missing producer evidence, unavailable lineup power and recorded team-value history. The saved model's returned away choice remains 35%, the other side remains 65%, and independent confidence remains 20%; the page does not choose the probability maximum. Both probabilities and exact provenance remain in source-note disclosures.

Semantic color/font/type/spacing roles are declared in `style.css`; selectors consume them. Solid white/ink is 17.58:1, muted/white 7.46:1, vermilion/white 5.97:1, calculated from the declared colors. This covers these solid text/focus roles, not a universal image or accessibility audit. No authored motion, negative tracking, italic emphasis, gradient or page-overflow suppression was introduced. The only clipped element is the conventional screen-reader-only table caption; it is not a content reader or layout repair.

References read: `AGENTS.md`, the architecture map and relevant homepage/personal/data/UI contracts in `ARCHITECTURE.md`, `DESIGN.md` composition/type/control/responsive/content/acceptance/personal decisions, `.agents/skills/goat-hoopers-design/SKILL.md` plus visual-hierarchy and navigation-accessibility references, this concept's own `polished/01/ART.md` and source, and `reference-notes/craft.md` recording the actual supplied primary studies. The concept-specific user direction supplies the white/Lora/vermilion exception to the production Paper + Slate theme. No new design decision was written into shared guidance.

## Verification

`node qa/homepage-structures/homepage-corrections/01/check.mjs` runs the bounded local Chromium evidence in `CHECKS.json`:

- 12 initial renders: public/member × 1440/390/320 CSS pixels × normal/200% root text (`html { font-size: 200% !important }`, computed root 32px).
- Zero page errors, horizontal document overflow or internally scrolling main content readers across those renders. Five pairing rows and ten standings retained in both editions; personal page present only for member.
- Stale/missing model states at 390px retain all five score rows; stale retains five provenance disclosures, missing renders none and states no inferred choice/probability.
- Expanded disclosures together at 320px and 390px with 200% root text retain zero horizontal document overflow/readers.
- Actual keyboard Enter opens/closes saved-pick provenance and retains focused summary with visible vermilion outline. Keyboard activation of The clubs navigates to its ordinary anchor without chrome covering the target.
- Reduced motion has zero authored animations and zero hidden essential sections. Five existing local images decode and both local fonts load before the ready marker.
- Actual 1440/390 browser openings and wide notebook/ledger/back-page sections visually inspected; five viewport evidence images are local check captures, not the parent's final full-page captures.

Normal 1440px document height is approximately 5,094px member / 3,938px public. Root owns the four final full-page captures and independent review. This is a static fixture, not production Next routing, real authentication, live provider output, actual-device zoom or screen-reader evidence. Links point to the existing destination contracts; gameplay and production routes were not launched from this static server. No release or final user acceptance is claimed.
