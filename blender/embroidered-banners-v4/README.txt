GOAT HOOPERS: REUSABLE EMBROIDERED BANNER KIT, v4.0

THE APPROVED DESIGN
Raised individual yarn stitches, mitred padded textile border, dark hanging rod,
gently folded woven fabric. Includes burgundy/cream, navy/muted gold and
forest green/cream. Original V1, V2 and V3 sources were preserved separately.

QUICK START
1. Keep this extracted folder together.
2. Copy configs/reaves-dropper.json and change asset_id, team_name,
   name_lines and palette. Use a unique asset_id for each design.
3. From this folder run:
   blender -b -t 8 --python generate_banner.py -- --config configs/reaves-dropper.json
4. Find transparent PNG, compressed WebP, editable .blend and generation
   metadata under generated/. Only that one config is generated.
   Existing outputs with the same asset_id are overwritten.

For a source-only update, append --no-render. Use --output-dir PATH to place
outputs elsewhere. No network access or asset downloads are used by the scripts.

EDITABLE TEXT
The letters are real mesh threads, not flat printed type or live font objects.
Edit JSON and rerun the generator to change words. The .blend stores ACTIVE_CONFIG
for reference. Every run loads the blank template, preventing old text or titles
from accumulating. The cloth, yarn, frame, camera and lights remain editable
directly in Blender. The blank template renders a reusable unlettered banner.

TEXT LAYOUT
name_lines accepts 1–3 explicit lines, preferably 4–10 characters per line.
It is optional; automatic wrapping is a starting point. At most 16 characters
per line are accepted. Always inspect unusually long names at phone size.
An empty name_lines array and empty team_name produce a neutral banner.
The bundled font supports Latin letters, numbers and common punctuation.
For longer names, use three balanced lines instead of very narrow lettering.

COLOR OPTIONS
Set palette to burgundy_cream, navy_muted_gold or forest_cream.
Alternatively supply an object with six-digit sRGB hex values for:
body, border, border_thread, letter_thread and seam.
The generator applies the approved lighting/cloth tone treatment consistently.
Custom combinations are editable but need visual contrast checks.

CHAMPIONSHIP
Default championship is null. Only use a verified title. To add one, set:
  {"year":"2025", "label":"CHAMPION", "confirmed":true}
The supplied Josh Diddy’s Roster config preserves its confirmed 2025 title.
No other roster is assigned a championship. Palette choice never implies a title.
The optional title occupies the lower zone; decorative bars are hidden for space.

DEPENDENCIES AND PORTABILITY
Authoring/regeneration was tested on Linux with Blender 4.3.2 and its available
Python packages NumPy, Pillow and SciPy. Exact versions are in QA_REPORT.json.
These Python libraries are needed inside Blender's Python for regeneration.
They are not automatically installed and may be absent from other Blender builds.
Opening or rendering an already-generated .blend does not need these libraries.
All scene textures are packed. The font and its license are included locally.
No runtime dependency on the previous V1/V2/V3 folders is needed.
Mac regeneration has not been tested. Use your installed Blender executable's
path if the blender command is not on PATH.

DETERMINISM
Fixed stitch seed, sorted geometry traversal, fixed render seed and explicit
configuration. Same-config geometry was checked across repeated runs in the
tested environment. Render pixels can vary across Blender versions or devices.

WEB INTEGRATION
Use samples/*.webp as static image assets. They have transparent backgrounds.
The source geometry is intentionally detailed for offline rendering; do not put
the full template meshes directly in a Three.js homepage.
Individual dimensions: 512 x 896. Intended CSS boxes: desktop 140 x 235,
phone 82 x 125; use object-fit: contain, preserving aspect ratio.
Include an accessible team name as alt text. Keep changing matchup/date copy
in HTML rather than embroidering transient content into the image.
The palette samples show the SAME Reaves team in three colors for comparison.
The extra Josh sample demonstrates a three-line name and confirmed title.
Samples are choices, not a roster-wide final color assignment.

CONTENTS
GOAT_HOOPERS_Banner_Template.blend: packed, unlettered reusable scene
generate_banner.py: JSON-driven physical-text generator and renderer
satin_lettering.py: deterministic directional satin-stitch mesh builder
palettes.json: editable five-color palette definitions
configs/: Reaves, Josh champion and neutral examples
fonts/: bundled DejaVu font and upstream license
samples/: approved palette exports, champion example and comparison images
ASSET_MANIFEST.json: dimensions, provenance, hashes and sample metadata
QA_REPORT.json: actual checks, results and limitations

PROVENANCE
Original procedural cloth, frame, hardware, yarn geometry and textures.
No NBA logos, paid models, player images or third-party textures are included.
The only bundled third-party design resource is DejaVu Sans Condensed Bold,
redistributed with its included Bitstream/DejaVu license notices.
