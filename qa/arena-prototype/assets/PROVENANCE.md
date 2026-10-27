# Arena prototype asset provenance

The floor, complete court markings, seating, structure, ribbon and fallback
SVG are original geometry/art for this prototype. Original primitive hoops are
a fallback; the verified Polyfork posts replace them after successful parsing. Their colors reuse
the existing GOAT scene and slate tokens. No downloaded code is executed.

Approved existing assets are read from `public/courtside/`, without edits. The
portrait map and exact court photo remain the production homepage's assets;
Inter/Geist Mono reuse the existing local review font copies. Refer to
`courtside-preview/ASSET-PROVENANCE.json` for the original supplied media.

Polyfork's official guidance was read on 2026-10-27:

- <https://polyfork.dev/agents>
- <https://polyfork.dev/prompt.txt>
- <https://polyfork.dev/licensing> (October 2026 terms)

Those terms permit personal/commercial website and prototype use, modifications
and shipping models within the product. Standalone asset redistribution and
asset/generator services are excluded. No attribution is required; this record
preserves provenance anyway. This review app is not an asset library or exporter.

The approved free GLB shortlist is:

| ID | Catalog triangle count supplied in task | Expected size |
| --- | ---: | ---: |
| yard-basketball-post-b71ee3 | 558 | 61 KB |
| match-scoreboard-58f51e | 592 | 108 KB |
| trophy-cabinet-e963ac | 671 | 80 KB |

**Historical network failure, resolved by repository handoff below:** this execution environment's network proxy returned HTTP 403 for
both the public metadata API and the public GLB CDN, including an approved
escalated read. Chromium also reports `ERR_TUNNEL_CONNECTION_FAILED`. No GLB
was received through that route. `fetch-assets.py` saves only structurally inspected
binary data at these exact approved IDs; visual inspection was subsequently
completed on the repository handoff. The local GLTFLoader only discovers actual
local `.glb` files. No remote model/module, MCP,
account, credential, paid plan or package was added.

## Resolved repository handoff — current revision

Muse provided the approved three GLBs and metadata in #268 at exact commit
24b36aef62923251bf9b3a56656bd5c9f2ed3bbc. Files in assets/polyfork are embedded
only in this prototype; they are not an asset pack/export service. The earlier
network failure remains historical, and its route was not retried or bypassed.

Independent hashes, resource/triangle/material counts, URI/extension/skin gates
and transform-clip inspection are in inspection.json; static browser world
bounds/resource records are in visual-inspection.json. Actual prop pixels were
reviewed before placement. The scoreboard's one 13.6-second pennant/card
quaternion clip is retained as inert data, with no mixer/tick playback.
The reference HTML was read but its remote modules/runtime were not copied.
