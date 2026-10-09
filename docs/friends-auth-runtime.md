# Invite-only Better Auth runtime

Separate follow-up to foundation #134; default-off source, no live configuration
or migration applied. Existing team/password login and sessions continue when
both flags are unset. No accounts, hashes, sessions, scores, rewards or AI budget
counters are deleted. No rewards work is included.

## Working path

- New manager: `/claim` → unused six-digit invite + email + private password →
  verification email → `/login` → remembered provider session → same app identity
  on `/team`. Public provider signup is disabled and not mounted.
- Existing manager: `/login?legacy=1` → private existing team/password → fresh
  five-minute legacy session → `/account/setup` → email/new private password →
  verification → email login. The transaction links the original `site_users.id`;
  matching a team/name/email or resubmitting a used invite cannot relink it.
- Account settings are linked from My Team. Password change requires the current
  provider password and revokes other provider sessions. Recovery sends a generic
  response and a provider-owned 30-minute token; successful reset revokes all
  provider sessions. Session lifetime is 90 days of activity, refreshed daily;
  cookies are httpOnly, SameSite=Lax and secure on HTTPS. Cookie caching is off.

One node-postgres/Drizzle transaction wraps provider user/account/verification
creation and invitation consumption or existing-UUID linking. Adapter operations
use that transaction; internal verification mutations use pg savepoints. A duplicate
provider email, duplicate team or duplicate identity rolls back the whole claim.
Mail is queued only after commit using Next `after`; no token appears in our API
response. If delivery fails, request verification again from login.

Protected identity reads verify the provider session and an active unique link;
there is no legacy fallback after cutover. Account deletion/email change/social
linking are not exposed. Provider HTTP limits use the database. Fixed-key atomic
global limits additionally cap account requests at 120/15 minutes per endpoint,
and enrollment/reset/verification mail at 10/15 minutes; these do not trust a
caller-supplied proxy IP and cannot grow unlimited abuse-key rows.

The account form's primary action is claim, sign in or change/recover a password.
It includes pending, generic error and check-email/success states. Fields stack
and shrink at narrow widths, with labels, autocomplete and visible keyboard
focus. No private password is held in React state, browser storage or logs.

## Aidan's private configuration and additive DB step

Do not send any private value through chat/GitHub. This task does not inspect or
configure existing values, generate persistent secrets, register a sending service
or change live settings. Aidan supplies/approves:

| Setting | Required action |
| --- | --- |
| `BETTER_AUTH_SECRET` | Privately configure a strong provider secret, at least 32 characters; never public/client-prefixed |
| `BETTER_AUTH_URL` | Exact HTTPS origin without trailing slash, e.g. the approved site origin; localhost is allowed only outside production |
| `RESEND_API_KEY` | Privately configure an authorized sending-only key; use an existing account or approve the service setup first |
| `AUTH_EMAIL_FROM` | Sender authorized by a verified sending domain; users enter/verify their own recovery email |
| `DATABASE_URL` | Existing authorized PostgreSQL connection, configured privately; no URL is exported by this task |
| `FRIENDS_AUTH_ENROLLMENT=1` | Optional existing-manager enrollment window after additive schema/mail work; legacy app auth remains active |
| `FRIENDS_AUTH_ENABLED=1` | Coordinated final provider switch, only after the AI authorization change below is integrated |

Before applying any DB change, the operator verifies a recoverable backup and
rollback. The source migration is **additive only**, generated offline by
`node node_modules/drizzle-kit/bin.cjs generate --config drizzle.friends-auth.config.ts`.
Review/apply only `db/friends-auth/0000_friends_auth.sql` in a transaction; it creates
seven new tables and restrictive app identity links. Do not run broad schema push,
drop existing auth tables, import guessed password hashes or blindly reset accounts.
Rehearse with an isolated restored database and reconcile original owners first.

Roll back a failed additive migration transaction. Runtime rollback before final
cutover keeps current auth. After provider cutover, any runtime rollback requires
operator review: preserved legacy passwords/sessions must not silently restore
access revoked by a provider password reset. Newly claimed provider-only users
have a non-authenticating legacy hash marker and cannot use legacy login.

## AI contract and release boundary

The AI owner retains `src/data/ai-decider/service.ts` and `store.ts` plus its
runtime wiring. No AI file changes here. `getProviderIdentity(headers)` returns
only `{ user: SiteUser, sessionId, subject, expiresAt }` after verified email,
provider session and active unique mapping. AI should use the shared
`friendsAuthEnabled()` predicate (exact string `1`) and fail closed without legacy
fallback. At the paid-budget mutation, join `auth_session`, `account_identities`,
`auth_user`, `site_users`; recheck exact session ID/subject/app UUID, future expiry,
active link, verified email and valid team. Keep current app UUID budget keys.
No raw provider token is passed to AI, no bridge or counter reset is needed.

Root owns deployment. Merging this source with flags unset preserves current
runtime. Activation needs private configuration, backup/additive schema rehearsal,
the separately coordinated AI source, and one invited/existing-manager flow using
the actual configured mailbox. Credentials/password entry stays with Aidan/users.

## Focused evidence

The actual Better Auth 1.7.7 memory adapter smoke covers blocked public signup,
verification, remembered secure cookie, UUID resolution, unmapped denial, password
change, generic reset response, one-use reset and session revocation. Schema tests
compare every core field with the installed provider's `getAuthTables`.

One real PostgreSQL smoke reuses existing pg/Vitest and the fixed
`127.0.0.1:55441/claim_team_test` guard. It covers a concurrent same-invite winner,
duplicate-email rollback, preserved existing UUID/hash, provider verification/login,
and concurrent durable caps. Only its explicit CI step enables the fixture; ordinary
tests keep database opt-ins off and no application secret/reference enters CI.
It is a disposable synthetic database with no persistent volume. Local PostgreSQL
is unavailable; the normal CI step is the real-database check. No live mailbox,
Neon transport, backup/restore, hosted/browser or production activation is claimed.

Sources: [Better Auth Next](https://better-auth.com/docs/integrations/next),
[Drizzle adapter](https://better-auth.com/docs/adapters/drizzle),
[password lifecycle](https://better-auth.com/docs/authentication/email-password),
[Resend send email API](https://resend.com/docs/api-reference/emails/send-email).
