# Accessibility repair — direction 04

Frozen source: `qa/homepage-20/directions/04/`. Repair destination: `qa/homepage-20/repairs/04/`. This is a bounded repair of the submitted design, not a new direction.

## Reproduced cause and precise changes

The logo plus enlarged Stocks/Menu controls exceeded one header row. The open menu’s two implicit minimum-content columns also exceeded its working width. The mobile one-column asset grid inherited an automatic minimum from the large amount and complete value list. The fixed court/game inset tracks left too little space for enlarged captions and the Play action. Existing mobile standings W/L cells could overlap internally even after document width was contained.

- Let the header wrap naturally when its controls no longer fit. The normal-size header stays on one row.
- Made the menu’s columns adapt to the available measure and wrap long destinations.
- Replaced automatic one-column grid minima with `minmax(0,1fr)` and protected the numeric side of each complete valuation row.
- Added an optional `<wbr>` before the decimal fraction of the large roster total. The visible/textual value is unchanged; it can wrap at a meaningful amount boundary at 200%.
- Made player rows and the game inset wrap as needed; long face identities and court captions wrap within their own columns.
- Kept the existing mobile labeled standings layout, fixed the table’s declared width, and let each W/L label/value wrap within its field. Names remain in the full-width identity row.

No independently scrolling table is needed for this direction. The original desktop layout and ordinary phone hierarchy remain intact.

## Before / after document width

| Exact 390px + root-font 200% test | Frozen source | Repair |
| --- | --- | --- |
| Member | 441px | 390px |
| Public | 441px | 390px |


## Verification method and retained inventory

Used installed Playwright and `/usr/bin/chromium` against the coordinator’s existing `127.0.0.1:4198` static server. For the exact failure, set the viewport to 390 CSS px, load the member/public URL, await the ready hook and `document.fonts.ready`, then inject `html{font-size:200%!important}`. Chromium reports a 32px root font. Test both the initial state and every native disclosure open, including navigation; direction 10’s separate mobile menu was also opened.

The repaired document width is **390px in both editions**, including the expanded state. Normal member/public layouts also passed at 1440, 390 and 320 CSS px, with initial and expanded document widths equal to their viewport width. Across those six normal cases the page retains ten team containers, ten faces, five saved AI pairs, ten standings rows and 228 unique directory player links. Member retains all 24 valuation rows; public has none. No JavaScript page errors occurred. Main-content text was compared with the frozen source, ignoring whitespace; no text/data fields were removed.

Normal phone openings and enlarged affected regions were visually inspected. This is static Chromium fixture evidence, not production navigation, physical-device or screen-reader verification. No text-size cap, hidden overflow, clipping or field removal was introduced. The original `directions/` files and shared files remain untouched.
