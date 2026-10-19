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

Run the installed Vite with `--config qa/personalized-home/vite.config.mts --port 4210`,
then run `NODE_PATH=/path/to/existing/playwright/dependencies node qa/personalized-home/verify.mjs`.
Numeric loopback port4210 only; stop the owned server afterward.
`HOME_EVIDENCE` chooses the screenshot/JSON directory (default `/tmp/goat-home-integrated-review`).
No install, production account, database, provider call or account action is required.

The fixture composes the actual home and shell with populated synthetic league
editorial, ten teams, values, scores, news and saved AI. The `fixture-team` query
is a local fixture selector; production ownership comes exclusively from the
existing server session and active link. The main matrix restricts requests to
GETs on numeric loopback. There is no production data or write.

Coverage: all ten teams on desktop, plus fifteen states across desktop,390px
light/dark,320px reflow and separately200% text at390px. It checks the integrated
layout, public court overlay, full valuation disclosure, source detail, saved AI,
source gaps, empty editorial, focus,44px actions and page overflow. An interaction
pass selects other pairings, prevents misassociated personal AI, selects the
team rail, changes reduced motion live, and closes native notes with Escape.
`opening.html` adds explicitly synthetic date-only/unconfirmed/running/zero clock
states; those invented times never enter the production route.

Reports bind source hashes, HEAD and cleanliness, distinguishing a working-tree
pass from final committed-head evidence. Screenshots show synthetic data. No
physical phone, screen-reader, live account or production deployment is implied.
Vite fixture navigation does not establish actual Next Back/Forward behavior.
The session/page unit tests retain concurrent verified identity isolation.

The production loader currently certifies only a date. A live homepage countdown
remains blocked on a verified exact league scoring start with timezone and an
explicit server clock exchange; the AI midnight publication cutoff is not used.
The shared clock does not introduce automatic fetches or a new API here.

Live guide limitations and the separately owned weekly evidence adapter remain
in `docs/weekly-player-guide.md`; synthetic performance never enters production.
