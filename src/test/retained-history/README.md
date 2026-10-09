# Retained-history caller smoke

This fixture renders the actual StockBoard, inspector, existing chart, new
retained-history panel and browser client. Two named synthetic players and fake
GET responses replace application data. The fetch stub rejects all other calls;
the browser also blocks external and non-GET requests. No application server,
database, provider data, credentials or pricing model are involved.

Use Node 22 and an already installed Playwright/Chrome. Do not install dependencies
or build Next for this fixture:

```sh
SHELL_TEST_PLAYWRIGHT=/path/to/existing/playwright/index.mjs \
SHELL_TEST_CHROME=/path/to/existing/chrome \
RETAINED_HISTORY_EVIDENCE=/tmp/goat-retained-history-smoke \
node src/test/retained-history/browser.mjs
```

The focused smoke verifies explicit loading, two bounded initial pages, separate
sources, native microsecond timestamps and tied records, pointer/keyboard
inspection, manual paging, unknown coverage, unavailable/partial retry, generation
restart, range/player cancellation, Close cancellation/focus and 390px/desktop
bounds. It writes a synthetic screenshot and results outside the repository.
The script stops only the private Vite process it starts.

Additional focused checks:

```sh
node node_modules/vitest/vitest.mjs run \
  src/surfaces/stock-market/retained-history.test.ts \
  src/data/__tests__/stock-history-client.test.ts \
  src/test/StockInspector.test.ts \
  src/surfaces/stock-market/price-history-chart.test.ts --maxWorkers=1
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Limits: this is a browser fixture with fake responses, not a production data or
physical-device validation. Recorded dates remain timezone-unverified native
calendar values; calendar projection is geometry only and never changes the raw
record. Reconstructed holds come only from qualified loader intervals; unversioned
or ambiguous windows do not acquire carry. The current quote remains in the
existing chart and is never inserted into retained records.
