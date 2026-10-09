# Prepared draft PR (public publication authorized)

Title: Preserve account identity and define bounded competition foundations

Base: main. Head branch: dot/friends-account-foundations. Draft: true.
Ownership: #118. **FIX IN PROGRESS, HOLD MERGE.**

## What this PR does

Account credential replacement must keep existing score/reward ownership and
AI budget IDs. Adds a dormant provider-to-app identity resolver and read-only
owner reconciliation, plus server-owned run validation and capped cosmetic
award candidates. It also supplies a concrete Better Auth invitation/recovery
architecture and a recoverable legacy credential/session reset plan.

Current auth, cookie, database schema, game writers, AI backend and practice
experience are unchanged. No provider dependency, active signup/reset flow,
competition route, replay store or reward issuance is installed by this patch.
Atomic run consumption/score insertion and award caps remain real-Postgres
integration gates. No FAAB credits or monetary prizes.

## Checklist

- [ ] Local production build: not run; no production runtime imports new modules
- [x] Full TypeScript: pass
- [ ] Preview / remote CI: normal required workflow after draft publication
- [x] Repo conventions; domain/data seams, injected reader/replay, scoped architecture addition
- [x] No real secrets/passwords/codes/tokens or production inventory in source/logs
- [x] No destructive changes or applied migrations

## Vercel / DB needs

None for this dormant foundation. HOLD all provider/schema/configuration/reset
activation. Later work requires user-approved verified recovery email/private
mail configuration, pinned provider schema rehearsal, private production
dependency inventory, recoverable encrypted backup + isolated restore proof,
and separately reviewed AI atomic session authority. User submits passwords
privately in the form. No password is requested in chat.

## Preview deployment

None. Local evidence in docs/friends-accounts/validation.md: 68 new tests,
581 total pass / 13 opt-in skips on main edfdb81, full typecheck, scoped lint and surface
contract check pass. Provider/DB/mail/browser/backup tests remain unrun.

## Anything the reviewer should know

Retain site_users.id: deleting accounts cascades scores/rewards. Reset scope
is old credential material and legacy sessions only, after reviewed compatible
cutover. All basketball/stock/AI data remains outside that reset. AI owner
accepted stable UUIDs and the separate provider-session/account-link admission
review; no bridge or AI edits now. Preserve all per-user AI budgets.

Changed paths: ARCHITECTURE.md; src/domain/arcade/account-identity.ts;
src/domain/arcade/competition.ts and competition.test.ts;
src/data/account-identity.ts; src/data/__tests__/account-identity.test.ts;
docs/friends-accounts.md; docs/friends-accounts/{account-inventory.sql,
ai-account-inventory.sql,validation.md,draft-pr.md}.

The user explicitly approved publishing this prepared source and plan as a
public draft PR. Production reset, provider/schema/configuration activation,
security setting changes, merge and deployment remain separately gated.
Minimal ownership issue #118 succeeded. Publication uses only aidandaly24.

— Aidan's Dot
