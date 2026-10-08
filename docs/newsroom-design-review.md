# Newsroom editorial direction and scope

Base: main `5ee506d56c9f4e973564f1082525e3f088c9ce9f`, selected Paper + Slate.
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

State is `?story=<original id>&section=<section>`. Opening pushes one entry;
voice changes replace; Close/Escape goes Back only for a reader entry opened in
this mounted visit. Initial deep links close by replacement; missing IDs show
unavailable. Next history state and unrelated queries are retained. Unmount
restores only body scroll, never a destination URL. Repeated Close is guarded.

## Validation and limits

Production components use synthetic props at 1440/390/320, with long headlines,
long prose, sparse/empty states and 200% text. Reproduction is in
`qa/newsroom/README.md`; actual PNGs/receipts are ignored, task-owned evidence.
PNG delivery through Library is required for phone viewing; HTML alone is
insufficient. Shared-header overflow at 200% is recorded separately; Newsroom
and reader bounds pass. Physical Safari/iOS and hosted checks remain unverified.
The root deployment hold stays false.

Library saving also remains blocked: the current prepared-upload helper reported
`Library prepare_uploads is not available` before producing any saved-item IDs.
The batch was not switched to a direct write. The PNGs remain local and were
inspected as actual pixels; no Library publication is claimed. Parent/user review
must resolve reference access and phone delivery before treating these gates as
complete.
