# Week 2 / 82–0 design review

Scope: one unlisted `noindex` route, `/arcade/week-2-preview`. No public catalogue,
navigation, account, leaderboard, game-store, reward, infrastructure or deployment
changes. The original checkout and separate sculptural-motion work are untouched.

The phone-first visual direction is an editorial paper opening and an NBA
draft-night stage: oversized type, franchise colors, a purposeful team reveal,
player selection, stamped lock-in, and a finished lineup poster. The poster can
be downloaded as a local 1080×1350 PNG. No animation/rendering dependency was added.

## Surface contract

- Question: which lineup would I build from randomly revealed NBA teams?
- Primary action: enter the unranked demo → reveal → choose → lock → next team.
- States: locked teaser, sealed draw, revealed pool, selected player, locked pick,
  completed lineup, poster saving/success/failure and missing-portrait fallback.
- Narrow layout: one draft stage, open player rows, full-width primary action,
  compact lineup strip; result poster above actions. Shared site chrome is reused.
- Forbidden patterns: generic dashboard, repeated boxed cards, speculative records,
  pretend rankings, paid/provider calls, game submissions or prize commitments.

Five picks is a demo format. Position restrictions, scoring, actual competition
rosters, daily/ranked scheduling and leaderboard integration remain open. The
browser-only draw is not a fair-play or ranked competition system. Nothing is
saved to an account; reloading starts over. The title 82–0 is a challenge concept,
never a simulated or validated season prediction.

## Art / source boundaries

All runtime imagery already exists in `public/courtside/portraits`; the shared
header uses the existing approved GOAT mark. See
`courtside-preview/ASSET-PROVENANCE.json` for the retained portrait provenance.
The demo uses ten exact local portrait files, without new downloads or edits.
Some uniforms/franchise pairings can differ: these are explicitly illustrative
pairings, not a current NBA roster feed. A failed portrait becomes typographic
initials. Court lines and the burst mark are simple authored inline SVG geometry.
Fonts reuse the shared Inter/Geist roles and the repository's local review copies.
Team materials are scoped to the preview's UI token class.

## Local review and verification

Use the existing locked dependencies. No installation is needed when the
checkout has `node_modules` (a worktree can reuse the original dependency tree).

```sh
node node_modules/vite/bin/vite.js --config qa/week-two/vite.config.mts
```

The printed loopback URL serves the actual surface and shared header using only
static demo props. This fixture deliberately omits the root layout's live league,
stock, news and account loaders. It does not verify Next App Router behavior.
The real Next route remains available for a later separately authorized runtime
review; source typechecking includes it.

```sh
node node_modules/vitest/vitest.mjs run src/domain/arcade/roster-draft.test.ts src/app/arcade/page.test.ts src/domain/arcade/competition.test.ts src/surfaces/arcade/free-throw
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/tsx/dist/cli.mjs scripts/check-surface-contracts.ts

WEEK_TWO_PLAYWRIGHT=/absolute/path/to/installed/playwright/index.js \
WEEK_TWO_CHROME=/absolute/path/to/installed/chromium \
WEEK_TWO_EVIDENCE=/tmp/goat-week-two-evidence \
node qa/week-two/verify.mjs
```

The verifier uses the existing Vite/Playwright/Chromium installation and installed
FFmpeg for an MP4 of real browser frames. It starts/stops its own loopback server
unless `WEEK_TWO_BASE_URL` names an existing numeric-loopback fixture. The JSON
evidence records commit, dirty status, method and individual checks. Screenshots,
downloaded posters and video are task outputs outside the source tree.

Verification covers phone/desktop full flows and image downloads, fresh restart,
320px reflow at 100%/200% text, Enter/Space, live reduced motion, missing portraits
and absence of external/API/non-GET requests and page errors. It uses Chromium
emulation, not a physical iPhone, Safari, screen reader, production database or
deployed application. No production-readiness claim is made.
