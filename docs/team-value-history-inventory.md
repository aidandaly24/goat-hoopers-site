# Team-value-history inventory — retained quotes vs proven membership

Issue #224 wiring contract, deliverable (a): what the recorded-only
history producer (`src/data/team-value-history.ts`) can actually
serve, split into **recoverable-omitted** (retained somewhere the
producer could read, but currently doesn't) vs
**genuinely-unavailable** (no retained source carries it). No claim
here infers history from today's quotes: every row names its source.

## The two evidence lanes

**Recorded quotes** come from one place: the `stock_snapshots`
table, read read-only through `src/data/recorded-quotes.ts`
(`readWindow` — original snapshot ids, integer cents, native
microsecond timestamps, scoped by player id; the adapter imposes no
earlier date bound itself). The snapshots are the stock surface's
modeled prices, written by `src/data/stocks.ts` at most once per
player per day (`SNAPSHOT_MIN_INTERVAL_MS`, stocks.ts) and pruned
to a 30-day retention on every write (`RETENTION_DAYS = 30`,
stocks.ts:35; prune at stocks.ts:~161). Per the #217 audit, the
retained span starts **2026-10-08**; snapshot days inside the span
can still be missing (daily cadence, not continuous capture), and a
missing day is a gap — never a zero.

**Daily membership** comes from the forward replay
(`src/data/roster-replay.ts`, wired in by this PR): the 2025
startup draft's assignments replayed through the 2025 league's
completed moves, and the derived 2026 boundary roster replayed
through the 2026 draft and the current league's completed moves.
Both segments' final rosters are verified against Sleeper's
observed rosters at load; intermediate instants are replay-asserted,
not independently observed.

## Coverage matrix

| Window | Membership | Recorded prices | Verdict |
| --- | --- | --- | --- |
| Before 2025-10-20 | Unproven (founding draft not complete) | None retained | Genuinely unavailable |
| 2025-10-20 → 2026-04-01 (2025 season) | **Proven** by forward replay | None — zero retained quotes predate 2026-10-08 | Prices genuinely unavailable; membership served with null prices |
| 2026-04-02 → 2026-08-12 (offseason gap) | **Unproven** — no rows in either league's feed; the boundary reconciliation derives the 2026-08-13 anchor but observes no gap day | None retained | Genuinely unavailable (both lanes) |
| 2026-08-13 → 2026-10-07 | **Proven** by forward replay | None retained (pre-span) | Prices genuinely unavailable; membership served with null prices |
| 2026-10-08 → now | **Proven** by forward replay | Retained where snapshot days exist | Served as recorded points; missing snapshot days are explicit gaps |

## Recoverable-omitted

**None in the quote lane.** The producer's quote scope is the
team's anchor roster, every player the forward replay proves on the
team in either segment, and every counterparty of a
cutoff-admissible completed current-league move, read over the full
league window — nothing retained in `stock_snapshots` for those
players is excluded by the read, and nothing outside that scope is
that team's evidence. (Scope note, from the dot's review of the
wiring PR: the scope originally derived from the anchor plus
current-league legs only, which excluded a retained quote for a
player the replay proves on the team in 2025 — e.g. a synthetic
retained quote for a 2025-proven player on 2025-11-01 was not read.
The scope now derives from all proven membership; membership alone
still supplies no dated valuation — a point exists only where a
retained quote was actually read.) Quotes pruned
by the 30-day retention are **destroyed, not omitted** — they are
genuinely unavailable, which is exactly the persistence question
gated to the ~Nov 7 joint decision (persisting recorded points
before the prune window closes needs the #219 migration, joint
Muse+dot decision, and Aidan's production authorization; none of
that is implemented here).

One known **display** omission, not price or membership evidence:
the 2025 startup draft's 200 picks are proven (they anchor the
replay) but are not emitted as day-detail events — a deferred
display channel tracked on #224, not an inventory gap.

## Reconstruction inputs (candidates, none admitted)

- **ESPN core API v2 by-athlete fixture** (issue #198): a captured
  2025-26 game-log dataset held off-repo, with a normalized extract
  on branch `muse/198-fixture-extract`. It is a candidate input to
  a future modeled backfill; **no code path in this producer reads
  it**, and it is not a price source under the current contract.
- **Modeled-valuation machinery**: `src/data/modeled-valuation-timeline.ts`
  (a pure read contract with no production caller yet, per
  `docs/modeled-valuation-timeline.md`) plus the price-history
  plan/reconstruction modules (`price-history-plan.ts`,
  `reconstruct-price-history.ts`, `price-history-artifact.ts`)
  exist for the stock surface. Whether any modeled price may stand
  in for a pre-Oct-2026 history price — and labeled how — is the
  **open, joint Muse+dot price-source decision on #217**. Until
  it lands, reconstruction prices are genuinely unavailable to this
  producer, and the wired envelope labels the pre-Oct-2026 span
  membership-proven / price-unavailable rather than filling it.

## What this means for the surface

- Priced points exist only where retained recorded quotes exist
  (2026-10-08 onward, snapshot days only).
- Membership is served — with null prices — across both replayed
  segments, including the full 2025 season.
- The gap asserts nothing: no membership, no prices, no events.
- Nothing here backfills, reconstructs, or persists; the producer
  remains read-only and the #219 tables remain unpopulated.
