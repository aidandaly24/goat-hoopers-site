# 11 / Sports Terminal

An independently authored offline homepage direction for the isolated QA experiment. No peer or earlier mock was inspected. Only this direction's folder was edited. The experiment explicitly overrides the older Paper + Slate and Inter visual restrictions; production code, shared styles and data stay outside this work.

The user question is “What is happening with my team, and where can I inspect the evidence?” My team is the primary member action, with View roster beside it. The public desk offers Browse teams and Stocks. Useful working links use their real destination names and paths; there is no pretend command entry, generated feed, invented chart or broker vocabulary.

The palette is green-black `#091710`, lime `#D1FF4B`, mint `#9EE4C0` and pale green text `#E5F5E9`. IBM Plex Mono is loaded from the supplied local licensed file; every size uses root-relative units. Rules align working rows; sharp controls and typography replace rounded cards. The approved white GOAT logo and three small supplied editorial portraits are the only images. Names, values, record columns and source labels supply the texture.

Wide composition uses a reference index at left, a current week and modeled-value desk across the top, then a long working column beside a league reference column. The entire directory spans the working width below. On narrow layouts, content becomes one continuous column in task order. Native roster, source and model disclosures keep every detail accessible without a modal. Container queries follow rem-based text size, allowing enlarged text to change composition independently of viewport width. Header and status links wrap in normal flow. No chrome is fixed or animated.

The current directory pairing is Week 3. A known 0.0 stays separate from Pending; the pairing is explicitly incomplete. October 5–11 editorial stays a dated draft sample. Observed EMA form, completed Week 2 fantasy points, modeled FAAB prices and dated editorial selection have separate basis/period labels. Overlapping best/rough selections appear once, with both labels and all supplied points/GP/coverage. All 228 unique roster links retain position and NBA team; NeuralNets' 2025 record explicitly credits the previous manager as QBs Gremlins.

All five saved AI rows preserve the actual returned choice, including the first away choice at 35% beside the home 65%; confidence remains independent at 20%. Model/prompt/input/evidence details and saved time are accessible. Stale output is visibly stale before expansion. Missing output has no saved-row hooks and retains the five current pairings. Unmatched season/week/roster evidence is guarded in source and renders an unavailable state. No rendering action calls an API. Recorded value history, Power and all six league statistics have explicit unavailable states.

## Verification

Evidence is a local static browser fixture at `http://127.0.0.1:4206/qa/homepage-themes/directions/11/index.html`, using installed Chromium through Playwright. This is not a real Next route or physical-device/screen-reader claim.

- Member and public at 1440, 390 and 320 CSS px: no page-level overflow in default or all-disclosures-open states. All ten directory containers, ten modeled faces, five saved rows and 228 unique player roster links retained. Member has all 24 modeled roster values; public has no personal hooks.
- Separately set `document.documentElement.style.fontSize = '200%'`: computed body text changes from 16px to 32px. All disclosures opened; member and public stay within 1440, 390 and 320 CSS px respectively. This is real root text enlargement, separate from narrow reflow.
- Viewed opening desktop/phone, full opened NeuralNets roster, source details and footer. Inspected the enlarged 320px opening. Data and long names wrap without clipping.
- Menu keyboard Enter opens; Escape closes and returns focus to Menu. Hidden navigation leaves normal tab order. Navigation is nonmodal, normal flow and uses native anchors.
- Player search `Clingan` returns Reaves Dropper and opens its roster. Manager/team search `NeuralNets` returns one team. Unmatched search shows the empty state. Clearing restores all ten. Roster-size sort puts 27-player roster 2 first; standings A–Z puts Huff n’ Puff first; descending PF puts Reaves Dropper first.
- `?ai=stale` retains five saved hooks and visible stale labels. `?ai=missing` has zero saved hooks, visible Unavailable text and all five current pairings. The returned choice/probability mismatch is preserved.
- Local IBM Plex Mono and images load. No browser page errors or external runtime requests were observed. `node --check terminal.js` passes. No installs, packages or external runtime are used.

Opaque sRGB contrast calculations for implemented pairs: ink/ground 16.27:1, muted/ground 10.00:1, mint/ground 12.54:1, lime/ground 15.87:1, alert/ground 13.52:1, muted/raised 7.60:1, alert/raised 10.28:1, control boundary/ground 5.92:1 and control boundary/raised 4.50:1. Filled lime actions and the fixture strip use ground text. Keyboard focus uses lime. Quiet row rules are decorative, distinct from control boundaries.

Limitations: no physical device or screen reader testing; no real Next navigation/history, authentication, linked destination content or full Arcade play/reset flow tested. Unmatched AI fallback is source-guarded rather than a provided query-mode fixture. There is no connected history/Power/league-stat producer, and no fabricated replacement. Root owns the complete comparative captures and independent visual gate.
