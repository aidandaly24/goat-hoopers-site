# Ranked Arcade competition — activation held

This is source implementation, not evidence of a production deployment. No
shared schema, live score, worker, activation flag, reward or payout was changed.
The first ranked adapter is Free Throw; 82–0 and Priced In remain unranked.
The existing fantasy standings and Power rankings are independent.

## Resulting behavior

- A weekly board sits above the Arcade cards. Dedicated current-week,
  per-game all-time and stable weekly-final routes share one bounded public DTO.
- Free Throw defaults: **9 shots / 120 seconds**, moving-court v2, one point per
  server-replayed make, **unlimited attempts**, one active run per verified
  personal account. Only the best valid completed round counts.
- Ties use score descending, **earlier server-accepted best score**, then the
  immutable score UUID. Raw client totals/outcomes never determine the result.
- Saved results include ordered makes/misses, accuracy, longest and ending
  round streak. These are round statistics, not an invented cross-round streak.
- Everyone includes verified personal accounts without a claimed team. League
  requires a current verified active team link. Score ownership never follows
  a display name, email, legacy cookie or team claim.
- Final scores/order and team eligibility are sealed transactionally. A later
  username change is displayed using the current profile; it cannot alter the
  archived score/order. A later team claim does not rewrite archive eligibility.
- All-time chooses each account's best round across compatible periods of the
  same game/scoring format. Different games and changed scoring formats are
  separate; current-format all-time excludes incompatible historical scores.
  Old finals remain reachable at their original IDs.
- Public GETs read only. Visible current boards refresh once per minute;
  archives do not poll. Public rows omit account/session IDs, email, raw inputs
  and private result IDs. The dedicated result endpoint requires its owner.

## Calendar and finality contract

`GOAT_ARCADE_CALENDAR` is a reviewed JSON array of explicit period definitions:

```json
[{
  "id": "free-throw-2026-week-1",
  "gameId": "free-throw",
  "week": "2026-W01",
  "label": "Week 1 · Free throws",
  "order": 1,
  "opensAtMs": 1792522800000,
  "predecessorId": null,
  "calendarSource": "https://REPLACE-WITH-VERIFIED-FANTASY-WEEK-SOURCE",
  "calendarVersion": "REPLACE-WITH-REVIEWED-SOURCE-VERSION",
  "fixtures": [{"id": "REPLACE-WITH-ASSIGNED-ESPN-EVENT-ID", "date": "YYYYMMDD", "startsAtMs": 0}]
}]
```

The example is deliberately invalid until real assigned fixture IDs/source dates
are supplied. Week 1 opening is **October 20, 2026 at 15:00 America/New_York
(19:00 UTC)**. Subsequent periods use New York midnight on the sourced first
fantasy-week day, delayed until the preceding period actually finalizes. Store
explicit UTC instants converted from those local calendar dates; never add a
fixed 168 hours across DST. The parser verifies a unique ordered predecessor
chain, unique fixture assignments and New York midnight for later openings. Publishing freezes IDs, calendar, fixture assignments and rule/format
hashes. Definitions cannot be silently rewritten. The runtime has no built-in
or guessed complete fantasy-week fixture list.

The protected worker fetches ESPN's publisher scoreboard only for due dates
and accepts only configured event IDs. Final means both `completed === true`
and `state === "post"`, with no postponed/cancelled/suspended status. Missing,
postponed, failed or more-than-ten-minute-old receipts block admission/saving
and cannot close a week. Scheduled duration and elapsed wall time never imply
finality. A future configured fixture remains scheduled, so an early final in
another game does not end the week.

Finalization takes the period write lock, waits for in-flight score transactions,
then snapshots one best score per account and closes/seals once in the same
transaction. Retry is idempotent. Old rows remain. The next due period can open
only after this seal. Its admission gate uses the database clock, independent
of the browser clock.

**Close time is the first verified final observation accepted by the worker**,
not an invented precise last-buzzer timestamp. A proposed five-minute worker
cadence bounds ordinary observation lag; a fresh prior live receipt may permit
play until the next check. An outage blocks after ten minutes and delays rollover.
No five-minute schedule has been configured or enabled by this PR.

## Proposed operations requiring separate approval

1. Review/apply `migrations/ranked-free-throw.sql` to the explicitly approved
   production schema after the existing personal-account/username prerequisites.
   It creates four new tables, indexes and immutability triggers in one SQL
   transaction; it does not alter legacy `game_scores`, accounts or rewards.
   Do not run it over a prior ranked prototype installation without a separate
   schema comparison. Roll back application activation by disabling the flags;
   retain the tables/results rather than deleting competition history.
2. Establish the actual fantasy-week boundaries and complete assigned NBA event
   list, including postponement handling and calendar provenance. Publish that
   reviewed JSON, with the Week 1 opening above. No real full-week assignment
   has been validated in this work. A calendar only for Free Throw cannot
   activate ranked 82–0; that game needs its own scoring adapter/rules first.
3. After exact-head CI, Dot/Muse review and production HTTPS auth/provider
   verification, approve deployment and `GOAT_RANKED_FREE_THROW_ENABLED=1`.
   With no custom rules variable, the adopted 9/120/unlimited policy is used.
   A missing/invalid calendar or inactive personal auth still holds ranking.
4. Separately approve `GOAT_ARCADE_RECONCILE_ENABLED=1`, the existing
   `COMMISSIONER_KEY` protected empty POST to
   `/api/arcade/competition/reconcile`, its first period publication/write, and
   the worker's scheduled invocation. No calendar/status request body is accepted.
   Use a scheduler able to send that exact bearer header; do not assume an
   unrelated hosting cron secret is equivalent. A first successful invocation
   publishes periods and receipts; public GETs never do so.

Rewards stay **off** throughout. No FAAB credit, ledger write, reward scheduler,
prize decision or payment setup is implemented in this path.

## Verification boundaries

The ordinary suite blocks external credentials/network. Opt-in PostgreSQL tests
use only `127.0.0.1:55441/claim_team_test` and random owned schemas. They check
concurrent admission/duplicate saves, post-lock expiry, rollback, actual provider
session revocation, late save rejection, immutable archives, next-period gating,
score-format isolation and an in-flight save versus finalization. The legacy
store kernel and canonical adapter have separate tests. Domain fixtures check
167/169-hour DST week gaps and missing/postponed authority.

`qa/ranked-free-throw/full-app.mjs` starts the complete application on loopback,
uses the real login form/provider cookie, mounted routes, replay and PostgreSQL,
then verifies weekly/all-time/history UI. Only the finality publisher response
is replaced by a private synthetic preload; the same parser and protected
reconciler execute unchanged. Its short 3-shot/60-second rounds are fixture rules,
not production defaults. Development fonts may use Next's local fallback when
external font requests are blocked. Production default-off build is checked
separately. No shared database, live hosting fetch, production secure-cookie/email
flow, physical phone or deployment is established by these checks. A normal-motion
full-density SwiftShader round timed out after the separate Blender merge. The
fixture can bound pixel density for functional checks and records that choice;
physical-device animation pacing remains unverified, with art unchanged here.

Server replay rejects malformed/incomplete/timed-out/inconsistent rounds; it
cannot prove that a human chose each submitted input. It is not bot-proof
anti-cheat. Raw inputs are retained for later review, with rewards disabled.
