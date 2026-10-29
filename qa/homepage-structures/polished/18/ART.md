# 18 — Evidence lab

Full-art implementation of the final corrected evidence matrix. This is an independent QA proposal, ready for root’s new captures and art review; it is not final user approval. Original `wireframes/18/` and corrected `structural-revisions/18/` remain unchanged.

## Retained working model

The primary action is still to pin player identities and compare typed evidence, or follow their actual current teams. Desktop keeps selected names as comparison columns. Phone transposes the same comparison by field, placing every pinned name under the same labelled measure/period. It remains a working matrix rather than separate player cards or a chapter reader.

All original state IDs, forms, controls, source records, destination hrefs and hooks are retained. The exact corrected `followPlayers()` transition still renders the team comparison and then calls `document.querySelector('#team-mode').focus()`. Its original trigger can hide without dropping keyboard focus to BODY.

The selected art direction is the assigned peach/lavender/indigo/dark-teal Evidence lab. Peach, lavender and a teal-tinted third identity track pinned names across columns and phone field groups. Existing pinned identities keep their color when a neighbor is removed. Names, source labels and state text remain the primary identifiers; color does not encode a winner, forecast or evidence quality.

## Visual system

| Role | Application |
| --- | --- |
| `--font-display` | Local Space Grotesk for the GOAT identity, headings, pinned names and numerical values. Its wrapping leading stays explicit; no negative tracking or forced-fit type. |
| `--font-reading` | Local DM Sans for body copy, source periods, missing cells, forms and controls. Core reading/control type starts at 1rem. |
| `--paint-canvas` / `--paint-paper` | Peach ground and quiet paper for fields and controls. |
| `--paint-teal` / `--paint-on-teal` / `--paint-teal-muted` | The brand header and table field/source-period axis, with readable light text. |
| `--paint-indigo` and action roles | Context controls, the pin action, table boundary, source actions and focus. |
| Identity paint roles | Peach, lavender and teal-tinted column/header pairs follow labelled identities. Every phone cell repeats the identity name. |
| Missing/secondary roles | Explicit missing-evidence text in normal type; secondary source text remains readable on the identity surfaces. |
| Spacing/type/line/radius roles | A local rem spacing rhythm, dedicated body/display/value scales, a 44px target floor, readable line heights and restrained control/workspace corners. |

`matrix.css` declares the semantic font, paint and spacing roles locally. The final source scan found no hex paint literals outside the CSS role declarations and none in JavaScript. Font family literals occur only in the font-face bindings and font-role declarations; selectors consume the roles. The pointer emphasis resolves its paint/duration/easing from those roles rather than hardcoded style colors.

Both local variable fonts match the supplied catalog hashes: DM Sans (240,164 bytes) and Space Grotesk (136,676 bytes), under SIL OFL 1.1. They load from the existing `/qa/homepage-structures/assets/fonts/` paths. No remote font import, font copy, installer or new dependency was added.

The ornamental eyebrow was removed. The table caption now describes evidence scope rather than responsive implementation. Column metadata uses readable lines; dates, ranks, periods and actual qualifiers remain. Source records stay as independent native disclosures rather than repeated bordered cards. The ten approved local portraits retain complete, deliberate contained crops next to the corresponding identity and profile links; there is no decorative court image.

## Source study: exact references and concrete application

These primary documents were read selectively as requested source guidance, without running their scripts or adopting their unrelated workflows:

| Reference | Applied decision |
| --- | --- |
| [Hallmark custom direction](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md) | The lab’s real task governs the entire surface: identity colors follow the working comparison into the source browser and phone transpose. There is no marketing hero added above it. |
| [Hallmark redesign](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md) | Preserved factual content, control IDs, route destinations and behavior while changing the local presentation system. The corrected matrix is the material, not a layout to discard. |
| [Elaya redesign](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md) | Refined type/spacing and empty states in the existing vanilla implementation; retained inline editing and disclosures; removed italic missing-state styling. The assigned palette/font pair governs this proposal. |
| [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt) | Phone compares each field across the selected names instead of shrinking three desktop columns. Search, pin, removal, source access and the team relationship action remain native controls. |
| [Addy accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility) | Tested actual keyboard/focus outcomes and rendered contrast. Enlarged desktop text releases sticky column headers and repeats identity names in the cells so those headers cannot cover focused evidence. |
| [Emil design engineering](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md) | A short pointer-only added-column emphasis has a concrete explanatory job. Frequent context changes, keyboard activation and reduced motion remain instant. |
| [Apple interaction guidance](https://www.ui-skills.com/skills/emilkowalski/apple-design) | Immediate action feedback, preserved source/origin relationships and usable return paths. Browser Back restores the actual working composition and origin focus rather than replacing it with a fresh default. |

The requested palette, local font pair and approved architecture take precedence over reference-specific presets. No downloaded source or template markup was executed or copied.

## Facts and source parity

The shared fixture import stays `../../data.js`; the underlying data is unchanged. The source register and comparisons retain:

- Current Week 3 pair, both team/manager/record/score identities, check date and incomplete status. Known 0.0 and Pending remain distinct.
- All five saved model rows and actual choices/probabilities/confidence. The returned away choice remains 35%, its alternate 65%, and confidence independently 20%. Saved time/model/prompt/input identity/null snapshots/baseline/evidence remain accessible. Stale and missing variants remain explicit.
- Member identity, standing/actions, modeled FAAB subtotal/basis/time/coverage/rank, top three and all 24 values; all supplied form and completed-week best/rough records with games, units, period and coverage; both team news stories and recent move. Public rendering has no member valuation, guide, wire, source group or private-team actions.
- Ten teams, ten faces, all 228 unique player references with position/NBA/profile links; local search and standing/name/roster-count sorting; all current rank/W/L/PF and opponents. Additional source context now also exposes current ties, PA, games back, featured references and missing extra-record availability without adding clutter to the matrix.
- Both dated draft/unpublished editions with game states/scores/context/bounds, three exact editorial takes/stats/periods/selection/source dates, happenings, sources and dated routes. The coherent archive supplies dated games; current directory/personal data supplies current pairs. The preserved 1/2 versus 1/5 home-edition conflict is not asserted as a combined result.
- All supplied league moves, season/playoff metadata and honest null aggregate evidence. History and Power remain unavailable. No price, probability, counted points, history, play-by-play or live state is generated.
- Home/News/Stocks/History/Arcade/AI/Teams/Transactions/trade/archive/game routes and member/public comparison. Stocks remains `/stocks#player-board`; no unsupported player query was introduced.

NBA averages, BYU college averages, counted fantasy points, EMA FP/G and modeled FAAB retain separate rows and source periods. A missing quote remains “No supplied current quote,” rather than $0 or an inferred unpriced observation. November 12 remains a fixture check date, not actual today. The compact **Synthetic concept** disclosure retains full provenance and the fixture/auth-boundary caveat.

## History and focus

Back testing exposed an inherited reset in the corrected gray source: after member → public → Back, a third pinned player was lost. The polished copy fixes this within the existing native browser entry using `history.replaceState`; it does not add application navigation steps or change URLs. Restoration is limited to actual Back/Forward entry navigation. A fresh page load still starts from its normal edition default.

The entry retains pinned players/teams, context and identity colors, source query/order, open disclosures and region/document scroll positions. Returning restores the departing link’s focus after fonts/layout are ready. Mode matching prevents member-entry UI state from hydrating a public edition; public data construction and rendering remain independently gated. No account data or persistent browser storage was introduced. The local fixture remains explicitly not an auth boundary.

## Motion demonstration

`motion-demo.json` contains six desktop and six phone actions: open the native pin chooser, find/select Dybantsa, scroll to keep the control/comparison together, pin the third identity, then follow the actual selected players’ teams. Every `waitMs` is at most 100 and the total is twelve steps.

The actual comparison is rendered immediately. A pointer addition emphasizes the new column for 180ms using the semantic feedback paint, then settles to that identity’s surface. The demonstration visibly adds Dybantsa and then recomposes the selected franchise relationships to teams 1/8. Both desktop and phone paths were replayed in the browser. At the sampled new-column moment, its header was in the viewport and eight column-cell emphasis animations were active; reduced motion reached the same pins/teams with zero animations. Keyboard pinning likewise had zero animations. Live reduced-motion changes cancel active emphasis. There is no delayed data, score tween, autoplay, reveal observer, scroll hijacking or input lock.

## Actual verification

Local static-fixture Chromium with the installed Playwright module, 2026-10-29:

- **162 state/reflow checks:** all advertised ready states plus comparison/team/saved-pick stale and missing states; member/public; 1440×1000, 390×844, 320×844; 16px and 32px root text. No document or matrix horizontal overflow and no public member-source leak. The 32px test is root-text enlargement, not a browser-zoom or physical-device claim.
- **Content:** 228 references / 228 unique player IDs; 24 member value rows; ten teams/faces; five saved picks; two editions; three spotlights. All ten local portrait images decoded, both local fonts loaded, and no runtime asset request failed.
- **Inputs:** real pointer/keyboard pin, removal with visible focus return, last-column retention, three-name limit, derived team ownership, a second saved pairing, roster-to-player comparison, directory search/no-match/Clear and roster-count sort.
- **Corrected focus path:** Enter on `#follow-pins` retained visible `#team-mode` focus after 400ms in twelve member/public × viewport × root-text cases. The render still performs the exact corrected focus call.
- **Table keyboard:** twelve Tab landings at each of 16px/32px desktop text; focused evidence was not covered by column headers or clipped by the comparison region after the enlarged-text adjustment.
- **Back:** 1440 and 390 member/public round trips restored pins, teams, context, identity colors, query/order, expanded source details and document/matrix/source scroll positions exactly, with focus returned to the comparison link. The intervening public page rendered zero member value rows and no member source group. History is native, with no `pushState` calls.
- **Phone extremes:** expanded Explore/provenance at 320px with 32px root text; longest supplied names Yanic Konan Niederhäuser, Nickeil Alexander-Walker and Shai Gilgeous-Alexander pinned together. No document or comparison-region horizontal overflow.
- **Runtime:** `node --check matrix.js`; no browser JavaScript errors or remote runtime requests. CSS/JS literal-paint and semantic-font scans passed. Source/core facts and URLs were preserved.

Rendered text contrast samples (actual computed foreground/background, including inherited cell surfaces):

| Pair | Ratio |
| --- | ---: |
| Brand / dark teal | 10.82:1 |
| Concept label / lavender | 8.16:1 |
| Peach identity heading / peach | 5.11:1 |
| Peach identity secondary text / peach | 5.03:1 |
| Lavender identity secondary text / lavender | 5.98:1 |
| Field period / dark teal | 8.80:1 |
| Cell source text / peach-tinted cell | 6.81:1 |
| Cell source text / lavender-tinted cell | 6.51:1 |
| Active context control | 10.20:1 |

These sampled normal-reading pairs exceed 4.5:1. The input border/paper pair is 3.50:1. Controls retain a 44px floor; genuine inline profile/source links remain inline reading links. These checks are bounded evidence, not a complete accessibility certification.

Remaining limits: independent polished-state critique/capture; screen-reader and physical-device passes; exhaustive contrast coverage beyond the sampled roles; actual Next route/auth/Back integration and downstream Stocks/trade/game testing. This is a static local fixture, not a deployed authenticated homepage. Production build and live-provider checks were not run.

## Frozen deliverables

`index.html`, `matrix.css`, `matrix.js`, `motion-demo.json`, `ART.md` only, within `qa/homepage-structures/polished/18/`. The earlier two 18 sources, shared assets/data, root infrastructure, production and Muse lanes were not changed; no Git operations, installs or external service mutations were performed.

Preview: `http://127.0.0.1:4207/qa/homepage-structures/polished/18/index.html?view=member` (or `?view=public`, with `&ai=stale` / `&ai=missing`). `body.dataset.studyReady='18'` and the existing `goatStudy` state API remain available for root’s capture.
