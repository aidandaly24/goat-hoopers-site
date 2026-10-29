# 07 — The schedule board

This direction asks: **Who am I playing, what else is on the slate, and what did the saved model actually return?** The five current pairings are the front-page structure. Their numbers identify the rundown order, not invented start times. The member's first action is **My team** beside the board; the public view offers team exploration. Team names open public profiles and each saved result has native provenance disclosure.

The design was authored blind from the shared inventory, brief and repository design instructions. No other direction, previous prototype screenshot or production code was copied. Only `index.html` and this file were authored in this folder.

## Composition

The opening uses the existing GOAT mark, a large week label and one bounded crop of the approved arena. The court caption leads to Arcade. A ruled, numbered schedule replaces a grid of boxes. Each pair keeps its two identities, managers, records and score states together. A separate aligned column identifies the actual returned model choice; the probability bar encodes the saved distribution. The highlighted white row marks the member's pairing, or the first current directory pairing in public view.

Inter carries names, prose and headings. Geist Mono carries scores, order, prices and percentages. Paper + Slate semantic tokens supply the canvas, ink, actions, rules, focus and stale-state color. No new fonts or assets were introduced. There is no animation or scene runtime.

Below the board are open working sections: member identity/value desk, scouting notebook, compact completed-week performers, dated editorial, happenings and source desk, market/trade/Arcade tools, the complete directory, standings, transactions and both archive entries. League faces are integrated with their teams in the directory. Two selected faces also sit in the notebook with an explicit modeled-price basis. This keeps roster, player and price navigation close together.

## States and retained information

- `?view=member` shows the personal identity, standing, 24-player coverage, $1,095.25 modeled FAAB total, pricing basis, computation timestamp, top three values and all 24 values in native details. Value history is explicitly unavailable. Observed form is separated from price movement and dated opinion.
- `?view=public` supplies league/player context and omits the personal data section. Both comparison links preserve the selected AI state.
- All five saved picks display their actual returned choice, 65% home / 35% away probabilities and saved timestamp. The returned away choice is retained even though its probability is lower. Confidence is shown separately in provenance, with model, prompt, roster IDs, evidence and unavailable input/slate snapshot, baseline and preview-period fields.
- `?ai=stale` visibly marks every saved pick stale before disclosure. `?ai=missing` keeps all five current pairings and marks their AI unavailable. Matching requires the current season, week and ordered roster IDs; unmatched results are explicit.
- A supplied zero remains **0.0**. A null score is **Pending**. Every pair states incomplete scoring; no winner or live result is inferred.
- Current metrics, news, prices and model output carry the prominent synthetic-fixture warning. The October 5–11 editorial is a stale sample draft with periods, sources and selection basis; it is never presented as an official Week 2 award.
- Completed-week high/low overlap is consolidated into five unique performers. Each retains points, games, cohort label, exact completed period and coverage.
- The directory retains all ten teams, managers, records, opponents and 228 unique linked roster references. Previous-season records appear inside roster details, including the previous-manager attribution for NeuralNets. Team/manager/player search, empty results, Clear and three meaningful sorts work. All ten standings retain rank/W/L/PF, with a labeled sort select and PF divided by 100.
- League stats, Power and recorded value history have explicit unavailable states. Both dated archive entries retain their correct `/weekly/{id}` links and context.

## Narrow layout and access

At 390 and 320px the schedule becomes a numbered vertical rundown. Names wrap; scores stay beside the correct team; saved output and provenance follow directly below. Personal, notebook and reference columns stack. Full rosters become single-column linked lists. Stocks remains a direct header destination; native Menu retains all league links. No essential section depends on a modal, hover, animation or API request.

The page provides a visible-on-focus skip link, landmarks, semantic headings, labeled search/sort, polite result counts, native details and visible token-based focus. Escape closes Menu and restores its summary focus. Phone controls and the main linked identity actions have 44px targets; ordinary inline editorial/source references retain prose-link semantics.

## Actual verification

Installed headless Chromium through Playwright, served from the existing local port 4198:

- Public and member views at 1440, 390 and 320 CSS px: no page-width overflow, including every main disclosure open. Counts: ten directory containers, ten face hooks, 228 unique roster links, five saved pair hooks; member has one personal section and 24 value rows. No JavaScript errors in these checks.
- Ready, stale and missing AI states were checked at all three widths in both views. All five pairings remain; stale/missing labels are visible. Known zero and five pending scores remain distinct.
- Search checked with a player (`Embiid`), manager (`Aedan23`) and team (`NeuralNets`), plus zero results and Clear restoring search focus. Name and roster-count sorts checked; standings name and PF sorts checked with all ten rows retained.
- Keyboard checked: first Tab reveals the skip link; Enter opens native Menu and provenance; Escape closes Menu and restores focus.
- Separate 200% text check at 1440px doubled every element's computed font size, opened all main disclosures and confirmed no page overflow. This is text enlargement, not browser zoom or the 320px test.
- Reduced-motion emulation retained static content. Desktop opening, desktop member desk and 390px opening were visually inspected. Local image checks found no broken loaded images.
- Actual computed color samples were checked against their rendered opaque surfaces: ink/paper 12.70:1, secondary/paper 5.15:1, slate/paper 6.56:1, white/slate 7.22:1; the control boundary/paper is 3.41:1. Exact ratios depend on these opaque surfaces; no text sits on court imagery.

This is a browser-rendered static fixture. Production Next routing, authentication, backend data, stock inspectors, full Arcade gameplay, physical devices and spoken screen-reader behavior were not exercised. No framework build was needed. No installs, external data calls, commits, branch changes, GitHub actions or production changes were made. No blockers remain for reviewing this mock.
