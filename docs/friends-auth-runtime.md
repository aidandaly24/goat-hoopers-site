# Email accounts and one-time team claims

Pinned Better Auth account runtime, separate from optional league membership.
Source defaults keep legacy app login when both flags are unset. The source repair
changes no deployed setting or existing app data. No reward work is included.

## Working path

- Individual friend: `/signup` → unique username + email + private password →
  verification → `/account/login`. Registration needs no team code and creates
  no `site_users` row. The account can recover/change its password without a team.
- Optional league membership: verified account → `/account` → unused team code.
  A transaction rechecks the exact provider session, locks the code, inserts
  membership/link and consumes the invitation. The existing team uniqueness
  constraint permits exactly one owner; no automatic reassignment exists.
- Existing owner: `/login?legacy=1` → old team/password privately → fresh
  five-minute legacy proof → `/account/setup`. Create email credentials and a
  personal username, or sign into an already-created email account and confirm
  its link. No invite is required. The original `site_users.id` and hash remain.
- Login visibly links password recovery. Email recovery is account-based; team
  recovery resolves only the active verified linked email on the server and
  never accepts a recipient from the browser. Unknown accounts/teams return
  generic responses. Reset tokens expire after 30 minutes and revoke sessions.
- Provider sessions last 90 days of activity and refresh daily. Cookies are
  httpOnly, SameSite=Lax and secure on HTTPS; cookie caching is disabled.

Personal account identity is `auth_user.id`, returned as `subject` only after
provider verification. Its `name` is a non-email username: normalized lowercase,
3–20 letters/numbers/underscores, enforced by request validation plus an additive
case-insensitive unique index. `getVerifiedAccount(headers)` returns
`{ subject, sessionId, name } | null` without team privileges. Personal game
persistence is separately owned and uses this subject; League reads filter by
current active membership. Claiming a team does not change individual identity.
Team/AI identity continues to use the original linked `SiteUser` UUID.

Registration uses the provider adapter inside a PostgreSQL transaction. Existing
owner setup also creates its identity link in that transaction. Mail queues only
after commit; no verification/reset token is returned by our account API. The
old combined invite/signup HTTP route is rejected. Team claim requires the full
provider flag, preventing new provider-only members under the legacy runtime.

Protected identity reads verify the provider session and an active unique link;
there is no legacy fallback after cutover. Account deletion/email change/social
linking are not exposed. Provider HTTP limits use the database. Fixed-key atomic
global limits additionally cap account requests at 120/15 minutes per endpoint
and enrollment/reset/resend attempts at 10/15 minutes. Every production mail
emission also consumes one shared durable `mail:verify` or `mail:reset` allowance
of 10/15 minutes, covering automatic verification on sign-in and post-commit
enrollment mail. Verified login consumes no mail allowance. These do not trust a
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
Rehearse with an isolated database and preserve the existing owner link. The account
repair additionally requires reviewed `0001_account_usernames.sql` before rollout.
It creates one unique index only; first check for duplicate `lower(name)` values.
If duplicates exist, stop for owner review; never delete, rename or merge accounts
automatically. No leaguewide account migration is required for absent game scores.

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

Four real PostgreSQL smoke cases reuse existing pg/Vitest and the fixed
`127.0.0.1:55441/claim_team_test` guard. It covers a concurrent same-invite winner,
duplicate-email/username rollback, unclaimed account recovery without membership,
preserved existing UUID/hash, provider verification/login, stale ownership-proof
denial, a blocked simultaneous claim, replay/second-code denial, server-selected
recovery recipient, inactive-link denial and concurrent durable caps. Only its explicit CI step enables the fixture; ordinary
tests keep database opt-ins off and no application secret/reference enters CI.
It is a disposable synthetic database with no persistent volume. Local PostgreSQL
is unavailable; the normal CI step is the real-database check. No live mailbox,
Neon transport, backup/restore, hosted/browser or production activation is claimed.

Sources: [Better Auth Next](https://better-auth.com/docs/integrations/next),
[Drizzle adapter](https://better-auth.com/docs/adapters/drizzle),
[password lifecycle](https://better-auth.com/docs/authentication/email-password),
[Resend send email API](https://resend.com/docs/api-reference/emails/send-email).
