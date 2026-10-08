# Final current-main integration — 2026-10-08

Publication base: `a327e9c960259025ffc736da7004408942736106`, including the
live Courtside homepage and PR42 surface contracts. The integration preserves
main's homepage, weekly pages, site chrome, Courtside assets and lockfile exactly.
The approved game TS/TSX/CSS, manifest and runtime GLBs are unchanged from the
previously verified release. The only merge conflict was in package scripts;
both `check:contracts` and `test:free-throw` are retained.

Affected verification on the integrated code:

- Node 22.23.3; no reinstall or credential changes.
- `npm test`: **405 passed, 13 skipped**, including all 18 game tests and the
  production surface-tree contract regression. Default network guard active.
- `npm run typecheck`, focused game ESLint and `git diff --check`: passed.
- Standalone `npm run check:contracts` was blocked by sandbox `listen EPERM`
  on `/tmp/tsx-501/82944.pipe` before its check ran. That command was stopped.
  The offline production-tree regression independently passed in the suite.
- The bounded desktop/mobile/WebGL/touch evidence below is reused because the
  entire game implementation and assets are unchanged. The final production
  build outcome is recorded in the task's `../final-build.log`.
- Disk was rechecked before the final build: 4.0 GiB available. PR42 is merged.

The coordinator's native upload helper confirmed these existing GitHub blobs
against the approved assets. They match the tracked index; no further binary
upload is needed:

- Basketball: `fc39cd389151fd53262f5fb2d1e743df5a8a8f70` (1,773,888 bytes).
- Court: `6d86191b4f4601fd9e25fcb27b342c8aaf3e2968` (939,972 bytes).
- Hoop: `2906fb57aeff51d1818fdc4f5aaf792b4901e27c` (403,968 bytes).

Final logs: `../final-tests.log`, `../final-typecheck.log`,
`../final-focused-lint.log`, `../final-contracts.log`, `../final-build.log`.
Earlier verification records below are historical and name their own bases.
Independent final-head review, passing CI and deployment verification remain
coordinator gates. This worker does not merge. No production DB call or account/
reward write was introduced. Editable Blender ZIP publication remains separate.

---

# Release integration verification — 2026-10-08

This section supersedes the older source-checkout handoff below. Issue #68 owns
publication; independent review of the exact PR head and passing CI are required
before merge.

- New, distinct checkout: `/Users/aidandaly/Documents/Codex/2026-10-08/task-20/goat-hoopers-release`.
- Base main: `e666d452be9787eaf1c7e8e6ad9a987551517a51`.
- Approved source: `011414fac55dd2faa537b6450b736e9033c86d3b`, tree
  `def045d2d1e0bf48e3fab38420bc53d2b81568bc`.
- Source game integrated without conflicts or gameplay/design changes. Runtime
  GLBs are byte-identical to the source. Current main's offline guard, CI,
  lockfile and typecheck script are preserved. The old publication worktree
  remains untouched. Editable Blender ZIP publication is deferred.
- Node **22.23.3**; `npm ci --include=dev` passed with engine validation.
  Node 25 was rejected by the engine check before installing app dependencies.
- A minimal subprocess environment supplies no application/database/import
  credentials. No environment files were copied, and no database query,
  migration, seed, reward or account write was performed.

## Final local checks

- `npm test`: **327 passed, 13 skipped**, across 33 passing and two skipped
  files. This includes all **18 game tests**. Skips are opt-in database/provider
  tests; the default suite's network guard stayed enabled.
- `npm run typecheck`: passed.
- `npm run build`: passed, including production compilation and TypeScript.
- Focused ESLint across every changed game TypeScript/TSX file: passed.
- `npm run lint`: **12 errors and 12 warnings** in existing main files.
  Every error-bearing file is unchanged by this PR: `scripts/calibrate-stocks.ts`,
  `src/app/arcade/page.tsx`, `GameDetail.tsx`, `ProvisionNotice.tsx`,
  `CombinedTicker.tsx` and `StockRow.tsx`. Full lint is not a green check.
- `git diff --check`: passed.

## Bounded browser checks on the production build

Route: `http://127.0.0.1:3020/arcade/free-throw`. Headless installed Chrome,
Playwright 1.64.0, real GLBs and actual WebGL using the software renderer.
Client external requests were blocked; local asset and page requests were
allowed. No page errors or non-GET requests occurred.

- First selected-power shot made once (1/1), then moved to a new spot.
- Repeated Space keydown during a hold did not restart charging: 53% release,
  2/2 after two attempts; stale keyup added no attempt.
- Long hold clamped to 100% and fired exactly once.
- A/D and arrow aiming readouts followed input.
- Blur, Escape and reset during charge cancelled without a stale shot.
- Reset during flight/pending next-ball timing preserved zero score and reset
  origin after 1.5 seconds. Twelve consecutive reset transitions did not repeat
  the prior spot; eight distinct spots were observed (all nine are covered by
  deterministic position tests).
- Help/Fine controls were closed by default and opened/removed cleanly.
- Reduced motion produced a still result and automatic next ball.
- Actual `WEBGL_lose_context` loss showed fallback with shooting disabled;
  Reload recovered all real assets.
- Forced local 404 for the basketball GLB showed fallback. Removing the forced
  response and Reload restored play; the 50% shot made once.
- Native CDP touch hold/release made once. Native court drag/release fired once.
  Native touchcancel restored prior aim and produced no attempt.
- 390×844, 320×568 and 844×390: no horizontal overflow, shoot button remains in
  the viewport, and touch target height is 44px.

Evidence lives in the task workspace's `evidence/`: `desktop.png`, `mobile.png`,
`context-loss.png`, `asset-failure.png`, `browser-results.json`. Repeatable local
harness: `../browser-check.mjs`; command logs: `../tests.log`,
`../typecheck.log`, `../build.log`, `../lint.log`, `../focused-lint.log` and
`../browser.log`. These test artifacts are not runtime game code.

## Remaining validation limits

Physical iOS/Android, Safari, throttled/low-end-device performance, physical
GPU behavior and WebGL-constructor failure remain unverified. Context loss was
real within software WebGL; this does not establish physical GPU compatibility.
The existing locked dependency install reports nine audit findings (four
moderate, five high); this integration does not change dependencies.
Vercel preview verification, final-head independent review and passing CI remain
coordinator gates. No merge is authorized for this worker.

---

# Local free-throw practice handoff

Verified 2026-10-08. Playable route: http://127.0.0.1:3008/arcade/free-throw.

## Checkout and preview

- Checkout: `/Users/aidandaly/workplace/goat-hoopers-free-throws`.
- Branch: `dot/free-throw-practice`; base `f617e83cbaf463cd6a4fd6668c3ba9d2805c347a`, current main reconciled before delivery.
- Original checkout and other tasks preserved. A focused draft PR is authorized for review; no merge or database operation is authorized.
- Detached dev server on `127.0.0.1:3008`; npm PID `84380`.
- Log: `/tmp/goat-hoopers-free-throws-dev.log`; PID file: `/tmp/goat-hoopers-free-throws-dev.pid`.
- No app environment files or DB credentials copied; no seed/backfill or DB changes.
- PR49 scripts and dependencies are preserved exactly; package-lock.json is unchanged. PR46 removed the build hook, and build remains plain `next build`. Builds run with DATABASE_URL and PRICE_HISTORY_IMPORT_URL removed.

## Game presentation and controls

The court fills the available viewport below the site's existing chrome. Made/attempt/streak feedback is in a compact HUD; aim uses a world-space reticle and trajectory; charge appears near the ball at the bottom. Reset/help are small SVG buttons inside the court. There is no default slider form or separate control panel. Native sliders remain inside Help > Fine controls, closed by default.

Focus the court. Left/Right or A/D aim, hold Space to build power, release to fire. Power clamps at 100% after 1.6 seconds. Repeated keydown cannot restart a charge. The compact hold button uses the same behavior; court drag/release supports mouse and touch. Enter fires selected power, Up/Down adjusts selected power, R retries, and Escape cancels.

Makes, attempts and streaks stay in memory. A settled shot displays a short result, then automatically returns the next ball at a different random shooting spot; no retry click is needed. Reset clears the score, selects a fresh spot and restores centered aim/50%. Pending retry timers and charges are cancelled on reset/unmount. Blur, hidden tabs, pointercancel and lost capture cancel pending input. Selection/context menus are suppressed on the court and hold button.

Physics remains deterministic: 240 Hz substeps, sphere/torus rim contact, box backboard and floor, bounded speed/position/lifetime, and one full-ball descending scoring-plane make before floor contact. Render triangles are independent of the collision proxies.

## Verified asset integration

Source: `/Users/aidandaly/Downloads/GOAT_HOOPERS_Game_Assets (10).zip`. The download was preserved.

- ZIP size: **2,682,374 bytes**.
- ZIP SHA-256: `ba240e009c991cc7e3959e08d9a64c7fc52302e5489209aac9295e1213ac9cf7`.
- CRC, exact five-file allowlist, relative paths, symlink rejection and total extracted size were checked before extraction.
- Only the game pack was read. The clubhouse ZIP and full arena were not copied or modified.
- Files are in `public/3d/free-throw/`: basketball, court, hoop GLBs, ASSET_MANIFEST.json and README.txt.
- Mesh counts: ball 3,968; court 576; hoop 3,866 (**8,410 triangles** total).
- GLBs are self-contained glTF 2.0; no external buffers/images or decoder extensions.
- Imported PBR base-color, normal, packed roughness/metallic and AO maps are preserved. Backboard alpha blending is preserved.
- No model normalization, scaling or re-centering. The hoop remains at local origin; the court offset is +12.7248 m Z; ball origin stays centered.

The domain imports the shipped manifest as its coordinate source. Scoring plane is 3.048 m; rim centerline 3.038 m; major radius 0.2386 m; tube radius 0.01 m; ball radius 0.12 m. Board box center is `(0, 3.2766, -0.401)`, half-size `(0.9144, 0.5334, 0.02)`. Release Z is 4.191 m, on the transformed free-throw line. Tests compare the exported hoop anchors and ball/court bounds with this contract.

The earlier Library transfer blocker is resolved through the verified user download. No Library retry or Mac Blender run occurred.

## Automated verification

All commands passed in the dedicated checkout:

~~~sh
npm test
npx tsc --noEmit --incremental false
npx eslint src/domain/arcade/free-throw.ts src/surfaces/arcade/free-throw src/three/FreeThrowScene.ts 'src/app/arcade/[gameId]/page.tsx' src/domain/arcade/games.ts
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL npm run build
git diff --check
~~~

The current-main offline suite passed **104 tests**, including the **18 free-throw tests**; three database opt-in tests were skipped. The free-throw tests cover deterministic makes/misses, rim/board response, descending-only/full-ball scoring, floor rebound exclusion, 250 independent resets, 315 bounded control combinations, one charge release/repeat suppression, cancellation/stale keyup, clamping, seeded/nonrepeating position selection, reachable powers at every spot, identical launch-speed calibration across spots, self-contained meshes/PBR maps, glass alpha, ball radius, hoop anchors and translated court alignment.

## Actual browser verification

Chrome desktop and responsive phone viewports were exercised through real UI input. Earlier iPhone XR touch emulation also verified the same captured hold/drag handlers.

| Check | Observed result |
| --- | --- |
| Real GLB loads | All three models rendered; ball/court textures and transparent hoop board visible |
| Desktop Space held about 800 ms | Release at 51%, Swish, 1 / 1, then automatic ready state |
| Repeated desktop shots | 2 / 2 with one make per shot and automatic return |
| Desktop 1.9-second Space hold | Power 100%, one miss, streak zero, automatic return |
| A/D and arrows | Bounded aim changes, reticle and readout follow |
| Off-center shot | One miss and automatic next ball |
| Blur during hold | Charge cancelled, restored power, no attempt after keyup |
| Reset during hold | 0 / 0 at center/50%; stale keyup did not shoot |
| Native tab hiding during hold | Charge cancelled without a shot; temporary tab closed |
| Mobile compact button with real GLBs | About 800 ms hold, 51%, one made shot, automatic return |
| Mobile court drag with real GLBs | 7 degrees right, one miss, 1 / 2 total, streak zero, automatic return |
| Default controls | Zero range inputs and no Your Shot panel |
| Help/fine controls | Open and close inside the viewport; sliders available only on request |
| 390 x 844 | 374 x 660 court; HUD/button above navigation, no horizontal overflow |
| 320 x 568 | 304 x 384 court; button bottom 463.5, above navigation; no horizontal overflow |
| 844 x 390 | 828 x 270 court, button inside viewport; meter moves to the side |
| Random positions after made shot and resets | Ready origin moved to 6.0 m after a made keyboard shot. Three resets chose distinct 6.0 m, left 5.7 m and left 4.2 m positions; camera stayed behind the ball |
| Mobile from a different distance | Hold at 5.4 m released 74% power and made once; 2 / 2 total, then next ball at another spot |
| Chrome reduced-motion emulation | Real prefers-reduced-motion media query true; native Enter immediately produced still Swish, 1 / 1, then automatic ready. Override reset to No emulation |
| Real GPU loss and recovery | WEBGL_lose_context produced an actual webglcontextlost event with isContextLost=true. Readable fallback disabled shooting; restoreContext plus Reload recovered the real assets; selected 50% shot made once (1 / 1) and automatically returned the next ball |
| Loading failure and recovery | Temporarily held the new ball file; readable fallback, shooting disabled. Restored identical SHA-256 bytes; Reload recovered all assets and a made shot |

Evidence:
- `/Users/aidandaly/Documents/Codex/2026-10-07/task-8/evidence/free-throw-assets-desktop.jpg`.
- `/Users/aidandaly/Documents/Codex/2026-10-07/task-8/evidence/free-throw-assets-mobile.jpg`.
- `/Users/aidandaly/Documents/Codex/2026-10-07/task-8/evidence/free-throw-asset-fallback.jpg`.

Temporary responsive overrides were reset. The preview is retained and ready for play. Expected 404/error logging during the forced missing-asset check is separate from successful restored loads. Browser-extension warnings were present.

## Remaining limits

Physical iOS/Android, Safari and throttled performance remain validation work. Reduced-motion, actual GPU context loss and reload recovery, and asset-loading failure paths were forced and recovered in Chrome. WebGL constructor failure and a physical pointercancel event were not injected. The temporary local GPU test harness is removed before delivery.

The stanchion and net are visual geometry; collision proxies cover the rim, backboard and floor. Ball spin is visual and does not alter bounce physics. This stays clearly labeled local practice/prototype. Character animations, league rewards, multiplayer and leaderboard/account/economy integration remain outside scope.

## Changed files

- `src/domain/arcade/free-throw.ts`: manifest-derived asset/collider contract.
- `src/surfaces/arcade/free-throw/{FreeThrowPractice.tsx,FreeThrowPractice.module.css,physics.ts,charge.ts,positions.ts,physics.test.ts,charge.test.ts,positions.test.ts,assets.test.ts}`: in-court HUD, controls, automatic retry, simulation and checks.
- `src/three/FreeThrowScene.ts`: asynchronous GLB/PBR renderer, reticle, resizing and complete resource disposal.
- `public/3d/free-throw/*`: the five verified integration files.
- `src/app/arcade/[gameId]/page.tsx`: thin practice route before game-store/leaderboard reads.
- `src/domain/arcade/games.ts`: local-practice availability copy.
- `package.json`: focused test command using current main’s existing Vitest runner; its scripts and dependencies remain intact.
- `ARCHITECTURE.md` and this record: boundaries and handoff evidence.

## Library screenshot delivery

The actual screenshots were saved successfully as new Library images, with local identity metadata applied; the updated images include the random-position HUD:

- Desktop: `libfile_6c9e8a33fad4819185e4e8622c5c99b0` (`file_000000006f5081f5b1ced77a0a3a8e0b`).
- Mobile: `libfile_a55792a3ee888191856b57c10bca0588` (`file_00000000ba0c81f59174478925e4f221`).

Additional local QA evidence: `evidence/free-throw-reduced-motion.jpg` and `evidence/free-throw-gpu-loss.jpg` in the task workspace. The GPU harness operates only through visible test buttons and the browser’s actual WEBGL_lose_context extension; it is not part of the delivered game.

## Small random-position addition

The initial shot remains at the original free-throw line. Settled shots and reset/retry choose a different one of nine valid court positions, 3.4–6.0 m from the rim. Selection is pure and takes an injected random source for deterministic tests. Origin stays fixed during an attempt, the camera is instantly placed behind it, and aim is relative to the basket. No GLB is reloaded between spots.

All positions use the same 58-degree launch angle and speed/power relationship calibrated at the original line. Every position has a reachable release power. Near bank shots remain possible through actual rim/board collisions; there is no forced miss or random outcome. This is a bounded practice zone, not full-court locomotion, and it adds no rewards or persistence.
