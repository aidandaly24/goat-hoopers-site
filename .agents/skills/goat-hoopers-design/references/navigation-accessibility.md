# Navigation and accessibility review

Use for destination changes, responsive chrome and interactive access. Read
DESIGN.md's controls, responsive behavior, global-navigation recommendation and
acceptance sections. Keep its proposed menu distinct from implemented source.

## Inventory before changing chrome

Inspect the root composition and current `SiteHeader`, `MobileNav`, `SectionNav`
and footer consumers. Record their destinations, order, active-route handling
and signed-in/out actions. Check the shared-shell owner's current #84 / PR #87
work before recommending consolidation; do not reproduce its offset repair.
The source snapshot in DESIGN.md is dated, so recheck the working head.

Follow the task from a direct URL and a second route, with ticker content and
without it. Include nested paths, `/team` versus `/teams`, login/claim/logout,
archives and league tools. A link appearing only in a rotating ticker cannot
establish persistent destination access. Consolidation must preserve the
inventory rather than quietly remove lower-frequency destinations.

For a proposed disclosure, walk open → activate link → return → close, then
Escape and keyboard traversal. Use the nonmodal semantics in DESIGN.md;
verify hidden children and inactive layout copies are absent from the tab
order. For true modal inspectors/readers, preserve their distinct containment,
Close and restoration behavior. Check target scroll clearance at the actual
wrapped chrome height, not just initial page load.

## Select and label evidence

| Evidence | Establishes | Does not establish |
| --- | --- | --- |
| Source inspection | Destination definitions, semantics and intended state handling | Visible focus, contrast, overflow or working navigation |
| Production-component fixture | Rendering/interaction with the stated synthetic props and fonts | Next App Router Back/Forward, live/auth data or physical device behavior |
| Real Next route | Actual routing, direct URLs, anchors and recorded departure/restoration | Actual iOS safe area or screen-reader experience |
| Actual device | Named browser/device/input behavior | Other devices or assistive technology |
| Screen reader | Named reader/browser announcements and traversal | Universal accessibility compliance |

Record exact revision, state, viewport and method. Test 200% enlargement and
320 CSS px reflow independently; inspect full-page overflow, expanded controls,
long names and the final focused link. For Back/Forward, record scroll at actual
departure: a test driver's automatic locator scroll can change the expected
position before navigation. An HTTP 200 or accessibility tree alone is not
behavioral proof. Use DESIGN.md's contrast units and target-size distinction
when classifying findings; report applicable exceptions and unperformed checks.

## Source-study attribution

[accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility)
informed semantic controls and separate keyboard, reflow and assistive-technology
checks. Apply its useful principles through the site's concrete paths; source
or automated checks never substitute for an unperformed screen-reader pass.
