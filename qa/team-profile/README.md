# Team profile implementation checks

Bounded profile-only QA for the compact profile composition, roster leaf and
local URL query helper. Production components receive existing domain values;
`fixtures.ts` contains synthetic edge cases for offline tests only. No mock,
preview or simulated data enters an application loader or production route.

The open identity/record header and profile section links lead to a compact
next matchup, aligned roster and complete game log, rookie picks and wire.
Every original canonical player/team destination remains. The optional/null/
omitted `GmArchetypeCard` contract and complete `FranchiseSection` are preserved.
GM computation/data/card files and team-route loaders are byte-identical to the
verified dependency base. Any pending GM correction stays with its owner.

The roster preserves supplied order, lazy headshots/initials and actual
position/NBA metadata. Search uses the existing domain name-search helper.
`rosterSearch` and `position` live in the URL via Next's native history
integration; unrelated query values and hash survive. The `Suspense` fallback
contains the complete canonical roster. No additional fetching, storage key,
theme provider, valuation/domain/data or dependency change. Shared shell owns
`html[data-theme]` and its toggle; this slice uses canonical `--gh-*` tokens.

## Source validation

With the already-installed Node22 runtime:

```sh
node --max-old-space-size=1024 node_modules/vitest/vitest.mjs run \
  src/surfaces/teams/TeamProfile.test.ts src/surfaces/teams/TeamRoster.test.ts \
  src/surfaces/teams/rosterQuery.test.ts src/test/rejected-hoopers.test.ts \
  --config qa/team-profile/vitest.config.mts --configLoader runner --maxWorkers=1
node --max-old-space-size=1024 node_modules/typescript/bin/tsc --noEmit --incremental false
```

Use `runner` so config loading does not write temporary files into symlinked
shared dependencies. The scoped Vite cache stays under ignored `.cache/`;
the same repository offline network/DB guard is mandatory.

39 focused tests pass: 13 roster/query/profile cases and 26 existing removal
regressions. Focused ESLint and no-output/no-incremental typecheck pass. Checks
establish supplied field/href/order parity, no fetch/mutation, accent search,
position intersection, no-match/clear rendering, URL restoration/unrelated
query/hash preservation, complete suspended roster fallback, earliest pending
matchup selection, final/partial/zero/tie score semantics, truthful empty states,
and optional GM/2025/prior-manager/history contracts. They do not establish
interactive Next Back, visible focus, rendered 44px targets, reflow, native 200%
enlargement or shared-shell behavior.

## Shipping scope

TeamDirectory and TeamProfile consume the actual CourtsideHome .wrap formula
and existing --gh-cs-wrap/--gh-cs-gutter tokens. Both are centered with the same
responsive horizontal gutters; shared/home files and token values are untouched.
The homepage owner confirmed this contract.

The profile slice is stacked on reviewed removal branch
`dot/remove-rejected-hoopers` (`65defc2144910b39b2d3b19ca2ef3ebebd8c19ef`).
Its tree equals the independently verified dependency candidate. The coordinator
merges removal, then retargets/integrates this bounded profile PR into main.
No PR110/125 ref was written. GM/domain/data/team-route files remain unchanged.

Aidan's shipping instruction replaces the earlier exhaustive acceptance matrix:
reuse passing source/prototype evidence, obtain passing exact-tree remote CI,
and run one focused width/filter/navigation smoke. No new design variant, test
framework, full local app build, install, self-merge or deployment. Root owns
the release.
