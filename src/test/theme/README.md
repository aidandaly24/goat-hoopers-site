# Shared theme acceptance

Use Node22, separately installed Playwright and Chrome. First run the updated
`src/test/navigation/browser.mjs` harness into a private evidence directory.
Then pass its **passed receipt** to this harness; it verifies every recorded
production source hash and reuses that exact Next build, with no additional
install/build. Server environment has no credentials; external and non-GET
browser requests and external server fetches are blocked. Own processes close
in finally. Keep the receipt, build, logs and actual PNG captures.

```sh
THEME_TEST_NAV_RECEIPT=/private/navigation/results.json \
THEME_TEST_EVIDENCE=/private/theme \
THEME_TEST_PLAYWRIGHT=/absolute/playwright/index.mjs \
THEME_TEST_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node src/test/theme/browser.mjs
```

Tests system light/dark, live OS changes until manual choice, keyboard action
names/focus, persisted/invalid/blocked storage and reload; desktop1440/390/320,
signed-in long name and anonymous account states, 16 shared-shell destinations,
Next Back/Forward query/departure scroll, 200% text/reflow, resize, header/footer
logo variant, actual toggle normal/hover/focus pairs and semantic text/fill
contrast. A separately gated hydration load proves saved dark is applied before
React; server/first-client loading control remains disabled until synchronized.

Production Newsroom, Stocks and Trade bodies use invented data. Other route
bodies are labelled placeholders; AI Decides body/home entry belong to their
owners and are not verified here. Current Courtside alias CSS is injected only
for a labelled root-token probe. This does not establish live providers/auth,
physical iOS/Safari or screen-reader announcements. Unchanged Stocks doubled-text
body clipping is recorded by navigation QA and remains outside this scope.

For the recorded resource-bounded continuation only,
`THEME_TEST_RESUME_RECEIPT=/private/first-resize-attempt.json` carries the first
40 passed checks after validating exact input hashes and zero browser errors.
It runs only the five remaining enlarged/prepaint/alias cases. The first attempt
and logs remain saved; its heading assertion incorrectly applied initial-load
clearance to the naturally scrolled page after resize. Product source was
unchanged. A normal run without this flag executes all cases.
