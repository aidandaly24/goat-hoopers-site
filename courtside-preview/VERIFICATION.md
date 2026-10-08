# Verification evidence

Verified October 8, 2026 from isolated branch `dot/courtside-weekly-homepage`,
rebased onto main `3807b43`. Existing preview at port 8782 and its worktree were
preserved. This artifact runs at port 8790 from the new worktree.

## Commands

| Check | Result |
| --- | --- |
| `node courtside-preview/build-data.cjs` | Passed strict compilation and ownership/role/opponent checks; two sample editions, ten teams. |
| `node courtside-preview/prepare-viewer.cjs` | Prepared local modules from the locked installed Three version and existing GLBs. |
| `node --check` for main, court, and preparation scripts | Passed. |
| `npm test` | 13 files passed, 1 skipped; 128 tests passed, 3 opt-in local-DB tests skipped. No DB test or mutation ran. |
| `tsc --noEmit` | Passed on current main after narrowing the homepage Player references to the four used fields. |
| `npm run build` | Next 16.3.8 compiled, typechecked, and generated its route output successfully. Network access was required for the existing Google Fonts imports. |
| `git diff --check` | Passed. |

The locked dependencies were installed inside this worktree, replacing its own
temporary dependency symlink. The other worktree's dependency directory was not
modified. This host uses Node 25.8.1/npm 11.11.0; npm emitted Vitest's supported
engine-range warning, but the actual suite completed successfully. CI uses the
repository's existing workflow. No dependency or lockfile change is included.

## Browser checks

Supported Chrome tools used new, owned tabs. Other agents' tabs were not claimed.

- Desktop: 1470 × 780 viewport, 3963 px full page. Mobile: 390 × 844 viewport,
  5063 px full page. Both had zero horizontal overflow.
- Final full pages and opening/player/directory views were captured after loading
  below-fold images. No visible broken image was present. Both complete color
  sequences and the arena footer were visually inspected.
- Search for `Bruce Thornton`, outside the featured anchors, returned Reaves
  Dropper and a matching-player hint. A nonexistent query showed the empty state;
  Clear restored all teams. Sorting by 2025 finish put the champion first.
- Ten native roster disclosures contain all 228 player links. Keyboard Enter
  expanded a summary. Profile, opponent, roster-anchor, history note and latest
  move actions remain in the expanded body.
- The current edition is Upcoming with no score. The archived 2025 final shows
  326.0–251.5. The archive lists two draft editions and returns to this week.
- Matchup notes opened with explicit draft/upcoming context. Native Escape
  closed the figurine dialog and returned focus to its opener.
- No `court.js` script was present before requesting a figurine. The existing
  Reaves model rendered; Rotate worked. Closing left zero canvas elements.
  One missing relative SkeletonUtils import was corrected in preparation, then
  confirmed in a fresh owned tab to avoid the earlier failed module cache.
- Reduced-motion/offscreen/hidden-page guards were verified in source. OS motion
  settings were not changed. The decorative moment is a single 750 ms settle;
  the viewer has visibility/intersection guards and closes with abort/disposal.

## Deliverables and review boundary

Eight desktop and phone JPEGs are retained locally and in ChatGPT Library.
They are actual browser renders, distinct from the three generated section
concepts, and are excluded from public-repository publication.

The local server and desktop review tab are retained for panel inspection. This
concept is a design artifact; panel review and a later production-surface
integration remain separate steps. The earlier October 8 publication hold was
lifted after normal production deployments resumed. There are no production DB, auth, Vercel,
paid-service, arcade-code, or production homepage-route changes.
