The default offline suite includes `../tradeUrl.test.ts`.

`browser.mjs` verifies the real component and URL helpers in a temporary,
production Next.js app with deterministic `StockQuote` fixtures. It copies
the source byte for byte, records source hashes, whitelists the server
environment (no database URLs or dotenv), rejects non-loopback browser
requests, and records RSC requests and synthetic market reads. It does not
load the site's server page, data loaders, ticker or accounts.

Supply Playwright separately so the application lockfile stays unchanged:

```sh
TRADE_TEST_PLAYWRIGHT=/absolute/path/to/playwright/index.mjs \
TRADE_TEST_EVIDENCE=/absolute/path/to/evidence \
node src/surfaces/trade-analyzer/__tests__/browser.mjs
```

Use Node 22. Optional `TRADE_TEST_CHROME` supplies an existing Chrome
executable; otherwise Playwright needs its own installed Chromium. The
runner requires permission to bind a synthetic loopback production server
and launch a browser. It saves its logs, JSON results and desktop/mobile
screenshots under the evidence directory.

Coverage: rapid edits and immediate copy, deliberately stale location,
native same-route history, real Next Link navigation with delayed RSC,
Back/Forward, malformed query canonicalization, unknown query/hash
preservation, no extra trade requests/market reads/history entries from
edits, cross-side exclusion, keyboard removal, scroll, clipboard success,
fallback, failure and feedback reset, and mobile trade semantics.
