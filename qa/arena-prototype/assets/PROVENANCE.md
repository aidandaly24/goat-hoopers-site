# Arena prototype asset provenance

The floor, complete court markings, seating, structure, backboards, ribbon and
fallback SVG are original geometry/art for this prototype. Their colors reuse
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

**Pending:** this execution environment's network proxy returns HTTP 403 for
both the public metadata API and the public GLB CDN, including an approved
escalated read. Chromium also reports `ERR_TUNNEL_CONNECTION_FAILED`. No GLB
was received, inspected or claimed as used. The prototype currently renders
only original scenery. `fetch-assets.py` saves only structurally inspected
binary data at these exact approved IDs; visual inspection is still required
before calling their placement complete. The local GLTFLoader path is ready
and only discovers actual local `.glb` files. No remote model/module, MCP,
account, credential, paid plan or package was added.
