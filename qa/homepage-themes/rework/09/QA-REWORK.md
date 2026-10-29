# Playground League — face-index readability rework

## Scope and preserved first submission

This is a separate runtime source copy at `qa/homepage-themes/rework/09/`. The first submission remains at `directions/09/`, and its evidence images are unchanged. Only the copied `playground.css` changed; `index.html` and `playground.js` are byte-identical to the first submission. The copied `DESIGN.md` is also byte-identical: it is the first submission's design and verification record, not a claim of rework verification. This file records the new bounded fix.

Inspected the actual first member desktop material available in the repository: `evidence/09-member-desktop.jpg`, `evidence/09-member-desktop-middle.jpg` and its capture metadata. The middle image begins within the green face index and clearly shows price values immediately adjoining the “top modeled value” captions. Also inspected the live first-submission face section at 1440px before changing the copy.

No Git, production, original-source, first-image, shared stylesheet, fixture or runtime dependency changes were made.

## Exact before and after

**Before:** the position/basis span was inline and the price link was `inline-flex`. At 1440px, seven of the ten faces placed metadata and price on the same line with exactly **0px horizontal separation**. The other three happened to wrap the price with only a 3px vertical gap. Name lengths therefore produced an inconsistent and concatenated metadata/price reading order. The source typography was readable in size; the defect was allocation and separation.

**After:** the metadata span is a block and the price link is a separate flex row with `.5rem` top margin. Player names have a desktop minimum two-line allocation (`min-block-size:3em` at `line-height:1.5`) that can grow freely; it is removed at the existing narrow breakpoint. Team, player, metadata and price remain full text with wrapping and no clamp, truncation or fixed maximum height. The existing 5-column desktop / 2-column phone arrangement, alternating desktop offsets, green surface, original court art, portraits and color/type direction are retained.

The copied stylesheet adds only these face-scoped rules:

```css
.face .face-team{line-height:1.5}
.face .face-player{min-block-size:3em;line-height:1.5;margin:.5rem 0 .375rem}
.face>.meta{display:block;line-height:1.5}
.face .price-link{display:flex;width:fit-content;max-width:100%;margin-top:.5rem}
@media(max-width:50rem){
 .face>.meta{grid-column:2}
 .face .face-player{min-block-size:0}
}
```

All ten entries now have separate team→player→basis→price rows. Their measured vertical gaps are **8px / 6px / 8px** at normal root size, and **16px / 12px / 16px** at actual 200% root size. This includes Shai Gilgeous-Alexander, Giannis Antetokounmpo, Stephon Castle’s Back and Josh Diddy’s Roster. No font-size declaration was changed. Desktop player/price remain 16px; phone player/price retain the original 15.2px/13.6px. At 200% these become 32px or 30.4px/27.2px respectively.

## Rework verification

Installed Chromium/Playwright, static fixture at `http://127.0.0.1:4206/qa/homepage-themes/rework/09/index.html`, both `?view=member` and `?view=public`.

| View | CSS width | Normal document width | All details open | 200% root + all details open |
| --- | ---: | ---: | ---: | ---: |
| Member | 1440 | 1440 | 1440 | 1440 |
| Member | 390 | 390 | 390 | 390 |
| Member | 320 | 320 | 320 | 320 |
| Public | 1440 | 1440 | 1440 | 1440 |
| Public | 390 | 390 | 390 | 390 |
| Public | 320 | 320 | 320 | 320 |

Enlargement used `document.documentElement.style.fontSize='200%'`; computed root and body were both 32px. Every native disclosure, including full source JSON, was open. No out-of-viewport elements, page overflow or JavaScript errors were found. At every view/width/enlargement combination all ten face entries had positive separation for every consecutive text field. Rework section captures at 1440/390/320 were inspected; root owns the final bulk recaptures.

All ten player profile hrefs, ten team hrefs, ten price values and ten `/stocks` price destinations remain present. The same page retains ten directory containers, 228 unique roster-player links, five saved AI hooks, and all 24 member roster values. Public remains at zero member sections and zero member value items. With HTML/JS byte-identical and only face CSS changed, all fixture facts, source disclosures and action destinations are preserved. No application routing, live authentication, real device or screen-reader behavior is claimed by this static recheck.

## Exact SHA-256 evidence

Runtime bundle hashes use sorted runtime filenames (`index.html`, `playground.css`, `playground.js`), concatenating `filename + NUL + bytes + NUL` for each file before SHA-256.

- Before runtime bundle: `574f99891e73225bd74495858ed2e808614e097d5872a1f5547eae37b3c7fe41`
- After runtime bundle: `adf8abcd68cf8d2db5ec40aeeec2ddcde05e8396aaac2e4c8a88b974e713b253`
- First delivered four-file bundle, including its DESIGN record: `bf1814d6d236082ea54ea44057c51c07d9f50fb148637859909fc195c5744c0c`

| File | First submission SHA-256 | Rework SHA-256 |
| --- | --- | --- |
| `index.html` | `9ba2d0c846ebd1bf9ecf834384d0f7c48bdba2830dea19053bc4b3c6989aac3e` | identical |
| `playground.css` | `c6305133ce534895324172e703059cde546ed34ecd8f97e8048a5abb95ee8fed` | `bf2082705c44f4bee8c0c2c8000997c60962934326fc4a6e2a69bb8ba7b247be` |
| `playground.js` | `4c5b5216118ed8e397aabf0ad0085f03027fe7ba59beac6a239954a4c8a9d168` | identical |
| Copied `DESIGN.md` | `0a24aa513a02ae98cdf525db16ee51b5b736df55ff3f50fe002d70677acc7ce0` | identical; first record |

Retained first-image hashes:

- `evidence/09-member-desktop.jpg`: `570cc03e07ae4800fc1b40d07df75a7b290d538580b409aa2417beb1f8ea399d`
- `evidence/09-member-desktop-middle.jpg`: `d23fc354e86828e4e3dbafbb1796ea6debbeb006df92952947abfb2f1d90a108`

The final handoff gives the entire rework-folder bundle hash including this QA record. There are no remaining source blockers; root recapture and independent visual review remain coordinator-owned.
