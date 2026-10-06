# Team Colors — 3D Asset Mapping

The hooper figurines use the site's official team identity colors so the 3D
characters match the 2D site exactly.

## Primary colors (jersey)

These are **copied verbatim** from the site's design tokens
(`src/ui/tokens.css` → `--gh-team-1` … `--gh-team-10`), keyed by Sleeper
**roster id** — the same mapping as `teamColorVar()` in
`src/ui/teamColors.ts`. If the site ever changes a token, rebuild the
hoopers (or just that team's GLB) to match.

| Roster | Team                  | Manager          | Primary (jersey) |
|--------|-----------------------|------------------|------------------|
| 1      | Reaves Dropper        | Aidan            | `#f2b33d` gold   |
| 2      | Ware the Hoes At?     | Aedan            | `#38bdf8` sky    |
| 3      | Stephon Castle's Back | Tommy            | `#f472b6` pink   |
| 4      | The Fun Guys          | Phil             | `#a3e635` lime   |
| 5      | Josh Diddy's Roster   | Vann             | `#c084fc` purple |
| 6      | Huff n' Puff          | Griffin          | `#fb923c` orange |
| 7      | papichooter           | papichooter      | `#2dd4bf` teal   |
| 8      | NeuralNets            | MuseFantasyBball | `#f87171` red    |
| 9      | Lebron Theme Team     | Lord Lax         | `#94a3b8` slate  |
| 10     | T Halibooty           | Tyrese           | `#818cf8` indigo |

## Secondary palette (3D-pipeline choices)

These are chosen by the asset pipeline to complement each primary — they are
**not** site tokens. Used for: headband, arm sleeve, wristband, shoes,
jersey stripe + collar.

| Roster | Secondary (accents) | Shorts    | Skin      | Hair      |
|--------|---------------------|-----------|-----------|-----------|
| 1      | `#141414` black     | `#6b4e12` | `#c68642` | `#1a1a1a` |
| 2      | `#0c2a3a` navy      | `#155e85` | `#6b4423` | `#0e0e0e` |
| 3      | `#3a0f22` plum      | `#8a2a52` | `#f1c27d` | `#3b2a1a` |
| 4      | `#1e2e0c` forest    | `#4a7015` | `#8d5524` | `#141414` |
| 5      | `#2a1545` deep plum | `#5b2e8a` | `#ffdbac` | `#4a2c12` |
| 6      | `#3a1c08` espresso  | `#9a4e14` | `#e0ac69` | `#2a1a0e` |
| 7      | `#07332c` pine      | `#147a6b` | `#8d5524` | `#0e0e0e` |
| 8      | `#3a0d0d` maroon    | `#8a2424` | `#c68642` | `#1a1a1a` |
| 9      | `#1e2430` charcoal  | `#475569` | `#6b4423` | `#141414` |
| 10     | `#1e2350` indigo ink| `#434db0` | `#f1c27d` | `#6b4226` |

The **generic** hooper (no team specified) uses a neutral graphite jersey
`#3a3a44` with gold `#f0b429` accents.

## Machine-readable source

`team-colors.json` in this directory is the single source of truth the build
scripts read. Edit it, then re-run `./build_all.sh` to regenerate.

## For the site integrator

- GLB filename → team: `public/3d/hooper-<rosterId>.glb` (e.g. `hooper-8.glb`
  for NeuralNets). `hooper-generic.glb` is the fallback.
- If you add a team-specific color override in the site, keep the *primary*
  in sync with `--gh-team-N` — that's the whole point of this file.
