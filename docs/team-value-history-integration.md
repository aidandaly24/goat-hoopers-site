# Team history producer handoff — issue #217

Muse accepted Dot's presentation ownership and contract in
[issue comment 6281337112](https://github.com/aidandaly24/goat-hoopers-site/issues/217#issuecomment-6281337112)
and [PR218 comment 6281503580](https://github.com/aidandaly24/goat-hoopers-site/pull/218#issuecomment-6281503580).
Dot's implementation uses **one** domain module: `src/domain/team-value-history.ts`.
Muse owns replay/ingest/schema/series and existing homepage integration. No code
here publishes prices, writes production data or authorizes a backfill.

## Composition and bounded requests

The server can render the public entrypoint using serializable props only:

```tsx
<TeamValueHistory history={envelope}
  detailEndpoint="/api/your-team-history-detail-route"
  pageEndpoint="/api/your-team-history-summary-route" />
```

The endpoint paths above are placeholders, **not routes added by this PR**.
Muse supplies the existing data wiring and real app endpoints. No callback,
SQL client, provider credential or upstream player directory crosses the RSC
boundary. The component makes no initial detail request. Expanding Roster &
moves loads just that selected day. Open inspection follows a deliberate date
change after a 200ms debounce; cancellation, a sixteen-entry cache and response
identity checks prevent stale replies replacing a newer selection.

Both routes are read-only GET endpoints beneath `/api/`. Detail query parameters:
`teamId`, `generation`, `day` (UTC calendar day). Return
`TeamValueHistoryDetail` from the shared module. `pointId`, `rosterRef`, cutoff,
counts/subtotal and source class must match a loaded summary point exactly.
For a day without a summary point, `pointId` may be null: available roster/move
evidence remains inspectable without inventing a price. Source generation drift
returns HTTP409; unavailable sources may return HTTP503. Error responses never
replace loaded chart data.

Summary query parameters: `teamId`, `generation`, `from`, `toExclusive`, optional
`cursor`. Return `TeamValueHistoryEnvelope` for that exact requested range.
Initial homepage data should cover the full source-confirmed league window;
up to 800 daily summary points fits two seasons. Pagination is explicit, never
automatic. Subsequent loaded ranges must overlap or touch; repeated points
cannot change within a generation, and the cursor must advance. Changing range
never reuses a cursor belonging to another range. The display retains the full
requested x-axis and identifies unloaded dates separately from source gaps.
Responses are streamed under a 256KiB client cap. Detail is bounded to 60 players,
40 nearby moves and explicit `movesRange`/`movesTruncated` metadata.

## Time, coverage and quote eligibility

`leagueRange`, season windows, `requestedRange` and `loadedRange` use half-open
UTC calendar-day bounds. The visible Through day is inclusive; it becomes the
following exclusive midnight. Last30 includes the as-of day plus 29 earlier
days, clamped to league bounds. No intraday valuation precision is implied.
Points are unique per day and carry an exact `valuationAt` no later than the
envelope `asOf`. Original timestamp strings retain up to six fractional digits.

| Source | Eligible from | Required provenance and restriction |
| --- | --- | --- |
| Recorded modeled quote | Its original recorded UTC-convention timestamp, never earlier | Original quote ID, exact ISO `recordedAt`, unchanged timezone-less `nativeTimestamp`, `availableFrom` and explicit finite validity if held beyond that instant. Preserve these before source retention prunes them. It remains a modeled quote, not a sale price. |
| Event/gamelog reconstruction | No earlier than the latest completed event/input cutoff actually used | Dataset/model version, source kind, exact `inputCutoff`, availability/validity and audited identity/scoring. Retrospective model label survives even with independently verified roster membership. |
| Annual reconstruction | Only after its complete-season inputs are eligible | Same reconstruction proof; summary point `standalone=true`, `continuityId=null`. No earlier-season backdating or daily interpolation from the annual total. |
| Missing/ambiguous price or roster | No priced point is eligible | Nullable cents, priced-player coverage, missing reason and independent roster/valuation coverage. Unknown never becomes zero. |

A null `validUntil` permits a **direct point only**, where `availableFrom` equals
the valuation cutoff. A held quote needs a producer-reviewed finite validity
interval containing the cutoff. This decoder rule does not choose a hold duration
or authorize carrying an annual or stale recorded quote. Different source kinds,
season rollover, absent days, standalone points and unknown coverage break the
line. A continuity ID is a producer assertion, never inferred by the renderer.
Partial subtotals additionally require the same non-null priced-set ID. No team
performance metric or delta across changed partial subsets is calculated.

Roster status is independent of price kind. Use verified for independently dated
evidence, replayed for deterministic but not independently verified membership,
and ambiguous/unavailable when membership cannot be established. A reconciliation
may identify a keeper cut set without proving its effective day. Do not invent
cut timestamps or a complete roster/value across that ambiguous interval. Boundary
moves are `origin=boundary-reconciliation`, `status=derived`, and unknown precision
has null effectiveAt/day. Source transactions must be complete; failed moves are
rejected by the presentation decoder too.

## Source acquisition remains a separate decision

The frozen four-game feasibility audit demonstrates usable event/scoring inputs,
three separately reviewed mapping candidates and genuine unresolved penalty rows.
It does not establish a complete NBA season, authorize bulk acquisition, or
approve a retrospective pricing model. Full-schedule reconciliation, all 373
historical IDs, scoring/correction policy and a sized acquisition plan remain
joint work before the price-ingest lane proceeds. Transaction/roster ingest is
independent. Any schema/backfill publication still needs its own reviewed PR and
current authorization.

The production integration is incomplete until Muse supplies a source-backed
envelope and routes. The isolated Next.js/browser fixture uses explicit synthetic
values to test real controls and boundaries; it is not live historical-data proof.
