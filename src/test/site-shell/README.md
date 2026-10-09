# Shared shell regression

Issue #84. Build the app with Node 22 in a checkout containing no dotenv files.
Supply Playwright separately, without adding an application dependency:

```sh
SHELL_TEST_PLAYWRIGHT=/absolute/path/to/playwright/index.mjs \
SHELL_TEST_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
SHELL_TEST_EVIDENCE=/absolute/path/to/private/evidence \
node src/test/site-shell/browser.mjs
```

The runner starts the built Next app and a Vite fixture on private numeric
loopback ports. Server external fetches are blocked; the browser rejects
external and non-GET requests. Child environments contain no application
credentials. Browsers and servers close after the run.

The real Next run checks all 23 public/private, nested, missing and recovery
route examples at 1440, 741, 390 and 320px, a 720×450px layout equivalent to a
1440×900px viewport at 200% browser zoom, and enlarged 200% text at 390/320px.
It checks primary destination order/current state, initial and anchored titles,
skip/primary keyboard focus, scrolling and actual Next navigation/Back.
Back uses a trusted pointer at the visible primary Stocks link coordinates and
records its mousedown departure position. Locator auto-scroll can otherwise
move a sticky link's margin box before navigation and invalidate the expected
prior scroll. Restoration must match a meaningful >=100px departure position.
Phone Trophy captures are viewport-sized at top, middle and maximum scroll.
The fixed bar must stay at the viewport bottom, and final footer content plus
keyboard focus must clear it at maximum scroll. A long screenshot placing a
viewport-fixed bar midway through its image is assessed separately from real
viewport overlap.

External data is deliberately unavailable: recovery/provision states are part
of the shell coverage, not successful production-data validation.

The Vite fixture uses real shell, ticker, Stocks and Trophy components with
synthetic quotes/home data and a long synthetic manager name. Its populated
Trophy scenario uses the repository's approved static 2025 history constants
and the real footer. Next links are ordinary
anchors and pathname uses browser state; actual Next transitions are tested in
the production runner. Scoreboard polling and application fetches are disabled.
It checks ticker present/absent, both account states and 100%/200% text at
1440/1024/741/390/320px. Captures identify synthetic data and never invent
league results. Fixture fonts use the system fallback; the built Next captures
use the actual loaded site fonts. No physical iPhone/Safari coverage is claimed.

For the 120 shell/Stocks/home cases plus the seven loaded-court profiles,
append `--fixture-only`. `--game-only` runs those seven court profiles without
Next; `--game-narrow-only` reproduces only the 320px/200% text profile.
`--history-only` checks eight populated Trophy width/text/ticker setups at top,
middle and maximum scroll, plus the final footer link and a separate full-page
diagnostic capture. All three modes use the current source Vite fixture.
Exact head, outcomes,
Library attachments and any remaining limitations belong in the PR report.

Populated synthetic quotes use the existing stock-detail client seam with no
fetch. The runner selects a player and checks inspector heading/Close clearance,
then activates the actual homepage skip and ID targets in a synthetic edition.
A separate SwiftShader browser loads the real FreeThrowPractice component and approved court assets
and checks stage/HUD viewport bounds, including tablet, reduced-height zoom,
enlarged text and Chrome-emulated 34px bottom safe area. It verifies that HUD
groups do not overlap, and that interactive controls are visible and hit-testable
with keyboard focus. These source-fixture checks do not validate Next navigation
or production font metrics. No game rules change.
