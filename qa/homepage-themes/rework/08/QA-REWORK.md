# Swiss Sport — bounded W–L allocation repair

## Scope and preservation

This separate rework addresses the P2 in the independent critique of `08-member-desktop-middle.jpg`: the current record split into `1–` and `0Current`, damaging the relationship between the value and its label. It is a QA correction before taste review, not a convergence pass or redesign.

`index.html`, `style.css`, `page.js` and `DESIGN.md` were copied from `../../directions/08/`. Only the rework copy of the directory record markup and associated CSS was changed. The supplied DM Sans, white/ink/vermilion palette, asymmetric grid, court crop, spacing outside this record allocation, all fixture facts and all destinations remain the first design.

The copied **`DESIGN.md` is byte-identical historical first-submission rationale and first-round evidence**. Its runtime hash table refers to the first submission. It is deliberately not rewritten to claim these rework checks. This document records the rework implementation and evidence.

The original `directions/08/` files still match every first-submission hash below. No original screenshot or image was written. New inspection captures only use `/tmp/08-swiss-rework-*.png`; the root author owns the recapture/review images. No production, shared source, Git, configuration or external service action was taken.

## Exact before and after

Before, `.club-main` allocated a fixed `4rem` record column. At a 16px root and 1440px member viewport, its measured width was 64px. The record and label were adjacent inline content:

```html
<div class="club-record num">1–0<small>Current W–L</small></div>
```

Chromium `Range.getClientRects()` reported two record line fragments (`1–`, `0`) and two label fragments (`Current`, `W–L`). The zero and `Current` shared the second line. The rendered value was 20px and label 12px.

After, the column is intrinsic `max-content`. An explicit `.record-value` span keeps the record atomic. The desktop record uses a column flex layout with its complete label beneath it, aligned to the numeric edge:

```html
<div class="club-record num">
  <span class="record-value">1–0</span>
  <small>Current W–L</small>
</div>
```

The measured desktop column is now 66px at normal root size. The value and complete label each occupy exactly one text line, with the same 20px/12px type. At 200% root size, they become 40px/24px, and the intrinsic column grows to 132px. There is no font reduction, clipping or hidden text.

At the intermediate layout the record is placed beneath the team identity, rather than in the narrow index column. The existing phone row keeps a horizontal record/label relationship when space permits and wraps the complete label below the value when enlarged. Neither the numeric record nor `Current W–L` is split internally.

## Rework checks

Evidence is from installed Chromium through Playwright on the static fixture at `http://127.0.0.1:4206/qa/homepage-themes/rework/08/index.html`, using both `?view=member` and `?view=public`.

- Both views × 1440/390/320 CSS px × normal/actual 200% root × closed/open details: **24 cases passed**. All details, including navigation, were opened for the expanded case.
- Root enlargement was applied as `document.documentElement.style.fontSize = '200%'`; the measured root was 32px, not a narrower viewport standing in for enlarged text.
- In all ten directory records in every case, the record and full label each had one text line and their text rectangles remained inside their own allocated record container. Whole-document horizontal overflow was zero. No browser exceptions or failed local requests were observed.
- Desktop record/label typography remains 20px/12px normally and 40px/24px enlarged. Phone typography remains the first design’s 14px/12px normally and 28px/24px enlarged.
- Visual before/after inspection confirmed the original damaged desktop line and the corrected stack. Additional visual inspection covered the desktop at actual 200%, phone at 390px, public 320px at 200%, and the expanded roster content.
- Text, raw action destinations and image references are **identical between the original and rework** in both views. The only DOM change wraps the existing record text in a span.
- Inventory checks retain 10 team containers, 228 unique linked roster players, 10 modeled faces, 5 saved AI rows, 10 standings rows and all 24 member values. Public view retains no personal areas.
- Player search for Bruce Thornton still returns team 1 and opens its roster. Roster-size sort still starts with team 2. Navigation Enter opens; Escape closes and restores focus to the summary.
- `node --check page.js` passes. No production build is needed for this isolated static markup/CSS repair.

No screen-reader, physical-device, production Next navigation or gameplay verification is claimed. The root’s independent recapture and review remain outstanding.

## Exact source hashes

SHA-256 values identify the first source and the runtime copy checked above. `DESIGN.md` and `index.html` are identical copies. The final response provides the complete rework manifest digest, including this report.

| File | Preserved first submission | Checked rework |
| --- | --- | --- |
| `DESIGN.md` | `688f97033d00ac52c6da9715be09bd6ad23299ead2e4a777a5389b7cbcfe3c3a` | `688f97033d00ac52c6da9715be09bd6ad23299ead2e4a777a5389b7cbcfe3c3a` |
| `index.html` | `127deb0f2a7a5a7df079488a0756f6bc53061d2202d9d182b69a4e4857ce7032` | `127deb0f2a7a5a7df079488a0756f6bc53061d2202d9d182b69a4e4857ce7032` |
| `page.js` | `edd5a4d8554c6ec31b0812afee473f23ed3807dc3972683defdfb05a020bc8f1` | `8234c7b77f7105d84b3e436acd016620a4add5ac09e74be64e876d4db206a832` |
| `style.css` | `7a621f0028c49cfb9077835bd95231d138e9214c564f97b198fa3ca8a22b064b` | `1722731a196d85dcba2c0b2858e8902cced7d9712aa4b4693ddf97d3e89da7cb` |
