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
"No samples supplied between [Mon YYYY] and [Mon YYYY]" — describing the
supplied sampled response, not raw source availability. Dots remain on run
endpoints (series ends, gap edges, provenance boundaries) and isolated samples;
the current-quote diamond and selected-point ring are unchanged. Every supplied
point stays inspectable via pointer, the native range slider, and the ARIA
readout even when its decorative dot is suppressed.

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

- `npx vitest run src/surfaces/stock-market/price-history-chart.test.ts` — 24/24 pass.
- `npx tsc --noEmit` — clean.
- `npx eslint` on the four owned source/test files — clean.
- `npm run build` — see PR body for result.

## Browser QA

Not run from this environment (no live-browser control in this worker).
Static-markup verification only: pointer target math (`nearestChartPoint`),
slider range/max, and ARIA readouts are covered by unit tests above. The
independent reviewer owns desktop/390px/320px/zoom/touch/keyboard checks —
do not merge until those are done.

## Limits

- The 90-day heuristic is a display rule, not a data claim; see the constant
  doc comment.
- Gap labels are centered in the gap and may overflow narrow gaps (SVG
  `overflow: visible` on the plot); acceptable for review, flag if it reads
  badly at 320px.
- `vercel.json` untouched (`git.deploymentEnabled=false` preserved).
