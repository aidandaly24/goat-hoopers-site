# Held ranked opening clock

This main-based slice integrates only the public held countdown from the local
timing work. It does not merge the old ranked foundation or change gameplay.

The approved opening intent is October 20, 2026, 15:00 America/New_York
(19:00 UTC), versioned in `domain/arcade/challenge-opening.ts`. The end of the
competition and its rules are still unconfirmed. There is no invented closing
instant, round duration, shot count, attempt allowance or prize policy.

The existing `/arcade/leaderboard` page injects `WeeklyChallengeCountdown` into
the closed board. `WeeklyLeaderboard` remains a pure presentation component;
its optional `closedTiming` slot owns no fetching. The page retains disabled
scope controls and its Practice Court link. Reaching zero displays “Scheduled
opening reached · ranked remains held”; it does not open entries.

`GET /api/arcade/free-throw/clock` delegates to `data/arcade-clock.ts`, which
samples server time during the request. It always returns the bounded
`held-opening-v1` protocol with `phase: held` and `period: null`, including at
and after the opening. Query overrides, invalid methods and invalid time fail
closed. Responses are private/no-store. The endpoint has no account, database,
environment, admission, scoring, upstream service or award dependency.

The browser adapter performs one same-origin GET per refresh, with cancellation
and no-store. It strictly rejects active phases, incompatible versions or an
altered opening. No polling, automatic retry, score POST or hidden-tab work is
introduced. Mount, explicit refresh, visible-tab return, BFCache restoration,
suspension and clock skew reconcile a page-local monotonic anchor. Concurrent
refreshes coalesce and stale/aborted replies cannot replace newer evidence.
Full round-trip time is discounted conservatively; the display clamps at zero.
Client wall time detects suspension/skew only. Per-second values are not live
announcements and the display has no animation.

The generic `domain/server-clock.ts` and `ui/ServerCountdown` have no arcade,
auth or transport dependencies. The controlled primitive requests reconciliation
from its consumer and reuses the shared button styles. The homepage's separate
opening clock is unchanged.

## Separate ranked dependency

Main has no ranked run store or admission/submission API. The owned-run lookup
and read-only recovery from local head `847cf4f7a066d40981a34a3bbf010f8d222bb6bc`
therefore stay with that unmerged foundation. This PR does not add a placeholder
endpoint or import its schema, policy defaults, auth or physics. When that
foundation is separately reconciled with current gameplay, its existing
ownership-checked database sample and frozen run deadline can be integrated.

## Remaining decisions and checks

The parent thread is awaiting what “end of the final game” means. A full policy
also needs its authoritative closing event/source and overtime/postponement
behavior; round duration, shot count, attempt/abandonment and buzzer/acceptance
rules; account eligibility, rankings/streaks/ties; recurrence/finality and any
prize policy. Nine positions and a proposed 120-second round do not settle those
questions. Do not derive a weekly end by adding a guessed duration to the start.

After those decisions, a complete server competition period must drive
admission, acceptance, entry and the board. Exact-head CI and joint Dot/Muse
review remain release gates under current instructions. This slice includes no
activation, shared migration, production database work, score/prize change,
new secret or infrastructure setting. Blender/gameplay files are excluded;
the file split is recorded on issues #202 and #199.

`qa/ranked-opening/verify.mjs` builds a credential-free isolated production Next
app from the actual page, surfaces and API route. It verifies HTML/RSC, clock
reads, held/zero/error/skew/visibility states, narrow/200% layout and navigation
to the existing practice component. Synthetic as-of values are explicitly
intercepted in the browser; production hosting and real auth/DB are not claimed.
