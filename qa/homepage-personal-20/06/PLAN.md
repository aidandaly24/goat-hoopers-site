# Concept 06 — Your game, your players, your league

Revised discovery plan by the same concept 06 author. Discovery only: this directory contains no presentation implementation. Build remains pending the coordinator's early-three gate. Only this file is changed.

## Three complete website architectures considered

### A. Rivalry, players, race — selected

A colored sports website that starts with the member's actual pairing, opens into the players they can inspect, then widens to the ten-team competition. A compact competition band, a coral player section and a pale-lime league section form three different working spaces. The complete roster lives on a local team sheet. Home / My team / League / Explore supply the main navigation; public pairings and teams replace member material for guests. This supports useful actions immediately and gives the league an authored visual identity across the entire page.

### B. A player-first scouting website

Start with one large, named roster player and their completed-week sample, with a compact pairing underneath. Follow with the other evidenced players, a team-sheet preview, then a ten-team directory and league tools. A narrow text menu and broad side-by-side player photographs would create a more photographic website, with player detail as the primary local destination. Rejected because the available sample is deliberately sparse and the opponent's full player evidence is absent: a dominant athlete would imply a stronger scouting selection than these data justify. It would also put the team's competition behind a selected individual.

### C. A season-race website

Start with the member's place among all ten clubs, grouped by current record; attach this week's pairing to the selected club. Follow with a visible five-game schedule, short player evidence, a historical club directory, then Stocks/Arcade/archive. A horizontal record ladder and team-name typography would drive the design. Rejected because Week 3 standings alone are too thin to carry the whole returning-member experience, and it encourages a misleading playoff narrative. The race is useful context after the matchup and players, without invented odds or simulated standings movement.

The selected design uses the three strongest questions in that order: **Who am I facing? Which of my players can I examine? Where does this put my team in the league?** Missing scores or prices qualify the answer; they do not become the visitor's job to repair.

## Visual world and proportions

This should feel like a lively friends' basketball league website, with real identities and tangible competition. It is a complete navigable page, not a scoreboard poster or a neutral work dashboard. Color defines different reading environments; it is not a skin applied to repeated cards.

- **Deep plum `#241D38`** is the persistent site field: masthead, page edges and footer. Warm cream text `#FFF6E3` keeps the identity welcoming rather than technical.
- **Coral `#F38B71`** belongs to the member's player section, with dark plum text. It marks the change from team competition to individual evidence.
- **Pale lime `#E7F1A6`** belongs to the league race and primary action surfaces. It connects action and competition without encoding a win, loss or data status by color alone.
- **Cream `#FFF6E3`** is reserved for the pairing's legible score surface and local detail reading panels. Secondary text remains a visibly darker value of the same ink family. These are proposed design values; actual rendered contrast will need verification during build.

At 1440px, use approximately 60px outside gutters and a 1320px working width. The masthead is about 78px; the synthetic/persona line about 36px. The opening pairing occupies roughly 250–290px, with 64% for actual teams, score/status and actions, and 36% for one purposeful arena crop. The section directly below begins visible in a normal desktop first fold. Nothing is set to 100vh. At 1120px, use approximately 32px gutters, a 67/33 opening split and naturally wrapping names; the proportions can loosen as text grows. No font reduction to preserve a fixed-height design.

Below the opener, use one expansive player section rather than a grid of metric boxes: a larger portrait-and-evidence composition on the left and a short list of the other evidenced players on the right. The league section changes geometry again: a 60% ranked club list beside a 40% five-pairing schedule. Explore is a plum horizontal section with a real game preview and two smaller groups of useful destinations. The footer is a generous readable destination map.

## Purposeful GOAT imagery

Keep the approved GOAT horizontal logo byte-for-byte unchanged, using its white variant against plum. It is the main masthead identity and a modest footer repeat.

The existing arena image establishes that this is a ten-person basketball league sharing one court. Use a static crop within the opening's right third, approximately 340–430px wide, with the floor and crowd visible. Keep score and navigation outside the picture. Do not place text over its baked-in lettering or pretend it depicts the current synthetic matchup. An accessible caption calls it the GOAT arena illustration. It remains a supporting image, not the page's entire hero.

Approved Joel Embiid and Giannis Antetokounmpo portrait cutouts identify actual roster players beside their own completed-week sample and current modeled quote. The selection rule is visible: the available local portrait among that team's verified sample players. It is not "player of the week", "best starter" or a fabricated editorial award. Other evidenced players use readable names; a missing picture does not get an invented likeness. Reaves' later player detail can use the approved Anthony Edwards and Alperen Şengün images when inspecting those roster entries, with no claimed completed-week evidence for either.

The actual free-throw preview illustrates the existing Arcade entry in Explore. Its action exits to the current GOAT game, visibly labelled. No new art download, figurine family, generated scene, canvas or 3D dependency is involved.

## Typography: four useful roles

1. **Section and team display: local Barlow Condensed Regular.** Mixed case, roughly 38–44px/1.05 for the opening team name and 31–35px/1.1 for major sections. This has basketball energy without making the whole page shout in uppercase. It is used for short titles, never for paragraphs, navigation or player tables. Long names wrap at ordinary spaces; the team name is not forced onto one line.
2. **Reading: Arial with Helvetica and sans-serif fallbacks.** 16px/1.55, normal 400, for explanations and captions that carry meaning; about 52–64 characters per line. It has a familiar unpretentious reading texture and does not compete with condensed headings. Short paragraphs accompany actual league facts rather than filling decorative space.
3. **Controls and identity lists: the same system sans at 14.5–15px/1.4.** Weight 700 for actions/current location and 400 for names/descriptions. Keeping controls familiar makes the colored sections easy to operate. Team names and player names can occupy two lines; "Giannis Antetokounmpo", "Kristaps Porziņģis" and "Stephon Castle’s Back" must remain fully readable. Button targets are at least 44px tall; secondary links have ample surrounding space.
4. **Scores and data: local Space Grotesk.** Scores about 46–54px/1 at weight 600; records, points and modeled-FAAB rows 15–16px/1.4 at 500 with tabular figures and aligned decimal columns where comparison helps. This provides open, sturdy numerals without turning the website into a terminal. Ordinary words such as "Score unavailable" use 16px system sans, so they are not shrunk to fit a score slot. Metadata is at least 13px/1.45. Units and period labels sit next to the quantities they describe.

This system has no serif editorial spine and no monospace ledger as its dominant texture. Barlow provides short-form character, system sans carries the work and Space Grotesk is deliberately restricted to quantities. Use only existing licensed font files and retain their existing OFL notices.

## Navigation and complete homepage architecture

The masthead has the unchanged logo plus **Home**, **My team** (members) or **Teams** (guest), **League**, and **Explore**. Home is current. These are useful local destinations: home, the team sheet/directory and the two substantial homepage sections. Account entry at the far end says **Sign in on GOAT — leaves prototype**. The member demo is not an authenticated account and should not imply otherwise.

A separate low-key utility line visibly says **Synthetic demo**, carries the fixture as-of date and links to Source notes. Its native select is explicitly labelled **Demo persona** and has Reaves / NeuralNets / Guest. It is never styled like account switching. All three URLs remain complete views with the correct persona dataset.

### Reaves homepage

**1. The pairing.** "Your Week 3" introduces Reaves Dropper against Ware the Hoes At?, with both managers, their 2–0 / 1–1 records and **184.5 / 171** current synthetic scores. No final winner or live clock. The record and pairing are already useful in the closed/home state. Primary action: **Inspect this matchup**. Secondary: **Open my team sheet**. The arena supports the right side of this same band.

**2. Players in your corner.** Joel Embiid's portrait accompanies **38 counted Week 2 points**, the explicit synthetic completed-week period and the current **137.50 modeled FAAB** quote as a separate fact. Four adjoining readable rows show Damian Lillard 42.5, Tobias Harris 31, Myles Turner 24.5 and Derrick White 22. The group visibly says **5 of 24 roster players have evidence in this sample**. A small dated sentence notes that this breakdown was added to the sample at 08:20 UTC. Names/actions open actual local evidence detail. It is a useful set of five records, not a claim to have ranked the full roster.

**3. The league race.** Show all ten supplied standings, with Reaves marked "Your team", current rank 1, record and season points. Beside the ranked list, show all five Week 3 pairings and their score states. The top six are marked as the league's six playoff places, with the qualification that playoffs start Week 20 and this is current standing only. No probability, clinching claim, form arrow or fabricated change.

**4. Your team sheet preview.** A compact open strip contains roster count, quote coverage and **1,095.25 modeled FAAB**, labelled as a complete modeled roster quote for this sample. No league value rank is asserted. The saved 56/44 matchup estimate can appear as a small clearly labelled preview here or in the matchup detail, with saved date; it never competes visually with the actual score. **Open 24-player team sheet** provides local depth. No full roster table is required on home.

**5. Explore and footer.** Arcade preview/action, Stocks and research links, archives, destination map and source explanation.

### NeuralNets homepage

**1. The opponent.** "Your Week 3" introduces **NeuralNets vs papichooter**, with 0–2 and 2–0 current records. Copy explains the useful competition context: this is the assigned opponent and both records are known. The score line reads **NeuralNets: score unavailable / papichooter: 0 recorded**. It does not declare a leader. The same primary action is now **Inspect the papichooter matchup**. Missing score context is one adjacent sentence, not a dominant coverage chore or repair CTA.

**2. Players in your corner.** Giannis Antetokounmpo's approved portrait anchors **45 counted Week 2 points**, with Rudy Gobert 29.5 and Kevin Durant 33.5 as the adjoining visible rows. State **3 of 22 roster players have evidence in this sample**, with the proper Week 2 period. These three real sample facts give the returning manager something worth inspecting even while the current score is absent. Action: **Inspect Giannis' sample** or either named player.

**3. The league race.** The same complete public standings and schedule now identify NeuralNets at current rank 10, with a straightforward 0–2 record. The section helps orient the manager among their actual competitors; it does not manufacture comeback odds, judgment or urgency.

**4. Your team sheet preview.** Lead with **22 roster players** and the team-sheet action. The supporting quote line reads **1,622.00 modeled FAAB subtotal — 16 of 22 players priced**. "Six quotes unavailable" opens the local team sheet at those players if desired; it is secondary inspection rather than a primary task to fix something. No comparative valuation rank or complete total. "No saved model estimate in this sample" replaces any prediction visual. Historical context is optional local detail and always keeps the previous-manager qualifier.

**5. Explore and footer.** The website remains as complete as Reaves', with functioning destinations and the same purposeful route map.

### Guest homepage

**1. Five games, one league.** Open on the current synthetic week and all five pairings as readable compact rows, including the zero-versus-missing state for papichooter/NeuralNets. The approved arena occupies the side of this public opening. Action: **Inspect a pairing**. No personal roster, private changes, personal estimate or "your team" wording appears.

**2. Meet the competition.** The ten clubs are visible in ranked order with current record, manager and points. A local team-summary view provides explicit season-labelled history, retaining NeuralNets' previous-manager note. Public team profile exits are clearly separate from local inspection.

**3. What members inspect.** A short useful explanation of the existing member edition's matchup, roster and player evidence, with **Sign in on GOAT — leaves prototype**. It is one small section after public content, not a gate or fake registration form.

**4. Explore and footer.** Arcade's real preview, the same research/archive destinations and a complete semantic footer. Guest does not receive a member player showcase assembled from personal DTOs.

## First three actions and local depth

| State | First action | Second action | Third action |
| --- | --- | --- | --- |
| Reaves | Inspect the scored Ware matchup | Inspect Embiid or any of the five Week 2 samples | Open the 24-player team sheet |
| NeuralNets | Inspect the papichooter pairing and known records | Inspect Giannis or either other Week 2 sample | Open the 22-player team sheet |
| Guest | Inspect any public pairing | Open a public club summary from the league list | Explore the real Arcade or use the clearly external sign-in entry |

Each inspection is a real local detail view with a semantic title and an ordinary **Back to home** link. Links carry a URL state such as `?persona=reaves&view=matchup&id=m1`, so direct navigation, reload and browser Back are meaningful. A small own script may progressively render these fixture-only views and keep scroll/focus when returning. It must focus the detail heading on entry, preserve the originating link on Back where available and handle unknown IDs with an explanatory local not-found view. No modal, focus trap or sliding drawer.

**Matchup detail** compares the two current records, current score/state and season points. Reaves' saved synthetic estimate shows returned choice, both probabilities, confidence 0.35 and October 26 saved time in separate labelled fields. It is not calibrated odds. NeuralNets has a plain unavailable-estimate statement; no fake refresh or generation. Opponent player evidence is not invented.

**Player detail** shows the actual player reference, position, period-labelled completed-week points or "Not included in sample", current modeled quote or "Unpriced", roster context and provenance. The fixture has no per-game receipt, injury feed or factor breakdown, so the detail never claims to expose one. A separately labelled link may leave for the real player profile.

**Member team sheet** contains the entire supplied roster, names, positions, current quotes and evidence status, with optional name search and visible result count. The quote's unit, coverage and unavailable rank reason are adjacent to the summary. A useful dense roster is appropriate here; it does not become the homepage architecture. No mutations or trade/lineup-save simulations.

**Public club detail** uses public identity, manager, current record, current pairing and qualified previous-season facts. Guest does not borrow a member summary. Where a public roster is not supplied for that state, give a clearly external real-profile link rather than inventing it.

## Destination and footer contract

Keep all existing fixture routes discoverable in a deliberate footer headed **On the current GOAT site — links leave this prototype**. Group them by purpose: Competition (Teams, The Table, Transactions, Draft); Research (News, Stocks, Intel, AI Decides, Trade Analyzer); Other weeks and play (History, Weekly archive, Arcade); Account (My Team, Sign in). Home returns to the local concept. This is a destination map, not 15 items squeezed into a masthead.

Source notes explain the synthetic current scenario, authorized identity references, explicitly qualified 2025 history and absence of real backend connections. The visible Synthetic demo label links here. There is no invented newsletter, social feed, notification subscription or fake account submission.

## Truthful data and behavior

The shared fixture was rechecked after its correction: **both valuation ranks are null**. A complete comparable quote for every league roster is absent, so no league value rank, value podium or inferred price ordering will appear. Reaves' quote coverage is complete for its own 24 players; NeuralNets' subtotal covers 16 of 22. Neither fact establishes an all-league rank.

Use current synthetic scores as current synthetic scores. Preserve zero separately from null. Completed Week 2 samples are not Week 3 points, current lineup recommendations, DNP labels or verified live evidence. Historical rows always name the season; NeuralNets' 2025 record says "Under the previous manager as QBs Gremlins." No history trend exists in this fixture and no chart is inferred. There is no Lineup Power producer.

The local persona query is labelled demonstration state only. Production membership remains server-resolved and request-private. No account, API, AI, market, database, storage or mutation calls are added. Source data comes only from the shared data-only fixture and existing approved assets.

## Selective application of assigned craft references

### Rauno Freiberg — Contrasting Aesthetics

<https://rauno.me/craft/contrasting-aesthetics>. Read the complete retrieved article text: introduction, Inviting Curiosity, PP Foundry, Just Friends, Raw Materials, Spaces and Loïc Nottet (retrieved lines 1–71). First fetch timed out; a second succeeded. Linked example sites and embedded music were not visited.

The useful lesson is purposeful contrast at a conceptual boundary. It changes this website's structure: competition uses a calm legible score composition, players use photographic coral space, and the whole league uses a lime list-and-schedule composition. Those sections are different because the visitor's question changes. Short condensed titles contrast with ordinary reading/control type. The GOAT mark, spacing and familiar actions remain steady across sections. No animated logo, bitmap typography, 3D example or source palette is copied.

### iart-ai — Accessible Animation, UI Skills

<https://www.ui-skills.com/skills/iart-ai/accessible-animation>. Read the full visible skill text from Accessible Animation through Gotchas (retrieved lines 28–206), including tiers, CSS/JS gating, live preference changes, WCAG mapping and verification guidance. No installation, linked patterns file or helper script was used.

The useful lesson is to separate spatial effects from orientation feedback. This website's player images, scores and schedule are static; there are no counters, carousel, animated court, scroll reveal or sliding inspector. Local detail entry uses URL navigation and heading focus. Small color/focus feedback may use a short transition; reduced-motion and still users retain every task. All primary content is available immediately, without waiting for animation. If build introduces any optional transition, its reduced preference behavior must be checked rather than assumed.

## Evidence read and next phase

Read the assigned AUTHOR-BRIEF and PRODUCT-INVENTORY; the complete fixture JSON and data-only JS export shape; AGENTS; relevant ARCHITECTURE sections covering homepage/archive, personalized data, domain/data/surface boundaries and accounts; and DESIGN guidance for useful states, data, identity, navigation and accessible controls. Production palettes, typography and fixed composition do not constrain this QA concept.

Read every required actual homepage file: `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts` and `src/ui/siteDestinations.ts`. The design keeps their meaningful boundaries: request-private membership, public access despite missing optional data, pairing-matched saved estimates, coverage-labelled modeled quotes, null handling and explicit history periods. The approved arena was visually inspected to plan a useful crop rather than assume its content. No peer, rejected prototype or pilot source was inspected.

Later build will create only this author's HTML/CSS/JS and NOTES in `06/`, with a data-only fixture import. It will implement the three complete states, the necessary local detail views, labelled external exits, correct persona/readiness datasets and a structure stage that neutralizes colors/images without changing geometry/content. Focused checks will cover 1440/1120 layouts, enlarged text, persona/null handling, local navigation/Back/focus, destination completeness and actual rendered contrast. Root owns final captures; there is no phone-design task now.

No presentation, browser, contrast, rendered-device or live-service check is claimed at discovery. There is no research blocker. Stop here awaiting the coordinator's early-three gate.
