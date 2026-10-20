# Blender integration review

This fixture imports the real practice component and renderer. Only `next/link`
is adapted for Vite. The production Next route is checked separately; neither
fixture uses application credentials or writes to a database.

Use Node 22 and the repo's installed dependencies. No package changes are needed.
With the original approved `.blend` available, the exporter and source identity
are documented in [the integration note](../../docs/free-throw-blender-integration.md).

Build the candidate:

```sh
FREE_THROW_QA_OUTPUT=/tmp/goat-art-new node node_modules/vite/bin/vite.js build \
  --config qa/free-throw-art/vite.config.mts
node qa/free-throw-art/serve.mjs /tmp/goat-art-new public 8799
```

Build an unchanged baseline using the same fixture and dependencies, then serve
it in another terminal. `FREE_THROW_QA_SOURCE` points to that checkout's `src`:

```sh
FREE_THROW_QA_SOURCE=/path/to/baseline/src FREE_THROW_QA_OUTPUT=/tmp/goat-art-old \
  node node_modules/vite/bin/vite.js build --config qa/free-throw-art/vite.config.mts
node qa/free-throw-art/serve.mjs /tmp/goat-art-old public 8800
```

Run with an already installed Playwright module and Chromium:

```sh
node qa/free-throw-art/verify.mjs /path/to/playwright/index.mjs \
  /path/to/chromium /tmp/goat-art-evidence
```

The verifier records actual canvas PNGs, source/asset hashes, transfer, software
rendering measurements, all shot origins and lifecycle checks. It also exercises
the actual keyboard/touch controller and native reduced-motion changes. A small
320×360 DPR1 native viewport checks an uninterrupted normal-motion shot on the
software GPU. `FREE_THROW_QA_CONTROLS_ONLY=1` skips the four renderer profiles for
targeted controller checks. Brief result screens are recorded with a DOM
observer so a delayed DevTools query cannot miss the existing retry window.

Run the focused creation/visibility regressions against that same candidate server:

```sh
node qa/free-throw-art/verify-lifecycle.mjs /path/to/playwright/index.mjs \
  /path/to/chromium /tmp/goat-art-lifecycle-evidence
```

It holds real optional/required requests unresolved, plays the actual court,
unmounts before response settlement, checks native context loss and the scenery
deadline, delivers art while offscreen, and follows a native offscreen shot
through result/retry/reset with zero WebGL draw calls. The fixture exposes only
test-side unmount/context/submission/IntersectionObserver measurements; it uses
the real component and simulation throughout.

After a production application build, verify the actual `/arcade/free-throw`
route, real site shell, asset URLs and controller on desktop and phone layouts:

```sh
node node_modules/next/dist/bin/next build
node qa/free-throw-art/verify-next.mjs /path/to/playwright/index.mjs \
  /path/to/chromium /tmp/goat-art-next-evidence
```

The second script owns a temporary localhost:8810 Next process. It blanks app
credentials and uses the existing external-fetch guard. Its UI shots use native
reduced motion; the Vite fixture covers normal motion separately.

With the Vite candidate server running, record real compositor frames of the
native miss/make/streak/reduced cue scheduler using an installed FFmpeg binary:

```sh
node qa/free-throw-art/record-cues.mjs /path/to/playwright/index.mjs \
  /path/to/chromium /path/to/ffmpeg /tmp/goat-art-cue-evidence
```

The video preserves the compositor timestamps. It uses a small native viewport
to keep software capture practical; it does not manually step the morph poses.

Review the captured browser images against the approved Blender render. These
are different rendering pipelines: source geometry/composition survives, while
Cycles shadows and procedural bump are approximated by vertex AO and runtime
lighting. SwiftShader profiles and screenshot review do not establish physical
GPU FPS, full-resolution shot pacing or displayed reaction duration. Those,
native hidden-tab behavior and exact-head Dot/Muse review remain release gates.
