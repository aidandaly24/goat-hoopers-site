# Current homepage — editorial redesign study

An isolated, offline review of the **current real homepage**, following Aidan's
October 28 decision to park the arena alternative. The arena draft #267 remains
preserved at `98d67bfc402a173c82ff8cfa20bfd6245c21626a`, unmerged. This study
starts from main `3e536e8c6deb8684ea3a00739be2e71409fa805d` and modifies only
`qa/homepage-redesign/`. No production source, route, schema, root configuration,
dependencies, credentials, data calls or deployment changes.

## What changed

The question is “what matters in my league this week?” A member's primary action
remains **My team / View roster**. Public readers can inspect the featured pairing,
saved picks and every team without signing in.

- Paper + Slate, the selected GOAT logos, Inter and Geist Mono stay.
- A large matchup headline leads an open edition spread. The decorative court
  photo is replaced by the existing pair's managers, records, known/unknown
  scores and top modeled player values. Zero stays zero; missing stays Pending.
- The personal roster becomes three separate readable identities beside the one
  roster total, coverage, history state and complete valuation disclosure. No
  giant overlapping cutouts or invented history chart.
- Notebook rows, performers/team news, dated player spotlights, saved pick rows,
  a complete ten-player grid, wire, searchable directory and standings have
  different compositions. Open sections and useful hairlines replace repeated
  panel wrappers. Phone standings also use open rows.
- Small tracked uppercase labels become ordinary labels. Team names use readable
  semantic ink, with the stable color roles retained in avatars. Player names,
  full team names, data, controls and source periods remain readable.
- The purely decorative warm court strip at the footer is hidden in this QA
  presentation. Its empty-alt image and all original bytes remain untouched.

`CourtsideHome`, header, footer and their real handlers are reused unchanged.
The typed matchup drawing is a QA portal into the figure; scoped CSS uses exact
resolved module names. A production integration should replace that portal with
an explicitly owned leaf and review the resulting Next boundary. It is not a
production implementation or a proposed new data contract.

## Inventory and ownership

Every original word, heading, link, field, disclosure, ID and hook is retained
in the source tree. Automated comparison removes only the added matchup drawing
and compares the redesign DOM with the same current-home component/fixture.
No original copy is rewritten. The court figure and decorative footer image are
the only images suppressed by presentation; aria-hidden montage lettering is
also suppressed. Portraits, identities, manager attribution and all roster links
stay. The 228 unique player references and all ten teams remain available behind
their native disclosures. The new drawing repeats existing facts, not new claims.

Recap #266 is frozen at `dab8c1611d631a01bf465e414efdf6f962aaa662`.
Power consumer #270 is separate; the merged producer alone adds no current
homepage input. Neither draft is merged, copied or altered here. Their reviewed
data and controls would need a separate integration pass before live replacement.
Ownership/parking coordination: issue #190 comment 6458821872 and #267 comment
6458823192. Fresh Muse review is requested on the new draft; no old arena review
constitutes approval of this study.

## Material and guidance

Only repository assets and dependencies are used. The fixture reuses the existing
pure personalized projection and dated approved directory/editorial sources.
It labels **all current scores, records, prices, form, news and AI synthetic**.
Historical editorial dates, selection reasons, sample labels, stale notice,
source checks, prior-manager attribution and saved-pick provenance remain intact.
Local approved portraits are used where present; missing local portraits retain
the labelled initials fallback without fetching new images.

Applied project-only [GOAT design skill](../../.agents/skills/goat-hoopers-design/SKILL.md),
its hierarchy/accessibility references, and selectively applied read-only public
[Hallmark](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/SKILL.md)
guidance: content/wiring preservation, useful material as composition, typography
and whitespace before cards, and varied section anatomy. Read `references/redesign.md`,
`layout.md` and `craft.md` alongside the main skill (main file inspected at blob
`d27771723e827baa5e2b34d01492783a42df9174`, craft at
`8f7d1101b33845302b5a3b9015752166df1c54a2`). The locked project system and
user's information-preservation requirements override generic marketing-scale
sizes and word limits. No installer, global skill, theme draw, scripts, hooks or
Hallmark linter was executed; no automated Hallmark certification is claimed.

## Run and inspect

Use existing installed dependencies, without installing packages:

```sh
node_modules/.bin/vite --config qa/homepage-redesign/vite.config.mts
# http://127.0.0.1:4197/?view=public
# http://127.0.0.1:4197/?view=member
# Add &style=baseline for the unchanged production component with identical data.
# Add &edition=missing for the editorial-unavailable state.
node_modules/.bin/eslint qa/homepage-redesign --no-error-on-unmatched-pattern
node_modules/.bin/tsc --noEmit -p qa/homepage-redesign/tsconfig.json
node_modules/.bin/vite build --config qa/homepage-redesign/vite.config.mts
node qa/homepage-redesign/verify.mjs
node qa/homepage-redesign/contrast.mjs
node qa/homepage-redesign/capture.mjs
```

The browser scripts use the environment's existing Playwright/Chromium paths.
Vite's client-only build reports the existing imported `use client` directives as
ignored; it does not establish RSC behavior. This is a production-component fixture,
not a real Next App Router, live authentication or hosted route test. Native QA
anchors retain actual source hrefs; destination pages are not reimplemented here.

## Evidence and limits

`review/verification.json` records the source revision and 20 actual Chromium
scenarios: exact content/control inventory in public/member and missing-editorial
states; search, both sort controls, keyboard roster expansion, all 24 member
valuations, saved provenance, standings sorting; light/dark at 1440/390/320 and
separate `html {font-size:200%}` checks; theme toggle and compact-menu Escape/focus;
no page errors, no remote resource requests. More content is visible as it grows;
no height clamp or clipping is used to make reflow pass.
`contrast.json` measures actual text/ancestor-background pairs in the changed
matchup, roster, faces and member-desk regions in both themes and widths. It
resolves the avatar's identical-stop accent gradient; image content is excluded.

Four full-height `public/member × desktop/phone390` JPEGs are below 900KB.
Lossless full-height PNG originals remain. Tall captures use bounded viewport
tiles with recorded integer offsets to avoid the renderer's 8192px texture wrap.
Top/middle/bottom pixels are checked against separately captured viewports;
section order, ten teams, 228 player links and the actual footer are verified.
Native targeted crops show matchup, roster, picks, directory, standings and the
member's dark theme. `capture-manifest.json` and each `*-capture.json` record
dimensions, offsets and source head. Capture-only styles disable animations/caret
and make sticky chrome static without changing its in-flow height; no screenshot
paintover, content substitution or generative editing.

Not established: deployed/live behavior, Next Back/Forward/restoration, real
accounts/providers, physical iOS/Android, manual screen reader or a measured
production Lighthouse score. Desktop/mobile pixels and automated checks do not
replace independent Muse judgment or explicit authorization for live integration.

The old homepage does better at instantly expressing “basketball arena” through
its large photograph. This study trades that mood for useful league information
and clearer hierarchy; it retains the league's actual people and identity, but
the visual direction remains a reviewable proposal.
