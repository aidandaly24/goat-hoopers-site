# Corrected complete-page captures

Use these JPEGs, all under 900,000 bytes at original document width:

| View | Full image | Actual top / middle / bottom pixels | Dimensions | Bytes |
| --- | --- | --- | --- | ---: |
| Default desktop, light | [JPEG](public-desktop-full.jpg) | [Checkpoints](public-desktop-full-checkpoints.jpg) | 1440 × 7657 | 869,974 |
| Member desktop, dark | [JPEG](member-dark-full.jpg) | [Checkpoints](member-dark-full-checkpoints.jpg) | 1440 × 8710 | 872,997 |
| Default phone, dark | [JPEG](public-390-full.jpg) | [Checkpoints](public-390-full-checkpoints.jpg) | 390 × 10904 | 876,522 |
| Member phone, dark | [JPEG](member-390-full.jpg) | [Checkpoints](member-390-full-checkpoints.jpg) | 390 × 12804 | 860,950 |

These use the refined open composition. All real homepage components, dates,
approved identity/media, controls and 228 roster references remain; current
scores/values/form/news/picks are labelled synthetic. Original arena geometry
is not labelled as Polyfork. Muse's actual scene/asset handoff and review are
pending; see [the joint design record](../DESIGN-REVIEW.md).

The old native fullPage PNG originals are preserved for traceability. The tall
ones repeat pixels after 8192px and **are not valid complete-page evidence**.
The old member phone opening PNG is also an earlier composition, not the new
layout. Do not deliver these originals as current review screenshots.

The JPEGs above are assembled from bounded viewports at recorded integer
document offsets. Fonts/local images settle first. Only during capture, the
sticky header becomes static, animations/caret are suppressed, and the initial
scroll is restored afterward. No content/link/field/handler changes. The
capture inventory checks all ten teams and 228 unique roster references.

[Capture evidence](capture-evidence.json) contains tile offsets, heading/footer
positions, source hashes and independent pixel checks. All 12 top/middle/bottom
comparisons pass: 11 are pixel-exact; member-desktop top has sparse text raster
variation (439 of 1,440,000 pixels, mean channel error 0.000553/255). Its limit is
0.1% changed pixels and 0.02/255 mean error, which cannot admit a repeated or
missing page region. OCR of each actual JPEG confirms the section sequence and
footer/copyright, and the checkpoint sheets show those footer pixels directly.

The original browser probe covered text/link preservation, keyboard roster
disclosure/search/sorting, standings sorting, 390/320px reflow, 44px review
controls, 200% text, reduced motion, Save-Data, live disposal/reopen, actual WebGL
context loss, missing editorial and no external requests. Final-head rerun
results are recorded in the PR. One static scene measures 19,446 triangles / 56
calls with no idle/scroll loop; this is software Chromium, not a physical-device
or hardware-GPU benchmark. Screen readers/live auth/data remain untested.

The requested Library batch previously failed at its initial helper tools/list
network step before prepare/upload/finalize. No Library item or ID was created;
the failed path was not retried. These accessible repository JPEGs are the
delivery fallback. No merge, production route change or deployment occurred.
