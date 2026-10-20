# Offline homepage player-context review

All names, values, points, GP, dates and AI results are synthetic. No application
route imports these files. The fixture composes the production `CourtsideHome`
and production player components with the existing synthetic home source. Next
Link/navigation use local fixture adapters; this is not a Next runtime test.

With the repository's locked dependencies installed:

```sh
node qa/home-player-context/build.mjs
node qa/home-player-context/build.mjs --serve
```

The first command runs19 static assertions with fetch forbidden and writes
`/tmp/goat-home-player-context/verification.json`. The second also bundles a GET-only
loopback server at `http://127.0.0.1:4204`. `--browser-build` refreshes the bundle
without opening another listener. `HOME_PLAYER_EVIDENCE` selects another output
directory. Nothing calls Sleeper, a database or a generation provider.

Use `?state=small-cohort`, `six-participants`, `tied-participants`, `small-tie`,
`long-name`, `preseason`, `quiet-preseason`, `value-only`, `failed-images`,
`news-unavailable`, `missing-edition` or `signed-out`. `fixture-team=1` through10,
`theme=light|dark` and `text=200` control synthetic inputs/presentation.

Profile and transaction links keep their real hrefs. The offline server intentionally
returns an explanatory404 for those destinations; Back returns to the fixture.
Do not count that as a full player/team journey check. Actual player→owning-team
links were inspected in the existing route source; a Next runtime check remains.

Evidence in `evidence/` records Mac Chrome rendering and DOM measurements. The
320/390/1440 checks at normal text and390px at200% found no horizontal page overflow; player-name targets measured
44px high and portrait fallbacks44×44. Reduced-motion initial/change and hidden-page
cleanup were independently exercised with a temporary production-effect harness,
not by altering the Mac's settings. See the [implementation note](../../docs/home-player-context.md)
for source gaps and required integration checks.

The separate combined320px/200% case reproduces a pre-existing359px page width,
including the old history fallback. The compact notebook/form sections stay
bounded; existing standings/stat and transaction-tag layouts need separate audit
ownership. This is not a passing whole-page case and is not attributed to history.
