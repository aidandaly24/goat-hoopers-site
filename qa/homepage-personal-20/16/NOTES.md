# 16 — personal club mosaic

Source-ready and frozen for root capture. Only this author's directory was written. No peer implementation, shared presentation helper, production source, fixture, dependency, git, publication or deployment change.

## Entry points and capture readiness

- `http://127.0.0.1:4207/qa/homepage-personal-20/16/index.html?persona=reaves`
- Same path with `?persona=neural` or `?persona=guest`.
- Append `&stage=structure` for neutral treatment with the same content and geometry.
- Readiness selector: `html[data-personal-study-ready="16"]`. Persona selector: `html[data-persona="reaves"]`, `neural`, or `guest`.
- Local render files: `index.html`, `style.css`, `app.js`. Data-only import: `../fixture.js`.

The accepted unequal 8:4 first row and 5:7 second row are preserved at both requested desktop widths. Own club uses a lavender field, the visit choices a red top rule, the opponent an open white field, and the adjacent/kept club a pale field. They are finite manager-led panels, not continuous companion columns. Added clubs append normal-flow panels; their labels do not pretend they are adjacent in the standings.

The own-club first fold includes identity, current record/rank, matchup, Joel Embiid's supplied 38-point sample or Giannis Antetokounmpo's 45-point sample, evidence coverage, and club/roster/player actions. The opponent panel supplies manager, current season quantities and qualified previous-season context, without duplicating the own panel's exact matchup scores. Guest starts from a useful league overview and the explicitly historical 2025 finalists' present club context. No private member roster appears in guest.

## Product truth and choices

Reaves' complete 24-player quote is $1,095.25 modeled FAAB. NeuralNets retains a $1,622.00 **priced subtotal**, 16/22 coverage, six Unpriced rows and missing own score beside papichooter's recorded zero. Saved Reaves AI remains explicitly synthetic, with both 56/44 probabilities, separate 35% confidence and generation date in the own-club disclosure. No AI is invented for NeuralNets or guest. NeuralNets' 2025 history identifies the previous manager as QBs Gremlins.

The fixed starting club stays visible. Optional choices last in memory while this page remains open, and are labelled accordingly; they are not friends, account follows or subscriptions. Remove, Clear, and Add actually alter the local mosaic. No login, save, trade, notification, live data, market, AI generation, history series or Lineup Power is simulated. Every external link visibly says GOAT site; all 15 fixture destinations appear in the semantic footer.

## Typography, assets and reference application

Lora 400 supplies reading paragraphs at 16–17px with 1.55 line height. Arial supplies commands, long names and tabular detail data. Archivo Black supplies only short key scores/records. It has equal default numeral advances, checked with installed FontTools. The initially considered Oswald has proportional default digits and was not used. No Barlow command/Lora-number combination.

Fonts reuse existing local licensed files. Original notices remain at `qa/homepage-structures/assets/fonts/lora/OFL.txt` and `qa/homepage-structures/assets/fonts/archivoblack/OFL.txt`. No font download or installation. Assets are the exact approved GOAT logo, one approved owned-player portrait in each member state and the small existing free-throw preview. No manager portraits or fabricated avatars.

Actual product reads: `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, `src/ui/siteDestinations.ts`; complete data fixture, product inventory, author/assigned brief, AGENTS, ARCHITECTURE and relevant repository design/access guidance. These established that demo persona is not real membership, public access must survive gaps, prices and points have different meanings, and unsupplied details must remain unavailable.

- [Emil Kowalski — primary Design Engineering reference](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), also read from its [raw primary file](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md): partial read of Core Philosophy, Animation Decision Framework, button/popover parts of Component Building Principles, Accessibility, Sonner/cohesion and Review Checklist. Applied frequent-action immediacy: no animated score, scroll reveal, inspection travel or delayed selection. Cohesion informed one predictable inspection/choice language across unequal panels. It did not supply the architecture or visual direction.
- [Addy Osmani — accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility): substantive rendered skill guidance read in full, including evidence workflow, Perceivable, Operable, Understandable, Robust and testing/impact priorities. Concrete applications are native labelled selects and buttons, separate Inspect/Remove controls, a named native dialog, Back/Escape/Close restoration, a skip link, semantic headings, intrinsic wrapping and specific evidence reporting. Project guidance supplies 44px targets and correct contrast text-size units. Neither reference was installed or executed; index/related links are not claimed as reads.

## Actual bounded verification

Final command: `node qa/homepage-personal-20/16/verify.cjs`, using the existing Playwright package and `/usr/bin/chromium` against the root's existing server. Final result: all assertions passed; zero page errors or failed content requests. `node --check qa/homepage-personal-20/16/app.js` also passed.

| Check | Actual result |
| --- | --- |
| Reaves, NeuralNets and guest at 1440×1000 and 1120×1000 | Six renders passed; ready/persona datasets correct; 8:4 and 5:7 computed grid spans; no page overflow |
| Task 1: own club → roster quotes → Joel Embiid | 24 rows present; player opens; browser Back returns roster and Forward reopens player; Back to roster and Close work; focus returns to own-club trigger |
| Task 2: Remove adjacent default → choose/add The Fun Guys | Panel removed then added; added club labelled Kept in view, not falsely adjacent; removal focuses select, addition focuses new club inspection |
| Task 3: public club and source explanation | Public inspection Escape and source Close both restore their initiating control |
| NeuralNets detail | Not returned / 0 visible; 22 roster rows, exactly six Unpriced; $1,622 subtotal; missing player evidence explicitly does not establish zero |
| Guest | No owned member panel or private roster action; qualified finalist defaults; all 15 external destination paths present |
| Structure mode | Neutral dataset plus complete club content and geometry present |
| Enlarged text | At 1120px, doubled every element's computed text size from a pre-change snapshot; intrinsic growth, no page overflow. This is a 200% text-size stress check, not a claim of browser-toolbar zoom or a physical device test |

Manual visual inspection used temporary local screenshots of Reaves at 1440, NeuralNets at 1120, guest at 1440, and doubled-text Reaves at 1120. Final Reaves was re-inspected after the last source change. These were local checks; root owns final captures/packages.

Representative calculated contrast pairs: main text on lavender 13.05:1; muted on lavender 5.05:1; purple on lavender 8.61:1; white on primary action 10.51:1; muted footer text 5.07:1; muted on pale club 5.30:1. This is representative color evidence, not a complete accessibility audit. No screen-reader, physical-device, live/auth, production routing or external-site behavior test is claimed.

### Stable selectors for root

- `[data-testid="inspect-own"]`, `[data-testid="dialog-roster"]`, `[data-testid="roster-player-1511"]`, `[data-testid="back-to-roster"]`, `[data-testid="close-inspector"]`.
- `[data-testid="visit-remove-3"]`, `[data-testid="team-choice"]`, `[data-testid="add-club"]`, `[data-testid="club-4"]`, `[data-testid="inspect-team-4"]`.
- `[data-testid="open-source"]`, `#inspector`, `#inspect-title`.
- Neural: `[data-testid="own-score"]`, `[data-testid="open-roster"]`, `[data-testid="roster-player-4866"]`, `.data-table td.unpriced`.

## Frozen render hashes

SHA-256 after final render-source checks:

```text
e19de5d0146a23e5fd6d9171e6cd76e61b2ddf65f77f758305fa7f900b8548ce  index.html
0fba0c4f4ae6ee41b2feb2b6904b4d939aa205b6c9320f4088caf391dcda721d  style.css
83b674e5a382996365fa0a60ff8e6da1d570104e99508c412a332edee21032c0  app.js
```

No remaining blocker. Source is frozen for root capture and review.
