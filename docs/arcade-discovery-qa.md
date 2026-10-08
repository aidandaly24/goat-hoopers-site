# Public Arcade repair — 2026-10-08

Base: merged main `5e662152100e693c879f3dee37489b2f57e02706`, tree
`337945d7a43fa35c8bdf4518d13845d9c696898b`. Dedicated checkout:
`/Users/aidandaly/Documents/Codex/2026-10-08/task-20/goat-hoopers-arcade-repair`;
branch `dot/arcade-playable-hub`.

The implemented practice route was hidden behind account/store availability
and coming-soon competition copy. The public hub now renders implemented
`PlayableGame` entries only, with a real screenshot, accurate phone controls
and a direct Play link. Planned predictions remain registered but have no
card. Practice is available without sign-in; competition/rewards remain closed.

Back/help now sit above loading/error overlays. Their UI targets never start
a court drag. An Arcade-only missing-ticker selector prevents the shared
sticky header from covering the title or controls, including Next.js's hidden
metadata sibling. Homepage code, site header/navigation, data/store code,
dependencies, GLBs, render adapter and shot physics are unchanged.

## Final source checks

- Node 22.23.3, minimal subprocess environment; no database/app credentials,
  dotenv files, production DB calls, account writes or reward writes.
- Offline suite: **407 passed, 13 opt-in DB tests skipped**; includes two new
  public-catalogue regressions plus all 18 existing game tests.
- Typecheck and final full production build: passed.
- Changed-file ESLint, surface contracts (**57 files**) and diff whitespace:
  passed. Full-repo lint remains **18 errors / 12 warnings** in unchanged
  preview scripts, calibration, legacy Arcade detail/provisioning, ticker and
  stock-row files. No full-lint pass is claimed.
- Existing repeated/reset/interrupted keyboard/charge, position, reduced-motion,
  context-loss and asset-recovery evidence in `free-throw-practice-qa.md` applies
  to the unchanged engine. New browser coverage is listed below.

## Final production-build browser regression

Repeatable harness: `src/test/arcade/browser.mjs`; setup is documented beside
it. It starts the real app on a private loopback port with a whitelisted child
environment, blocks external server fetches, rejects external/non-GET browser
requests, uses real GLBs and native Chromium touch events, and closes its own
server/browser. No hosted or physical-device result is implied.

- Desktop and 390px phone: unchanged homepage navigation → Arcade → Play
  reaches the ready 3D court. One playable card, actual preview, no placeholder,
  account prompt or invented FAAB/stats in the catalogue.
- Canvas is off-white with dark text. 320/390px layouts have no horizontal
  overflow; Play targets are at least 44px.
- Native phone court drag changes aim and selected power; release fires once.
  Upward drag from 50% produced **41%**, confirming this is selected-power
  drag/release, not a flick-velocity mechanic.
- Native hold/release button fires once. Touch cancellation restores centered
  aim without an attempt. Dragging help text leaves the court ready at 0/0.
- Nested SVG Back/help targets work on desktop/phone in **ready, loading and
  forced missing-asset states**. Header cannot cover the title. Help opens and
  closes, scores stay 0/0, and Back returns to the playable Arcade catalogue.
- In a separate WebGL-disabled phone fixture, title/Back/help remain visible
  and usable; shooting is disabled and Back returns to Arcade.
- **Zero page errors, non-GET requests or external browser requests**.

Evidence in the task workspace: `../arcade-evidence/results.json`,
`arcade-desktop.png`, `arcade-mobile.png`, `game-mobile.png`,
`webgl-unavailable.png`, `server.log`; command logs are `../arcade-*.log`.

## Preview provenance and remaining gates

`public/arcade/free-throw-preview.jpg` is an unedited 1248×696 JPEG screenshot
of the actual ready game at base main, **46,441 bytes**, served directly without
image-optimizer work. Git blob: `fc561fe181463cbb9564a8301a2217d04736f7b6`.
SHA-256: `6901f837f71a6ba4e9ee4bed165d07852ceff65c525d911a952e51746652879c`.

Physical iPhone/Safari, GPU/device performance and hosted-preview interaction
remain unverified. Muse's failure comment was still absent from fetched PR72
timeline at the last check; known parent observations were addressed. Parent
owns independent exact-head review, CI, preview and merge. This writer does
not merge. Editable Blender ZIP and any later upward-flick gesture remain
separate work and do not delay this access repair.
