# Selected A logo publication

Aidan selected **A · Swept horns** on October 9, 2026 (“A swept horns btw”). The new long-muzzle goat replaces the circular horned basketball at the five existing `public/courtside/GOAT-HOOPERS-*.svg` URLs and `src/app/icon.svg`. Existing header/footer/homepage consumers keep their filenames, intrinsic SVG dimensions and markup. No shell, navigation, theme, data, game or other artwork changes are included.

The new editable family is [design/brand/swept-horns](../design/brand/swept-horns/README.md): 15 palette/lockup SVGs plus the adaptive favicon. Original Selected Hybrid sources and dated comparison artifacts remain historical evidence with unchanged archive hashes and provenance. Every GOAT / HOOPERS / DYNASTY BASKETBALL outline, transform and spacing after the old emblem group remains byte-identical. The new emblem is the exact selected A anatomy; the micro silhouette omits interior seams below 48px.

Favicon light mode retains existing clay `#A54429`; dark mode uses existing cream `#F0D5B5` for visibility. Its SVG-local `prefers-color-scheme` rule changes only fill, with no script, external request or shared stylesheet change. [MDN's SVG media-query guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme) supports embedded SVG theme rules. Fallback is clay. Browser favicon/theme behavior is a reviewer gate below, not an inferred pass from the source rule.

## Ownership and review gate

Aidan's Dot owns branch `dot/selected-swept-horns`, base `f5be2b7ee6821ed8f69e22ca8782abb2a7192ea8`. In-progress HOLD note was posted on #91 before edits. PR93 is merged and untouched. Eight current open PR file lists were checked; no asset overlap. PR113/#84 retains shared-shell and DESIGN.md ownership; PR110 retains rejected-hooper removal. DESIGN.md's older logo decision needs the coordinator's narrow reconciliation after reviewing this selected publication. This PR intentionally avoids those concurrently owned files.

**Draft / HOLD MERGE.** Independent exact-head artwork/source review is required. No self-merge or deployment. `vercel.json` remains unchanged with `git.deploymentEnabled=false`.

## Validation

Run `python3 scripts/verify-swept-horns-logo.py` (standard library, offline). The checked-in [artifact receipt](../qa/selected-swept-horns/validation.json) validates complete palette/lockup coverage, exact selected anatomy, intrinsic sizes/viewBoxes, transparent masks, no script/external/image/font dependency, source/runtime byte identity, exact original lettering suffixes, stable consumer URLs, preservation of historical sources and concurrently owned files, and deployment hold.

The locked cached Next 16.3.8 metadata loader was exercised with its real URL/hash/MIME/image-size helpers and no native installation hook or application build. [Receipt](../qa/selected-swept-horns/metadata-check.json): `type=image/svg+xml`, `sizes=any`, `/icon.svg?b1a6fe24805eff52`. This checks generated metadata, not a browser tab or HTTP route.

The [public vector proof](../qa/selected-swept-horns/selected-A-production-proof.svg) uses actual production geometry. The [native Library raster proof](https://chatgpt.com/api/library/files/libfile_db6ce0b1c9088191a74365502cdbadf9/download) shows black/Paper, white/Slate, primary clay, 208px desktop and 109/90px phone header footprints, and exact 16/32px favicon exports. Header sizes derive from current CSS; no real route or full shell rendering is claimed. Tiny enlarged previews use nearest-neighbor scaling and add no detail. Favicon media branches were explicitly forced for the artifact exports.

A local embedded-SVG [browser fixture](../qa/selected-swept-horns/browser-proof.html) is supplied for reviewer use. Computer Use rejected the `file://` fixture URL because its browser URL security policy permits only `http:` and `https:`. No alternative browser surface, local-server workaround, raw CDP or settings change was attempted. Actual browser favicon caching/media switching, hosted route rendering and physical-device appearance remain unverified. Normal remote CI supplies full offline suite/typecheck/production compilation; bind its result to the final published head before review.

— Aidan's Dot
