# Current homepage — editorial redesign study

An isolated, offline review of the **current real homepage**, following Aidan's
October 28 direction to compare the current-home design with Muse's separate
3D scene work in parallel. The older arena draft #267 remains
preserved at `98d67bfc402a173c82ff8cfa20bfd6245c21626a`, unmerged. This study
starts from main `3e536e8c6deb8684ea3a00739be2e71409fa805d` and modifies only
`qa/homepage-redesign/`. No production source, route, schema, root configuration,
dependencies, credentials, data calls or deployment changes.

## What changed

The question is “what matters in my league this week?” A member's primary action
remains **My team / View roster**. Public readers can inspect the featured pairing,
saved picks and every team without signing in.

- Paper + Slate, the selected GOAT logos, Inter and Geist Mono stay.
- One linked matchup heading leads an open edition spread, followed by the
  existing managers, records and known/unknown scores. A shallow original-court
  crop supports that information instead of dominating it. Zero stays zero;
  missing stays Pending. Roster anchors/values stay in their useful lower sections.
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

`CourtsideHome`, the lower-page components, header/footer and their real handlers
are reused unchanged. The current opening alone is substituted with
`EditorialFeature.tsx` by the QA Vite resolver; the baseline URL and archives
still render the original feature. No production import is changed. The new leaf
uses the existing pure pair/saved-pick/clock helpers and unchanged team actions.
A production integration would need an explicitly owned feature change and real
Next checks; this QA substitution is not a new route or data contract.

## Inventory and ownership

The lower-page word/heading/control/ID inventory is compared exactly against the
original component with identical props. Every unique source destination remains
available. The opening's repeated prose is deliberately consolidated, rather
than claiming a verbatim-copy comparison: team names appear once in the H1,
records/managers/scores once below; the member desk uses roster count, standing,
team actions and its distinct AI signal. Known zero and unknown stay different.
The score/provenance hooks and original anchor IDs remain. Portraits, identities,
manager attribution and all 228 roster references stay available.

Opening copy map after independent review6459136388:

- Separate date/edition/sample/stale/season/pair-status lines → one visible
  expandable edition/status area. Sample status, actual editorial date, pending
  next edition and incomplete scores stay visible when closed. Opening reveals
  the exact stale notice, publication state, separate editorial calendar,
  historical game context, selection reason and preseason qualifier when relevant.
- Repeated H1 pair, large pair panel, member opponent desk and caption → one
  linked pair heading, manager/record/score rows and a distinct personal desk.
  The old duplicated caption's status is in the visible compact context; its
  anchor ID remains for compatibility. No matchup or selection fact is removed.
- Long inline AI provenance → visible saved/model qualification and probability,
  with timestamp, stale status and returned model choice in a native disclosure.
  All five full result/provenance disclosures remain unchanged down-page.
- The QA sample-data warning remains visible in a compact review-controls
  disclosure. No photo/portal is mounted by the new feature; decorative footer
  image and aria-hidden montage lettering remain suppressed by QA presentation.
- Muse's c2ec178 review6459241852 also informed the lighter pending-score
  treatment (known zero stays numeric), removal of the duplicate inner standings
  heading, and suppression of the redundant “Your roster” caption under the
  first portrait. Stale AI qualification stays visible with disclosures closed.

The latest user request also permits an authentic court image/game language in
the regular-page option. After inspecting the original `public/courtside/arena.jpg`,
the actual free-throw preview and the existing game material roles, the opening
uses a shallow crop of the original GOAT court below the matchup facts. Its
caption explicitly calls it an illustration; the accompanying real Play free
throw link uses the existing destination. Text/controls sit on paper rather
than a busy photo. This is a bounded image, with no renderer or scene work; Muse
owns the immersive 3D option separately. The source file is reused unchanged.

Further read-only craft references: [Rauno's contrasting aesthetics](https://rauno.me/craft/contrasting-aesthetics)
supports an intentional contrast between athletic court material and readable
UI; [interaction design](https://rauno.me/craft/interaction-design) and
[Emil's design engineering guidance](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md)
inform immediate familiar controls and restrained motion. These are selective
design inputs, not installed skills or wholesale landing-page templates.

The original c2ec178 screenshots remain recoverable at that immutable commit.
Current screenshot filenames are updated in place after each reviewed revision.

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
# Add &ai=missing or &ai=stale to inspect saved-result qualification.
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

`review/verification.json` records the source revision and 24 actual Chromium
scenarios: exact unchanged lower-page inventory and retention of every source
destination in public/member and missing-editorial states; explicit deduplicated
opening facts/status/disclosure checks; search, both sort controls, keyboard
roster expansion, all 24 member
valuations, saved provenance, standings sorting; light/dark at 1440/390/320 and
separate `html {font-size:200%}` checks; theme toggle and compact-menu Escape/focus;
no page errors, no remote resource requests. More content is visible as it grows;
no height clamp or clipping is used to make reflow pass.
Normal 390px checks also record the actual personal-desk and roster-heading
document offsets, with regression ceilings of750px/1200px respectively; 200%
text remains independently checked without those normal-density limits. Four
additional public/member stale/missing-AI cases check visible qualification and
the zero-versus-Pending distinction with context/provenance disclosures closed.
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

The old homepage gives the court photograph more theatre. This study keeps a
bounded illustration of the same court while leading with useful league facts
and a clearer personal action. It remains a reviewable design option alongside
Muse's immersive scene, not an approved production replacement.
