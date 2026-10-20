# Week 1 calendar candidate — not activated

`arcade-week-1-calendar.json` is a complete candidate for the first ranked Free
Throw period, observed October 20, 2026 around 06:37 UTC. Its exact 3,085-byte
UTF-8 file has SHA256
`bf55ed669ffb599d1b802bd6e2d354ec4b0cfbabf22aa33324f1b56b7329ffc5`.
It is not imported by runtime code, installed into an environment, or published
to a database. Explicit production review/activation remains necessary.

## Boundary evidence and derivation

- [Sleeper NBA state](https://api.sleeper.app/v1/state/nba) identifies season2026,
  regular season, leg1/week1 and season_start_date2026-10-20.
- [GOAT Hoopers league](https://api.sleeper.app/v1/league/1387473752807190528)
  identifies the NBA league, season2026 and start_week1. It does not expose a
  complete league period date table. Numeric game_mode1 is not relabelled here.
- [Sleeper's official basketball rules](https://support.sleeper.com/en/articles/4644860-league-formats-game-modes)
  specify Monday/Sunday matchup weeks; [Game Pick details](https://support.sleeper.com/en/articles/4701537-game-pick-details)
  also describe completion early Monday morning.

Thus Week1 assigns the opening Tuesday October20 through Sunday October25.
The competition opening is the user-approved October20 15:00 America/New_York
=19:00UTC, also the first published NBA tip. The later approved opening convention
is New York midnight: October26 04:00UTC, then November2 05:00UTC across DST
(169 hours). These exact midnight instants are a competition convention, not a
claim that Sleeper publishes a precise midnight instant through its API.

## Assigned NBA fixtures

The existing publisher's daily scoreboard endpoint was fetched only for the
opening two weeks; no player directory, stats, rosters or whole season was loaded.
Each response was complete below limit100, and every selected event was regular
season (ESPN season2027/type2), unique, and on its requested New York local date.
All 30 NBA teams appeared in the bounded collection. All observed statuses were
scheduled/pre/completed=false. They establish assignments, not future finality.

| Assigned local date | Events | Publisher response |
| --- | ---: | --- |
| October20 | 3 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261020&limit=100) |
| October21 | 11 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261021&limit=100) |
| October22 | 2 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261022&limit=100) |
| October23 | 12 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261023&limit=100) |
| October24 | 8 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261024&limit=100) |
| October25 | 7 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261025&limit=100) |

All 43 exact event IDs/tip instants are in the JSON. First is401909088,
Boston at Detroit at October20 19:00UTC. Last *scheduled tip* is401909867,
Memphis at Sacramento at October26 01:00UTC (Sunday21:00EDT).
That tip or an estimated duration cannot be used as closure. All assigned games
must actually finish; overtime in an earlier game can make it the last final.

## Missing data and recovery limits

Missing/postponed/ambiguous responses or receipts older than ten minutes block
saves/admission/finalization. The close instant is the worker's first accepted
observation that all43 have genuine completed=true/state=post status. Browser
clocks, season_has_scores and changes to Sleeper's leg never establish NBA finality.

The current reader queries each event's original immutable scoreboard date. If
a rescheduled game disappears from that date, the period can remain blocked.
Automatic moved-date recovery needs a separately reviewed exact-event-ID lookup;
there is no environment-only override. Do not drop that fixture, edit frozen
period definitions or manufacture a final. A newly added event likewise needs
review before publication; compare the candidate to the source immediately
before the first write. Immutable published assignments cannot silently expand.

The next source week has49 listed events over October26-November1
(day counts9/4/12/3/10/7/4), but that is not a production game assignment.
PR228 ranks only Free Throw; Week2's82–0 preview has no ranked adapter. A supported
first release can open Week1, retain all-time scores and automatically archive
Week1, while leaving Week2 ranked held. Continuing Free Throw in Week2 requires an
explicit game assignment; ranked82–0 requires its own reviewed scoring adapter.

The proposed worker still needs a scheduler able to send an authenticated POST
at a cadence below the ten-minute freshness limit. The existing daily Vercel AI
cron cannot do this: it sends GET/CRON_SECRET to a different endpoint. No scheduler
or new credential was enabled, and no production schema or data was touched.
