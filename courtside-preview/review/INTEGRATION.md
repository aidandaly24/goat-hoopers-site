# Courtside live homepage integration — local review

The actual Next.js homepage now uses the Courtside composition at `http://127.0.0.1:8791/`. The standalone comparison remains at `http://127.0.0.1:8790/courtside-preview/`. Work is local on `dot/courtside-weekly-homepage`, based on main `3807b43`. Publication, pushes, PR creation and deployment remain held pending the Vercel build-trigger limit. No DB, auth, paid-resource, environment or arcade changes were made.

## Reviewed implementation

- Desktop: the mirrored right matchup group now uses `justify-content:flex-end`, centering both pennant/name groups against “vs.” One lead and two supporting stories remain. Commentary and stats use the lead’s full width, reducing its inactive lower-left area without replacing the approved composition.
- Mobile: all three player commentaries span the full 356px content column at 390px viewport width. Body copy is 16px; desktop lead commentary is 17px. Production uses the existing Inter and Geist Mono font assets. The actual heading font was checked in the browser after correcting integration token scope.
- Background: deep arena teal → mineral court with perimeter arcs → textured teal team directory → mineral archive → existing arena strip and teal footer. The continuous material and sectional rules survive the production build; no empty black tail remains.
- Hierarchy: Game of the Week, three player roles, three curated moves, ten compact team summaries and the weekly archive. Full current standings/stats/recent moves and the original league tools remain accessible in secondary disclosures. Header login, claim, signed-in team and logout actions remain in the shared chrome; mobile navigation keeps every destination.
- NeuralNets’ collapsed summary explicitly shows “Previous manager” beneath its 2025 1–20 record. Its accessible name and expanded context preserve the QBs Gremlins qualification. The 2025 finish is historical, not a current power ranking.

## Live data and editorial

The production loader injects a clock and fetch dependencies. Sleeper/transform remain the data membrane. Current roster IDs, team identities, pairings and recent transactions feed a pure directory projection. All 228 current players were present in the actual browser DOM. Search reached Bruce Thornton beyond the editorial anchors and found his Reaves Dropper roster. Transferred editorial anchors drop out of team summaries automatically.

The full player directory resolves only the unique roster IDs. Only those slim player references are cached for 24 hours, keyed by the sorted roster ID set; raw 3MB directory data stays outside Next’s cache. Existing 300-second requests deduplicate across the root and homepage. Upstream name failure preserves every player ID and a visible unavailable-name state; league failure preserves the dated editorial with an unavailable directory. Preseason placeholder zeros are normalized to null matchup scores.

The two source-controlled weekly entries remain clearly labeled sample drafts. Date bounds, source checks, subjective selection reasons, prior NBA/college stat periods, historical finals and published/draft states remain explicit. After an edition expires, the homepage names it as the last edition and says the next is pending. The real `/weekly` and `/weekly/[editionId]` routes retain the archive; an unknown edition uses Next’s not-found page. No scheduling/CMS/publishing mechanism was added.

## Asset provenance and budgets

The supplied logo kit, selected primary master and embroidered pennant kit are approved for the public website. Original source files are preserved locally.

The original primary master is preserved at `public/courtside/GOAT-HOOPERS-primary-clay.svg` (8,146 bytes; SHA256 `4e74584a67397ec58e209a87a8d041882685a16ce20ac2f281e91970e3318afb`). The exact supplied white horizontal variant is used for contrast in header/footer, with no path redraw or recoloring (4,469 bytes; SHA256 `08320e360cc53c266425c0178b592573f5ddf32c04526de35d119306968b6ac2`). The supplied clay emblem is unchanged (749 bytes; SHA256 `ec4a87834c715ff8c8726a933469150a325ae41180993af3841df378376a7312`). Existing source ZIPs and the earlier asset manifest remain intact.

Only the two approved embroidered samples ship: Reaves Dropper and verified 2025 champion Josh Diddy’s Roster. No invented team banners or generated mockup images were promoted to website assets. Arena image: 329,398 bytes; two pennants: 85,282 bytes; thirty bounded portraits total 1,868,867 bytes, lazy/closed-roster images. Public courtside assets total 2,297,598 bytes. Fonts reuse the root assets, and pre-sized local images avoid image-optimizer quota.

The homepage interaction source is 17,639 bytes / 4,605 bytes gzip. The production interaction chunk is 19,388 bytes / 5,399 bytes gzip, under the 15KB incremental interaction budget. The separate shared chunk is 28,870 bytes / 8,415 bytes gzip. The figurine module is absent from the initial page client manifest. After inspection, it requests one unchanged GLB and installed Three, freezes the supplied idle pose, renders only on load/resize/manual turn, and releases canvas/GPU/decoded bitmap resources on close. No ambient animation frame loop runs.

## Verification

- Production build: passed without CSS warnings. TypeScript: passed. Changed-file lint: no new errors/warnings; existing `league.ts` unused `users` warning remains outside this change.
- Tests: 14 files passed, 1 opt-in DB file skipped; 136 tests passed, 3 DB tests skipped. Eight new meaningful cases cover live ownership, inherited history, full roster retention, dated edition selection, empty upcoming vs verified final scores, preseason normalization and both upstream failure states.
- Actual production Chrome: desktop 1470×780, mobile 390×844, small phone 320×780; zero horizontal overflow. Full-page captures are 1470×4320 and 390×5492. Ten live team rows and 228 player references confirmed. All visible directory avatars loaded before the final mobile full capture.
- Native roster Enter activation, matchup dialog Tab containment, Escape and focus restoration verified. Optional figurine loaded, manual turn worked, and closing removed the canvas and restored the inspection trigger.
- Archive route and historical edition verified in browser: Sep 28–Oct 4 sample, historical 2025 final, 326.0–251.5. Login/claim and signed-in action contracts were retained by source review; no credentials or account state were changed.
- Reduced motion: source branches and compiled CSS audited; the emblem has `animation:none` under the media query and offscreen/hidden pause guards. The viewer has no ambient loop in either preference. The supported browser API did not expose media emulation, so no emulated reduced-motion browser run is claimed. Existing ticker already disables animation under its reduced-motion media query.
- No application-origin console errors observed. Browser extension warnings were present. No database variables or `.env` files were present; DB checks intentionally stayed skipped.

## Captured evidence

All eleven full-page, opening, player, directory, inherited-record and archive captures are preserved locally and in ChatGPT Library. Screenshots and Library identity manifests are excluded from the public repository. The earlier static comparison captures remain preserved separately.

The direct host-upload path failed before opening its first source file. The prepared-upload path succeeded using the supplied Library helper and Microsoft’s official portable AzCopy in a temporary directory; all eleven transfers and finalizations were confirmed. No uncertain create was retried.

Both local preview server sessions were restored after the host transport interruption. HTTP checks confirmed both preview roots return 200. Next’s streamed unknown-edition response uses a 200 shell; the route invokes `notFound()` and must not be described as an HTTP-404 verification.
