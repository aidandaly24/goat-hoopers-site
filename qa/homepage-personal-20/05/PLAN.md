# Author 05 — Your players, your place

Accepted architecture, 2026-10-30. This remains the same independent author 05. The two earlier plans are superseded. Root authorized this alternating composition for build, with a typography correction. The implementation and final browser evidence are documented in NOTES.md.

## Two alternatives considered

### Alternative A: the public club index as the home

Organize the page around ten named clubs, with the viewer's club located in the shared directory rather than isolated in a personal hero. Each club would link to its current pairing and public profile; a member could expand their own player context locally. The composition would be a broad two-row club index with a separate continuous account/team strip and bottom tools navigation. It offers a strong guest page and social league identity.

I rejected it because identity objects would occupy too much initial attention for a returning manager. With complete player data supplied for only two clubs, the index would either be thin or overpromise roster depth. A large collection of uniform club tiles would also make the member's next decision harder to see.

### Alternative B: two weeks in a continuous journal

Put a completed Week 2 section beside the current Week 3 pairing, connecting only the same member identity and explicitly separating the periods. A long, wide spread would let the manager move from counted player samples to their current opponent without a dashboard. Navigation would follow the two named periods, with a public competition appendix and a full site footer.

I rejected it because the fixture carries neither a complete Week 2 team result nor a full counted roster. A chronological page could visually suggest a richer recap or causal connection to the current game than the facts support. It would also give the guest a weaker organizing principle.

## Selected architecture: player-led home with a league-position companion

Lead with identifiable players and the member's place in the competition. The current opponent is visible in the team context at the top, then gets a full-width working matchup surface across the middle of the page. The upper page combines two different questions simultaneously: “Which of my players can I inspect?” and “Where is my team in this league?” A lower, reversed-width row combines other games with routes into the rest of GOAT. This is a complete homepage with several useful destinations, not a single player-inspection screen.

The desktop composition is explicit:

1. A shallow horizontal masthead, with the exact black GOAT mark and ordinary navigation.
2. One team context line: team/manager, current record/position, Week 3 opponent link, and **Open my team**. No large decorative hero title.
3. An upper 7:5 composition: a generous player list on the left; a current-standing neighborhood on the right. Each uses its own visual language. These are two bounded sections rather than three persistent streams.
4. A full-width current-game surface, roughly 150–190px tall depending on wrapping, with the two teams, known/unknown score, state and **Open matchup**.
5. A lower 5:7 composition: useful GOAT destinations on the left and the other four Week 3 pairings on the right. The reversed proportions create a readable change of rhythm.
6. A complete semantic footer with all production destinations and source explanation.

Primary content is already in normal document flow. Full rosters, full standings and deeper player/matchup facts are local destinations reached by ordinary links. The homepage does not require a full roster, a table, three feature cards or every available data family.

## Visual world and imagery

The visual world is warm, graphic and direct: a marigold page (`#EFB65D` starting point), deep pine text (`#173C36`), a muted mint standing-neighborhood section (`#BDD2B4`), and a lighter yellow game surface (`#FFE2A1`). Small bone fields can support the footer/source area. Dark pine filled controls identify the main action. These are proposed starting colors; foreground/background pairs must be measured in build, not assumed to pass contrast.

The page has substantial color across its working areas, large names, generous leading and fewer simultaneous numeric facts. The upper left player list sits directly on the main canvas. The standing neighborhood is an inset colored field with a strong current-position line; it is not a grid of identical cards. The game uses a wide horizontal composition. Section separation comes from proportion, spacing, color fields and type rather than a border around every item.

There is no large arena or portrait stage. The exact supplied horizontal logo remains the sole masthead mark. Approved headshots may appear at 44–56px beside a player who actually has one, and at a sensible native size on that player's local page. Names without portraits stay text-first, without giant initials or blank photo slots. A modest existing free-throw preview supports the lower Arcade destination. Imagery does not determine the product priority, and no roster member is highlighted merely because an image exists.

I previously inspected the approved arena and Joel/Giannis headshots. The arena's baked-in heading is a reason to omit it from this home rather than crop it into another hero. No new illustration, photo, script or asset download is needed. No jersey, ticket or court metaphor replaces the actual website.

## Reading, control and data typography

This plan abandons the prior Archivo/Space Grotesk/Oswald proposal.

- **Section and page headings:** local Barlow Condensed Regular at 27–52px for section hierarchy and up to 60px for the short team title. Its narrow sporting rhythm fits the broad text-led composition. It does not carry paragraphs or dense data. Team names can wrap and are not forced into display capitals.
- **Body and player/team identity:** `"Trebuchet MS", "DejaVu Sans", sans-serif`, normally 18px/1.5, with larger principal player names. DejaVu Sans is installed in the selected environment. Short paragraphs have a 48–60-character measure. This broad, readable text face supplies substance to the colored layout rather than tiny captions.
- **Controls:** the same Trebuchet/DejaVu family at 16px, bold where appropriate, with visible native labels and approximately 44–48px targets. Controls share the reading language and use filled, outlined or text treatment according to importance. They are not set in the condensed heading face.
- **Short numeric statements:** local Lora at 26–30px for sample points/current position and up to 42px for game scores, requesting lining/tabular figures. Its readable serif numerals make these figures feel distinct from interface labels. Records and quoted prices remain 18–20px. Number alignment matters only within a genuine comparison; there is no dense metric strip or small monospace register.

Barlow Condensed and Lora are existing approved OFL assets, whose notices remain untouched. No download or dependency is required. “Giannis Antetokounmpo,” “Stephon Castle’s Back,” “Kristaps Porziņģis” and long opponent names grow their row naturally. No ellipsis, fit-to-width shrinking or fixed-height clipping.

At 1440px, main content is approximately 1240px wide with about 40px spacing between the upper sections. At 1120px, outer padding becomes about 28px and the 7:5 split adjusts only while names remain readable. Content-driven reflow can stack the two upper sections under enlarged text; text stays at its intended size. The game wraps to two team lines when necessary. This assignment covers desktop, not claimed phone/device verification. There is one ordinary page scroll and no fixed-height reader.

## Reaves: players and the top of the table

The opening identifies Reaves Dropper, aidandaly20, current synthetic 2–0 and first place. A readable **Week 3 against Ware the Hoes At?** link gives immediate opponent access before the main body. **Open my team** opens the full local team destination.

The upper-left section is **On your roster, last week**. It shows the five supplied completed Week 2 player samples as five generous open rows: Damian Lillard 42.5, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5 and Derrick White 22. The order is descending supplied sample points, not an invented award. Each row has a name, points with unit, and an explicit local player link. A period line says “Synthetic completed Week 2, October 19–25; five of 24 players.” That sample statement is visible but supporting. The list does not call unknown participants poor performers or imply these are Week 3 points.

The upper-right standing neighborhood says **Your place: first** and shows Reaves with the next two current clubs: Stephon Castle’s Back and papichooter. Their supplied current records/points for provide actual competition context. The section links to all ten standings and individual public team summaries. No playoff prediction, streak or movement from an earlier rank is inferred.

The middle current-game surface shows Reaves 184.5, Ware 171 and the synthetic in-progress state. **Open matchup** leads into the richer local game page. A current 13.5-point difference may be stated as current, never final. Saved model information belongs in that destination: 56%/44%, October 26 save, synthetic uncalibrated estimate, confidence 0.35 separately named. The homepage need not repeat it as another metric.

Lower content gives the four other games and useful market/play/archive destinations. A short “Completed player samples are newly available” sentence can link to the already visible player section; it is not a fabricated notification service. Quote coverage belongs beside actual value information on the team/player destination.

The first three manager actions are **open a named player sample**, **open this week's matchup**, and **inspect a nearby team/current standings**. All have meaningful context before clicking.

## NeuralNets: its players and its current rivals

The opening identifies NeuralNets, current synthetic 0–2/tenth place, and **Week 3 against papichooter**, with **Open my team**. It does not lead with missing quotes or ask the member to repair data.

The player section has three substantial rows rather than pretending five exist: Giannis Antetokounmpo 45, Kevin Durant 33.5 and Rudy Gobert 29.5, with local actions and the explicit completed Week 2 period/three-of-22 sample. The layout breathes differently from Reaves: three taller rows rather than five smaller rows, with the same readable scale and no blank placeholders. Giannis' small approved portrait can aid identity without making a portrait edition.

The standing companion puts NeuralNets' tenth position with ninth-place T Halibooty and eighth-place Lebron Theme Team, printing their actual fixture records and points for. Papichooter's third-place context is available in the matchup. Current order does not become an invented comeback forecast.

The game surface shows papichooter's recorded 0 and NeuralNets **Score unavailable**, with the missing-versus-zero distinction immediately beside it. No leader, margin, winning treatment or empty probability bar. The matchup destination quietly states that no saved AI estimate is available. This does not prevent a useful opponent/team page.

The complete roster is available after **Open my team**. That local destination labels 1,622.00 as a modeled FAAB subtotal covering 16/22 players; missing quotes read “Unpriced.” The six missing prices are supporting valuation context. They do not become the home's identity or primary task. Any previous-season history says “2025, under the previous manager as QBs Gremlins.”

The first three manager actions are **open Giannis or another supplied player sample**, **inspect papichooter and the current pairing**, and **understand NeuralNets' current league position**.

## Guest: competition first, then clubs and games

Guest uses the same horizontal masthead and graphic layout without claiming a team. The upper-left section introduces the first three current clubs, records and points for, with local public team links. Its companion explains the actual league scope: ten teams, six playoff places, playoffs beginning Week 20. Those are format facts, not playoff odds. **Open all standings** is a clear local action.

The middle working section introduces Week 3, with the five pairing summaries visible in normal flow. Each opens a local matchup page. Known values are shown; the papichooter/NeuralNets score distinguishes zero from absent. The lower reversed-width section pairs useful GOAT tools with all ten named clubs/managers and their local public summaries. No player sample, private model block or personal change feed is attributed to guest. Missing public roster data for the other clubs is not fabricated.

**Sign in on GOAT — leaves prototype** is ordinary navigation to the existing login route, visibly distinct from the local tasks. There is no pretend login form. Guest's first three actions are **open a current club/standings**, **inspect a pairing**, and **enter the real account site if personal access is wanted**.

## Navigation, destinations and accessibility

The masthead has current **Home**, **My team** for members, **The league** and **Explore GOAT**. Local section links are clearly local; the real-site Stocks/Arcade entries in the lower continuation visibly say they leave the prototype. **Demo persona** is an explicitly labeled native select using `?persona=reaves|neural|guest`, default Reaves. It sets `document.documentElement.dataset.persona` and is never production membership. A compact **Synthetic demo** label, fixed scenario time and source explanation remain visible.

Local team/player/matchup/standings views can use a `view` query plus the selected fixture id. They retain site identity, a named main heading, useful facts already supplied and a visible **Back to your homepage** or **Back to league home** link. Browser Back/Forward works through ordinary navigation. Main-heading focus is applied after navigation, with a sensible source-position return. A source disclosure may use native `details`; core content does not require opening it.

The team destination holds the supplied full roster and correctly labeled valuation. The player destination separates current quote from completed-period evidence and never invents game logs, played-game counts, injuries or factor histories. The standings destination contains all ten current rows. Public team destinations retain source identity and qualified previous-season objects, with an honest unavailable roster where needed. External profile links remain separate and labeled exits.

Semantic headings/landmarks, skip link, visible focus, native controls, adequate measured contrast, intrinsic wrapping and keyboard operation are required. No task depends on hover or motion; still/reduced-motion users get the whole site. No save, trade submission, notification subscription, fake refresh or generated model action is simulated.

## Useful footer and complete destination coverage

The footer has a modest exact GOAT logo, a short source explanation and a visible **Current GOAT site: these links leave the prototype** label. Groups cover League (Teams, Transactions, Draft, Intel, The Table), Tools (Stocks, AI Decides, Trade Analyzer), Read and play (News, History, Weekly archive, Arcade) and Account (My Team, Sign in). Current-site Home is also present. All fixture destinations are discoverable without an oversized header.

Exits use the existing `https://goathoopers.com` paths with accessible exit wording. The lower destination descriptions are factual invitations, not fake present news/transactions. The retained 2025 final is optional historical context only, with its year and supplied facts. No fabricated account/service/privacy promise fills the footer.

## Source honesty and references

All current quantities, scores, standings, quotes and model output are synthetic. Both valuation ranks are null, with the supplied rank-unavailable reason: complete comparable quotes for every league roster are absent. No value rank is inferred. Reaves' 1,095.25 covers 24/24; NeuralNets' 1,622.00 covers 16/22 and stays a subtotal. Modeled FAAB is valuation, not held money. Unknown never becomes zero. No value history, Lineup Power, current news article set or transaction list exists in this fixture, so none becomes invented home content.

The two assigned public sources were directly opened during this author's discovery on 2026-10-30. Their scripts/workflows were not installed or invoked.

- [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md): read the full rendered **Redesign** through **After**, including **What a redesign keeps**, **Depth**, **Before**, **The plan** and **Build**. Applied here: preserve the exact chosen brand, supplied facts and destination reach while changing composition as well as type/color. It did not supply this page's spatial arrangement, palette or typography.
- [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt): read **Assess Adaptation Challenge**, **Desktop Adaptation**, **Implement Adaptations**, **Verify Adaptations**, and content-driven breakpoint/input/testing discussions. Applied selectively: visible useful information, context-driven reflow, preserved tasks under enlarged text and honest later test evidence. Its side-navigation suggestion is not a requirement. This design uses a horizontal masthead and two bounded, differently proportioned section pairs. Screenshots would verify geometry, not keyboard or real-device behavior.

AGENTS, relevant ARCHITECTURE/DESIGN guidance, common author/product briefs and the actual homepage/personalization/viewer/destination contracts were already read. The corrected fixture valuation objects and approved asset/font options were checked. This revision did not inspect peer source, pilots, shared styles or previous prototypes. It creates no dependencies or shared/production changes.

Implementation is limited to author 05's directory. The accepted build has been checked at three personas, 1440/1120 desktop widths and enlarged text, with actual local tasks/Back/focus, source labels, known/unknown scores, quote honesty and destination reach. See NOTES.md and browser-evidence.json for the exact method, results and source hashes. Freeze after these bounded checks; root owns final captures and packaging.
