# Emoji-free controls review

The isolated fixture composes actual site surfaces with the existing frozen
homepage/history, synthetic market/news and explicit offline draft-roster fixtures.
It never signs in, accesses production data, submits scores or calls a paid API.
No user-created team name or external story is filtered by the product.

Run the existing installed Vite with `--config qa/controls/vite.config.mts`, then
`NODE_PATH=/path/to/existing/playwright/dependencies node qa/controls/verify.mjs`.
The verifier uses `/usr/bin/chromium` by default, supports `CONTROLS_CHROME` and
`CONTROLS_EVIDENCE`, and targets numeric loopback port 4199 only. Stop the owned
Vite server afterward. Screenshots and the report stay outside the source tree.

This establishes component layout/control behavior in Chromium emulation, not a
physical iPhone, screen reader, live account or deployed revision. A separate
actual Next route check verifies the produced app's Arcade navigation.
