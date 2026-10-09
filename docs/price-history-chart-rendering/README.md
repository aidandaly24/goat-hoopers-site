# Issue #92 QA — price-history chart rendering slice

Bounded slice: grouped straight SVG paths, 90-day long-gap classification with
honest labels, markers retained only where they explain data. No valuation,
sampling, data-layer, or styling-token changes.

## Files owned

- `src/surfaces/stock-market/PriceHistoryChart.tsx`
- `src/surfaces/stock-market/price-history-chart.ts`
- `src/surfaces/stock-market/PriceHistoryChart.module.css` (path join/cap + gap label only)
- `src/surfaces/stock-market/price-history-chart.test.ts`
- This evidence directory (before/after SVGs).

## Behavior change

Before: one `<line>` per consecutive pair plus a dot on every supplied point —
long unsampled intervals were bridged by a continuous line.

After: consecutive same-kind pairs group into single straight `<path>` runs
(`stroke-linejoin/linecap: round`). Intervals ≥ 90 days (`LONG_GAP_DAYS`,
documented in `price-history-chart.ts`) are never bridged; each is labeled
with a wrapped two-line description — "No samples supplied between" /
"[Mon YYYY] – [Mon YYYY]" — describing the supplied sampled response, not raw
source availability. Label centers are clamped inside the plot and neighboring
labels stack on the lowest non-colliding row, so wrapped descriptions can
neither overlap nor run off the chart. Dots remain on run endpoints (series
ends, gap edges, provenance kind changes), on isolated samples, and on actual
source transitions (e.g. backtest→gamelog keeps its provenance marker even
when both sides render as the same "estimate" path kind). The current-quote
diamond and selected-point ring are unchanged. A live selected
price/date/provenance readout sits directly adjacent to the native point
slider (visible at 200% zoom and reduced heights); the native slider keeps
arrow/Home/End keyboard behavior. Every supplied point stays inspectable via
pointer, the native range slider, and the ARIA readout even when its
decorative dot is suppressed.

## Evidence

Synthetic fixtures (labeled "Synthetic Fixture" in the render), same input for
before/after pairs:

- `before-dense.svg` / `after-dense.svg` — 13 daily live points + current quote.
- `before-long-gap.svg` / `after-long-gap.svg` — 5 dense 2025 points, ~10-month
  gap, 4 dense 2026 points, mixed backtest/gamelog/live sources.

Inline styles approximate the Paper + Slate tokens
(accent #345b77, ink #242d35, muted #5f6870, rule #d7dade, surface #ffffff)
for readable review; the shipped component uses the CSS-module tokens.

## Verification (final head)

- `npx vitest run src/surfaces/stock-market/price-history-chart.test.ts` — 26/26 pass.
- `npx tsc --noEmit` — clean.
- `npx eslint` on the four owned source/test files — clean.
- `npm run build` — see PR body for result.
- All four evidence SVGs re-validated as standalone well-formed XML (the
  previously checked-in copies had a duplicated closing `</svg>`; repaired).

## Browser QA

Not run from this environment (no live-browser control in this worker).
Static-markup verification only: pointer target math (`nearestChartPoint`),
slider range/max/step, native keyboard semantics (arrows/Home/End on
`input[type=range]`), slider-adjacent `aria-live` readout placement, gap-label
row assignment and plot-bounds clamping are covered by unit tests above. The
independent reviewer owns desktop/390px/320px/zoom/touch/keyboard checks —
do not merge until those are done.

## Limits

- The 90-day heuristic is a display rule, not a data claim; see the constant
  doc comment.
- Gap-label width is estimated from a monospace character-width heuristic
  (`GAP_LABEL_CHAR_W`, rendering only); labels are clamped inside the plot and
  stacked on non-colliding rows. If a label still reads badly at 320px, flag
  it for review.
- `vercel.json` untouched (`git.deploymentEnabled=false` preserved).
