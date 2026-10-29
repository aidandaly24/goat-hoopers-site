# Direction 06: bounded enlargement repair

This repair is a separate copy under `repairs/06/`. The frozen original under
`directions/06/` was read for diagnosis and remains unchanged. Existing shared
imports, source data, navigation actions and `data-mock-ready="06"` are retained.

## Changes

- The matchup uses intrinsic minimum columns, so enlarged identities stack when two readable columns no longer fit. Its second team switches to a horizontal divider in that state. The existing normal-width two-team composition is preserved.
- Notebook grid children can shrink to their reading width. Portrait/text groups, story tops, stat groups and public counts wrap instead of imposing their summed minimum widths. Player-name links can break a long name at the available width.
- The focused skip link stays within the viewport, and long source identifiers wrap inside provenance.
- Standings have a named, keyboard-focusable overflow region as a bounded fallback; no table data is clipped or removed. At the required 390px/200% check the region and table both measure 326px, so horizontal scrolling is not needed.

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
| Member | 467 | 574 | 390 | 390 |
| Public | 467 | 574 | 390 | 390 |

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

- Frozen source index SHA-256: `d706fc8f1aae753e9b27f3cf205b75c90c11f471624156aed76f87ea1bd849cb`
- Repaired index SHA-256: `02a0b36583a10837a77de8e5ab47f8da8912b92dd69d53ed68c79d3035276665`
- Source benchmark: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`

## Final coordinator hygiene

A whitespace-only blank line inside CSS was normalized after the author check.
Fresh captures and common checks use the final source; see
`../../evidence/final-hygiene-proof.json` for before/after hashes and exact
image-byte comparisons. No CSS rule, markup, data or interaction changed.
