# Account login navigation

Ordinary successful login goes to the canonical personalized homepage, `/`.
The homepage remains owned by its existing maintainer. This change consumes
its request-private session/team contract without changing homepage files.

Email login, claim and link success perform a document `replace` navigation
to `/account/continue`. That GET route renders no settings screen. It reads
the newly established session and current membership, returns a private,
non-cacheable redirect, and avoids reusing pre-login client Router Cache data.
A verified linked member continues home or to an intentional safe `next` path.
An unclaimed account retains `/account` onboarding and its intended return;
enrollment-only mode retains the account setup screen. Signed-out/unverified
accounts return to email login. Lookup failures never grant a member identity.
Legacy team/password login sets its existing remembered session before the
same home/default or safe explicit return. Legacy enrollment proof is unchanged.

`domain/login-navigation.ts` validates the destination at client and server
boundaries. Only same-site rooted paths are accepted; external/protocol-relative
URLs, backslashes, controls, malformed escapes, API/internal paths and login
loops fall back to `/`. Protected My Team and password routes carry explicit
returns. Re-verification still renders the login form, even for a current user.

The successful submit remains pending until navigation leaves, with a ref guard
preventing duplicate requests before React paints. Credential bodies, verification,
session lifetime, claim transaction checks, password revocation and auth flags
are unchanged. There are no production account or database operations in QA.

## Verification

```sh
npm test -- src/domain/login-navigation.test.ts src/app/account/continue/route.test.ts src/app/account/login/page.test.tsx src/app/login/page.test.tsx src/app/account/page.test.tsx src/data/__tests__/claim-action.test.ts src/app/personalized-home.test.tsx src/data/__tests__/personalized-home.test.ts --maxWorkers=1
npm run typecheck -- --incremental false
npm run check:contracts
npm run build
```

The bounded suite has 100 passing tests. The existing homepage tests establish
independent server identities and current-team projections; they are unchanged.
Production build and surface contracts (81 files) pass without app credentials.

For local browser behavior, run from the repository root in separate terminals:

```sh
node qa/account-settings/routing/server.mjs
node qa/account-settings/routing/browser.mjs
```

The browser driver currently uses the executor's Chromium/Playwright paths.
Its seven scenarios exercise the production AccountForm and actual continuation
handler with injected synthetic identity sources over loopback HTTP: default
home at 320/1280px, explicit team/password returns, unsafe return rejection,
claim-required flow, duplicate submission, failed-login keyboard retry and
Back/Forward/repeated navigation.
The fake destination calls the real home-viewer resolver and receives team 3
from the new HTTP-only fixture cookie. No settings document is visited in the
ordinary linked login flow. This is a component/handler fixture, not proof of
live auth, hosted Next routing, physical devices or screen-reader acceptance.

## Visual follow-up is blocked

The requested account settings redesign and My Team settings-link placement
are not implemented by this routing patch. Both supplied Library images resolve
to their expected identifiers and filenames, but the current Library transfer
helper returns `library file transfer failed: download failed`. Neither original
file exists in the selected executor. A subsequent Library image read returns
descriptions/asset references rather than accessible pixels. The screenshot-first
instruction therefore remains unsatisfied; descriptions are not pixel inspection.

The source-only link inventory covers 141 production Link/anchor declarations.
Reproduce it with `node qa/account-settings/audit-links.cjs`.
Four clear uncontained links remain in `/account` and `/team`. The header's
mapped links receive descendant styles from their rendered navigation containers.
The inventory is not a site-wide rendering pass. No blanket global anchor rule
or shared token/style change has been made. Actual visual, hover/focus, contrast,
mobile/desktop and enlarged-text verification remains pending.

Muse was notified of the bounded scope and personalized-home contract on PR208.
No overlap was found among open account/auth PRs at the initial check; owner
acknowledgment and exact-change readiness remain pending. The draft must not merge
until the outstanding work and Dot/Muse final-head review are complete.
