# Ranked choice-game backend — disabled integration slice

This follow-up stacks on PR228's passing `2cf9a6a` without changing that branch.
It provides SQL persistence and mounted HTTP commands, not a production 82–0
model, quote adapter or ranked game UI. Both source/game adapters remain Muse's
lane (#198 and #185). The production registry is empty. No enablement, production
DB action, scheduler, credential, reward, prize or deployment is included.

## Server adapter contract

`ChoiceAdapter` specifies one game (`week-2-preview` or `priced-in`), a reviewed
SHA-256 scoring format, and mandatory explicit policy: duration (1s–30min),
attempt cap per canonical period (positive bounded integer or unlimited/null),
and source age at admission. No shooting defaults are inherited. The format must
change whenever model, points, duration or source-basis semantics change enough
to make scores incompatible; content hashes identify particular source snapshots,
not score compatibility. The core hashes policy separately into frozen rules.

`issue()` returns exactly five frozen teams/pools or quote rounds, with source
identity, explicit season, observation time, source/model version and content
hash. This is shape verification, not independent proof a source is real. Actual
adapters require reviewed provenance/coverage and per-game policy agreement.
Only already-produced real quote snapshots may supply Priced In; routes must
never invoke the market/pricing/snapshot-write loader. There are no paid calls.
The 82–0 source/model must be jointly agreed before its adapter exists.

`assess()` is synchronous deterministic server code without I/O. It receives the
frozen manifest and five validated locked choices. A scored result must match its
game, format and source hash; W+L=82, score=W, or 0–750 price points consistent
with 0–5 correct calls. The core verifies shape/bounds/provenance, while Muse's
grader owns the actual agreed algorithm. Tests inject clearly synthetic graders;
they are not evidence of a real production model or quote feed. Missing coverage
returns explicit `unscored`, never zero/weak/invented production.

## HTTP commands and ownership

All responses are private/no-store. Existing verified personal sessions are
revalidated in SQL; client identities, totals, prices, manifests and policies
are never accepted. Writes require exact configured Origin, bounded JSON and an
existing auth request budget. Run identifiers are UUIDs; cross-account/game
reads and writes return not-found. Serverless transactions explicitly use READ
COMMITTED with period -> account/session -> run locking.

- `POST /api/arcade/ranked/runs?gameId=priced-in` with `{}` issues or recovers
  the account's open run. Use `week-2-preview` for the draft adapter.
- `POST /api/arcade/ranked/choices?gameId=...&runId=...` with
  `{"index":0,"input":{"call":"over"}}`, or draft input
  `{"teamId":"1","playerId":"123"}`, locks one current step. Indices are 0–4.
- `GET /api/arcade/ranked/runs?gameId=...&runId=...` restores only the owner.
  Recovery remains available after closure/expiry or current-adapter removal
  while this feature's explicit enable gate and personal auth remain enabled.

Responses expose locked inputs, current public step, public basis, timestamps,
and completion. Future teams and all unchosen price answers remain private.
Only accepted quote steps reveal their frozen answer. These are input-integrity
guarantees, not proof a user cannot research publicly available quote answers.
Client game UI/transport integration is still needed and is not silently enabled.

Identical step retries return stored state and never regrade; conflicting history
returns conflict. Fifth-choice + result insertion + terminal run state are one
transaction. Failure rolls all three back. Unscored completion is terminal and
absent from rankings; a later model version cannot silently rewrite it. Expired
and unfinished sealed-period runs release admission. Attempts count admissions,
including expired/unscored ones, across rule changes within the same period.

## Periods, boards and automation boundaries

Choice calendar entries require explicit `formatVersion`. The generic finalizer
publishes only the supported prefix and never skips an unsupported predecessor.
Per-game handlers freeze best valid result per account, current league eligibility
and stable score ordering in the same canonical finalization transaction. Ties:
score descending, server acceptance ascending, immutable result UUID ascending.
Missing/postponed/stale/conflicting finality holds play and sealing, just as PR228.
No game route or public read advances time or declares an NBA event final.

Weekly board dispatch follows the canonical current game. All-time is isolated
by game and compatible format; immutable history resolves by period ID and uses
frozen eligibility/version, even after current policy/adapter changes. Public
metrics are distinct: Free Throw makes, modeled entertainment W–L, price points.
Global board reads expose only usernames, scores/metrics and eligibility-derived
team IDs. No account subjects, private manifests, inputs or future prices leak.

The new additive proposal `migrations/ranked-choice.sql` creates
`arcade_choice_runs`, `arcade_choice_results`, `arcade_choice_weekly_results` and
immutability guards. It depends on PR228's reviewed schema and changes no existing
table or data. Its application remains separately held.

The complete later-week goal is still unfinished: Muse's source receipts and
agreed graders; explicit per-game policy/format; game clients connected to these
commands; reviewed sourced assignments; moved-date recovery; and separately
reviewed reconcile-only worker authentication/cadence/installation. Week2's49
event receipts do not themselves publish or enable a ranked draft period.
New York midnight remains the implementation convention selected under delegated
judgment. Week1-only operation is not completion of automated later weeks.
