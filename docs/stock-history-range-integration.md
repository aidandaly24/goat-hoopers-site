# Selected-player retained history integration — draft / HOLD MERGE

Ship the existing retained observed records and stored reconstruction first.
Expose a read-only `/api/stocks/[playerId]/history` endpoint on inspection, with
explicit `from`/`to` calendar-day bounds, `kind=observed|modeled`, and at most 250
records per page. Do not call the market calculator, Sleeper, a publisher or a
snapshot writer. Lists and existing detail payloads keep their current contract.

Observed pages contain every available snapshot in the range, including unchanged
prices and timestamp ties, ordered by native timestamp and ID. Cents remain exact.
The database column has no timezone: expose its full six-digit native timestamp
and `database-local-unverified` basis. Date ranges use database calendar days for
observations and UTC days for reconstructed events; do not claim aligned instants
or add a fabricated Z to observations. The renderer can show recorded dates with
this qualifier until the source timezone is verified.

Modeled pages contain every stored game/annual estimate with UTC timestamps,
source, season and publication generation. Keyset order is date, source, ID.
Read the preceding model anchor and one lookahead row to construct safe half-open
held intervals for that page. A lookahead stops a page's carried path; it cannot
extend over unseen updates. Ambiguous same-time source values or unknown publication
generation disable carried intervals, while exact records remain inspectable.
Existing stored cents are an unvalidated historical model scale; no new v3 prices,
normalization, implicit age/injury change or daily observed rows are generated.
Stored event dates do not establish historical receipt/knowledge time.

Return read status separately from historical coverage: successful empty reads,
unavailable storage, failed source reads, and generation changes need distinct
states. A fully paged retained range does not prove daily/game completeness.
Include returned timestamp bounds, `hasMore`, next cursor, retention limitations,
receipt-time uncertainty and scale status. Cursor scope binds player, range,
source and publication generation; a changed generation requires restarting.
Do not run COUNT over the full history merely to advertise a total.

Only SELECTs are added. The existing 30-day prune remains a known truncation
limitation. The repair owner must separately approve append-only retention and
any exact queryable archive, storage measurements or indexes. No schema, backup,
repair input, deletion, live repricing or DB execution is authorized here.

Renderer handoff (PR99 owner): request both source pages only after selection;
draw observed dots and reconstructed/held estimate steps as separate paths;
label held values and evidence/receipt uncertainty; keep all records reachable
through load-more or range paging. Never infer an injury/DNP or complete season
from a flat held interval. The route is usable before renderer integration; an
end-user full-history chart still requires that owner's connection.

Verified league scoring on October 9, 2026: pts 0.5; reb/ast 1; stl/blk 2;
to -1; tpm 0.5; dd 1; td 2; tf/ff -2; bonus_ast_15p, bonus_pt_40p,
bonus_pt_50p and bonus_reb_20p each 2. There are ten starting slots. Current
`game_mode=1` lacks an authoritative named mapping; it limits selected-game
matchup modeling, not the ability to apply these weights to historical stats.
Absent foul/bonus fields still limit a particular source's score completeness.
These verified weights exactly match the accepted frozen experiment's scoring
input; the forecast comparisons are not rerun or silently recalibrated.

The approved frozen games cover 2021–22 through 2024–25 only. Separate research
verified 2025 regular-season totals for 612 players; annual totals are not game
logs or proof of receipt-time coverage. Investigate official NBA box scores with
one scoped 2025–26 game before any bulk plan. Do not add a paid provider, change
credentials, start polling or imply that one successful sample fills the season.

First useful release: retained observed records plus existing reconstructed/held
estimates with correct labels and conservative availability. Dynasty-dollar
accuracy, an untouched model holdout and future v3 promotion remain separate.
The PR coordinator's merge hold remains in force. Prepared by Aidan's Dot.

## Renderer request/response handoff

Request `/api/stocks/2577/history?from=2021-07-01&to=2026-10-10&kind=observed&limit=200`
and the same range with `kind=modeled`. `to` is exclusive. Follow each response's
`nextCursor` with the same player/range/kind. Never reuse the existing 40-point
spark as canonical history. No total is advertised: `hasMore`/`nextCursor` cover
every retained event. Changing ranges starts a new paging sequence.

Use `records` as exact inspection data and `returnedBounds` as page bounds, not
the entire season's coverage. `readStatus=empty` means a successful zero-record
read; `unavailable`/`error` produce HTTP 503; invalid inputs produce 400. Model
generation changes produce 409 and require a restart. `coverage.status` remains
unknown even when `retainedRangeExhausted=true`. No old deleted records are recovered.

Observed records have native `date` strings without Z and a timezone qualifier;
do not pass them through `new Date`, normalize their cents, collapse timestamp
ties or connect them to reconstructed estimates. A selected calendar day can
hold multiple recorded dots. Modeled records use UTC and carry their original
source/season. `modeledWindow.intervals` are half-open, explicitly held stored
estimates; a null price is unavailable before the first model anchor. The safe
page window ends before the lookahead update and the next page begins there.
Unknown generation, conflicting same-time sources or unsupported sources return
no carried window; exact records remain available. There is no implicit DNP,
injury, offseason classifier, receipt-time history or calibrated historical
dynasty-dollar claim. Use the calendar-aware contract from PR111 only when the
source adapter can supply verified calendar/evidence metadata.

## Scoped 2025–26 source check

The [official Rockets–Thunder box score](https://www.nba.com/game/hou-vs-okc-0022500001/box-score)
for October 21, 2025 is readable through a normal browser. One sample contains
20 played lines (9 Houston / 11 Oklahoma City), 7 DNP/DND entries and 8 separately named
inactive players, with stable NBA player IDs and minutes, points, rebounds,
assists, steals, blocks, turnovers and threes. Personal fouls are displayed;
technical/flagrant counts are not. A direct HTTP read returned403 and the web
reader exposed no player table; browser access is not proof of a supported bulk
API. No further game or season dataset was requested.

Using the verified league weights, Sengun's visible core line contributes 42.0
points, plus 1 for his eligible double-double; SGA's visible core line contributes
33.0. Unknown technical/flagrant penalties prevent claiming an exact full score.
The sample verifies one game's participation/core-field availability; zero new
full-season game logs were ingested. It has revised current values, not historical
receipt/correction vintages. NBA-to-Sleeper identity mapping must be reconciled
before importing. Do not infer a complete season from the sample or the 612 annual
totals, and do not treat empty 2026 regular totals as a missing completed season:
the verified NBA state is preseason with start 2026-10-20.

A further source proposal should enumerate an official season's game IDs, measure
fetchability/bytes on the scoped sample, verify identity and foul/bonus fields,
then reconcile played/DNP coverage against the schedule and annual totals before
a bounded offline import. Hold bulk fetching until that route/access plan is
approved. No paid provider or credential change is necessary for this draft.
