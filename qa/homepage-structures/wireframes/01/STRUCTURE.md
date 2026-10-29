# 01 — Continuous spread

Stage one: source-ready grayscale architectural prototype, 2026-10-29. Independent structure review is still required. No full artwork or production integration is claimed.

## Surface contract

**User question:** What is happening in our league, and which details matter to my club?

**Primary action:** Read the current pairing, follow a contextual annotation, then unfold its evidence without leaving the spread. The contents index provides direct access when the visitor has a specific task.

**Relevant states:** member/public; ready/stale/missing saved AI; model-note open; all member values unfolded; dated editorial; club roster unfolded; player search/no matches; local sort; older archive game unfolded. The current scores are incomplete: known 0.0 is printed distinctly from Pending.

**Forbidden patterns:** boxed dashboard modules, equal cards, a decorative hero masking an unchanged dashboard below, invented history/power, inferred 65% model winner, personal content in the public DOM, autoplay/reveals, modal inspection, hover/drag-only controls.

## Desktop and phone geometry

At 1440 the page is one broad typeset canvas: a double-rule masthead, an editorial contents run, a full-width large headline, the two actual teams and scores in an open sentence-like pairing, then prose flanked by a narrow status note and a personal annotation. The reading canvas continues into five saved picks with marginal source notes, an indented personal passage, three unequal editorial columns, an open player roll call and a compact club ledger. Only two true changes of reading mode use a full-width top rule. Facts, sentences and rosters are not card slabs.

The phone treatment is a re-edited linear essay. Team identity precedes its adjacent score at 390; at 320 each identity and score get separate lines. Status and prose lead, and the personal annotation follows as a dashed editorial note. The contents is a native closed disclosure. The desktop's open ten-player roll call becomes a closed native foldout, so local search is reachable before traversing ten portraits. Source notes, member values and club rosters expand at their origin. At 320 the standings table is composed into rank plus labelled club/W–L/PF entries. Site destinations remain visible; there is no fixed chrome or swipe dependency.

This differs structurally from a reskin: the unit of interaction is an annotation within continuous reading, not a panel or dashboard tile. Source context is inline, the personal edition behaves as marginalia, the archive opens into the same canvas, and the phone deliberately changes the reading sequence and disclosure defaults. No shared presentation code or prior/other-author mock was inspected.

## Navigation and capture states

Native contents anchors, labelled links, native details/summary, a local search field and a sort select provide all navigation. No custom modal, route interception or focus trap exists. The local Home/brand preserve the current fixture query. Comparison explicitly switches member/public fixture editions.

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

## Actual checks and limits

Local static fixture checked in installed headless Chromium via Playwright, using root's existing server on port 4207. No package install, Git operation, production/shared-file edit, remote provider request or sub-agent was used.

- Member/public/stale/missing queries: each available capture state activated at 1440×844, 390×844 and 320×844; document scroll width did not exceed viewport width. Seven member capture states, six public states.
- Root font explicitly changed to 200%: no horizontal page overflow at 1440 and at a combined 320 stress case, with member values expanded. This is root text enlargement evidence, not browser-zoom or actual-device evidence.
- DOM checks: 5 ready/stale AI rows; 0 missing rows; 24 member values; 228 total and unique directory player references; 10 faces. Public DOM has no personal section. The first returned choice/probabilities were checked as Ware the Hoes At? / 35% and Reaves Dropper / 65%.
- Real input checks: keyboard Enter opens contents and first AI note; Embiid search returns one club and expands its roster; empty search state appears for an unmatched phrase; PF sort places club 1 first. Native disclosures retain focus at the trigger.
- At 390, all rendered link/button/summary/input/select bounding heights were at least 44px. Focus styles are authored and the tested controls were operable by keyboard. No universal accessibility claim follows from this bounded check.
- Approved local logo and all 13 portrait image instances loaded after scrolling to lazy assets. No page errors. Reduced-motion preference was changed live; both modes had zero authored running animations.
- Opening desktop/phone and editorial/directory states were visually inspected from local browser renders. Root owns the independent comparison captures and structural critique.

Unverified: production route destinations and Next router history; external source contents; real authentication; live data; physical devices; browser zoom; assistive-technology pass; full contrast audit; animation proposal. This static study does not modify or verify any Arcade gameplay. No final acceptance or release readiness is claimed.

## Deliverables

`index.html`, `style.css`, `app.js`, `STRUCTURE.md` only in the assigned `wireframes/01/` folder. Root may serve and capture these sources. Stop here for the independent grayscale structure gate.
