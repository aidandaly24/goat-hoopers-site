# Weekly player evidence (`src/data/weekly-player-evidence.ts`)

Read-only, points-only adapter returning **observed fantasy-week facts** for
exactly one previous completed week of the current league/state season.
Issue #190; built under Aidan's 04:08 UTC ruling.

## What it returns

`getObservedPlayerWeek(deps)` resolves one candidate week — the previous leg
(`state.leg ?? state.week`, minus one) — and returns, per team, the recorded
per-player fantasy points from Sleeper's `players_points` payload, plus the
canonical league/season/week and a coverage block. Or a typed `unavailable`
result with a reason (`no_previous_week`, `preseason`, `season_mismatch`,
`invalid_state`, `fetch_failed`, `malformed_matchups`, `missing_player_points`,
`no_recorded_production`). Nothing is ever manufactured.

## What it explicitly does NOT do

- **No games played.** Weekly GP is unconstructible from supported sources
  (see below). Every row carries `participation: "unknown"` and
  `gamesPlayed: null`, always — including for positive points.
- **No participation claims.** It does not assert played, DNP, benched, or
  injury history from points, starter slots, or current `injury_status`.
- **No verdicts.** No best/rough week naming, no form averages, no interval
  sums. Source facts only. This does **not** satisfy CompletedPlayerWeek or
  its positive-games gate.
- **No recorder.** There is no snapshot capture, no deadline, no write path.
  Points come straight from the matchup payload; nothing is differenced.

## Completion semantics (the 0–0 tie trap)

Unplayed/preseason weeks return non-null all-zero points (observed live:
2026 week 1 shows `points: 0.0` with an all-zero `players_points` while the
season has not tipped off). Therefore **points presence never certifies
completion**. Completion is established only by state advancement: the
state's leg has moved past the candidate week.

Validation, all fail-closed:
1. League and NBA state seasons match (`^20\d{2}$`).
2. `season_type` is `regular` or `post` (rejects `pre` and anything else).
3. Leg is a safe integer with `2 <= leg <= 30` (leg 1 has no previous week).
4. The season has tipped off: `now >= season_start_date` (UTC date-only).
   Sleeper's fantasy week 1 begins before tip-off, so anything resolved
   earlier is preseason.
5. The matchup read returns exactly ten entries, paired into five
   `matchup_id` pairs covering roster ids 1–10 (placeholder/partial weeks
   fail closed).
6. **No-recorded-production guard:** if no player row anywhere has points
   > 0, the week is refused as a placeholder — a completed week cannot have
   ~200 players all at exactly 0.0.

No calendar `startsAt`/`endsAt` is fabricated: the week is the API's
canonical week number, and any consumer date copy must not present it as
calendar dates.

## The DNP trap (why GP stays null)

2025 week 1 (completed season, receipts below): 210 `players_points` rows,
**92 of them zero** — DNP-or-scoreless, indistinguishable. A totals-delta
recorder cannot fix this: a player DNP in W1 who plays in W2 before the W1
capture would show GP delta > 0 paired with W1 points 0, falsely labeling a
DNP as a zero-point week. Season totals carry no stat-as-of timestamp, so
no capture window cures the contamination. GP is therefore left explicitly
null, and zero-point players are excluded from any poor-performance naming
by consumers (unknown participation) — the contract's DNP protection,
reached without a recorder.

## Payload receipts (sanitized)

Pulled live 2026-10-19 (~04:00–04:30 UTC). Player ids are Sleeper ids;
values are fantasy points under league scoring.

**`GET /league/{id}/matchups/1` (2025 league `1282883196567977984`, completed
season), 6,392 bytes for all ten entries:**

Entry keys: `roster_id`, `matchup_id`, `points`, `players` (22 ids),
`players_points` (dict id → points, incl. bench), `starters_points` (10
values, starter order). Sample: `players_points` `{"1444": 0.0, "1595":
24.5, "2308": 43.0, …}` (22 rows); `starters_points` `[31.0, 25.5, 24.0,
26.5, 43.0, 24.5, 19.5, 23.5, 14.0, 18.0]`; Σ = 249.5 = team `points`
exactly — Sleeper-computed, no inferred multipliers. Across all ten
entries: 210 player rows, 92 at 0.0.

Note: these field names are payload-verified but absent from the
docs.sleeper.com example, and the repo's shared `RawMatchupEntry`
(`src/data/sleeper.ts`) drops them. This adapter validates the raw shape at
runtime with local types; Dot owns the shared extension and any app
integration after review.

**`GET /state/nba` (2026-10-19):**
`{"week": 1, "leg": 1, "season_type": "regular", "season": "2026",
"season_start_date": "2026-10-20", "display_week": 1,
"season_has_scores": true}` — leg 1 with a future start date: the current
week is preseason, so the adapter currently returns
`unavailable/no_previous_week` (leg < 2), which is the honest answer.

## Bytes, cache, staleness

- One `GET /league/{id}/matchups/{W}` read per call (~6.4 KB measured for a
  full 10-team week). No per-team or per-player fanout.
- The adapter adds no cache of its own. Staleness is bounded by the
  injected matchup reader's cache (the default wiring reuses the existing
  300-second Sleeper cache). Completed-week payloads are stable; a Sleeper
  revision is re-read after revalidate.
- The league/state reads ride the same existing cached readers.

## For consumers (Dot's integration)

- `ObservedPlayerWeek.teams[].players[]` rows: `{ playerId, points,
  participation: "unknown", gamesPlayed: null }`. `points: null` means no
  recorded value (absent from `players_points` or non-numeric) — distinct
  from a recorded zero.
- `observedPlayersForCurrentRoster(week, rosterId, currentRosterPlayerIds)`
  is the pure historical-roster/current-roster intersection helper.
- Coverage block reports teams/players with data, rows with points, and
  dropped corrupt rows. Partial evidence is explicit, never silent.
- Credit: the `players_points`-direct semantics were proposed by apk2302
  and adopted in Aidan's ruling; the DNP counterexample that killed the
  recorder came from Aidan's review.
