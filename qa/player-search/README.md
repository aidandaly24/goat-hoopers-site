# #116 player-search evidence

Bounded synthetic before/after evidence for the Stocks player-name search
normalization (issue #116).

- **Revision:** branch `fix/player-search-normalization`, head `133190e`,
  base `f5be2b7ee6821ed8f69e22ca8782abb2a7192ea8` (origin/main at branch time).
- **Method:** `npx tsx --import ./qa/player-search/hooks.register.mts qa/player-search/evidence.mts`
  from the repo root. No browser, no `next dev`/`next build`, no network.
- **What is production:** `filterStocks` (after) from
  `src/surfaces/stock-market/board.ts`, and every result row rendered by the
  production `StockQuoteRow` component via `react-dom/server`. The "before"
  predicate is copied verbatim from base `f5be2b7` and labeled as such.
  Fixtures are synthetic (accented display names, distinct positions/prices);
  no provider data.

## Scenarios (`evidence/*.html`, before/after at 1280 / 390 / 320 px)

| file | filters | before | after |
|---|---|---|---|
| `initial.html` | none | 6 rows | identical |
| `search-jokic.html` | query `jokic` | 0 rows | **1 row: Nikola Jokić** |
| `search-dayron.html` | query `dayron` | 0 rows | **1 row: Day'Ron Sharpe** |
| `search-accented.html` | query `Jokić` | 1 row | identical (no regression) |
| `combined.html` | query `e` + position C + Drafted | 1 row (Sharpe) | identical (filters still intersect) |
| `no-match.html` | query `zzz` | empty state + reset | identical |
| `punctuation.html` | query `...` | 0 rows | 0 rows (guard: matches nothing, not everything) |
| `blank.html` | query `   ` | 6 rows | identical (current behavior preserved) |

Display spelling is preserved everywhere: the after rows render `Nikola Jokić`
and `Day'Ron Sharpe` exactly as the source records carry them.

## Honest limitations

- **No browser was available** (no Playwright/Chrome in this environment), so
  these are static server-rendered DOM snapshots, not screenshots, and there
  is no live keystroke capture. "Keyboard entry" is represented by the exact
  `BoardFilters` state the search input's `onChange` produces; that wiring is
  untouched by this diff (only the predicate changed).
- **Styling is approximate:** CSS modules are stubbed to class-name
  passthrough (`css-stub-hooks.mjs`), so layout/paint fidelity is not claimed.
  DOM structure, row order, counts, empty states and display text are
  production.
- Width blocks constrain a wrapper div; they exercise horizontal reflow of
  the static markup, not the real responsive CSS.
- Per the design skill's navigation-accessibility reference: this diff changes
  no chrome, destinations, focus order or DOM order — only which rows the
  existing filter returns. No navigation/accessibility behavior was altered,
  so no a11y re-verification beyond source inspection was performed.
