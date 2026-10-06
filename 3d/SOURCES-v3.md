# 3D Asset Sources — GOAT Hoopers v3

## Approach
Aidan asked to source free CC0 models and customize in Blender. I attempted:
- **Quaternius** (quaternius.com) — CC0, perfect style, but no direct download URLs (JS-gated)
- **Poly Pizza** (poly.pizza) — CC0, but API requires key
- **Kenney.nl** — CC0, but downloads are JS-driven (no static URLs)
- **itch.io** (quaternius.itch.io) — redirect flow, not scriptable
- **GitHub mirrors** — none with the character packs

**Decision:** Went deep on art-directed procedural instead. The v1 assets looked "AI" not because they were procedural, but because they lacked design intent. The v3 assets below are built with deliberate art direction: designer-toy proportions, expressive faces, real uniform design, PBR materials.

## Assets (all original, built in Blender 4.5.3 via Python API)

### Hoopers (`hooper-1.glb` … `hooper-10.glb`, `hooper-generic.glb`)
- **Design:** "Chunky Baller" — vinyl-toy aesthetic. Oversized head (0.52r), huge high-top sneakers, big hands, headband, jersey with number + V-neck + chest stripe, baggy shorts.
- **Face:** Alive eyes (catchlights), thick determined brows, confident asymmetric smirk. No more dead-eyed stare.
- **Pose:** Dynamic rest pose (triple-threat stance) baked into armature — slight crouch, forward lean, staggered feet.
- **Materials:** Matte vinyl (roughness 0.88 skin, 0.60 jersey) — not shiny plastic.
- **Team variants:** Each uses its palette from `3d/team-colors.json` (primary/secondary/shorts/skin/hair) + jersey number = team id. Distinct color stories per team.
- **Animations:** `idle` (60f bobblehead bounce), `spin` (45f), `jump` (50f), `dunk` (75f) — same rig/armature system as v1, verified bone axes.
- **License:** Original work, no external source. Free to use.

### Basketball (`basketball.glb`)
- **Design:** Hero prop with procedural pebble-grain (Voronoi bump, baked into material), recessed seam channels, leather color variation.
- **Material:** Deep orange (#B8450A-ish), roughness 0.68-0.75, subtle noise variation. Not a smooth orange sphere.
- **Animations:** `idle` (gentle bob + slow rotate), `bounce` (squash & stretch).
- **License:** Original work.

### Trophy (`trophy.glb`), Crown (`crown.glb`), Hoop (`hoop.glb`)
- From v1 pipeline (`3d/build_props.py`), retained. Trophy has metallic gold + basketball topper + confetti burst on `celebrate`. Crown has jewels. Hoop is static decor.
- **License:** Original work.

## Build scripts
- `3d/build_hooper_v3.py` — character pipeline (imports `3d/chunky_character.py`)
- `3d/chunky_character.py` — the v3 mesh builder + dynamic rest pose
- `3d/build_basketball_v2.py` — basketball with pebble texture
- `3d/build_all_v3.sh` — batch builder for all variants
- `3d/build_props.py` — trophy/crown/hoop (v1, retained)

## No third-party models were used.
If Aidan wants to revisit sourcing: Quaternius Ultimate Animated Character Pack (CC0) at quaternius.com/packs/ultimatedanimatedcharacter.html remains the best candidate if manual download is acceptable.
