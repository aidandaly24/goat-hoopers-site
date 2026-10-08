# Homepage sorting repair — issue #73

## Reproduced scope

On base `a327e9c960259025ffc736da7004408942736106`, `CourtsideDirectory`
has native disclosure rows and a working two-option selector. The parent’s
bounded live cloud-browser check confirmed **2025 finish sorts 1st → 10th**.
That selector was not broken. Its column labels were noninteractive and there
was no reverse direction, name, manager, opponent or roster-size order.

The actual live `StandingsTable`, inside “Live standings, stats & recent moves”,
had plain column headers and no sorting state/handlers. Its headers disappeared
on phones. Neither homepage list has pagination. No hosted refresh loop or
production database query was used for this investigation.

## Focused change

- Retain League order and 2025 finish; expose team, manager, displayed wins,
  opponent and full roster count. Desktop column buttons and the mobile Order
  selector share one sort state. A direction button, arrows and live status make
  the active order clear. Record sorting means wins, explicitly named in controls
  and status; it does not invent a new record metric.
- Sort all five standings columns with native buttons, `aria-sort`, arrows and
  status. Phone layouts retain usable sorting controls above their existing
  compact cards. Supplied league ranks/medals and team links remain unchanged.
- Compare unformatted numbers, including the raw `Standing.pointsFor` cents
  that are displayed as points. The old component displayed `team.pointsFor`
  instead; the standard loader supplies equal values, but the display and
  comparator now explicitly share the Standing contract.
- Equal primary values keep original input order; null/undefined/blank/nonfinite
  values stay last in both directions. Zero remains a valid value. Names use a
  fixed English, case-insensitive, numeric collator. Inputs and row objects are
  never mutated. Keyed native disclosures remain keyed to team identity.
- No data loaders, database schemas/queries, package/lockfile, global palette,
  arena/banner assets or arcade implementation changes.

## Figurine finding

Precise location: homepage → **Know who you’re playing** → expand any team →
below the full roster/context/latest move → **Inspect existing league figurine**.
It opens a modal titled with the team name. The parent visually confirmed the
trigger/modal, Close and profile link; cloud WebGL was disabled, so that check did
not establish the model’s actual appearance.

The code path is `CourtsideDirectory` → `FigurineDialog` in
`CourtsideDialog.tsx` → lazy `src/three/CourtsideFigurine.tsx` →
`public/3d/hooper-{teamId}.glb`. It exists to retain the earlier per-team 3D
collectible in the Courtside roster drill-down. It is independent of the arena
image, embroidered pennants and emblem. The current viewer freezes the supplied
idle clip at time zero, then renders on load/resize/manual turn; it does not run
an ambient animation loop.

I visually inspected the checked-in [v4 team-1 asset preview](../3d/previews/v4-hooper-1.png):
a muscular human character, arms extended, rigid gold torso/shorts and basketball.
That is a saved asset render, **not a new live homepage screenshot**. The model
and preview were introduced together by `fec64c6` (Quaternius-based v4 pipeline,
`3d/build_hooper_v4.py`). The supplied idle animation has only small arm sway;
the viewer freezing it explains why the pose may look rigid, but exact live
rendering remains unverified. The old 3d README's ~290KB size is outdated:
team-1 GLB is 2,716,068 bytes, SHA256
`746c9846211dfad3098b3dce72b49bfdc6d0cf4af9cbf088996953cdb2a203b6`,
with idle/spin/jump/dunk clips. No asset or viewer was redesigned/removed.

## Verification and remaining gates

- Node 22.23.3; no database/commissioner credentials in the clean command
  environment. Existing installed packages reused; no install.
- Nine pure sorting regressions pass, including repeated reversals, stable ties,
  numeric ordering, zero/missing/nonfinite values, season-specific record
  selection, roster references, managers and both sides of a matchup.
- Two server-rendered HTML regressions pass: native controls, default active
  `aria-sort`, official ranks/links, matching displayed points, preserved working
  selector options, full roster/owner context and no eager figurine fetch.
- Final integrated-code offline suite: **416 passed / 13 opt-in skipped**, after
  rebasing onto main `5e662152100e693c879f3dee37489b2f57e02706` (merged PR72).
  Typecheck and focused ESLint passed. No arcade file differs from that base.
  The final documentation-only count update does not change tested code.
- The [isolated fixture](../qa/homepage-sorting/README.md) mounts actual production
  components and provides a repeatable DOM interaction runner. Vite started in
  350ms and local HTTP/entry transform succeeded under the normal approval path.
  **Actual browser interaction, keyboard and mobile results remain pending**.
- Supported Mac inventory identified Google Chrome (`com.google.Chrome`), but
  native selection timed out twice (`errAETimeout`, -1712). The available browser
  surface list was empty. No alternate browser/process-control route was used.
- Production build is **pending the coordinator’s single-heavy-build slot**;
  no full build has started. Preview QA and independent exact-head review remain
  required. **FIX IN PROGRESS, HOLD MERGE. No self-merge.**

Initial `ps` was sandbox-denied and never retried. Initial Vitest cache writes
through the shared dependency-directory symlink were denied; existing config
regressions triggered the same cache path. Test caches were moved into this
task-owned workspace while dependency packages stayed read-only. The full suite
then passed with its normal config loader. Source/QA/repair files and initial
failure logs are preserved locally.
