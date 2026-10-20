# Personalized front-page review

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

Coverage: 20 states at desktop light, phone light/dark, 320px at normal text in
both themes and 320px with 200% text. Full valuation disclosures and populated synthetic form-guide records are included.
Sleeper CDN avatar requests are fulfilled locally with a 1×1 PNG so the
`team-avatars` / `team-avatars-public` states exercise the real <img>
avatar paths offline: the featured faces' compact avatar/name row is
asserted at compact size (portrait sizing never reaches it, champion and
non-champion alike) and every member-view avatar is asserted unballooned.
The `archived-edition` state renders a historical edition the way
/weekly/[editionId] does and asserts no current countdown/started UI.
The `long-name` state asserts zero phone-viewport overflow in both
themes, including the Recent Activity own-team tag staying in its card, and at
320px with normal text it asserts the page is exactly viewport-wide: the
activity feed's unbroken team link wraps inside its row instead of reaching
past the right edge.
The showcase caption is asserted in its formatted Eastern form
("Tue, Oct 20 · 3:00 PM EDT").
Checks assert the approved homepage composition: the team desk (member) and league
desk (signed out) beside the court; the team value at display size exactly once
with its full-roster disclosure; the recorded value chart in the pre-tip
`showcase` state (checked at Oct 19, 2026 — exactly one countdown, honestly
captioned, verified 2025 desk lines); all five AI Decides rows down-page, each
with its provenance disclosure; standings/leaders/moves as a VISIBLE league
section (no collapsed details); and NO homepage champion showcase anywhere —
nor any other dedicated champion content: the public faces section's champion
record panel is asserted absent in every state, while the avatar crown badge
and the directory's champion label remain and are
asserted in the `champion` state. Two different identities, signed-out/
unclaimed, outages, offseason, preseason, missing matchup/market/editorial,
stale/missing AI, long names, real keyboard focus and 44px desk actions are
covered. Normal desktop/phone pages must not overflow. Pre-existing league
tables have 320px/200% overflow (also reproduced signed-out); it is recorded
separately rather than hidden or counted as a pass. The `showcase` and
`showcase-public` states also write the approved-design captures to
`redesign-desktop.png`, `redesign-mobile.png` and `redesign-public.png` in
`REDESIGN_DIR` (default `~/workspace/goat-hoopers-site-qa`). No claim of
physical-iPhone, screen-reader, live-account or deployed behavior is made.

Review PNGs show synthetic inputs and are not real league results. A separate
local production-Next smoke check validates the built signed-out homepage; page
composition tests inject verified server identities for concurrent requests and
unclaimed/expired/inactive states, without modifying real accounts.

Live guide limitations and the separately owned weekly evidence adapter are
documented in `docs/weekly-player-guide.md`; no synthetic performance inputs
enter the production route.
