# Shared header / Stocks navigation — issue 84

Base: reviewed main `5ee506d56c9f4e973564f1082525e3f088c9ce9f`.
Publication incorporates the coordinator's reviewed Trophy merge and
placeholder-removal and Newsroom main `32794327df2ec8cd3d2b30935c2df51b354f63ca`
before final validation. History/Newsroom source matches that main exactly;
owner work and both architecture sections are preserved.
Owner: Aidan's Dot. Branch: `fix/shared-header-stocks-nav`.
Paper + Slate and `git.deploymentEnabled=false` remain unchanged.

## Diagnosis

- Both primary menus omitted Stocks. Desktop had no current-route state and
  mobile ordering differed from desktop.
- With the fail-soft ticker absent, the header still used a 40px sticky offset.
  The baseline private production build reproduced this empty gap.
- The baseline header caused 41px horizontal page overflow at 741px.
- The Stocks skip link used a negative page-relative offset rather than true
  clipping. Correct production stacking occluded its unfocused viewport bounds
  with the ticker/header. An early fixture incorrectly overrode that stacking
  and exposed it; that capture is not evidence of a production visual bug.
- The parent inspected the original screenshots and reported a pale-gray
  “Skip to content” region, missing Stocks and an apparently clipped Trophy
  title. Focus state is unknown. The originals could not be transferred after
  the one bounded retry; their pixels were not inspected in this executor.
- A later parent-inspected long Trophy image places the five-tab fixed bar
  across champion text inside the image. Its image-viewer context makes a
  capture artifact plausible; viewport scroll positions and bottom-content
  clearance are tested before treating it as a layout bug.
- The fresh-load Trophy heading is visible in the local baseline. Its reported
  clipping cause remains unconfirmed. Sticky chrome clearance is verified
  separately through initial load, anchor, focus and Back checks.

## Repair and contracts

Desktop/mobile use Home, News, Stocks, History, Arcade, Team in that order.
Signed-in desktop retains only the display-name entry to `/team`. Active state
matches nested paths at a slash boundary; public `/teams` is separate.

SiteChrome makes ticker/header one naturally sized sticky stack. Header nav
uses a complete second row below the existing 64rem breakpoint. The mobile bar
keeps six >=44px targets; its actual enlarged height reserves body space.
Observers measure chrome/bar resize and release themselves on unmount.

A clipped first keyboard skip link transfers focus to page content. The Stocks
board skip remains focus-visible below the sticky stack. Target scroll margins
use the measured chrome/bar sizes, including existing Stocks inspector/row and
homepage ID-target overrides. The free-throw stage consumes the actual remaining
viewport after chrome, mobile bar (including safe area) and its own gutters.
Its CSS height budgets and a compact HUD flow for constrained stage height
change, with the existing QA chrome selector. Pixel inspection caught enlarged-
text HUD collisions that simple viewport bounds alone missed; group separation
is now an acceptance check. At the narrowest constrained stage, existing HUD
groups use full rows, spacing tightens, and the repeated practice subtitle stays
available to screen readers; Help and all 44px controls remain available.
Game/chart rules and assets do not change. No page-body redesign, artwork, data, DB, framework,
deployment, AWS, AgentCore or other-repository changes are included.

## Validation record

The initial published implementation passed build and remote CI
`37850009947` at head `f4474da226174002ec3b2ce454c19572c0440aaf`.
The current integrated source passed typecheck, JS syntax, diff whitespace,
surface contracts (62 files), and 451 offline tests (13 isolated-DB tests
skipped). Scoped ESLint has zero errors and one unchanged baseline unused-type
warning in layout.tsx. Current source-only browser checks passed:

- 80 width/account/ticker/text shell cases, 20 populated stock selection,
  inspector/Close cases and 20 actual homepage skip/ID cases at five widths.
- Eight actual Trophy/real-footer setups, each at top/middle/maximum scroll:
  320/390px, both ticker states, 100%/200% text and Chrome-emulated 34px safe area.
  The fixed bar stayed at viewport bottom; footer content and final-link focus
  cleared it. The 390px full-page diagnostic places the viewport-fixed bar
  inside the long image, demonstrating a capture-artifact mechanism separately
  from real viewport checks. The original or physical-iOS cause is unconfirmed.
- Seven loaded approved-court profiles: tablet, 720×450 zoom-layout equivalent,
  320/390px normal and enlarged text, plus enlarged tablet text. Bounds, HUD-group
  separation and visible/hit-testable keyboard controls passed.

All source browser runs had zero runtime errors, external requests or non-GET
requests. The light QA slot was released after child browsers/servers closed;
331 MiB free remained, above the 128 MiB floor. No new Next build/install,
cleanup or hosted/DB call ran during the slot. Source fonts are system fallbacks.

The broader earlier Next run identified
a Back-scroll regression: reviewed main restored 220px→220px on News/Arcade;
the initial shell with root scroll padding restored 220px→0px. Clearance now
belongs to scroll targets instead. The coordinator lifted the temporary
no-build instruction for bounded current-source acceptance. The corrected
source was published before compilation, its exact tree passed remote CI, and
a fresh credential-free local build passed within the monitored disk budget.

The first fresh Next desktop Back check returned 131px from a 220px prior
scroll. Tracing proved the locator click had moved the page to 131px before
mousedown; Next restored that actual departure correctly. Trusted pointer
navigation preserved and restored 220px. The harness now records mousedown
departure and uses the visible link coordinates, avoiding locator auto-scroll.
Application code is unchanged by this test correction. The final PR report
records the exact current-source build binding and full native Next results;
stale artifacts and ordinary Vite anchors do not count as Next coverage.
Draft PR #87 stays HOLD MERGE for independent acceptance. No hosted/production
data check is claimed.

Reproduction: `src/test/site-shell/README.md`. Screenshots and machine results
are retained privately outside the worktree; their Library identities belong
in the PR/final report. This document deliberately does not embed an evolving
commit SHA into its own tree.
