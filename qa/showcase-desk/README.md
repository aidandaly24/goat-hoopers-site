# Showcase action-row reflow (#224)

Scope: one responsive CSS rule in `CourtsideHome.module.css`, for the public
`data-league-desk` action bar only. No markup, text, destinations or member
styles change. PR230 owns the separate standings/feed/shared-heading fix.
Unbroken-name directory overflow stays separate.

Baseline source is current main `f023c47ba4da72c083211c7c70388a6504eccbe0`,
CSS blob `840b4d699e5c11d8cd531161ce53feae66807271`. The earlier independent
PR230 review reproduced the same public row at329px (owner333px) for a320px
viewport with200% root text. The matched baseline/head run below must establish
this exact regression; historical numbers are not a fresh-run result.

Reuse the coordinator's saved production Next home-fidelity fixture, existing
browser and read-only network policy. No install/build is attempted on the
constrained Mac. Do not call the live site, sign in or permit writes.

Import `verifyShowcaseDesk` and `compareShowcaseDesk` from `browser.mjs`.
Run `verifyShowcaseDesk(page, {origin, mode:'baseline', source:BASE_SHA})`
against the baseline fixture and `mode:'fixed'` against the proposed head's
fixture. Pass a dedicated Playwright-compatible page with the fixture's existing
GET-only/loopback/avatar-stub network guard. Save the returned reports in the
reviewer's own evidence directory, then pass them to `compareShowcaseDesk`.

The24-case focused matrix covers320/390/1440px,100/200% root text, light/dark,
and public/member desks. It measures actual text fragments as well as element
boxes, checks both full public labels, tests visible keyboard focus and44px
links, and presses Enter on the public link to verify the existing
`#ai-decides` destination in the same document. Member destinations are checked
as hrefs and focus targets; this does not claim a new full TeamHub journey.
The comparison checks unchanged member and desktop bar geometry.

Whole-page scrollWidth is recorded but is not the acceptance assertion: PR230's
separate, still-unmerged fixes and the pre-existing directory stress case can
also cause whole-page overflow. The row itself must remain inside its box and
viewport without overflow hiding. Only an executed matched run counts as
browser evidence; committing this driver is not a PASS.
