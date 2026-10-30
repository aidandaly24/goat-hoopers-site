# Concept 10 — Roster composition

Selected architecture checkpoint, 30 October 2026. Same author; own directory only. This replaces the replay-led sequence. Plan only: no presentation source yet.

## Concrete composition

A complete personal sports homepage centered on the manager's owned players, organized by basketball position and current modeled quotes. The manager can see where the known quote is concentrated, recognize the players, and inspect a position or player. This is fantasy analysis in modeled FAAB units, never cash, real assets, roster strength or a buy/sell instruction.

Use a horizontal GOAT masthead and an overview-and-inspection layout. The left two-thirds of the main workspace shows five position groups: PG, SG, SF, PF, C. The right third provides compact team identity, record/standings position, current opponent/score, and saved-model context. There is no navigation rail or sequence of full-width player/game/value bands.

Above the five groups, one modest allocation ribbon encodes the position shares of the **known modeled quote subtotal**, with labels repeated as text. Each group shows its named position, priced/roster count, group subtotal, two named quoted holdings and an Inspect position action. An explicit unscaled line names unpriced players in that group. No unknown value is drawn as zero, and no segment claims a share of an unknown complete total.

Select a position to expand its full holdings inspector immediately below the overview, in normal flow. The overview and sports context stay visible. Every player in that position has a name, position, modeled quote or Unpriced, and an Inspect player action. Player inspection connects quote context with supplied completed-week evidence; evidence is detail, not the opening list. No full-roster table or search/filter application dominates home.

The supporting public league area is a compact lower two-column grid: all five current pairings and the ten-team competition/directory. It is followed by complete grouped navigation and a semantic footer. At 1120px the main workspace can become one column; nothing depends on a fixed-height panel or internal scroll reader.

Alternative considered: a position-sorted holdings directory with every roster row open. Declined because it recreates an administrative table spine. The selected allocation overview provides a readable ownership picture and a useful drill-down without requiring every row on home.

## Member differences and first actions

**Reaves Dropper:** aidandaly20, 2–0, standings position 1 of 10. First action: Inspect your centers. Its center group contains 341.00 modeled FAAB, 5 of 5 priced, 31.1% of its complete known quote. Joel Embiid 137.50 and Alperen Şengün 108.25 are visible named holdings; opening the position reveals Myles Turner, Donovan Clingan and Derik Queen as well. Do not infer lineup roles or recommend a trade from position concentration.

Complete position breakdown, derived from fixture rows:

| Position | Priced / roster | Modeled subtotal | Share of known subtotal |
| --- | --- | --- | --- |
| PG | 7 / 7 | 212.25 | 19.4% |
| SG | 4 / 4 | 249.00 | 22.7% |
| SF | 4 / 4 | 162.75 | 14.9% |
| PF | 4 / 4 | 130.25 | 11.9% |
| C | 5 / 5 | 341.00 | 31.1% |

Supporting aggregate: 1,095.25 modeled FAAB, all 24 players priced, checked 30 October 2026 at 08:10 UTC. Never a balance. Current sports context: 184.5 against Ware the Hoes At?'s 171.0, synthetic in progress. Saved context is 56% / 44%, generated 26 October, confidence 0.35 shown separately, Synthetic saved model estimate; not calibrated odds.

**NeuralNets:** 0–2, standings position 10 of 10. First action: Explore your forwards. The PF group visibly names Giannis Antetokounmpo 135.50 and Lauri Markkanen 109.25; three priced and three unpriced are distinct. The task explores owned players, not missing-price repair. Full PF inspection includes Matas Buzelis and the explicitly unpriced Rasheer Fleming, Dailyn Swain and AJ Dybantsa.

| Position | Priced / roster | Known modeled subtotal | Share of known subtotal only |
| --- | --- | --- | --- |
| PG | 1 / 4 | 77.75 | 4.8% |
| SG | 3 / 3 | 270.00 | 16.6% |
| SF | 4 / 4 | 400.25 | 24.7% |
| PF | 3 / 6 | 312.00 | 19.2% |
| C | 5 / 5 | 562.00 | 34.6% |

Supporting aggregate: 1,622.00 **known-value subtotal**, 16 of 22 priced, checked 08:10 UTC. The allocation represents those sixteen quotes only; the missing six have no numeric allocation. PG's unpriced line names Ryan Nembhard, Keaton Wagler and Darryn Peterson. The chart and names never imply that PF/PG's total contribution is fully measured. Current sports context: Neural score Not returned; papichooter 0.0 · recorded. No leader or tie. No saved model supplied.

Percentage labels may round; the underlying segments use integer-cent totals, not rounded percentage widths. Position categories come from supplied fixture labels, not a claimed legal lineup or NBA affiliation.

## Guest and complete website access

Guest sees a useful public home with the same horizontal header, five open public game summaries in the main overview, and a league guide in the supporting column: season/week, ten teams, six playoff places beginning Week 20. Local game/team inspection remains available. The complete competition list and route directory follow. No private composition, personal model, assumed team or member update feed is shown. Sign in on GOAT is a real-site exit, never a simulated local login.

Header anchors: Home (current), Roster composition for members / This week for guest, League, Around GOAT. Utility row: fixed as-of, Synthetic demo, labeled Demo persona select, account exit. Support reaves, neural and guest query values; default Reaves and set document.documentElement.dataset.persona. The selector is synthetic UI state, not production authorization.

The ten-team competition list doubles as the directory, showing position, team/manager, W–L and points for, with local team context and a separate real-site profile exit. Preserve fixture order. Neural history explicitly says 2025 · previous manager and Under the previous manager as QBs Gremlins.

Lower grouped navigation retains every destination on https://goathoopers.com, visibly labeled on GOAT / leaving the prototype:

- Read: Home /, News /news, History /history, Weekly archive /weekly.
- Investigate: Stocks /stocks, Intel /intel, AI Decides /ai-decides, Trade Analyzer /trade-analyzer.
- League: Teams /teams, Transactions /transactions, Draft /draft, The Table /table.
- Play: Arcade /arcade, optionally with the small approved free-throw preview.
- Account: My Team /team, Sign in /login.
- Public /teams/:id and /player/:id exits live beside corresponding local contexts.

Footer provides fixed fixture as-of, always-readable synthetic scope/source explanation, account exits, all grouped destinations and Back to top. The visible Synthetic demo label links to that explanation. No fabricated news, notification, game, lineup, trade or login submission.

## Local inspection and evidence

Position inspection opens in flow and focuses a named heading. Player inspection reveals the exact quote or Unpriced, calculation time, modeled-unit explanation, coverage, and supplied counted-week points/period when present. Completed evidence is Synthetic completed Week 2 · 19–25 Oct 2026: five of 24 Reaves players and three of 22 Neural players have evidence. Missing evidence is unknown, never zero, DNP, injury or poor performance. No invented factor breakdown, schedule or game log.

Use meaningful local hashes for position/player/matchup inspection and coherent browser Back/Forward. Close, Escape and Back to positions return focus to the exact invoking control. Matchup detail preserves score-null versus recorded-zero and labels the dated model separately. Team context uses a native disclosure. Keep the overview and other homepage content readable.

## Visual system

Reading Arial, 17px/1.55, mixed case and around 60-character prose measure. Controls existing Space Grotesk variable, 15px/1.4, weight 500–600. Data existing Space Mono regular, 15px/1.35, with units/state words adjacent; aggregate modeled values stay at ordinary supporting scale. Barlow Condensed regular headings, about 36px h1 and 26px section headings. Long names wrap; text is never shrunk to fit.

A pale cool surface, charcoal ink and position-specific muted hues make the allocation readable; text labels ensure color is not the only key. Use the exact GOAT SVG. Small approved portraits identify visible holdings where supplied; labeled initials otherwise. No arena, hero cutout, two-player comparison or metaphorical financial imagery. Existing licensed fonts/assets only; retain OFL notices.

44px targets, visible focus, skip link, landmarks and one h1. The allocation has a complete readable text equivalent. No animated numbers or segment growth; keyboard work is immediate. At 200% text the workspace stacks and names remain whole. Main and lower content stays in normal flow.

## Retained primary reads and boundary

Retain the verified product/fixture/AGENTS/ARCHITECTURE/DESIGN/font reads documented earlier. Production membership is server-resolved and request-private; no auth behavior is copied from demo selection.

Assigned references were read partially, without installation: [Emil Kowalski's Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), core philosophy, animation decision framework and responsive/interruptible component principles; applied as immediate inspection, no chart entrance, stable adjacent context. [Addy Osmani's Accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility), native keyboard controls, contrast/non-color cues, focus, labels, skip links, targets, reduced motion and testing; applied as text allocation equivalents, explicit missing states and Back/focus behavior. No peer or source index supplied this composition.

Both aggregate subtotals and the new position sums were reconciled read-only against fixture rows. No recorded history or league value rank exists; none will be drawn. No live service, dependencies, git, shared/production change or publication. On build followup write only 10/, import only data from ../fixture.js, preserve stage=structure geometry/content, set readiness after fonts/content settle, and record actual checks in NOTES.md. Root owns captures. No browser or rendered pass is claimed at this checkpoint.
