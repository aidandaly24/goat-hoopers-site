# Polyfork home-court hub skeleton — read-only reference copy

Standalone skeleton, delivered for inspection under the joint Muse × Dot
3D home-court hub work on issue #190. Companion to the streetball spike in
`qa/polyfork-streetball-spike/` (same court, same assets): where the spike
proved the scene renders, this skeleton proves the *hub* — the court as the
homepage front door, with the league's sections as places on it. This is
the reference HTML behind Muse's "GOAT Hoopers — Home-Court Hub
(Skeleton)" workspace artifact, committed so the Dot can read and run the
actual scene (its environment cannot open the artifact).

- `index.html` is a single self-contained page (three.js via CDN import
  map). At runtime it loads Polyfork asset modules live from
  `https://polyfork.dev/cdn/{id}.mjs`; nothing is bundled or vendored.
- Scene: the spike's night blacktop (two hoops, floodlights, benches,
  ball cart/bin, railings, wall run) plus five zone installations —
  ~38.6k triangles, 54 draw calls total.
- Verification record from the build: render-verified from a local module
  mirror, because this VM has no direct CDN egress — every module URL
  confirmed HTTP 200 and the identical code rendered locally. The hosted
  artifact is its first true hosted render.

## Zone map

| Zone | Anchor on the court |
|---|---|
| AI Decides (`ai-decides`) | The catalog scoreboard (`match-scoreboard-58f51e`) at the far baseline |
| Studs & Chuds (`studs-chuds`) | Hand-made billboards |
| League stats (`stats`) | Plinth by the near hoop |
| Your Team (`your-team`) | The west benches |
| Arcade (`arcade`) | The far hoop |

## Interaction model

- **Tap vs drag:** a press that moves ~8px or less is a tap; anything
  more is an orbit drag, so dragging the camera never triggers
  navigation.
- **Camera flights:** tapping a zone (in-scene or via the zone row)
  flies the camera to that zone's framing with an ease-out flight;
  **Back to full court** returns to the overview.
- **Zone row:** five buttons under the canvas give every zone a plain
  non-3D target — the 3D layer is never the only path.
- **Reduced motion:** instant cuts instead of flights, and no idle
  auto-rotate.
- **WebGL fallback:** if WebGL is unavailable, the page shows a fallback
  message instead of a black canvas.

## Rendering posture

- **Event-driven rendering:** the scene renders on interaction and state
  change, not in a perpetual animation loop. Measured in the build
  audit: 122 draw calls over 2.5s parked, vs ~8,100 for a naive
  always-render loop at the same scene.
- Budgets are design inputs: the whole scene stays under a 150k-triangle
  cap (~38.6k actual) so a phone GPU holds it comfortably.

## Honest placeholders

- Panels carry **no live data** — each zone's panel says so, and nothing
  in the skeleton fetches or invents league state.
- The scoreboard's "00 00" is the model's **own texture**, not wired
  data.
- Hand-made geometry (NOT Polyfork, labelled as such): the court
  surface, painted lines and the basketballs — the catalog has no court
  surface or basketball yet. The Studs & Chuds billboards are also
  hand-made signage.

## Running it / inspection notes

- Open `index.html` through any static server with normal internet
  access and it runs as-is (three.js from unpkg, asset modules from
  polyfork.dev).
- On a machine without direct CDN egress (like this VM), mirror the
  module URLs locally first — the same caveat and method as the spike's
  verification. This skeleton loads its assets from the CDN by id, like
  the spike HTML does; the three GLBs already landed in this PR sit
  under `qa/arena-prototype/assets/polyfork/` with their provenance.
- **No merge is needed or requested.** This is an inspection handoff on
  an already-open draft PR — read it, run it, compare it. Nothing here
  is a merge candidate.

Isolation: this folder is inert. It is not imported by the app, not
wired into any route or build step, and mirrors the `qa/` isolation
pattern used by `qa/arena-prototype/` (PR #267) and
`qa/polyfork-streetball-spike/` in this PR.
