# Direction 11 — League magazine

The question is “What matters this week, and what should I inspect next?” The first action for a member is My team or View roster beside their current pairing; public readers can immediately find a team. Stocks remains in the persistent navigation at phone sizes.

The composition uses an authored sports-edition hierarchy: one large current-matchup headline and meaningful arena crop, a narrow member desk with working values, a lead dated Jokić story, two subordinate player takes, and a scouting notebook. Inter supplies the display and body hierarchy; Geist Mono aligns scores, records and modeled FAAB. Paper + Slate tokens are the only UI color system. Photography stays in bounded useful crops with no text over the arena. Sections and aligned rows replace repeated marketing cards.

All common inventory remains: complete member valuation disclosure, form and completed-week lists, member news/moves, dated editorial sources, five saved AI pairs with every probability and actual returned choice, ten faces, searchable and sortable ten-team directory with all roster links, sortable standings, unavailable stats/Power/history, transactions, market/trade/Arcade paths, two archived editions and footer destinations. The known 0.0 score and Pending opponent score are separate. October draft editorial is visibly dated and outside its period. AI confidence is separate from probabilities; stale and missing states are visible without opening provenance. The source fixture's low-probability returned choice is preserved as returned.

At narrow widths the lead precedes the member desk, editorial columns stack, portraits become compact, the directory keeps opponent and record context, and standings become a full-width compact table. Essential destinations remain in the header or native League menu; Escape closes the menu and restores its summary focus. Native details retain all rosters/provenance. There are no animations, modal interactions, external fetches or write operations. Focus styling is shared and controls target 44px; inline prose/profile links use the native text-link role.

Forbidden patterns: invented forecasts or historical lines, current-award claims for old sample stories, repeated giant pair graphics, giant athlete cards, nested card frames, fake games, rejected figurines, new fonts and unapproved colors.

Verification used installed headless Chromium through Playwright against the root's static server at 127.0.0.1:4198. Member and public rendered at 1440, 390 and 320 CSS px with no horizontal page overflow, image failures or JavaScript page errors. Each has ten directory teams, ten faces, five saved AI rows and 228 unique roster profile links; the member has all 24 valuation rows, while the public has no personal content. Expanded every main disclosure at 390 and 320 with no overflow. At 1440, independently enlarged root text to 200% and expanded all disclosures: no overflow or clipped elements beyond the viewport.

Interaction checks passed player/team search, zero-results search, record/roster sorts and standings selects, plus native menu open/Escape/focus restoration. The first Tab reaches the visible Skip to content link. Ready, stale and missing AI queries render without errors; stale and missing retain five pairings with zero ready bars. Spot-checked phone scouting, AI, directory and archive rendering. Computed opaque rendered color pairs measured using WCAG relative luminance: text/paper 12.70:1, secondary/paper 5.15:1, slate label or focus/paper 6.56:1, white/slate action 7.22:1 and control boundary/white 3.76:1. These bounded checks do not establish universal accessibility compliance. This static prototype does not establish real auth, Next routing, backend behavior, live data, gameplay or screen-reader/device compatibility. Destination links intentionally point to the application's real routes.


## Separate accessibility repair copy

This file accompanies `repairs/11/index.html`, copied from the frozen blind
submission. The initial verification above is historical evidence for the
original and did not cover the subsequently reported 390px/200% failure.
The separate repair preserves the visual direction and all source content while
allowing enlarged rows and text to reflow. See [QA-REPAIR.md](QA-REPAIR.md) for
actual original/repair widths, controls, limitations and exact file hashes.
The original `directions/11/` files remain unchanged.
