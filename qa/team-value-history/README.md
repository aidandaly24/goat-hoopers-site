# Team history browser and coverage checks

These are synthetic checks of the actual consumer and Next routes. They do not
assert live league, account, provider, database or production behavior.

The current interaction is the chart: hover a value dot on desktop, tap the
chart on mobile, or use its keyboard arrows, PageUp/PageDown and Home/End.
The selected date, value, source and partial-price coverage live in the graph.
Selected-day changed-player cards appear immediately beneath it; moves and source evidence remain secondary disclosures. There is
no calendar/date input or separate largest-change card list. Sparse histories
open on their loaded observation window; **All days** exposes the unchanged
inception-to-today calendar, including missing-price days. Time remains linear
inside either viewport, with no fabricated prices or lines through gaps.

## Current quote and historical selection

The default **Current** marker/readout is the same validated calculation as the
headline, with the same cents, roster, priced coverage, timestamp and calculation
identity. It is a distinct modeled quote, never a saved observation. **History**
selects the historical observations; **All days** exposes the full calendar.
Current and saved quotes can coexist on one day or at one plotted value without
overwriting each other. End selects Current when available; left from Current
returns to the latest historical point. Current roster and evidence use compact
native disclosures and do not trigger historical detail reads.

```sh
npm test -- src/domain/current-team-quote.test.ts src/surfaces/season-hub/TeamValueHistoryCurrent.test.tsx src/surfaces/season-hub/TeamValueHistoryChanges.test.tsx src/surfaces/season-hub/TeamValueHistoryChart.test.tsx src/surfaces/season-hub/TeamValueHistoryDetail.test.tsx src/surfaces/season-hub/team-value-history-view.test.ts src/test/authored-controls.test.tsx
npm run typecheck
python3 qa/team-value-history/prepare-current.py /tmp/goat-current-review
python3 qa/team-value-history/serve.py /tmp/goat-current-review 4415
# In another terminal:
python3 qa/team-value-history/current-browser.py /tmp/goat-current-review http://127.0.0.1:4415
```

The current driver checks actual Next server rendering/hydration with explicit
synthetic sources: headline/marker equality, same-day overlapping current/saved
quotes, partial/unpriced/empty/unknown membership, long names, separate
retrospective provenance, UTC rollover, keyboard/touch/pointer selection,
same-team RSC refresh, delayed stale requests and 409 refresh retaining day/focus.
Layouts include desktop, 390px, 320px and 320px at 200% root text. Fixture preparation
records exact source blobs and the driver rejects a source change during the
run. It has no application credentials, external calls or write actions.
Historical acquisition/producer work remains separate; these synthetic checks
do not establish real historical coverage or live behavior.

## Calendar range controls

**1W / 1M / 3M / 6M / YTD / 1Y / All** filter actual dated points through
the existing summary range endpoint. The bounds are half-open UTC day windows
ending at the envelope's exclusive cutoff, never the browser clock or latest
quote. 1W is seven included days; months/years subtract calendar months from that
cutoff with month-end clamping. YTD starts January 1 of the last included day's
year. Every window clips to league inception; All retains the entire calendar.
History/Values still focuses sparse observations, and Current remains a distinct
current calculation. A current quote outside a calendar window does not extend
its bounds or become a historical observation.

A compact range caption states exact dates, loaded value dates and calendar days.
Unloaded/paged/failed reads remain incomplete. A fully loaded empty range is
explicitly empty; no missing price becomes zero or a synthetic daily point.

```sh
npm test -- src/surfaces/season-hub/TeamValueHistoryRanges.test.tsx src/surfaces/season-hub/TeamValueHistoryDetail.test.tsx src/surfaces/season-hub/TeamValueHistoryCurrent.test.tsx src/surfaces/season-hub/TeamValueHistoryChart.test.tsx src/surfaces/season-hub/team-value-history-view.test.ts
python3 qa/team-value-history/prepare-ranges.py /tmp/goat-ranges-review
python3 qa/team-value-history/serve.py /tmp/goat-ranges-review 4373
# In another terminal:
python3 qa/team-value-history/ranges-browser.py /tmp/goat-ranges-review http://127.0.0.1:4373
```

`review/ranges-*` records six guarded hydrated Next journeys: all seven exact
window bounds/query parameters, lazy reads, empty versus failed/incomplete
coverage, current/historical separation, changed cards, touch/keyboard/focus,
390px/320px/desktop and 320px/200% text containment. The deliberately synthetic
fixture's history cutoff is November 22, 2026 (with one next-day Current-quote edge case); it is not a live-history or current-date
claim. Existing PR256 portrait/compare evidence remains separately scoped.

## Visible selected-day player changes

The historical selection opens a visible player-change panel, not an accordion.
Only nonzero, comparable continuing-player prices become cards. Each card uses
existing identity media through `PlayerHeadshot` (approved local portrait, resolved
ESPN ID, then initials), signed change, and dated before/after amounts. The full
historical roster is omitted from this view. Current roster details remain a
separate disclosure under **Current**, with the full-roster link above the chart.

The header sums only comparable continuing-player deltas, not roster movements or
trade profit. If any continuing-player comparison is unknown it is explicitly a
known-price-change subtotal; all-unknown never becomes zero. Comparisons name both
observation dates and disclose multi-day gaps. Moves and snapshot/source evidence
remain keyboard-accessible secondary disclosures. No transport, producer, quote
calculation or stored history is changed.

```sh
npm test -- src/surfaces/season-hub/TeamValueHistoryChanges.test.tsx src/surfaces/season-hub/TeamValueHistoryDetail.test.tsx src/surfaces/season-hub/TeamValueHistoryCurrent.test.tsx src/surfaces/season-hub/TeamValueHistoryChart.test.tsx src/surfaces/season-hub/TeamValueHistoryClient.test.ts src/surfaces/season-hub/team-value-history-view.test.ts src/surfaces/season-hub/CourtsideHome.test.tsx src/domain/current-team-quote.test.ts src/test/authored-controls.test.tsx
npm run typecheck
npm run check:contracts
python3 qa/team-value-history/prepare-movers.py /tmp/goat-movers-review
python3 qa/team-value-history/serve.py /tmp/goat-movers-review 4372
# In another terminal:
python3 qa/team-value-history/movers-browser.py /tmp/goat-movers-review http://127.0.0.1:4372
```

The seven hydrated actual-Next journeys use explicitly synthetic values and
matching approved portraits. They cover 390px, 320px, 320px/200% text and desktop,
unchanged/unknown comparisons, broken-photo and absent-photo fallback, long names,
visible changes outside any disclosure, signed subtotals, exact microseconds,
keyboard/touch selection, All days missing history, and return to the identical
current $110 headline/marker. All requests are guarded: no production, provider,
account or database traffic. See `review/movers-browser.json`, representative
`review/movers-*.webp`, and `review/movers-checks.json` for base, application blobs,
commands and limits. The source-only UI revision does not recover historical data.

Earlier `changes-*`, `current-*` and integration receipts below are retained
revision-scoped evidence; older drivers that target the previous disclosure
structure are archived, not current-UI validation. Cadence and history analysis
remain in [FOLLOWUP-NOTES.md](./FOLLOWUP-NOTES.md).

## Prior compact-view regression

Surface contract: the user asks how their team's value changed and what roster
or moves explain the selected day; the main action is graph inspection. Sparse,
full, partial, unpriced/unknown and changed-generation states remain distinct.
At 320px and 200% root text the value, subtotal qualification, source, controls
and keyboard access stay readable. Invented daily prices, silent partial totals,
calendar-picker preambles and separate change-card walls are forbidden.

```sh
npm test -- src/surfaces/season-hub/TeamValueHistoryChart.test.tsx src/surfaces/season-hub/TeamValueHistoryDetail.test.tsx src/surfaces/season-hub/team-value-history-view.test.ts
npm test -- --config qa/team-value-history/producer-integration.config.mts
npm run typecheck
python3 qa/team-value-history/prepare-compact.py /tmp/goat-compact-review
python3 qa/team-value-history/serve.py /tmp/goat-compact-review 4399
# In another terminal:
python3 qa/team-value-history/compact-browser.py /tmp/goat-compact-review http://127.0.0.1:4399
```

The compact fixture has 368 calendar days and 15 synthetic observations, with
the last quote on Oct 21 and an Oct 22 UTC cutoff. A selected 1/4-priced quote
is labelled as a subtotal inside the chart. The first view checks actual dot
spacing before any zoom/range action, collapsed explanation, and no eager
detail fetch. The same actual Next homepage fixture then checks hover/tap,
native keyboard disclosure, all 368 calendar days, missing-day membership,
and retained day/viewport/focus through a 409/RSC refresh and another UTC
rollover. Layouts are 390/100%, 320/100%, 320/200% and 1440/100%.

This is local-only preparation on the retained PR244 producer base and held
consumer patch. It is not published, a current-main integration verdict, a live
membership/price check or an authenticated production check. `compact-*`
captures/receipts identify the exact source blobs. The earlier drivers and
receipts below preserve checks of their stated revisions; their old control
labels and inception-default assertions are not the current interaction.

Prepare an isolated fixture with the locked dependencies and repository Node:

```sh
python3 qa/team-value-history/prepare.py /tmp/goat-history-review
python3 qa/team-value-history/serve.py /tmp/goat-history-review 4360
# In a second terminal:
python3 qa/team-value-history/timeline-browser.py /tmp/goat-history-review http://127.0.0.1:4360
npm test -- --config qa/team-value-history/coverage.config.mts
```

The fixture compiles actual homepage, root layout, ticker, history routes,
consumer and shared UI. Data/session responders, fonts and fixture navigation
are substituted. Every history response passes the actual DTO validator. The
server has no application credentials and uses the loopback-only network guard;
the browser permits GET only, stubs avatar images and blocks other externals.
It does not fetch a live provider or perform account/data mutations.

The focused matrix covers 1440/100%, 390/100%, 320/100% and 320/200% root text.
It checks no eager detail reads, graph/inspector adjacency, exact-dot hover/tap,
keyboard inception/end/missing-day selection, supported player-value changes,
scoped trade assets/picks and FAAB units, source disclosure/focus, 44px controls,
containment, stale request cancellation, generation409 and retry. Text scaling
means root font size, not page zoom. Captures and receipts identify synthetic
evidence; exact source blobs are recorded with the review artifact.

`coverage-proof.test.tsx` injects 14 and 40 quote days into the actual producer
and renders the actual chart, proving no 14-day consumer/pagination limit. It
uses the repository offline I/O guard and calculates no real historical prices.

`move-terms-fixture.ts` is QA-local. It includes two-sided roster legs, pick
owner/origin traps, missing/empty terms, long IDs, and whole/zero FAAB bids.
`review/move-terms-*` and the older browser drivers retain evidence for the
previous calendar-led interaction; use `timeline-browser.py` for this revision.
Prior unchanged route/ticker journeys are reused, not a current full-site PASS.

For Muse's producer handoff, the offline source feasibility diagnostic reads
saved public API responses without any network request:

```sh
python3 qa/team-value-history/replay-rosters.py /path/to/source-receipts
```

Its input names are listed in the script. It validates completed startup draft
assignments and all 24 transaction weeks, applies each trade atomically, and
compares exact final membership to the historical league roster response.
This is a recovery proof, not a new application loader. It supplies neither
historical quote prices nor permission to carry current values into the past.

Full historical roster/price integration, supported dated model reconstruction,
retention, and startup-draft presentation remain producer work. A selectable
missing day alone does not complete the user's historical-data request.

## Agreed membership / th2 consumer follow-through

Use the synthetic membership fixture for the changed refresh/readout behavior:

```sh
python3 qa/team-value-history/prepare-membership.py /tmp/goat-membership-review
python3 qa/team-value-history/serve.py /tmp/goat-membership-review 4386
python3 qa/team-value-history/membership-browser.py /tmp/goat-membership-review http://127.0.0.1:4386
```

This uses actual Next RSC refresh and the actual consumer, with synthetic opaque
th2 tokens and response DTOs validated by the existing domain validators. It
implements no producer token parser, replay loader or live source wiring. The
focused desktop and 320px/200% root-text cases cover retained selection/focus,
new-view cache isolation, in-flight cancellation, 409 invalidation and the real
Refresh control, known-unpriced/empty/unknown rosters, literal evidence prose,
today's pinned inspection time and rejection of a detail one microsecond after
that cutoff. Unchanged chart/transport/styles and their earlier layout matrix
are reused, not claimed as a new full-site test. No physical-device/live-data
claim follows from these fixtures. `review/membership-*` records the local check.

## PR244 producer integration (local only)

This fixture uses the actual merged history producer, summary/detail helpers,
DTO validators and forward replay. Only its source dependencies are injected:
the producer owner's miniature four-slot, two-season test world and explicitly
synthetic quotes/names. It serves the actual signed-in homepage `/` and inspects
the `Your roster.` history island; `/team` is not its entry point.

```sh
npm test -- --config qa/team-value-history/producer-integration.config.mts
npm run typecheck
npx eslint qa/team-value-history/integrated-producer-fixture.ts qa/team-value-history/producer-integration.test.tsx qa/team-value-history/producer-integration.config.mts
python3 qa/team-value-history/prepare-integrated.py /tmp/goat-producer-integration
python3 qa/team-value-history/serve.py /tmp/goat-producer-integration 4388
# In a second terminal:
python3 qa/team-value-history/integrated-browser.py /tmp/goat-producer-integration http://127.0.0.1:4388
```

The focused cases cover actual th2 generation/409 behavior and RSC refresh at
the same cutoff, retained selected day/zoom/focus, hover/tap/keyboard selection,
four known unpriced historical members versus a gap with unknown membership,
today's pinned inspection time, and desktop/320px at 200% root text. Recorded
quote microseconds are preserved; membership-only day-end instants use the
producer's millisecond precision (`23:59:59.999Z`). The injected chain stays
captured at the envelope cutoff while the child request's outer clock advances.
This does not exercise default live-provider dependency acquisition, credentials
or production. It adds no historical prices, inferred gap membership or durable
retention.

`review/integrated244-*` records this local integration against merge
`26872621cec6cf29b9175cc3c8f845a463e0d78b`. The first three browser groups passed
in both layouts before an incorrect QA-only timestamp expectation was corrected.
The remaining membership/layout groups were run separately with
`--membership-only`; its receipt links the earlier completed checks rather than
claiming a single uninterrupted run. The 320px screenshot captures the first
2400px of the history island; containment checks inspect the entire island.
Earlier full consumer checks and the reviewed producer CI are reused; this is
not a fresh full-suite, whole-site, authenticated-production or release PASS.
