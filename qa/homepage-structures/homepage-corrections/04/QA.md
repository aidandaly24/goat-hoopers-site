# 04 — Bounded local verification

Evidence type: **static synthetic design fixture in installed Chromium**, served from repository root at `http://localhost:4207/qa/homepage-structures/homepage-corrections/04/`. These are not production/auth/device/screen-reader results.

Product freeze:

| File | SHA-256 |
| --- | --- |
| index.html | 3af73c437eeeb19fca6b3b34097e105ec7fab14e2351e25112274114ae76a48f |
| app.js | bd6ee75a4ef50f72650d14e0dfd31d69562305e9e23214b7754da8499202b4ed |
| style.css | ea0bedbe8960d5cd730661b919802442edddebc0d7695e6e0839077177995446 |

`checks.json` binds its results to these exact source hashes. Run `node qa/homepage-structures/homepage-corrections/04/verify.mjs` with the existing root server on 4207. The verifier uses only the installed Playwright and `/usr/bin/chromium`; it installs or starts nothing.

## Completed checks

- JavaScript syntax passes for product and verifier. Frozen `polished/04/` has no git diff. CSS has zero literal colors outside `:root`; selector font families use semantic variables.
- **14 bounded layout/state cases:** ready member/public at 1440, 390 and 320 CSS px, plus 1440 and 390 with root font changed from 16px to 32px; stale/missing AI in both views at 390. This is 200% root text enlargement, separate from 320px reflow and from browser zoom.
- No horizontal page overflow in any case, including expanded complete directory and one full roster. No internal vertical content scrollers were found. The phone's expanded five-game panel stays in normal document flow without max-height or overflow scrolling, including at doubled text.
- Six populated main sections public / seven member remain in flow; all ten standings, three editorial stories, ten team entries, 228 full-roster references and ten franchise anchors are retained. All 24 member values remain available only in the member desk. Public has no private value total, team-wire headlines or scouting desk.
- Known zero prints `0.0`; null prints `Pending`. Stale AI prints `Stale saved decision`. Missing AI shows no probability bars and says saved result unavailable. The 35% returned choice is not silently changed to the other team's 65%; confidence remains a separate 20%. All source/model/prompt/null-input/evidence qualifiers stay inspectable.
- **Four actual keyboard paths:** member/public at desktop and phone. Desktop source button Enter, or phone Home/ArrowDown selection followed by Tab/Go Enter, focuses the studio heading and retains every home section. Desktop game-button Enter, or phone toggle Enter / Tab / game Enter, changes the actual pairing, closes the phone slate and focuses the programme heading. Phone focus clears the measured controls. Six consecutive Next game Enter activations per path cycle through all five pairings and wrap while retaining visible button focus.
- The phone game list is also opened from a down-page source. Opening brings the normal-flow list below the sticky controls while retaining trigger focus; Escape closes and restores the score-strip trigger. Menu Escape closes and restores summary focus. Search for Şengün yields exactly one supplied reference; team/player sort controls operate on the retained full directory.
- Local font and image loads succeed. No browser page error or HTTP failure occurred in the main bounded verifier. Reduced motion preserves all seven member sections with zero authored/current animations.
- Separate final 200%-text keyboard checks at 1440 and 390 focus the studio heading correctly. At 390, heading top is 341.8px and controls end at 330px; no overlap. At 1440 the heading starts at 20.1px in the adjacent normal-flow column.
- Final diagnostic full-page desktop/phone and enlarged-text viewports were visually inspected in `/tmp`; parent owns the four final public/member capture deliverables.
- Actual rendered opaque foreground/background samples: ink/white **18.55:1**, scoreboard white/black **18.55:1**, score-context white/royal blue **8.56:1**, secondary/white **6.44:1**, Go white/crimson **6.65:1**, returned-choice crimson/white **7.94:1**. This is bounded paint evidence, not a complete accessibility certification.

## Limits

No physical device, screen reader, production Next routing/Back restoration, actual authentication boundary, real provider result, mini-game playthrough, build or independent acceptance is claimed. Destination URLs are preserved links leaving the static fixture. Power and recorded team-value history still have no connected producer in these facts. No implementation blocker remains.

Exact new files are `index.html`, `app.js`, `style.css`, `CONTENT-MAP.md`, `QA.md`, `verify.mjs`, and `checks.json`, all within this `04/` directory. Root capture work may add separate evidence later. The old polished source and all prior evidence remain untouched.
