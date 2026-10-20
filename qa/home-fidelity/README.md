# Homepage fidelity review

The production homepage is compared with the approved reference at
`501c2abed9bba76424914621690680e2fb53ad62` under
`docs/design-references/2026-10-19-homepage/`. Aidan's later direction narrows
the current homepage to 68rem, reduces type and portraits, compacts STUD/CHUD
and activity, and preserves Faces cards while removing portrait frames.
The superseded champion showcase stays absent.

All fixture identities, scores, values, news and AI results are synthetic.
`reference=1` uses approved checked-in portraits with synthetic roster/price
inputs to compare the original montage art direction. Production never imports
these fixtures. They call no live league/auth/database loaders.

## Production Next.js and browser checks

Requires Node 22, installed project dependencies, Chromium at
`/usr/bin/chromium`, Python Playwright, and Node Playwright (resolve through
`NODE_PATH` if supplied by the execution environment).

```sh
node qa/home-fidelity/verify-next.mjs
```

The runner makes an isolated temporary Next.js app, builds the actual source
with Webpack, checks 14 HTML/RSC responses, runs the existing 120-case
personalized-home browser suite, then the focused browser matrix. It strips
application credentials, blocks external server fetches, blocks browser writes,
and serves a local test image for avatar CDN requests. No account actions run.
The matrix covers 1440/390/320 light/dark, current identity/avatar/trade,
completed stats inside their panel, long names, unavailable portraits, current
0–0 totals, disclosures, focus and reduced/normal motion. HTML wrappers are
exercised by actual hydration, rather than static rendering alone.
The failure case reproduces cached 404s that complete before hydration and
checks the same shared portrait fallback used by the homepage cutouts.

`HOME_REVIEW_SKIP_EXISTING=1` runs only the additional matrix after a successful
existing-suite run on unchanged application source. Final review runs both.
`HOME_REVIEW_DEV=1` runs the small development diagnostic for full React
component stacks. Reports default to `/tmp/goat-home-fidelity`; override with
`HOME_FIDELITY_EVIDENCE`.

## Matched before/after captures

Prepare an isolated baseline source at main commit
`7dcdf0aa36611bb52f45e5c483b6fb18e895ccc1` and serve its actual components via
this review fixture on numeric loopback port 4203:

```sh
HOME_REVIEW_SOURCE=/absolute/baseline HOME_REVIEW_PORT=4203 npx vite --config qa/home-fidelity/vite.config.mts
HOME_REVIEW_CAPTURE=1 node qa/home-fidelity/verify-next.mjs
```

The capture step takes member/public 1440/390/320 light/dark full pages with
identical fixture inputs. It eagerly resolves images, waits for fonts and
hydration, records layout metrics, and crops section rectangles from the
full-page image so the sticky header cannot obscure crops. The baseline is a
Vite rendering of unchanged baseline components; the after image is production
Next.js. Reports identify that distinction. Review both against the pinned
original reference and the newer compact direction; fixture amounts are never
presented as real league values.

## Data regression coverage

- `recent-activity-loader.test.ts` uses real loaders with an offline HTTP
  transport: first-week zeros/live scores are not completed records; prior
  completed scores survive current zeros; current transactions stay visible.
- `streaks.test.ts` retains existing streak counterexamples and ensures a
  completed tie can be closest but never a blowout.
- `CourtsideHome.test.tsx` changes current names/avatar/roster membership,
  preserves dated editorial text, resolves the watch's current owner, and
  rejects a completed-final label for current totals.

Identity/roster refresh follows the existing five-minute provider cache on a
new server render. This work adds no push-update mechanism or cache policy.
History/chart contract and integration belong to #217/#218; header/avatar
work belongs to #220. Their files and data/scoring policies remain separate.
