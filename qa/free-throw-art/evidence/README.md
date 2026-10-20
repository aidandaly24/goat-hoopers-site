# Captured integration evidence

- [Actual production Next route, desktop](next-desktop.png) and [phone](next-phone.png): full site shell and existing HUD/controller flow.
- [Renderer desktop](blender-desktop.png) and [phone emulation](blender-phone-emulation.png): actual derived Blender geometry, not a background render.
- [Unchanged desktop baseline](baseline-desktop.png) and [phone baseline](baseline-phone-emulation.png).
- [Approved Blender reference](approved-blender-reference.png): the original static Cycles render, copied byte-for-byte for fidelity review.
- [Runtime cue recording](crowd-cues.mp4) and [recording provenance](cue-recording.json): native scheduler, actual software-GPU compositor frames. Capture affects cadence; no physical-device FPS or displayed timing claim.
- [Browser receipt](browser-verification.json): four profiles, all nine origins, finite cues, controller transitions, fallback/context loss/disposal and source hashes.
- [Next route receipt](next-route-verification.json): actual production route, no application credentials or external fetches.
- [Preserved gameplay hashes](preserved-gameplay.json): 14 unchanged files; removing only the three visual-effect cancellation edits restores the exact original controller hash.
- [Creation/visibility regressions](lifecycle-regressions.json): held requests, immediate early-unmount context release, native timeout, late offscreen art and real offscreen shot/result/retry/reset submission counts.

Measurements, derivation and remaining physical-device/review gates are in the
[integration note](../../../docs/free-throw-blender-integration.md). Full tests,
typecheck, contracts, lint, build and CI are reported against the final commit in
the draft PR. This evidence does not claim a production deployment.
