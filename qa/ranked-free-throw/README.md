# Local ranked competition verification

These scripts use the existing disposable fixed PostgreSQL target only:
`127.0.0.1:55441/claim_team_test`, user `postgres`. They create/drop a randomly
named owned schema and require `RUN_CLAIM_TEAM_LOCAL_TEST=1`. Never point them
at application credentials or a shared database.

Run the production default-off build, then:

```sh
RUN_CLAIM_TEAM_LOCAL_TEST=1 node qa/ranked-free-throw/migration-check.mjs
RUN_CLAIM_TEAM_LOCAL_TEST=1 node qa/ranked-free-throw/full-app.mjs
```

The browser script requires Playwright and Chromium. Use `NODE_PATH` if Playwright
is installed outside this repository, and `CHROMIUM_PATH` for a different binary.
Optional `QA_REPORT_PATH` and `QA_SCREENSHOT_PATH` write review artifacts.
`GOAT_QA_DEVICE_SCALE=0.5` bounds software-renderer pixel cost while retaining
normal-motion desktop gameplay; the report records the scale.
`GOAT_QA_DESKTOP_MOTION=reduce` uses the supported reduced-motion resolution
path when software-rendered flights cannot finish within the fixture timer; the
report records that preference and does not claim normal-motion pacing. The default is 1.
This is functional coverage, not phone/GPU performance evidence. It owns
only its private Next process, temporary authority file and random database
schema. Production mode verifies default-off behavior; development mode verifies
actual login, moving shots, replay, saved results, scope filters, public boards
and finalization/history. The `finality-fixture.mjs` preload returns only one
synthetic publisher event; all unrelated external app fetches remain blocked.
Do not load that preload into a real application process.

Backend regression checks:

```sh
npm test
RUN_CLAIM_TEAM_LOCAL_TEST=1 npm test -- src/data/__tests__/friends-auth-local.test.ts src/data/ranked-free-throw/__tests__/postgres-local.test.ts src/data/arcade-competition/postgres-local.test.ts --maxWorkers=1
npm run typecheck
npm run check:contracts
```

Scope and activation limits: [competition contract](../../docs/arcade-ranked-competition.md).
Historical prototype reports from the saved foundation are intentionally not
included as evidence for this revision; reproduce checks on the final PR head.

The merged Blender scene caused normal-motion SwiftShader rounds at both 1 and 0.5 density
to time out in this environment. Keep that result distinct from reduced-pixel
functional checks. No scene performance or art changes are part of this PR.
