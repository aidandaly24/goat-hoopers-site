# Chronological league feed — bounded craft revision

This remains option 06 among twenty structures. No option was selected or removed. The complete dated stream, scope filters, source-period filters and as-of register remain. This folder is the revised source; `wireframes/06/` and its evidence were not edited.

## Actual changes

- Removed visible study numbering, the decorative introduction/eyebrow and the oversized heading treatment. The page now says “League log” with a short public/member comparison link.
- Replaced the multi-part fixture strip with a compact native **Synthetic concept** disclosure. Its expanded provenance still says that scores, records, modeled prices, news, form, moves and AI are synthetic, identifies November 12 as the fixture date rather than today, and distinguishes dated editorial.
- Rewrote this option's local stylesheet. Removed manual letter spacing and uppercase tracked labels. Headings and event annotations use normal system typography. No opacity hierarchy or shadows are present.
- Removed repeated row rules and enclosing menu borders. The time spine remains because it connects entries to their source dates. Underlines and control baselines still identify interactive inputs, current navigation and the selected scope.
- Defined and consumed semantic `:root` font roles for reading, headings and numbers; text-size roles for body/page/event/subtitle; and color roles for canvas, text, secondary source text, timeline, controls, feedback, focus and portrait backing. All colors are equal-channel grayscale. The number font distinguishes values, scores and dates without tracking or decorative labels.
- Shortened status repetition to a changed entry count. Reset is absent in the default state and available after filtering. Current Week 3, completed Week 2, saved AI and dated editorial retain explicit distinct labels.
- Reduced the phone header to GOAT, direct Stocks and Menu. An open phone Menu occupies normal document flow. The title, comparison link, synthetic disclosure and deliberate feed controls are compact enough that the first dated event starts at approximately 314 CSS px at 390px width.
- Kept a left timeline on phones and corrected compact date alignment. At 390px both matchup scores retain comparative columns; at 320px or enlarged text they become readable stacked score rows. The initial member annotation is shorter while retaining manager, record, roster count, standing and My team/roster actions.
- Improved register return: opening from an event and returning restores that event's actual trigger focus, scope, source period and scroll context. Top-level index return retains its top-level control.

## Surface and navigation contract

**Question:** What happened, which source period does it describe, and what matters for my team?

**Primary action:** Follow a league/personal/market scope and inspect a dated observation. Current member actions remain My team and View roster.

Desktop retains unequal-width entries on opposite sides of a continuous date spine. Event boundaries use space, dates and ownership of source context. It is still a chronological league stream, not a hero followed by dashboard cards. The as-of register expands the November 12 observation into a wider searchable index without pretending it is a reconstructed roster history.

At 390/320px the spine moves left, the contextual annotation introduces the event and the date becomes a compact horizontal marker. All content uses ordinary page scrolling. There is no modal, independent scroll region, drag path, hover dependency or motion library.

Relevant states remain member/public; everything/league/personal/market; each supplied period; selected current pairing; search/sort/matching/empty register; native roster/source disclosures; and ready/stale/missing saved AI. Forbidden patterns remain invented timestamps/results/history/power rankings, inferred AI choices, personal-edition content in public, and repeated bordered feed cards.

## Source periods and truthfulness

Runtime facts still come exclusively from `{inventory,data,mode,aiState,esc,money}` imported from `../../data.js`. No source facts or shared fixture files changed. Synthetic current metrics remain labeled as such.

- Current matchup: directory/member Week 3 pairing checked November 12. Both records/managers and both scores remain, with known 0.0 distinct from Pending and incomplete distinct from final.
- Model observation: roster valuation is FAAB-denominated, with supplied basis, calculation time, coverage, top three, full 24 values and supplied modeled rank. Recorded history is unavailable.
- Form: the supplied EMA FPPG, observed-game count, availability and schedule caveats remain distinct from modeled price movement.
- Completed source period: Week 2, November 2–9, end exclusive. Five verified synthetic players remain; best/rough overlap is represented once for Joel Embiid.
- Saved AI: November 10. All five returned choices, both probabilities and independent confidence remain. The first returned choice stays roster 2 at 35%; roster 1 remains 65%, confidence 20%. Timestamp, model, prompt, null input snapshot, evidence and current-display-name qualification remain in native disclosures. Stale is explicit; missing has no invented rows or percentages.
- Dated editorial: both coherent archived issues remain in September/October. `2026-W41` uses its archive pair `[1,5]`, consistent with preserved title/prose; the contradictory `home.edition.game` pair is not reused. College/NBA periods, opinions, selection reasons, happenings and checked source dates remain.

## Reachable content map

| Family | Location |
| --- | --- |
| GOAT; Home, News, Stocks, History, Arcade | Header, with phone Menu and direct Stocks |
| Teams, Transactions, AI Decides, trade analyzer, weekly archive, Free Throw | Header tools/Menu and contextual/footer links |
| Member `/team` and `/teams/1#team-roster`; public/member comparison | First member annotation and page-title row |
| Current pair, all five selectable pairings, managers, records, week, scores/status | First November 12 entry |
| Five complete saved AI returns and provenance | November 10 entry |
| Member identity, 24-player count, standing, value/coverage/top three/all 24, unavailable history | First entry and November 12 market observation |
| Scouting form and distinct completed best/rough period | Observed form entry and November 2–9 entry |
| News and recent moves | November 12 activity/member wire |
| Ten faces and ten teams, managers, current records/opponents, 228 unique references | As-of register; player/team profiles remain distinct links from disclosure actions |
| Team/player lookup and sort | Register search; standing, team name, roster size and player-name sort |
| Ten standings, rank/W/L/PF | Register preview and full register disclosure; PF still divides supplied hundredths by 100 |
| Prior-season attribution | Roster disclosures, including NeuralNets' previous manager/QBs Gremlins qualification |
| Three exact spotlights; game, stats, periods, opinions, sources | Dated October archive entry and native source disclosures |
| Both archive dates/routes; happenings; footer provenance | September/October stream and footer |
| Unconnected Lineup Power / recorded history | Honest unavailable text; no invented output |

No information family or full inventory was removed. Deep destination pages are existing routes, not reimplemented in this local concept.

## Capture API and motion

Ready hook remains `document.body.dataset.studyReady='06'`. `window.goatStudy` still exposes the eight member states `default`, `league`, `personal`, `week2`, `market`, `ai`, `archive`, `directory`; public omits personal and Week 2. Activation renders actual content and resets the register query. Additional search/disclosure/filter combinations remain directly operable.

State changes remain immediate. There are no autonomous timers, observer reveals, RAF loops or animated numbers. Reduced motion preserves the same views and actions. The later motion thesis remains a single short, interruptible expansion from a dated register entry into the wider reader, with an instant reduced-motion equivalent; no such art or animation is implemented in this revision.

The craft principles retained are content-specific macrostructure from Hallmark, removal of equal-card symmetry and contextual inline depth from Elaya, task-preserving phone adaptation, normal keyboard/native control behavior, and immediate frequent actions from the supplied interaction/motion references. The new revision applies those principles without changing this option's architecture.

## Actual targeted checks

Installed Chromium/Playwright against root's local 4207 server:

- JS module syntax passed. No browser page errors.
- All eight member and six public states checked at 1440, 390 and 320px, each with 16px and 32px root text: 84 combinations, zero page-width overflow.
- Fully expanded register, market, AI, archive and Week 2 details at 320px/200% root text: zero overflow.
- Phone 390 measurements: first event begins around y314; compact date is aligned at x36; known 0.0 score appears around y691 and Pending around y795, rather than being pushed behind repeated header strips.
- Ten teams, ten supplied faces, 228 roster links / 228 unique player URLs; 24 member values; five saved AI rows with exact choice/probability/confidence; five unique completed-week rows.
- Embiid lookup returned one team/one player and retained search focus. Empty lookup rendered honestly. Actual team A–Z ordering and player-name ordering passed.
- Market scope produced its two observations; incompatible market/November 10 selection produced the empty-combination state; Reset recovered the stream. October filtering produced four dated entries and no current matchup.
- Register open/return restored trigger focus to `event-register` and the prior scope. Menu Escape closed it and restored summary focus. Keyboard Enter opened a roster disclosure. Reduced-motion preference retained register functionality.
- Missing AI rendered zero rows with unavailable text. Stale AI retained five rows with an explicit stale label. Public rendered no personal value/form/completed entries, no `/team` action, and no personal scope control.

Two temporary local inspection screenshots were viewed in `/tmp`; root owns the full-state evidence and Muse review. No screenshots were written into either source folder. No original/shared/production/Muse/Git files, packages, services or external providers were changed. No full art or final acceptance is claimed. Physical-device, full screen-reader, live authorization and external-route behavior remain outside this bounded static QA pass.
