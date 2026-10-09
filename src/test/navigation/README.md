# Focused navigation acceptance

Run with Node 22, separately supplied Playwright and installed Chrome. The
harness creates a private production-Next fixture from the real root layout,
shared primitives, Stocks, Trade Analyzer and Newsroom pages/components. It records
source hashes and the one fixture-only layout guard for ticker absence.
Synthetic loader/session/poller adapters never access a database or account.
The Newsroom/ticker receives a clearly synthetic RealNewsArticle with the
current outlet shape; no RSS feed is fetched. Other destinations have clearly
labeled placeholder bodies: only their shared navigation/current-route state
is under test.

```sh
NAV_TEST_PLAYWRIGHT=/absolute/path/to/playwright/index.mjs \
NAV_TEST_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
NAV_TEST_EVIDENCE=/absolute/private/evidence/path \
node src/test/navigation/browser.mjs --real-app
```

Build the unchanged real application separately before using `--real-app`.
That phase covers its blocked-data recovery shell at desktop, 390 and 320;
the loaded Stocks/Trade return flow is covered by the production fixture.
External and non-GET browser requests are rejected, server external fetches
are blocked, child environments contain no credentials, and only this run's
browser/server are closed. No logout/account write is exercised.

The receipt distinguishes shared-shell overflow from the unchanged Stocks
heading clipping under 200% text; it does not claim page-body acceptance.

Seven viewport/text profiles, two ticker states and both account states test
inventory, selection, 44px targets, no overflow, in-flow disclosures and Escape.
Anonymous cases also test actual Next round trips, Back/Forward/scroll and
shared Trade queries. Additional checks cover nested routes, keyboard/skip
offsets, closed tab order, resize focus, modified click and native-modal Escape
priority. A 720px viewport represents 200% desktop reflow; 32px root text is
tested separately on phones. These are Chromium checks, not physical Safari.

The run checks a 512 MiB free-space preflight, a 500 MiB fixture-build growth
budget and a 128 MiB floor; retain its fixture/logs/screenshots as evidence. `NAV_TEST_REUSE` can reuse the
exact receipt-matched build after source-hash checks; `NAV_TEST_PROFILES` can
select named profiles for bounded diagnostics.
