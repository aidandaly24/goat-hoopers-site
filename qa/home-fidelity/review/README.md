# Reviewed homepage comparison

Rendered application source: `c3b9c2a4b67186279524da75c4577235fb2023c0`.
Baseline application source: `7dcdf0aa36611bb52f45e5c483b6fb18e895ccc1`.
Reference design: `501c2abed9bba76424914621690680e2fb53ad62`.

All depicted teams, values, news, scores and AI outputs are isolated synthetic
fixtures. Approved player artwork is used to evaluate the composition. The
fixture source explicitly marks both editorial roles as synthetic. These are
not screenshots of a real logged-in account or proof of live league values.

| View | Before | After |
| --- | --- | --- |
| Member desktop | [1440px](before-member-1440-light.webp) | [1440px](after-member-1440-light.webp) |
| Member phone | [390px](before-member-390-light.webp) | [390px](after-member-390-light.webp) |
| Public desktop | [1440px](before-public-1440-light.webp) | [1440px](after-public-1440-light.webp) |
| Public phone | [390px](before-public-390-light.webp) | [390px](after-public-390-light.webp) |

[Before roster crop](before-member-390-light-roster.webp) ·
[After roster crop](after-member-390-light-roster.webp) ·
[320px dark compact spotlights](after-member-320-dark-spotlights.webp)

`captures.json` records all 24 member/public, 1440/390/320, light/dark captures
and their layout metrics. The centered desktop frame measures 1248px before
and 1088px after. No page overflow or page errors occurred in that capture
matrix. The committed WebP copies are lossless; full-page pixel equality
against their PNG originals was checked during conversion.

Visual inspection compared the pinned original montage and whole-home layout
with these baseline/current captures and Aidan's later compact direction.
The montage returns to overlapping transparent players, a dominant central
face and filled pale team name. The narrower frame, smaller type and editorial
panels reduce scale. Faces retain their cards, real avatar slots and links.
The chart/history slot is unchanged and stays with the #217/#218 owner.

`next-browser.json` records the added 49 production Next browser checks,
including six actual RSC identity-change navigations. No page errors, browser
writes or unexpected external requests occurred. Completed-week loader and
current-total eligibility are separately covered by the tests documented in
`../README.md`; synthetic populated stats are used only to check containment.
Final complete-suite/build/CI results are recorded on PR #221 at its exact head.
