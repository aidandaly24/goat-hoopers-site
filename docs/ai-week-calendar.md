# AI Decides week calendar — reviewed first-tip windows

`ai-week-calendar.json` is the reviewed calendar the AI Decides current-week
publication selection (`GOAT_AI_PUBLICATION_TARGET=current`) reads through
`src/data/ai-decider/week-calendar.ts`. Following the arcade calendar pattern,
it is a versioned docs artifact with named sources — not a runtime fetch, not
a derived schedule, and not imported by the arcade. It is consumed only by
the AI publication lane. A season/week with no entry has no verified window
and current-week selection fails closed.

It records, per entry: the week's first NBA tip (`firstTipAt`), the fixture
identifiers observed at that instant, the source the window was observed
from, and a `calendarVersion` that is frozen into the published snapshot's
provenance. If the artifact's version or first tip ever disagrees with a
stored record, publication and cache reads fail closed / go stale rather
than silently re-bounding the week.

The window is a publication deadline only. It is not a fantasy matchup
period: no week end is asserted (`endsAt` stays null) and no outcome
finality is inferred from it.

## Entry: 2026 Week 2 (`ai-week-2026-2`)

- Version: `espn-scoreboard-observed-20261026/ai-week-v1`
- Source: [ESPN NBA scoreboard, 2026-10-26](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261026),
  read 2026-10-26 ~17:16 UTC. The scoreboard lists nine games that day; the
  earliest scheduled starts are 2026-10-26T23:00:00Z.
- First tip: **2026-10-26T23:00:00.000Z** (7:00 PM ET), shared by two fixtures:
  - `401909868` — Washington Wizards at Charlotte Hornets
  - `401909869` — Minnesota Timberwolves at Cleveland Cavaliers
- Sleeper cross-check at observation time: NBA state season 2026, regular,
  week 2 / leg 2, `season_start_date` 2026-10-20; GOAT Hoopers league
  `1387473752807190528` in season with five live Week 2 matchup pairs. So the
  Sleeper Week 2 target and this calendar window describe the same week.
- Week 1's first tip (2026-10-20T19:00:00Z, `WEEK_ONE_TIP_OFF_ISO`) is
  deliberately NOT an entry here: Week 1 publication used the preseason
  leg-0 path, and this calendar exists only for in-week (regular-phase)
  current selections.
