# Reusable embroidered banner template, v4

Editable weekly banner authoring kit imported from the approved v4 template
and web-sample packages. Keep this directory together. The 5.95 MiB `.blend`
is the unlettered reusable scene, with packed textures; it is intended for
offline authoring and rendering. Changing weekly matchup/date copy belongs
in HTML. Generate only the one configuration needed for an edition.

## Authoring

`generate_banner.py` regenerates one banner from JSON, using
`satin_lettering.py`, `palettes.json`, the template scene and the bundled
font. The three original presets demonstrate neutral cloth, a two-line
name and a three-line name with the supplied confirmed 2025 title. Presets
are examples, not final color assignments for every team.

Start with a working copy of `configs/neutral.json`, assign a unique
`asset_id`, and set `team_name`, `name_lines` and `palette` for the current
edition. Keep `championship` null unless a title is verified. Run from this
directory using your installed Blender executable:

```sh
blender --background --disable-autoexec --threads 8 \
  --python generate_banner.py -- --config configs/neutral.json \
  --output-dir /tmp/goat-hoopers-banner
```

Append `--no-render` for only the editable scene and generation metadata.
Normal generation writes PNG, WebP, `.blend` and JSON. Reusing an `asset_id`
overwrites that asset's outputs. The optional `tests/verify_template.py`
is retained unchanged for authoring checks in a disposable copy; it writes
test outputs and a QA report. None of these scripts was executed during
source publication.

The package reports authoring on Linux with Blender 4.3.2, NumPy 2.2.4,
SciPy 1.15.3 and Pillow 11.1.0. `requirements.txt` records those versions;
regeneration needs them in Blender's own Python. Nothing installs them
automatically. Mac regeneration has not been tested. Opening an existing
scene is separate from running its generator.

## Samples and curation

`samples/` retains the forest/cream and navy/muted-gold WebP palette examples
unchanged. The burgundy example is byte-identical to the Reaves sample in
[homepage PR #71](https://github.com/aidandaly24/goat-hoopers-site/pull/71),
which also owns the Josh sample. This source package adds no `public/`
copies. The original paired desktop/phone images, review boards, redundant
PNG exports and historical QA report were omitted.

`README.txt` is unchanged upstream documentation describing the full
download, including some files omitted from this curated directory. Use
this README for repository contents. `PROVENANCE.json` records both ZIP
hashes, every original member's checksum and disposition, the runtime
comparison pinned to PR #71's head, and the upstream environment claims.
These claims do not certify a new Blender run or website integration.

## Provenance and license notices

The upstream package describes the cloth, frame, hardware, yarn geometry
and textures as original procedural assets, without NBA logos, paid models,
player images or third-party textures. Its bundled third-party resource is
DejaVu Sans Condensed Bold. Preserve `fonts/LICENSE-DejaVu.txt` with the
unchanged font; its Bitstream/DejaVu notices apply to the font resource.
The archive supplies no general license for the original scene or scripts.
This import does not assign one or extend the font license to the whole kit.
