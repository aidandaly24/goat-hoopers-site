# Concept 03 — a personal editorial edition

Current implementation: an editorial homepage with meaningful local team, player, matchup and league destinations. This revision replaces the pale table-led notebook after the parent visual/product gate. Baseline `fd9df451` remains in repository history. All changes stay in `qa/homepage-personal-20/03/`; no production, shared presentation, live service or publication action was taken. No peer or pilot implementation was inspected.

## Product, architecture and imagery

The first three member actions are **Open your matchup**, **Browse your roster**, and **Follow the league**. They reflect the manager's work, rather than making missing-price cleanup or evidence inspection the homepage's purpose.

A compact current-pairing ribbon follows the GOAT masthead. The main body is an asymmetric editorial spread: selected owned players and real roster/season context in a broad reading column; a vertical next-action index and personal season column alongside. A staggered second player story continues the reading flow. The league notebook shows selected standings positions and all five pairings. Full rosters and standings tables live on separate local destinations, not the homepage. Grouped footer links preserve all 15 destinations in the shared fixture.

Reaves' edition features Joel Embiid and Alperen Şengün, both centers in its roster, alongside its 2–0 record and 184.5–171 Week 3 pairing. NeuralNets features Giannis Antetokounmpo (PF) and LaMelo Ball (PG), its 0–2 record and papichooter pairing. Neural's unavailable score, the opponent's known zero, six missing quotes and absent AI remain truthful supporting context. They do not become headline tasks. Guest receives a substantial public edition: a qualified 2025 final reference, all five current synthetic pairings, current top-of-table context, a ten-team directory and actual external sign-in entry. No private team is claimed.

The approved roster portraits identify the people in the story and link to profiles of players actually owned by the selected persona. The approved court artwork is a cropped inset beside the lead member portrait; it supplies the league setting without becoming a scoreboard hero or empty background. Guest uses the same approved court artwork for its public historical feature, visibly qualified as illustration, not a photo of the 2025 final. No asset was generated, edited or downloaded. Logos are the exact approved SVGs. No figurine family, canvas, WebGL or 3D implementation was added.

Before implementation I privately compared three complete architectures: an illustrated contents page, alternating long-form chapters, and a personal editorial front page. The last offered the clearest relationship between a few owned players, the manager's current pairing and a useful set of next actions. It was chosen and sent to root before coding. No dark arena-led hero or horizontal scouting band was built.

## Complete typography system

Lora is the reading and editorial face: 16px lead prose with 1.75 leading; 15px supporting prose; 35px page headings, 28px feature/section headings, and 23px supporting story headings. Its moderate scale, mixed-case names and 52–58ch reading measures give the page an editorial voice while retaining website density.

Space Grotesk handles working names, navigation, controls, captions, data labels and most numbers. Navigation is 14px, task titles 15px, ordinary data 14–16px, and caption/metadata 10–12px. Numeric values use tabular figures. Archivo Black is reserved for the compact current-pairing scores and short position numerals: it is not used for prose, long names or a giant display slogan.

All three are existing local licensed assets from the approved font catalog. Their original SIL OFL notices remain untouched under `qa/homepage-structures/assets/fonts/{lora,spacegrotesk,archivoblack}/`. There were no font downloads, dependency changes or installations. Rem-based roles and intrinsic wrapping let enlarged text increase the document height.

## Sources actually read and applied

Both assigned primary references opened directly. No index was substituted for a source read. No source was installed as a skill and no external scripts were run.

- [Addy Osmani — Frontend UI Engineering](https://github.com/addyosmani/agent-skills/blob/main/skills/frontend-ui-engineering/SKILL.md), also read from [raw source](https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/frontend-ui-engineering/SKILL.md). Selected sections read: reference-led UI quality, common visual defaults, spacing, typography, keyboard controls, labeling, focus, explicit empty states and URL state. Re-read for this revision: reference-led contract, content-first hierarchy and semantic controls. Concrete effects: the full architecture was resolved before coding; imagery belongs to an actual player story; the homepage has unequal editorial regions and ordinary-scale headings; full data moved behind meaningful destinations; the roster has an explicit empty-search state. URL state supports real destination links and retained search. Production palette and mobile-first prescriptions were not adopted because this QA brief explicitly selects independent desktop composition.
- [Emil Kowalski — Apple Design](https://www.ui-skills.com/skills/emilkowalski/apple-design). Partial direct read: Core Idea and sections 1–4, 7, 12, 14–17; re-read sections 14–16 for this revision. Concrete effects: local navigation responds without animation waits; returning reverses the path and restores source focus/scroll; a source modal alone dims the background; explanatory text has looser leading than controls; enlarged type grows the layout. There is no entrance animation, carousel or moving background, so reduced-motion visitors receive the same content immediately. The reference did not supply the page's branding, imagery, colors, layout or font combination.

Also read the exact assignment, author brief, product inventory and fixture, repo AGENTS/ARCHITECTURE/design guidance, and the required production homepage, personalization, viewer-resolution and destination files. Production membership remains server-resolved; demo query selection is explicitly synthetic and never authorization.

## Local destinations and return behavior

All destinations use this same `index.html`; **there are no additional detail HTML files or external route dependencies**. Standard anchor hrefs work as ordinary same-document URL destinations. The router uses History API interception for immediate rendering and records the source link ID and scroll position in navigation history. Browser Back or the destination's Back link restores the originating link and scroll position. Directly opened detail URLs have a meaningful parent fallback. Roster search is kept in the URL, so it survives a player-profile round trip. No storage API is used.

Examples:

- `?persona=reaves` — Reaves homepage; default persona is Reaves.
- `?persona=neural` — NeuralNets homepage.
- `?persona=guest` — substantive public homepage.
- `?persona=reaves&view=roster` — full 24-player roster, quotes and counted sample; Neural has 22 players.
- `?persona=reaves&view=player&player=1511` — Joel Embiid's owned-player profile.
- `?persona=neural&view=player&player=4866` — AJ Dybantsa, with quote and counted sample explicitly unavailable.
- `?persona=neural&view=matchup&matchup=m4` — papichooter / NeuralNets, no inferred leader.
- `?persona=guest&view=league` — full standings, pairings and directory.
- `?persona=guest&view=team&team=8` — public NeuralNets profile with the previous-manager 2025 qualification.

Supported views are `home`, `roster`, `player`, `matchup`, `league` and `team`. Guest roster/player URLs resolve to the public league view. Player IDs must belong to the selected member's supplied roster. Header current-location state follows each destination. External links use a local SVG mark and accessible text explicitly identifying the current GOAT site and leaving the prototype. They do not establish production behavior.

Source notes use a native modal with Close, Escape, backdrop dismissal and returned trigger focus. Roster search has a result count and readable no-match state. Full local profiles explain periods, quote units and absent values. No lineup save, trade submission, real login, notification or fresh AI generation is simulated.

## Truthful supporting context

No missing score becomes zero. Papichooter's zero remains known and NeuralNets' score remains unknown. Its available modeled subtotal covers only 16/22 players. Reaves' quote covers all 24 own players, but neither state asserts a league value rank because comparable complete quotes for all teams are absent. Missing counted-week evidence does not imply a DNP, zero or availability status. Historical records retain their year and NeuralNets' previous-manager qualification. No historical value trend, Lineup Power, injury, news event, live clock or unsupplied metric is invented. Saved AI is shown only for the supplied matching Reaves pairing, with probabilities and confidence separate.

`document.documentElement.dataset.persona` is set to the selected demo persona. `dataset.view` identifies the current local destination. `dataset.personalStudyReady` becomes `03` after the current render's fonts and images settle. `?stage=structure` preserves the same content and geometry while neutralizing colors and story imagery.

## Actual final browser evidence

`node --check qa/homepage-personal-20/03/script.js` passed. `node qa/homepage-personal-20/03/check.mjs` ran with system Chromium against the existing localhost static server. This revision's results replace the baseline evidence in `browser-evidence.json`.

All three personas passed at 1440×1000 and 1120×1000 CSS px with reduced motion. Checks cover the visible homepage, all relevant local destinations, keyboard activation into a player profile, destination heading focus, actual browser Back to its source link, Back from a player to the filtered roster with both filter and source focus retained, readable empty search, local matchup comparison, full league table, team history and source modal Escape/focus return. Neural's unknown player quote/sample, score distinction and absent AI were checked. Guest's five initially visible pairings, qualified historical feature and absence of a claimed private roster were checked.

Homepages have zero roster or full standings table rows. Each member has two approved owned-player portraits; each edition has five visible public pairings. Full local rosters contain 24/22 rows, and the local league table contains all ten teams. All 15 required route destinations are discoverable.

At 150% root text size, the homepages and relevant roster/player/matchup/league destinations had no horizontal overflow, and home document heights grew. The structure stage matched the normal homepage height exactly for all six desktop/persona combinations. Across the checks: zero page errors, failed requests, remote requests, broken images or horizontal overflow.

I visually inspected full-page Reaves at 1440, NeuralNets at 1120 and Guest at 1440. `local-reaves.png`, `local-neural.png` and `local-guest.png` are author inspection artifacts, not delivery captures. Root owns final delivery captures. No production, mobile-device, real-account, live-service or external-site result is claimed.

Final targeted parent polish removed the purely decorative feature markers and reduced the second player story’s missing-sample wording to one short supporting status. Its owned-player/profile reading remains primary. The bounded browser suite was rerun on those final presentation files and passed all six cases. A targeted final Reaves render confirms zero decorative markers and the shortened status.

The implementation is frozen for parent review/capture. `source-sha256.txt` identifies the exact three presentation files. No remaining blocker.
