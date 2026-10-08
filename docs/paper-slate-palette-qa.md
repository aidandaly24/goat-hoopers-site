# Selected Paper + Slate migration QA

Aidan chose **Paper + Slate** after actual desktop/phone captures of the same
Courtside layout. [DESIGN.md](../DESIGN.md) records that choice, canonical roles,
content/layout rules and small follow-up PRs. This pass adopts merged main
`be5546380f12d532a6ff7179a9de72378e97ede7` (chart78, sorting79, Arcade77).

## Scope and ownership

Production changes are shared semantic colors/type/focus, the unchanged
approved black logo variant for light chrome, scoped banner/game materials and
small history/trade color cleanup. The only responsive adjustment is the teams
list: actual 320px QA found 65px overflow; bounded grid tracks and wrapping keep
all names/managers/W/L/PF fields on screen. Table rank one uses the championship
role rather than the action accent. Sorting and chart interaction logic,
pricing, API/data loaders, authentication, schema and game physics are unchanged.

The token merge retains all eight chart owner `--gh-neutral-*` names and all
six Arcade role names, now aliases of the selected canonical palette. Full
chart/stock source blobs and sorting source blobs remain identical to main
except that one semantic medal CSS line. Both frozen comparison directories
remain byte-for-byte unchanged. No dependency/package/lockfile change.

| Inventory finding | Resolution / explicit boundary |
| --- | --- |
| Green CS wall/deep/court and mineral accents | Alias shared canvas/white surface/ink/slate roles; no green page blanket. |
| Navy/gold global chrome and working lists | Shared Paper + Slate; white labels on filled slate actions, dark labels on retained bright position pills; dark publication/status ink on paper. |
| Chart light Chalk/clay roles | Preserve owner role names/geometry/provenance/controls; alias selected Paper + Slate values. |
| Black/amber trade terminal | Existing terminal names alias shared roles; use the shared quiet elevation. Native URL/pickers/verdict math unchanged. |
| Mahogany history page gradients, gold plaque sheen and dark text shadows | Neutral page/entry surfaces and shared shadows. Actual crimson/brass championship banner remains bounded, with readable light fabric labels. |
| Playable court HUD | Bounded `--gh-scene-*` restores readable approved dark HUD/light text; neutral shell/discovery remains shared. No new WebGL or model requests. |
| Approved assets | Exact arena/pennants/portraits/selected clay master retained. Public black logo is byte-identical to `design/brand/selected-hybrid/assets/GOAT-HOOPERS-horizontal-black.svg`. |
| `StockBoard.module.css` dark literal | Legacy unused CSS (current board imports `StockMarket.module.css`); deferred deletion, no active palette effect. |
| Existing hero tint, avatar/crown materials and local scrims | Token-driven or bounded existing objects; no new decorative blob/card system. |

## Actual browser evidence

[The isolated fixture](../qa/paper-slate/README.md) mounts actual production
home, stocks/inspector/chart, teams, Arcade/game, trade, history and recovery
components. Frozen home and historical content, synthetic quotes/detail and
initials fallback are explicitly labeled. It injects transport only inside the
fixture; it never serves application API/data/account routes.

Chrome 155.0.8059.40, Playwright 1.64.0 and Node22.23.3 used a private profile on
Mac with reduced motion and WebGL disabled. **66 recorded checks passed and
51 viewport screenshots** were retained at 1440×900, 390×844 and 320×844.
Every tested route/state had page width equal to viewport width. Directory
Order selection and visible slate focus, stock search/selected detail/Retry/
close focus restoration, 10 team destinations, empty lists, actual game
preview/Play/fallback/help/back, trade add/remove and recovery passed.

Resolved text/outcome/accent combinations on canvas, white and hover meet
4.5:1; the lowest tested secondary text pair is 4.87:1. White/slate action text
is 7.22:1. Control boundaries pass 3:1 against those three surfaces. Retained
position/team hues pass 4.5:1 with the separate dark-on-color label. These are
specific resolved token-pair checks, not a whole-site accessibility certification.
The independent review caught two scene-isolation gaps in initial head
`5e753633`: actual inherited title/Streak/Best/loading text was 1.38:1 on the
dark stage, and Prototype was 2.10:1 after its 0.65 group opacity. The minimal
correction sets the stage's actual light foreground and dark raised role;
Prototype now uses its solid local background at opacity1. Its actual pair is
7.37:1 and inherited light text is 17.62:1. The fixture holds only the local
renderer module to observe real loading, then releases it for the real WebGL
fallback. Actual computed/composited checks cover title, values, loading,
fallback/reload, help heading/prose/keys, fine labels and Prototype at all three
widths; all 48 actual element pairs exceed 4.5:1. No production state/logic is
fabricated. Prototype's solid background/full opacity avoids dependence on
moving court imagery. Before measurements are retained as `scene-before.json`;
after groups are in the refreshed evidence manifest.

No unhandled page errors, external or non-GET browser requests occurred. Nine
expected Three console messages report the deliberately disabled WebGL context
(three per viewport); no other console errors occurred.

Evidence is task-owned under `qa/paper-slate/evidence/`: `receipt.json`, plus
`1440-home.png`, `390-home.png`, `390-home-directory.png`,
`1440-stock-inspector.png`, `390-stock-inspector.png`, `320-teams.png`,
`390-arcade.png`, `390-trade.png`, `1440-history.png`,
`390-game-loading.png`, `390-game-help.png`, `390-game-fine-controls.png`, error/empty/fallback
captures and the remaining widths. The final source fingerprint and screenshot
hashes are recorded in [paper-slate-evidence.json](paper-slate-evidence.json).
Screenshots are local review artifacts, not a published Vercel URL.

## Validation and remaining boundaries

- **443 offline tests passed; 13 explicit local-DB tests skipped.** Typecheck,
  focused React/fixture lint, whitespace and frozen comparison validation pass.
  Full production compilation is delegated to exact-tree CI because local disk
  headroom is about 2.5GiB; no unnecessary full local build or install was run.
- The fixture uses actual components/CSS and existing font copies; Next font
  compilation, live API accuracy, session forms, signed-in account state,
  physical iPhone/Safari and actual 200% browser text zoom are not asserted.
- Game gameplay is the independently accepted merged owner's work. This pass
  verifies the deliberately disabled-WebGL fallback; it changes no mechanics.
- Team/profile/player/news/intel/draft/transaction/auth routes inherit selected
  shared roles, but each route's live/authenticated flow is not fully exercised
  here. Their layout/density improvements remain the ordered DESIGN.md plan.
- Home still has the existing large portraits/separators and no-edition branch
  that exposes tool links instead of the full directory. Figurines remain
  optional in expanded rosters/team identity. These are explicit follow-up
  functional/composition decisions; no assets or logic were removed here.
- Root `vercel.json` remains blob `87056607badcfceb2dddb95864942180b10c438f`,
  `git.deploymentEnabled=false`. No deployment/provider/account action is
  requested. Coordinator owns release and independent visual approval.

— Aidan's Dot
