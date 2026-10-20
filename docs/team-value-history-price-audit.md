# Team value history: pricing decision and presentation boundary

Issue [#217](https://github.com/aidandaly24/goat-hoopers-site/issues/217).
Public-code audit based on main `7dcdf0a`; no application runtime changes.
Muse explicitly accepted the contract and file ownership in issue comment
[6281337112](https://github.com/aidandaly24/goat-hoopers-site/issues/217#issuecomment-6281337112)
and PR comment [6281503580](https://github.com/aidandaly24/goat-hoopers-site/pull/218#issuecomment-6281503580).
The presentation contract and picker are implemented in isolation; existing
homepage/replay/storage integration remains Muse-owned. The price-source/model
decision remains joint. See [the producer handoff](team-value-history-integration.md).
Private persisted-data receipts are retained outside this repository and are not
part of this document or the PR.

## What the existing sources establish

| Source | Established by checked-in code/data | Honest use |
| --- | --- | --- |
| `stock_snapshots` | Recorded observations of the site's modeled FAAB quotes; `stocks.ts` saves a throttled snapshot and prunes after 30 days | Recorded **modeled valuation**, with original row ID, time and player coverage; not a trade price or team performance |
| `price_history`, source `gamelog` | Retrospective current-model after-game estimates; the frozen mapped input ends with NBA 2024–25 | Explicit reconstructed estimate where inputs, availability and historical membership are eligible; not a recorded quote |
| `price_history`, source `backtest` | Completed-season totals produce a June 30 point in `reconstruct-price-history.ts` | Isolated season-end reconstructed estimate; never backfill its full-season totals into earlier dates |
| `player_stat_cache` | Latest profiles plus completed annual `season_history`; no versioned per-date archive in its schema | Completed prior-season inputs only, not a historical daily state archive |
| `rosterValueTrend` | Reprices today's roster using supplied retained player history and current quotes | Existing current-roster repricing only; cannot be relabeled as historical ownership |

The frozen-input [audit](../data/README.md) documents approximate scoring,
historical experience/minute priors, neutral historical injury/sentiment and
name-mapping limitations. The [publication review](price-history-repair.md)
separates offline preparation from a reviewed production import. Neither source
authorizes a new backfill. The reconstruction model and the inputs it actually
used must be named wherever reconstructed results are exposed.

`stock_snapshots.snapshot_at` is a timestamp **without** timezone. The existing
app interprets it as UTC; that convention must be verified/preserved explicitly,
not silently converted using the reader's local timezone. Reconstruction dates
are midnight UTC plotting coordinates for after-game estimates, not observed
event times. They cannot prove a quote was available at that midnight or support
an intraday roster/price join.

Source-preserving range loaders already exist for **one selected player** in
`src/data/stock-history-range*.ts`. They preserve native timestamps, cents,
publication generation and missingness. Their held-model interval policy is not
automatic permission to carry an old quote throughout a team-history interval.
The team contract needs its own explicit validity/availability rule and must not
make hundreds of selected-player requests on a homepage render.

## Agreed presentation semantics

The user question is: **What was my team worth, who did I own, and what changed
over the full league history?** The primary action is select a range and day,
then inspect that day's actual roster, price coverage and sourced moves.

Start with the full source-confirmed league window and actual replayed roster
history. Value remains unavailable wherever an eligible as-of quote cannot be
shown. An eligible recorded quote is still a modeled FAAB valuation. A retrospective
estimate remains labeled as reconstruction, even if its roster is independently
verified. An annual season-end estimate is a separate point, not a daily line.

A fuller daily 2025–26 model requires a separately audited event-level source
with stable player/game IDs, scoring fields, dated availability and coverage.
The existing completed annual totals cannot substitute for those events.
No new paid source, credential, production publication or per-render backfill
is proposed by this slice.

### Public-source inventory and a feasible event-log candidate

On October 20, 2026 at 01:36 UTC the read-only audit queried every transaction
bucket 0–60 for both public league IDs, retaining response hashes and cache
headers locally. All 122 bucket requests returned HTTP 200 without errors.
The 2025 league returned 400 unique transaction IDs, **392 complete and eight
failed**, in buckets 1–24. Completed moves comprised 340 free-agent moves,
33 waivers, 15 trades and **four commissioner events**. Buckets 19–24 account
for 49 raw records omitted by the issue's initial 0–18 scan. The 2026 league
returned 39 completed free-agent moves, all in bucket 1, even though timestamps
span August–October. Empty buckets 0 and 25–60 do not prove provider completeness.
Source-effective timestamps, status and deduplication matter; bucket numbers
cannot substitute for event dates. This inventory is not a replay implementation.

The two `/league` responses confirm 2025 has no predecessor and 2026 links to
2025. Each `/rosters` response currently contains ten rosters. These retrieved
snapshots alone do not establish historical ownership, draft/keeper anchors or
unrecorded commissioner changes. Retrieval time is not source effective time;
one response's cache age exceeded 21 hours.

The existing ESPN integration offers a feasible **candidate**, not an approved
complete archive. Read-only sampling at 01:38 UTC fetched the public date-filtered
scoreboard for three 2025–26 dates and one completed-game summary per date:

| Scoreboard date | Returned events | Sample event | Played rows / existing identity-map matches |
| --- | --- | --- | --- |
| 2025-10-21 | 2 | `401809243` | 20 / 20 |
| 2026-01-20 | 7 | `401810468` | 20 / 20 |
| 2026-04-12 | 15 | `401811041` | 18 / 16 |

Endpoints: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD`
and `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=ID`.
All six sampled requests returned HTTP 200. Summary payloads were approximately
402–448 KB each, so a full-season acquisition needs a bounded offline job and
slim retained projections, not homepage fetches. No full-season scrape was run.

The sampled athlete rows contain minutes, points, shooting splits, rebounds,
assists, turnovers, steals, blocks and personal fouls, with stable ESPN athlete
IDs and explicit DNP rows. They do not directly supply the model's flagrant/
technical foul penalties or verified fantasy bonus-event counts. Two played
rows in the final sample have no match in the existing Sleeper↔ESPN map. Do not
guess identities, zero missing penalties or treat these samples as coverage of
every game/player. Scoreboard date and event UTC start can differ; completed
status retrieved today is not a contemporaneous completion timestamp.

Before selecting this candidate: reconcile the complete regular-season event
schedule, mapping coverage and missing/DNP rows; audit scoring omissions and
derived bonuses; freeze source hashes, model version and retrospective
assumptions; define a conservative daily availability policy. Never use later
season totals or today's roster/injury/demand inputs to fill an earlier date.
This source review belongs in the joint pricing decision before Muse's ingest
work proceeds. The public source receipt summary is in the adjacent JSON file.

### Reproducible follow-up: frozen scoring and identity feasibility

The offline [bounded sample audit](../data/team-history-audit/README.md) now
retains four completed games, including event `401809244` from the first sampled
date. It contains 109 athlete rows: 78 played and 31 DNP. The auditor derives
68 complete fantasy-point results; ten Philadelphia rows remain incomplete
because a team technical has no structured athlete offender. Existing mapping
plus complete scoring/minutes/event-time evidence admits 65 rows. These are
fantasy-point **inputs**, not modeled FAAB prices or historical team values.

The additional game supplies structured technical offenders Draymond Green and
Jarred Vanderbilt and a Type 1 flagrant offender Marcus Smart. The auditor
reconciles these event counts against team totals, retains their source play IDs,
and excludes technical/flagrant free-throw shooters. It never attributes the
sampled coach technical by parsing a name or zeroes an unknown player penalty.
Type 2 flagrants and unreconciled/unsupported foul events remain unsupported.

All four retained End Game play records have UTC wallclocks: `2025-10-22T02:59:51Z`,
`2025-10-22T04:46:00Z`, `2026-01-21T02:30:54Z`, `2026-04-13T00:45:07Z`.
These improve the event-input lower bounds beyond the initial scoreboard-only
audit, but do not prove contemporaneous source publication or absence of later
stat corrections. No after-game input is eligible at an earlier midnight.

The live map resolves 75 of 78 played rows. Three separate audit candidates have
unique exact names and birth dates in the frozen directory: Max Shulga `4785` ↔
ESPN `4701992` ([biography](https://www.espn.com/nba/player/bio/_/id/4701992/max-shulga)),
Dalano Banton `2290` ↔ `4397885` ([biography](https://www.espn.com/nba/player/bio/_/id/4397885/dalano-banton)),
and Gabe Vincent `2084` ↔ `3137259` ([NBA biography](https://www.nba.com/lakers/team/player-pages/gabe-vincent-1629216)).
The existing map remains unchanged; candidates do not become production input
eligibility. Name matching alone cannot establish the remaining historical map.
Core-athlete API access failed at proxy CONNECT HTTP403; no profile JSON was
obtained. Vincent's ESPN biography returned a bot-check page, so the official
NBA club biography supplies his independent birth-date evidence.

The source helper and runner perform no network, DB or quote/publication work.
The sample schemas retain raw keys/values and source hashes, not current injury,
ownership or aggregate season inputs. Focused regressions cover the actual
penalties, derived stacked bonuses, DNP/active disagreement, missing fields,
mapping ambiguity and post-game cutoff/UTC look-ahead failures. Full-season
event coverage, source correction policy and a reviewed reconstructed model
remain prerequisites for building an honest daily historical value series.

Full-season bounds follow verified source anchors and rollover evidence; a year
label alone does not establish January 1 as league inception. Returned current
rosters from an old league are useful reconciliation targets, not independent
proof of ownership on every prior date. Source retrieval time and provider cache
age remain separate from roster/transaction effective time.

## Proposed serializable contract

These requirements are implemented by the single versioned contract in
`src/domain/team-value-history.ts`. Muse owns source/replay/series derivation;
both lanes use that same type. Future contract changes remain joint.

| Level | Required information |
| --- | --- |
| Envelope | Version; stable team/league IDs; generation; source retrieval/as-of; two source-confirmed season windows; full league bounds; requested half-open range; resolution `day`; timezone `UTC`; bounded page/cursor and detail availability |
| Coverage | Roster and valuation coverage separately; source-confirmed, replayed/unverified, ambiguous and unavailable intervals with reasons; retention/source limits |
| Summary point | Stable ID; calendar day and explicit valuation cutoff; season; replay roster reference; roster status/count; priced count; nullable integer-cent subtotal; complete/partial/unavailable status; recorded/reconstructed/mixed provenance class; segment/continuity identifier |
| Selected roster detail | Exact player IDs and identity labels; nullable price cents per player; original quote row ID/source timestamp, or reconstruction dataset/model version/input cutoff; validity interval; missing-price reason; source receipt references |
| Selected move detail | Original transaction/source ID; effective timestamp and precision; completed status; type and player adds/drops/trades; roster participants; tied/ambiguous ordering evidence; explicit nearby-move range and truncation/cursor |

Summary payloads contain counts and references; full roster and price proofs load
only on inspection through an injected same-origin app client. No raw directory,
SQL client, credentials, upstream request or function prop crosses the Next.js
server/client boundary. Detail failure retains the chart and offers a retry;
stale selection responses cannot replace a newer range/day.

Until validity and historical completeness are proven, the renderer connects no
points merely because they are adjacent in an array. It needs explicit continuous
coverage from the producer. Source switches, unknown intervals, season rollover,
changed priced-player sets and standalone annual estimates break the line.
Different partial subsets cannot yield a meaningful endpoint change; omit that
delta. Any complete endpoint change is labeled valuation change and includes
roster-change context, never team performance.

## Picker and as-of interaction

Presets: All time, each source-confirmed season, Last 30 days. Direct start/end
**calendar-day** controls use UTC, with a visible inclusive end day translated
to the following exclusive UTC midnight. Last 30 days includes the envelope's
as-of day and preceding 29 days, clamped to league bounds. No time-of-day control
is offered for daily price data. Transaction detail may show its precise source
time independently of daily valuation precision.

All time retains the full league x-axis even if valuation covers only a small
part of it. Values use true elapsed-time spacing. Empty windows show why they
are empty; one point renders a point, not a line. Selecting an unavailable day
does not silently snap to the nearest priced day. Keep the roster and available
moves inspectable during a price gap.

Recorded model observations, reconstructed estimates and partial subtotals use
distinct line/point treatments **and text**. Legends/captions/readouts name their
meaning and per-point priced/roster counts. Unknown is never `$0`; current modeled
quotes remain separate from recorded snapshots. No area fill or animation should
imply observed values in the gaps.

At 320px/390px the presets wrap and date controls stack within the chart module;
labels remain visible and targets at least 44px. Use explicit day selection and
keyboard previous/next access rather than requiring horizontal chart dragging
that competes with page scroll. Use the existing Paper + Slate tokens, typography
and shared controls; no redesign of the surrounding homepage or PR210 components.

## Ownership and integration gates

Dot proposed ownership in [comment 6281228237](https://github.com/aidandaly24/goat-hoopers-site/issues/217#issuecomment-6281228237):
this audit, a new presentation domain module, range helpers and new
`src/surfaces/season-hub/TeamValueHistory*` components/tests/QA. Muse retains replay,
source ingestion, storage, series derivation and existing homepage/data wiring.
Muse confirmed that handoff. Dot's new domain, audit and `TeamValueHistory*`
files do not alter Muse's replay, stores or existing homepage wiring.

The presentation DTO/ownership is agreed; source replay anchors, eligibility and
joint price publication still require their independent evidence. Muse reported
a 373-ID historical union and a boundary-derived anchor rather than recorded
keeper-cut transactions. Dates with unknown cut timing cannot gain an invented
effective timestamp; carry that ambiguity through coverage and move precision.
Global price counts alone cannot establish historical per-team coverage.

Before calling the implementation ready: focused range/provenance/coverage and
race tests; applicable replay/price integration contracts; typecheck; surface
contracts; production build; the actual Next.js boundary harness; rendered
desktop, 390px, 320px and 200% text checks; keyboard/touch behavior for empty,
one-point, mixed-source, partial and failure states. Bind evidence to the full
final head SHA. Both Dot and Muse must explicitly review that same head, and
exact-head CI must pass before any merge. PR210's existing hold is unaffected.
Deployment authorization is a separate gate. This proposal performs no DB,
infrastructure, import, migration, merge or deployment action.
