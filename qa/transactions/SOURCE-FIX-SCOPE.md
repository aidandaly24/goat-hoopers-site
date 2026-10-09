# Transactions source repairs — draft/HOLD

Ownership: issue #115, comment 6073231219. Reconstructed cleared synthetic QA
files on fresh public main d80e9c4. No private audit commit or file was copied.

Implemented source slice:

- TransactionFilters reads validated team/type query state and uses installed
  Next native history integration. Unrelated query/hash survive; All omits the
  two owned keys. Suspense stays within TransactionHistory. No refetch.
- RawTransaction declares optional roster_ids/status. toTransactions preserves
  existing move-derived participant order and appends valid declared IDs. Player
  sides contain only actual received players; no declared-only empty sides or
  inferred pick ownership. IDs, timestamps and moves remain intact.
- Explicit non-complete records are excluded from normalized activity and before
  recent-ten truncation. Status-absent legacy behavior remains unchanged.

Actual consumers: Transactions, homepage/season Wire, public team activity,
player wire history and clubhouse latest activity. PR119 real RSS Newsroom does
not consume normalized transactions. No legacy news generator is imported or
restored. Raw stock-demand and activity-count policies remain separate.

The source suite uses ordinary passing assertions. The production-built synthetic
Next app renders the real repaired surface with the actual installed router and
injected demo data. Its directory/profile and league-tool links are explicit
adapters for the shared owner contract, not the separately owned product design.

Shared-file integration: PR117 has additions to RawLeague, RawRoster, RawNbaState
and RawMatchupEntry; this patch changes only the RawTransaction block. Verify the
three-way sleeper.ts merge and preserve all unrelated additions. Internal contact
with that owner was blocked by automatic approval review; no message was sent.
Navigation PR113 and real-news correction issue122 retain their ownership.

No league.ts, shared chrome, Newsroom, profile design, domain change, loader/cache,
provider, DB, auth, dependency or deployment config edit. No DB/Sleeper writes,
paid call, merge or deployment. Production build/CI and final independent source
review remain required before merge.
