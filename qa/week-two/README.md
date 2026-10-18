# Week 2 / 82–0 draft review

`/arcade/week-2-preview` is a playable, unranked five-pick preview linked from the
Arcade. It has no account persistence, competition scoring, prize entry, database
access or ranked activation. Reloading starts over. Five picks is this preview’s
format, not an adopted competition rule; 82–0 is a challenge title and no season
prediction or simulated record is generated.

The live route’s tiny client composition supplies the surface with injected
read-only loaders. Enter loads the 30-team ESPN directory once. Each reveal draws
a different team from a browser-local shuffle; only that team’s roster then loads
through the app’s own API. All source-listed athletes are retained, with the
source’s position, jersey and status when present. No handpicked subset is called
a full roster. Search filters the loaded roster without changing its membership.
The UI shows source links, source/cache dates, the returned player count and a
stale-data notice. ESPN observations can lag transactions and are cached daily.
Source verification details and byte measurements are retained in
`qa/week-two/roster-source-verification.json`; API cache/validation behavior is
owned by `src/data/nba-rosters.ts`.

## Surface contract

- Question: which five would I build from randomly revealed NBA teams?
- Primary action: enter → animate the team draw → choose from its roster → lock
  the pick → next team → save a lineup poster.
- States: opening/error/retry, sealed team, finite animated draw, roster loading,
  same-team error/retry, roster/search/selection, locked pick, five-pick finish,
  poster saving/success/error and missing-portrait fallback.
- Narrow layout: one team stage, searchable compact roster, full-width lock
  action and five-slot lineup strip; completed poster above its actions.
- Forbidden patterns: invented ratings or forecasts, pretend rankings, filtered
  celebrity pools labelled full rosters, score submissions or prize commitments.

The draw animates for 2.2 seconds with a persistent Skip animation button. Reduced
motion and hidden tabs reveal immediately; live preference changes stop the draw.
Rotating teams are hidden from assistive technology, which gets one stable draw
announcement and the final selected team. All game controls use native buttons
and inputs. A failed roster request retains the exact drawn team and prior picks.
Previously selected players cannot be selected again. The local browser shuffle
is not a ranked fair-play system.

## Art and export

The opening is authored court geometry/type and five empty pick slots. Source
team logos and small player portraits appear only for the selected team; roster
portraits load lazily. Broken or absent images become initials or abbreviations.
No animation or rendering library was added. Shared tokens/fonts/chrome remain.

The optional poster module loads only on Save lineup poster. It exports a local
1080×1350 PNG and never uploads it. Remote portrait requests use anonymous CORS;
unavailable, blocked or slow images fall back to the complete text lineup rather
than tainting the canvas or preventing export. No source image is claimed to be
original art.

## Offline component review

Use the existing locked dependencies. No installation is needed when the checkout
already has its physical `node_modules` tree.

```sh
node node_modules/vite/bin/vite.js --config qa/week-two/vite.config.mts
```

`qa/week-two/fixture.ts` supplies explicitly synthetic 30-team, 19-player rosters
to the real surface and shared header. These are test-only names, not live NBA
observations, and are never imported by the application. The fixture deliberately
omits root league, stock, news and account loaders. It proves component behavior;
it does not prove upstream freshness, Next routing or deployment.

```sh
node node_modules/vitest/vitest.mjs run src/domain/arcade/roster-draft.test.ts
node node_modules/typescript/bin/tsc --noEmit

WEEK_TWO_PLAYWRIGHT=/absolute/path/to/installed/playwright/index.js \
WEEK_TWO_CHROME=/absolute/path/to/installed/chromium \
WEEK_TWO_EVIDENCE=/tmp/goat-week-two-evidence \
node qa/week-two/verify.mjs
```

The verifier starts/stops an owned numeric-loopback Vite server unless
`WEEK_TWO_BASE_URL` names an existing loopback fixture. It blocks all external,
API and non-GET browser requests. JSON evidence records revision/dirty status,
method and individual checks. Screenshots, downloaded posters and an MP4 of real
phone-emulation browser frames go outside the source tree. FFmpeg is used only
for that review recording.

Coverage includes desktop/phone full five-pick flows and poster downloads,
30-team directory request budgeting, all 19 roster rows including the last row,
search and changed selections, finite draw/skip, fresh restart, directory and
same-team roster retry, 320px reflow at 100% and 200% text, Enter/Space, live reduced
motion, missing portraits and absence of page errors. Chromium emulation does not
establish physical iPhone, Safari, screen-reader or deployed production behavior.
The real Next route/API/source flow has its separate release verification.
