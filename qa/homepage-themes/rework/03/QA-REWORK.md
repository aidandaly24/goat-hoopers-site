# Direction 03 — bounded route-truth rework

This is a separate runtime copy of the frozen Broadcast Network first submission. [The original DESIGN.md](../../directions/03/DESIGN.md) remains first-submission history, including its original hash and verification limits. It has not been rewritten as evidence for this rework. The original runtime and root-owned first images remain untouched.

## Corrected behavior

Root's pinned-base route audit established that `/stocks?player=…` is not consumed by the Stocks page or board and does not select a player. This copy removes that unsupported implication. Every former price/selection link is now a plain, retained modeled value beside an explicit **Open Stocks** link to `/stocks#player-board`. Separate `/player/:id` profile links remain intact. The link opens the existing market workspace; it makes no selected-player or inspector-state promise.

There are 38 replacements in member view and 13 in public view, covering the member top three, all member values, public price watches, around-the-league watch and ten franchise price anchors. General Stocks navigation and the existing Open market action remain ordinary workspace navigation. No selected-inspector behavior, production route support, new data or backend work is introduced.

Crimson/royal-blue broadcast art direction, Barlow Condensed/DM Sans, court crop, scoreboard, five-pair slate, running order and all other content are preserved. A small local style makes each new workspace label readable and at least 44px high. Prices are no longer anchors with unsupported selection meaning.

## Exact-source checks

Installed Chromium and Playwright against the root-owned server on port 4206:

- Rendered member/public × ready/stale/missing AI: six states.
- Zero `/stocks?player=` runtime links. All 38 member / 13 public replacements have exact `/stocks#player-board` href and visible “Open Stocks” text.
- Compared rendered ready states against the frozen original: every dollar-price string and every `/player/:id` href matched exactly, including duplicates. The complete href inventory matched after applying only the intended Stocks-query-to-workspace substitution.
- Retained 10 directory containers, 10 modeled faces, 228 unique roster references, 24 member value rows, five ready/stale saved rows and zero missing-result saved hooks.
- Thirty-six opened-disclosure geometry cases: six states × 1440/390/320 CSS px × actual root font 16px/32px. Document scroll width equaled the viewport in every case; body text measured 16px/32px. Narrow reflow and actual 200% root text enlargement were checked separately.
- Menu Enter opens; Escape closes and restores trigger focus. Player search/clear recovery, roster-size directory sort and standings PF sort passed in all six states.
- All visible tested primary controls, disclosures and workspace links were at least 44px high on phone.
- No browser page errors, failed responses or external runtime requests during the six-state checks. Reduced-motion rendering retains all information.
- Inspected the actual rendered desktop member value band and phone team/price/workspace-link treatment. Temporary author captures were removed; root owns the recapture set.

These checks establish static-fixture link truth and retained content/control behavior. They do not establish Next route navigation, deep-link scrolling on the real Stocks route, selected-inspector support, physical-device behavior or screen-reader acceptance. No unsupported query behavior is claimed. Root's supplied pinned-base route audit is the reason for this correction; this bounded copy does not inspect or modify production files.

## Frozen sources

Rework `index.html` SHA-256: `13098dd6014959b46877a4aeaf1d5704a1489062297ed7f9667d09ecfdc42ad3`

Unchanged first-submission `index.html`: `2e41c9101d01834c56746827596ee7a71d3df676b617c5f5adf8664c20f5ff45`

Unchanged first-submission `DESIGN.md`: `dcb9be49dd0047b18b783233feabb600b66ae66453fd828946cea1d948997066`

Files delivered: `index.html` and this `QA-REWORK.md`. No Git operation, production change or broader redesign was performed. Source-ready; root may recapture this runtime copy.
