# Bounded historical box-score feasibility samples

These frozen **public source projections** evaluate inputs for issue #217.
They are not historical quotes, a full-season archive, roster replay, published
valuation data or an application integration. No production caller imports them.

`samples.json` retains four ESPN completed-game summaries: 109 athlete rows,
source stat-column keys and raw displayed values, team technical/flagrant totals,
and all source End Game / technical / flagrant play types. News, odds, injuries,
current player aggregates and prose articles are excluded. Raw response hashes,
URLs and retrieval evidence bind each projection to its local source receipt.
The fourth receipt records local archive-write time explicitly: a later request
to the separate core-athlete host failed HTTP403 before the probe saved its
in-memory retrieval receipts. This does not imply the unavailable profile was read.

`scoring.json` retains the identical scoring maps returned by the two public
league endpoints during this audit. It is not proof of historical rule changes
or of the exact scores Sleeper recorded in each game.

`identity-candidates.json` pins the existing map and directory hashes. Three
missing historical players have unique exact name/DOB candidate matches, checked
against the linked ESPN or official NBA biographies. They remain audit candidates;
the live identity map is unchanged. The runner fails if frozen mapping inputs drift.

Run offline from the repository root:

```sh
npx --no-install tsx scripts/audit-team-history-boxscores.ts /tmp/boxscore-audit.json
npx --no-install vitest run src/data/__tests__/team-history-boxscore-audit.test.ts
```

The pure audit joins columns by source keys, preserves DNP rows, ignores current
active/reason fields when determining whether someone played, and derives
per-game achievement flags from points/rebounds/assists/steals/blocks. A triple
double earns both the double-double and triple-double terms in the configured
model; 40/50 point bonuses likewise stack. Missing weighted fields remain unknown.

Athlete `tf`/`ff` counts come only from zero team totals or structured offender IDs
whose supported foul events reconcile exactly with explicit team totals. Technical
and flagrant free-throw shooters are excluded. A technical without an athlete ID,
including the sampled coach event, leaves that team's player `tf` unknown; no
coach/athlete name matching or hidden zero is used. Unsupported foul types or
inconsistent totals also stay unknown. Only Type 1 flagrant attribution is
demonstrated by these samples; Type 2 is intentionally unsupported pending evidence.

All four games retain End Game wallclocks. These are **event cutoffs**, not
contemporaneous publication or recorded-quote timestamps. After-game inputs
cannot affect an earlier valuation; midnight game-date coordinates would fail
that rule for all four samples. Source corrections may have occurred after play.
Minutes are displayed precision and cannot establish exact career-minute totals.

Expected bounded results: 78 played rows and 31 DNPs; 75 existing-map matches and
three separate identity candidates; 68 fully scored rows and ten rows with
unknown technical penalties; 65 eligible rows using existing identities. This
establishes a feasible source path with real remaining gaps, not full-season
coverage or approval of a reconstructed model. Event-schedule completeness,
cross-source scoring checks, historical roster anchors, source retention and a
reviewed model/publication plan remain separate dependencies.
