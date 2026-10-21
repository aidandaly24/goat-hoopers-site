# Team history browser and coverage checks

These are synthetic checks of the actual consumer and Next routes. They do not
assert live league, account, provider, database or production behavior.

The current interaction is the chart: hover a value dot on desktop, tap the
chart on mobile, or use its keyboard arrows, PageUp/PageDown and Home/End.
Details are immediately beneath the graph. There is no calendar/date input.
The default range begins at league inception. Timeline zoom controls retain
that full range while allowing dense supported points to be inspected.

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
