# Authoritative accepted-score feedback

The canonical Free Throw save returns HTTP201:

```ts
{ status: "saved", score: RankedScore, recordFeedback: RankedRecordFeedback | null }
```

`src/domain/arcade/ranked-record-feedback.ts` is the public, browser-safe contract.
`recordFeedback` contains `version:1`, `scoreId`, `acceptedAtMs`, `periodId`,
`scoreVersion`, `scope:"everyone"`, and three `{previousScore,outcome}` comparisons:

| Comparison | Accepted scores before this save |
| --- | --- |
| `personalBest` | This verified personal account's lifetime maximum for this game and compatible score format |
| `weeklyRecord` | Everyone's maximum in this exact canonical period and format |
| `allTimeRecord` | Everyone's maximum across canonical periods with this compatible format |

Compatibility uses the period's frozen `score_version`, exactly as the all-time
board does. It includes engine, shot count, duration, minimum interval and replay
context. Rule labels/calendar changes alone do not reset compatible history.
Legacy scores without a canonical period are excluded, as on canonical boards.
Everyone includes personal accounts without team membership. This response makes
no League record, prize, streak-record, rank or current-record-holder claim.

Outcomes are `first` (no previous score), `beaten` (strictly greater than a real
previous score), `tied` (equal) or `below`. Zero is a real prior score. A first
score or a tied score must never be labelled "record beaten". Existing board
tie ordering (score descending, server acceptance ascending, stable score UUID)
and best-round-per-account behavior are unchanged.

The maximum queries are uncapped, authenticated server SQL reads in the same
transaction as consumption and score insertion. All canonical Free Throw saves
take transaction advisory lock7042030 after period SHARE locks, then take
account/session and run locks. Under READ COMMITTED the next save compares with
the previous committed save, including a different account's score. Finalization
still takes period write locks first. The final save statement checks fresh
database time, session, period authority and run expiry after all lock waits;
failure or rollback produces no feedback. The fixed lock also serializes different
formats; this favors correctness for the current small competition over throughput.
The aggregate scans accepted rows on save; no leaderboard limit or browser state
is used. Growth may later justify separately reviewed aggregate persistence.

Feedback describes the instant of acceptance. Another player may beat it before
the response arrives. The stable celebration key is `scoreId`; consumers must
dedupe it, rather than celebrating every render of the saved result. The injected
browser client's score-shaped `submit` value has optional `recordFeedback` so
existing consumers and fakes remain compatible. Its decoder binds score ID and
acceptance time, validates comparisons and public scope/identifiers, and discards
only malformed optional feedback while retaining valid score statistics.

GET result/recovery explicitly returns `recordFeedback:null`. The browser
`result()` adapter returns only the saved score, discarding any feedback. Duplicate,
expired or conflicting POST responses keep existing errors and carry no feedback.
No achievement ledger or migration is introduced: when the first successful
response is lost, recovery restores the saved result but deliberately cannot
recreate a record celebration. Legacy adapters can return null feedback.

Validation is offline and uses disposable synthetic PostgreSQL only. This code
does not establish production configuration, schema application, deployment,
enabled play or real score persistence. UI consumption is separately owned.
