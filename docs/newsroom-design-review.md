# Newsroom editorial direction and scope

Base: main `5ee506d56c9f4e973564f1082525e3f088c9ce9f`, selected Paper + Slate.
Includes reviewed, nonoverlapping Trophy main `c6b8f114e8906265b22bf661a066a5fd2d0d2c24`.
Claim: issue #82, FIX IN PROGRESS, HOLD MERGE. Parent owns final independent
review and batched release. No shared navigation, tokens, globals, history art,
data/cache, auth, billing, security, DB, AWS/AgentCore or deployment changes.

The user requested a cared-for friends’ league page. Source inspection confirms
that every voice repeats a full story in the same rounded card. The replacement
has one lead, compact headline rows and a native reader. No framework/dependency
is added. Excerpts use supplied article text; full bodies and actor links remain.
Publication names are labelled parody voices with a non-affiliation notice at the
point of reading. Generated story times do not establish actual event chronology.

## Independent direction reviews before implementation

Two independent agents read DESIGN.md and the actual surface/domain/generator
before substantive changes. Both approved with conditions.

- Editorial: avoid repeating the lead; prefer ESPN over pending-deal Shams copy;
  keep Hot Takes on a matching take; label generated/parody voices; keep full
  reading. Applied. Original voices remain reachable across the feed.
- Interaction: fail closed on ambiguous IDs; preserve sections/actor references;
  native dialog with Close/Escape/focus; precise history; wrap phone controls,
  names and long headlines; honest empty/missing states. Applied. Voice buttons
  retain focus and announce a brief selected-voice status.

Neither review was a reference-pixel comparison. The exact Library item
`libfile_2a241821a8c48191b434c8d983b51b1e`, filename
`IMG_97866B0C-B2E9-4818-A4D1-386155D48573.jpeg`, was prepared for a consumer-local
Mac destination with the current Library helper. The original transfer and one
fresh supported retry returned HTTP 403. Transfers stopped; no denial was
bypassed, no readable bytes were obtained and its pixels were not seen. This
remains a parent/user review blocker, not a completed acceptance check.

## Minimum coherent architecture

| Concern | Class | Decision |
| --- | --- | --- |
| Sections, voices, actor links, full reading, honest states | Essential | Preserve |
| Next history, native dialog, existing generated keys | Imported | Contain in feed and pure projection |
| Repeated full cards, hover-only actor links | Accidental | Replace with rows and visible links |
| Old card during replacement | Transitional | Remove after its only consumer changes |
| Group safety, history/focus and narrow rendering | Unknown | Resolve with DB-free fixtures |

Group only existing `rookie-{pickNo}-{voice}` and
`trade/waiver-{index}-{six-character-prefix}-{voice}` families. Kind, section,
complete actor refs and distinct publication membership must agree. Unknown or
ambiguous families remain separate. The Bayless trade reaction is in Hot Takes,
so it stays separate from the Latest trade bundle. This conservative choice
preserves categories without asserting durable transaction identity. Never match
by subject, names, headline or timestamp. Original article links read exact voices.

State is `?story=<original id>&revision=<snapshot fingerprint>&section=<section>`. Opening pushes one entry;
voice changes replace; Close/Escape goes Back only for a reader entry opened in
this mounted visit. Initial deep links close by replacement; missing IDs show
unavailable. Original IDs are reusable render slots, not permanent event IDs.
A versioned SHA-256 fingerprint covers every supplied article field, including
full prose, actor refs and generated time. Old unguarded, mismatched or duplicate
IDs fail closed. A regenerated timestamp or changed prose may expire the link;
there is no persistent article store, and the reader never substitutes a new
event. The guard stays in the presentation surface, with no generator, cache or
schema changes. Next history state and unrelated queries are retained. Unmount
restores only body scroll, never a destination URL. Repeated Close is guarded.

## Validation and limits

Production components use synthetic props at 1440/390/320, with long headlines,
long prose, sparse/empty states and 200% text. Reproduction is in
`qa/newsroom/README.md`; actual PNGs/receipts are ignored, task-owned evidence.
PNG delivery through Library is required for phone viewing; HTML alone is
insufficient. Shared-header overflow at 200% is recorded separately; Newsroom
and reader bounds pass. The fixture substitutes native anchors for Next Link:
it proves browser history behavior, not App Router transitions or route reuse.
A DB-free real-Next navigation check is still needed after disk clearance.
Physical Safari/iOS and hosted checks remain unverified.
The root deployment hold stays false.

The prepared-upload helper initially reported `Library prepare_uploads is not
available`. The user then explicitly authorized the supported direct-create
fallback for two existing PNGs. Saving and version xattrs succeeded: desktop
`libfile_2f408b7491148191a2d14703f80f4300`, phone
`libfile_25c3f873b2e0819180e86d9407bce300`, both version 0. These actual inspected
pixels and the 54-check/18-PNG receipt belong to source head
`78fd2373a6a4fb779b772cbabc642a02ee688f8b`, before the reader identity repair.
No new build/render/export ran during the coordinator's disk guard. The two-feed
unit regression is run independently; corrected-head browser/build evidence
and the original reference pixels remain outstanding.
