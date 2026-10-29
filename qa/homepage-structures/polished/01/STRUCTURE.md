> Historical structural record copied from the unchanged corrected source. For this polished QA implementation, art decisions, final checks and current limitations are in ART.md.

# 01 — Continuous spread: structural revision

Stage one structural revision, 2026-10-29. Source-ready and frozen for root capture and independent review. No full artwork, final acceptance or production integration is claimed. The original `wireframes/01/` files are untouched.

## Revision: problem and resulting behavior

Root found a real gap in the first-source evidence: 390×844 with `html { font-size: 200% !important }` overflowed to 428px in both editions. The earlier 320/200 check did not establish the untested 390 combination. This revision accepts that finding and tests the exact failing combination.

- **Before:** the 390 media rule retained a 3.2rem minimum headline, large quote text and constrained name/score columns. The special 320 correction did not apply at 390. Tight negative letter spacing also obscured the actual text geometry.
- **After:** the entire phone breakpoint gets readable word reflow, zero minimum-width grid constraints, sequential team/score composition, a smaller fluid headline and quote measure, wrapping roster-value rows, and the same labelled standings composition at 390 and 320. No overflow clipping or horizontal-scroll suppression is used.
- **Before:** a multi-link global header and long fixture paragraph postponed the phone's distinctive spread.
- **After:** the phone opens with the GOAT mark, the unmistakable `Synthetic concept`/edition label and one native `Read or explore` disclosure. That disclosure contains the contents index, every site destination, edition comparison and a nested native provenance disclosure with the complete warning/as-of/source explanation. The normal 390 header ends around 199px; the headline starts around 253px and both score states fit in the first 844px viewport.
- Removed negative letter spacing, uppercase/tracked decorative tags, redundant study labels and non-data dividers. Period/status labels and row rules remain where they convey facts or make tabular reading easier. Grayscale colors and fonts now use semantic local custom properties (`--color-paper`, `--color-ink`, `--color-muted`, `--color-rule`, `--color-row-rule`, `--color-focus`, `--font-body`, `--font-display`). No common visual template was introduced.

All fixture facts/actions, seven member/six public states, native focus and anchor/Back behavior remain. The capture API resets contents/provenance to the default desktop/phone disclosure state on each activation.

## Surface contract

**User question:** What is happening in our league, and which details matter to my club?

**Primary action:** Read the current pairing, follow a contextual annotation, then unfold its evidence without leaving the spread. The contents index provides direct access when the visitor has a specific task.

**Relevant states:** member/public; ready/stale/missing saved AI; model-note open; all member values unfolded; dated editorial; club roster unfolded; player search/no matches; local sort; older archive game unfolded. The current scores are incomplete: known 0.0 is printed distinctly from Pending.

**Forbidden patterns:** boxed dashboard modules, equal cards, a decorative hero masking an unchanged dashboard below, invented history/power, inferred 65% model winner, personal content in the public DOM, autoplay/reveals, modal inspection, hover/drag-only controls.

## Desktop and phone geometry

At 1440 the page remains one broad typeset canvas: a compact GOAT masthead, an open editorial contents/navigation passage, a full-width headline, the two actual teams and scores in an unboxed pairing, then prose with a narrow status note and member annotation. The canvas continues into five saved picks with local source notes, an indented personal passage, three unequal editorial columns, a player roll call and club ledger. Paragraphs and rosters are not card slabs.

The phone is a re-edited linear essay. Its contents/navigation is a closed native disclosure. Identity and score use sequential lines throughout the phone breakpoint, removing the cramped inherited name/value columns. Status and prose lead into the member annotation. The desktop's open ten-player roll call becomes a closed foldout so search is nearby. Source notes, member values and club rosters expand at their origin. Phone standings preserve rank/club/W–L/PF as labelled entries. Every destination is inside `Read or explore`; no fixed chrome, swipe or drag dependency exists.

The interaction unit remains an annotation within continuous reading. Source context is inline, the personal edition behaves as marginalia, and the archive opens into the same canvas. This revision changes the reflow and navigation behavior, not the architecture's identity. No other author's presentation was inspected.

## Navigation and capture states

Native contents anchors and site links share `Read or explore`. Labelled links, native details/summary, a local search field and a sort select provide all navigation. No custom modal, route interception or focus trap exists. The local Home/brand preserve the current fixture query. Comparison explicitly switches member/public fixture editions.

`document.body.dataset.studyReady = '01'` and `window.goatStudy` are available after rendering. `activate(id)` deterministically resets relevant disclosures/search, selects the named substantive state, and positions the actual document without a fake screenshot. It returns the state, view and AI mode.

| ID | Actual state |
| --- | --- |
| `default` | Opening spread, current incomplete pair and member margin/public league note |
| `model-notes` | Five returned picks; first source note open, or honest unavailable state with `?ai=missing` |
| `roster` | Member passage with all 24 modeled values open; absent from public state list |
| `editorial` | Coherent October draft from `data.archive`, game and three opinions |
| `directory` | Search/index at its origin, Reaves Dropper roster unfolded |
| `search` | Local Embiid search; one matching club and its roster unfolded |
| `archive` | Older `2026-W40` game unfolded inside the spread |

Other reachable states use native controls: the ten-player roll call; all other team rosters; four further AI source notes; three editorial basis/source notes; edition sources; `2026-W41` archive game; empty search and alternative sorts. No automatic state switching runs.

## Content map and truthfulness

| Information family | Concrete place and retention |
| --- | --- |
| Identity and destinations | Approved local black GOAT logo; visible Home, News `/intel`, Stocks `/stocks#player-board`, History `/history`, Arcade `/arcade`, AI Decides `/ai-decides`, Teams `/teams`, Transactions `/transactions`, trade analyzer `/trade-analyzer`; member `/team` and `/teams/1#team-roster`; comparison; dated weekly links and game `/arcade/free-throw` |
| Current week | Opening pairing comes from member summary or public directory's current matchup, with week, both teams/managers/current records/scores and incomplete status; all five pairings also appear beside their AI picks |
| Saved AI | Five choices and every supplied probability in returned order; first returned away choice stays 35%, other side 65%, independent confidence 20%. Each note retains timestamp, model, prompt, choice ID, explicit absent snapshot/baseline, input evidence and absent returned evidence. Query stale/missing are visible; no generation |
| Member | Team/manager, standing, roster count, actions, subtotal/basis/time, priced/unpriced/complete coverage, value rank, top three values/change percentages, all 24 modeled values. Form watch with EMA/GP/basis limits; completed Week 2 best/rough FP and GP, exact period, cohort/coverage/overlap limits. Both news examples and supplied move. Member section is not rendered for public |
| League | Ten representative players with player/team links, position and modeled value; actual champion label. All ten club rows with manager/current record/opponent/scores/count/PF. All 228 unique player references retained in reachable rosters with position and NBA team. Local team/manager/player/position/NBA search; name/PF/roster-size sort. All ten standing ranks, W–L and PF, with hundredths conversion. Prior-season record/finish clearly attributed within each roster |
| Editorial | Coherent `2026-W41` archive entry supplies the October game; all three spotlights retain exact stats, opinion, period, selection reason and dated source. All happenings and source links. Both archive dates/status/routes; both game records reachable in place |
| Explore and provenance | Explicit Stocks/trade/game/news paths, three current synthetic move examples, footer fixture warning and as-of distinction. Recorded value history and Lineup Power state unavailable; no fake line or ranking |

All current records, score, valuation, news, form, move and model material is visibly marked synthetic. November 12 is a fixture timestamp, not the current date. October entries are unpublished dated samples. The completed-week lists use the exact fixture numbers but explicitly remain synthetic examples. No copied fixture description is allowed to override that warning.

The common fixture's `home.edition.game` has been reported inconsistent with its dated prose. This prototype deliberately uses the coherent `data.archive` entry for the dated game and does not mutate or silently repair the fixture. The common facts module is the sole import; no provider request occurs.

### Still abridged

All requested information families and all roster references are reachable. Null aggregate league leaders (`hub.stats`) are not given separate empty headings. Unused transport IDs, null avatars/ESPN IDs, the null `opener`, `latestMove`, `recentMove` and empty move legs are not dumped as raw JSON. Empty move legs and unavailable snapshots/baselines are instead stated in readable text. The top-value and face portraits use only approved local assets. No full production route, authentication boundary or connected producer is implemented by this static wireframe.

## Craft references that changed this composition

The project design skill and its hierarchy/navigation/motion references were read, as were the supplied updated `reference-notes/craft.md` notes. No external source was fetched and no foreign scripts were executed.

- **Hallmark custom direction/macrostructure/responsive:** the continuous-spread idea governs all the content, not an unusual landing view followed by default panels. It produced the open score sentence, marginal member passage, unequal story columns and inline foldouts.
- **Elaya redesign:** breaking equal-card symmetry and maintaining context led to unequal editorial measures and native notes attached to the originating text. No automatic sidebar or floating navigation was adopted.
- **pbakaus adapt:** the phone changes reading order/disclosure defaults rather than shrinking columns. The player roll call folds while the useful search remains nearby; 320 standings are recomposed.
- **Emil Apple design/Rauno:** source and destination stay connected through expansion in place. There is no detached inspector to lose the reader's location.
- **Addy accessibility/frontend engineering:** controls have actual names and visible focus, no duplicate inactive layout copy, and complete data and real-length strings were browser-checked. Empty search and unavailable model states are composed in the reading canvas.
- **Emil/pbakaus animate and accessible animation:** frequent reading and keyboard actions are immediate at this stage. No incidental motion was added to give a static screenshot the appearance of interaction.

## Motion job and fallback

Stage one deliberately has no authored animation, timers, scrolling effects, autonomous loops or hidden essential text. Native scrolling and disclosure reflow are the whole interaction. Later full-build motion thesis: one short, interruptible 120–180ms expansion of the member roster annotation can explain that the added value rows belong to the subtotal at their origin. It must keep the trigger and real content available, never tween values, and become immediate for keyboard/reduced motion. This is proposed work, not a claim of shipped animation. All current paths are already equivalent without motion.

## Actual revision checks and limits

Local static fixture checked in installed headless Chromium through Playwright using root's existing port 4207 server. These are source/browser-fixture checks, not production integration evidence. No install, Git operation, first-source/shared/production/Muse edit, external provider call or sub-agent was used.

- Final matrix: member, public, member stale and member missing queries × 1440/390/320 widths × normal/`html { font-size: 200% !important }` × every available capture state. **162 state/viewport/text combinations, zero horizontal document overflow, zero page errors.** The failing root method was reproduced exactly: root computed font size 32px at 390 and 320. No `overflow-x: hidden/clip` masks content.
- Normal 390×844: header bottom 199.34px; headline top 252.92px; synthetic label visible; contents initially closed. The normal phone and 390/200 opening and normal desktop were visually inspected from actual local renders.
- Expanded contents, full provenance and the player roll call were also checked together at 390 and 320 with root computed font size 32px in both editions: document width stayed equal to the viewport. Capture states were rechecked after adding deterministic menu resets.
- Native keyboard Enter opens `Read or explore` and provenance. Site navigation retains all nine routes. An actual contents link set `#model-notes`, scrolled its heading to ~16px from viewport top, and native browser Back returned the empty hash. No history interception was added.
- Search `Embiid` returns exactly one matching club; PF sort puts club 1 first. All 24 member values, 228 total/unique directory player references, 10 faces and 5 ready AI rows are retained. The returned first choice remains Ware the Hoes At? at 35%, with Reaves Dropper at 65%; independent confidence remains 20%.
- All rendered phone link/button/summary/input/select targets in the bounded check have height ≥44px. A full screen-reader or actual-device pass remains unperformed. Focus uses the local semantic focus color.
- Original frozen source checksums still match the handoff: index `cef2e85c8c3879bb3b853513163bdc694f689dbc9da438422392ec516177e474`; CSS `edb6825d8195c3aa7d0803465161993cfd0e2fb1dafbe3d7bef5e3114eec45a3`; JS `af99f535cfff58ce4fad4e1e1b56db3b22d67bb4a27393a2a00fa2b6473f993d`.

Unverified: production route destinations/Next history, external source contents, authentication/live data, physical devices, browser zoom, screen readers, full contrast audit and the later motion proposal. Native hash/Back evidence does not establish Next router restoration. The static study does not modify or verify Arcade gameplay. Root owns capture comparison and independent/Muse review; no final acceptance is claimed.

## Deliverables

`index.html`, `style.css`, `app.js`, `STRUCTURE.md` only in `structural-revisions/01/`; original `wireframes/01/` preserved. Root may serve and capture these sources. Stop here for the independent grayscale structure gate.
