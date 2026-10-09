# Viewer verification

Use Node22 and the existing dependencies (`npm ci`). No additional test or
DOM packages are required. Application and import database URLs must be absent.

```sh
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL npm test
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL npm run typecheck
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL npm exec -- eslint src/three/GLBViewer.tsx src/three/__tests__ src/surfaces/teams/TeamProfile.tsx
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL npm run build
```

`GLBViewer.test.ts` invokes the actual component effect with fake React hooks,
browser APIs, renderer and GLTF loader. Three's scene, materials, textures,
skeleton, camera and animation mixer are real. It checks constructor/setup/
load/frame/resize/animation errors, partial cleanup, shared-resource disposal,
stale completions, context loss, reduced motion and successful controls.
It is an effect harness, not a React DOM mounting test.

The browser fixture mounts real React components in StrictMode, including the
actual TeamProfile and PropViewer callers. Its props are synthetic domain
objects; player headshots use the existing initials fallback. It uses the
checked-in GLBs, with no application layout, data loaders or database. Its
local content policy permits local assets and embedded GLB texture blobs.

```sh
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL node node_modules/vite/bin/vite.js --config src/three/__tests__/browser/vite.config.mts
```

Open `http://127.0.0.1:4173/src/three/__tests__/browser/index.html` with:

- `?mode=normal`: team identity plus the unrelated basketball prop’s WebGL renderer/animations.
- `?mode=disabled`: canvas WebGL context acquisition returns null before React
  mounts; the real Three renderer constructor fails. This simulates an
  unavailable context without changing browser/GPU settings or launch flags.
- `?mode=load-error`: local GLB requests receive a synthetic 404.

Check the team avatar/initials, record/history/roster and player link. Team
profiles have no figurine or WebGL dependency; generic prop fallback remains. Test 320px, 390px and desktop widths, repeated remounts,
unmount/mount, pointer/Enter/Space activation and visible keyboard focus.
In normal mode, **Lose real WebGL context** uses `WEBGL_lose_context`; only
the prop viewer should fall back, and **Remount viewer** should recover.
There is no automatic retry or production reload.

The fixture server binds only `127.0.0.1:4173` with a strict port. If the
sandbox blocks it, use the supported approval path; stop if denied.
Do not navigate fixture player links into real app routes or visit production.

Coverage limits: browser checks are manual, not a new automated browser stack.
The effect harness does not model React reconciliation; the real fixture
covers mounting and StrictMode. GPU driver/device variation, genuine browser
launch-flag disabling, screen-reader output and hosted preview/production
routes require separate validation. The existing Three.Clock deprecation
warning is outside this resilience fix.
