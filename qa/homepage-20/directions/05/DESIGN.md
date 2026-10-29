# 05 — Broadcast rundown

The user question is “Who am I playing, what is known so far, and what should I inspect next?” The first action is opening either team in the current Week 3 pairing. The next member actions are My team, View roster and Inspect prices.

This direction gives the league an editorial sports-desk hierarchy: the selected GOAT masthead, a compact slate score desk with aligned tabular figures, a numbered page rundown, then open paper sections. The score desk treats the recorded 0.0 and Pending as different values and says scoring is incomplete. The old sample edition has its own dates and draft status below, rather than supplying a current-week headline. A bounded arena strip connects to free-throw practice without putting text over the photo. No ticker, animation, scene runtime, invented score or fabricated history is used.

The member desk puts personal identity and useful actions beside modeled FAAB valuation. All 24 values remain in a native disclosure, with the priced/unpriced coverage, computation date, market basis and history-unavailable state. Observed form, completed-week fantasy results, modeled prices and dated editorial each have their own labels and periods. The public desk substitutes league/player context and never reads a personal summary.

The rest of the page contains all three dated spotlights and their full selection/source details; happenings and editorial sources; all five saved AI pairs with both probabilities, the actual returned choice, confidence, timestamp and provenance; all ten faces; the searchable/sortable complete directory; sortable ten-row standings; explicit unavailable Power and league-stat fields; transactions, market/trade/game links; both archive entries; and fixture explanation. AI choices are not inferred from the larger probability. `?ai=stale` visibly labels saved data as stale; `?ai=missing` gives all five current pairs unavailable states without invented outputs.

On phones, the masthead uses a native nonmodal navigation disclosure with Escape-to-close/focus restoration. The scoreboard retains the two scores beside readable wrapped names. Paper columns stack, all essential data stays present, and roster lists reduce to two columns, then one at 320px. Team search matches team, manager and every player; a player-only match opens its roster. Sorting preserves the current filter. The standings sort independently. Links to actual league routes are ordinary navigation; no live backend or authentication is simulated.

The palette follows the repository’s exact Paper + Slate semantic roles. Inter supplies the headline and editorial hierarchy; Geist Mono is reserved for source figures, scores, ranks, FAAB values and metadata. Native details, semantic headings/tables/labels, immediate visible focus and local portrait fallbacks support access. Forbidden patterns here are repeated boxed cards, giant wallpaper, decorative sports statistics, perpetual tickers, implied model odds, invented history and hidden stale/missing state.

## Verification

Verified using Playwright with installed Chromium 154.0.8037.57 and the existing repository static server at `127.0.0.1:4198`. Base repository revision: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`. Final `index.html` SHA-256: `403955f32a6edbdfd48775778b10eedb8e7bc1140b72b428f9f0e9eb2ad337b3`.

- Member and public at 1440, 390 and 320 CSS px: no document horizontal overflow, including all main disclosures expanded. All local images loaded; no page errors or HTTP error responses.
- In each view: 10 directory containers, 10 faces, 5 saved AI pair rows, 228 roster links and 10 standings rows. Member: 24 roster valuation entries and personal desk. Public: no personal desk or personal valuation. The featured values remain `0.0` and `Pending`.
- Player search for Damian Lillard: one matching team and its roster opens. Sorting retains the filter; no-match feedback appears; clearing restores all teams. Alphabetical team and standings sorts put Huff n’ Puff first.
- Native phone menu: Escape closes and returns focus to its summary. At 320px with all main disclosures open, every visible link/control/summary measures at least 44px high, including the footer mark.
- Stale AI mode: five retained rows and visible stale heading/row status. Missing AI mode: unavailable heading and all five current pairs, without saved probability/choice placeholders. The first saved result explicitly returns roster 2 at 35%, with roster 1 at 65%, and separately shows 20% confidence.
- Independent 200% text test at 1440px: doubled each computed font size in the browser, preserving line-height ratios; all main disclosures open. No document or internal horizontal overflow after responsive figure-column adjustments. This is an enlargement probe, not a claim about every browser’s native zoom behavior.
- Opaque rendered role pairs, WCAG relative-luminance calculation: paper/ink 12.70:1; muted text/paper 5.15:1; slate accent/paper 6.56:1; light desk text/slate 12.70:1; desk secondary/slate 9.97:1; control boundary/paper 3.41:1. Focus switches to paper on the slate desk.

Own-page desktop, phone, editorial, AI, directory, tools and enlarged-text captures were visually inspected in `/tmp/goat05-*.png`. Root owns the durable comparison captures and gallery. No other direction or prototype screenshot was inspected. No production files, dependency installs, branches, commits or external writes were changed.

This is a static design fixture, not evidence of real Next.js navigation, account authorization, live league data, price execution, screen-reader behavior or physical-device gameplay. Destination paths are the intended application routes; the repository static server is only used to inspect this authored HTML.
