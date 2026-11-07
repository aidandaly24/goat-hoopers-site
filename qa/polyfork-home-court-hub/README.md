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
- **v2 pass (2026-10-28, smoothness + review fixes):** re-measured
  headlessly at 390×844 and 1440×900 with the same scripted
  tap-flight/park protocol before and after. Per rendered frame the GL
  work dropped from 60.8 calls / 106,228 triangles to 20.7 calls /
  36,455 triangles at phone size (63.7 / 106,190 → 26.7 / 36,536 on
  desktop): the three shadow maps are baked once at load instead of
  re-rendered every frame, and the pixel ratio is capped at 1.75.
  Absolute frame times on this VM are software-raster bound (a
  one-cube control page runs at 1.5 fps under SwiftShader on 2 vCPUs),
  so the transferable evidence is per-frame work and loop behavior,
  not this rig's fps.

## Zone map

| Zone | Anchor on the court |
|---|---|
| AI Decides (`ai-decides`) | The catalog scoreboard (`match-scoreboard-58f51e`) at the far baseline |
| Studs & Chuds (`studs-chuds`) | Hand-made billboards |
| League Stats (`stats`) | Plinth by the near hoop |
| Your Team (`your-team`) | The west benches |
| Arcade (`arcade`) | The far hoop |

## Interaction model

- **Tap vs drag:** a press whose pointer travels ≤8px at its furthest
  point (not just where it ends) is a tap; anything more — or a
  cancelled/second pointer — is an orbit drag, so dragging the camera
  never triggers navigation, even if the pointer returns to its start.
- **Camera flights:** tapping a zone (in-scene or via the zone row)
  flies the camera to that zone's framing with a velocity-continuous
  smootherstep flight (no ease-out jolt at departure); **Back to full
  court** returns to the overview.
- **Zone row:** five buttons under the canvas give every zone a plain
  non-3D target — the 3D layer is never the only path. The row and the
  panels are bound before, and independently of, the 3D renderer: with
  WebGL forced to fail, or the 3D module import blocked outright, all
  five buttons still open their panels (verified headlessly both ways).
- **Intro, then parked:** on load the court makes one slow 6-second
  intro rotation and then stops for good — returning home does not
  restart it. A settle step drains OrbitControls' damping tail so the
  render loop truly halts instead of creeping on 'change' events.
- **Reduced motion:** instant cuts instead of flights, and no intro
  rotation.
- **WebGL fallback:** if WebGL is unavailable, a dismissible note
  explains the situation without blocking the page; the zone row and
  panels stay fully usable (see above).

## Rendering posture

- **Event-driven rendering:** after the bounded intro, the scene
  renders on interaction and state change only — no perpetual
  animation loop. Measured with the v2 protocol: the loop halts ~1.5s
  after the intro window closes, with 0 animation-frame registrations
  over 2.5s parked at both the overview and inside a zone, at both
  viewports. (The earlier build never parked at the overview at all —
  its idle auto-rotate kept the loop alive indefinitely.) In-zone
  parked registrations went from 2–3 strays per 2.5s to 0.
- **Baked shadows:** the night look keeps all three shadow-casting
  lights, but their shadow maps render once at load
  (`shadowMap.autoUpdate = false`) instead of every frame. The only
  cost: the scoreboard cards' and hoop nets' gentle sway no longer
  moves their shadows — imperceptible at night scale.
- Budgets are design inputs: the whole scene stays under a 150k-triangle
  cap (~38.6k actual in the main pass) so a phone GPU holds it
  comfortably.

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
