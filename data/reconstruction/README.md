# Pinned reconstruction inputs (#217 Stage 2)

The price-history reconstruction artifact was previously prepared from
operator-held input files that were never committed, so the dataset
could not be reproduced from the repo. This directory pins those
inputs to committed sources. Regenerate with:

```
npm run price-history:inputs
```

The generator is deterministic: on unchanged sources it rewrites
byte-identical files, and `src/data/__tests__/modeled-backfill-inputs.test.ts`
fails if the committed files drift from the derivations.

| File | Contents | Source |
| --- | --- | --- |
| `inputs.json` | The frozen prepare config consumed by `scripts/backfill-price-history.ts` | `scripts/lib/reconstruction-inputs.ts` |
| `directory.json` | `{ playerId: { birth_date, years_exp } }` for exactly the gamelog's 1,025-player scope | Projection of `data/sleeper_players.json` |
| `season-history.json` | Per-player per-season `{ season, fppg, games }` | Derived from `data/gamelog_mapped.json` (games played, mean fppg) |
| `draft-picks.json` | `{ playerId, pick, availableOn }` | The league's two draft receipts (`src/test/fixtures/roster-replay/`); `availableOn` is each draft's completion day (2025-10-20 startup, 2026-10-05 rookie) |
| `manifest.json` | The artifact identity these inputs define | Recorded by the generator |
| `membership.json` | Roster-replay membership snapshot (team → day → player ids) the backfill runner composes against | Exported from the captured replay receipts — see the runner section of ARCHITECTURE.md |
| `recorded-inventory.json` | Team-days the recorded lane admits (the backfill runner's required input) | Currently empty — see below |

The manifest pins **datasetId
`9404b6bc05de4ce7765d02cfe2ef095105365f88b9073a7c464f9cdcc70d035d`**:
104,407 points, **all `gamelog` source, zero `backtest` points**. The
zero is by construction — season history derived from the same logs
gives the engine's annual fallback complete coverage to supersede, so
it never fires. That matters for the contract: annual points may never
enter the daily modeled series, and with these inputs they do not
exist. (The standard flow agrees: `npm run price-history:prepare --
data/reconstruction/inputs.json out.json` produces the same datasetId
and points hash.)

## The recorded inventory

`recorded-inventory.json` lists the team-days the recorded lane
admits; the modeled producer emits a point only where the inventory
admits nothing. It is currently **empty**, which is a measured fact,
not an assumption: the recorded lane's first day is 2026-10-08 (the
#217 census), after the last day the modeled lane can price — the
membership-proven 2025 segment ends 2026-04-01, and 2026-segment days
have no same-season anchors. The runner refuses to run without the
file, so if a future window could overlap recorded coverage, the
inventory must be regenerated from the retained recorded export first.

## Legacy minutes: exactly where they can and cannot reach

The dot's post-#252 validation question, answered from the code and
measured on the committed dataset.

**Where minutes enter the model** — only in
`src/data/reconstruct-price-history.ts`, and only as the *cumulative
career-minutes* sum accumulated over a player's games in date order:

- as the experience input to `emaAlpha(age, Math.max(minutes,
  yearsExp * 1500))` (the EMA learning-rate tier), and
- as `prospectWeight(minutes, yearsExp)` in the price function (the
  pedigree-vs-production blend, `exp(-max(minutes, yearsExp*1500)/800)`).

**Where they never enter**: trailing production
(`previousProduction`) reads completed-season fppg totals only —
from season history, or from gamelog fppg sums — and annual points
compute their minutes synthetically as `games * 30`. The Stage 2
producer itself consumes no minutes at all: it reads the artifact's
points (player, day, price) and nothing else.

**Which legacy rows are actually misread**: only **2024-25**. Its
stored values are tenths whose digit distribution (.0 and .6 thin, .7
essentially absent) is the signature of MM.SS source values misread as
decimals and rounded to 0.1, as disclosed on PR #252. The 2021-22,
2022-23 and 2023-24 rows store **whole minutes** (every value an
integer), where no misreading exists; 2025-26 was corrected in
Stage 1.

**Measured sensitivity** (guarded by the inputs test): rebuild the
artifact with the 2024-25 rows decoded back to true minutes — an
approximation within ±0.1 min/row, since the stored values were
already rounded — and diff every price:

| Season | Points changed | Max Δ | Mean Δ (changed) |
| --- | --- | --- | --- |
| 2022-23 | 0 / 25,649 | 0¢ | — |
| 2023-24 | 0 / 26,026 | 0¢ | — |
| 2024-25 | 4,434 / 26,084 (17.0%) | 52¢ | 4.08¢ |
| 2025-26 | 2,198 / 26,648 (8.25%) | 13¢ | 2.75¢ |

So the 2025-26 prices the producer emits carry a bounded
*initialization* sensitivity to the pending legacy-minutes
regeneration decision: at most 13¢ on 8.25% of points, zero on the
rest, arriving solely through the cumulative-minutes state carried
into the season. At the team level (both packages built by the
runner, subtotals diffed): 1,476 of 1,630 emitted team points would
see some subtotal change — a roster of ~20 players accumulates many
small chances — but the largest change is **21¢** and the mean is
**6.82¢** on subtotals of ~100,000¢, i.e. at most ~0.02%. If
regeneration is approved later, the datasetId changes and the modeled
series must be regenerated under the new binding — the producer fails
closed on a dataset mismatch, so the two datasets' points can never
be silently mixed.
