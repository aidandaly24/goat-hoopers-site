# Transactions repair and synthetic review — draft/HOLD

## Bounded navigation/Transactions release candidate

This checkout ports only reviewed navigation #113 and Transactions #129 deltas
onto live removal-only base `39759cbdf143dec436b18a3e8e1ea5aa1cf3102e`.
The app retains its live publication ticker and legacy two-sided-trade News
regression. Source-review and unchanged-component browser evidence are reused;
old receipts do not attest this combined candidate. Its exact production build
is checked by remote CI, with one serialized integrated smoke after slot release.

`TRANSACTIONS_QA_INTEGRATED=1` composes the reviewed production SiteHeader and
destination list into the existing synthetic Next fixture. Run the existing
`next-browser.mjs` with `--integration-smoke` for only the bounded navigation,
filter/profile-return and mobile-menu flow, not the historical viewport matrix.
Directory/profile bodies remain synthetic adapters; no live auth/data is used.

`sanitize.mjs` is historical #129 tooling pinned to its old base and narrow
inventory. Its old receipt is not candidate validation; do not run it or cite it
as proof of this new parent chain. The copied QA inputs remain exactly the
reviewed, independently authored synthetic fixtures.

The three bounded source repairs and ownership are in SOURCE-FIX-SCOPE.md.
Fresh public base: d80e9c4d515b7aed0a09998caaa6f1a1d9a92057. The checkout was cloned
from GitHub, then exactly the 16 cleared QA files were reconstructed and their
hashes checked before updating them. Original private audit ancestry/files are
not reused or approved for publication.

Every demo team, manager, player, league/transaction ID and raw record is authored
by generate-fixtures.mjs without captured inputs. Source links show local demo
JSON, never Sleeper. Current sample: 26 moves. Archive: seven trades (four pick-only),
four completed waivers, one failed waiver and six free-agent adds. Unknown labels
retain invented IDs; archived identity changes are invented too.

## Presentation review

node node_modules/vite/bin/vite.js --config qa/transactions/vite.config.mts --configLoader runner

Open localhost:8818/transactions. Compact rows, disclosure, share links, filters,
paging, keyboard, loading/error/empty states and Light/Dark/System remain isolated
QA. Repaired source component renders actual toTransactions output and the repaired
TransactionHistory. Its Vite navigation shim is not Next routing proof.

## Actual Next verification

NEXT_TELEMETRY_DISABLED=1 node node_modules/next/dist/bin/next build qa/transactions/next --webpack
NEXT_TELEMETRY_DISABLED=1 node node_modules/next/dist/bin/next start qa/transactions/next -p 8830 -H 127.0.0.1

This separate production-built Next fixture imports only repaired components and
synthetic transform inputs, never production loaders/accounts/DB. It uses actual
Next Link/useSearchParams/native history. League navigation and profile/directory
routes are labeled fixture adapters. Fonts/tokens and presentation styles are QA;
this is not full owner-produced shared-shell/profile integration.

Run browser.mjs and next-browser.mjs with the existing Playwright module path and
installed Mac Chrome executable. Both use unique disposable profiles/debugging
port zero and allow only local GET requests. Receipts/screenshots are ignored.
An optional fourth next-browser.mjs argument selects another local origin.
Set TRANSACTIONS_QA_DIST consistently for build/start to keep an active review
server's output separate from a new verification build (for example .next-verified).

## Checks

node node_modules/vitest/vitest.mjs run --configLoader runner
node node_modules/vitest/vitest.mjs run --config qa/transactions/vitest.config.mts --configLoader runner
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/surfaces/transactions src/data/sleeper.ts src/data/transform.ts src/data/__tests__/transactions.test.ts src/data/__tests__/recent-activity.test.ts qa/transactions/*.mjs qa/transactions/*.mts qa/transactions/*.tsx qa/transactions/*.ts qa/transactions/wire.jsx qa/transactions/next/app qa/transactions/next/next.config.mjs
node node_modules/vite/bin/vite.js build --config qa/transactions/vite.config.mts --configLoader runner
node qa/transactions/sanitize.mjs /absolute/local/private-audit-checkout

All repair assertions are ordinary tests; no expected-failure gates remain.
Sanitization compares only proposed additions against private identifiers/records
without printing them, checks demo prefixes and proves the complete linear parent
chain from the stated public base. Git command errors fail closed. Inspect the
full diff/file inventory separately. Generated caches, private receipts/assets,
credentials and captured raw records are never committed. No dependency install.

Production app compile belongs to existing credential-free CI. Physical phone,
Safari, screen reader, positive source FAAB transfer and full owner-shell/profile
integration remain unverified. No merge/deploy, DB/Sleeper writes or paid calls.
