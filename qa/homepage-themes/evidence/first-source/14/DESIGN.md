# Hardwood Clubhouse — direction 14

This isolated QA homepage answers “what matters for my team, and where can I inspect the rest of the league?” The member’s primary action is **My team**; the public view’s primary action is **Browse teams**. View roster, player profiles, Stocks, the trade analyzer, AI Decides, transactions, history, both weekly editions and Free Throw remain ordinary destination links.

## Material and composition

Deep walnut (`#261a13`), darker end-grain (`#1c130e`) and warm wood (`#38251b`) carry most of the page. Copper (`#d59b6e`) marks actions, prices and quiet section cues. Sand (`#e8d3ae`) belongs to the dated editorial folio, with dark brown text. There is no blue accent, white dashboard canvas, invented club history or founding date.

Locally served Lora supplies the book-serif headings, team names and value display. Georgia supplies warm, readable body and data text. Font sizes use rem so root text enlargement scales actual text, including body 16px → 32px. Tabular figures align the numeric ledger. The selected, unchanged GOAT logo provides identity.

The wide opening is a horizontal court-and-matchup register. The approved existing arena image is cropped to emphasize the hardwood, with a restrained sepia treatment. Thin horizontal wood seams and original SVG center-circle/end-line geometry continue the court rhythm. They carry no data or controls. Below, a warm wood value ledger leads into three scouting lanes, a completed-week record and team wire, the sand editorial folio, five saved AI calls, ten long team registers, visible standings and activity, then market, game and archive destinations. Team faces are integrated into their team’s register rather than repeated in a detached gallery.

At narrow widths the court precedes the current matchup; scouting lanes and league columns become a continuous vertical register. Rosters and values reflow to one column, names wrap, and search/sort controls retain labels. Native disclosures retain the full information without forcing all 228 player rows into the initial view. At extreme 200% root enlargement on narrow phones, large amounts can wrap rather than overflow. Navigation stays in normal flow and uses a nonmodal disclosure.

## Content and states

The visible fixture notice links to complete provenance. The current pairing comes from directory `currentMatchup` (member’s own team in member mode). Its Week 3 fixture is separate from the October 5–11 dated draft editorial. A known 0.0 remains 0.0; an unknown score reads Pending; the matchup is Incomplete.

Member areas retain identity, standing, roster count, team actions, full modeled FAAB total/basis/time/coverage, three highest valued players, all 24 roster values, observed form watch, completed-week best/rough points and GP with exact period/coverage, team news and recent moves. All current values, form, records, news, scores and AI are explicitly synthetic. No recorded value-history series or Power producer is connected; both read Unavailable. The public view omits personal information while retaining league context and all directories.

All five saved AI rows preserve the actual returned choice, both roster-matched probabilities, independent confidence and timestamp. The first choice remains the away team at 35% even though the home team has 65%. Model, prompt, roster IDs, evidence, unavailable snapshots and saved state are in accessible disclosures. `?ai=stale` labels saved output as stale before opening details. `?ai=missing` retains all five current pairings with Unavailable results and no saved-row hooks. A saved row that fails season/week/ordered-roster matching also renders Unavailable.

The ten-team directory searches team, manager and every roster player and sorts by roster number, team name, manager or roster size. All 228 unique player profile links retain position/NBA team. Current opponents and records are distinct from prior-season records; NeuralNets’ 2025 record retains previous-manager attribution. Each of the ten modeled faces has a profile link, value and actual Stocks destination. The existing market has no demonstrated player-query route, so price actions use `/stocks` rather than inventing a query-driven inspector.

All ten standings rows show rank, W, L and PF (`pointsFor / 100`), with functional rank/PF/name/wins sorting. Unconnected league statistics stay unavailable. Both dated archive titles, dates, routes and draft/publication state remain accessible. The full source inventory and complete dated edition are linked/disclosed in the footer.

## Interaction and accessibility

Native links, labelled inputs/selects, native details/summary, semantic headings/table, visible focus and a focus-only skip link are used. Menu opens with Enter; Escape closes it and restores focus to its trigger. Hidden navigation leaves the tab order. Mobile action/disclosure targets are at least 44px; ordinary inline prose links retain their inline exception. There are no modals or autonomous animations. Reduced-motion and save-data users receive the same information.

Opaque foreground/background contrast calculations: body ink on walnut 13.39:1; secondary text on wood 7.45:1; copper on wood 6.04:1; dark body on sand 10.69:1; secondary brown on sand 6.01:1; primary button text on copper 7.61:1; control boundary on walnut 4.81:1; focus on wood 10.54:1. Court text sits on an opaque dark caption/tag, not directly on the image.

## Checks performed

Installed headless Chromium via existing Playwright, served from the coordinator’s `127.0.0.1:4206`. No dependency install, external runtime call or production build was needed for this standalone HTML/CSS/JS fixture.

- Member and public at 1440, 390 and 320 CSS px, each at normal 16px root and actual 200%/32px root: all native disclosures opened, images loaded; document scroll width equalled viewport width in all 12 combinations; zero elements outside the viewport bounds.
- Each view retained exactly 10 `data-team-id`, 10 `data-face`, 228 roster links and 228 unique roster player URLs, plus 10 standings rows. Member retained all 24 value entries; public contained no `data-personal` areas. Ready/stale had 5 `data-ai-pair`; missing had zero saved hooks and 5 current pairing rows.
- Search “Embiid” returned one 24-player team; unmatched search showed the explicit empty state. Team-name and standings-name sorts produced Huff n’ Puff first. The other sort choices have explicit stable comparators in source.
- At 320px, keyboard Enter opened Menu, Tab reached its links, and Escape closed it with focus restored to `menu-button`.
- Stale/missing state labels checked in rendered browser output; public missing state checked separately. Known 0.0/Pending, actual away-team choice, both probabilities and independent confidence inspected.
- Full desktop/phone captures, phone register/footer, an expanded phone roster, and enlarged value/source disclosures inspected visually. No failed local images, browser page errors or external runtime requests were observed. `node --check clubhouse.js` passed.

Limitations: this is a static synthetic component fixture, not a production Next route, authenticated session or live provider test. Destination paths are preserved, but the game’s play/reset/exit flow and application route history were not run through this static server. No physical device or screen-reader test was performed. The deliberate unmatched AI branch is source-reviewed; the supplied fixture has no unmatched saved row. Source hashes are returned with the source-ready handoff.
