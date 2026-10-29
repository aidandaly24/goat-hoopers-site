# Direction 18: bounded enlargement repair

This repair is a separate copy under `repairs/18/`. The frozen original under
`directions/18/` was read for diagnosis and remains unchanged. Existing shared
imports, source data, navigation actions and `data-mock-ready="18"` are retained.

## Changes

- The court caption can wrap its practice link onto another line rather than retaining the combined minimum width of both captions.
- Zero-minimum roster-value grid tracks keep the desk within its container. A discretionary break after the total's currency symbol lets the complete amount reflow at its original 2.75rem phone font size.
- The mobile header can wrap its controls; Stocks and Menu keep complete labels rather than breaking into letter fragments. The normal-size header still fits on one row.
- The full fixture hash in the expanded footer wraps. This also repairs the larger overflow exposed when the provenance disclosure is opened.
- The original labelled-row phone standings remain in place; no scrolling table is introduced.

The repair adds no font-size reduction, enlargement limit, clipping rule or
page-level overflow suppression. Existing portrait crops are unchanged. All
source values, labels and actions remain available.

## Measured before and after

Method: installed Chromium through Playwright, viewport **390×844 CSS px**.
Wait for the mock-ready hook and `document.fonts.ready`, then add exactly
`html { font-size: 200% !important }`. Computed root and body sizes are both
**32px**. Measure `document.documentElement.scrollWidth` before and after opening
every main-content and footer `details` (navigation tested separately).

| View | Original collapsed | Original expanded | Repair collapsed | Repair expanded |
| --- | ---: | ---: | ---: | ---: |
| Member | 407 | 646 | 390 | 390 |
| Public | 392 | 646 | 390 | 390 |

Widths are CSS pixels. Original expanded values include the source/footer
provenance, which exposes additional long identifiers in directions 06 and 18.
The repair also retained a **390px** page width while the focused skip link was
visible and while the enlarged navigation disclosure was open.

Both views separately passed normal-size **1440×900**, **390×900** and
**320×900** viewports. Collapsed and expanded document widths exactly matched
the viewport in all six combinations: 1440, 390 and 320 respectively.

## Content and controls

- Original versus repair main `textContent`, every roster link/name and all
  destination-link text/hrefs compared equal in both views. There are still
  **228 roster references, ten directory teams, ten faces and five ready saved
  AI pairs**. Public mode has zero personal blocks. Existing complete member
  valuation content remains unchanged.
- Lillard search returned one team; a no-match search returned zero. Team A–Z
  sorting placed roster 6 (Huff n' Puff) first. The standings sort select worked.
- At the exact 390px/200% setting, keyboard Enter opened navigation, Escape
  closed it and focus returned to its summary in both views. The initial Tab
  reached the visible skip link without widening the page.
- Stale and missing AI states retained 390px page width in both views. Stale
  retained five saved pairs; missing retained zero saved-pair hooks, matching
  each direction's original unavailable-state behavior.
- Browser element and text-range bounds showed no viewport overflow outside
  the explicitly bounded standings regions. No JavaScript page errors occurred.
- The named standings regions in directions 06 and 11 accepted focus with a
  solid 2px visible outline and `tabindex="0"`. No scrolling region was added to
  direction 18.

These are static Chromium checks. They do not establish screen-reader behavior,
physical-device behavior, production navigation, authentication or live data.
No production build or release action was needed. No remaining repair blocker.

## File identity

- Frozen source index SHA-256: `88c0f5f4c89e3b3cd44dc3a1458802860df9986b6c04c0e3d359ac9a7985fa32`
- Repaired index SHA-256: `0fb1bc74c0fff4256ba0eea5c0dc37ab750b98f1d196b4c675eee62199705672`
- Source benchmark: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`

## Final coordinator hygiene

A whitespace-only blank line inside CSS was normalized after the author check.
Fresh captures and common checks use the final source; see
`../../evidence/final-hygiene-proof.json` for before/after hashes and exact
image-byte comparisons. No CSS rule, markup, data or interaction changed.
