# 17 — App Native

An independent, local-only homepage direction. The user question is **“What should I check for my team, and where do I go next?”** The primary action is **My team**, immediately beside **View roster**. Public visitors get the same current matchup and league tools, with a league desk replacing personal information.

The app uses ice grey `#edf2f7`, a cobalt `#174acb` matchup workspace, and mint `#c4f5e4` for the primary team action. Inter is loaded from the existing local asset; system sans is the fallback. Root-relative type starts at 16px, secondary text at 14px, and provenance at 12px. Numbers use tabular alignment. Rounded grouped lists, fine separators, compact labels and a narrow navigation rail create the app character. There are no gradients, decorative charts, autonomous motion, generated people, shared styles or borrowed section templates.

The wide layout gives one joined matchup/value workspace first priority. Unequal scouting/wire columns follow. Saved AI, dated editorial, the searchable roster directory, the league table and archives remain complete below. All ten modeled faces are useful anchors inside the team directory, rather than a separate equal-card gallery. Small supplied game previews lead to Free Throw; the supplied arena thumbnail opens its dated edition. The selected GOAT logo remains unchanged.

At 390px and 320px, the workspace and grouped lists stack. The phone dock reaches Home, My team (Teams for visitors), Stocks, League and More. More opens the normal-flow navigation disclosure and focuses its summary; Escape restores the actual initiating control. The header Menu also opens with Enter, closes with Escape and restores focus. Expanded menus are not modals and do not trap focus. Desktop navigation uses normal document flow so enlarged text cannot strand lower destinations in a tall sticky rail. Search and sort controls retain visible labels.

## Facts and states

- The prominent synthetic-fixture notice is visible without disclosure. Full source fixture, dated editorial sources and selection reasons, pricing basis, calculation time, AI provenance and limitations are accessible.
- Current Week 3 comes from the directory’s current matchup. Known `0.0` and missing `Pending` stay distinct; the pairing is incomplete. October draft editorial is explicitly separate, preserving supplied statements without relabeling them as current results or awards.
- Member identity, standing, roster count, top three prices and changes, complete 24-player valuation, form watch, completed-week best/rough lists, coverage, news and moves remain available. Observed form, modeled price and editorial opinion have different labels and periods.
- Every saved AI row preserves the returned choice. In the first row that is Ware the Hoes At? at 35%, beside Reaves Dropper at 65%; independent confidence stays 20%. Model, prompt, roster IDs, league/season/week, saved timestamp, input-snapshot absence and evidence are accessible. Stale output is visibly stale before expansion. Missing output says Unavailable and retains all five current pairs. An unmatched league/season/week/pair fails to an unavailable row rather than displaying a probability.
- Recorded team-value history, Power and all six unconnected league-stat producers remain unavailable. No synthetic chart or rank is drawn. The complete ten-team directory has 228 unique player links, position/NBA team, current records/opponents and explicitly attributed 2025 records. QBs Gremlins is named as the previous manager for roster 8.
- All product destinations, both dated archive entries, market, trade analyzer and actual Free Throw navigation are retained. Price amounts link to the actual Stocks route; no unsupported player-query deep link is implied.

## Verification

Evidence is from the local static fixture in installed headless Chromium through Playwright, served at `http://127.0.0.1:4206/qa/homepage-themes/directions/17/index.html`. No production build is relevant to these standalone files.

- Member and public, ready/stale/missing AI, at 1440, 390 and 320 CSS px: no page overflow, with all main disclosures opened. Initial closed disclosures were also checked at each width for both views.
- 200% root text enlargement separately at 1440px for both views, with all disclosures open: computed body type 32px, no page overflow. The final rail team link could receive focus within the viewport.
- Verified ten `data-team-id`, ten `data-face`, five ready/stale `data-ai-pair`, 228 roster links with 228 unique player destinations, and 24 member value rows. Public has zero `data-personal` and zero private value rows. Missing AI has zero saved-row hooks and five unavailable current pairs.
- Player and manager searches, empty search/Clear with focus restoration, alphabetical team sort and standings sort passed. Menu Enter/open, Escape/close/restore and dock More/Escape/restore passed.
- Inspected desktop opening, complete phone captures, narrow opened roster and expanded footer. After scrolling through the page, all 22 local images were loaded with no broken image. No page errors or nonlocal requests occurred.
- Reduced-motion emulation retains all information and controls. No motion or timers are authored.
- Computed foreground/background checks across the member page with disclosures open found no text failures. Representative ratios: white/cobalt **7.30:1**; secondary ink/white **6.07:1**; secondary ink/ice **5.39:1**; mint action ink/mint **8.62:1**. Focus uses cobalt on pale surfaces and mint in the cobalt workspace. Inputs have explicit control boundaries. Main phone actions, navigation, disclosures, roster links, player-name links and value links have 44px minimum targets; inline prose/source links retain inline behavior.

Not verified: physical devices, a screen reader, actual Next navigation/history, authentication, destination market inspection or the complete game/reset/exit flow. Product routes are real destination links in a static preview; the shared local server is not the production app. Unmatched AI has explicit source handling, but no separate fixture URL is supplied to exercise that state. The data has no producer for historical values or Power. No release, Git, external installation, API generation or production change was performed.

Forbidden patterns for this direction: equal-card dashboard repetition, cream editorial material, fake game controls, fabricated history/Power, zero for unknown, current-week editorial awards, and inferred AI winners.
