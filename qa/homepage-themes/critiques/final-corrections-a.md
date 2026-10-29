# Bounded correction QA — critic A

Reviewed 2026-10-29T03:16:44+00:00. Both requested defects are resolved in the supplied corrected pixels. No additional correction is requested from this bounded review. This is not formal PR approval, a new art-direction review or a reopening of the original pair matrix. I changed no original pair judgment; the only file written in this task is this report.

## Findings against preserved firsts

**02 footer wordmark: resolved.** The preserved `02-member-desktop-bottom.jpg` shows the accidental `GOA / T / HOO / PERS / .` breaks. Both `rework-02-member-desktop-bottom.jpg` and `rework-02-public-desktop-bottom.jpg` now show two coherent complete-word lines, `GOAT / HOOPERS.`. The wider wordmark allocation leaves the fixture copy, source disclosure, link row and attribution inside the footer; no overlap or clipped terminal letters is visible. Both native corrected phone bottom crops also preserve the coherent two-line wordmark, clear source text and wrapped navigation.

**08 current record and label: resolved.** The preserved `08-member-desktop-middle.jpg` shows `1– / 0Current / W–L`. In both `rework-08-member-desktop-middle.jpg` and `rework-08-public-desktop-middle.jpg`, the right-hand current record remains an unbroken `1–0`, with `Current W–L` deliberately below it and clear of the opponent column. The corrected public phone middle crop and an in-memory native crop of corrected member phone rows show `1–0` and `Current W–L` on a readable shared line with separation, followed by the opponent context. No collision, clipped value or lost label is visible in those affected native samples.

**Whole-page continuity: retained.** I inspected all eight corrected complete pages: two directions × member/public × desktop/phone. 02 retains its alternating full-width black/white bands, large heavy headings, ruled registers and grayscale portraits. 08 retains its continuous white field, red numerical markers, fine rules, section-label gutter and open roster rows. The corrections do not visibly flatten either theme into a different generic body. No visible collateral clipping was found in the complete compositions or the native samples listed below. This statement is bounded to supplied captures, not every pixel at every viewport.

## Exact image inspection

All image paths in this section are relative to `qa/homepage-themes/evidence/`.

- Complete corrected pages: `rework-{02,08}-{member,public}-{desktop,phone}.jpg` — the exact eight-file Cartesian set, viewed at fit-to-image scale for full-page composition.
- Corrected 02 native regions: `rework-02-{member,public}-desktop-middle.jpg`, `rework-02-{member,public}-desktop-bottom.jpg`, `rework-02-{member,public}-phone-top.jpg`, and `rework-02-{member,public}-phone-bottom.jpg`.
- Corrected 08 native regions: `rework-08-{member,public}-desktop-top.jpg`, `rework-08-{member,public}-desktop-middle.jpg`, `rework-08-{member,public}-desktop-bottom.jpg`, `rework-08-{member,public}-phone-middle.jpg`, and `rework-08-{member,public}-phone-bottom.jpg`.
- Additional native member-phone record inspection: an in-memory crop of `rework-08-member-phone.jpg`, rectangle x=0..390, y=8600..10000. This shows the directory controls and the first four record rows; no derivative file was written.
- Preserved first affected crops reopened for direct comparison: `02-member-desktop-bottom.jpg` and `08-member-desktop-middle.jpg`. The first full member/public desktop/phone pages for both directions were also inspected during the preceding independent first-round review, recorded in `diversity-a.md`.

## Current runtime provenance

I recomputed SHA-256 directly from current runtime files, independently of the reported capture successes. Every entry in `sourceFiles` in `rework-02-captures.json` and `rework-08-captures.json` matches the current file. The aggregate manifest’s `htmlSha256` also matches each current HTML file. Both manifests contain all four expected captures and no capture failures. Each referenced full image exists. The eight individual `*-capture.json` width/height and inventory hashes agree with their aggregate entries.

| Current runtime file | Recomputed SHA-256 | Capture `sourceFiles` |
| --- | --- | --- |
| `qa/homepage-themes/rework/02/index.html` | `39bdb41603254aebeedf00aae42dbe522e996127e469d649c59786de8c68e76b` | Match |
| `qa/homepage-themes/rework/08/index.html` | `127deb0f2a7a5a7df079488a0756f6bc53061d2202d9d182b69a4e4857ce7032` | Match |
| `qa/homepage-themes/rework/08/page.js` | `8234c7b77f7105d84b3e436acd016620a4add5ac09e74be64e876d4db206a832` | Match |
| `qa/homepage-themes/rework/08/style.css` | `1722731a196d85dcba2c0b2858e8902cced7d9712aa4b4693ddf97d3e89da7cb` | Match |

The preserved first runtime sources also still match their original capture provenance:

| Preserved source | Current SHA-256, matching first capture |
| --- | --- |
| `qa/homepage-themes/directions/02/index.html` | `e95c05048474d14043ccbbb8f608b648d31c9e93960c67f5bfe6be6829e2aadf` |
| `qa/homepage-themes/directions/08/index.html` | `127deb0f2a7a5a7df079488a0756f6bc53061d2202d9d182b69a4e4857ce7032` |
| `qa/homepage-themes/directions/08/page.js` | `edd5a4d8554c6ec31b0812afee473f23ed3807dc3972683defdfb05a020bc8f1` |
| `qa/homepage-themes/directions/08/style.css` | `7a621f0028c49cfb9077835bd95231d138e9214c564f97b198fa3ca8a22b064b` |

02’s original aggregate used `htmlSha256` rather than a `sourceFiles` array; 08’s original manifest includes all three runtime files. The preserved originals remain separate from corrected `rework/` files.

## Exact capture evidence hashes

| Corrected full-page image | Dimensions | SHA-256 |
| --- | --- | --- |
| `rework-02-member-desktop.jpg` | 1440 × 12057 | `4a574ba577c91371e55b1d55e871d3f8c98f5871512e21cf9ad89e7f17ff51ac` |
| `rework-02-member-phone.jpg` | 390 × 20621 | `3850dd42794d37161f5d30df454f811d18d3657322b73a1e0b551da332a72431` |
| `rework-02-public-desktop.jpg` | 1440 × 10614 | `8725de6336733a836ff293128b4d982a14885ec05b82070eeb371bb4863bc530` |
| `rework-02-public-phone.jpg` | 390 × 17643 | `4abfc66ae54a99ca995394aa9235a349ac9197079ec562be509e5693a8c012e1` |
| `rework-08-member-desktop.jpg` | 1440 × 9443 | `872866b71594e01473aa2cd4460bb4cca42a6ea901b98ea3e02d2d6f12d37c53` |
| `rework-08-member-phone.jpg` | 390 × 15079 | `e7c7c14e447d9c9d325abf3726134526121bb09dc93de6251b724713831d61d1` |
| `rework-08-public-desktop.jpg` | 1440 × 8265 | `aee0650d56958669e05d0f6d1d7a3a2f3bf712dc922cfb61c169940fb8e86deb` |
| `rework-08-public-phone.jpg` | 390 × 12818 | `dbd088ce48d76217151d96673956f6511add2ce4d1db0369dfe41fc765b888e7` |

| Capture or verification JSON | SHA-256 |
| --- | --- |
| `qa/homepage-themes/evidence/rework-02-captures.json` | `7af99d01dd4b52d6ed1f0fd3a9dcb7dc2dfe71bf97bc7ad988b7460730c8223c` |
| `qa/homepage-themes/evidence/rework-02-member-desktop-capture.json` | `8cdc6eeafbb6b425f56fc89080291e3fad4b97a0a3c4c412c4b0f8c29cb9cae5` |
| `qa/homepage-themes/evidence/rework-02-member-phone-capture.json` | `cba7e74bc759738ef0e0b8f82484c5e8f9ee5b16b656b16bd824e6160dca5ead` |
| `qa/homepage-themes/evidence/rework-02-public-desktop-capture.json` | `98fb4ccee50ca2730e623dbddb29aa4a411e4e0839729bd829a81760fda3f58a` |
| `qa/homepage-themes/evidence/rework-02-public-phone-capture.json` | `107ac08b87cc58127db1bc72b7865099d83320e92a8af4a4ca11e13037c094d9` |
| `qa/homepage-themes/evidence/rework-02-verification.json` | `88596dda48a48c3a7ed044ad27493d1b9823336b4e5e5064ed6af109881c046d` |
| `qa/homepage-themes/evidence/rework-08-captures.json` | `20092602d1c6abdc0d8578d7f7bae3c76f45ad5ea74a98432c327f4c93918277` |
| `qa/homepage-themes/evidence/rework-08-member-desktop-capture.json` | `3e227f240d4691ee631e673fc1fe2740252ff872694c0f78cccca53ca8060057` |
| `qa/homepage-themes/evidence/rework-08-member-phone-capture.json` | `e114a69421e0130ea148b0a36a3b2d43888652805de0a5fd8d233c65206bbf75` |
| `qa/homepage-themes/evidence/rework-08-public-desktop-capture.json` | `9764d57d5227ad79f663b83989af9ae0dc9cfe8e35f95ae95d8d6e11a83ab801` |
| `qa/homepage-themes/evidence/rework-08-public-phone-capture.json` | `ae72bbc82220ffdc326719c0b23de1180aa7cfc639bb516bf18f64e439a13e2b` |
| `qa/homepage-themes/evidence/rework-08-verification.json` | `9ab95e75d853aafa4547f368bb6f10e7f10ad20f074fedb875d8b4c14405f655` |

I read the existing `rework-02-verification.json` and `rework-08-verification.json`: each records 10/10 passing cases covering member/public normal, 320px, 200% text, stale and missing states. I did not rerun those browser cases. The eight normal capture entries report no errors or remote requests, equal viewport/scroll widths, ten teams, five normal saved pairs and 228 roster references; member/public personal counts remain 4/0. These are recorded receipt facts, separate from the visual conclusions above.

## Limits and preservation

This review visually covers 1440px desktop and 390px phone normal captures, with native affected-region sampling. I did not visually inspect 320px or 200% screenshots, open interactive menus/disclosures, test keyboard behavior, rerun the browser suite, verify live data or approve a release. The tiled capture manifests disclose capture-only position/animation suppression; full images therefore establish document composition rather than live sticky/fixed behavior.

The original 190-pair review remains unchanged by this reviewer. My own preserved `pair-results-a.json` remains SHA-256 `b273024305c4715468dfc574bb8fd71e86802c73749598c7c463182517fa5e5a`, and `diversity-a.md` remains `a1ad447ca887adccf1c5155ca48dfa346ee7417ed763ad397acd1181b1a126a5`. No source files or prior critique files were written. No remaining blocker was found within this correction scope.
