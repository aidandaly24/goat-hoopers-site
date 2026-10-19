# Weekly player evidence — ObservedPlayerWeek adapter

Ownership: issue #190. Adapter (`src/data/weekly-player-evidence.ts`, tests,
this doc): Muse. Integration (any `RawMatchupEntry` extension, a
`src/data/league.ts` loader, wiring into `PlayerGuideSources`): Aidan's Dot,
after exact-head review of the adapter PR. **Status: unwired.** Nothing in
the app calls this module yet, by design; the deployed player guide remains
in its strict unavailable state until integration lands.

## What the adapter returns

`createWeeklyPlayerEvidence({ sources })` builds an adapter around four
injected payload sources (AGENTS.md rule 11 — no concrete client is
imported; in particular this module does not import `src/data/sleeper.ts`
and never fetches `api.sleeper.app` itself). Its one operation,
`getObservedPreviousWeek(teamId)`, never throws and returns either:

- `{ status: "available", evidence: ObservedPlayerWeek }` — canonical
  league/season/week, the team's source roster IDs for that week, and the
  recorded per-player fantasy points for the intersection of the week's
  roster with the current roster, plus explicit coverage (below); or
- `{ status: "unavailable", reason, detail }` — partial or uncertifiable
  evidence is reported, never dressed up as an empty success.

`ObservedPlayerWeek` is a local type in the adapter file. Per player row:
`fantasyPoints` is the exact recorded value from the source (no rounding,
no rescoring), or `null` when the source carried no usable value — `null`
is not a zero. `participation` is the literal `"unknown"` on every row and
`gamesPlayed` is `null` on every row.

## This is not CompletedPlayerWeek

The distinction is the point of the contract split, so it is stated
plainly:

| | `CompletedPlayerWeek` (`src/domain/team-player-guide.ts`) | `ObservedPlayerWeek` (this adapter) |
|---|---|---|
| Period bounds | `startsAt` / `endsAt`, exact source period | **No such fields.** No source publishes a fantasy week's calendar bounds; none are fabricated |
| Completion | `complete: true` certifies the period | The week is bounded by state leg (below), but the type carries no completion flag and certifies no period |
| Participation | Verified; zero counts only with `gamesPlayed >= 1` | **Never established.** Recorded zeros stay zeros with participation unknown; positive points do not satisfy the positive-games gate either |
| Games played | `gamesPlayed` per player | `null` for every player — no supported source yields weekly GP |
| Injury context | `injuryNote` | **No injury field at all.** Nothing asserts played / DNP / injury history from points, starter slots, or current `injury_status` |

Consequently this adapter must not be fed into the guide's best/rough
ranking as if it were completed-week evidence. It supplies source facts
only: no sums, averages, or other aggregation that could become a form or
underperformance signal (an unknown-game zero week would silently depress
any such measure and penalize DNPs). A separately labelled
positive-contributors presentation may be considered after review; it
must not replace the deployed strict guide gates.

## Week determination and completion rules

Sleeper calls the NBA fantasy week number **leg**: transactions carry the
week in `leg` (`transform.ts` maps `t.leg` to `week`), `RawNbaState`
documents "Sleeper NBA uses leg; preseason is zero", and `league.ts`
derives the current week as `state.leg ?? state.week`. The adapter reads
the current week the same way, additionally requiring leg and week to
agree when both are present, and certifies exactly one week:
`targetWeek = currentWeek - 1`. Current and future weeks are therefore
incomplete by construction, and the read is narrowed to the same
league/state season — no other week, season, or league is reachable.

Completion is established from state advancement only, never from points
presence (see the preseason trap under Receipts). League `status` is never
consulted: a `complete` league cannot certify arbitrary historical or
future placeholder weeks the state does not bound.

Rejections (all explicit unavailables):

- `preseason` — `season_type: "pre"` (leg 0), regardless of payload zeros
  or league status.
- `no-completed-week` — regular season, leg 1: the first week is in
  progress.
- `unsupported-season-type` — `season_type` other than `regular`/`pre`
  (e.g. `post`): this narrowed adapter bounds regular-season weeks only.
- `state-invalid` — state missing/not an object, no season, `league_season`
  disagreeing with `season`, leg/week missing, non-integer, disagreeing
  with each other, zero outside preseason, or beyond the sane bound (54).
- `season-mismatch` — league season differs from state season (e.g. after
  rollover, before the league object is the new season's).
- `league-invalid` / `rosters-invalid` / `matchups-invalid` — malformed
  payloads, including a matchup entry with no `players` list, no
  `players_points` map, or duplicate entries for one roster.
- `state-unavailable` / `league-unavailable` / `rosters-unavailable` /
  `matchups-unavailable` — a source load failed, or no entries were served
  for the target week.
- `team-not-found` / `matchup-entry-missing` — no current roster, or no
  matchup entry that week, for the requested roster id.

## Roster intersection and coverage

The guide's contract asks for **current-roster** players with their
recorded points for the completed week. The adapter intersects the week
entry's `players` (the roster as it stood that week) with the current
roster's `players`, and reports the full accounting in `coverage`:

- `recordedCount` — intersected players with a finite recorded value.
- `departedPlayerIds` — on the week's roster, no longer rostered: excluded
  from `players`, listed here.
- `unrecordedPlayerIds` — on the current roster but absent from the week's
  roster (e.g. acquired later): excluded from `players`, listed here, and
  **never zero-filled** — they have no recorded points that week.
- `missingPointPlayerIds` — intersected players whose `players_points` row
  was absent or null: their `fantasyPoints` is `null`.
- `invalidPointPlayerIds` — intersected players whose value was
  non-numeric or non-finite: `fantasyPoints` is `null`; the raw value is
  never preserved into the evidence.
- `duplicateSourcePlayerIds` — IDs repeated in the source week's roster
  list (deduplicated, first occurrence wins, reported here).

Starter slots in the payload are never read: starting is not participation
evidence this contract may use.

## Fetch and cache bounds

- One matchup read for the target week covers all ten teams (the payload
  is the full league week). No per-player fanout, no new endpoint family,
  no DB/SQL, no credentials, no recorder.
- The adapter retains at most one week's matchup payload in a single-slot
  cache (24h TTL, injectable for tests). Completed-week payloads are
  effectively immutable; revisions are re-read after the TTL. A failed
  re-read returns `matchups-unavailable` — last-good payloads are never
  presented as fresh evidence.
- State, league, and rosters are loaded through the injected sources on
  every call and never cached inside the adapter, so week determination
  cannot go stale here. In production wiring those sources are the
  existing sleeper fetchers, whose own revalidation (300s) bounds their
  cost upstream.

## Receipts (sanitized, from live payloads)

Verified 2026-10-19 ~03:44Z against the Sleeper public API; full working
notes in the #190 source-verification pass. Player-level values below are
limited to team totals and one arithmetic check; no per-player lines are
reproduced.

**Matchups payload** — `GET /league/{id}/matchups/{week}`. Observed key
set, identical on every entry sampled (2025 W1/W23/W24, 2026 W1):

```
roster_id, matchup_id, points, custom_points, players, players_points, starters, starters_points
```

- `players_points` is a map player_id → fantasy points covering **every**
  player in the entry's `players` array (21–24 entries per roster),
  Sleeper-computed under the league's own scoring settings.
- Self-check: Σ `starters_points` == team `points` **exactly** on all 10
  entries of 2025 week 1 (e.g. roster 1: 249.5 = 31.0+25.5+24.0+26.5+43.0
  +24.5+19.5+23.5+14.0+18.0), and `custom_points` was null everywhere
  sampled. This check is receipts-time verification only; the adapter does
  not aggregate points at runtime.
- `players_points` / `starters_points` are payload-verified but absent
  from the docs.sleeper.com matchups example. `RawMatchupEntry`
  (`src/data/sleeper.ts`) currently drops `players`, `players_points`,
  `starters_points`, `custom_points` — extending it is the integration
  step (Dot-owned), not part of this adapter.

**Preseason trap** — unplayed 2026 week 1 returns the same shape with
`points = 0.0` and every `players_points` value 0.0 — **not null** (the
`RawMatchupEntry` comment "null before the matchup is played" does not
match the live payload). This is why completion comes from state
advancement, never points presence: a points-based check would certify a
preseason week as a completed week of zeros. Relatedly, 2025 week 1 had
92 players at 0.0 — 89 non-starters and 3 starters — which is why a zero
can never be read as played-or-DNP either way.

**State payload** — `GET /state/nba` at verification time:

```json
{ "week": 1, "leg": 1, "season": "2026", "season_type": "regular",
  "league_season": "2026", "previous_season": "2025",
  "season_start_date": "2026-10-20", "season_has_scores": true }
```

League chain: current league `1387473752807190528` (season "2026",
status `in_season`); prior league `1282883196567977984` (season "2025",
status `complete`, via `previous_league_id`). Historical weeks remain
served indefinitely (2025 week 1 was fetched in Oct 2026).

**Games played** — no supported source, by construction of the APIs:
weekly points exist only as the finished `players_points` product; the
season-totals endpoint carries cumulative `gp` only, and the undocumented
weekly stats variant carries no `gp` key in any of 553 sampled entries and
its lines reproduce `players_points` for only 34/100 sampled starters
(period-misaligned — refuted). The bracketed-totals recorder proposed
earlier on #190 was rejected and stays rejected: a capture taken after a
player's next-week games would contaminate the previous week's delta and
could label a DNP a zero-point performance. `gamesPlayed` therefore stays
null rather than approximate.

**Injury context for a completed week** — not constructible: the matchups
payload carries no availability fields, and `/players/nba` `injury_status`
is a current value only. Nothing is back-projected; the type has no injury
field.

## Integration handoff (Dot-owned, after review)

1. Extend `RawMatchupEntry` with the optional `players`,
   `players_points`, `starters_points`, `custom_points` fields the
   payload already serves.
2. Add a `league.ts` loader that constructs `WeeklyEvidenceSources` from
   `fetchNbaState` / `fetchLeague` / `fetchRosters` / `fetchMatchups`
   (the single existing matchup read) and exposes
   `getObservedPreviousWeek` to consumers.
3. Adapt at the domain boundary: this adapter's `teamId` is the numeric
   Sleeper `roster_id`; `CompletedPlayerWeek.teamId` is a string.
4. Record the loader in `ARCHITECTURE.md` with that change. This PR
   deliberately does not touch `ARCHITECTURE.md`: the #190 file scope is
   the adapter, its tests, and this doc, and the adapter has no production
   caller to document until the wiring exists.
