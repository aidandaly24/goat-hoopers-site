# Week 2 calendar candidate — activation held

This is a **fresh cloud reconstruction** for issue [#202](https://github.com/aidandaly24/goat-hoopers-site/issues/202),
observed October 27, 2026 at 20:22:06–20:22:09 UTC. The unpublished Mac tree
`eb02df4b2316693d997a6e2ccd16411ef2bfa55b` is historical evidence only: its
files and tests were not recovered in this environment. The new tests are fresh
offline checks, not the Mac task's results or a production execution.

[`arcade-week-2-calendar.json`](arcade-week-2-calendar.json) contains the complete
two-period chain: unchanged Week 1 followed by a **proposed Free Throw continuation**
for Week 2. An explicit Week 2 game assignment is still required. This candidate
does not establish authorization for ranked 82–0 or another game. The current
main runtime supports ranked Free Throw only; the held multi-game draft #231 is
not a released scoring adapter.

The 6,572-byte candidate has SHA256
`e37cfda0c5ee8623665cbc4b9636500df576dc5ccf0fd6e6c104957dcd26c8fb`.
The original Week 1 file remains byte-for-byte unchanged, SHA256
`bf55ed669ffb599d1b802bd6e2d354ec4b0cfbabf22aa33324f1b56b7329ffc5`.
Its period object is the candidate's exact prefix, preserving all 43 assignments.
Week 2 adds 49 distinct fixtures; the full chain has 92 unique event IDs.
Neither checked-in file is automatically imported by runtime configuration.

## Boundary sources and derivation

- [Sleeper NBA state](https://api.sleeper.app/v1/state/nba): season `2026`,
  regular season, leg/week `2`, season start `2026-10-20`.
- [GOAT Hoopers league](https://api.sleeper.app/v1/league/1387473752807190528):
  NBA season `2026`, `in_season`, start week `1`, settings leg `2` and
  last scored leg `1`. Numeric game mode `1` is not interpreted as a named mode.
- [Sleeper basketball rules](https://support.sleeper.com/en/articles/4644860-league-formats-game-modes)
  describe Monday–Sunday matchups. [Game Pick details](https://support.sleeper.com/en/articles/4701537-game-pick-details)
  describe completion early Monday morning. Neither establishes an exact
  GOAT Hoopers competition opening hour or an actual NBA final-buzzer instant.

Week 2 therefore assigns Monday October 26 through Sunday November 1.
The previously documented implementation convention is New York midnight:
Week 2's opening floor is **October 26 00:00 EDT = `2026-10-26T04:00:00Z`**;
the next weekly boundary is **November 2 00:00 EST = `2026-11-02T05:00:00Z`**.
That span is **169 hours**, due to the November 1 DST change. It is not a
fixed closing deadline. Predecessor finalization can delay admission beyond the
opening floor; only genuine finals for every assigned fixture can seal Week 2.
Do not backdate admission or infer finality from Sleeper advancing its leg.

## Bounded publisher evidence

Only two small Sleeper documents and seven ESPN daily scoreboards were fetched
(804,160 response-body bytes total). No players, rosters, box scores or full-season
schedule were loaded. Each scoreboard had fewer than the requested `limit=100`,
declared NBA, and contained precisely the counts below. Every selected event
declared ESPN season `2027`, type `2`, `regular-season`; had one matching competition,
an explicit valid tip time, two competitors and a New York local date matching
its requested date. All 30 NBA teams appear across these 49 fixtures.

| Local date | Events | Official publisher response |
| --- | ---: | --- |
| October 26 | 9 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261026&limit=100) |
| October 27 | 4 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261027&limit=100) |
| October 28 | 12 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261028&limit=100) |
| October 29 | 3 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261029&limit=100) |
| October 30 | 10 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261030&limit=100) |
| October 31 | 7 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261031&limit=100) |
| November 1 | 4 | [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261101&limit=100) |

The JSON preserves each exact event ID, original scoreboard date and tip instant,
ordered by tip then ID. The first is `401909868` at October 26 23:00 UTC; the
last scheduled tip is `401909906` at November 2 02:00 UTC (Sunday 21:00 EST).
The SHA256 of compact `JSON.stringify(weekTwo.fixtures)` is
`fc8527b901ebb41d463ad31586d3553c9d2de896156f4ba4b8361c8dbb5ee565`.

Observed status was final (`completed=true`, `state=post`, `STATUS_FINAL`) for
October 26's nine events, and scheduled for the remaining forty. Those are dated
source observations only. They are not installed receipts, current production
finality, or permission to write. No status is embedded in the candidate.

Raw-response SHA256 receipts, captured at the times above:

| Response | Bytes | SHA256 |
| --- | ---: | --- |
| Sleeper state | 258 | `53603320532a448094e305285718d9c36ca8219a26497b315a9be7ad04797b95` |
| Sleeper league | 1,984 | `fb642b4942b21f86a26edc48b97fead48512dcc0e77dc0a66f2774e449d9d08d` |
| ESPN 20261026 | 214,800 | `0938930d5b320d615babddb6f0b2adc8da0090ddc7fdcc8ff235301141348595` |
| ESPN 20261027 | 81,948 | `f331fa13deabf5409297c460cdbff7b10e9cb698e883dd0d751187c1d1080d16` |
| ESPN 20261028 | 168,969 | `5cc3b770dd089ca97716baabd5fd04a76ab946414d984706a6e8ca2e7e35fa39` |
| ESPN 20261029 | 44,033 | `0dcf745decd694fb792e1adfd4bb12b24af5a644269c032228ed18c068d53b56` |
| ESPN 20261030 | 138,465 | `027e35b077b6de45970976ce6beb4c4f7c2e4963511e657637d5c5becb00614b` |
| ESPN 20261031 | 97,020 | `3ee6f6b13e1540d0a55d59119e06b6b7818a5e400bcd654cfb69e849417ee044` |
| ESPN 20261101 | 56,683 | `6425c69f0145278c04872a1278d32e084ac9698f6311b4a497642b134742a89c` |

Raw responses and per-request timestamps are retained only in this cloud task at
`/tmp/goat-week-two-evidence/`; the slim fixtures and receipts above are committed.
Public responses change with scores/status. Re-fetch and compare the event/date/tip
projection before first publication; a later whole-response digest need not match.
The immutable Week 1 definition must also match the parent's verified production
metadata. A mismatch requires review, never replacement of published history.

## Runtime rollout requirements — no activation performed

The existing parser, runtime and finality reader support this chain without a
production source change. Fresh tests exercise those actual functions with the
candidate and explicitly synthetic finality/dependencies. They cover preservation,
date assignment, broken/overlapping chains, predecessor gates, DST, bounded
authorization, expired authority, absent personal auth, missing receipts, a vanished
fixture, and immutable-final phase behavior. Exact-head check results belong in the
draft PR; these tests make no hosted/browser/database proof claim.

The retained operational owner must complete these gates in order:

1. **Assignment and source review:** explicitly confirm Free Throw for Week 2
   (or review the appropriate supported adapter first), the exact two-period
   calendar and fresh source comparison. Obtain independent Dot and genuine Muse
   readiness for the final code head, concluded CI, and current release authority.
   This author report supplies neither independent approval nor release authority.
2. **Read-only production reconciliation:** verify the deployed revision, current
   calendar/database fingerprints, preserved Week 1 definition and finalization
   state, personal HTTPS auth, existing schema compatibility and current holds.
   The parent owns that verification. Missing metadata stays unknown; this task
   has not inspected production data or credentials.
3. **Explicit replacement authority:** the installed Week 1 worker's hard-coded
   dispatch cutoff and the previous server authorization expired at
   **`2026-10-27T04:00:00Z`**. A new calendar cannot extend either. Obtain exact
   canonical UTC not-before/expiry instants and approval for the endpoint writes,
   first publication and subsequent dispatches. The interval must be ordered,
   start-inclusive/expiry-exclusive and **at most 168 hours**. The whole 169-hour
   calendar span is rejected. Do not widen the cap, truncate the calendar, chain
   automatic renewals or invent replacement instants. If another interval becomes
   necessary, it needs its own approval. Final SQL authorization may precede a
   COMMIT/response after expiry; approval must expressly accept that limitation.
4. **Reviewed worker and runtime configuration:** after those instants are
   authorized, prepare/review an exact source change replacing the worker's stale
   dispatch bounds so they match the separately approved server bounds. The
   current worker cannot send a new authorized request. Confirm the main-only
   `arcade-production` environment and existing dedicated bearer placement without
   reading/copying its value. Under action-time authorization only, install the
   reviewed calendar (`GOAT_ARCADE_CALENDAR`), server interval, reconciler/runtime
   flags and worker enable variable. Source merge alone must not enable anything.
   No configuration or renewal is requested or performed by this candidate PR.
5. **Publication and proof:** only the authorized empty POST may publish the chain
   and fresh original-date finality receipts. Verify predecessor sealing, actual
   Week 2 admission and source freshness (ten-minute maximum); a ready configuration
   or HTTP 200 alone is insufficient. Check retained state before retrying any
   uncertain request: client timeout does not establish rollback. Normal verified
   signed-in gameplay must establish a genuinely saved round and its weekly/all-time
   display; never insert test scores, fabricate a human round or backdate a save.

Missing, postponed, cancelled, suspended, incomplete or stale source evidence blocks
closure/admission. The reader still uses original scoreboard dates; a moved fixture
that disappears stays missing until separately reviewed exact-ID recovery exists.
Never drop that fixture or mutate a published calendar to force rollover. Next
midnight and the last scheduled tip do not close the period. All-time compatibility
and stable archive IDs remain unchanged. Rewards, prizes and FAAB operations stay off.

Only this JSON, this document and the focused test file are changed. The expired
workflow, runtime implementation, flags, secrets, database, auth, homepage, AI,
gameplay and art are unchanged. Review coordination is recorded on issue #202.
