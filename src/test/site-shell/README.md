# Shared shell regression

Issue #84. Build the app with Node 22 in a checkout containing no dotenv files.
Supply Playwright separately, without adding an application dependency:

```sh
SHELL_TEST_PLAYWRIGHT=/absolute/path/to/playwright/index.mjs \
SHELL_TEST_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
SHELL_TEST_EVIDENCE=/absolute/path/to/private/evidence \
node src/test/site-shell/browser.mjs
```

The runner starts the built Next app and a Vite fixture on private numeric
loopback ports. Server external fetches are blocked; the browser rejects
external and non-GET requests. Child environments contain no application
credentials. Browsers and servers close after the run.

The real Next run checks all 23 public/private, nested, missing and recovery
route examples at 1440, 741, 390 and 320px, a 720px layout equivalent to a
1440px viewport at 200% browser zoom, and enlarged 200% text at 390/320px.
It checks primary destination order/current state, initial and anchored titles,
skip/primary keyboard focus, scrolling and actual Next navigation/Back.
External data is deliberately unavailable: recovery/provision states are part
of the shell coverage, not successful production-data validation.

The Vite fixture uses real shell, ticker, Stocks and Trophy components with
synthetic empty data and a long synthetic manager name. Next links are ordinary
anchors and pathname uses browser state; actual Next transitions are tested in
the production runner. Scoreboard polling and application fetches are disabled.
It checks ticker present/absent, both account states and 100%/200% text at
1440/1024/741/390/320px. Captures identify synthetic data and never invent
league results. Fixture fonts use the system fallback; the built Next captures
use the actual loaded site fonts. No physical iPhone/Safari coverage is claimed.

For only the synthetic checks, append `--fixture-only`. Exact head, outcomes,
Library attachments and any remaining limitations belong in the PR report.
