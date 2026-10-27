# GOAT arena — isolated full-page design study

This is a local review app on `dot/polyfork-arena-prototype`, based on main
`8a0a9886c37a724789bf14a3032b1b2b2506731c`. Everything new lives in this folder.
It changes no production route, surface, shared token, domain, loader or backend.
PR #266 and its branch are untouched; its pending recap is not copied here.

Run from the repository root with the existing dependencies:

```sh
node node_modules/vite/bin/vite.js --config qa/arena-prototype/vite.config.mts
```

Open <http://127.0.0.1:4196/> for the league edition or
<http://127.0.0.1:4196/?view=member> for the member edition. The review toolbar
switches editions, 3D/still and missing-editorial states. The original header
owns theme/navigation. These are ordinary links with their original destinations;
this fixture does not implement those destination routes or a sign-in system.

The real `CourtsideHome`, header and footer are composed with offline props.
Approved Oct 8 roster identities and sample editorial remain dated. All current
scores, prices, form, news and saved AI picks are explicitly synthetic. No live
data, session, market loader, production database or provider generation runs.
The full ten-team, 228-player directory and its search/sorting/disclosures remain.
Both layouts retain matchup context, source notes, notebook, editorial picks,
all AI pairings, wire, standings, tools and archive. Members additionally retain
their roster valuation/disclosure and performance guide. Recorded history's
existing unavailable state remains; no history is invented. The baseline switch
`&style=baseline&scene=still` permits exact content/link comparison without the
composition overrides.

One large original court/arena supplies the background across the page. Reading
surfaces use existing Paper + Slate tokens; scenic seams and gutters expose the
court throughout. An initial still frame is reused as the page's scenery. There
is one deferred Three renderer, no scroll/camera animation and no idle frame loop.
Pixel ratio is bounded to 1.5 and 1.6 million drawing pixels. Seating is instanced;
no shadows, physics or animation framework are involved. Reduced motion,
Save-Data and the review's Still mode skip the scene/model download entirely.
Live reduced-motion changes, resize, tab visibility, teardown and context loss
are handled. The fallback is an original SVG plus the approved hero court photo.

**Polyfork prop integration is pending a concrete network blocker.** Public
metadata and GLB CDN reads return HTTP 403 from this environment's proxy; no
model was downloaded or visually inspected. The reviewed GLTFLoader integration
discovers local GLBs only. See [asset provenance](assets/PROVENANCE.md). When the
same approved public URLs are reachable, run `python3 qa/arena-prototype/fetch-assets.py`,
then inspect the actual three files/placements before declaring that part complete.
No MCP, account, API key, subscription, asset code execution or dependency install.

With the local app running, verify and capture:

```sh
node qa/arena-prototype/verify.mjs
npm run typecheck
node node_modules/vite/bin/vite.js build --config qa/arena-prototype/vite.config.mts
node node_modules/eslint/bin/eslint.js qa/arena-prototype
```

The browser script uses installed Playwright and Chromium. Override
`PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `ARENA_ORIGIN`, or `ARENA_EVIDENCE` if needed.
It writes full-page public/member desktop and phone screenshots, section captures
and `checks.json` to `/tmp/goat-arena-evidence`. Curated review captures live under
`review/`. Production builds go to `/tmp/goat-arena-build` and intentionally do
not copy the repository's entire public asset tree; run the dev command above
for the complete playable local review, including fonts and existing media.

Vite emits expected `use client` directive notices for reused Next components
and a large-chunk notice for deferred installed Three/GLTFLoader. This is an
all-client offline review app, not a production Next payload benchmark.

Do not merge, deploy or integrate this study into `/` without reviewed follow-on
work. Parent Dot owns exact-head review and user delivery; Muse review/readiness
and the pending asset inspection remain separate gates. The [#190 ownership
comment](https://github.com/aidandaly24/goat-hoopers-site/issues/190#issuecomment-6453072755)
records this non-overlapping claim. No release authorization is implied.
