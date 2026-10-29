# Accessibility repair — direction 03

Frozen source: `qa/homepage-20/directions/03/`. Repair destination: `qa/homepage-20/repairs/03/`. This is a bounded repair of the submitted design, not a new direction.

## Reproduced cause and precise changes

The italic “almanac.” title was a single 426px unbreakable word at the enlarged size. The native standings table also needed 377px inside its 358px working column. Additional row-level inspection found long manager names and availability text intruding into neighboring data columns even when they did not widen the document.

- Added emergency wrapping to the page title; the ordinary title size and composition are unchanged.
- Allowed player-note, face and directory identity columns to shrink and wrap long text instead of painting into adjacent figures.
- Wrapped the original semantic table in a `role="region"` with the accessible name “Standings table; scroll horizontally when needed” and `tabindex="0"`. Only this comparative table scrolls when required; the full page does not.

At the exact enlarged test the region has a 358px client width and a 377px scroll width. Focusing it and pressing ArrowRight changed `scrollLeft` from 0 to 15px, confirming keyboard access to every original column. No font or table field was reduced.

## Before / after document width

| Exact 390px + root-font 200% test | Frozen source | Repair |
| --- | --- | --- |
| Member | 442px | 390px |
| Public | 442px | 390px |


## Verification method and retained inventory

Used installed Playwright and `/usr/bin/chromium` against the coordinator’s existing `127.0.0.1:4198` static server. For the exact failure, set the viewport to 390 CSS px, load the member/public URL, await the ready hook and `document.fonts.ready`, then inject `html{font-size:200%!important}`. Chromium reports a 32px root font. Test both the initial state and every native disclosure open, including navigation; direction 10’s separate mobile menu was also opened.

The repaired document width is **390px in both editions**, including the expanded state. Normal member/public layouts also passed at 1440, 390 and 320 CSS px, with initial and expanded document widths equal to their viewport width. Across those six normal cases the page retains ten team containers, ten faces, five saved AI pairs, ten standings rows and 228 unique directory player links. Member retains all 24 valuation rows; public has none. No JavaScript page errors occurred. Main-content text was compared with the frozen source, ignoring whitespace; no text/data fields were removed.

Normal phone openings and enlarged affected regions were visually inspected. This is static Chromium fixture evidence, not production navigation, physical-device or screen-reader verification. No text-size cap, hidden overflow, clipping or field removal was introduced. The original `directions/` files and shared files remain untouched.
