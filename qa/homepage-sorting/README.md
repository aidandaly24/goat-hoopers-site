# Homepage sorting fixture

Run from the repository root with the installed, locked dependencies and Node 22:

```sh
node node_modules/vite/bin/vite.js --config qa/homepage-sorting/vite.config.mts --configLoader runner
```

Open `http://127.0.0.1:8794/` in the supported browser. The fixture mounts the
actual `CourtsideDirectory` and `StandingsTable` components with four synthetic
teams. It does not import a league loader, ticker, auth, API route or database.
Avatars/portraits are absent. The fixture replaces Next Link with a native anchor
so destinations can be inspected without a Next server. The optional figurine
still uses the real lazy viewer and local approved GLB; it is not part of sorting
checks. This folder is not an application route.

“Run repeated DOM interaction checks” remounts the fixture and runs real React
DOM events through the production controls. It checks both directions and ties,
historical finish, missing values, current full roster retention, search/clear,
expansion retained across sorting, links, rank preservation, announced state and
44px standings controls. Record the displayed PASS/FAIL output. Run it twice to
detect stale state after repeated use. A passing runner does not replace native
keyboard or rendered layout inspection.

Manually check:

- At desktop width, Tab to directory column controls and standings headers.
  Activate each with Enter and Space; repeated activation reverses it. Focus
  remains on the control, and arrows/status/`aria-sort` reflect the result.
- Expand Team 10 before changing order. Its nine-player roster remains expanded
  after sorting. Search “Only In Ten”, sort, then Clear. Clear focuses search
  and retains the selected sort. League order restores 10, 2, 3, 4.
- At 390px and 320px widths, use the directory's labelled Order selector and
  direction button. Standings sort controls remain visible above the compact
  cards. Check wrapping, readable values and no horizontal overflow.
- Inspect team/player links without following them to a hosted site. Neither
  homepage list has pagination; all supplied rows remain available.
- If inspecting the figurine separately, use the trigger below the expanded
  roster. Check Close/Escape/profile link. Report WebGL unavailability as a
  limitation, not as evidence of the character's appearance.

Use the browser's network/console tools if available to record errors. Sorting
must not request additional data. Preserve screenshots and the runner output in
the task workspace; do not promote synthetic data into production.
