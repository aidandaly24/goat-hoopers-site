# Arcade interaction regression

Run `npm run build` with Node 22 in a clean checkout without dotenv files.
Then supply Playwright separately; no application dependency changes:

```sh
ARCADE_TEST_PLAYWRIGHT=/absolute/path/to/playwright/index.mjs \
ARCADE_TEST_CHROME=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
ARCADE_TEST_EVIDENCE=/absolute/path/to/evidence \
node src/test/arcade/browser.mjs
```

The runner starts the real production app on a private loopback port with
a whitelisted child environment and blocked external server fetches. It
rejects non-GET and external browser requests, uses software WebGL and
native CDP touch events, and closes its own browsers/server. It saves JSON,
logs and screenshots. Browser launch/listen may require normal approval.

Checks: unchanged homepage navigation → Arcade → Play on desktop/phone;
implemented games only; real screenshot; neutral canvas and 44px Play;
320/390px overflow; actual GLBs; native drag/release and button power;
touch interruption; help-text drag cannot shoot; nested SVG Back/help
targets in ready, loading, missing-asset and WebGL-disabled states.

These are Chromium fixtures, not physical iPhone/Safari or production
verification. Competition and rewards remain closed. The gameplay preview
is a 1248×696 JPEG screenshot of the ready court at merged main 5e662152;
it is served directly (`unoptimized`) and is about 46 KB.
