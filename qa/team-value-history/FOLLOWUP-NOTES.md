# Changed players, current value and historical evidence

Source baseline: `d0e64042bde9859f7d3f0fbef09b45e64393a5c1` (released PR246).
This follow-up changes consumer rendering only. No price, roster, snapshot,
transport, producer, persistence or configuration algorithm is changed.

## What the UI fixes

The default detail list contains only continuing players with a compatible,
nonzero dated-price difference, sorted by absolute change. The screenshot's
eight-player example therefore shows Tobias Harris `$24.35 to $10.96`,
`−$13.39`, with `1 changed · 7 unchanged`. Full selected rosters, moves and
exact timestamp/source evidence remain available in native disclosures.
Unknown comparisons are counted separately; different model versions, missing
prices and contradictory quote identities never become zero changes. Roster
entries/exits are membership changes, not player-price gains or trade profit.

The headline and selected graph point have different inputs:

| Display | Source at this baseline |
| --- | --- |
| Headline | `data/personalized-home.ts:23–28`: current directory roster and current request's `market.stocks`, summed by `domain/roster-value.ts` in integer cents and returned in currency units. |
| Selected history | `data/team-value-history.ts`: retained quote instants from `stock_snapshots`, summed for membership replayed at that instant. Only actual retained evidence becomes a point. |
| Envelope `currentQuote` | `data/team-value-history.ts:719–736`: current anchor roster at the latest admitted **saved** quote instant, not the request-recomputed headline. |

The consumer now calls the last item **Saved quote for current roster**, and
Sources shows the actual headline total/coverage/calculation timestamp passed
from the same `HomeTeamSummary` used above it. Selected historical value, roster
and timestamp remain separate. A regression uses the actual offline producer:
identical roster and quote inputs reconcile exactly; changing current-only
quotes changes the headline without rewriting historical evidence. The user's
screenshot does not include both totals; the exact live mismatch is still
unverified. This PR explains demonstrably different bases, rather than claiming
to have repaired an unobserved calculation discrepancy.

## Configured cadence, not an audit of production operation

- `data/league.ts:1175–1202`: a market load calls `getMarketInputs`, computes
  prices and attempts `saveSnapshot`. React `cache` deduplicates work within a
  request. This is request-driven, not a continuous price stream.
- `data/sleeper.ts:182–214,237–244`: normal league/roster/user/NBA-state and
  transaction inputs use a 300-second upstream cache. It is not a scheduled
  recomputation interval. The player directory also has a 300-second local TTL.
- `data/nba-stats.ts:38,229–245`: fundamentals have a 24-hour cache, with a stale
  fallback on source failure. Calculation time is not necessarily source age.
- `data/stocks.ts:35–42,142–164`: market loads attempt a batch only after a
  24-hour gap from the latest global snapshot, then delete snapshots older than
  30 days. Writes are best effort; inactivity/failures can miss days. The
  read-then-insert throttle is not atomic across concurrent requests, so the
  minimum is not proof of exactly one batch per day in production.
- `vercel.json`: only the AI-decides weekly route is scheduled, daily at 09:00
  UTC; there is no stock valuation cron. Ticker rotation is visual, not a quote
  refresh stream.

## What repository evidence establishes about history

`docs/team-value-history-inventory.md` records an earlier #217 audit whose
retained quote span started **2026-10-08**. That is an audit at its stated time,
not a fresh database measurement or proof that prices before then ever existed.
The current team-history adapter reads the same `stock_snapshots` table and
reports truncation at its 5,000-row bound (`data/recorded-quotes.ts:61–78`).
Thirty-day deletion conflicts with all-time preservation, but that code alone
does not establish which particular older observations were deleted or backed up.

The captured `src/test/fixtures/roster-replay/manifest.json` and its hashed
draft/transaction/roster projections support dated **membership** in the proven
2025 and 2026 segments. Intermediate membership is replay-asserted; the offseason
gap remains unknown. Those receipts contain no historical market quotes.

`docs/price-history-repair.md` documents a prior audit of **78,129 reconstructed
rows across 879 players**, from `gamelog` and annual `backtest` estimates for
2022–23 through 2024–25. It also documents defects and a proposed reviewed
replacement, not proof that a repair was executed. These estimates are distinct
from recorded snapshots. The stored schema and selected-player read adapter
exist; no current production population, accepted repair generation, calibrated
scale or 2025–26 game completeness is established by this consumer check.

`docs/modeled-valuation-timeline.md` provides a pure, presently unwired contract
for explicitly held estimates between supplied model updates. It is not daily
recorded evidence. The #198 captured-source candidate is also not consumed by
the team producer; its source/publication gates remain unchanged. Today's
prices or today's roster cannot substitute for historical team valuations.

Remaining unknowns require evidence, not interpolation:

1. Current saved-quote bounds, per-day/cohort counts and gaps for the affected
   roster IDs, and whether any existing backup/export retains earlier quotes.
2. Current `price_history` source/season coverage and its completed import
   manifest, model/input provenance, scale and repair status.
3. A supported membership source for the offseason gap and a reviewed price
   source covering the league's earlier supported membership segments.
4. For the reported mismatch: the selected team/date/quote IDs, current headline
   inputs and coverage, and their respective calculation/source timestamps.

Existing owner receipts may answer these. Otherwise a separately authorized,
scoped read-only aggregate/export review of `stock_snapshots`, `price_history`
and `price_history_import_state` would resolve bounds/population; a paired
authenticated read would resolve the exact displayed mismatch. None of those
production reads, backup restores, new source fetches or imports ran here.

## Producer proposal — separate from this consumer PR

Muse retains producer/persistence ownership. The retention handoff is
[#224 comment 6347551887](https://github.com/aidandaly24/goat-hoopers-site/issues/224#issuecomment-6347551887).
A safe source correction should preserve immutable observed quotes, separate
display/query windows from storage retention, and bound/page long-range reads.
Simply removing pruning while retaining the current 5,000-row all-window read
would eventually fail closed. Existing #219 storage work should be assessed
before adding another history store. No existing records should be overwritten
or reconstructed prices relabelled as observations.

The smallest product decision for a subsequent architecture PR is: **should the
headline use the latest saved daily valuation version?** That lets the latest
graph point and headline share an explicit version while selected past dates
remain historical. A fresh request calculation is a different product choice.

A bounded implementation could use the existing Vercel scheduler and database:

1. A default-off job computes one version at a declared cutoff, then atomically
   appends immutable quotes, roster identity, team sums/coverage and model/input
   provenance. Locking and a unique cutoff/version make duplicate invocations
   idempotent. Failed writes leave the previous complete version intact.
2. Headline and latest history read that same committed version and updated-at
   metadata. Display refresh reads saved results without creating snapshots.
3. Preserve existing observations. Measure row/index bytes, query plans and
   quotas; use bounded reads and a queryable archive if needed. Retention,
   schema and activation remain separately reviewed producer work.

[Vercel's current cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
include cron on existing plans, but function usage still counts. Hobby permits
once-daily execution with hour-level timing precision; more frequent scheduling
requires a compatible plan. The site's actual plan, runtime and database budget
were not inspected, so no zero-cost or exact-time guarantee is made.
[Delivery can be duplicated or missed](https://vercel.com/docs/cron-jobs/manage-cron-jobs),
which is why locking, idempotency and explicit staleness belong in the design.
No new service is inherently needed for a daily design, but no schedule,
credential, deployment setting, migration or production write is authorized by
this proposal. Source design review comes before any activation decision.
