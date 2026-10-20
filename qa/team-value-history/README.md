# Team history consumer browser fixture

This is synthetic evidence for the consumer repair on #224. It is not a live
league, provider, database, deployment or all-time-history completeness check.

The fixture copies the current homepage, root layout, ticker slots, catchall and
history API route entrypoints. Source aliases compile the actual consumer and
shared UI. Only data/session responders, the font loader and a small fixture
navigation bar are substituted. Quote/move identities and amounts are synthetic.
The fake trade intentionally contains a participant from another roster: v1's
unscoped arrays must never be rendered as this team's received/sent assets.

Preparation writes to an output folder outside the checkout. Use the repository's
Node version and installed dependencies, Python Playwright and Chromium; no
package installation or application credentials are needed by these scripts.

```sh
python3 qa/team-value-history/prepare.py /tmp/goat-history-review
python3 qa/team-value-history/serve.py /tmp/goat-history-review 4360
# In a second terminal:
python3 qa/team-value-history/browser.py /tmp/goat-history-review http://127.0.0.1:4360
```

The server starts production Next with a sanitized environment and the existing
loopback-only network guard. The browser permits GET only, stubs avatar images,
and blocks other external requests. Mutation handlers throw. The retained ESPN
null adapter is used; no score provider is contacted. Local fonts use the existing
QA font adapter. The real application's independent production build remains a
separate check.

The bounded matrix covers 320px/100%, 320px/200% (both themes), 390px/100%, and
1440px/100%. It exercises default league bounds, every month, missing dates,
pointer/day/week/Home/End controls, presets/custom dates, observation shortcuts,
lazy selected/prior detail, source proof, roster membership changes, unknown
trade-side pricing, retry/409/cancellation, geometry/44px targets/focus, and a
minimal retained standings/ticker/navigation smoke. It does not duplicate the
unchanged full route journey or regression suite. Pass a case name after the
origin to rerun only a failed case; that produces a separate JSON receipt.

`review/` contains the final synthetic receipt and desktop/mobile captures. The
receipt records source blob identities so the tested consumer can be compared
with the PR head. Text scale means a 200% root font size, not browser page zoom.

This PR is a partial repair. Full all-time prices, durable recorded retention,
2025 move coverage, scoped trade assets/counterparties and supported attribution
remain in Muse's producer/data lane. Missing dates are selectable, not fabricated
quotes. Quote differences and entry/exit values are not prices paid in a trade.

A separate baseline check on unchanged `40fccc4eab6846f741ac4eff21b599ed37081f2b`
reproduced a routing limitation: home → account → browser Back → an unknown
nested route renders the 404 while retaining the ticker. The repaired consumer
has the same result. The browser driver records that observation separately;
this PR makes no routing change or blanket route-scope PASS claim. The local
explanation button focuses the inspector without adding a hash/history entry.
