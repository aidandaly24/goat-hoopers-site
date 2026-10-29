# Structural revision 03 — bounded QA

Tested with the installed Playwright module and `/usr/bin/chromium` against the root-owned local server. No screenshots or capture infrastructure were produced.

URL: `http://127.0.0.1:4207/qa/homepage-structures/structural-revisions/03/index.html?view=member` (also `view=public`).

## Final source checks

- `node --check qa/homepage-structures/structural-revisions/03/study.js` — passed.
- Ready marker remains `body[data-study-ready="03"]`.
- Member `goatStudy.states`: `default`, `team`, `scout`, `league`, `standings`, `edition`, `archive`, `tools`. Public omits `team` and `scout`.
- All 48 member API combinations passed: eight states × widths 1440/390/320 × root font 100%/200%. `document.documentElement.scrollWidth`, `body.scrollWidth`, and active chapter width were measured. No horizontal overflow remained.

## Sequential actual controls

Used the native bottom chapter picker to select League, clicked the actual Standings control, then used the picker to select Edition. This specifically exercises a retained, offscreen standings table rather than resetting through the capture API.

| Mode | Viewport | Root text | Document/body after Edition | Table containing block |
| --- | ---: | ---: | ---: | --- |
| Member | 390 | 100% | 390 / 390 | relative |
| Member | 390 | 200% | 390 / 390 | relative |
| Member | 320 | 100% | 320 / 320 | relative |
| Member | 320 | 200% | 320 / 320 | relative |
| Public | 390 | 100% | 390 / 390 | relative |
| Public | 390 | 200% | 390 / 390 | relative |
| Public | 320 | 100% | 320 / 320 | relative |
| Public | 320 | 200% | 320 / 320 | relative |

The first interaction pass also measured Standings, return to League, browser Back to Edition, and expanded provenance in all eight combinations: 40 observations, document/body width always equal to viewport width. These observations also confirmed exactly six inert chapters out of seven for members and four out of five for public visitors. Browser Back returned to Edition in all eight flows. Escape closed expanded provenance in each.

## Content and state retention

- Clicked all ten team selectors: 24, 27, 22, 22, 22, 23, 23, 22, 21, 22 rows. All 228 player hrefs were unique and reachable.
- Search `Dybantsa` returned `AJ Dybantsa · PF · WAS`.
- Name sort put team 6 (`Huff n’ Puff`) first, as expected.
- Faces rendered all ten supplied entries.
- Wheel-scrolled League to 270px, selected Edition, then returned through the picker: League remained at 270px.
- Opened provenance from a chapter footer and pressed Escape: focus returned to that footer button.
- CDP native touch input moved the whole viewport from This week to My club.
- Live reduced-motion emulation retained actual Archive navigation.
- No page errors or failed local responses occurred in the interaction pass. No page errors occurred in the final 48-state/8-sequence pass.

## Original preservation and limits

The four original `wireframes/03/` source files were SHA-256 checked before and after revision work; all hashes matched. First images were neither viewed nor modified during this revision. Only `structural-revisions/03/` files were written.

Root full-document/pane captures and independent/Muse review remain pending. Physical mobile devices, screen readers, external live destinations and production authentication were not tested. The result remains a grayscale structural prototype; no full-art or universal accessibility acceptance is claimed.
