# GOAT Hoopers Blender first pass

Open `GOAT_HOOPERS.blend` in Blender 4.3 or later. **Hero wide camera** is the
intended composition. The court, crowd, typography, player geometry and
materials are editable. This is an original, stylized first pass with
approximate player likenesses, not photorealistic or scan-derived models.

| File | Purpose |
| --- | --- |
| `GOAT_HOOPERS.blend` | Editable scene; both custom fonts are packed |
| `goat-hoopers-render.png` | Supplied 1920 × 1080 first-pass render used by the root README |
| `build_scene.py` | Original arena, lighting, camera and scene authoring script |
| `goat_players.py` | Original procedural geometry for the ten players |
| `PHOTO_REFERENCE_SOURCES.txt` | Public NBA headshot reference links and original provenance notes |

The scene is 5.69 MiB and requires no external character models, image textures
or linked assets. Editing and rendering the saved scene does not require
running either script or enabling automatic script execution.

To render from the repository root, choose an output path in Blender or run:

```sh
blender --background blender/GOAT_HOOPERS.blend \
  --render-output /tmp/GOAT_HOOPERS_ --render-frame 1
```

The saved setup is Cycles CPU, 1920 × 1080, 96 samples. The supplied PNG is
3.04 MiB and used light noise reduction after rendering, so a fresh render may
differ. It was supplied separately from the ZIP and is stored here unchanged.

The source scripts are preserved unchanged from the original archive. Optional
rebuilding targets their original Blender 4.3 authoring environment and Linux
font paths (`NimbusSansNarrow-Bold.otf` and `DejaVuSansCondensed-Bold.ttf`). Keep
the scripts together and use a working copy: `build_scene.py` replaces its
adjacent `.blend` and writes a render unless `--save-only` is supplied. Newer
Blender versions may require authoring API adjustments; the saved scene opens
and renders in Blender 5.2.1 without rebuilding.

Official NBA headshots were appearance references for original procedural
geometry, and are not embedded in the artwork. Uniforms use the fantasy
lineup's classic teams. This folder is separate from the site's existing
`3d/` asset pipeline.
