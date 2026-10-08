# Shared header / Stocks navigation — issue 84

Base: reviewed main `5ee506d56c9f4e973564f1082525e3f088c9ce9f`.
Publication incorporates the coordinator's nonoverlapping Trophy merge
`c6b8f114e8906265b22bf661a066a5fd2d0d2c24` before final validation.
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
use the measured chrome/bar sizes. No page-body, artwork, data, DB, framework,
deployment, AWS, AgentCore or other-repository changes are included.

## Validation record

The pre-publication implementation passed build, typecheck, scoped lint,
surface contracts (60 files), 443 offline tests (13 isolated-DB tests skipped),
and synthetic shell width/account/ticker/text cases. The broader run identified
a Back-scroll regression: reviewed main restored 220px→220px on News/Arcade;
the initial shell with root scroll padding restored 220px→0px. Clearance now
belongs to scroll targets instead. Final exact-head browser/build checks remain
required after the temporary shared-disk pause; the PR is held for independent
review and records the final results. No hosted/production data check is claimed.

Reproduction: `src/test/site-shell/README.md`. Screenshots and machine results
are retained privately outside the worktree; their Library identities belong
in the PR/final report. This document deliberately does not embed an evolving
commit SHA into its own tree.
