# Varsity Club — section badge rework

Source-ready runtime copy: `/qa/homepage-themes/rework/07/index.html`.

This is a bounded correction to the first submission. The original `directions/07/` files are unchanged. All new screenshots use separate `varsity07-rework-…` paths; no original image was overwritten. `DESIGN.md` in this folder is explicitly labeled as the historical first-submission record, with this file as the current rework evidence.

## Defect and correction

At 390 CSS px, the original section-heading flex row let several two-digit markers shrink below their text’s intrinsic width. The page’s wrapping rule then split 02, 03, 05, 06 and 07 into two lines. The original 06 marker measured 41.59375px wide at 20px Graduate type, with two text range rectangles.

The runtime copy adds only these scoped CSS rules:

```css
.section-title .number {
  flex: 0 0 auto;
  min-width: max-content;
  white-space: nowrap;
}
.section-title > div {
  flex: 1 1 0;
  min-width: 0;
}
```

The marker keeps its intrinsic width; the adjacent heading takes the remaining width and wraps. Font size, font family, inherited line height, padding, colors, artwork, content and interaction code are preserved. There is no clipping, transform or font-size reduction. In the final 390px runtime, 06 measures 42px wide and 44.375px high, with 20px Graduate type, its original 30px line height and one text range rectangle.

`index.html` and `varsity.js` are byte-identical to the original. The only runtime difference is the appended badge CSS. All original facts, roster references, links, state handling and controls remain.

## Exact final verification

Method: installed Playwright with headless `/usr/bin/chromium`, against the root-owned local server on port 4206. No package installation, external runtime, Git operation or production change.

Both member and public were tested at **1440, 390 and 320 CSS px**, at **100% and actual 200% root text size**. For enlargement, the browser received `document.documentElement.style.fontSize = '200%'`; root and body computed to 32px, versus 16px normally. Each of these 12 combinations was checked with disclosures closed and with **every native `details` open**: 24 layout states on the exact final runtime.

| View | Width | Root/body 100% → 200% | Section badges | Result in both disclosure states |
| --- | ---: | --- | ---: | --- |
| Member | 1440 | 16px → 32px | 9 | All one line; no clipping or overflow |
| Member | 390 | 16px → 32px | 9 | All one line; no clipping or overflow |
| Member | 320 | 16px → 32px | 9 | All one line; no clipping or overflow |
| Public | 1440 | 16px → 32px | 8 | All one line; no clipping or overflow |
| Public | 390 | 16px → 32px | 8 | All one line; no clipping or overflow |
| Public | 320 | 16px → 32px | 8 | All one line; no clipping or overflow |

For each marker, a DOM text Range returned exactly one rectangle; its `scrollWidth` did not exceed `clientWidth`. The document width equaled the viewport in all cases. The final open-disclosure pass also found no element extending beyond the viewport’s right edge. Public has eight badges because the member-only completed-week section remains absent.

Additional checks on the final runtime:

- Inspected the complete scrolled 390px member page through the footer and a dedicated final 06 viewport capture. Local images completed with nonzero natural width. The marker is visually a single horizontal “06”.
- Member inventory remains 10 team containers, 10 modeled faces, 5 ready saved AI rows, 24 roster-value rows, 228 unique roster links and 10 standings rows.
- Enter opens Club menu; Escape closes it and restores focus to `nav-button`.
- Player search “Labaron Philon” returns one club; Clear restores all ten. Both A–Z sorts put Huff n’ Puff first.
- Stale AI retains five saved rows and its visible stale banner. Missing AI retains five current pairings with no saved-row hooks and a visible Unavailable banner.
- `node --check varsity.js` passes. Browser verification reports no page errors or failed local resource responses.

Final local visual evidence (new paths only):

- `/tmp/varsity07-rework-final-phone-full.png`
- `/tmp/varsity07-rework-final-badge06.png`

Root owns independent complete comparative recaptures. These static-fixture checks do not claim a production route journey, authenticated backend verification, screen-reader session or physical-device test. There are no remaining implementation blockers.

## Frozen hashes

Bundle hashing method: SHA-256 of the exact concatenated file bytes in this order: `index.html`, `varsity.css`, `varsity.js`. Documentation is excluded to avoid a self-referential hash.

**Rework runtime bundle:**

`ba0fbb3ef3646a1730d0519cbd7538688778c3bc769105ffd9b67d40eb5472dd`

| Rework file | SHA-256 |
| --- | --- |
| `index.html` | `5fce1d64ff8e2ee84b66311b8b735284b1140978474eed19e283c5c384f1efb9` |
| `varsity.css` | `79a5d14f8a2bc1fdf6d41ed9c8d0bb30145b3f9929bea8b4d2b09183e7d7924a` |
| `varsity.js` | `e355cf5790a3bfe68bbf961126d5f5b975778c26b5696cc9b9dcf8e816923e22` |

**Original runtime bundle, rechecked unchanged:**

`63dae3e78e8fb22cdeb8e5deb31275f4f8a5820745073cce18d801335b095331`

| Original preserved file | SHA-256 |
| --- | --- |
| `directions/07/index.html` | `5fce1d64ff8e2ee84b66311b8b735284b1140978474eed19e283c5c384f1efb9` |
| `directions/07/varsity.css` | `2cd277e97dff22562bf8e2c0c1a2000420895454711d98001d90cd8693185aae` |
| `directions/07/varsity.js` | `e355cf5790a3bfe68bbf961126d5f5b975778c26b5696cc9b9dcf8e816923e22` |
| `directions/07/DESIGN.md` | `1f62ded28190b1118651c16c1a2cace6c4527cc6405732fa1981e1e7c51f225a` |

The first-submission source matches all four recorded pre-rework hashes. Source is frozen for root recapture.
