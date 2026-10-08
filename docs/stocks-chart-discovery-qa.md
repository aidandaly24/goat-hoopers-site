# Stocks chart discovery and inspection

Issue #76 owns this repair. Independent exact-head browser review is required;
the author does not self-merge. Historical-data repair and valuation research
remain separate. This change does not establish that history or prices are accurate.

## Behavior and boundaries

On the stocks board, the name and visible **Price history** button open the
existing inspector. **Full profile** is a separate non-prefetched link. Both
chart triggers pass the actual clicked button to the unchanged focus-restoration
path. Shared PlayerName navigation elsewhere remains unchanged.

The neutral SVG chart uses the existing bounded detail response, with FAAB/date
axes, 30D/90D/1Y/All ranges and an exact date/value/source readout. Pointer input
chooses the nearest supplied timestamp; a native range input lets keyboard
users inspect each supplied point with arrows, Home and End. Vertical touch
scroll remains enabled. Equal-date points remain available through the slider.
Ranges end at the latest supplied timestamp; 1Y means the trailing 365 days.

The existing loader appends the current modeled quote as the final `live` point
(`getStockDetail` and `computePlayerStocks`). Earlier live points are recorded
site snapshots; `gamelog` and `backtest` are reconstructed estimates. The chart
keeps those labels, dashed estimate lines, solid recorded segments, and a
diamond/dotted connector for the current quote. It never fills missing dates.
The selected-point ring leaves the source marker visible. Empty and single-point
states do not claim movement. All date labels use UTC.

Only the chart uses proposed Chalk + clay semantic tokens from the DESIGN.md
owner's PR #75. Existing route colors remain unchanged. No chart dependency,
new fetch, price math, schema, database write, auth, homepage or Arcade change
is included. StockBoard loading/cache/retry/switching/close code is unchanged.

## Complexity decision

Boundary: one small UI repair for a ten-manager fantasy league, observed by
phone/desktop users and maintained by the existing stocks owner. Optimize this
release and the next ordinary chart maintenance change, preserving real detail
data, provenance and failure behavior.

| Concern | Evidence/class | Decision |
| --- | --- | --- |
| Point/date/value inspection, source truth and sparse states | Explicit user outcomes; essential | Model and test directly in one chart component/pure geometry helper. |
| Sampled <=40-point response, appended current point, existing React/Next contracts | Confirmed source constraints; imported | Reuse the current boundary; do not invent unavailable daily observations or new flags. |
| Tiny hidden Inspect action and graph without axes | Confirmed usability defects; accidental | Replace with named controls and labeled, inspectable SVG. |
| Local synthetic mounted fixture and proposed scoped neutral palette | Review aids; transitional | Keep out of production hosting; archive preview after review/palette choice. Design owner resolves shared palette migration. |
| Physical-iPhone touch behavior, actual rendered overflow/focus | Unverified on this executor; unknown | Require bounded desktop/390/320px mounted/preview review before merge. |

The smallest coherent implementation is native SVG plus a native point slider.
A chart framework, new endpoint, full-history fetch and profile redesign add
maintenance/coordination cost without earning their keep in this repair. Now:
verify the existing chart/discovery path. Next: reuse chart on profiles only
after this interaction is accepted and the profile owner agrees. Revisit the
data boundary if more granular observations are validated and actually needed.

## Author checks

- Discovery commit: `f8daabf43933a818a73792a71d711dd030a01b96`.
- 430 offline tests passed; 13 explicit local-DB tests skipped. No test network
  or application credentials. The added discovery and chart regressions cover
  semantics, clicked triggers, cache reuse, range bounds, provenance, actual
  time gaps, equal dates, flat/single/empty paths and native slider markup.
- TypeScript and focused ESLint passed. Production build evidence is recorded
  in the PR; no successful build is implied by these unit checks.
- Supported browser inventory returned no browser surfaces. Native Chrome
  selection timed out (`errAETimeout`). No fresh browser screenshot, native
  key/touch input, console or hosted-preview verification is claimed here.
- React review: no new I/O/dependencies or effects; derived geometry remains
  bounded; hooks are unconditional; native links/buttons/range semantics and
  persistent point provenance are retained. Existing async request protection
  and Escape handler stay unchanged.

## Independent acceptance

Use the Vercel preview with populated existing data, or the mounted synthetic
fixture from `src/test/stock-inspector`. Label fixture evidence as synthetic.
Test at desktop, 390px and 320px, 200% text zoom and reduced motion:

1. Find a player by name. Click the name, then Close. Repeat with Price history.
   The inspector shows that player; close/Escape returns focus to the actual
   originating control after the mobile panel disappears. Search/sort/position,
   draft/roster filters and progressive rows retain their behavior.
2. Click Full profile. It navigates to the correct profile. Browser Back returns
   to stocks; no chart click substitutes profile navigation outside the board.
3. Move across the graph; tap/drag horizontally on a phone. Date, FAAB value,
   source marker and crosshair agree with the supplied point. Vertical scrolling
   remains usable. Check the first/last points and equal-date points.
4. Tab to the point slider. Arrow keys, Home and End inspect the respective
   points and expose date/value/source via aria-valuetext. Controls have visible
   focus and >=44px touch targets. The graph and labels fit without clipping.
5. Change every date range. Count/axes/readout update without a network request.
   A current-only range says historical movement is unavailable. Test empty,
   one reconstructed point, flat prices and sparse history without invented data.
6. Rapidly switch players with delayed detail responses; close while loading;
   reopen cached details; fail and retry. No stale response replaces selection.
   Check that one player's same-origin detail GET is reused, with no market or
   whole-history reload. Inspect console and complete Stocks → chart → profile
   → Back → chart → Close on the actual preview.

Pending browser/physical-iPhone verification is a release gate, not a claim that
the code has a known iPhone failure. Pricing/history accuracy remains outside
this UI repair even when the graph renders successfully.
