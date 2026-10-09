# AI Decides server handoff

Ownership: issue #112, Aidan's Dot. UI/page ownership is separate. This change
does not enable paid calls, apply a production migration, configure credentials or
deploy. The explicit CI job applies the AI schema only in a disposable test schema.

## Contract

The client-safe source of truth is `src/domain/ai-decider.ts`. A draft is either
`{kind:"custom",prompt,choices}` or `{kind:"matchup",teamIds:[id,id]}`. No client
identity, model, credential, header, URL, image, tool or provider payload is
accepted. Matchup mode can compare any two teams from a verified frozen weekly
input; it labels the result a hypothetical comparison. Custom mode has only the
user-supplied text and options, without live research or automatic league facts.

`POST /api/ai-decides` requires same-origin JSON and the current `gh_session`.
Success is `{status:"ready",result}`. Every returned option probability is
preserved numerically, independently of the chosen option and API confidence.
The server checks unit intervals, distinct exact choice coverage and distribution
sum within 0.0001; it never normalizes or fabricates a probability. Display may
round percentages, with a rounding note. Always show the model-estimate label.
Evidence strings are formatted from supplied data, not model-generated prose.

Failures distinguish `invalid` (400), `unauthenticated` (401), `unavailable`
(503), `rate_limited` (429), `busy` (409), `refused` (422), and `timeout` (504).
They return a stable `code`, safe `message`, and optional `retryAfterSeconds`.
They never return raw provider/database errors. Responses use `no-store`.

`GET /api/ai-decides` and `getAiDecidesData()` return `{availability,weekly}`.
Five known pairings render unavailable when no ready prediction exists. Failed
pairing fetches render unavailable without invented teams. Cached results retain
both team probabilities and snapshot metadata: input/prompt/model hash, model,
prompt version, capture/cutoff/week dates, scoring mode, prior stats season and
baseline version. No page read can call the provider or generate a pick.

## Provider boundary

The fixed integration follows the current [Decisions guide](https://developers.openai.com/api/docs/guides/decisions)
and [create reference](https://developers.openai.com/api/reference/resources/decisions/methods/create):
`POST https://api.openai.com/v1/decisions`, `gpt-6-luna`, text input and choice
questions. Decisions is a public beta. No Responses compatibility, tools or
generated explanation field is assumed. Refusal is its own answer variant.
The fixed instructions treat user text/choice descriptions as untrusted task
data. Opaque `c0`… choice values prevent labels becoming protocol fields.

Body: 8,192 streamed UTF-8 bytes, three-second read deadline. Prompt: 2,000
characters. Choices: 2–8 distinct labels, 120 characters each. Transport
redirects are rejected; response bodies are capped at 32 KiB. Provider deadline:
eight seconds, with both abort and a promise race. Data operations have bounded
deadlines. The route has a 60-second maximum duration.

Token admission uses serialized UTF-8 bytes plus 256 as a conservative upper
reservation, not a precise tokenizer estimate: 6,144 per interactive request,
20,000 per weekly batch. This launch adapter expects the documented non-generative
usage shape, including input cache details and output reasoning details, with
zero output/reasoning tokens. Cache detail counts are validated and never
subtracted from the charged input count. Unexpected usage/result shapes fail closed.
A reported input-token overrun charges the excess and disables the database
kill switch, even if probabilities or other output fields are malformed. Usage
validation runs independently of prediction decoding. Missing or invalid usage,
transport failures and timeouts return no result and retain the full reservation
and lease until expiry because provider work may already have occurred. A settled
retained lease has a durable completion marker; overlapping/repeated completion
cannot double-charge an overrun or add another signal. Bounded completion CAS
failure withholds the result and leaves the existing reservation in place. No
automatic retry issues a second paid request. Late output after timeout is ignored
and does not replace the committed unknown-spend reservation.

## Auth and abuse controls

Existing accounts have unique team ownership, bcrypt passwords, random 32-byte
session tokens, SHA-256 token hashes in Postgres, and 90-day httpOnly cookies.
AI lookup rejects malformed tokens, invalid identity/team IDs and expired
sessions. Budget reservation rechecks active session ownership in the same SQL
mutation. Anonymous visitors can build drafts; they cannot spend a budget.

The separately reviewed provider cutover uses the shared
`friendsAuthEnabled()` predicate (`FRIENDS_AUTH_ENABLED=1`). Its lazy server
verifier receives request headers and returns only validated app UUID, provider
subject, session ID and expiry to AI admission. A failed/missing provider
verification never falls back to the legacy cookie. The atomic budget update
rechecks the exact provider session and subject, unexpired session, active
account link, same app UUID, verified email and valid team. The unchanged UUID
budget key preserves spending across the switch. Session IDs/subjects/tokens
are absent from provider payloads and budget state. Without the cutover flag,
the current hashed legacy-session path stays active. No AI schema or counter
reset is required; provider schema/configuration and activation belong to the
auth/release owners.

The existing login action has no dedicated brute-force guard; persistence/reset
work is deferred. An authenticated account is not proof against abuse. These
independent launch limits constrain a compromised or automated account:

| Guard | Launch value |
| --- | --- |
| Per user | 5/hour, 20/UTC day |
| Entire league | 100 requests/UTC day, 100,000 reserved input tokens/UTC day |
| In flight | 2 globally, 1 per user |
| Duplicate | 10 minutes; weekly batch fingerprints dedupe across users |
| Lease | 60 seconds; timeout leases remain until expiry |
| Failure/refusal signals | 3 in the current hour pauses new runs |
| Excessive denials | 10 in the current hour pauses new runs |

One existing-Postgres singleton row holds bounded counters, hashed fingerprints
and leases. Atomic revision CAS protects overlapping serverless instances; no
production in-memory limiter exists. CAS retries are bounded, then fail closed.
Missing tables/control row, corrupt state, revoked identity or unavailable data
cannot permit a paid call. The kill switch is checked at admission. Existing
in-flight calls may finish after it is switched off.

No raw IP, prompt, choice, password, session token or provider key is stored in
the limiter or logged by default. Signal/denial counters reset with the hour;
inactive user counters expire after seven days. Fingerprints/leases expire after
their short windows. Expired entries compact on the next reservation, so idle
systems may physically retain expired entries longer. Storage stays bounded by
ten accounts, two leases and at most 100 fingerprints. Immutable weekly facts
and outcomes are retained for season review; they contain no custom user prompt.

## Weekly operation

The explicit server seams are `loadAiWeeklyInput(preparation, deps)` and
`generateWeeklyPicks(input, sessionToken, runtime)`. There is no public generation
endpoint and no new scheduler. An operator must separately coordinate the
pre-week runner and secure session acquisition; never pass a token in a command
argument, issue, chat or log. The caller uses a validated manager session and the
same durable spending controls. The loader fetches only league meta/state,
rosters, one matchup week and one completed season of raw stats. It never loads
the full player directory or touches valuation caches/repair tables.

Preparation supplies reviewed UTC cutoff/week bounds and an explicitly confirmed
mode. The loader owns capture/source-read timestamps. It never maps raw
`game_mode=1` to a product rule. Current unknown mode/preseason remain unavailable.
Game Pick remains unsupported until its rules and schedule source are verified.
Globally unsupported inputs (including preseason and unknown mode) return before
sealing the week, so corrected ready inputs can still be submitted before cutoff.
An empty slate with no eligible matchups also remains unsealed. An intentionally
partial eligible slate remains immutable once sealed.
The accepted Lock-In starter shape is PG, SG, G, SF, PF, F, C, UTIL ×3. Missing,
duplicate, zero, reserve/taxi or unowned starters and absent prior production
block their pair. Missing reserve/taxi fields cannot establish eligibility.

The experimental baseline sums the ten starters' completed-prior-season fantasy
PPG under supplied league scoring. It is not a weekly score forecast. It never
multiplies PPG by games. Current injuries, schedules and recent form are unknown
and labeled as such. No known result/post-cutoff/current-full-season evidence is
included. Five choice questions share one frozen input batch; unavailable pairs
remain explicitly unavailable. The prompt, input and model enter the snapshot
hash, so an instruction/model change gives new generation a different identity
even if a version bump was missed. Historical reads retain their frozen manifest.

The first sealed snapshot wins its league/season/week key. Prepared facts,
baseline, input and successful/refused results cannot be replaced. An interrupted
attempt may retry only against the same snapshot and after the duplicate guard;
successful slates are returned from storage without another call. Partial slate
status is unavailable while valid individual picks remain visible. Ended weeks
are labeled stale. Outcomes are separately append-only, require confirmed final
scores after the week ends, and never alter a prediction or baseline.

The frozen generation manifest stores schema version, model, prompt version, full
instructions and baseline version. Its canonical content and input enter the hash;
the production-unapplied schema also protects the manifest from updates/deletion. Cache reads
and outcome recording validate model/prompt metadata against that manifest, not
today's generation constants. Schema/baseline v1 reconstruction remains supported
for older policy records; future schema/baseline changes must retain that decoder.
New generation always uses the current fixed policy. Interactive comparisons refuse
an older-policy snapshot while its immutable cached predictions remain readable.
No observed outcome enters the input or generation manifest.

## Disposable PostgreSQL verification

The additive `AI Decides disposable PostgreSQL` job in `.github/workflows/ci.yml`
uses an official `postgres:16.15-alpine` service, following the
[GitHub service-container pattern](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).
It has an eight-minute timeout, one CPU, 768 MiB memory, 128 PIDs and a bounded
temporary data filesystem. Only runner loopback port 55447 is published. The
database name/user/password are fixed synthetic test fixtures; no secret or
application `DATABASE_URL` is used. Fetch is blocked and the socket guard permits
only that numeric loopback endpoint after all three explicit CI flags match.
Local Docker access is unavailable; this job does not retry that socket or change
host permissions. The ordinary offline suite never collects the integration file.

The explicit command is `npx --no-install vitest run --config vitest.ai-postgres.config.mts`.
The suite verifies an empty public schema, creates only its generated test schema,
executes the exact `migrations/ai-decider.sql`, and checks disabled-by-default state.
It executes production `PostgresAiPersistence` parameterized Drizzle SQL through a
native `pg` transport. Real overlapping admission/completion, bounded CAS retries,
session expiry/revocation, global/user budgets, lock failure, malformed output and
usage accounting are exercised with a mock provider and deterministic clock.
Competing snapshot/result/outcome writes and immutable/append-only triggers run
on PostgreSQL, including frozen historical prompt/model reads and no outcome leakage.

The job logs the tested PR/merge commit, source tree, PostgreSQL version and
migration SHA-256. Teardown drops only the owned generated schema, confirms it is
absent and closes the pool. GitHub removes the service container even when a step
fails; no persistent volume exists. This verifies real PostgreSQL behavior while
the deployed Neon HTTP transport and beta provider remain separate activation gates.
Only a successful exact-head CI run confirms this database gate has passed.

## Activation after review

`migrations/ai-decider.sql` remains an additive reviewed file for production. No existing auth,
stock, repair or production snapshot table is changed. Its initial database kill
switch is false. It is not registered in an automatic migration/build command.
Do not enable calls before independent migration/atomicity review and normal CI.
The dedicated CI job exercises the migration and real overlap/trigger behavior
against disposable PostgreSQL only. It does not authorize production provisioning.

When review and UI integration are ready, Aidan can enter `OPENAI_API_KEY`
directly in the authorized Vercel project's **Environment Variables**, scoped to
the intended server deployment. Never use a `NEXT_PUBLIC_` prefix or paste the
value into chat/repo/logs. Existing `DATABASE_URL` is reused; no new paid service
is required. `GOAT_AI_DECIDES_ENABLED=true` is a second, separate activation
gate; the database `ai_decider_control.enabled` must also be true after separately
approved provisioning. Both gates stay off here. To stop new calls immediately,
disable the database control row; an environment change takes effect on its
deployment's runtime. Do not reset counters to bypass budgets.

No key or live call was tested. End-to-end provider validation, current source
readiness, reviewed week dates/mode, scheduler integration, UI integration and
independent merge/deployment remain outstanding. Auth reset/persistence overhaul
is outside this feature.

## Complexity decision

Boundary: ten friends, one monolith and existing Postgres, launch horizon.
Confirmed essential work is two-choice/custom classification, cached weekly
results, evidence provenance and independent spend/abuse bounds. Imported work
is beta Decisions protocol, serverless overlap, current auth and incomplete
Sleeper facts. The singleton CAS concentrates the existing DB coordination cost
and is adequate at this scale. A separate limiter service or generic AI framework
would add accidental complexity without a required outcome. The baseline is a
transitional experiment owned by #112; revisit after separately recorded outcomes
support calibration. Scoring mode, schedules and provider integration are unknowns
with explicit activation gates. No new infrastructure or auth rewrite is needed
to review this feature.
