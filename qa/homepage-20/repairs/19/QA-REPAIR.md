# Direction 19 responsive text repair

The frozen first submission remains at `directions/19/`. The repaired copy is `repairs/19/index.html`; its shared imports remain `../../data.js` and `../../base.css`, and its ready hook remains `data-mock-ready="19"`. No other direction, production file or data source was changed.

## Reproduction method

Installed Chromium through Playwright, with a **390 × 844 CSS-pixel viewport**. The exact method used for both original and repair was:

```js
await page.goto(url);
await page.waitForSelector('[data-mock-ready="19"]');
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: 'html{font-size:200%!important}' });
await page.evaluate(() => document.fonts.ready);
const documentWidth = await page.evaluate(
  () => document.documentElement.scrollWidth
);
```

The computed root size was **32px**. Expanded-state checks then set every native `details.open = true`, including the League menu. This differs from the original first-round test that doubled every element's computed size at a 1440px viewport.

## Before and after

All widths below are CSS pixels, measured after fonts were ready.

| 390px viewport, root text 200% | Frozen original width | Repair width |
| --- | ---: | ---: |
| Member, disclosures initially closed | 398 | 390 |
| Public, disclosures initially closed | 398 | 390 |
| Member, every disclosure open | 402 | 390 |
| Public, every disclosure open | 415 | 390 |

The initial overflow came from the phone standings' fixed 64px PF column. Its enlarged 28px values needed 88px. The fixed rank and W columns also cramped their enlarged headings. Opening the League menu exposed a second cause: two automatic-minimum grid columns could grow beyond their 251px available width.

The repair gives the standings text-relative columns and a real horizontally scrollable region. At 200% root text the region is **358px wide**, with **480px of table content**. The document itself remains 390px. No standings information is removed or clipped out of access. The region has `tabindex="0"`, `role="region"`, the visible **Standings** heading as its accessible label, a visible scrolling instruction, and the normal focus outline. Keyboard Right reached **scrollLeft 122 of 122**; Left returned to **0**.

The expanded phone menu uses fitting columns that become one column at enlarged text. Small row repairs also allow availability notes to wrap, scale the AI row-index track, wrap editorial stat groups, and insert an optional break after the roster total's currency sign. These preserve all labels, values and source details.

No font size was reduced or capped. Measured enlarged sizes are identical before/after: root **32px**, Week headline **112px**, member roster total **86.4px**, standings text **28px**.

## Normal-size and disclosure checks

Both member and public views were checked independently, with fonts ready, first closed and then with every disclosure open.

| View | Viewport | Original closed/open widths | Repair closed/open widths |
| --- | ---: | ---: | ---: |
| Member | 1440 | 1440 / 1440 | 1440 / 1440 |
| Member | 390 | 390 / 390 | 390 / 390 |
| Member | 320 | 320 / 320 | 320 / 320 |
| Public | 1440 | 1440 / 1440 | 1440 / 1440 |
| Public | 390 | 390 / 390 | 390 / 390 |
| Public | 320 | 320 / 320 | 320 / 320 |

The standings require no horizontal scrolling at those normal sizes: region/content widths were **1074/1074**, **358/358**, and **288/288** respectively. All six repaired normal cases produced no page errors. Each retained ten directory teams, ten faces, five saved AI pairs and **228 visible roster links when expanded**. Members retained all **24 valuation rows**; public views retained zero personal sections.

At 390px with 200% root text, both stale and missing AI states were checked for both editions with every disclosure open. All four remained **390px wide**, retaining five pair rows and the five appropriate Stale or Unavailable labels. The enlarged ready-state inspection found no overflowing visible elements outside the deliberately scrollable standings region.

## Artifact evidence and limits

- Frozen original HTML SHA-256, unchanged: `d82f558d902e77e8fdf816fff62ba36bdf87575b4cb5426d3e5ac5eb99e2a730`.
- Repaired HTML SHA-256: `2644e89a069553bf277bcbe81e2ecaa84fb9a96da10e1b41b2d84eae5a393195`.
- Inline module syntax check passed with `node --check --input-type=module`.
- No screenshots, installs, external actions, Git mutations, other-folder writes or agents were needed for this repair.

This evidence establishes the static fixture's measured reflow and native keyboard scrolling. It does not establish actual-device, screen-reader, Next routing, authentication or production behavior. No remaining blocker was found in the assigned responsive repair scope.
