# Approved Blender scenery in Free Throws

On this branch, `/arcade/free-throw` loads the approved outdoor art study as
actual 3D scenery. The original court, hoop, ball, collider/domain manifest,
input/charge helpers, positions, physics and styles remain byte-identical.
The controller has only three visual-effect cancellation edits: create an
AbortController, pass its signal to scene creation and abort on cleanup. Removing
those edits restores its exact original hash; simulation, input, scoring and
reset logic are unchanged. This is separate from ranked rules and the
leaderboard. Ownership continues from [issue199](https://github.com/aidandaly24/goat-hoopers-site/issues/199#issuecomment-6260363083),
with the [updated scope checkpoint](https://github.com/aidandaly24/goat-hoopers-site/issues/199#issuecomment-6282108521).

## Original artwork and derivation

The source is the already approved `GOAT_HOOPERS_Outdoor_Art_Study.blend`, retained
in Library bundle `libfile_b28d1e8cf25c8191ad44b666b4bfd61a`; approved main render
`libfile_5a7de55bd3b48191b8f11ee92a304e46`. Source blend SHA256:
`e2a2c648fa7894692c0b28036799b954d2e279a95c7a2341ec01f6445e7abedc`.
No characters or architecture were recreated and no image generation was used.

`blender/export_free_throw_environment.py` opens that source read-only, keeps
all **416 placements**, and derives two LODs from each of the **25 used
archetypes** in the saved file. Near/far collapse ratios are 42%/25%. Original
applause, cheer and disappointment deltas transfer to the decimated surface
through barycentric coordinates. The GLB contains those original-derived targets.
Terraces, benches, masonry, window reveals, fire escapes, rooftop tanks,
landscaping and fixtures merge into one static mesh at 128,689 triangles.

Authored colors receive baked ambient occlusion. Source roughness, metalness and
emission travel in a `_SURFACE` attribute, allowing one PBR material with distinct
cloth, skin, windows, steel and brass. The original world shader is baked to a
2048×1024 JPEG, sampled directly on a camera-centered sky dome. This avoids an
automatic large background-cubemap conversion. Reflection targets use the same
sky at 256px cubemap resolution on desktop and 128px on portrait layouts.

Export with Blender 4.3.2 and the source file:

```sh
blender -b -t 5 --python blender/export_free_throw_environment.py -- \
  --source /path/to/GOAT_HOOPERS_Outdoor_Art_Study.blend \
  --out public/3d/free-throw/environment
```

CI consumes checked-in exports; it needs neither Blender nor Library access.
The asset manifest records source identity, placement data, geometry counts and
payload sizes. Its `runtime_tested: false` describes the export step; browser
evidence is recorded separately against the exported asset hash.

## Runtime and tradeoffs

The standard GLB is 18,331,516 bytes; its explicit gzip is 4,019,050 bytes. The
sky is 297,070 bytes, plus the placement manifest. Browsers with streaming gzip
request the compressed file; others have a standard GLB fallback. No new
dependency, external decoder, service, credential or API endpoint is introduced.

Spectators are instanced by archetype, LOD and reaction cohort. Camera/frustum
selection runs only on a shot-origin or viewport change; all placements remain
available as the player moves. Touch/narrow layouts use the far crowd LOD and
vertex-lit scenery; desktop keeps source-surface PBR. Original court, hoop and
ball materials remain PBR on both. This phone tradeoff reduces fragment work
while retaining modeled volume, colors, occlusion and all placements.
During a completed-result cue, original morph deltas blend once per shared
cohort on the CPU, then render through ordinary GPU instancing. This avoids
per-instance morph-texture fetches. Resting/aiming/charging/flight have no crowd
animation loop. The existing React result/streak is the sole reaction source.
The 420ms cue has both a frame budget and a deadline, including its first paint.
Reduced motion uses a fixed pose; hidden/offscreen work stops.

This retains the approved composition and model family, with reduced tiny facial
and architectural detail. Offline procedural fabric/brick bump, Cycles lighting
and full path-traced shadows are approximated by vertex color/AO, PBR lighting
and the baked sky. There are no new shadow maps. These tradeoffs are visible in
the actual browser captures; the original render is a fidelity reference, never
presented as the playable result.

Scenery failure retains the playable original court with a plain sky. Context
loss stops drawing. Teardown frees owned geometry, textures, observers, timers,
programs and the WebGL context. Three 0.186.1 keeps a module-global 16×16 RG16F
DFG lighting lookup (1KiB); its diagnostic texture counter can remain at one
after disposal. The context-release check covers its GPU allocation too.

Required ball/court/hoop loading alone controls practice readiness. Optional art
loads concurrently, has a 20-second deadline and is cancelled on effect cleanup
or required-load/context failure. Completed siblings are released immediately;
late geometry/image decodes are disposed without mounting. Unmount can release
the renderer/context before any pending request settles. A successful late
arrival uses the latest camera/ball/result state and replaces fallback lighting.

Every draw keeps simulation-facing ball/guide/camera/reset bookkeeping current,
but GPU submissions and reflection generation require native visibility. An
actual offscreen shot therefore continues the unchanged simulation, score and
automatic retry without submitting frames, and redraws current state on return.
The [P1/P2 regression receipt](../qa/free-throw-art/evidence/lifecycle-regressions.json)
covers unresolved optional requests, early unmount, native timeout, late
offscreen arrival and native offscreen flight/reset. Unit tests separately cover
decoded siblings and late decoders after cancellation, including an abort-ignoring
manifest transport and cancellation through a fully mounted promise handoff.

## Measured browser evidence

The production-built Vite fixture imports the actual `FreeThrowPractice` and
`FreeThrowScene`; it does not substitute a game controller or rendering mock.
The baseline uses the unchanged #206 practice source and assets. The optional old-game screenshot did
not materialize locally; the parent inspected it. Comparisons use actual
baseline rendering and the original approved render, with no further transfer
retry or user action required.

Measurements are headless Chromium/ANGLE **SwiftShader software rendering**.
Phone measurements use 390×844, touch, DPR2 capped by the existing 1.75 renderer
cap, 4× CPU throttling, 4Mbit/s download and 80ms latency. HTTP cache is disabled;
contexts share a browser/GPU process. They are **not physical-phone GPU results**.

Completed-draw samples include one-pixel GPU→CPU readback. They are a conservative
readback-inclusive measurement, not FPS. CPU submission timing is separate;
`gl.finish()` alone undercounted completed-frame work in this browser and is not
used for the final figures. Sampling collects up to 30 draws, stopping after a
five-second budget with at least three samples. V8 heap excludes graphics-driver
memory and some external buffers; geometry attribute bytes and reflection target
bytes are reported separately rather than being called a measured GPU total.

| Profile | Court ready | Full-art completed draw | Draw + readback median / p95 | Calls / triangles | 3D transfer | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline-desktop | 4.79s | 5.00s | 193.1 / 218.5 ms | 13 / 11,188 | 3,117,828 B | 26 |
| blender-desktop | 0.83s | 8.34s | 2659.6 / 2706.2 ms | 44 / 435,282 | 7,443,962 B | 3 |
| baseline-phone-emulation | 8.14s | 10.74s | 185.4 / 212.6 ms | 13 / 11,188 | 3,117,828 B | 27 |
| blender-phone-emulation | 11.91s | 18.81s | 1004.7 / 1054.7 ms | 27 / 234,925 | 7,443,962 B | 5 |

Court readiness measures the required-asset view API; full-art timing additionally waits for scenery and one completed draw/readback. Neither value is a physical-device estimate.

Candidate samples are few because software draws exhaust the time budget; p95 is only the observed sample quantile, not a statistically stable device percentile.

Centered candidate views select 259 spectators (38 near / 221 far) on desktop and 91 far spectators on phone. Across all nine origins, desktop peaks at 49 calls / 455,679 triangles; phone peaks at 29 calls / 262,787 triangles. The automated 60-call / 650k-triangle bounds detect export regressions; they are not an approved device-performance budget.

The candidate V8 heap after GC is 5,292,128 B / 5,371,540 B (desktop / phone). Geometry attribute payloads are 19,212,552 / 18,595,392 B; reflection targets are 6,291,456 / 1,572,864 B. These figures exclude other texture, browser and driver allocations. All owned geometry/program counters reach zero at teardown, followed by actual context loss.

Added art transfer is 4,326,134 bytes (4.13 MiB) in this gzip-serving fixture. It slightly exceeds the art study's provisional 2–4 MiB target; desktop geometry also exceeds its provisional 150k–250k added-triangle target. Budget acceptance and any further reduction remain review decisions. The software GPU is substantially slower with the richer scene, so these results are not a real-time performance sign-off.

Review [actual desktop](../qa/free-throw-art/evidence/blender-desktop.png), [phone](../qa/free-throw-art/evidence/blender-phone-emulation.png), [unchanged baseline](../qa/free-throw-art/evidence/baseline-desktop.png) and the [approved Blender reference](../qa/free-throw-art/evidence/approved-blender-reference.png). The [complete receipt](../qa/free-throw-art/evidence/browser-verification.json) includes source/asset hashes, individual profiles and controller/lifecycle observations; the [preservation audit](../qa/free-throw-art/evidence/preserved-gameplay.json) records the unchanged files.


## Reproduce and release gates

Use the repo's Node22 version. Build the fixture twice, with an unchanged source
checkout for the baseline, and serve both with `qa/free-throw-art/serve.mjs`.
`FREE_THROW_QA_SOURCE` selects that baseline `src`; `FREE_THROW_QA_OUTPUT` selects
the private build directory. The server is GET/HEAD-only and uses no app data or
credentials. Run the verifier with already installed tools:

```sh
node qa/free-throw-art/verify.mjs /path/to/playwright/index.mjs \
  /path/to/chromium /path/to/private-evidence
```

Evidence covers all nine shot origins, retained source hashes, idle drawing,
finite result cues, native mid-flight reduced-motion changes, actual
keyboard/touch shot starts and accessibility-mode completion, a complete native
normal-motion shot at 320×360 DPR1, retry/reset,
offscreen behavior, failed scenery, context loss and teardown. Network interception
blocks external requests and non-GET writes. Unit checks parse the actual shipped
GLB and test placements, LODs, morph-derived poses, bounded geometry and disposal.

Final exact-head tests/typecheck/contracts/lint/production build and CI must pass.
Dot and Muse must agree on that same head before merge. Physical-device review
and the deployed route remain release checks; these software-rendered profiles
do not establish phone FPS or claim the production site is already updated.
Uninterrupted normal-motion shots at full resolution exceeded the software-GPU
test's time budget. The existing simulation discards excess wall time after a
slow frame; it is unchanged. Physical GPU validation of that uninterrupted path
is required before merge, along with native hidden-tab and displayed animation
review. Compact-viewport and reduced-motion completion do not establish those
full-resolution properties.

Independent original-source/export reproduction also remains unverified: the
independent reviewer's authorized Library transfer returned proxy403. No transfer
bypass, credential change or release was attempted. Existing owner source identity
and shipped-asset checks do not replace that independent reproduction.

The production Next verifier additionally loads the actual route and shared site
shell on desktop/phone, checks the exported asset URLs and completes a native
reduced-motion shot through the unchanged controller. It uses no application
credentials, and blocks server-side external fetches. Reproduction and captured
evidence are linked from [the QA folder](../qa/free-throw-art/README.md).

The [cue video](../qa/free-throw-art/evidence/crowd-cues.mp4) records real Chromium
compositor frames at 320×360 DPR1. Fixture-triggered miss/make/streak/reduced cues
run the original runtime scheduler, with no manual pose stepping. Capture
overhead and the software GPU affect displayed cadence; it remains a visual
debugging artifact rather than physical-device timing evidence.
