# Live-base removal QA

Bounded component fixture for the removal-only backport from live commit
`92fb446c0e94f2b664bd2f3e5be3e574c2e3641d`. It mounts the actual unchanged
live-base homepage/team components and CSS with the existing dated directory,
editorial and league snapshot. Team/player IDs, names and all 228 roster
references remain. Avatars and headshots use existing production initials;
approved local arena, embroidered banners, logo and fonts still render.

Only `/` and `/teams/1` through `/teams/10` are fixture routes. Team
`?state=empty` tests existing empty states. Next adapters from the baseline
preserve anchors/native history. This does not test Next routing, live loaders,
real accounts, provider/DB calls, phone hardware or screen-reader behavior.
No Three viewer or rejected model is imported. Browser routing blocks external,
API, non-GET and GLB requests and records them as failures.

With existing Node 22, Vite, Playwright and Chrome (no installation), run from
the repository root:

```
node qa/live-removal/browser.mjs /existing/playwright/index.mjs /existing/chrome
```

The runner starts its own loopback-only Vite child at port 8869 with a whitelist
environment, a fresh headless Chrome profile and desktop/390/320 viewports.
It checks native matchup dialog Close/Escape/focus, directory search/clear/sort,
expanded-roster retention, standings disclosure/sort, all ten team profiles and
their player/opponent links, browser Back and page overflow. It saves six
bounded viewport screenshots plus JSON/log receipts under ignored
`node_modules/.cache/live-removal-evidence`, then closes its browser/server.
It has a three-minute cutoff and a 128 MiB free-space floor. Failed receipts
are retained. The complete source tree/head are recorded in each run.

The draft review base must stay frozen at live92fb446. Normal CI tests its
synthetic merge; verify the logged checkout SHA and tree before releasing.
The author never merges or deploys this candidate.
