# Trophy Room approved embroidered champion artwork

Scope: `ChampionBannerCard.tsx` and its CSS module, from main
`5ee506d56c9f4e973564f1082525e3f088c9ce9f`. Coordination claim:
[FIX IN PROGRESS, HOLD MERGE #83](https://github.com/aidandaly24/goat-hoopers-site/issues/83).

The flat CSS crimson pennant is replaced with the existing approved Josh 2025
v4 render. The exact transparent WebP supplies woven cloth, raised stitches,
padded outer rim and hanging hardware in its approved navy/muted-gold palette.
It renders at 180px on desktop and 140px on compact phones, preserving 512:896
proportions. It uses no image optimizer, client island, animation or WebGL.

Season, team, 17–4 regular season, 2–0 playoffs, +988.0 differential and final
326.0–251.5 over papichooter remain selectable HTML, with numeric mono styling
and the existing `/teams/5` destination. Empty image alt avoids repeating that
identity to assistive technology. Artwork is restricted to the exact verified
2025 Josh title; unmatched titles retain their text without unrelated artwork.

## Retained authoring and provenance

No new artwork was generated and no source or runtime asset was altered.

- Runtime: `public/courtside/banner-roster-5-josh-diddys-roster.webp`, 47,800
  bytes; SHA-256 `c617cf48c9858e601bc41409e9f795e84e98b504e3136588f71cf6a8f96f052f`.
  This matches the approved v4 and Courtside provenance.
- Reusable source: `blender/embroidered-banners-v4/GOAT_HOOPERS_Banner_Template.blend`,
  SHA-256 `50f2ab8d52bd21160ebfb1ef1e1eb26cfe1e2c4b38691fd69f27f936f6eccc24`.
- Name/title configuration: `blender/embroidered-banners-v4/configs/josh-diddys-roster.json`.
  Generator, satin-lettering source, palettes, bundled font/license and original
  provenance remain unchanged. Follow that directory's README to update names.
- Selected hybrid logo source and approved runtime variants remain unchanged.

The installed Mac Blender 5.2.1 LTS starts outside the sandbox, using Python
3.13.13 with NumPy, but lacks Pillow and SciPy. Those two packages are required
by the v4 generator. A sandboxed Blender startup crashed; the isolated package
availability check outside the sandbox succeeded. No packages were installed
into Blender and no new render is claimed. Exact approved asset reuse is the
supported fallback for this already-rendered title.

## Independent design reviews

Two independent reviewers visually inspected the actual approved Josh WebP and
retained v4 source/config before treatment selection. Both recommended exact
reuse with selectable results outside the image and bounded mobile sizing.
Both then inspected the actual rendered desktop/phone implementation against
the approved reference and passed the scoped artwork treatment without a
blocking finding. Their review covers the champion entry, not the shared shell.

## Actual rendered evidence

The existing `qa/paper-slate/` fixture mounts the real production TrophyRoom,
ChampionBannerCard, tokens and shared chrome with the checked-in verified 2025
history. It uses existing approved local fonts. It does not exercise a deployed
Next route, live APIs, accounts or a database. Private Chrome 155.0.8059.40 and
the installed Playwright capture actual pixels, using loopback GET-only requests
with WebGL disabled and reduced motion.

Six native Library images were delivered privately: rendered before/after
desktop at 1440px, phone at 390px, and phone entry crops. Private Library
access links are intentionally kept out of this repository and its PR.

Task-owned local evidence also includes 320px captures, enlarged-text entry
captures and browser receipts. At 1440px, 390px and 320px, normal page width
equals viewport width, the canvas remains Paper + Slate, every original result
is present, artwork loads at the correct ratio and the link has an unclipped
solid keyboard focus outline. No page errors, external requests or model
requests occurred. The entry wraps within its container at 200% root text.
The existing full-page/shared chrome overflows at enlarged text, and fixed
navigation overlaps that enlarged capture. The shared-shell owner must resolve
and recapture that flow; this PR does not claim a full-page accessibility pass.

The supplied user image could not be materialized: the supported Library
helper returned HTTP 403 twice, including
a freshly prepared transfer. Library image read returned metadata/OCR rather
than pixels, and browser download surfaces were unavailable. The author did
not inspect or reconstruct the supplied photo. The before image above is an
actual render of base main's production component with identical verified data.

## Validation and release boundary

- Typecheck (`tsc --noEmit --incremental false`), focused component ESLint and
  whitespace checks pass. 443 offline tests pass; 13 opt-in local-DB tests skip.
- Initial locked dependency installation hit ENOSPC. A locked install without
  optional packages and the lockfile's Vite native binding enabled the fixture
  and offline checks. Host Node is 25.8.1, outside Vitest's declared engines;
  CI must repeat checks using the repository's supported Node 22.
- The first production build compiled successfully, then failed writing caches
  due to ENOSPC. After clearing this task's failed build caches, `npm run build`
  completed successfully, including TypeScript and all route generation.
  CI must repeat checks on the published head with supported Node 22.
- No shared shell, tokens, Newsroom, records, data loaders, database or package
  files are changed. `vercel.json` retains `git.deploymentEnabled=false`.
  No AWS, AgentCore, other repository, paid service, deployment or self-merge.
  Coordinator owns final-head review, serial merge and batched release.

— Aidan's Dot
