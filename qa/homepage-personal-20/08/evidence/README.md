# Browser evidence for study 08

Latest current-source evidence: `cleanup-results.json` and `guest-cleanup-*.png`. This targeted pass covers guest at 1440, 1120 and doubled root text, all three primary actions and focus/history behavior, plus brief member-standings preservation checks. The 200% league image is a viewport capture after scrolling to the section. Root owns final captures.

The original captures and full-matrix report below are historical baseline evidence, with their original source fingerprints; do not package them as current final captures.

`browser-results.json` records the actual nine-case Chromium run and additional history/structure/contrast checks. `../journeys.json` gives stable selectors, expected local results and return-focus targets; `../verify.cjs` reproduces the checks.

- `reaves-1440.png`, `neural-1440.png`, `guest-1440.png`: complete pages at 1440×900.
- `*-1120.png`: opening viewport at 1120×900.
- `*-1440-text-200.png`: opening viewport at 1440×900 with 32px root text.
- `reaves-structure.png`: neutralized structure opening, measured to match normal chart geometry.

Screenshots precede each case's interaction sequence. The report then tests its actual first three actions, results, Close/Escape/Back/Forward and focus restoration. Source fingerprints are in `source-manifest.json`; root owns final captures and packaging.

These are local synthetic-fixture checks, not production, screen-reader, device or browser-zoom acceptance.
