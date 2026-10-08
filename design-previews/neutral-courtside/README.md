# Neutral Courtside palette review

Review-only artifact for [DESIGN.md](../../DESIGN.md). No shared application styles,
components, app logic, data loaders or existing assets are changed. No framework or
package is added. Current layout/content/crops are the same for all treatments.

Open `index.html` through a static server serving the repository root. With an
existing local runtime and permission to bind a local port:

```sh
python3 -m http.server 8793 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8793/design-previews/neutral-courtside/`. The toolbar
offers Chalk + clay, Paper + slate and Linen + burgundy; switch without resetting
scroll. Desktop uses 1440px; 390px and 320px set the iframe's actual
layout viewport. The iframe is borderless with its border on the wrapper, so
the labeled widths equal its content viewport widths. The page uses native radios/select, visible focus, a status
announcement and an iframe title. Without JavaScript, `home.html` remains a
readable Chalk snapshot. Browser zoom remains available. This is an interactive
comparison instead of claiming fresh screenshot captures.

## Existing Vercel delivery route

The generated hosted copy is at
`public/design-preview/neutral-courtside/index.html`, served by the existing
Next/Vercel public-files mechanism at **/design-preview/neutral-courtside/index.html**.
It is absent from normal navigation and both HTML documents carry
`noindex,nofollow`. No deploy setting, provider, permission, DB loader, app route
or API call is introduced. The real HTTP URL awaits coordinator publication
and browser review; this document does not claim a verified deployment.

`build-hosted.cjs` bundles the same captured CSS into its own static stylesheet,
uses existing `/courtside/` asset URLs and copies only 13 already-approved
logo/avatar/font files. Every copy is recorded by source, URL and hash in
`hosted-manifest.json`. Rebuild from the same snapshot:

```sh
node design-previews/neutral-courtside/build-hosted.cjs
node design-previews/neutral-courtside/validate.cjs
```

The hosted files have the same native palette/1440/390/320 controls, fixtures,
state appendix and safe separate-tab links. They add no hydration, WebGL or
automatic remote request; actual image/font requests stay on the host. Serve
the repository's `public/` directory to inspect the hosted copy where local
browser access is authorized. The private portable file is delivered to the
user separately; it is not a public reviewer link.

For cross-environment review, `build-portable.cjs` creates one self-contained
`GOAT-Hoopers-neutral-comparison.html` beside the repository checkout. It embeds
the snapshot in `srcdoc`, all referenced CSS, fonts and 47 approved resources as
data URLs. The same controls set real iframe widths (1440/390/320), so responsive
media queries run at each width without browser viewport emulation. No WebGL or
localhost is required. Navigation still uses real live-site destinations. The
portable output is saved separately to Library; its manifest is kept here.

```sh
node design-previews/neutral-courtside/build-portable.cjs
node design-previews/neutral-courtside/validate.cjs
```

## How this stays tied to the current layout

`home.html` is an offline `renderToStaticMarkup` of the existing `CourtsideHome`,
shared header/footer/mobile navigation and ticker at source `a327e9c`. It uses
the already checked-in `courtside-preview/data.js` sample, explicitly labeled
as a frozen Oct 8 review snapshot, with 10 teams and all 228 roster references.
No live API, database, account, scheduler or fixture refresh is used.

`build-snapshot.cjs` bundles only for offline rendering using existing esbuild,
PostCSS and React. Its review adapters turn Next links into plain anchors,
scope CSS-module selectors deterministically, fix the pathname to Home and
omit the unrequested Three viewer. It never runs a Next build or writes `src/`.
`snapshot.css` and `snapshot-manifest.json` record the production modules and
class map. Regenerate only when intentionally adopting a new reviewed layout:

```sh
node design-previews/neutral-courtside/build-snapshot.cjs
```

All widths and treatments share one generated DOM/CSS. `treatments.css` changes
the color roles, supplies existing local fonts and stops motion consistently.
It removes global glow/grain and uses an approved black logo variant on paper;
it does not change layout geometry, portrait sizes, crops or the scene. The
palette's exact tokens are proposals. No production imports this directory.

The source fixture has empty standings and quotes. `state-examples.html` adds
an explicitly synthetic appendix after the current page, using existing
standings/ticker/badge classes. The notice links directly to it. W/L, signed
quote moves, LIVE plus its dot, all three medal ranks and badges appear on
canvas, raised and hover backgrounds. The same samples and geometry appear in
every palette. Darker semantic aliases replace inherited bright green/red/live
orange and pale medal text; first-place color is separate from action color.
Accent-tinted badge labels use main ink. These are color-state examples, not a
recolor proposal for the approved Stocks workspace or invented league data.

The wide teams divider stays as-is for like-for-like composition. Reducing
its weight and the other excessive separators remains a separate layout PR;
this comparison does not claim to solve that concern.

Native roster details remain usable. Search/sort, matchup/figurine buttons and
other application buttons are visibly disabled in this static snapshot. It
does not demonstrate or reimplement their logic. Profile/player/navigation
links open their existing `goathoopers.com` routes in separate tabs with
`noopener noreferrer`, retaining the comparison. Source links behave the same
way; local disclosure and review controls stay in place. Sorting is owned by the
separate homepage task; game discovery and its full path are owned by the
Arcade task. Keep this separation in combined review.

## Asset provenance

Arena, pennants and portraits reference existing `public/courtside/` files.
Team avatar photos and Inter/Geist Mono fonts reference existing checked-in
`courtside-preview/assets/`, whose licenses and provenance remain in that
directory. `assets/GOAT-HOOPERS-horizontal-black.svg` is copied byte-for-byte
from the approved hybrid logo kit retained by the Courtside task. It is the
same selected logo's black horizontal variant, not a generated replacement.
The selected primary clay master, all other unique assets and source kits are
untouched. See `ASSET-PROVENANCE.json` here and the original
[Courtside manifest](../../courtside-preview/ASSET-PROVENANCE.json).

## Evidence and remaining verification

Retained integrated Courtside desktop opening/player and mobile player/team
captures, including the divider-removal review, and implemented Stocks
desktop/mobile captures were inspected from the approved local GOAT worktrees.
These establish the baseline composition and palette, not a fresh browser run.
Other route observations in DESIGN.md come from source audit.

Supported Mac Chrome selection timed out twice; browser inventory had no
surfaces and the in-app browser reported unavailable. A localhost source read
was denied by the sandbox (`Operation not permitted`); it was stopped without
escalation or bypass. No new screenshot, console, rendered overflow, keyboard
or actual adjacent-surface contrast validation is claimed. Parent reviewers
must open this artifact in a supported browser, exercise the native comparison
controls, inspect desktop/390/320 widths and check actual contrast before the
user chooses exact production tokens.

Offline renderer and script syntax pass. Source-only validation checks local
asset references, module selectors, all 10 team disclosures and 228 roster
references, semantic selector/alias mapping and calculated contrast on the
represented canvas/surface/hover/badge fills. Full repository typecheck
could not pass because the reused existing install lacks `vitest`/`vite`; no
dependency installation or full build was performed. Focused preview/production
typecheck results and contrast numbers are in `VALIDATION.md`.

The preview is temporary: after a palette choice and independent rendered
review, record the selected values in DESIGN.md, implement canonical tokens in
a separate small PR, and archive/remove the preview when it no longer serves
review. Keep approved assets and the decision/provenance record.
