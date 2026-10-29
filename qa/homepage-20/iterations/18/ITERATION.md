# Direction 18 — author iteration

This iteration starts from **`qa/homepage-20/repairs/18`**, including root’s enlargement fixes. The frozen original and repaired source remain unchanged. The copied `DESIGN.md` and `QA-REPAIR.md` are source-history records; this file describes the new iteration and its checks.

Review inputs were reviewer 05, reviewer 08 and reviewer 12. All three advanced the bounded night-to-paper hypothesis conditionally, with explicit concerns about root-font enlargement, screenshot ambiguity, repeated identity and the length of the lower reference.

## Exact changes

- Preserved the quiet, opaque dark matchup, known **0.0**, **Pending**, incomplete state and early **My team / View roster / Saved AI picks** actions. Public still has its early league action. All subsequent working content remains paper.
- Put **STATIC PRACTICE PREVIEW** before the original screenshot. The same caption says **Local practice · no rewards**, explicitly distinguishes the screenshot HUD from fantasy/live scoring, and provides a 44px Play control. The image is contained at 240px on desktop and 190px on phones, including enlarged-text layouts. No live game interface is implemented here.
- Reduced the member nameplate to “Your roster desk,” manager, 24-player count and standing. Team name and current record remain in the matchup; they are no longer repeated as a second large personal heading. Valuation coverage, model basis, computation time, all 24 values, top three values and history-unavailable status remain.
- Moved the **single** original arena figure from the bottom tools section to the paper transition. It is a small original-arena caption/link alongside the member/public desk. No duplicate arena was added.
- Removed the AI rows’ redundant full-pair identity column and probability bars. Each row keeps its explicit actual returned choice, both named probabilities and independent confidence. Desktop places provenance beside the result; opening it uses the full row. Phone keeps a compact stacked result and native disclosure. Saved time, model/prompt, both evidence states, unavailable snapshots/baseline and ordered-pair checks remain.
- Integrated all **ten faces** into the matching directory rows, alongside top modeled player, position and price. This removes a separate gallery pass through the same ten teams. Every team/manager/current opponent and all **228 roster-list player links** remain. Previous-manager attribution is retained wherever the 2025 record is disclosed.
- Kept root’s flexible caption, `minmax(0,1fr)` desk sizing, value break opportunity, footer wrapping and enlarged header repair. The phone week/status line can wrap to its natural width instead of being confined to a narrow fixed column.

## Exact-source checks

Installed Chromium with Playwright, served by root at `/qa/homepage-20/iterations/18/index.html`:

- Member and public each passed **1440px, 390px, 320px and 390px with `:root { font-size:200% }`**. The last case computes a 32px body. Document width equalled viewport width in all eight cases, collapsed and with **all native disclosures open**, including navigation/footer.
- Ready states each retained 10 teams, 10 faces, 10 standings rows, five AI pairs, 228 roster-list links / 228 unique roster players and one original arena image. Member retained 24 value rows; public had zero personal blocks/value rows. Local images all loaded.
- At 390px, both modes passed stale and missing AI cases, also with all disclosures open. Stale retained five labelled saved pairs; missing displayed Unavailable with zero prediction rows. Scores stayed 0.0 and Pending in all 12 checks.
- Player search for Lillard returned one team and opened its roster. Team and standings name sorts placed Huff n’ Puff first. Keyboard Enter/Escape on Menu restored trigger focus. Reduced-motion emulation had zero active animations. No browser page errors or failed requests occurred.
- Keyboard traversal across the scene/paper boundary was checked in both modes at 390px. The dark link had an immediate solid 2px amber outline; Tab reached the next paper link with an immediate solid 2px slate outline. Both matched `:focus-visible`; the focused paper link was below the sticky header rather than obscured by it.
- **Computed rendered contrast**, using the actual foreground and nearest opaque ancestor background: scene secondary `rgb(155,168,188)` over `rgb(10,14,26)` = **8.00:1** for week, matchup heading, managers, Pending and source metadata. Preview local-practice/explanation text over `rgb(17,24,39)` = **7.37:1**. Preview heading `rgb(242,245,250)` over that raised scene = **16.23:1**. Essential text remains outside the image.

Machine-readable self-check evidence is in `selfcheck/checks.json` and `selfcheck/contrast-focus.json`. Local screenshots in that folder record desktop/phone/reflow/enlargement and stale/missing openings, plus working-list previews. Root’s forthcoming captures and independent review remain separate evidence.

Source SHA-256 values:

- Frozen original `directions/18/index.html`: `88c0f5f4c89e3b3cd44dc3a1458802860df9986b6c04c0e3d359ac9a7985fa32`
- Repaired source `repairs/18/index.html`: `0fb1bc74c0fff4256ba0eea5c0dc37ab750b98f1d196b4c675eee62199705672`
- This iteration `iterations/18/index.html`: `442bad4cf6fbc18c874800e738474ecb9d73f3e49797d0d6caad7588d24f63b6`

No production files, installs, network data calls, Git operations or release actions. These checks establish static-fixture behavior, not authentication, actual game operation, production routes, physical-device or screen-reader acceptance. No remaining blocker; source is ready for root’s fresh capture/audit.

## Final coordinator hygiene

A whitespace-only blank line inside CSS was normalized after the author check.
Fresh captures and common checks use the final source; see
`../../evidence/final-hygiene-proof.json` for before/after hashes and exact
image-byte comparisons. No CSS rule, markup, data or interaction changed.
