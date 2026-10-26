# Weekly player evidence (issue #190)

Verified per-player performance for a completed fantasy week: which game
counted for each starter, how many games he actually played, and the
fantasy points that counting game produced. This feeds the personal
player guide's Your Best / The Rough Week lists and the league-wide
Week 1 best-players showcase for the Week 2 site update.

## Why a generated receipt instead of a live read

This league scores in **lock-in mode**: a starter's week is one game —
the game locked in the matchup leg's `starters_games` map, or his final
game of the week when never locked. No Sleeper read exposes the counted
points per player after the week closes (all verified live 2026-10-26):

- **Public REST** `GET /v1/league/<id>/matchups/1` returns `points`,
  `starters`, `starters_points` and `players_points`, but its per-player
  values ignore locks and its starter list can lag the final leg (roster
  9's REST starters differ from its leg starters). Roster 8's REST total
  is 250.5 against an official 247.5: REST shows Herro's first game
  (23.0) instead of his locked 29.5 and Daniels's 34.5 instead of his
  locked 25.0. REST numbers must never be published as Week 1 results.
- **The authenticated matchup leg** (`matchup_legs(round, league_id)`)
  is the ground truth — official team total, the eleven starters, the
  lock map, and it reproduces the official standings exactly — but it
  carries no per-player points.
- **Sleeper's GraphQL player stats are not implemented for the NBA**
  (`stats_for_players_in_week` returns "Sorry, nba stats are not yet
  implemented"; `weekly_stats`/`game_stats` return no rows).

So the counted points are reconstructed and then **reconciled**: ESPN box
scores (the source the site already uses for live games) are scored with
the league's own `scoring_settings`, and each team's reconstructed sum
must match the leg's official total before the week may be served.

## The receipt

`src/data/weekly-receipts/<season>-week-<NN>.json`, produced by the
operator-run generator:

```bash
SLEEPER_JWT=<raw token, no "Bearer"> \
  python3 scripts/generate-weekly-evidence.py --week 1 --season 2026
```

The token is read from the environment only and never stored. The
generator:

1. Reads the week's matchup legs (starters, lock map, official totals)
   and the week-tagged game list from Sleeper's authenticated GraphQL.
   Week boundaries are source facts, not wall-clock guesses: `startsAt`
   is the week's first tip and `endsAt` the next week's first tip.
2. Matches every game to its ESPN event (ET date + team pair), pulls the
   box scores, and maps athletes through `src/data/espn-id-map.json`.
   A player "played" a game when the box score records minutes > 0.
3. Scores every played game with the league's `scoring_settings`.
   Two Sleeper bonus behaviours were established empirically against
   known values: a triple-double earns the double-double **and**
   triple-double bonuses, and a 50-point game earns the 40- **and**
   50-point bonuses.
4. Picks each starter's counted game — the leg's locked game, otherwise
   his final played game — and reconciles the team sum against the
   leg's official points.

Generation is **fail-closed**; none of these is inferred from score sums:

- Every week-tagged game must report Sleeper status `complete` and a
  final ESPN status, or generation aborts. An in-progress week produces
  no receipt, however well interim totals might reconcile.
- `endsAt` comes only from the next week's `scores` rows. If that
  source is absent, generation aborts — the last game's start is never
  substituted as a boundary.
- Every game must match an ESPN event and return a box score for both
  teams, or generation aborts. Partial coverage is not a receipt.
- An explicit lock whose game has no box-score evidence for the player
  (no stat line, and the box score does not record him as present at
  all) marks the row unproven (`evidenceComplete: false`) and forces
  the team `unreconciled`. Another played game is **never** substituted
  for a locked game. A box score that affirmatively records the player
  as present without an appearance (DNP / 0 minutes) instead proves the
  locked game counts as zero.

The generator's selection, classification, window and completion rules
are covered by offline fixtures: `python3
scripts/generate-weekly-evidence.py --self-test`.

### Reconciliation status

- `verified` — residual exactly 0. The counted games are proven, and
  the values are actuals.
- `estimated-foul-residual` — residual is a positive multiple of 2, at
  most +4. ESPN box scores do not itemise technical or flagrant fouls,
  which Sleeper scores at −2 each, so such a residual is fully
  explained by fouls the box score cannot show — but a team residual
  does **not** prove which player or game caused it, so the gap is
  never attributed to an individual and never spread across players.
  The per-player values are box-score **estimates**, bounded by the
  disclosed residual. A negative residual, or one that is not a
  multiple of the −2 foul unit, is not explained by fouls at all and is
  never given this status. Week 1: rosters 1 (+4.0), 6 (+2.0) and 8
  (+2.0).
- `unreconciled` — the counted games cannot be identified from
  available sources, the residual is unexplained, or lock evidence is
  incomplete. The adapter refuses to serve the team anywhere. Week 1
  roster 9 is unreconciled (residual +26.0 against its official 214.0,
  with its locks mutually inconsistent with the total under every game
  combination that fits — 598 combinations reach 214.0, so no honest
  per-player answer exists yet). The showcase reports the team as
  unavailable rather than ranking invented numbers.

## The adapter

`src/data/weekly-player-evidence.ts` is pure and fetch-free; receipts are
passed in (dependency inversion) and validated at load
(`parseWeeklyEvidenceReceipt` re-derives each team's computed total and
residual from its rows and drops any receipt that disagrees with itself).

- `getCompletedPlayerWeek(receipts, { season, week, teamId })` — the
  domain `CompletedPlayerWeek` for one team, or null. This is the
  **exact-points contract**: the guide labels its values "Actual
  recorded fantasy points", so only `verified` teams (residual exactly
  0) are served. Estimated and unreconciled teams return null and the
  guide falls back to its unavailable state — an estimate is never
  relabeled an actual. Players are the week's eleven starters only:
  they are the players whose participation in the team's score the leg
  verifies. A starter who never appeared keeps `fantasyPoints: null`
  with `gamesPlayed: 0` (a DNP is excluded by the guide, never shown as
  a rough week); a verified zero with appearances stays 0.
- `getPreviousCompletedPlayerWeek(receipts, { season, currentWeek, teamId })`
  — the same for `currentWeek - 1`.
- `getWeekShowcase(receipts, { season, week, limit? })` — every team's
  top counted performances (default 3; ties broken by games played,
  then player id) plus `unavailableTeamIds` for the honest gap. Each
  team entry is discriminated by `basis`: `verified` entries carry
  proven `fantasyPoints`; `estimated-foul-residual` entries carry
  `estimatedPoints` (a differently named field, on purpose) with the
  team's `officialPoints`, `computedPoints` and `residual` disclosed.
  A surface rendering the estimated shape must present the values as
  estimates — the type makes the actual-points path unreachable for
  them.
- `WEEKLY_EVIDENCE_RECEIPTS` — the committed receipts, validated.

## Wiring (Dot-owned surfaces)

Per the #190 split, integration belongs with the guide/home owners:

1. In `getHomePlayerGuideSources` (`src/data/league.ts`), replace the
   hard-coded `completedWeek: null` with
   `getPreviousCompletedPlayerWeek(WEEKLY_EVIDENCE_RECEIPTS, { season, currentWeek, teamId })`
   using the NBA state the loader already reads (`season` from
   `state.season`, `currentWeek` from `state.week`). That lights up Your
   Best / The Rough Week for every **verified** team with no surface
   changes (Week 1: rosters 2, 3, 4, 5, 7, 10). Estimated teams
   (rosters 1, 6, 8) deliberately stay on the guide's unavailable state:
   the guide's copy promises actual recorded points, and only the
   showcase may show their estimates, labeled as estimates.
2. For the league-wide showcase, hand `getWeekShowcase(...)` output to a
   home/season-hub surface next to the standings; branch on each team's
   `basis` — verified entries render as recorded points, estimated
   entries render as estimates with the residual disclosed — and render
   `unavailableTeamIds` as an explicit "not yet verified" row.

## Week 1 source facts, reconciled

Two figures in the original receipt drew questions; both are settled
by the sources themselves:

- `startsAt` is **2026-10-20T19:00:00Z**, not 23:00Z. Sleeper `scores`
  tags an afternoon game as Week 1's first tip (Detroit, 19:00Z), and
  ESPN's matching event (401909088, Little Caesars Arena) independently
  records 2026-10-20T19:00Z with `STATUS_FINAL`. The 23:00Z figure is
  Week 2's first tip — this receipt's `endsAt` — and was never Week 1's
  start.
- `generatedAt` precedes `endsAt` by design of the boundary:
  `endsAt` is the *next* week's first tip (an exclusive scheduling
  bound), not the week's last game. Week 1's last game tipped
  2026-10-26T01:00:00Z, and all 43 week-tagged games carried Sleeper
  status `complete` with final ESPN statuses when the receipt was
  generated. Completion rests on that per-game final evidence — which
  the generator now enforces — not on the end bound having passed.
  (The guide separately declines to show a week until `endsAt` has
  passed, so the Week 1 recap cannot light up before 23:00Z on
  2026-10-26 regardless.)

The Week 1 receipt was regenerated on 2026-10-26 under the fail-closed
generator rules from the same day's source snapshot: every player row,
counted game and team total is unchanged; the regeneration reclassified
rosters 1, 6 and 8 from the old `verified-foul-residual` label to
`estimated-foul-residual` and recorded `evidenceComplete` per team.

## Weekly operation

After each week closes (the next week's first tip has passed), rerun the
generator for that week and commit the new receipt plus a one-line
registry addition in the adapter. When the generator itself changes,
run its offline fixtures first (`--self-test`). No credentials, database
writes, or runtime fetches are involved at serve time.
