# Ranked choice-game verification

`RUN_CLAIM_TEAM_LOCAL_TEST=1 npx vitest run src/data/ranked-choice/postgres-local.test.ts`
uses only the existing fixed127.0.0.1:55441 / claim_team_test disposable PostgreSQL16
fixture, random owned schemas, synthetic accounts/manifests/graders and actual SQL.
It executes Request/Response commands through the real data handler and proves
ownership, immutable steps, completion/rollback/retry, missing coverage, formats,
ties, frozen archives, next-game dispatch and expiry after lock waits. CI runs it
alongside the existing canonical/auth suites. No production credentials are used.

After `npm run build`, run `node qa/ranked-choice/verify-board.mjs` with Playwright
on NODE_PATH and Chromium installed. It owns/stops a built Next server on4196;
all external upstream HTTP is refused and DB/feature credentials are removed.
Actual new routes must return disabled. Browser public-board responses alone are
synthetic to isolate new metric/weekly/archive rendering at320/390/1440px, scope
changes, correct game links, no shooting CTA, no overflow or gameplay writes.
Evidence: /tmp/goat-choice-browser.json. This renderer fixture does not establish
live auth, real sources/graders, deployed behavior or production activation.
