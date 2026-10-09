# Newsroom private browser fixture (historical)

This is a historical QA record for the fictional Newsroom reader UI. [PR119](https://github.com/aidandaly24/goat-hoopers-site/pull/119)
replaced that UI with real article links and removed `src/surfaces/news/stories.test.ts`
and `src/surfaces/news/storyLinks.test.ts`. The browser runner still checks the old
voices and reader dialogs, so its commands and coverage below are retained context,
not a maintained runnable regression guide for the current Newsroom. Preserve the
fixture and saved evidence; the old pending checks below do not describe current work.

This mounts production Newsroom, SiteHeader and MobileNav with explicit synthetic
stories. No loader, API route, auth/store or DB is imported. Fonts reuse approved
local Inter/Geist assets. Next Link becomes an ordinary anchor; synthetic profile
destinations exercise navigation and Back. This is not an application route.
The anchor adapter cannot prove Next App Router transitions, route reuse or
client segment restoration. Those require a DB-free real-Next fixture or a
reviewer-owned hosted check; they are not covered by the existing PNG receipt.

With supported Node 22, repository dependencies, existing Playwright and Chrome:

```sh
node qa/newsroom/browser.mjs /absolute/path/playwright/index.mjs '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

The runner starts its own numeric-loopback Vite server on port 8798 with a minimal
credential-free environment, blocks every external and non-GET browser request,
uses private headless browser contexts, and closes its browser/server. Normal
local approvals are required. An ignored receipt and actual PNGs live in
`qa/newsroom/evidence/`. Viewport captures show phone screens; `front-page-full`
retains the complete feed. This is Chromium viewport/touch emulation, not physical
iOS/Safari or hosted/backend verification.

Checks cover 1440/390/320 widths, repeated Enter/Space filters and category
history, exact voice URL/pressed state, prose/actor links, touch opening, native
modal keyboard behavior, Close/Escape/focus, Back/Forward, direct/missing IDs,
actor destination → Back, sparse/empty recovery, long unbroken headlines, long
prose/reachable sticky Close and 200% text. Chrome may traverse browser chrome at
a modal boundary; background controls must never receive focus. No custom trap.

At 200% root text, the unchanged shared header overflows (630px at phone widths,
1707px at 1440). The runner records that and separately asserts Newsroom/reader
bounds; it does not claim a full-page zoom pass. Shared navigation is separately
owned. Tokens/globals/header are unchanged.

`?state=empty`, `?state=sparse`, `?state=long`, `?state=changed`,
`?state=timestamp` and `?state=duplicate` supply bounded frozen variants. Native
story/section history retains unrelated fixture queries. Pure grouping tests
run in the offline suite under `src/surfaces/news/stories.test.ts`. Reader links
include a meaningful-content fingerprint: only regenerated rookie/rumor/take
clocks are excluded, while transaction-derived time is retained. A meaningful
replacement, an unguarded link or an ambiguous ID must show unavailable;
`storyLinks.test.ts` verifies that regression without a DB or browser. The runner
also contains the revised browser checks.

For the stable-revision follow-on, coordinate the shared Chrome slot first, then:

```sh
node --import tsx qa/newsroom/revisions.mjs /absolute/path/playwright/index.mjs '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

This focused runner uses the same production components and frozen fixture
function, no production/DB requests. It compares separately loaded timestamp
and changed-content snapshots, exercises exact v1 compatibility/expiry and v2
direct reading, explicit current-story recovery, voices, history and focus. It
records the exact Git head/tree and checks, stops above the128MiB disk floor,
preserves old evidence and closes its own browser/server. It adds no Next build
or installation, and retains the App Router/physical-iOS limitation above.
