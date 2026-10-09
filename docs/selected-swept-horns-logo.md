# Selected A logo publication

Aidan selected **A · Swept horns** on October 9, 2026 (“A swept horns btw”). The new long-muzzle goat replaces the circular horned basketball at the five existing `public/courtside/GOAT-HOOPERS-*.svg` URLs and `src/app/icon.svg`. Existing header/footer/homepage consumers keep their filenames, intrinsic SVG dimensions and markup. No shell, navigation, theme, data, game or other artwork changes are included.

The new editable family is [design/brand/swept-horns](../design/brand/swept-horns/README.md): 15 palette/lockup SVGs plus the adaptive favicon. Original Selected Hybrid sources and dated comparison artifacts remain historical evidence with unchanged archive hashes and provenance. Every GOAT / HOOPERS / DYNASTY BASKETBALL outline, transform and spacing after the old emblem group remains byte-identical. The new emblem is the exact selected A anatomy; the micro silhouette omits interior seams below 48px.

Favicon light mode retains existing clay `#A54429`; dark mode uses existing cream `#F0D5B5` for visibility. Its SVG-local `prefers-color-scheme` rule changes only fill, with no script, external request or shared stylesheet change. [MDN's SVG media-query guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme) supports embedded SVG theme rules. Fallback is clay. Standalone SVG media observations are distinct from native browser-tab appearance/cache and site-local preference.

## Ownership and review gate

Aidan's Dot owns branch `dot/selected-swept-horns`. Original publication scope base was `d80e9c4d515b7aed0a09998caaa6f1a1d9a92057`; source provenance retains the original authoring history. In-progress notes were posted before edits. PR93 is merged and untouched. The current ordinary integration refresh uses main `71fa01451e71228ee67d5916af9d884647ebb65a`, preserving all 63 inherited navigation, GM IQ and Transactions paths exactly. Shared source, DESIGN.md, configuration and historical assets are byte-identical to that base; this PR adds only its owned artwork and evidence. Theme PR132 remains a separate input.

**Source/artwork clear at old head `53e9915e15f54ebcc2bc3771c03b391bb406d299`.** The reviewed artwork and provenance remain byte-identical. Draft pending normal remote CI and independent final-head integration clearance; no author merge or deployment. `vercel.json` remains unchanged with `git.deploymentEnabled=false`.

## Validation

Run `python3 scripts/verify-swept-horns-logo.py` (standard library, offline). The checked-in [artifact receipt](../qa/selected-swept-horns/validation.json) validates complete palette/lockup coverage, exact selected anatomy, intrinsic sizes/viewBoxes, transparent masks, no script/external/image/font dependency, source/runtime byte identity, exact original lettering suffixes, stable consumer URLs, preservation of historical sources and concurrently owned files, and deployment hold.

The locked cached Next 16.3.8 metadata loader was exercised with its real URL/hash/MIME/image-size helpers and no native installation hook or application build. [Receipt](../qa/selected-swept-horns/metadata-check.json): `type=image/svg+xml`, `sizes=any`, `/icon.svg?b1a6fe24805eff52`. This checks generated metadata, not a browser tab or HTTP route.

The [public vector proof](../qa/selected-swept-horns/selected-A-production-proof.svg) uses actual production geometry. The [native Library raster proof](https://chatgpt.com/api/library/files/libfile_db6ce0b1c9088191a74365502cdbadf9/download) shows black/Paper, white/Slate, primary clay, 208px desktop and 109/90px phone header footprints, and exact 16/32px favicon exports. Header sizes derive from current CSS; no real route or full shell rendering is claimed. Tiny enlarged previews use nearest-neighbor scaling and add no detail. Favicon media branches were explicitly forced for the artifact exports.

A local embedded-SVG [browser fixture](../qa/selected-swept-horns/browser-proof.html) remains historical reviewer material. Its original `file://` navigation was rejected by browser protocol policy and was not retried or bypassed. The separately authorized shared-theme owner later recorded [actual HTTP selected-SVG evidence](https://github.com/aidandaly24/goat-hoopers-site/pull/132#issuecomment-6074013306): exact bytes/MIME, header/footer switching and standalone OS light/dark fills. The reduced fixture has no generated icon metadata. Native browser-tab discovery/cache/appearance and physical devices remain documented post-deploy smoke checks.

The [current-main preservation receipt](../qa/selected-swept-horns/main-refresh.json) lists exact changed/inherited paths and input hashes. All artwork, metadata-loader input and original proof files are unchanged. Against the 39 reviewed theme inputs, 28 hashes match, five differ and six theme-specific files are absent; theme interaction screenshots remain conditional on that separate reviewed implementation. No new local full build, install, browser render or recording runs while the AI frontend owns the resource slot. Normal remote CI supplies final-head offline tests, typecheck and production compilation.

— Aidan's Dot
