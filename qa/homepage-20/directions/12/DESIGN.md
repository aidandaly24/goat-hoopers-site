# 12 · Pocket game programme

The user question is “What matters for my team this week, and where can I look up the rest of the league?” The first action is **My team**, with **View roster** beside it on the phone cover. Current pairing, manager identities, known/pending scoring and incomplete status make those actions useful immediately.

This is an independently authored static HTML direction. I read the shared brief, repository instructions, homepage architecture, selected Paper + Slate design decisions and the GOAT design skill with hierarchy/accessibility references. I did not inspect another direction, gallery or prior screenshots before submission. Only `index.html` and this document are authored in this directory. No production code, branch, commit, external data, installation, service or agent is involved.

## Composition

A numbered, sticky contents rail gives the long programme four stable chapters: This week, Notes, AI picks and League. Every chapter is ordinary document content; navigation never swaps a hidden panel or moves through a carousel. The opening is a real Week 3 matchup, rather than the stale edition's opening-week story. The current known 0.0 and pending away score remain distinct.

The court is the original arena image in its natural 16:9 frame, with a useful free-throw practice link. It establishes the home floor without becoming text wallpaper. On desktop the pairing/court and member desk form an asymmetric two-column cover. Numbered chapters then expand into an observed-form/completed-week spread, three editorial columns, a two-column saved slate, standings/reference columns and an open two-column team directory. White space and restrained rules replace a repeated dashboard card grid.

Inter does the editorial and identity work; Geist Mono aligns scores, prices, periods and records. All color comes from shared semantic tokens. Slate identifies actions and chapter numbers; the incomplete score warning uses the semantic live/action-needed role. The selected GOAT logo and local player portraits remain unchanged. Missing portraits have labelled initials, rather than invented imagery.

## Reading and interaction path

- The member cover shows identity, roster count, current standing, immediate actions, modeled FAAB total, priced/unpriced coverage, computation time, top three players and a native disclosure containing all 24 values. Recorded value history is explicitly unavailable.
- The notebook distinguishes observed in-season EMA FP/G with eight-game samples from completed Week 2 fantasy point totals, GP, coverage and exclusions. Best/rough overlap is shown once with both labels, preserving all five unique selected players and both source selections.
- The three Oct 5–11 editorial spotlights remain clearly dated, draft, unpublished, stale sample opinions. Their supplied stats retain NBA/college periods. Each has native selection/source details and the source check date. Team news, recent member move and league happenings keep their sample labels and dates.
- All five saved pairs show every actual probability, the separately returned model choice, confidence and saved timestamp. The source's returned choice can have 35% while the other side has 65%; the display preserves that distinction. Model, prompt, roster IDs/current names, evidence and missing input snapshot are accessible in native provenance disclosures. `?ai=stale` is labelled outside disclosures; `?ai=missing` shows explicit unavailable state and no invented probabilities. Pair identity, current season and week are checked before calling a saved pair matched.
- Ten standings rows show rank, W, L and PF divided by 100. A labelled native select actually changes ordering by rank, name, PF or wins. The viewer receives a text “Your team” annotation without reordering.
- All ten faces link team/player identities and show the supplied top modeled player value, clearly distinguished from form and awards.
- The complete directory retains all ten teams/managers/current records/opponents and all 228 unique player references. Search matches team, manager or player; a player-only result opens its matching roster. Team name/current rank/roster size sorting works. Previous-season records retain their season and the NeuralNets previous-manager attribution in the always-visible row. Full rosters use native details and real `/player/id` links.
- League transactions, explicit unavailable stat leaders and Power, Stocks, trade analyzer, actual game preview/Play, both archive titles/dates/routes and editorial sources remain reachable. Header League menu and footer retain normal product destinations. Public/member fixture comparison links are explicit.

## Responsive and accessible states

At 390 and 320 CSS px the programme is a single linear reading order, with member actions before the matchup, wrapping identities, aligned values, native forms/disclosures and no horizontal scroll region. The contents rail remains visible. At desktop the same content becomes authored programme columns. The court keeps its natural image ratio at every size.

The public view uses its own `data` projection and contains no personal summary, values, watch list, completed-week member performers or private wire. It replaces the team desk with a compact league introduction and directory action. Current incomplete scoring, dated stale editorial, ready/stale/missing AI, missing portraits, history unavailable, stats unavailable, Power unavailable and empty search all have explicit states.

Keyboard starts with a visible-on-focus skip link. Navigation uses links, changing state uses native inputs/selects, and disclosures use native summary/details. Escape closes the open league menu and restores the summary's focus. Main-content links have a 44px phone height; native controls, summaries and chapter actions meet that floor. Fonts stay at or above 12px metadata, 14px secondary and 16px body. There is no motion or delay, and the shared reduced-motion rule is preserved. No modal or custom focus trap is introduced.

Forbidden patterns for this direction: forced one-screen dashboard, hidden-content carousel, fake live scores, missing-as-zero values, inferred AI winners, invented history/rankings/awards, enormous player heroes, decorative cards for every sentence, busy-image text overlays and inaccessible miniature phone controls.

## Actual verification

Evidence is **static browser fixture**, using installed Chromium 154.0.8037.57 through the DevTools Protocol at `http://127.0.0.1:4198/qa/homepage-20/directions/12/index.html`. It is not a production Next/auth/backend test.

The verified `index.html` SHA-256 is recorded in the final handoff. Browser QA was repeated after layout fixes; final output had no JavaScript exceptions.

| Check | Actual result |
| --- | --- |
| Member render, 1440 / 390 / 320 CSS px | Ready hook `12`; no page/element horizontal overflow; no broken loaded image |
| Every native disclosure opened, same widths | No horizontal overflow; all 228 roster references and all 24 values remain in DOM |
| Public render, 1440 / 390 / 320 CSS px | Ten directory teams, ten faces, five pairs and 228 unique player links; zero `data-personal` or member-value links |
| Content parity | Ten `data-team-id` containers, ten `data-face` entries, five `data-ai-pair` rows, 24 value links, 228 roster links and 228 unique roster links |
| AI stale / missing | All five stale labels visible outside details; missing state has zero saved pair rows and explicit unavailable copy, while league/member reference stays present |
| Search | “lillard” returns one team with its 24-player roster open; unmatched search gives a useful empty message |
| Sort | Directory current-rank sort returns IDs 1–10; standings name sort visibly reorders all ten rows |
| Keyboard | Actual CDP Tab focuses Skip first with visible 2px slate outline; Enter moves focus to main; Enter opens menu and value disclosure; Escape closes menu/restores summary focus |
| Chapter activation | Keyboard Enter on AI picks sets `#picks`; target top ~80px, below sticky rail bottom ~57px at 390px |
| Phone target geometry | No visible `a`, `button`, `input`, `select` or `summary` under 44px height at 390px with member values expanded |
| Independent 200% text check | At 1440px, every element's pre-captured computed font size doubled through browser style injection; no horizontal overflow, and all content retained. Separate from the 320px reflow check |
| Visual review | Own screenshots inspected for desktop/phone cover, desktop/phone notebook, phone AI picks, 320px standings and phone directory |

Rendered colors were read from computed styles and their opaque pairs calculated with the WCAG sRGB formula: body ink on paper 12.70:1; secondary ink on paper 5.15:1; white on slate primary action 7.22:1; slate on paper/focus adjacency 6.56:1; control boundary on white 3.76:1; incomplete-state ink on paper 5.51:1. This is evidence for those actual pairs, not a claim of universal accessibility conformance.

No remaining implementation blocker. Unperformed: physical phone/iOS, named screen reader, production route navigation/history restoration, live authentication, game runtime end-to-end play, server data/error recovery and save/generation behavior. Existing route links are ordinary destinations; the static fixture does not implement those products. Root owns bulk captures, comparison and independent critique.
