# Reconcile-only authentication — default-off source prerequisite

This independent lane is based on PR228 `dc1cdb4`; neither PR228 nor PR231 is
changed. It replaces the reconcile endpoint's commissioner credential with one
dedicated credential and an explicit short-lived authorization window. It creates
no credential, settings, database objects, schedule or production writes.
Independent security review and genuine exact-head Dot/Muse agreement are still
required before later credential/configuration or release authorization.

## Server contract

The endpoint remains `POST /api/arcade/competition/reconcile`, with no query,
fragment, alternate path or body bytes. Public reads do not reconcile. Required
server settings (names only; no values were read or configured):

- `GOAT_ARCADE_RECONCILE_ENABLED` must be exactly `1`; otherwise disabled503
  before reading token/window settings or touching runtime/source/database.
- `GOAT_ARCADE_RECONCILE_TOKEN` must be exactly 64 lowercase hexadecimal
  characters, representing a separately approved independent 32-byte random token.
  Validation checks shape, not entropy; future creation must use a private
  cryptographic generator. It must not be copied from any existing credential.
- `GOAT_ARCADE_RECONCILE_NOT_BEFORE` and
  `GOAT_ARCADE_RECONCILE_EXPIRES_AT` must be canonical `YYYY-MM-DDTHH:mm:ssZ`
  instants, valid real dates, ordered and at most seven days apart. No offsets,
  fractional seconds, implicit defaults, rolling renewal or unbounded lifetime.
  Start is inclusive; expiry is exclusive. The proposed initial window remains
  October 20,18:50 UTC through October 27,04:00 UTC,2026; it is not installed.

Missing/invalid required settings hold503. Missing/wrong bearer or access outside
the configured window returns unauthorized401. Exact canonical `Bearer` input is
compared in constant time at a fixed length. The gate never reads commissioner
or cron settings and returns no token in its authorization result or response.
Existing commissioner actions and AI cron keep their own independent credentials.
The dedicated token does not authenticate them, provide a personal account,
select evidence/dates, grant arbitrary SQL, write a game score or pay a prize.
Reconciliation itself may publish configured periods/receipts and seal archives.

Body verification rejects nonzero content length, any bytes (including after an
empty chunk), eight unfinished empty chunks, read errors, used/locked
bodies and streams unfinished after one second. Cancellation is not awaited, so
a hostile cancellation promise cannot hold the handler indefinitely. Wrong
method is405; malformed empty-command shape is400. No JSON is parsed.

The window is rechecked after asynchronous body/archive/publisher work. The
public handler always passes the validated window to the canonical store. Its
transaction checks the database clock after the advisory lock and at a final
SQL authorization checkpoint immediately before returning to the driver's
COMMIT. Expiry observed at either SQL check aborts and rolls back all period,
receipt, snapshot and finalization changes in that transaction.

This is an authorization cutoff, not a hard completion deadline. A transaction
that passes the final SQL authorization check may COMMIT and return a successful
response after expiry. Deferred constraints, durability and acknowledgement run
after that check. A response-time expiry check cannot roll back committed writes
and would misreport their outcome. Existing internal store tests may omit the
optional authorization window; that is not an exposed credential/HTTP path.
Source/calendar/score/finality rules are unchanged. Missing config or verified
publisher evidence never becomes permission to proceed.

## Separate operational proposal

`docs/examples/arcade-reconcile-worker.yml.example` is outside
`.github/workflows` and cannot install a schedule. It contains only proposed
names/window/script, no credential. A future reviewed installation would use a
dedicated main-restricted `arcade-production` Actions environment, the dedicated
token secret, `permissions: {}`, no checkout/dependencies/artifacts, concurrency1,
two-minute job bound and one HTTPS POST every five minutes off the hour. It
would be default-off behind `GOAT_ARCADE_WORKER_ENABLED` and confined to the
same explicit client/server authorization window. The client checks before
dispatch; its curl timeout and the Actions job timeout do not guarantee server
rollback or completion before expiry. It is syntax-checked, not enabled.

The saved estimate is at most 288 scheduled endpoint/database invocations/day
and approximately 110 MB/day publisher downloads near Week1's end, plus game
traffic/storage. Public standard-hosted Actions minutes are free; existing
Vercel/Neon quotas/charges still apply. The example cadence is not a server-side
rate/spend limit. There is no paid upgrade, new service or paid model call.
Scheduling can be delayed/dropped; ten-minute stale source still blocks play.

Future action-time approval must separately cover private token creation and
placement in Vercel Production/the restricted Actions environment, required
nonsecret settings, approved code/configuration deployment, database/calendar
preflight/publication, first write and any scheduler installation/enablement.
The proposed approval scope must explicitly permit the complete transaction to
COMMIT/respond after expiry when its final SQL authorization check passed before
expiry. No activation package has been approved; this clarification changes no
approved guarantee. Genuine Muse review must assess this limitation together
with the independent review of the exact source head before any later proposal
can be considered ready for action-time approval.
No existing narrow token/OIDC trust mechanism was verified or reused.
Revocation requires disabling the worker and runtime flag/removing the token
with deployment, then deleting both secret placements; retain all game data.
Expiry denies subsequent time checks. Runtime flag/token revocation denies new
requests once the configuration/deployment takes effect; an in-flight request
retains its validated window. Neither retroactively cancels an admitted COMMIT.
A client timeout or lost
response leaves the outcome uncertain; inspect retained state before deciding
whether a retry is needed. Expiry cannot be silently renewed by the worker.

Automatic moved-date recovery is still unimplemented; a fixture missing from
its immutable original date stays held pending a reviewed exact-event lookup.
Real later-game adapters/model/client/calendar/continuing automation are also
unfinished. This security slice does not claim launch readiness or complete
weekly rollover. No denied release action is retried.

## Verification boundaries

Pure window/gate tests and mounted request tests use fixed synthetic tokens and
clocks, never production credentials. Actual commissioner actions and the
mounted AI cron reject the dedicated token before their protected work. A valid
dedicated-token POST is exercised against real disposable PostgreSQL. Queued
advisory-lock expiry and expiry before the final SQL check prove transaction
rollback. A synthetic deferred constraint trigger holds COMMIT past expiry:
the mounted endpoint returns200/ready, the receipt/final persist, and a new
post-expiry request returns401 without protected work. That trigger exists only
in the disposable test schema; no production trigger or incident is claimed.
The existing local-only schema guard, synthetic publisher and
fixed127.0.0.1:55441 / claim_team_test fixture remain in force. No production
database/source operation is needed for these checks. UI/physics are unchanged.
