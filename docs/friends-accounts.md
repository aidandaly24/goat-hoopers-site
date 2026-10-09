# Friends-only accounts: foundation and reviewed reset plan

Status: **HOLD MERGE; no production cutover or reset executed.** Source audit:
main `f5be2b7ee6821ed8f69e22ca8782abb2a7192ea8`; isolated branch
`dot/friends-account-foundations`, ownership issue #118. AI backend #112 / #117
is independent and may proceed using current auth. Open issues and all eight
open PR file lists were inspected before claiming work. No competing auth owner
was found. Shared architecture additions must be sequenced by the coordinator.
Publication recheck reconciled this isolated patch onto main
`edfdb81e17d889087be3e7707518cf8ddd1e39da`; all sixteen current open PR file
lists were inspected. No auth/competition implementation overlaps this scope.

## Decision

Use **Better Auth email/password** inside the existing Next.js application and
Postgres, with separate provider tables and a one-to-one link to the existing
`site_users.id`. Keep invitation codes as the signup gate. Use the provider's
password, verification, reset and session machinery; keep app membership and
game/reward authorization in the application. No extra auth service, Redis,
OAuth, queue or organization system is justified for ten managers now.

Better Auth is a proposed provider choice, not an installed or verified runtime
in this patch. Official docs were checked on 2026-10-08 America/New_York (documented release
1.7.7); lock a reviewed exact release and generate its actual schema in an
isolated database before implementing the adapter. This repo currently has no
auth provider dependency, recovery emails, or email delivery service. Do not
invent emails, provider IDs, imported password records or compatible sessions.

The user's requested “nuke the auth DB” means **reset old credentials and
sessions**, preserving app identities and all dependent history. Deleting
`site_users` is excluded: its cascading foreign keys delete scores and rewards.
Stock/price/cache/import tables, basketball/Sleeper data and AI budgets/results
are outside the reset. A password change does not require destroying an account.
Every password is entered privately in the new account form, never chat or logs.

## Confirmed source findings

| Area | Current behavior | Consequence |
| --- | --- | --- |
| `src/app/actions.ts` | Team + bcrypt password login; random 32-byte token, SHA-256 hash in DB; httpOnly/SameSite=Lax/secure production cookie, fixed 90-day expiry | Usable current server identity; remembered login already exists, without sliding renewal or account session management |
| Login action | No dedicated brute-force guard; distinct unknown-team/wrong-password responses | Add durable throttle and generic authentication failures in provider integration |
| Claim action/store | Six-digit plain-text invites; atomic claim CTE and team uniqueness; separate claim IP counter | Preserve atomic ownership. Counter read/increment is not atomic and leftmost forwarded IP is unverified; do not treat it as a strong abuse boundary |
| Credentials | Minimum length only in current action; no email/change/reset/revoke-all flow | Replace lifecycle with provider implementation and verified recovery channel; do not import current bcrypt hashes by assumption |
| `src/data/db.ts` | Scores/rewards/sessions reference app UUID with ON DELETE CASCADE; invite used_by is not an FK | Preserve IDs; inventory invite references and undeclared dependencies as well as catalog FKs |
| `src/data/arcade.ts` | createScore/createReward accept caller values; no run ID, idempotency, validation or reward uniqueness/cap | Do not expose these methods to browser submissions or treat historical rows as verified competition evidence |
| Free throw | Practice runs locally, no score submission/reward call; all competition statuses coming-soon | No current public score endpoint to repair. Keep practice open and competition/rewards closed |
| Rewards | Existing FAAB-oriented schema and UI describe pending settlement; writer is not called by application routes | Preserve historical ledger unchanged; no actual FAAB credit, monetary prize, settlement or new entitlement now |
| AI draft #117 | Reads gh_session, verifies hashed session, and rechecks it inside atomic budget authorization | A provider cutover needs coordinated atomic session authorization; a renamed cookie or SiteUser return type alone is insufficient |

These are source observations, not evidence about actual production account
counts, provisioned schema, scores, reward balances or settings. No production
connection was opened and no IDs/credentials were exported.

## Minimum architecture and complexity

Observer: the small maintainer team, ten-manager friends league; decision
horizon: this auth replacement and the first verified competition. Required
outcomes: invite-only enrollment, recovery and remembered secure sessions,
stable ownership, tamper-resistant score evaluation, bounded cosmetic issuance.

| Concern | Class | Decision / cost / trigger |
| --- | --- | --- |
| Invite entitlement and durable app principal | Essential | Keep one rule and DB uniqueness; it preserves team and score ownership |
| Password/reset/session lifecycle | Imported | Delegate to Better Auth. Maintainer still owns upgrades and email delivery; isolate provider subject from domain ID |
| Custom password actions mixed into game store | Accidental | Retire after proved cutover; avoid two permanent credential systems |
| Legacy provider coexistence | Transitional | Enrollment window only; coordinator owns sunset after every account is linked or explicitly marked recovery-required |
| Provider claim transaction, real schema/data and recovery emails | Unknown | Prove in isolated Postgres and inventory privately before any reset |
| Rewards/prize system beyond one cosmetic weekly winner | Unknown (speculative scope) | Defer FAAB/money integrations until separately authorized product rules exist |

Provider tables: generated `auth_user`, `auth_account`, `auth_session`,
`auth_verification`, `auth_rate_limit` names, configured and reviewed against
the pinned adapter. Do not map provider sessions onto the incompatible existing
hashed-token `sessions` table. `account_identities` links provider subject to
`site_users.id`, with UNIQUE(provider, subject), UNIQUE(user_id), FK to the app
identity using RESTRICT rather than cascading score history. Keep user/team
ownership server-owned; never accept it as provider profile or request input.
Provider deletion must not cascade into app identities/history.

New-account enrollment consumes an unused invite and creates app membership
and the unique provider link atomically. Provider registration alone grants no
membership; unmapped or inactive sessions resolve to null. All provider signup
paths, not just the visible claim form, must enforce the invitation gate. A
before-hook followed by unrelated writes is insufficient. First test actual
adapter transactions and rollback on duplicate code/team, provider creation
failure, verification failure and interrupted enrollment. If the chosen adapter
cannot guarantee this, hold cutover and use a reviewed transactional signup
integration. The current neon-http store has no interactive transactions; do
not assume it can wrap a provider operation.

Existing users re-enroll to the **same app UUID** through a distinct single-use,
short-lived migration entitlement. Issue it after proving current account
ownership before reset, or commissioner verification of the manager through
the existing private relationship. A used signup code, email/name/team match,
or possession of a new provider account is never sufficient for relinking.
Do not offer unrestricted team selection or reactivate used invites. Any
unlinked account retains its UUID/history and is recovery-required.

## Session and password contract

At future cutover, getCurrentUser continues returning `SiteUser | null`, with
the original UUID. `resolveAccountUser` is the new injected read seam; its
verifySession dependency must call Better Auth's server getSession with actual
request headers. Client JSON, cookie presence and provider profile are never
session verification. It has no email/team/name fallback; failures remain
unavailable and cannot grant anonymous privileges.

Proposed session config: 90-day expiry, daily sliding refresh, 5-minute fresh
session requirement for account changes, httpOnly/secure/SameSite=Lax on HTTPS,
exact allowed origins and provider CSRF checks enabled. Initially disable cookie
session caching on sensitive paths; revocation must take effect immediately.
Document 90 days as inactivity lifetime if refresh is enabled. No localStorage
tokens. Offer sign out current/all sessions and password change requiring
current password. Request reset returns a generic response, requires verified
recovery email, uses provider tokens and a fixed redirect origin, and revokes
all active sessions on reset. Do not log URLs/tokens or await mail in a way that
exposes account existence; delivery must complete using the platform's supported
background-lifetime mechanism.

Use database-backed atomic rate limiting in serverless. Verify the trusted
proxy header rather than guessing an IP source. Better Auth documents that
server-side auth.api calls bypass its HTTP limiter: a custom enrollment action
must explicitly consume the shared limiter. Bound signup/reset/login request
bodies and email delivery volume. This is part of the real integration tests.

### AI Decides compatibility gate

Draft #117 uses both getSessionUser(tokenHash) and an SQL EXISTS on legacy
`sessions` inside its budget reservation. Preserve `SiteUser.id` and every
existing per-user budget, fingerprint and lease owner. No fresh ID or wiped AI
counters on password reset. Page/cache reads continue independently.

Preferred later change: coordinate a separate AI-owner PR to perform the
atomic authorization check against authoritative provider-session validity
plus the identity link. Prove expiry, revocation, reset-all and request/reset
races in real Postgres. Until that PR is reviewed, **do not switch auth or
delete sessions**. A synchronized hashed-session bridge is only a fallback
proposal if provider atomic verification proves infeasible; it would need
transactional revocation on every provider lifecycle event and an explicit
sunset. This patch creates no bridge or second live session system.

Direct private coordination with AI task `01a11e4e` confirmed this sequencing:
the owner accepted the separate provider-session/account-link review, no bridge
now, current atomic check unchanged, and no session reset before compatibility
review. Its draft remains head `319bc2e408545cd9d6a23db02c5d6c554d9fcd63`.

## Recoverable reset: exact scope and ordering

1. **Private inventory, no mutations.** An authorized operator runs
   [account-inventory.sql](friends-accounts/account-inventory.sql) read-only.
   Save IDs/counts privately, never GitHub/chat. Enumerate catalog foreign keys,
   each score/reward/session/invite owner and AI JSON owner (not declared as an
   FK). Run the conditional AI query only if #117's table exists. Freeze the
   account/reset slice for a consistent final inventory; new dependencies or
   orphans block reset. `auditAccountIdentity` validates a supplied snapshot;
   it is not a database inventory or authorization to reset.
2. **Recoverable backup.** Before any credential reset, take a consistent
   full custom-format pg_dump through a private service configuration; never
   put a connection URL in command arguments, chat or logs. Save the dump and
   private inventory outside the repository in encrypted restricted storage,
   record checksum/time/schema/head, and retain all sequences/functions/grants
   needed to restore. The dump contains credential material: do not attach it
   to this task or PR. Full backup is necessary because selected-table dumps
   alone can omit dependent schema and undeclared AI references. No backup has
   been taken by this task; none can be claimed until verified.
3. **Restore proof.** Restore that dump only into a disposable, isolated
   Postgres database using owner-approved private configuration. Compare every
   app UUID, team link, score/reward row ID/owner/count and all unrelated table
   contents. Verify restored login and data reads. Recoverability, not merely
   a successful dump exit, is the gate. No production restore.
4. **Additive rehearsal.** Install the pinned provider, generate/review the
   actual prefixed schema, add the unique identity link and migration
   entitlements only in isolated storage. Existing legacy hashes stay sealed;
   there is no bcrypt import. Test enrollment, verified email delivery, real
   transactions, private password creation, session lifecycle and AI gate.
   Reconcile all dependent IDs before/after. No drizzle-kit push against live
   data and no destructive SQL in this foundation patch.
5. **Concrete approval packet.** Present the exact target environment,
   affected account UUID set and row counts privately, backup/restore evidence,
   schema diff, coordinated AI change, rollback artifact and final runtime
   checks. User approves that packet before the reset. Existing instruction
   to reset auth does not authorize deleting basketball/stock data.
6. **Reviewed reset transaction, later.** Disable legacy claim/login/session
   writers in the reviewed runtime cutover, make legacy password_hash nullable
   in the reviewed schema, and null the old hash **only for the enumerated
   account UUIDs**. Delete only those users' legacy session rows. Clear the
   old browser cookie and reject legacy cookies permanently after reset.
   Retain site_users ID/team/name/created_at and all score/reward/invite
   ownership. Do not drop/truncate any database/table, delete users, regenerate
   used signup codes or reset unrelated counters. No credentials are exported
   from the provider to the legacy store. Re-run private counts/owner checks
   immediately; divergence rolls back the transaction.
7. **Recover without resurrecting revoked sessions.** Before cutover, rollback
   means keeping the old reviewed runtime. After a reset, pause writes and
   restore affected identity/credential records from the verified backup only
   under a separately reviewed recovery procedure; require fresh sign-in and
   revoke old sessions rather than restoring revoked token rows. Keep provider
   mappings/history so reverting runtime cannot assign new IDs. Do not restore
   the whole production database over later basketball/stock updates.

## Competition contract, separate activation

`competition.ts` validates a server-owned run (app UUID, game, week, rules
version, start/expiry) and bounded input events. Browser cannot submit score,
userId, week, result or reward. It bounds at most 100 shots, 5 minutes, finite
direction within the current practice engine's ±14 degrees, power 0–100,
monotonic timing and work/score ceiling. The injected versioned engine recomputes
the score. These are safety ceilings, not approved competition rules. The
current physics remains in the practice surface; move/share its pure engine
through the domain before implementing a server replay, preserving existing
practice tests. The focused tests use synthetic replay and do not prove physics
or anti-bot fairness.

Later persistence must atomically consume an unexpired, unconsumed owned run
AND insert one verified score with UNIQUE(run_id). Recheck session authority
and expiry at commit, enforce durable run issuance/submission budgets, same
origin, transport byte limits, max completed shots and actual simulation
timing. A precheck followed by createScore is not replay protection. Repeated
or concurrent submissions yield the same committed result or rejection, never
two scores. Historical unverified scores remain readable but are not eligible
for rewards. Version score evidence so a physics change cannot reinterpret
old runs. A deterministic browser game can still be optimized by bots; do not
claim cryptographic proof of human play or attach monetary rewards.

Reward activation is **off**. `planCosmeticAward` prepares a one-unit candidate
only when an explicit cosmetic policy and budgets allow it. Later select the
weekly winner solely from finalized verified scores (highest score, earliest
achievement, stable score ID tie break), then atomically lock/recheck global
and user counters plus UNIQUE(game_id, week). Changing policy/cosmetic/version
must not reissue that game's weekly reward. Use an append-only cosmetic ledger
with score provenance and restrictive FKs. A pure budget check cannot prevent
concurrent issuance; real SQL tests are required. No actual FAAB credits, monetary
prizes, balance mutation or legacy reward settlement is implemented or allowed.

## Scope ladder and required user configuration

- **Now:** review dormant identity and competition candidates, run offline
  tests, keep existing runtime/AI work functioning. No current route imports
  these modules. The inventory SQL is read-only and has not run.
- **Next, after review:** user privately chooses/verifies a recovery email;
  approves provider/email delivery, exact origin and isolated database setup.
  User or authorized operator privately configures BETTER_AUTH_SECRET,
  BETTER_AUTH_URL and mail credentials, never NEXT_PUBLIC_ or chat. No
  credentials/service/setting is provisioned by this task. Test full provider
  flows, invitation bypass/parallel claims, DB uniqueness/rollback, revocation,
  AI atomic authority and restore proof before proposing cutover.
- **Then, only with the reset packet approved:** execute the narrowly scoped
  credential/session reset and private enrollment, keeping durable UUIDs.
- **Later, after a server replay and real race tests pass:** enable one
  competition with explicitly agreed rules and issuance budgets; optionally
  one nonmonetary cosmetic. New games/reward types require a named product
  need. Redis, services, generalized prize workflows and FAAB remain deferred.

A missing verified recovery email means reset is unavailable, not a commissioner
password in chat. Prototype/account UI changes must use the repository's design
skill and accessibility reference when separately implemented.

## Verification and publication

See [validation.md](friends-accounts/validation.md) for revision-bound checks.
Offline tests cover stable owner reconciliation, unmapped/disabled sessions,
forged input, timing/work ceilings, consumed-run denial and candidate budgets.
They do not prove provider integration, DB races, recoverability or live auth.
No production build/browser/provider/database/reset/deployment has run here.

The minimal ownership notice #118 was published. The user explicitly approved
publishing this prepared source and plan as a public draft PR. That publication
does not authorize a production reset, provider setup, activation, security
setting change, merge or deployment. Private AI coordination succeeded and
confirmed the compatibility gate above. Detailed comments to other issue/PR
destinations remain outside this publication approval.

## Official references

- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication):
  recommends an established library and server-side authorization. Also read
  installed Next 16.3.8 authentication and use-server guides before this patch.
- [Better Auth email/password](https://better-auth.com/docs/authentication/email-password):
  provider-owned change/reset flows, verified recovery, explicit revoke-all.
- [Session management](https://better-auth.com/docs/concepts/session-management):
  expiry, refresh, freshness and revocation.
- [Database concepts](https://better-auth.com/docs/concepts/database) and
  [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle): generated
  provider schema and server-owned fields; no undocumented migration assumption.
- [Rate limiting](https://better-auth.com/docs/concepts/rate-limit): persistent
  serverless counters and the server auth.api limiter exception.
- [Security](https://better-auth.com/docs/reference/security): secure cookies,
  CSRF/origin enforcement and trusted proxy configuration.
