# Paper + Slate component QA

Private fixture for the selected site palette. It mounts production components
and their CSS; it does not import palette-comparison overrides or change an app
route. Next link/navigation adapters preserve anchors and native-history
subscriptions. The detail transport is a fixture-only Vite alias returning
synthetic domain objects. No account, DB, live API or install is needed.

With existing repository dependencies and permission for a loopback listener:

```sh
node node_modules/vite/bin/vite.js --config qa/paper-slate/vite.config.mts --configLoader runner
```

Open `http://127.0.0.1:8796/`, `/stocks`, `/teams`, `/arcade`,
`/arcade/free-throw-shootout`, `/trade-analyzer`, `/history`, `/missing` or
`/unavailable`. `?state=empty` supplies no editorial/listings/teams; stock
`?state=error` exercises actual detail failure/Retry. Search/add/remove trades
updates the URL exactly through the native-history contract.

Home uses the existing frozen Oct 8 review data, all 10 teams and 228 roster
references; quote names/values/history are explicitly synthetic. History uses
the checked-in verified 2025 content. Avatar IDs are set to null to exercise the
initials fallback without remote CDN requests. Existing court/pennant/portrait
assets remain local. Inter/Geist fixture fonts use existing approved copies;
Next font compilation and real account chrome are outside this harness.

A separately available Playwright package and installed Mac Chrome can run:

```sh
node qa/paper-slate/browser.mjs /absolute/path/playwright/index.mjs '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

This uses private headless Chrome profiles, loopback GET-only routing and no
credentials. WebGL is deliberately disabled; it tests the real fallback,
help and back path, not gameplay. Browser/server external requests are never
needed. The script closes its browser; stop the separate Vite listener after
review. Evidence and generated caches are ignored and task-owned. Run Vite with
`--configLoader runner` when packages are linked read-only.

The checks cover 1440×900, 390×844 and 320×844, reduced motion, canvas/overflow,
resolved semantic contrast, directory sorting/focus, stock search/detail/error/
close-focus, team links/empty, game discovery/fallback/help/back, trade picks/
remove and recovery. Screenshots retain their natural post-interaction scroll
positions. This is Chromium viewport emulation, not physical Safari/iOS or
hosted backend verification. See [the QA record](../../docs/paper-slate-palette-qa.md).
