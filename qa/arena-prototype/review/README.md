# Continuous slate — complete-page review captures

The four JPEGs below show the current composition at full document width.
All are under 900,000 bytes. Source runtime: `8e6ca35853853f0f32206435db4ef04477378094`;
subsequent delivery changes add documentation, a scoped typecheck config and
these evidence files. Parent records final-head checks separately.

| View | Full image | Actual top / middle / bottom | Dimensions | Bytes |
| --- | --- | --- | --- | ---: |
| Default desktop, light | [JPEG](public-desktop-full.jpg) | [Checkpoints](public-desktop-full-checkpoints.jpg) | 1440 × 7912 | 829,037 |
| Member desktop, dark | [JPEG](member-dark-full.jpg) | [Checkpoints](member-dark-full-checkpoints.jpg) | 1440 × 8930 | 872,724 |
| Default phone, dark | [JPEG](public-390-full.jpg) | [Checkpoints](public-390-full-checkpoints.jpg) | 390 × 12126 | 852,887 |
| Member phone, dark | [JPEG](member-390-full.jpg) | [Checkpoints](member-390-full-checkpoints.jpg) | 390 × 13831 | 854,886 |

Each image also has normal-size `-top.jpg`, `-middle.jpg`, `-bottom.jpg` crops
and actual JPEG OCR text in this directory. [Six-state viewport evidence](continuous/)
includes top, portraits, reading transition, faces, directory transition and
bottom for public/member desktop and both phone themes. Actual CSS gives every
section one grey/slate field and translucent reading veil, without opaque resets
or section posters. The compact WT badge and team-name contrast are corrected.

All real homepage content, approved dates/identities/media, controls and 228
roster references remain. Current scores, values, form, news and picks are
labelled synthetic. Original court geometry is distinguished from the three
verified local Polyfork props. See [provenance](../assets/PROVENANCE.md) and
[the joint design record](../DESIGN-REVIEW.md). Muse's final-head judgment remains
pending; older passes do not apply to this revision.

Old native fullPage PNG originals are preserved unchanged for traceability.
The tall ones repeat pixels beyond 8192px and **are not current complete-page
evidence**. The old member-phone opening PNG and contrast.json are also superseded; use
continuous/backdrop-evidence.json for current contrast bounds.

The JPEGs use bounded viewport tiles and recorded integer document offsets.
Local fonts/images settle first. Capture-only CSS makes the sticky header
static without changing its in-flow size and suppresses animation/caret;
content, links, fields and handlers remain identical. Initial scroll is restored.
[Capture evidence](capture-evidence.json) records every tile/crop offset, actual
headings/footer position, image hash and independent top/middle/bottom pixel
comparison. The viewport-anchored background is compared at matching scroll
anchors, including the final overlapping tile's actual crop. Non-media raster
variation stays below 0.1% materially changed pixels and 0.02/255 mean channel
error. Recorded filtered-media noise has a separate 12/255 per-channel bound;
overall mean error stays below 0.2/255. Actual-JPEG OCR checks ordered sections
and footer/copyright. No screenshot-only background edits were made.

18 browser checks cover content/link preservation, keyboard directory and
standings controls, 390/320px reflow, 44px review controls, 200% text, reduced
motion, Save-Data, live disposal/reopen, actual context loss, missing editorial
and no external requests/errors. Six backdrop checks also verify initials fit,
computed team-label contrast, section transparency and actual slate pixels.
One static renderer uses at most 21,353 triangles / 71 draw calls with no idle or
scroll loop. Scoped TypeScript, ESLint and the Vite build pass. The repository
Next build is blocked by its Turbopack symlink root and, with --webpack, the
unchanged AccountPage generated type error; see ../BACKGROUND-REVISION.md.
These are software Chromium checks, not physical-device, hardware-GPU,
screen-reader or live-auth/data verification.

The earlier Library helper failed before prepare/upload/finalize. Parent has
since saved the prior four JPEGs; replace those same Library identities rather
than creating new items. No helper retry or Library ID fabrication occurred.
The source originals and filenames are preserved. No production route change,
merge or deployment occurred.
