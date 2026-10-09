# Meaningful Newsroom revisions

Follow-on to released PR86, scoped to issue82. The target is dependable reading
for the league's ten friends, owned by the existing Newsroom surface. The current
release/refresh cycle is the decision horizon. No loader, cache, database,
header, dependency, asset, category or editorial-layout change is needed.

The live audit described in issue82 observed an 11-minute-old rookie link
expiring while headline, prose and displayed date were unchanged. Source
inspection confirms that `rookieCoverage`, `rumors` and `hotTakes` rebuild
`publishedAt` from `Date.now()`. Trade and waiver coverage instead derive it from
`Transaction.createdAt`, with fixed voice offsets. Their time is retained because
identical transaction prose and a reused render key can represent another event.

## Policy

New `v2` revisions hash exact ID, publication, kind, section, headline, ordered
body paragraphs, ordered player ID/name pairs and ordered team ID/name pairs.
Trade/waiver revisions also include their transaction-derived `publishedAt`.
Only the documented rookie/rumor/take generation clocks are excluded. Text,
reference order and names are not normalized or guessed. UTC generated-time
metadata continues to show the current supplied value; it is not an event-date
or historical-publication claim.

Resolution still requires exactly one matching ID and the exact expected hash.
Missing/invalid/unknown revisions, duplicate IDs and meaningful replacements
fail closed. No ID-only fallback, old-time search, alias store or inferred event
identity is added. Render keys remain reusable slots, not durable event IDs.
Without an upstream event identifier, two otherwise identical generated
rookie/rumor/take snapshots cannot prove distinct event chronology.

Existing `v1` links are accepted only if their complete original tuple, including
time, matches the current supplied article exactly. An expired old hash cannot
be safely converted after its original clock is lost. The unavailable reader
therefore describes an unverifiable saved version, rather than claiming that
the visible story vanished. A unique current candidate offers a separately
labelled **Read current story** link with its current headline and a warning
that it may cover a different event. Nothing opens automatically; duplicate or
missing IDs offer no candidate. That explicit choice replaces the reader entry,
focuses its heading and keeps the existing Close/Back behavior.

## Smallest coherent change

| Concern | Evidence / owner | Class | Decision / tradeoff |
| --- | --- | --- | --- |
| Avoid silently substituting another reaction | Confirmed requirement; Newsroom | Essential | Retain content hash and unique-ID guard |
| Clock versus transaction time; reusable source slots | Confirmed generator code; upstream contract | Imported | Classify by existing kind inside the reader helper |
| Refresh expiry for unchanged rookie/rumor/take content | Observed live audit; Newsroom | Accidental | Exclude only the three volatile clocks |
| New link version during release | Confirmed current v1 URLs; release coordinator | Transitional | Emit v2 only; transition completes when the new writer ships; exact v1 compatibility stays isolated |
| Browser history and new recovery focus | Unknown until exercised; Newsroom QA | Unknown | Frozen DB-free snapshots and one coordinated Chrome run |

The SHA-256 helper, native dialog and existing history mechanism remain. Removing
the guard would shift wrong-story risk to readers; adding a historical store
would expand data ownership without being necessary for this bounded fix.
Persistent event permalinks would require a separate domain/data contract.

## Verification boundary

Unit tests cover 11-minute/day rollover stability for all volatile kinds,
transaction-time changes, exact v1 acceptance/expiry, each meaningful field,
reused/missing/duplicate IDs and native SHA-256 agreement. The dedicated frozen
browser fixture covers direct URLs, changed snapshots, explicit recovery,
voices, filters, Back/Forward, Close/Escape and focus at1440/390/320.

The fixture uses native-anchor adapters. It does not establish real Next App
Router transitions, hosted behavior or physical iOS. Released PR86's live flow
was separately audited; this follow-on needs its own final review. Browser work
requires the coordinator's shared-session slot. QA results are reported in the
draft PR using public method/count/head descriptions, without private artifacts.
