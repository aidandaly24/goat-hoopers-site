# Continuous modeled valuation, retained observations and coverage

`modeled-valuation-timeline-v1` is a pure read contract with no production caller
yet. It does not approve a forecast, recalibrate dollars or publish data.
The value changes only at a supplied usable model update. Between updates it is
explicitly a carried estimate, including offseason dates. Calendar boundaries,
missing games, birthdays and elapsed time do not silently reprice it. A future
age/injury/role policy must supply an explicit versioned assumption update.

`valuationAt` answers any date in the requested window. Before the first usable
estimate it returns unavailable, rather than a zero or invented rookie prior.
After a sparse first estimate it preserves that estimate and its evidence age.
In-season absence of updates does not imply a DNP, injury or complete source.
Caller-supplied coverage remains separate and available only after its known
time. Only explicit calendar evidence can classify offseason; otherwise the
phase stays unknown. Model-calendar July rollovers are not NBA playing-season
boundaries. Scheduled boundaries must have their own source and known time.

All supplied usable model updates remain available. `pageTimelineUpdates`
returns up to 250 exact events per page for inspection. Compact half-open
intervals support a continuous step path without fabricating daily rows or
emitting carried values as recorded-price dots. The original recorded snapshot
objects, cents, dates and same-date order are kept in a separate collection.
Every update must match one model and calibration version; the adapter cannot
silently mix scales or normalize prices by today's most valuable player.
`publishable:false` is an approval boundary, not a claim that estimates have no
value between games. This PR supplies the implementation and tests; live loader
and rendering integration require the source/retention work below.

Canonical UTC timestamps retain three through six fractional digits. Cutoffs,
ordering and equality compare padded microsecond keys without changing original
strings or objects. Evidence-age readouts are descriptive at millisecond
precision. A raw timestamp without a timezone must be resolved by the source
adapter; this helper does not guess its timezone or overwrite its raw fields.

## What currently prevents full history

Current `stocks.ts` reads all selected-player reconstruction rows, then at most
ten live snapshots, then samples the merged chart. PR103 separately repairs
the dropped oldest sample. `saveSnapshot` is request-driven by
`getStockMarketData`, throttled by the latest global snapshot to once per 24
hours. After a write it prunes snapshots older than 30 days. There is no Stocks
cron in the repository. The throttle is not evidence of a daily scheduled
observation, and pruned observations cannot be recovered by interpolation.

Reconstruction supplies event-time game estimates and annual fallback endpoints.
The present schema has no historical receipt/correction vintage, known DNP or
coverage-completeness fields. A season-end annual point does not prove daily
history. Source adapters must reject mislabeled seasons and distinguish model
availability assumptions from actual recorded times. Held values can provide
continuity without hiding these limitations.

## Bounded integration and preservation plan — no migration in this PR

Coordinate retention/schema changes with the repair owner before implementation.
Preserve every existing observed snapshot and keep repair replacement confined
to reconstructed sources. Remove the 30-day destructive prune only in a reviewed
retention PR with measured capacity and rollback. Retain all captured daily observations append-only, including unchanged values;
any older archive must preserve the exact records and stay queryable. A five
year capacity example at 262 players and one row per day is approximately 478,150 rows;
measure real row/index bytes and read plans before approving that storage budget.
No schema, retention code, deletion or database operation changes here.

Proposed selected-player queries use player/time filters, an explicit range and
keyset pagination: `(player_id, snapshot_at, id)` for observed rows and
`(player_id, date, source, id)` for reconstructed rows. Return one preceding
model anchor separately so a range starts with the correct carried state. Cap
pages at 250 and return total/next cursor and coverage metadata. The current observed table has a descending snapshot-time index, not a player/time
composite index. Review composite indexes against existing ones using offline SQL plans first; do not assume an
index or new service is needed without measurement. List/ticker reads stay slim.

Canonical records remain unchanged. A chart may reduce decorative markers or
request a narrower time window, but must retain access to every event through
inspection/paging. Endpoints, extrema, source/calibration changes and coverage
boundaries are mandatory in a display summary. If they exceed a small display
budget, zoom/page or return a larger summary; never erase provenance to fit 40.
Keep the observed path distinct from reconstructed updates and carried state.
PR99 owns rendering; PR103 owns its bounded sampling correction.

Before live integration: reconcile source/game coverage and calendar definitions,
stable scoring and dollar-scale versions, actual receipt assumptions, and the
repair generation. Test the selected-player range adapter with offline fakes,
then independent review and ordinary CI. Full dynasty-dollar accuracy and an
untouched final evaluation remain separate model-promotion requirements.
No additional dataset, paid resource or subscription is required by this contract.
