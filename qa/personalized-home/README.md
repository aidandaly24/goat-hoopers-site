# Personalized front-page review

The independent portrait check uses the real `PlayerHeadshot` and all 30
existing approved portrait mappings for ten teams. Start this checkout's Vite
config on free numeric-loopback port 4210 (`--port 4210`), then run
`node qa/personalized-home/verify-headshots.mjs` with the existing Playwright
dependencies available through `NODE_PATH`. It checks local-first delivery,
the unchanged ESPN path (intercepted with local image bytes), fallback after
local/remote errors, missing-image initials and source-change recovery. All
17 checks use local image bytes; no real ESPN request, account action or
production data is involved. `HOME_EVIDENCE` selects the report directory.
This verifies image behavior, not the final homepage composition or deployment.

Run the installed Vite with `--config qa/personalized-home/vite.config.mts`, then
run `NODE_PATH=/path/to/existing/playwright/dependencies node qa/personalized-home/verify.mjs`.
Numeric loopback port 4201 only; stop the owned server afterward.
`HOME_EVIDENCE` chooses the screenshot/JSON directory (default `/tmp/goat-personal-home-review`).
No install, production account, database, provider call or account action is required.

The fixture composes the real home surfaces and shell with wholly synthetic
teams, values, scores, transactions and saved AI. The `fixture-team` query is an
explicit local fixture selector, not a production ownership mechanism. Browser
requests are restricted to GETs on numeric loopback. The production page resolves
ownership from the existing server session and active link, never URL input.

Coverage: 14 states at desktop light, phone light/dark and 320px with 200% text. Full valuation disclosures and populated synthetic form-guide records are included.
Checks include two different identities, signed-out/unclaimed, outages, offseason,
preseason, missing matchup/market/editorial, stale/missing AI, long names, real
keyboard focus and 44px launch navigation. Normal desktop/phone pages and the
new edition at every size must not overflow. The unchanged league edition has
pre-existing 320px/200% overflow (also reproduced signed-out); its page overflow
is recorded separately rather than hidden or counted as a pass. No claim of
physical-iPhone, screen-reader, live-account or deployed behavior is made.

Review PNGs show synthetic inputs and are not real league results. A separate
local production-Next smoke check validates the built signed-out homepage; page
composition tests inject verified server identities for concurrent requests and
unclaimed/expired/inactive states, without modifying real accounts.

Live guide limitations and the separately owned weekly evidence adapter are
documented in `docs/weekly-player-guide.md`; no synthetic performance inputs
enter the production route.
