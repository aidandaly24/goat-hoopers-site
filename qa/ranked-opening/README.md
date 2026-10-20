# Held opening verification

Run with installed dependencies and local Chromium:

```sh
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node qa/ranked-opening/verify.mjs
```

The script follows the existing credential-free Next boundary harness: a
temporary production Webpack app imports the actual Arcade/leaderboard pages,
surfaces and clock API with a minimal one-main layout. The practice fixture uses
the same unchanged public component/props as the actual game's early return.
External server fetches and external/non-GET browser requests are blocked.
No provider, database, migration, paid call or deployment is used.

HTML/RSC and the real clock response are checked directly. Browser responses
then substitute explicit synthetic as-of values to exercise future/zero states,
skew, hidden return, failure/manual recovery and layout at 1440/390/320px and
200% text. Real Next navigation reaches Practice Court and returns to the board.
This is not a deployed/full-shell/auth/DB verification. Reports/screenshots go
to `/tmp/goat-ranked-opening-evidence` (or `RANKED_OPENING_EVIDENCE`). The script
removes its own temporary app and stops its own server/browser.
