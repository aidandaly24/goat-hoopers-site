# 13 — The Weekly Letter

A personal editorial bulletin for a ten-friend league. The actual dated sample story, “Reaves Dropper gets the champ,” leads; a clearly separate current synthetic matchup provides the useful present-tense reference. No quote, new narrative, statistic, award or forecast has been authored as league fact.

## Surface contract

- **User question:** What’s worth reading about our league, and what do I need to check for my team?
- **First action:** Read the dated edition. The current matchup, My team, View roster and roster valuation sit alongside it on desktop. The persistent navigation and complete league directory support direct task access.
- **Relevant states:** Member/public; synthetic current data; dated, draft, stale editorial; current known 0.0 versus missing Pending; incomplete scores; ready/stale/missing saved AI; missing model input/evidence; unavailable history, stats and Lineup Power; portrait fallback; populated and empty directory search.
- **Narrow layout:** One continuous letter. Story and natural 16:9 arena precede the current-matchup/member note; the three editorial columns become separate articles. Values remain aligned rows, the ten faces form two columns, and roster lists use two columns. Both sorts, full rosters, sources, AI provenance and archive remain available at 320px. The native All pages disclosure retains every destination. Every rendered phone link/control has a measured target height of at least 44px.
- **Forbidden patterns:** Invented commissioner voice, quotes or current awards; inferred AI choice; missing values rendered as zero; fabricated trends; repeated boxed cards; rejected figurines; decorative scene controls; text over busy photographs; hidden essential state; new services or production edits.

## Composition

The existing Inter family carries the entire hierarchy: a substantial, closely set actual story headline, a comfortable editorial lede, clear section heads and quiet source lines. Geist Mono aligns scores and model values. All colors use Paper + Slate semantic tokens through the shared base; no alternate palette or font is introduced.

The page reads as a letter with an attached reference, rather than a dashboard grid. The opening has one strong article and a narrower personal margin note. The owned court photograph belongs to that article, with a meaningful Free Throw link. Prior-season player portraits accompany three compact editorial observations. The member’s value ledger and observed-form notebook are separate from completed-week performer examples. Saved model pairs, the ten-team faces index, complete directory, standings and transaction wire follow. The final page links real Arcade/Stocks/Trade Analyzer destinations and preserves both dated archive entries.

`home.edition` carries a deliberately outdated sample. The opening uses the matching preserved archive entry’s actual story prose and date, and labels it stale, draft and unpublished. It never treats its old opening-week opponent as today’s opponent. Current matchups are selected from `home.directory.currentMatchup`, selecting the member’s team for the member view. The current fixture check timestamp remains visible.

## Data and controls

- Imports the shared `inventory`, `data`, `mode`, `aiState`, `esc` and `money`; all layout, markup and control code are independently authored in `index.html`.
- Prominent offline/synthetic notice plus contextual labels throughout; all supplied current data is synthetic. Dated editorial preserves its stat period, opinion, selection reason and checked source date.
- Member summary, total modeled FAAB, pricing basis, calculation/market dates, complete coverage, top three and all 24 exact roster value rows are retained. Recorded history explicitly remains unavailable.
- Form shows supplied EMA fantasy points/game and observed sample size, availability unknown and no schedule adjustment; it does not become a price ranking or forecast. Completed-week best/rough cohorts retain points, games played, period, eligible coverage and overlap qualification, with an explicit synthetic fixture correction to the source-shaped wording.
- All five ready saved pairs show both actual probability entries, the literal returned choice and separate confidence. The fixture intentionally returns the 35% choice; the page preserves it. Per-pair provenance includes IDs, model, prompt, saved time, absent input timestamps/snapshots, evidence and unavailable returned evidence. Stale status is visible before disclosure. Missing state renders Unavailable without inventing results. Unmatched pairs have an explicit unavailable state.
- Ten faces retain team/player links and modeled prices. The complete directory retains 228 unique player links in ten native roster disclosures. Search matches teams, managers and players; sorts cover name, current standing and roster size. NeuralNets’ prior manager attribution is visible before disclosure and explained inside it.
- The ten-row standings table has a labeled functional sort and PF = pointsFor / 100. Missing league statistics and Lineup Power stay unavailable. Both member and league moves are labelled synthetic; dated editorial happenings remain separate.
- Native nonmodal navigation disclosure supports Escape and returns focus to its summary. Skip link targets the focusable main landmark. No animation, timers, modal, saving or generation is added.

## Actual verification

Browser checks used installed Playwright with `/usr/bin/chromium` against the coordinator’s existing server on `127.0.0.1:4198`.

- Public and member at **1440, 390 and 320 CSS px**: no page-width overflow; ten directory teams, ten faces, five saved pairs, 228 roster links and 228 unique player targets. Member has 24 valuation rows; public has no personal content. No browser page errors.
- Every native disclosure expanded simultaneously at **1440, 390 and 320**: no page-width overflow; all 228 roster references and 24 member values remain present.
- **Independent 200% text enlargement at 1440**: doubled computed font sizes without changing viewport width; no page-width overflow. Opening inspected in Chromium. This is a text enlargement simulation, not a physical browser/device acceptance claim.
- `?ai=stale`: five retained rows plus visible stale heading and row status. `?ai=missing`: visible Unavailable, zero invented pair rows.
- Player search “Embiid” finds team 1; manager/team search “NeuralNets” finds one team; impossible search displays zero results; clearing restores ten. Standing sort yields IDs 1–10. Roster-size sort starts with team 2. Standings name sort starts with Huff n’ Puff. All 24 roster value links expand. NeuralNets’ prior-manager attribution remains visible. Navigation Escape closes and returns focus.
- At 390 and 320 in public/member views, a DOM geometry check found **zero rendered links, inputs, selects or summaries below 44px target height** after the phone target pass.
- Computed colors on the rendered paper canvas (`rgb(245,244,239)`): ink **12.70:1**, secondary **5.15:1**, accent/focus **6.56:1**, current-state clay **5.51:1**, control boundary **3.41:1**. These are the solid rendered pairs; no text is placed on photographs.
- Opening desktop/phone and complete-page captures inspected locally. A fixed HTML image-height issue was corrected so the phone arena retains its full 16:9 frame. Local initial images loaded without failed-image reports. Temporary captures were removed after review.

## Limits

This is an isolated static design artifact, not production Next.js/authentication, refreshed league data, model execution, or route/game behavior verification. Destination URLs preserve existing application paths; the static file server does not prove their application flows. No screen-reader, physical mobile browser or production build claim is made. Full long-page captures require scrolling to load deferred below-fold portraits/game artwork. No installs, external data requests, commits, branches, GitHub actions, shared file edits or production changes were made.
