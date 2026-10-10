# AI Decides server handoff

Ownership: issue #112, Aidan's Dot. UI/page ownership is separate. This change
does not enable paid calls, apply a production migration, configure credentials or
deploy. The explicit CI job applies the AI schema only in a disposable test schema.

## Contract

The client-safe source of truth is `src/domain/ai-decider.ts`. A draft is either
`{kind:"custom",prompt,choices}`, `{kind:"matchup",teamIds:[id,id]}`, or
`{kind:"league",prompt,choices:[name,name],teamIds:[id,id]}`. No client
identity, model, credential, header, URL, image, tool or provider payload is
accepted. Matchup mode can compare any two teams from a verified frozen weekly
input; it labels the result a hypothetical comparison. Custom mode has only the
user-supplied text and options, without live research or automatic league facts.

The explicit league variant maps choice index to roster-ID index. Exactly two
distinct choices/IDs are required. The server verifies current canonical
team names (trim, NFKC, en-US lowercase exact match); aliases/substrings are not
resolved. Duplicate canonical names, missing owners/rosters or invalid source
facts fail closed; mismatched/stale choice labels return
`invalid/league_choices_changed`. Source failures return
`unavailable/league_context_unavailable`, before any provider reservation.
Client-provided roster/stat data is rejected by the request allowlist.

Only after existing validated identity does this path call the injected
`loadAiLeagueRosterContext` loader. It reuses existing Sleeper league, user,
roster, player-directory and season-stat caches; the directory is needed
only for this deliberate identity drill-down, never page/home/cache reads.
Only the two selected complete rosters (at most thirty players each), canonical
player names/ages/positions, membership arrays and observed current/prior
fantasy PPG/games under actual league scoring reach the model. A missing weighted
stat or unknown identity/age remains null; no zero or projection is invented.
Current regular-season stats are not fetched in preseason. Optional stat failure
is explicitly unavailable; absence of all player names on either roster blocks
the decision. Raw owner IDs, team scores/outcomes, unrelated teams/players,
injury data and projected future statistics are excluded.

Every successful league result keeps the supplied choice labels and uses
`goat-league-roster-v1`, `snapshot:null`, plus server-owned `leagueContext`
metadata and factual evidence. Its hash describes the on-demand roster projection,
not an immutable weekly record. Capture time means retrieval, never source update
time (`sourceUpdatedAt:null`). `cacheRevalidateSeconds` reports the existing
five-minute league/roster/player and daily stat intervals; failed refreshes may
serve older last-good data, so these are not freshness guarantees.
Per-team metadata reports roster/name/stat coverage and known membership arrays.
Long-term development, contracts, draft picks, injuries, schedules and selection
rules remain unknown; this is not a verified long-term projection.

The existing 6,144 input reservation limit still applies to question plus full
context. Oversized evidence returns `invalid/input_limit` without truncation,
spend or a provider call. No new persistence, weekly-snapshot change, migration,
auth behavior, spending limit or log payload is introduced. Frontend-owned
recognition must show context explicitly; unrelated custom decisions stay text-only.

`POST /api/ai-decides` requires same-origin JSON and the current server-selected
validated session (provider or legacy).
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

Ordinary signed-in calls have no hourly/daily account quota or completed-request
cooldown. Validated identity, bounded inputs and the shared spending/concurrency
guards still apply:

| Guard | Launch value |
| --- | --- |
| Account burst | 20 accepted requests per stable app UUID in a rolling 60 seconds |
| Entire league | 100,000 reserved input tokens/UTC day; no request-count ceiling |
| In flight | 2 globally, 1 per user |
| Duplicate | Active leases only; shared weekly fingerprints dedupe across users |
| Lease | 60 seconds; timeout leases remain until expiry |
| Failure/refusal signals and denials | Minimal diagnostic counters; no account pause |

Completed requests can run again immediately. An attempt after twenty accepted
requests in a rolling minute is blocked by the burst guard, returning
`rate_limited/minute_burst` (429) with the remaining seconds until the oldest
accepted timestamp expires. Denied attempts never extend the window or charge
tokens. Each account retains at most twenty accepted timestamps; legacy/provider
sessions and the configured weekly operator share the same stable app UUID.
Existing counter records without this optional field remain valid and start
recording new admissions without clearing any earlier counters or weekly facts.
The rolling window crosses UTC hours/days without resetting.

An exhausted shared token budget returns `rate_limited/global_token_budget`
(429), with `retryAfterSeconds`/`Retry-After` equal to the remaining seconds until
00:00 UTC. Active identical reservations return `busy/duplicate` (409); other
concurrency blocks return `busy/busy` (409). Their wait is the remaining active
lease lifetime (at most 60 seconds), and known completions release the lease
immediately. Unknown spend retains its reservation until expiry. Every admitted
call retains its full conservative charge; there are no refunds or budget resets
on a policy release. Provider-reported overruns add the excess and disable new calls.

One existing-Postgres singleton row holds bounded counters, hashed fingerprints
and leases. Atomic revision CAS protects overlapping serverless instances; no
production in-memory limiter exists. CAS retries are bounded, then fail closed.
Missing tables/control row, corrupt state, revoked identity or unavailable data
cannot permit a paid call. The kill switch is checked at admission. Existing
in-flight calls may finish after it is switched off.

No raw IP, prompt, choice, password, session token or provider key is stored in
the limiter or logged by default. Signal/denial counters reset with the hour;
inactive user counters expire after seven days. Leases expire after 60 seconds.
Legacy completed-fingerprint entries remain valid state, expire normally and
no longer block calls; new reservations do not add them. Expired entries compact
on the next reservation, so idle
systems may physically retain expired entries longer. Storage stays bounded by
twenty retained app-UUID counter records, two leases and at most 100 fingerprints.
This allows one complete ten-account rotation without removing unexpired old
counters or blocking ten fresh league identities. It changes storage capacity,
not membership: atomic admission still requires a current linked, verified
account with a valid league team in provider mode. Retired identities gain no
authority from retained counters. More than one complete account rotation within
the seven-day retention period needs coordinated capacity review; overflow and
corrupt state still fail closed. Immutable weekly facts
and outcomes are retained for season review; they contain no custom user prompt.

The fixed server provider client emits one JSON `goat_ai_decisions_provider_receipt`
event after an upstream HTTP response completes or fails to decode. It records
only the upstream `x-request-id` (1–128 ASCII letters/digits/underscore/hyphen),
HTTP status, exact returned `gpt-6-luna` model when valid, independently validated
input/output/total usage, and server `receivedAt` timestamp. Missing/invalid
metadata is null. No HTTP response means no fabricated receipt. Receipt failures
cannot change the paid result or budget settlement. Existing platform log retention
applies; no new logging service or database retention is introduced.

Receipts contain no prompts, choices, outputs, provider errors, credentials,
authorization headers, session metadata or internal user/lease/snapshot IDs.
They apply to future responses only and cannot establish provenance for earlier
requests or explain a historical provider-dashboard request count.

## Weekly publication and previews

The public page/homepage and `GET /api/ai-decides` remain read-only cache consumers.
`POST /api/ai-decides/weekly` is an explicit same-origin manager operation with
JSON `{}` and the existing validated session. Clients supply no facts, dates,
mode, prompt, provider URL or identity. A ready response is
`{ status: "ready", weekly: AiWeeklySlate }`, with all five rows ready; failures
use the existing failure shape. The separately owned surface provides a manual
Publish weekly previews control. No render or automatic client effect invokes it.

`loadAiPublicationContext` verifies the fixed league, NBA phase/season, fresh
integer leg, prior stats season and season-start source date. Preseason leg0
prepares week1 even when the unrelated display week is2. During the regular
season it prepares leg+1, before that matchup week. `loadAiLineupPreview` fetches
only league/state, rosters, that one week and completed prior-season raw stats.
It strips BN from the starter slot declaration, uses week-specific starters,
checks roster ownership plus explicit reserve/taxi fields, and freezes the actual
source-read time. No player directory, current scores, valuation cache or repair
table enters the input. Missing/duplicate/zero/IR/taxi/unowned starters block
publication. All five pairs must be supported before the runner seals a week.

The current explicit preview policy is `goat-lineup-preview-v2`, manifest schema2,
model `gpt-6-luna`, baseline `prior-observed-starter-ppg-v2`. It requires a complete
eligible ten-starter lineup and observed prior production for at least8 starters
per team. Missing production remains null and its coverage is displayed; it is
never replaced with zero. The separate baseline is the mean of observed starter
fantasy PPG under actual league scoring. It is neither a ten-starter total nor a
weekly score forecast. The model sees individual observed production, games and
unknowns, and the prompt directs it to consider coverage and uncertainty.
Schedules, current injuries, recent form, lineup changes and game-selection
choices remain unknown. No game-count multiplier or inferred selection strategy
is used. Raw `game_mode=1` is preserved as source evidence but never mapped to a
named mode; `scoringMode` remains unknown pending authoritative confirmation.
[Sleeper's Lock-In rules](https://support.sleeper.com/en/articles/6522833-lock-in-mode-details)
and [Game Pick rules](https://support.sleeper.com/en/articles/4701537-game-pick-details)
establish different selection mechanics, not a public numeric-code mapping.

Snapshot metadata adds optional `comparison` (`preseason_lineup_preview` or
`weekly_lineup_preview`) and `sourceLeg` (integer0–29). Capture/cutoff remain ISO
strings; startsAt/endsAt now allow null. For preseason, startsAt is the conservative
publication closure at00:00UTC on Sleeper's season_start_date, cutoffAt is one
millisecond earlier, and endsAt is null because no fantasy-week end calendar has
been verified. For regular previews both period dates are null; cutoffAt is the
source-read evidence cutoff and sourceLeg<week establishes pre-week preparation.
A fresh, uncached phase/season/leg check occurs before paid work and after the
model completes. An advanced/unavailable source boundary withholds publication
while retaining the usage count. Cached previews remain readable during their
actual target leg and become stale once a later source leg is observed.
These fields are not invented matchup start/end times.

Five choice questions share one frozen input batch. Input, instructions, model,
prompt/baseline versions and provenance enter its hash. The first snapshot and
successful/refused results are immutable. A cache lookup precedes stats loading
and paid calls, so repeated successful publications are free reads. An existing
incomplete attempt returns `publication_incomplete`; the daily runner never
retries it even after the active lease expires. Operator review must
coordinate any bounded retry against the same sealed snapshot through the
existing server seam. Invalid/unsupported/oversized preparation remains unsealed.
Partial/refused completed batches remain immutable and return
`publication_partial`; individual saved rows remain visible on the public read.
No outcome is fed back into a prompt. Preview outcome recording refuses an
unverified calendar/finality; the existing append-only reviewed-calendar v1
outcome path is preserved.

The older `loadAiWeeklyInput`/`generateWeeklyPicks` reviewed-calendar Lock-In path
and its schema1 `goat-weekly-lock-in-v1`/`prior-starter-ppg-v1` reconstruction stay
supported. That path still requires confirmed Lock-In, regular-season dates and
all ten prior-production values. Historical reads validate the frozen manifest,
not today's policy constants. Existing immutable records are never upgraded.

## Protected daily refresh handoff

`vercel.json` declares one daily `09:00UTC` invocation of
`GET /api/ai-decides/weekly`, compatible with the existing free-tier cadence.
[Vercel's cron rules](https://vercel.com/docs/cron-jobs/usage-and-pricing) permit
once-daily Hobby execution with an hour-wide timing window. The function checks
sources for the upcoming leg and existing immutable rows; it is not a per-visit
model call and does not assume exact cron delivery. Existing durable CAS budgets,
shared weekly fingerprints, two global leases and the60-second lease bound still
apply across scheduled/manual overlap. There is no new service, queue or limiter.

Aidan/root must privately set **CRON_SECRET** (32–256 non-whitespace characters)
and **GOAT_AI_WEEKLY_USER_ID** (one existing manager's persistent SiteUser UUID)
in the intended server environment after source review. Neither setting is
created/read/transmitted by this source task. Never use NEXT_PUBLIC prefixes.
[Vercel supplies the bearer header](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
for the configured secret; the server compares its digest in constant time.
Unauthenticated or query-bearing requests fail before source reads or paid work.
Missing scheduler secret/app UUID leaves the scheduler unavailable; manual
same-origin publication can establish this week's rows using current authorized
configuration without either new scheduler setting.

The job is a purpose-specific server identity tied to the configured app UUID,
not an expiring personal browser session or a fake manager. Its initial check and
atomic budget mutation both require the exact configured UUID/auth mode and valid
league membership. With FRIENDS_AUTH_ENABLED exactly1, both also require an active
one-to-one account mapping and verified provider account; failure never uses the
legacy branch. Interactive/manual calls retain the existing exact session CAS.
The per-user counter key is the same stable UUID for all paths, preserving limits
through auth cutover. No session/hash/token/key is persisted in budget state.
After an account reset creates new app UUIDs, the configured weekly principal
must be reviewed after the owner reclaims their team. The retired principal is
not reused: new paid weekly admission waits for the newly claimed app UUID's
active provider link, verified email and valid team, then an explicit private
setting/release update by root. Cached public weeks remain readable throughout.
Missing/corrupt/disabled controls and membership failures fail closed. A budget
or provider failure never resets or refunds counters. Both feature gates and the
kill switch continue to govern the job. No authentication runtime, schema,
production setting, credential or counter was changed in this source task.

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
approved provisioning. This source change does not alter either gate. To stop new calls immediately,
disable the database control row; an environment change takes effect on its
deployment's runtime. Do not reset counters to bypass budgets.

The original offline feature task did not call the provider. A later authorized
activation/smoke and usage-parser correction were independently coordinated;
this publication source change makes no paid calls or live setting changes.
Root owns the final saved-five-picks and custom-result verification after review,
plus private scheduler setup. Named league mode and full schedule evidence remain
explicit limitations of lineup previews. Auth cutover/reset is outside this task.

## One-time Week 1 replacement

Issue #165 separately owns the explicit rerun request. The production source is
default-off: only server setting `GOAT_AI_WEEK1_REFRESH_ENABLED=1` enables this
path, independent of the existing key, feature/control gates and spending caps.
`POST /api/ai-decides/weekly/refresh` accepts only same-origin empty JSON (1,024
streamed bytes) from a currently validated manager session. It accepts no week,
identity, dates, prompt, evidence, credential or provider settings. Cron and
normal publication never start this replacement. The only supported target is
Sleeper league 1387473752807190528, 2026/week1 while phase is preseason/leg0.
The rerun route explicitly sets `fetchCache="force-no-store"` so its league,
roster, matchup and prior-stat reads bypass Next's persistent source caches.
Normal publication/cache helpers are unchanged. Tests execute the installed
Next fetch implementation with a synthetic stored response for both300/86400
second helper intervals; no real upstream call occurs. `capturedAt` records
retrieval time, not a verified source update timestamp.

The reviewed original hash is fixed in `refresh-policy.ts`. Its immutable
`ai_decider_weeks` row remains the complete archive, including input, manifest,
prepared baseline and all original results. A second row at
`1387473752807190528:2026:1:refresh:1` seals the new complete evidence. An atomic
INSERT checks the original, no outcomes, enabled control and current session
membership; only its winner can enter the unchanged paid CAS evaluator. The
claim is never removed or retried, including budget denial, refusal, timeout or
unknown spend. No reset or migration is required.

Public reads keep the original throughout pending/failed work. Completion checks
all five validated distributions, unchanged evidence/snapshot, fresh source
window, active session and control again before storing one immutable result.
Only that complete replacement becomes public while the flag is enabled.
The selected complete public snapshot is read once; a SQL existence check
validates the archived original hash without returning its duplicate full input.
Removing the flag and using the ordinary reviewed deployment restores the
original, leaving both complete histories available. No result or trigger is
rewritten or deleted. `AiDecidesData.week1Refresh` is optional and reports
available/sealed/published/unavailable for an explicitly owned manager control;
`AiWeeklyPublishResponse` remains the run response type. Sealed failures require
review, not an automatic paid retry.

Release handoff: independent exact-head source review, normal CI including the
existing disposable PostgreSQL job, and compatible explicit manager UI must pass
before setting activation. Then exactly one supported genuine manager click may
run the requested batch. Do not extract session tokens, impersonate an account,
read/export credentials, change scheduler settings or reset counters. No paid
implementation calls or live settings/data changes occurred in this source task.

## Complexity decision

Boundary: ten friends, one monolith and existing Postgres, launch horizon.
Confirmed essential work is two-choice/custom classification, cached weekly
results, evidence provenance and independent spend/abuse bounds. Imported work
is beta Decisions protocol, serverless overlap, current auth and incomplete
Sleeper facts. The singleton CAS concentrates the existing DB coordination cost
and is adequate at this scale. A separate limiter service or generic AI framework
would add accidental complexity without a required outcome. Issue #149 adds the missing weekly caller and BN normalization, removing accidental
readiness/publication gaps. The two frozen baseline decoders and explicit preview
coverage are transitional complexity; verified mode/calendar/schedule and later
outcome calibration remain unknowns. One purpose-built runner reuses the existing
store and paid guards. No generic framework, new infrastructure or auth rewrite
is needed to review this feature.
For the one-shot replacement, retaining the original, admitting one paid attempt
and publishing all five together are essential. The existing immutable row and
serverless overlap are imported constraints. An extra archive service, mutable
history or migration would add accidental complexity: one additional protected
row suffices. The default-off setting is a bounded transitional control owned by
root; keeping the flag enabled retains the replacement as public, while disabling
it restores the original. The sealed attempt prevents more paid reruns. Manager UI and
supported session readiness remain separate release checks. Neither future
recurring refreshes nor arbitrary-week revisions are part of this implementation.
