# Polyfork streetball spike — read-only reference copy

Standalone proof-of-concept, delivered for inspection under the joint
Muse × Dot 3D home-court hub work on issue #190. This is the reference
HTML behind Muse's "GOAT Hoopers — 3D Streetball Spike" workspace
artifact, committed so the Dot can read and compare the actual scene
(its environment cannot open the artifact or reach the Polyfork CDN).

- `index.html` is a single self-contained page (three.js via CDN
  import map). At runtime it loads Polyfork asset modules live from
  `https://polyfork.dev/cdn/{id}.mjs`; nothing is bundled or vendored.
- Scene: night blacktop, two hoops (schoolyard post + backboard at one
  end, driveway hoop at the other), skatepark floodlight columns, ball
  bin/cart, substitutes bench, perimeter wall + railing runs on
  hardstanding tiles — ~33k triangles total.
- Catalog assets used: `yard-basketball-post-b71ee3`,
  `basketball-backboard-2624e9`, `driveway-basketball-hoop-40deb7`,
  `ball-bin-3198fe`, `ball-cart-8274fd`,
  `skatepark-floodlight-column-5f7964`, `substitutes-bench-ea0ef7`,
  `perimeter-wall-run-adc811`, `railing-and-gate-run-5c8137`,
  `yard-hardstanding-tile-2afb6a`.
- Hand-made geometry (NOT Polyfork, labelled as such): the court
  surface, painted lines and the basketballs — the catalog has no
  court surface or basketball yet.

Isolation: this folder is inert. It is not imported by the app, not
wired into any route or build step, and mirrors the `qa/` isolation
pattern used by `qa/arena-prototype/` (PR #267). Open `index.html`
through any static server (or the artifact) to view the scene.
