# Price-history correction and publication review

Code review and production repair are separate approvals. This PR performs no
DDL/import on Neon and creates no branch there. Builds remain `next build`,
including the prevention regression merged in PR #46. Do not run the old seeder.

## Proposed affected classes

The read-only audit found 78,129 reconstructed rows across 879 players:

| Source | Legacy season | Rows |
|---|---|---:|
| gamelog | 2022-23 | 25,649 |
| gamelog | 2023-24 | 26,026 |
| gamelog | 2024-25 | 26,084 |
| backtest | 2022-23 | 125 |
| backtest | 2023-24 | 125 |
| backtest | 2024-25 | 120 |

All 77,759 game estimates are candidates for recomputation because after-game
timing and seasonal EMA change their path. All 370 yearly estimates require
date/season/age review. A complete cache export may introduce 2025–26 annual
fallbacks previously skipped by the shifted-season coverage check. Dates cannot
simply be moved without repricing. This is the proposed full reconstruction
replacement, not authorization to execute it. An annual-only repair would need
a narrower publisher and would leave the game-path defects unresolved.

Every `stock_snapshots` row is excluded from the publication SQL. Other
`price_history` sources are preserved. Generic query/index cleanup belongs in
its own change. No snapshot retention policy or live pricing formula is changed.

## Freeze, back up and compare before approving a target

1. Take a consistent read-only export of all `price_history` rows, retaining
   UUIDs and these JSON keys: `id`, `playerId`, `date`, `priceCents`, `source`,
   `season`. Format `date` in UTC as `YYYY-MM-DDTHH:mm:ss.SSSZ`; keep the original
   database timestamp export too if it has submillisecond precision. Export
   `stock_snapshots` and any existing import manifest separately for recovery.
   Record target identity, audit time, counts and checksums; keep copies outside
   the repository. No production backup was performed by this PR.
2. Freeze the complete stat-cache season history, directory with its season
   year, draft picks with their actual availability dates, scoring and source
   revision. Read `data/README.md`. Do not use the Wembanyama-only test export as
   a full replacement. Missing facts and scoring fields must be declared.
3. Prepare a JSON config with `directorySeason`, `currentSeasonStartYear`,
   `directoryPath`, `gamelogPath`, `seasonHistoryPath`, `draftPicksPath`, and
   `source: { description, revision, scoring, limitations }`. Paths are relative
   to the config. Run offline:

   ```sh
   npm run price-history:prepare -- inputs.json candidate.json
   npm run price-history:plan -- backup.json candidate.json plan.json
   npm run price-history:import -- candidate.json --plan=plan.json
   ```

   These commands make no database connection. Review `before`/`after` counts
   by source and season, added/removed/repriced/relabeled/unchanged rows,
   candidate dataset hash, backup SHA-256 and preserved-source count. Repriced
   and relabeled counts can overlap. Check player+season coverage, gaps, extrema,
   debut dates, Wembanyama's path and the newest completed season. Calendar
   midnights are plotting coordinates; they are not real quote-observation times.
4. Review `migrations/price-history-import-state.sql` independently. The only
   additions are a natural-key unique index and singleton completed-import
   manifest. Its duplicate-key preflight must pass before the index is created.
   Migration on an existing large table requires its own lock/target review.
5. Approve the exact full-replacement scope, candidate hash, retained backup,
   transaction payload size and target. Only then may an operator supply
   `PRICE_HISTORY_IMPORT_URL` and run the explicit apply path:

   ```sh
   npm run price-history:import -- candidate.json --plan=plan.json --apply --dataset=REVIEWED_HASH
   ```

   There is no fallback to `DATABASE_URL`. One Neon HTTP transaction obtains
   an advisory lock, checks that reconstructed rows still match the backup,
   replaces only `gamelog`/`backtest`, and records the completed manifest. A
   stale backup, failed insert or failed completion write rolls back everything.
   Keep the entire transaction beneath Neon's request/response limit; a small
   local fixture is not proof that an arbitrary production artifact fits.
6. After publication, verify counts, manifest, natural uniqueness and a live
   application read. On an ambiguous timeout, inspect the manifest first.
   Re-plan against the current export before retrying; the old plan intentionally
   fails after a successful publication. An identical artifact produces stable
   IDs and values. Retain the old export/artifact for a separately reviewed
   transactional rollback; never use the legacy delete/chunk helper.

## Verification and limits

Offline tests cover the corrected season convention, current-game inclusion,
EMA reset, birthdays/timezones, available-at picks, complete-coverage fallback,
input validation, artifact hashes, live-only movers and replacement planning.
Build and TypeScript pass with both database environment variables removed.

For real SQL testing, start a dedicated local synthetic database:

```sh
docker run --detach --rm --name goat-hoopers-pr38-publication-test \
  --publish 127.0.0.1:55438:5432 --tmpfs /var/lib/postgresql/data \
  --env POSTGRES_PASSWORD=local-test-only --env POSTGRES_DB=price_history_test postgres:16
npm run test:price-history:local
docker stop goat-hoopers-pr38-publication-test
```

The opt-in suite uses only this fixed localhost target and its own schema;
ambient connection strings are ignored. Three tests passed against Postgres 16:
real second-chunk failure/rollback and retry, competing publications/stale-plan
rejection, and stable reruns/natural uniqueness. They preserve both the synthetic
snapshot table and other-source history. The actual Neon HTTP client and Drizzle
batch generate the queries; a test adapter executes them as a local Postgres
transaction. Neon service transport, deployment configuration and full candidate
payload limits have not been tested against a remote database.

The data remains a current-model retrospective estimate. See the pinned source
audit and scoring/coverage limitations in `data/README.md`. Production repair
counts beyond the audited baseline require the complete frozen exports; they
cannot be inferred from a one-player seasonal fixture.
