# Foundation validation

Original source audit: `f5be2b7ee6821ed8f69e22ca8782abb2a7192ea8`.
Publication base: `edfdb81e17d889087be3e7707518cf8ddd1e39da` (main).
Branch: `dot/friends-account-foundations`; public draft publication authorized.
Date: 2026-10-08 America/New_York. Production code, auth actions, game store, schema, dependencies,
AI backend, app routes, practice UI and deployment configuration remain unchanged.
Five new TypeScript files implement and test dormant contracts only.

| Check | Result |
| --- | --- |
| New identity/competition tests | 68 pass (included in full suite) |
| Full offline Vitest suite on publication base | 581 pass, 13 opt-in skips; 50 files pass, 2 skip |
| Full nonincremental TypeScript | Pass |
| ESLint, five new TypeScript files | Pass, no warnings |
| Surface contract script | Pass, 60 surface files on publication base |
| git diff --check | Pass |
| Provider runtime, Postgres SQL/races, live recovery mail, backup/restore | Not run; configuration and later review required |
| Local production compile, browser | Not run; no current UI/runtime wiring |
| Remote CI / production compile | Normal required workflow after draft publication; report exact head/run in PR |

Commands from the task checkout:

```sh
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/domain/arcade/account-identity.ts src/domain/arcade/competition.ts src/domain/arcade/competition.test.ts src/data/account-identity.ts src/data/__tests__/account-identity.test.ts
node --import tsx scripts/check-surface-contracts.ts
git diff --check
```

Reused established repository dependencies via per-package local symlinks;
no package installed or shared checkout edited. Vite caches are task-local.
An initial shared-directory symlink caused four existing guard-config checks
to fail because their temp cache was outside writable roots; correcting only
the local dependency layout made the unchanged checks pass. The tsx CLI IPC
socket was unavailable in the sandbox; node --import tsx ran the identical
surface-contract script successfully. No network exemption or guard removal.

This is source-level/fake-store verification. Rejected reused run state and
exhausted budgets are **not** proof of atomic replay protection or award
issuance; no production store/adapter exists for those candidates. Synthetic
shooting replay is **not** a validated competition physics engine. Inventory
SQL has not executed or had a real PostgreSQL parse/plan check.

SHA-256 of the verified TypeScript source and tests:

```text
5664230e1817a125a38cf1f5c3ab711f6e4b0998abcb6a9c4ac8f8f49fdb2557 src/domain/arcade/account-identity.ts
3e851dbfcc06381354d80607fee92851ac7dd8e052026fd7588db80d03df6b32 src/data/account-identity.ts
c62d30601835714c070be2de40c80aab43ca31dd7178b03651651390b14ace37 src/data/__tests__/account-identity.test.ts
70de8e4c5643bd9a7b47b9c719c07f117f495dff97d9c073bb28e1f2af47a7fd src/domain/arcade/competition.ts
42228a7493e07c324cc6203d18a037d63d1d2c146c3829835a0336b166353a64 src/domain/arcade/competition.test.ts
```
