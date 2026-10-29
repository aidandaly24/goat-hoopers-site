# Direction 11: bounded enlargement repair

This repair is a separate copy under `repairs/11/`. The frozen original under
`directions/11/` was read for diagnosis and remains unchanged. Existing shared
imports, source data, navigation actions and `data-mock-ready="11"` are retained.

## Changes

- Explicit zero minima keep the lead and editorial grids within their containing column. The score cells stack when enlarged text makes the two-column arrangement too narrow.
- The roster total has a discretionary break after its currency symbol. It retains its original 2.6rem font size, complete text and value. Facts can wrap, and value, performer, notebook and public-profile rows have shrinkable identity columns.
- The lead portrait and display headline stack when their combined reading width is unavailable. A container query resets the mobile provenance offset in that stacked state; the large headline keeps its size and readable whole words.
- Archive identity and headline columns use their actual content widths. Standings have a named, keyboard-focusable overflow region as a bounded fallback. At the required 390px/200% check the table fits the 326px region without scrolling.

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
| Member | 442 | 442 | 390 | 390 |
| Public | 442 | 442 | 390 | 390 |

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

- Frozen source index SHA-256: `49d76252afa01a0d453bd6ce6e7ddafd9e6f95610d0de2aae785d1447c9078f0`
- Repaired index SHA-256: `56f3195cfbe619abd5b08bf064c7c9a0431ab3c02eb2c8cb21c277836eb007d9`
- Source benchmark: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`
