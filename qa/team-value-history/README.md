# Team history presentation verification

This harness builds the actual `TeamValueHistory` client entrypoint through a
temporary **production Next.js** app. Server props use the shared serializable
contract. Local fixture GET routes supply explicit synthetic roster/price/move
details; no application auth, DB or upstream source is connected. The server
blocks external fetches and the browser rejects external requests and writes.

With the locked Node22 dependencies and an existing Playwright/Chromium toolchain:

```sh
TEAM_HISTORY_PLAYWRIGHT=/absolute/path/to/existing/playwright/package \
TEAM_HISTORY_EVIDENCE=/tmp/team-history-review \
node qa/team-value-history/verify.mjs
```

Omit `TEAM_HISTORY_PLAYWRIGHT` if `require('playwright')` already resolves.
`CHROMIUM_PATH` defaults to `/usr/bin/chromium`. No package, credential or service
is installed by this harness. Temporary app files are removed after the run.

It checks eight HTML/RSC responses plus real desktop/390px/320px/light/dark and
320px/200% text interactions. States include full-window gaps, source/season
breaks, different partial subsets, one point, empty values, long names, inclusive
custom ranges, presets and day scrubbing. It verifies no detail fetch before
inspection; roster inspection during a valuation gap; bounded pagination; retry,
generation409, malformed data and delayed-response cancellation. Screenshots,
revision and source hashes accompany the JSON report.

The visual pass also exercises a 27rem column in a 1440px desktop viewport,
checks the value appears above the plot, and verifies custom date disclosure
and focus restoration. Initial screenshots retain the uncluttered opening state;
inspection screenshots separately show missing-value and roster evidence.

These fixtures test presentation and actual framework/browser boundaries. They
do not establish live roster replay correctness, historical source completeness,
real account authorization, physical-phone/screen-reader acceptance, a reviewed
pricing dataset, production backfill or deployment authorization.
