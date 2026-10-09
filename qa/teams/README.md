# Public teams directory fixture

Surface job: find a league team and its manager, compare the supplied W/L and
points for, then open its public profile. The single primary action is the
ordinary `/teams/{id}` row link. States: populated, honest unchanged failure
message, known numeric zero, and long names/managers. Phones put the same
labelled stats below identity; wide rows share one stat rail. Forbidden: nested
card framing, ellipsis/clipping, floating/shadow hover, hidden essential content,
extra profile actions, decorative figurines and fetches for presentation.

Production TeamDirectory and its shared primitives/tokens mount with ten
realistic names and explicitly synthetic managers/results. Before and after use
the exact same array and fonts; `prepare.mjs` extracts only the original two
directory files from base `32794327df2ec8cd3d2b30935c2df51b354f63ca` into an ignored
folder. No asset is changed. Approved local Inter/Geist Mono files must be
available under `public/design-preview/neutral-courtside/assets/`.

After the coordinator releases the sole browser slot, use the existing Node 22,
repository dependencies, installed Playwright and Chrome:

```sh
node qa/teams/browser.mjs /absolute/path/playwright/index.mjs '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

Proposed browser budget: one private headless Chrome, numeric loopback port 8796,
no DB/application credentials, no external/non-GET requests, no installs/build,
under five minutes and 20 MiB of ignored PNG/receipt output. Check disk before
running. The runner starts/closes only its own Vite/browser processes and uses
the runner config loader to keep shared dependency directories read-only.

Checks cover full content, href/value parity, stat alignment, no overflow or
nested controls, 44px actions, all ten keyboard stops, visible focus, Enter,
touch selection, empty state and unbroken strings at 1440/390/320 CSS pixels.
200% root text enlargement is separately named and tested at those widths; it
does not claim actual browser UI zoom. Native anchor destination/Back checks
do not prove Next App Router restoration. Physical iOS/Safari, screen-reader,
hosted data and shared-shell integration remain reviewer checks.

Before/after/focus/long/empty captures and source/input hashes are saved under
`evidence/`. Inspect actual pixels for density, full identity and label legibility
and measure rendered contrast before accepting. The old layout's ellipsis is
retained in before captures; no claim is made that it satisfies the new checks.
The fixture has no shared header or bottom nav: those stay PR87's separate scope.
One loader call and zero render-time fetches are covered by the offline test;
profile-prefetch configuration stays unchanged.
