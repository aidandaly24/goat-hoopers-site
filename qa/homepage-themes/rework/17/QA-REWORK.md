# Theme 17 — phone text enlargement rework

Source-ready runtime: `/qa/homepage-themes/rework/17/index.html?view=member` or `?view=public`. Append `&ai=stale` or `&ai=missing` for those states. The original `directions/17/` files and the first submission evidence remain unchanged. `DESIGN.md` here is the unchanged copy of the first submission’s design record; this report adds the phone enlargement correction.

## Exact reproduction

Installed Chromium, Playwright, viewport **390 × 844 CSS px**:

```js
await page.goto(url);
await page.waitForSelector('[data-mock-ready="17"]');
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: 'html{font-size:200%!important}' });
```

The copied original reproduced **467px document width** in both member and public views, with computed body text **32px**. The status, section actions and directory player/opponent groups exceeded their available width. The first submission’s 200% check was at 1440px and did not establish phone text enlargement.

## Changes in this copy

- Header/status, section actions, archive rows and value labels can wrap. Flex/grid children have an explicit zero minimum, bounded width and word wrapping. The joined workspace no longer clips oversized descendants to disguise their bounds; the cobalt panel keeps its rounded corners directly.
- Phone team and player groups wrap according to available width, preserving readable names rather than compressing them into single-letter columns. Current opponents and modeled faces use `minmax(0,1fr)`. Phone score rows wrap identity and score into separate lines when enlarged; their decorative initials are omitted on phones.
- Phone standings retain the native table, headers and caption. The visible rows adapt to labeled Rank/W–L/PF groups, with complete numbers and units. Added cell labels do not change any standing or value. Sort choices use concise, meaningful labels, including Name A–Z, Roster high and PF high, so native selections fit at 32px body type.
- Editorial identity/stat groups, game previews, court/source groups and roster-value rows wrap instead of relying on fixed intrinsic tracks. The headline money value gets a discretionary break before its decimal point; no digits or units are removed.
- The phone logo and controls wrap onto separate rows when needed. Dock labels remain whole; the dock itself can wrap. A local `ResizeObserver` measures its actual height and reserves footer/anchor clearance. The expanded final source disclosure remains above it at document end.

The ice/cobalt/mint palette, Inter scale, action hierarchy, source data, all product destinations, native disclosures, audit hooks and actual AI returned choices are preserved. No root font, component font, text scale or page zoom is reduced. No page overflow is hidden to obtain the result. The existing probability-bar clipping is bounded to its graphic; the phone table header is intentionally visually hidden while its cell labels are visible.

## Final checks on these exact runtime bytes

Executed **36 cases**: member/public × ready/stale/missing × 320/390/1440 CSS px × 100%/actual 200% root text, each at height 844px. Waited for fonts before injecting the exact important root rule. Computed body text was 16px or 32px respectively.

- Closed and all main/footer disclosures open: document width equals viewport in every case. No visible descendant exceeded the page bounds, and no visible main/footer content had internal horizontal overflow. The deliberately visually hidden table header was excluded from the latter check.
- All cases retain ten team containers, ten modeled faces and 228 unique roster player links. Member retains all 24 value rows and four personal areas; public has no personal areas/value rows. Ready/stale retain five saved AI hooks; missing has zero saved hooks and all five unavailable current pairings. Stale has its visible warning.
- At 390 × 844 with the actual 200% rule: player search, manager search, empty/Clear and focus restoration, team alphabetical sort and standings alphabetical sort pass. Header Enter/open, Escape/restore, dock More/Escape/restore and open-menu width pass. Open menus were also checked at 320px with 200% text for both views.
- The expanded final source disclosure clears the measured dock at document end. Reduced-motion emulation retains the complete directory. No page errors or nonlocal requests occurred.
- Visually inspected enlarged phone opening, team/player content and labeled standings. Root owns the final bulk captures; temporary local check images were removed.

Not established: physical device behavior, screen-reader behavior, actual product routing/history, authentication, market inspection or playable game/reset/exit. Unmatched AI keeps its existing unavailable source branch; no separate unmatched fixture URL is provided. No release, Git, API, producer or production change was performed.

## Exact hashes

SHA-256 of the source-ready rework runtime/design files:

```text
db3a2cd79d9b869c4465470a1de87185027abe8d80a22a0803f10ac7fc834f0a  index.html
cf8e0c86d1984fd6c9d572a593073b12c3f05287aff6a5a712d890bcd3b035b4  workspace.css
9fa2f6fb0c5df620fe53e0ba5d4adfab4f90602129495d2c81315a1961c9352f  workspace.js
ee57abd6b18daf185ebe110b7beaa9f4ea4d0b99134cb38f19c3c450bf27b7d1  DESIGN.md
```

Verified unchanged original `directions/17/` hashes:

```text
db3a2cd79d9b869c4465470a1de87185027abe8d80a22a0803f10ac7fc834f0a  index.html
46c4ddb570e5d2338a5b1b5191194aae20e3ed496899a7aafe8f5acc4e8a258f  workspace.css
2fc014c06e12198052bfc1c5c175fc7a4f163fda104f40d9afbd6fe3316463c0  workspace.js
ee57abd6b18daf185ebe110b7beaa9f4ea4d0b99134cb38f19c3c450bf27b7d1  DESIGN.md
```

The report’s own SHA-256 is supplied in the source-ready handoff, avoiding a self-referential file hash.
