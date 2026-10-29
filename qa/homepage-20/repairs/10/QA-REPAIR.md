# Accessibility repair — direction 10

Frozen source: `qa/homepage-20/directions/10/`. Repair destination: `qa/homepage-20/repairs/10/`. This is a bounded repair of the submitted design, not a new direction.

## Reproduced cause and precise changes

The logo and enlarged mobile navigation exceeded one header row. The member’s large unbroken `$1095.25` value painted 407px into a 326px column. Fixed pixel standings tracks could not contain enlarged PF digits; public scouting price and metric-label text also needed to wrap rather than run together.

- Let the header wrap only when its contents no longer fit.
- Added an optional `<wbr>` before the large valuation’s decimal fraction, retaining the same full textual amount and font size.
- Let numeric standings tracks grow to their content while the name track wraps; the existing minimum sizes preserve the ordinary layout.
- Allowed long roster links and the public scouting price/label line to wrap.
- Let the static court legend circles grow to fit their enlarged numbers.

No independently scrolling table is needed for this direction. All court regions, labels, data and actions remain present.

## Before / after document width

| Exact 390px + root-font 200% test | Frozen source | Repair |
| --- | --- | --- |
| Member | 439px | 390px |
| Public | 409px | 390px |


## Verification method and retained inventory

Used installed Playwright and `/usr/bin/chromium` against the coordinator’s existing `127.0.0.1:4198` static server. For the exact failure, set the viewport to 390 CSS px, load the member/public URL, await the ready hook and `document.fonts.ready`, then inject `html{font-size:200%!important}`. Chromium reports a 32px root font. Test both the initial state and every native disclosure open, including navigation; direction 10’s separate mobile menu was also opened.

The repaired document width is **390px in both editions**, including the expanded state. Normal member/public layouts also passed at 1440, 390 and 320 CSS px, with initial and expanded document widths equal to their viewport width. Across those six normal cases the page retains ten team containers, ten faces, five saved AI pairs, ten standings rows and 228 unique directory player links. Member retains all 24 valuation rows; public has none. No JavaScript page errors occurred. Main-content text was compared with the frozen source, ignoring whitespace; no text/data fields were removed.

Normal phone openings and enlarged affected regions were visually inspected. This is static Chromium fixture evidence, not production navigation, physical-device or screen-reader verification. No text-size cap, hidden overflow, clipping or field removal was introduced. The original `directions/` files and shared files remain untouched.
