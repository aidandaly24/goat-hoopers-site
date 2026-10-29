# 04 — Retro Arcade

This is an independently authored, isolated homepage fixture. The current QA brief explicitly permits this plum, turquoise and hot-pink theme; production palette, tokens, components, routes and data remain outside this folder.

The question is “What matters for my team this week, and where can I inspect or play next?” The member primary action is My team, with View roster beside it. Public readers get the current pairing and a direct team-directory action. Free Throw has its actual local preview and the real `/arcade/free-throw` Play destination. The preview is visibly STATIC and starts no game runtime.

The whole page follows an arcade league room: a framed cabinet with stepped pixel corners; a pink/turquoise paired score display; a player-value desk; open scouting and completed-week lists; a saved editorial program; five stored model responses; a compact two-column roster reference; and a league score table. Local Press Start 2P is restricted to short display headings, chapter labels and ranks. Arial/Helvetica carries names, controls, prose and data. The supplied GOAT logo is preserved.

At 1440px the game viewport and score desk share the cabinet. The value headline and top three players form a second horizontal composition. The roster reference uses paired columns without making every team a separate card. At 390px the current matchup precedes the practice screen, personal actions wrap, and reference sections become a single column. At 320px the matchup also uses one comparison column. All type uses root-relative sizes. Enlarged text wraps in natural document flow; navigation is a nonmodal disclosure with no fixed overlay.

## State and data preservation

- The current matchup is taken from the directory/personal fixture, independently of dated edition prose. Both managers, current records, week and incomplete status remain visible. Known `0.0` and unknown `Pending` are distinct.
- Member-only areas preserve identity, standing, roster count, all 24 prices, top three values, coverage, pricing basis and computation time. Recorded value history is explicitly unavailable.
- Form, modeled price and dated editorial remain separate bases. All watch entries retain observed-game counts. Completed-week lists retain points, GP, source period and coverage; the shared Joel Embiid selection appears once, with its membership in both lists stated.
- The saved response’s returned choice remains Ware the Hoes At? at 35%, beside Reaves Dropper at 65%; independent confidence remains 20%. Ready/stale rows expose model, prompt, IDs, saved time, unavailable input snapshot, evidence and baseline. Stale is visible without expansion. Missing or unmatched rows show Unavailable and retain the current pairing.
- Ten directory containers each retain their modeled face and full roster: 228 unique player profile links with position and NBA team. Previous-manager attribution is visible in the NeuralNets summary. Team/manager/player search, Clear and three team sorts work. All ten standings rows retain rank, W/L and `pointsFor / 100` PF, with independent rank/name/PF sorting.
- Both dated archives, edition sources and selection reasons, happenings, member news/moves, league transactions, league-stat unavailability, Power unavailability and real league/tool destinations remain available. The synthetic-fixture label appears at the top; complete limits and provenance are available in the footer.

## Verification

Evidence type: local static fixture in installed headless Chromium through Playwright, served by the coordinator at port 4206. No production Next runtime or external game/backend flow was exercised.

Final tested HTML SHA-256:

`4ebcb3af003f5977d7c45c84e2ea13acf1ee00ab59689f31b0f9b4004358cc72`

36 final geometry/data cases passed: member/public × ready/stale/missing AI × 1440/390/320 CSS px × root font 100%/200%, with every native disclosure open. The 200% method sets `document.documentElement.style.fontSize = '200%'`; body grows from 16px to 32px, desktop h1 from 32px to 64px, phone h1 from 22.4px to 44.8px. No case had page-level horizontal overflow, lost hooks, missing roster links or broken loaded images. Ten teams, ten faces and 228 unique roster links persisted; member had 24 values, public zero personal areas; ready/stale had five saved AI hooks, missing zero. No page script errors were observed.

Keyboard Enter opened the phone Menu; Escape closed it and returned focus to the trigger. Closed navigation was hidden. Player and manager searches each found the expected single team, a no-match search showed zero with recovery text, and Clear restored all ten. Team name/roster-size sorting and standings name/PF sorting produced the expected first rows. The returned 35% choice, 65% alternative, 20% confidence and `0.0`/Pending pair were checked. A reduced-motion media preference retained content. A request audit observed zero external runtime requests.

Rendered captures were inspected for the full 1440px page, full 390px page, 390px opening, and 320px/200% opening and footer context. Root owns the comprehensive capture and pairwise comparison round.

Opaque-color calculations for the actual plum/panel/screen/editorial/own-standing surfaces give minimum text ratios of 13.27:1 for primary ink, 8.62:1 for muted ink, 9.88:1 for turquoise and 5.70:1 for pink. Dark button text on turquoise is 13.19:1. Native controls and phone actions have a 2.75rem target floor; inline prose links retain their inline-link behavior. White focus outlines sit outside the control with a plum/screen gap.

Limitations: no screen-reader or physical-device pass; no production auth, Next Back/Forward, external source navigation, full Arcade gameplay/reset/exit or real data validation. No application build was run for this isolated HTML/CSS/JS fixture. No publish, Git, PR, configuration or production operation was performed.
