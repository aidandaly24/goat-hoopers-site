# Concept 05 — Matchup, players, competition

Revised discovery plan, 2026-10-30. This remains author 05, not another author. This plan supersedes the first plan. Discovery only: no presentation code, peer inspection, production edits or publication. Await the root's build followup after the early-three gate.

## Chosen product architecture

The manager returns to a basketball league to follow a matchup, look at their players and understand the competition. This homepage puts those three activities in reach with substantial, visually different sections. It curates enough information to make each action worthwhile immediately. A local destination carries the fuller matchup, selected player or league table when the manager wants it.

The opening is a useful game surface. A broad player section follows, combining a real approved portrait with readable evidence summaries. Competition gets its own colored section with the member's neighbors in the current standings and the other games. The page finishes with destinations for reading, market tools and play, then a complete semantic footer. Main content is visible in document flow. A complete roster is a useful destination rather than mandatory home anatomy.

I privately developed three alternatives before choosing this one: a matchup-led sequence with distinct game/player/competition sections; a player-first team page with an asymmetric image gallery and smaller game summary; and a competition-first league page organized around positions and public pairings. The chosen sequence gives a returning member immediate orientation while allowing NeuralNets and guest different emphasis. The gallery depended too heavily on which players happen to have portrait files. The competition-first alternative made the member's own team secondary. No peer or pilot was inspected in making this choice.

## Actual visual world

The page has the atmosphere of an evening basketball club: deep aubergine reading surfaces, warm amber actions, bone-white type and a saturated violet competition section. Proposed colors are aubergine `#241A2E`, darker header `#16111D`, bone `#F8F0E2`, amber `#F6BD53` and violet `#593C83`. These start a later measured contrast check; no contrast pass is claimed here. Supporting text stays large and legible, with hierarchy supplied by space, size and weight.

The exact supplied white GOAT horizontal logo anchors a normal horizontal website header. Content is about 1240px wide at a 1440px viewport, with 36–48px section padding and broad compositions. The game and player sections have different proportions. Corners are mostly square or slightly rounded. Warm filled buttons identify the next action; selected/current states also use words. The page's character comes from media placement, contrasting section scales, basketball identities and readable local destinations, rather than color alone.

The opening uses a bounded crop of the approved arena image, occupying about one third of its visual area. I inspected `arena.jpg`: its large baked-in heading makes it a poor full background for another headline. Cropping its lower court/seating supplies basketball context while HTML team names, scores and actions sit beside it on solid color. The image is not evidence of a real game or live broadcast. The separate exact logo remains unmodified.

The player section uses supplied transparent headshots without inventing full bodies or staged portraits. I inspected Joel Embiid's and Giannis Antetokounmpo's 300×200 assets. A roughly native-size headshot sits on a warm amber/bone field, next to a name, actual sample points and a player action. Other players receive generous text summaries, so missing images do not become blank photo slots. A modest existing free-throw preview can accompany the lower play destination. No image acquisition is required.

## Typography and density

- **Headings/team identity:** local Archivo Black Regular, 32–38px/1.12 for page/team titles and 27–30px for section headings. Mixed-case names wrap. Its heavy shape supplies a sporting voice without a giant slogan or repeated uppercase display statements. No synthetic extra-bold weight.
- **Reading/names:** local Space Grotesk, 18px/1.5 for paragraphs, player summaries and meaningful status text; 19–20px for principal player names. Measure around 48–62 characters. Source timestamps/qualifications can use 16px/1.45 and remain plainly readable.
- **Controls:** Space Grotesk 16px/1.2, medium/semibold, native labels and approximately 44–48px targets. Sharing the reading family connects instructions to their controls. Filled primary, outlined secondary and ordinary text links establish priority; every item does not get an equal primary button.
- **Data:** local Oswald with tabular-number styling where supported, about 50–58px for known game scores, 24–28px for player samples/current position and 18–20px for supporting records/quotes. Short numeric statements use this face; units, periods, unknown states and paragraphs use the reading family. No small monospace metric strip.

These are three existing OFL font families, with licenses retained and no installation. Heading, reading/control and numeric roles were chosen separately. Long names such as “Giannis Antetokounmpo,” “Stephon Castle’s Back” and “Ware the Hoes At?” wrap rather than shrink or disappear into ellipsis.

At 1120px the body remains 18px. The header can gain a second row for the demo control. The opening image narrows while the team/score region gets the width names require. The player feature changes from image plus two text columns to image plus one wider list when the content needs it. Enlarged text grows sections vertically. There is ordinary document scrolling. This phase covers desktop, not a claimed phone/device test.

## Navigation and local destinations

The horizontal header contains the exact GOAT mark, current **Home**, local **This week**, **Players** for members and **The league** anchors, plus **Stocks** and **Arcade** current-site links visibly labeled as exits. The utility line contains **Synthetic demo**, fixed scenario time, **About these sources** and an explicitly labeled **Demo persona** native select. Persona uses `?persona=reaves|neural|guest`, defaults to Reaves and sets `document.documentElement.dataset.persona`. It is never production membership.

The first actions link to readable local matchup, player and standings destinations using a `view` query and fixture id. The member's name opens a local team view. Each destination retains site identity/footer, a named main heading and **Back to your homepage** or **Back to league home**. Ordinary navigation supports browser Back/Forward. On navigation focus goes to the main heading; returning restores a sensible source position.

The player page contains the actual selected player's quote/status, completed-week evidence/status, period/sample and fixture qualification. The matchup page has the actual pair, known/unknown scores, state and any matching saved estimate. The team destination can contain the complete supplied member roster after the member chooses it. Full standings exposes all ten current ranks, records and points for. Public team pages use available identity/current standing/qualified history; missing roster sets for other clubs are not invented.

Source disclosures use native `details`; core content is visible without opening them. A skip link, semantic landmarks, visible focus, real labels and readable contrast are build requirements. No task depends on hover or motion. There is no fake login, save, submit, generate or service refresh action.

## Reaves Dropper homepage

**Opening — your Week 3 game.** Reaves Dropper, aidandaly20, synthetic current 2–0/first place, and Week 3 are visible immediately. Reaves 184.5 appears beside Ware the Hoes At? 171, with the synthetic in-progress label adjacent. **Open matchup** leads, with **Open my team** secondary. A stated 13.5-point difference is current, not final. One supporting sentence links to the newly available completed Week 2 player sample. Quote coverage/check times sit beside relevant quote details rather than becoming opening alerts.

**Players — a useful completed sample.** The second section says **From your completed Week 2 sample**, visibly qualifying “Five of 24 roster players in this synthetic sample; October 19–25.” Joel Embiid's approved headshot accompanies his 38 points and **Open Joel**. Nearby summaries show Damian Lillard 42.5, Tobias Harris 31, Myles Turner 24.5 and Derrick White 22, each linking locally. Joel's image gives him prominence because it is available, not because he is called the highest scorer. This is a five-player sample, not a whole-team verdict. Week 2 points never masquerade as points in the Week 3 game. **See all 24 players** opens the team destination. Modeled quote is a supporting player-page fact.

**Competition.** The violet league section puts Reaves' first position beside second-place Stephon Castle’s Back and third-place papichooter, with supplied records and points for. “Current standings” names the basis. Other Week 3 pairings are readable links, with honest scores/status. **Open full standings** continues locally. No playoff probabilities are invented.

A concise saved-model note belongs with the matchup/local detail: 56% Reaves/44% Ware, saved October 26, synthetic uncalibrated estimate. Confidence 0.35 is separate in the source explanation. There is no generation or score-adjusted estimate.

The first three manager actions are: **open this matchup; open a counted Week 2 player sample; inspect nearby competition in current standings.** Each has useful visible context before navigation.

## NeuralNets homepage

**Opening — your opponent and your team.** NeuralNets, synthetic current 0–2/tenth place and Week 3 opponent papichooter are clear. The useful opening question is **Who are you facing this week?** Team identities and current records remain visible. Papichooter has recorded 0; NeuralNets says **Score unavailable**, with the explanation next to that fact. No leader, margin, winning color or empty progress gauge. **Open matchup** leads, with **Open my team** secondary. Missing saved AI is a quiet statement in the matchup detail, not a blank forecast panel. The team gets an actual basketball homepage despite the limits.

**Players — Giannis, Durant and Gobert.** Giannis Antetokounmpo's approved headshot sits beside his 45 completed Week 2 sample points and player action. Kevin Durant 33.5 and Rudy Gobert 29.5 are two generous summaries beside it. Period and “Three of 22 roster players in this synthetic sample” are visible. There are no blank fourth/fifth rows to force Reaves' exact composition. A smaller **Your roster** continuation names 22 players and opens the team view.

Inside that team destination, value reads **1,622.00 modeled FAAB subtotal**, 16/22 quotes, with unpriced players explicitly unpriced. Six missing quotes are relevant valuation support; they do not define the homepage or ask the manager to repair missing data. The supplied rank-unavailable reason remains in value source detail.

**Competition.** NeuralNets' tenth position appears with ninth-place T Halibooty and eighth-place Lebron Theme Team, using supplied records/points for. The current order does not become a recovery forecast, streak or manufactured target. Full standings opens locally; papichooter's third-place context is available with the opponent. Historical team detail always says “2025, under the previous manager as QBs Gremlins.”

The first three actions are: **inspect this week's opponent; open Giannis' completed sample; understand NeuralNets' league position.** These are team activities supported by available facts.

## Guest homepage

Guest receives **Week 3 at GOAT Hoopers**, a bounded arena crop and all five public pairing summaries. Known scores are readable; papichooter/NeuralNets distinguishes 0 from unavailable. **Open a matchup** is the primary action. No team is claimed for the visitor.

The next substantial section introduces the first three current clubs with records/points for and **Open full standings**. A two-column public club list then names all ten teams/managers and provides local team-summary links. The eight missing roster sets are not fabricated. Guest receives no personal player sample, private change feed or model block attributed to them.

The lower continuation gives entries to News, league history and Arcade, with the existing game preview where helpful. These are destination explanations, not invented present stories. **Sign in on GOAT — leaves prototype** is clear near account navigation and again in the footer, pointing to the existing login route rather than a pretend form.

The first three guest actions are: **open a pairing; explore a club/current standings; enter the real account site when personal access is wanted.**

## Footer and whole-site reach

A broad dark semantic footer keeps a modest exact logo and visible **Current GOAT site: these links leave the prototype** explanation. Groups cover League (Teams, Transactions, Draft, Intel, The Table), Tools (Stocks, AI Decides, Trade Analyzer), Read and play (News, History, Weekly archive, Arcade) and Account (My Team, Sign in). Current-site Home is included alongside local Home navigation. All fixture destinations remain discoverable without a fifteen-link header.

Exits use the existing `https://goathoopers.com` paths and accessible exit wording. Local actions are distinct. Source explanation, compact synthetic qualification and fixed as-of date finish the footer. No fabricated account/service/privacy promise. The retained 2025 final could appear only with its year and supplied facts; it is not necessary page filler.

## Truthful supporting context

Both corrected valuations have `rank: null` and `rankUnavailableReason`: complete comparable quotes for every league roster are absent. Neither persona gets an inferred league value rank. Reaves' 1,095.25 covers 24/24; NeuralNets' 1,622.00 covers 16/22 and stays a subtotal. Modeled FAAB is valuation, not money held or a transaction. These belong in player/team value destinations, not a prominent home metrics strip.

Unknown never becomes zero. Completed evidence and current pricing remain separate. No recorded value series, Lineup Power producer, present news article set or transaction list exists in the fixture. No historical graph, invented injury/news, notification, trade submission, lineup save, generated model or fake refresh is added. Current scores, records, prices and model output remain visibly synthetic. Sources explain identities/player references as authorized project data rather than a fresh production verification.

## Assigned references actually read and selectively applied

Both pages were opened successfully during this author's discovery on 2026-10-30. These are direct readings, not an index or installed workflow.

- [Hallmark — redesign.md](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md): read the rendered body **Redesign** through **After**, including **What a redesign keeps**, **Depth**, **Before**, **The plan** and **Build**. Retaining facts, actions and chosen brand informs the route inventory, exact logo and local/external distinctions. Its system/composition distinction supports changing this architecture rather than repainting it. It supplies no palette or template here. Its scripts and broader redesign approval process are not invoked.
- [UI Skills / pbakaus — adapt](https://www.ui-skills.com/skills/pbakaus/adapt): read **Assess Adaptation Challenge**, **Desktop Adaptation**, **Implement Adaptations**, **Verify Adaptations**, and responsive-reference discussions of content-driven breakpoints, input methods and testing. Applied principles are context, useful information upfront, preserved tasks through reflow and actual interaction checks. Its side-navigation suggestion is optional: this design uses a horizontal header/open sections. Wider desktop supports simultaneous game/player context; smaller desktop reflows it without reducing text. Screenshots establish geometry, not keyboard or physical-device behavior.

## Evidence, ownership and stop point

The first discovery read AGENTS, relevant ARCHITECTURE/DESIGN guidance, common author/product briefs and actual homepage/personalization/viewer/destination contracts. This revision reread the updated valuation/pairing/evidence/model objects and asset references, and visually inspected the approved arena/Joel/Giannis images. The approved font catalog supplied licensed options. No peer source or pilot was opened; no external asset/script was downloaded.

Only this existing author's `05/PLAN.md` is revised. Build would later create this directory's own HTML/CSS/JS/NOTES with a data-only fixture import. Structure stage must retain actual content/geometry while neutralizing color/media. Readiness follows settled fonts/content. Bounded planned checks cover three personas, 1440/1120 desktop, enlarged text, local navigation/Back/focus, source labels, score/quote gaps and destination reach. No code/browser checks are claimed for this Markdown revision.

Discovery revision complete. No build has begun. Awaiting the requested early-three gate and root build followup; no discovery blocker.
