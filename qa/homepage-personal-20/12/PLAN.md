# Author 12 — a player-led club home

Revised architecture checkpoint, 2026-10-30. **Accepted by parent, implemented and frozen; see NOTES.md and verification.json.** Same independent author, own `12/` files only.

## Selected architecture

A new member learns this website through their actual club: owned people, the current opponent, recent player points and named destinations attached to those facts. The home is one unboxed photographic wall followed by a compact player digest and an open league almanac. It has no navigation rail, table, bar plot, complete standings, holdings allocation, evidence-repair queue or full-roster spine.

Previously considered alternatives are superseded: the pale site-guide rail made orientation too instructional, while the standings-led race made the page resemble other competition landscapes and weakened this author's newcomer purpose. The selected structure puts people and useful destination choices first.

## Header and orientation through real facts

A horizontal header carries the exact approved GOAT logo, current Home state, direct Teams, Stocks and Arcade links, and a native More league links disclosure. Its content covers News, The Table, Transactions, Draft, Intel, AI Decides, Trade Analyzer, History and Weekly archive. My Team and Sign in are explicit current-site account exits. Footer links preserve the entire destination inventory.

The utility line has the visible **Synthetic demo** source anchor and a native **Demo persona** selector for Reaves, NeuralNets or Guest. Query state is explicitly a demo and never membership. Default/unknown persona is Reaves; set `document.documentElement.dataset.persona`.

Useful route explanations belong beside the actual facts: **My Team — your full team area**, **Teams — your opponent's public profile**, **Stocks — modeled player prices**, **Intel — research this matchup**. These are short actionable captions in the page, not a separate tutorial. Ordinary routes use explicit `https://goathoopers.com` exits with visible **on GOAT** labelling. Local inspections stay clearly distinct.

## Geometry, imagery and visible content

At 1440px use roughly 1280px of centered content; at 1120px use natural gutters and an intrinsically wrapping layout. One normal document scrollbar; no fixed-height readers.

1. **Club wall.** A normal-size member/team heading sits above a shared cluster of two or three approved owned-player portrait cutouts. The images form one composition, without independent cards or repeated frames. Names, positions and current modeled quote/unpriced captions remain readable and attached to the appropriate player. A deep horizontal My Team destination runs beneath the collective, with manager, record, rank and roster count nearby. The wall's key action is local **Inspect player**; it does not navigate away unexpectedly.
2. **Current opponent.** A compact placard attached to the wall's lower edge shows the actual pairing and score state, plus separate local matchup inspection and Teams/Intel destinations. It is subordinate to the owned people and remains readable in normal flow. The wall and opponent form one composed opening, not compact team strip then leaderboard.
3. **From your last completed week.** A wide open digest lists every supplied verified-demo player and counted points: five Reaves players or three Neural players. Rows wrap as typography; no table, individual player cards or decorative chart. The exact period and sample coverage accompany the list. A player action opens local source detail. Stocks is identified here as price research, not completed-week points.
4. **Current quote and saved context.** A compact text-led section states modeled FAAB coverage, the relevant supplied change and existing saved-model context. The full roster can be inspected locally as secondary detail, but no 24-row roster dominates the homepage. Missing quotes do not become the identity of the page. No recorded history chart is drawn.
5. **League almanac.** An open, low, text-led collection connects useful public context to named routes: other Week 3 pairings to Intel, ten teams to Teams, current public record context to The Table, rookie draft to Draft, the move log to Transactions, previous editions to Weekly archive and past seasons to History. No new news or transaction is fabricated. The real approved game preview provides a smaller Arcade image and an honest external Play destination.
6. **Source explanation and footer.** A directly readable source section, semantic complete navigation, fan-made league identity/non-affiliation and Back to top conclude the page.

The collective portrait stage is large enough to make ownership tangible but leaves the opponent and first useful actions in the first fold. No giant empty team-name backdrop. Main content is already visible before inspection. No court-index design, giant single editorial portrait or roster allocation visualization.

## Reaves Dropper

The owned portrait cluster resolves Joel Embiid, Anthony Edwards and Alperen Şengün from the supplied Reaves roster and approved images. Their quote captions retain **137.50**, **124.50** and **108.25 modeled FAAB**. These are actual supplied current prices, not points or performance awards. Personal context is **aidandaly20 · 2–0 · 1st of 10 · 24 players**.

The current opponent placard reads **Ware the Hoes At?**, **184.5–171**, synthetic in-progress score. No win/final/live claim. The saved context is **56% Reaves / 44% Ware**, generated October 26, 08:00 UTC; independent **0.35 confidence** and returned choice stay in its local explanation. Label **Synthetic saved model estimate; not calibrated odds**. No generation or refresh action.

The digest shows Damian Lillard 42.5, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5 and Derrick White 22. It says **Synthetic completed Week 2, October 19–25; evidence for five of 24 roster players**. No games-played count or full-roster award is inferred. Complete modeled quote coverage is **1,095.25 modeled FAAB · 24 of 24 priced**, distinct from cash and completed-week scoring. The supplied evidence/quote changes sit beside those facts.

First useful task: inspect one of these owned players, see its supplied current quote and any counted-week evidence, then decide whether to continue to Stocks or the full My Team area on GOAT.

## NeuralNets

The owned wall changes substantially to Giannis Antetokounmpo, LaMelo Ball and AJ Dybantsa, the supplied roster's approved portraits. Quote captions are **135.50**, **77.75 modeled FAAB** and **Unpriced** respectively. AJ remains a real owned person with an unknown quote, not a zero-value asset. Personal context is **0–2 · 10th of 10 · 22 players**.

The opponent is **papichooter** with a recorded demo **0**; NeuralNets reads **Score unavailable**. No tie, margin, leader or 0–0 is inferred. There is no saved model: a calm unavailable statement replaces the model note, with an identified AI Decides exit and no fake Run action.

The digest changes to Giannis 45, Kevin Durant 33.5 and Rudy Gobert 29.5, with **three of 22 roster players** and the same completed period. It makes no claim about the other 19 players' participation. The price section leads with **16 of 22 priced**; **1,622.00 modeled FAAB subtotal** remains subordinate/incomplete. A local quote inspector can expose all six missing names. No complete total, cross-team price comparison or value rank is inferred.

First useful task: inspect Giannis' distinct scoring/price facts or AJ's unpriced quote, then continue to the appropriate real destination. Score/coverage explanations stay contextual rather than becoming a repair checklist. Any **2025: 1–20, 10th** record always retains **Under the previous manager as QBs Gremlins**.

## Guest

The wall becomes a shallower public league composition using the exact GOAT identity and approved arena image, without any claimed owned players. It immediately leads into all five current public pairings and useful public team/record context in normal flow. The account line says **Sign in on GOAT for your actual team**. Teams, Intel, Stocks, History, archive and Arcade remain purposeful routes. Member changes, member evidence/quotes and saved private model context are absent. No invented feature story or champion showcase replaces them.

## Deliberate typography

| Role | Face | Use |
| --- | --- | --- |
| Section identity | Local Archivo Black | 36–42px H1, 25px section titles. Moderate mixed-case phrases; no monumental slogan. |
| Reading | Georgia | 17px / 1.55 at 48–64ch for short explanations and source notes. |
| Controls and people | Trebuchet MS, Arial, sans-serif | 15–16px / 1.4, clear names and destination captions, intrinsic wrapping, 44px action targets. |
| Scores and price data | Local Space Grotesk, 500, tabular figures | 16px compact values, 26–30px matchup scores. Labels/units retain their own words; missing states are plain text. |

Use a warm white page, deep pine ink and a restrained apricot tint behind the shared photographic stage. Portraits and the exact mark supply identity. Open typography supplies the rest of the page's structure, without boxes around every fact. Current state and unknown values never depend only on color. Preserve existing local OFL notices, with no font/asset downloads.

At 1120px, portraits and their captions recompose within the shared wall rather than shrinking labels; the opponent can drop into a full-width row. Text enlargement grows every section. No fixed content heights, hard line clamps, overflowed whole-page navigation or compressed player names. Explicit wrapping cases include Giannis Antetokounmpo, Alperen Şengün, Stephon Castle’s Back and Ware the Hoes At?.

## Local task and accessibility contracts

Owned-player inspection opens a named local region containing supplied identity, position, quote or Unpriced, any supplied completed-week points, exact period and source limits. Matchup inspection shows only supplied pairing/records/scores and Reaves' existing saved-model provenance. Public-team inspection uses only public fixture fields. The full roster quote list is secondary inspection, not a homepage spine.

Local inspections use addressable hashes and ordinary Back/Forward; Close restores the exact trigger or a stable heading after a direct URL. In-flow regions have visible headings and Close, expanded/control relationships and no modal focus trap. The More disclosure grows in flow, retains native semantics and supports Escape with trigger restoration. Include a main skip link, conspicuous focus, real labels, semantic headings and native persona select. Links navigate; buttons inspect/change state.

All primary homepage content is visible before interaction. No simulated lineup/trade submission, login/logout, notification, AI run, market refresh, API/storage/database mutation or new credentials/dependency. Compact **Synthetic demo** label links to the full source explanation: October 30, 2026 08:30 UTC as-of, constructed current figures, project identity/asset references, period-qualified history and no live connection. No fabricated injury, real quote, live clock, history line or Lineup Power.

## Previously verified source reads and revised effects

Production discovery stands: complete `src/app/page.tsx`, `CourtsideHome.tsx`, `personalized-home.ts`, `home-viewer.ts`, `siteDestinations.ts`; current navigation/footer; relevant Table/Intel/Draft/History entrypoints; repo AGENTS, relevant ARCHITECTURE/DESIGN sections and local design skill. These establish source behavior only. Product source revision was `0d4564101af5a9267b152ccf08455e87a480ac33`; fixture discovery SHA-256 was `7a1835933c4319c5e169c46c21197e350d39715101078358413295aad907e382`. Read AUTHOR-BRIEF, PRODUCT-INVENTORY, shared fixture and local font catalog. No peers/old prototypes read.

- [Contrasting Aesthetics](https://rauno.me/craft/contrasting-aesthetics): full text and its named sections read; linked case studies/music not inspected. Concrete effect here: one photographic collective contrasts with restrained reading/working type, while route wording and controls remain consistent. The contrast serves owned identity, not an instructional rail or novel display type everywhere.
- [accessible-animation](https://www.ui-skills.com/skills/iart-ai/accessible-animation) and [complete primary SKILL.md](https://raw.githubusercontent.com/iart-ai/web-animation-skills/main/skills/accessible-animation/SKILL.md): full embedded/primary body read, including tiers, CSS/JS gating, verification and gotchas. Rendered GitHub path robots-denied; raw file opened. Concrete effect: the club wall is immediately still, with no parallax, auto-carousel, floating portraits or score counters. Optional short inspection opacity/color feedback retains orientation in reduced motion; no action waits on animation. No source scripts installed or run.

## Build gate

Parent received and accepted the concise selected architecture before code. Built in own `12/` using fixture data-only import, own HTML/CSS/JS and NOTES, with no shared/production changes. Structure stage retains geometry/content while neutralizing images/color; readiness marker becomes `12` after fonts/content settle. Final evidence is in verification.json.

Bounded checks after building: all three personas and unknown fallback, destination completeness/exit labels, exact unknown-score and partial-quote states, no guest personal context, local inspect/direct hash/Back/Close/focus, disclosure/Escape, 1440px and 1120px, enlarged text and reduced motion. Root owns final captures. No rendered/live-account/screen-reader result is claimed yet.
